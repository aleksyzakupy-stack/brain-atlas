import {
  BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute,
  Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Ray, Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshBVH } from 'three-mesh-bvh'
import { isCortex, isLeft, isRight } from './modelTypes'
import type { BrainLayers, BrainModelData } from './modelTypes'
import { majorVascularRoutes } from './cerebralVascularRoutes'

type Point = [number, number, number]
type Route = { points: Point[]; radius: number; vein?: boolean }
export type VesselCenterline = { name: string; hemisphere: string; type: 'arteries' | 'veins'; scope: string; points: number[][]; radius: number; endRadius: number }

// Art-directed surface routes in surface-RAS, NOT a vessel segmentation or an
// angiographic atlas. A separate legend makes this limitation visible to users.
const routes: Route[] = [
  { points: [[35, 2, -12], [51, -1, -1], [62, -19, 11], [57, -45, 27], [42, -67, 40]], radius: 0.95 },
  { points: [[53, 15, -5], [58, 26, 16], [45, 35, 39], [29, 29, 57]], radius: 0.53 },
  { points: [[61, -6, 7], [58, -2, 29], [43, -8, 53], [24, -18, 67]], radius: 0.56 },
  { points: [[62, -27, 16], [55, -34, 41], [37, -43, 60], [22, -54, 62]], radius: 0.46 },
  { points: [[59, -14, 9], [65, -22, -8], [59, -44, -19], [46, -66, -11]], radius: 0.46 },
  { points: [[11, 47, 8], [12, 37, 40], [14, 6, 64], [14, -30, 69], [17, -64, 47]], radius: 0.51 },
  { points: [[33, -52, -20], [39, -78, -5], [27, -91, 16], [14, -81, 37]], radius: 0.48 },
  { points: [[25, 29, 56], [38, 8, 54], [57, -13, 35], [66, -29, 12], [55, -50, -9]], radius: 0.59, vein: true },
  { points: [[22, -58, 59], [36, -68, 42], [53, -66, 15], [56, -45, -8]], radius: 0.48, vein: true },
  { points: [[24, 49, 22], [42, 39, 8], [53, 15, -15]], radius: 0.4, vein: true },
]

/** Build tapered tubes as one draw call per vessel type and hemisphere. */
function smoothSurface(points: Vector3[], center: Vector3) {
  const directions = points.map(p => p.clone().sub(center).normalize())
  const radii = points.map(p => p.distanceTo(center))
  // A smooth pial envelope bridges narrow sulci instead of dropping abruptly
  // into a fold and coming back out. Never move the line below the source hit.
  const envelope = radii.map((radius, i) => {
    let result = radius
    for (let j = Math.max(0, i - 10); j <= Math.min(points.length - 1, i + 10); j++) {
      const arc = directions[i].distanceTo(directions[j]) * radius
      result = Math.max(result, radii[j] - 0.22 * arc - 0.055 * arc * arc)
    }
    return result
  })
  return points.map((_, i) => {
    let radius = 0, weight = 0
    for (let j = Math.max(0, i - 3); j <= Math.min(points.length - 1, i + 3); j++) {
      const w = 4 - Math.abs(j - i)
      radius += envelope[j] * w
      weight += w
    }
    return center.clone().addScaledVector(directions[i], Math.max(radii[i], radius / weight))
  })
}

