import {
  BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute,
  Group, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, Ray, Vector3,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshBVH } from 'three-mesh-bvh'
import { isCortex, isLeft, isRight } from './modelTypes'
import type { BrainLayers, BrainModelData } from './modelTypes'

type Point = [number, number, number]
type Route = { points: Point[]; radius: number; vein?: boolean }

// Art-directed surface routes in surface-RAS, NOT a vessel segmentation or an
// angiographic atlas. A separate legend makes this limitation visible to users.
const routes: Route[] = [
  { points: [[35, 28, -18], [54, 15, -5], [63, -9, 8], [60, -38, 21], [43, -69, 29]], radius: 0.76 },
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

function tube(points: Vector3[], radius: number, endRadius: number) {
  const vertices: number[] = [], indices: number[] = []
  const sides = 8
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

export function createCorticalVessels(model: BrainModelData) {
  const root = new Group()
  root.name = 'Illustrative cortical vessels'
  const materials = [
    new MeshPhysicalMaterial({ color: '#973b3e', roughness: 0.4, clearcoat: 0.32, clearcoatRoughness: 0.3, metalness: 0, ior: 1.38, envMapIntensity: 0.5 }),
    new MeshPhysicalMaterial({ color: '#54536e', roughness: 0.45, clearcoat: 0.25, clearcoatRoughness: 0.34, metalness: 0, ior: 1.38, envMapIntensity: 0.5 }),
  ]
  for (const sign of [-1, 1]) {
    const parcels = model.meshes.filter(m => isCortex(m) && m.atlas === 'anatomy' && (sign < 0 ? isLeft(m.hemisphere) : isRight(m.hemisphere)))
    if (!parcels.length) continue
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(parcels[0].positions, 3))
    geometry.setIndex(parcels.flatMap(m => m.indices))
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
    routes.forEach((route, routeIndex) => {
      const mirrored = route.points.map(([x, y, z]) => new Vector3(sign * x, y, z))
      const curve = new CatmullRomCurve3(mirrored)
      const samples = Math.max(50, Math.ceil(curve.getLength() * 2))
      const surfacePoints = smoothSurface(curve.getPoints(samples).map((p, i) => project(p, route.radius * (1 - i / samples * 0.75))), center)
      const bucket = buckets[route.vein ? 1 : 0]
      bucket.push(tube(surfacePoints, route.radius, route.radius * 0.22))
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
        const points = smoothSurface(branchCurve.getPoints(48).map((p, i) => project(p, radius * (1 - i / 48 * 0.82))), center)
        points[0].copy(surfacePoints[index])
        bucket.push(tube(points, radius, 0.045))
        if (!route.vein) {
          const twigStart = branchCurve.getPoint(0.55)
          const twigEnd = twigStart.clone().addScaledVector(tangent, reach * 0.45).addScaledVector(lateral, -reach * 0.28)
          const twig = new CatmullRomCurve3([twigStart, twigStart.clone().lerp(twigEnd, 0.5).addScaledVector(out, 1), twigEnd])
          const twigPoints = smoothSurface(twig.getPoints(24).map(p => project(p, radius * 0.38)), center)
          twigPoints[0].copy(points[26])
          bucket.push(tube(twigPoints, radius * 0.45, 0.035))
        }
      }
    })
    buckets.forEach((geometries, type) => {
      const merged = mergeGeometries(geometries)
      geometries.forEach(g => g.dispose())
      if (!merged) return
      const mesh = new Mesh(merged, materials[type])
      mesh.userData.hemisphere = sign < 0 ? 'left' : 'right'
      mesh.name = `${mesh.userData.hemisphere} ${type ? 'veins' : 'arteries'} (illustration)`
      mesh.castShadow = true
      mesh.receiveShadow = true
      root.add(mesh)
    })
    geometry.dispose()
  }
  return {
    root,
    update(layers: BrainLayers) {
      root.visible = !!layers.vessels && !layers.interior && !layers.isolate
      root.children.forEach(child => {
        const side = child.userData.hemisphere
        child.visible = layers.hemisphere === 'both' || side === layers.hemisphere
        child.position.x = (side === 'left' ? -1 : 1) * layers.separation
      })
    },
    dispose() {
      root.children.forEach(child => (child as Mesh<BufferGeometry, MeshBasicMaterial>).geometry.dispose())
      materials.forEach(material => material.dispose())
      root.removeFromParent()
    },
  }
}