function tube(points: Vector3[], radius: number, endRadius: number, sides = 8) {
  const vertices: number[] = [], indices: number[] = []
  const tangent = new Vector3(), radial = new Vector3(), binormal = new Vector3()
  let previousRadial = new Vector3(0, 0, 1)
  points.forEach((point, i) => {
    tangent.subVectors(points[Math.min(i + 1, points.length - 1)], points[Math.max(0, i - 1)]).normalize()
    radial.copy(previousRadial).addScaledVector(tangent, -previousRadial.dot(tangent)).normalize()
    if (radial.lengthSq() < 0.01) radial.crossVectors(tangent, new Vector3(0, 1, 0)).normalize()
    binormal.crossVectors(tangent, radial).normalize()
    previousRadial = radial.clone()
    const r = radius + (endRadius - radius) * (i / (points.length - 1)) ** 0.8
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2
      const vertex = point.clone().addScaledVector(radial, Math.cos(angle) * r).addScaledVector(binormal, Math.sin(angle) * r)
      vertices.push(vertex.x, vertex.y, vertex.z)
      if (i < points.length - 1 && j < sides) {
        const a = i * (sides + 1) + j, b = a + sides + 1
        indices.push(a, a + 1, b, b, a + 1, b + 1)
      }
    }
  })
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createCorticalVessels(model: BrainModelData, onCenterline?: (line: VesselCenterline) => void) {
  const detailed = model.quality === 'high' || Object.values(model.surfaces ?? {}).some(surface => surface.positions.length > 300000)
  const branchSegments = detailed ? 32 : 20
  const twigSegments = detailed ? 18 : 12
  const microSegments = detailed ? 10 : 6
  const root = new Group()
  root.name = 'Cerebral arteries and veins · teaching reconstruction'
  const materials = [
    new MeshPhysicalMaterial({ color: '#8e3035', roughness: 0.42, clearcoat: 0.22, clearcoatRoughness: 0.34, metalness: 0, ior: 1.38, envMapIntensity: 0.4 }),
    new MeshPhysicalMaterial({ color: '#394f7c', roughness: 0.48, clearcoat: 0.18, clearcoatRoughness: 0.38, metalness: 0, ior: 1.38, envMapIntensity: 0.4 }),
  ]
  const microMaterials = materials.map(material => { const copy = material.clone(); copy.transparent = true; copy.depthWrite = false; return copy })
  let currentLayers: BrainLayers = { interior: false, hemisphere: 'both', separation: 0 }
  let microOpacity = .6
  const centerline = (name: string, hemisphere: string, type: number, scope: string, points: Vector3[], radius: number, endRadius: number) => {
    onCenterline?.({ name, hemisphere, type: type ? 'veins' : 'arteries', scope, points: points.map(p => p.toArray()), radius, endRadius })
    return tube(points, radius, endRadius, scope === 'micro' ? 5 : 8)
  }
  const addBucket = (geometries: BufferGeometry[], hemisphere: string, type: number, scope: string) => {
    if (!geometries.length) return
    const merged = mergeGeometries(geometries)
    geometries.forEach(g => g.dispose())
    if (!merged) return
    const mesh = new Mesh(merged, scope === 'micro' ? microMaterials[type] : materials[type])
    mesh.userData = { hemisphere, vesselType: type ? 'veins' : 'arteries', scope }
    mesh.name = `${hemisphere} ${mesh.userData.vesselType} · ${scope}`
    mesh.castShadow = scope !== 'micro'
    mesh.receiveShadow = true
    root.add(mesh)
  }
  for (const sign of [-1, 1]) {
    const parcels = model.meshes.filter(m => isCortex(m) && m.atlas === 'anatomy' && (sign < 0 ? isLeft(m.hemisphere) : isRight(m.hemisphere)))
    if (!parcels.length) continue
    const geometry = new BufferGeometry()
    // Blender exports compact parcel buffers; legacy JSON shares one hemisphere.
    const shared = parcels.every(parcel => parcel.positions === parcels[0].positions)
    const positions = shared ? parcels[0].positions : parcels.flatMap(parcel => parcel.positions)
    let offset = 0
    const indices = parcels.flatMap(parcel => {
      const result = shared ? parcel.indices : parcel.indices.map(index => index + offset)
      offset += parcel.positions.length / 3
      return result
    })
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setIndex(indices)
    const bvh = new MeshBVH(geometry, { targetLeafSize: 12 })
    const center = new Vector3(sign * 30, -20, 15)
    const ray = new Ray()
    const project = (p: Vector3, radius: number) => {
      const outward = p.clone().sub(center).normalize()
      ray.set(center.clone().addScaledVector(outward, 240), outward.clone().negate())
      const hit = bvh.raycastFirst(ray, DoubleSide)
      // Offset is smaller than the radius: vessels sit in the pia, not floating.
      return hit ? hit.point.addScaledVector(outward, radius * 0.95 + 0.18) : p
    }
    const buckets: BufferGeometry[][] = [[], []]
    const microBuckets: BufferGeometry[][] = [[], []]
    const hemisphere = sign < 0 ? 'left' : 'right'
    const surfaceRoots = new Map<number, Vector3>()
    let middleCerebralTrunk: Vector3[] = []
    routes.forEach((route, routeIndex) => {
      const mirrored = route.points.map(([x, y, z]) => new Vector3(sign * x, y, z))
      const curve = new CatmullRomCurve3(mirrored)
      const samples = Math.max(32, Math.ceil(curve.getLength() * (detailed ? 1.4 : 1)))
      const surfacePoints = smoothSurface(curve.getPoints(samples).map((p, i) => project(p, route.radius * (1 - i / samples * 0.75))), center)
      const bucket = buckets[route.vein ? 1 : 0]
      const type = route.vein ? 1 : 0
      surfaceRoots.set(routeIndex, surfacePoints[0])
      bucket.push(centerline(`Surface ${routeIndex + 1}`, hemisphere, type, 'surface', surfacePoints, route.radius, route.radius * 0.22))
      if (routeIndex === 0) middleCerebralTrunk = surfacePoints
      else if (routeIndex < 5) {
        // Secondary MCA trunks share the principal tree instead of beginning
        // as disconnected decorative strokes on the convexity.
        const destination = surfacePoints[0]
        const origin = middleCerebralTrunk.reduce((nearest, point) => point.distanceToSquared(destination) < nearest.distanceToSquared(destination) ? point : nearest)
        const bridge = new CatmullRomCurve3([origin, origin.clone().lerp(destination, .5), destination])
        const join = smoothSurface(bridge.getPoints(16).map(p => project(p, route.radius)), center)
        join[0].copy(origin); join[join.length - 1].copy(destination)
        bucket.push(centerline(`MCA surface junction ${routeIndex}`, hemisphere, type, 'surface', join, route.radius, route.radius))
      }
      // Branches start on their parent tube and thin towards their extremities.
      for (let branch = 0; branch < 5; branch++) {
        const t = 0.22 + branch * 0.145
        const index = Math.round(t * samples)
        const start = curve.getPoint(index / samples)
        const tangent = curve.getTangent(t)
        const out = start.clone().sub(center).normalize()
        const lateral = new Vector3().crossVectors(tangent, out).normalize().multiplyScalar(branch % 2 ? -1 : 1)
        const reach = 11 + ((routeIndex * 7 + branch * 11) % 14)
        const bend = start.clone().addScaledVector(tangent, reach * 0.35).addScaledVector(lateral, reach * 0.55)
        const end = start.clone().addScaledVector(tangent, reach * 0.65).addScaledVector(lateral, reach)
        const branchCurve = new CatmullRomCurve3([start, bend, end])
        const radius = route.radius * (1 - t * 0.65) * 0.53
        const points = smoothSurface(branchCurve.getPoints(branchSegments).map((p, i) => project(p, radius * (1 - i / branchSegments * 0.82))), center)
        points[0].copy(surfacePoints[index])
        bucket.push(centerline(`Surface ${routeIndex + 1} · branch ${branch + 1}`, hemisphere, type, 'surface', points, radius, 0.045))
        // Small pial vessels follow the same measured surface. Diameters are
        // deliberately enhanced for legibility; this is not capillary imaging.
        for (let twigIndex = 0; twigIndex < 4; twigIndex++) {
          const tMicro = .38 + twigIndex * .15
          const startIndex = Math.round(tMicro * branchSegments)
          const microStart = branchCurve.getPoint(tMicro)
          const microLateral = lateral.clone().multiplyScalar(twigIndex % 2 ? 1 : -1)
          const microEnd = microStart.clone().addScaledVector(tangent, 2.5 + twigIndex).addScaledVector(microLateral, 4 + (routeIndex % 3))
          const microCurve = new CatmullRomCurve3([microStart, microStart.clone().lerp(microEnd, .45).addScaledVector(tangent, 1.2), microEnd])
          const microPoints = smoothSurface(microCurve.getPoints(microSegments).map(p => project(p, .08)), center)
          microPoints[0].copy(points[startIndex])
          microBuckets[type].push(centerline(`Fine ${routeIndex + 1}.${branch + 1}.${twigIndex + 1}`, hemisphere, type, 'micro', microPoints, .12, .025))
        }
        if (!route.vein) {
          const twigStart = branchCurve.getPoint(0.55)
          const twigEnd = twigStart.clone().addScaledVector(tangent, reach * 0.45).addScaledVector(lateral, -reach * 0.28)
          const twig = new CatmullRomCurve3([twigStart, twigStart.clone().lerp(twigEnd, 0.5).addScaledVector(out, 1), twigEnd])
          const twigPoints = smoothSurface(twig.getPoints(twigSegments).map(p => project(p, radius * 0.38)), center)
          twigPoints[0].copy(points[Math.round(.55 * branchSegments)])
          bucket.push(centerline(`Surface ${routeIndex + 1} · twig ${branch + 1}`, hemisphere, type, 'surface', twigPoints, radius * 0.45, 0.035))
        }
      }
    })
    buckets.forEach((items, type) => addBucket(items, hemisphere, type, 'surface'))
    microBuckets.forEach((items, type) => addBucket(items, hemisphere, type, 'micro'))
    // Connect the principal distal surface trunks to the basal circulation.
    const feeders: [number, Point, Point][] = [
      [0, [35, 2, -12], [40, 2, -9]],
      [5, [3, 11, -14], [4, 35, 2]],
      [6, [33, -52, -20], [35, -62, -17]],
    ]
    const links = feeders.map(([route, start, bend]) => {
      const points = new CatmullRomCurve3([new Vector3(sign * start[0], start[1], start[2]), new Vector3(sign * bend[0], bend[1], bend[2]), surfaceRoots.get(route)!]).getPoints(24)
      return centerline(`Cortical feeder ${route}`, hemisphere, 0, 'major', points, routes[route].radius * 1.1, routes[route].radius)
    })
    const major = majorVascularRoutes().filter(route => route.hemisphere === hemisphere)
    const venousLinks: [number, Point][] = [[7, [0, 17, 73]], [8, [0, -71, 57]], [9, [0, 48, 42]]]
    const drains = venousLinks.map(([route, endpoint]) => {
      const start = surfaceRoots.get(route)!, end = new Vector3(...endpoint)
      const middle = start.clone().lerp(end, .5).add(new Vector3(0, 0, 2))
      const points = new CatmullRomCurve3([start, middle, end]).getPoints(24)
      return centerline(`Żyła mostkowa ${route}`, hemisphere, 1, 'major', points, routes[route].radius, routes[route].radius * 1.15)
    })
    const majorBuckets = [links, drains]
    major.forEach(route => {
      const points = new CatmullRomCurve3(route.points.map(p => new Vector3(...p))).getPoints(Math.max(16, route.points.length * 10))
      majorBuckets[route.vein ? 1 : 0].push(centerline(route.name, hemisphere, route.vein ? 1 : 0, 'major', points, route.radius, route.endRadius))
    })
    majorBuckets.forEach((items, type) => addBucket(items, hemisphere, type, 'major'))
    geometry.dispose()
  }
  const midlineBuckets: BufferGeometry[][] = [[], []]
  majorVascularRoutes().filter(route => route.hemisphere === 'midline').forEach(route => {
    const points = new CatmullRomCurve3(route.points.map(p => new Vector3(...p))).getPoints(route.points.length * 14)
    midlineBuckets[route.vein ? 1 : 0].push(centerline(route.name, 'midline', route.vein ? 1 : 0, 'major', points, route.radius, route.endRadius))
  })
  midlineBuckets.forEach((items, type) => addBucket(items, 'midline', type, 'major'))
  const updateVisibility = () => {
    const layers = currentLayers
    root.visible = !!layers.vessels && !layers.isolate
    root.children.forEach(child => {
      const { hemisphere: side, vesselType, scope } = child.userData
      child.visible = (layers.hemisphere === 'both' || side === layers.hemisphere || side === 'midline') &&
        (!layers.vesselType || layers.vesselType === 'both' || vesselType === layers.vesselType) &&
        (scope !== 'major' || layers.separation === 0) &&
        (scope !== 'micro' || layers.microvessels !== false && microOpacity > .05)
      child.position.x = side === 'midline' ? 0 : (side === 'left' ? -1 : 1) * layers.separation
    })
  }
  return {
    root,
    update(layers: BrainLayers) {
      currentLayers = layers
      updateVisibility()
    },
    detail(distance: number) {
      microOpacity = Math.max(0, Math.min(.85, (480 - distance) / 220))
      microMaterials.forEach(material => { material.opacity = microOpacity })
      updateVisibility()
    },
    dispose() {
      root.children.forEach(child => (child as Mesh<BufferGeometry, MeshBasicMaterial>).geometry.dispose())
      materials.forEach(material => material.dispose())
      microMaterials.forEach(material => material.dispose())
      root.removeFromParent()
    },
  }
}
