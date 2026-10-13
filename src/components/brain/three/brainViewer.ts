import {
  ACESFilmicToneMapping, AmbientLight, Box3, BufferGeometry, Color, DirectionalLight, PCFShadowMap, PMREMGenerator, SRGBColorSpace,
  TOUCH, Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshPhysicalMaterial,
  PerspectiveCamera, Raycaster, Scene, Spherical, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { acceleratedRaycast, MeshBVH } from 'three-mesh-bvh'
import { createTissueMaterial, loadTissueTexture, setTissueDetail } from './tissueMaterial'
import { createCorticalVessels } from './corticalVessels'
import { createBrainLighting } from './brainLighting'
import { createConnectionOverlay } from './connectionOverlay'
import { connectedStructureIds } from '../../../data/structureConnections'
import type { StructureConnectionFocus } from '../../../data/structureConnections'
import { createCircuitOverlay } from './circuitOverlay'
import { bindingsForCircuit, spatialAnchors, spatialGroups } from '../../../data/pathwaySpatial'
import type { BrainCircuit, PathwayScenario } from '../../../types/atlas'
import { categoryById } from '../../../data/categories'
import { structureById } from '../../../data/structures'
import { atlasRegionById, regionLabel } from '../../../data/anatomicalAtlas'
import { isCortex, isLeft, isRight } from './modelTypes'
import type { BrainLayers, BrainMeshData, BrainModelData, CameraPreset, HoveredParcel } from './modelTypes'

type Options = {
  onPick: (id: string) => void
  onHover: (parcel: HoveredParcel | null) => void
  onError: (message: string) => void
  onNotice: (message: string) => void
}

export type BrainViewer = {
  connections: (focus?: StructureConnectionFocus) => void
  pathway: (playback?: PathwayPlayback) => void
  upgrade: (data: BrainModelData) => void
  select: (id: string | undefined, highlighted: string[]) => void
  layers: (layers: BrainLayers) => void
  preset: (preset: CameraPreset) => void
  zoom: (factor: number) => void
  reset: () => void
  dispose: () => void
}

export type PathwayPlayback = { circuit: BrainCircuit; playing: boolean; speed: number; scenario?: PathwayScenario; onEdgePick?: (index: number) => void; onNodePick?: (id: string) => void; activeNodeId?: string }

export function createBrainViewer(host: HTMLElement, data: BrainModelData, options: Options): BrainViewer {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = SRGBColorSpace
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.92
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.shadowMap.autoUpdate = false
  const canvas = renderer.domElement
  canvas.className = 'brain-3d-canvas'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Model mózgu 3D. Przeciągnij, aby obracać. Strzałki obracają, plus i minus zmieniają powiększenie. Home przywraca widok.')
  canvas.tabIndex = 0
  host.appendChild(canvas)
  const scene = new Scene()
  const room = new RoomEnvironment()
  const pmrem = new PMREMGenerator(renderer)
  const environment = pmrem.fromScene(room, 0.04)
  scene.environment = environment.texture
  room.dispose()
  pmrem.dispose()
  let textureAvailable = true
  const tissueTexture = loadTissueTexture(() => requestRender(), () => {
    textureAvailable = false
    parts.forEach(({ mesh }) => setTissueDetail(mesh.material, false))
    options.onNotice('Mikrotekstura niedostępna. Wyświetlono materiał podstawowy.')
    requestRender()
  }, renderer.capabilities.getMaxAnisotropy())
  const camera = new PerspectiveCamera(35, 1, 1, 2000)
  const lighting = createBrainLighting(renderer, scene, camera)
  let highQuality = Object.values(data.surfaces ?? {}).some(s => s.positions.length > 300000)
  const controls = new OrbitControls(camera, canvas)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  controls.enableDamping = !reducedMotion.matches
  controls.dampingFactor = 0.09
  controls.enablePan = true
  controls.enableRotate = true
  controls.touches.ONE = TOUCH.ROTATE
  controls.touches.TWO = TOUCH.DOLLY_PAN
  controls.rotateSpeed = 0.7
  controls.zoomSpeed = 0.8
  controls.minDistance = 110
  controls.maxDistance = 800
  controls.screenSpacePanning = true
  // Source RAS: right, anterior, superior. World: right, superior, posterior.
  const brain = new Group()
  brain.rotation.x = -Math.PI / 2
  scene.add(brain)
  scene.add(new AmbientLight('#f7e9e4', 0.16))
  scene.add(new HemisphereLight('#fff5ec', '#655a72', 0.62))
  const key = new DirectionalLight('#fff1e6', 2.45)
  key.position.set(-160, 220, -120)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.camera.left = key.shadow.camera.bottom = -145
  key.shadow.camera.right = key.shadow.camera.top = 145
  key.shadow.camera.near = 30
  key.shadow.camera.far = 620
  key.shadow.normalBias = 0.32
  key.shadow.bias = -0.00008
  key.shadow.radius = 2
  scene.add(key)
  const fill = new DirectionalLight('#d8e3ff', 0.65)
  fill.position.set(140, 40, -160)
  scene.add(fill)
  const rim = new DirectionalLight('#f6c9b8', 1.25)
  rim.position.set(40, 100, 180)
  scene.add(rim)

  const parts: { mesh: Mesh<BufferGeometry, MeshPhysicalMaterial>; data: BrainMeshData; anchor: Vector3; normal: Vector3; label: HTMLButtonElement | null }[] = []
  const labelsLayer = document.createElement('div')
  labelsLayer.className = 'atlas-labels'
  labelsLayer.setAttribute('aria-label', 'Podpisy anatomiczne')
  host.appendChild(labelsLayer)
  const leaderLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  leaderLayer.classList.add('atlas-label-leaders')
  leaderLayer.setAttribute('aria-hidden', 'true')
  labelsLayer.appendChild(leaderLayer)
  const sharedAttributes = new Map<string, { position: Float32BufferAttribute; normal: Float32BufferAttribute; color: Float32BufferAttribute }>()
  function populate(model: BrainModelData) {
  for (const item of model.meshes) {
    const geometry = new BufferGeometry()
    let attributes = item.surfaceId ? sharedAttributes.get(item.surfaceId) : undefined
    if (!attributes) {
      const relief = item.relief ?? Array(item.positions.length / 3).fill(0.35)
      attributes = { position: new Float32BufferAttribute(item.positions, 3), normal: new Float32BufferAttribute(item.normals ?? [], 3), color: new Float32BufferAttribute(relief.flatMap(value => { const shade = 1 - value * 0.58; return [shade, shade, shade] }), 3) }
      if (item.surfaceId) sharedAttributes.set(item.surfaceId, attributes)
    }
    geometry.setAttribute('position', attributes.position)
    geometry.setIndex(item.indices)
    geometry.setAttribute('color', attributes.color)
    if (item.normals?.length === item.positions.length) geometry.setAttribute('normal', attributes.normal)
    else geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    geometry.boundsTree = new MeshBVH(geometry, { targetLeafSize: 12 })
    const material = createTissueMaterial(tissueTexture)
    const mesh = new Mesh(geometry, material)
    mesh.raycast = acceleratedRaycast
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.name = item.id
    mesh.userData.parcel = item
    brain.add(mesh)
    const used = [...new Set(item.indices)]
    const centroid = new Vector3()
    used.forEach(index => centroid.add(new Vector3().fromArray(item.positions, index * 3)))
    centroid.divideScalar(used.length)
    let closest = used[0], minDistance = Infinity
    for (const index of used) {
      const distance = new Vector3().fromArray(item.positions, index * 3).distanceToSquared(centroid)
      if (distance < minDistance) { minDistance = distance; closest = index }
    }
    const region = atlasRegionById[item.id]
    const label = region ? document.createElement('button') : null
    if (label) {
      label.className = 'atlas-label'
      label.hidden = true
      label.dataset.regionId = item.id
      label.addEventListener('click', () => options.onPick(item.id))
      labelsLayer.appendChild(label)
    }
    parts.push({ mesh, data: item, anchor: new Vector3().fromArray(item.positions, closest * 3), normal: new Vector3().fromArray(item.normals ?? [], closest * 3), label })
  }
  }
  populate(data)
  let vessels = createCorticalVessels(data)
  brain.add(vessels.root)
  brain.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(brain)
  const center = bounds.getCenter(new Vector3())
  brain.position.sub(center)
  const target = new Vector3(0, 4, 0)
  let selected: string | undefined
  let highlighted: string[] = []
  let layerState: BrainLayers = { interior: false, hemisphere: 'both', separation: 0, atlas: 'anatomy', texture: true, vessels: true, colors: false, labels: false, language: 'pl' }
  let activeModel = data
  let connectionFocus: StructureConnectionFocus | undefined
  let connectionOverlay: ReturnType<typeof createConnectionOverlay> | undefined
  let connectionNeighbors = new Set<string>()
  let connectionHoverId: string | null = null
  let playback: PathwayPlayback | undefined
  let pathOverlay: ReturnType<typeof createCircuitOverlay> | undefined
  let animationTime = 0
  let pageVisible = document.visibilityState !== 'hidden'
  let hoverMesh: Mesh | null = null
  let disposed = false
  let frame = 0
  let width = 0, height = 0
  let transition: { start: number; from: Vector3; to: Vector3; targetFrom: Vector3 } | null = null
  const render = () => {
    frame = 0
    if (disposed || width <= 0 || height <= 0) return
    const now = performance.now()
    const animating = !!(pathOverlay && playback?.playing && pageVisible)
    if (animating) pathOverlay!.advance(animationTime ? Math.min(.05, (now-animationTime)/1000) : 0)
    animationTime = now
    if (transition) {
      const progress = Math.min(1, (performance.now() - transition.start) / 360)
      const eased = 1 - (1 - progress) ** 3
      camera.position.lerpVectors(transition.from, transition.to, eased)
      controls.target.lerpVectors(transition.targetFrom, target, eased)
      if (progress === 1) transition = null
    }
    const moving = controls.update()
    renderer.info.reset()
    if (highQuality && !pathOverlay) lighting.render(!layerState.interior && !layerState.isolate)
    else renderer.render(scene, camera)
    canvas.dataset.geometryCount = String(renderer.info.memory.geometries)
    canvas.dataset.vessels = String(vessels.root.visible)
    canvas.dataset.renderedFrames = String(Number(canvas.dataset.renderedFrames ?? 0) + 1)
    canvas.dataset.renderEngine = 'Three.js · WebGL2 · PBR'
    if (pathOverlay) {
      labelsLayer.hidden = true
      pathOverlay.updateLabels(camera,width,height)
      const stats=pathOverlay.stats()
      canvas.dataset.pathwayScenario=stats.scenario
      canvas.dataset.pathwayId=stats.id
      canvas.dataset.pathwayEdges=String(stats.renderedEdges)
      canvas.dataset.pathwayElapsed=String(stats.elapsed)
      canvas.dataset.pathwayPlaying=String(stats.playing)
      canvas.dataset.pathwaySignal=JSON.stringify(stats.particles[0] ?? [])
    } else if (moving || transition) {
      labelsLayer.style.visibility = 'hidden'
      requestRender()
    } else {
      labelsLayer.style.visibility = ''
      updateLabels()
    }
    if (animating || moving || transition) requestRender()
  }
  const requestRender = () => { if (!disposed && !frame) frame = requestAnimationFrame(render) }
  let pathwayRegions = new Set<string>()
  const hasFocus = () => !!connectionFocus || !!playback || !!selected || highlighted.length > 0
  const isConnectionSource = (item: BrainMeshData) => !!connectionFocus && (connectionFocus.selectionId ? item.id===connectionFocus.selectionId : item.structureIds.includes(connectionFocus.rootId))
  const isActive = (item: BrainMeshData) => connectionFocus ? (!connectionFocus.hemisphere || (connectionFocus.hemisphere==='left' ? isLeft(item.hemisphere) : isRight(item.hemisphere))) && (isConnectionSource(item) || item.structureIds.some(id=>connectionNeighbors.has(id))) : playback ? pathwayRegions.has(item.id) : selected ? item.id === selected || item.structureIds.includes(selected) : highlighted.some(id => item.id === id || item.structureIds.includes(id))

  const applyAppearance = () => {
    for (const { mesh, data: item } of parts) {
      const cortical = isCortex(item)
      const active = isActive(item)
      const hovered = mesh === hoverMesh && (!hasFocus() || active)
      const id = active && selected ? selected : item.structureIds[0]
      const category = id && structureById[id] ? categoryById[structureById[id].categoryId] : undefined
      mesh.visible = layerState.hemisphere === 'both' ||
        (layerState.hemisphere === 'left' ? !isRight(item.hemisphere) : !isLeft(item.hemisphere))
      if (item.atlas && item.atlas !== 'both' && item.atlas !== layerState.atlas) mesh.visible = false
      if (item.kind === 'white-matter' && !active) mesh.visible = false
      if (!cortical && item.kind !== 'cerebellum' && !layerState.interior && !active) mesh.visible = false
      if (layerState.isolate && !active && !cortical) mesh.visible = false
      if (pathOverlay && !cortical && !active && item.kind !== 'cerebellum' && !['Brain-Stem','Left-VentralDC','Right-VentralDC'].includes(item.id)) mesh.visible = false
      mesh.position.x = isLeft(item.hemisphere) ? -layerState.separation : isRight(item.hemisphere) ? layerState.separation : 0
      const transparent = connectionFocus ? !isConnectionSource(item) : pathOverlay ? (layerState.interior && cortical) || !cortical && !active : !!(layerState.interior || layerState.isolate) && cortical && !active && !hovered
      mesh.material.transparent = transparent
      mesh.material.opacity = connectionFocus ? active ? isConnectionSource(item) ? 1 : cortical ? .42 : .7 : .018 : transparent ? pathOverlay ? active ? .3 : cortical ? .12 : .18 : layerState.isolate ? 0.025 : 0.075 : 1
      mesh.material.depthWrite = !transparent
      mesh.castShadow = !transparent
      mesh.renderOrder = transparent ? 2 : 0
      const neutral = connectionFocus ? '#737985' : cortical ? '#bd8e86' : item.kind === 'white-matter' ? '#eee1c5' : '#c8a698'
      const color = connectionFocus && active ? isConnectionSource(item) ? '#efc47e' : '#88d8bb' : active && selected && structureById[selected] ? category?.color ?? item.color ?? '#d3ba8a' : item.color ?? category?.color ?? '#d3ba8a'
      mesh.material.vertexColors = !!layerState.texture
      setTissueDetail(mesh.material, !!layerState.texture && textureAvailable)
      mesh.material.color.set(active || hovered || (layerState.colors && !hasFocus()) ? color : neutral)
      if (hovered && !active) mesh.material.color.lerp(new Color('#ffffff'), 0.12)
      mesh.material.emissive.copy(new Color(active ? color : '#000000'))
      mesh.material.emissiveIntensity = active ? 0.12 : 0
      mesh.material.needsUpdate = true
    }
    vessels.update(layerState)
    pathOverlay?.updateLayers(layerState)
    connectionOverlay?.updateLayers(layerState)
    if (connectionFocus) {canvas.dataset.connectionRoot=connectionFocus.rootId;canvas.dataset.connectionNeighbors=JSON.stringify([...connectionNeighbors])} else {delete canvas.dataset.connectionRoot;delete canvas.dataset.connectionNeighbors}
    const surfaceTriangles = parts.reduce((sum, { mesh }) => sum + (mesh.visible ? (mesh.geometry.index?.count ?? 0) / 3 : 0), 0)
    const vesselTriangles = vessels.root.visible ? vessels.root.children.reduce((sum, child) => sum + (child.visible ? ((child as Mesh).geometry.index?.count ?? 0) / 3 : 0), 0) : 0
    canvas.dataset.triangles = String(surfaceTriangles + vesselTriangles)
    renderer.shadowMap.needsUpdate = true
    requestRender()
  }

  const setPreset = (preset: CameraPreset, animate = true) => {
    const distance = Math.max(bounds.getSize(new Vector3()).length() * 0.97, 285) * Math.max(1, 1 / camera.aspect)
    const destination = preset === 'front' ? new Vector3(0,12,-distance) : preset === 'top' ? new Vector3(0,distance,0.1) : new Vector3(-distance * 0.91,distance * 0.24,-distance * 0.34)
    if (animate && !reducedMotion.matches) {
      transition = { start: performance.now(), from: camera.position.clone(), to: destination, targetFrom: controls.target.clone() }
      requestRender()
      return
    }
    camera.position.copy(destination)
    controls.target.copy(target)
    camera.lookAt(controls.target)
    controls.update()
    requestRender()
  }
  const zoom = (factor: number) => {
    const offset = camera.position.clone().sub(controls.target)
    offset.setLength(Math.min(controls.maxDistance, Math.max(controls.minDistance, offset.length() * factor)))
    camera.position.copy(controls.target).add(offset)
    controls.update()
    requestRender()
  }

  const raycaster = new Raycaster()
  const pointer = new Vector2()
  const updateLabels = () => {
    const placed: { x: number; y: number; anchorX: number; anchorY: number; label: HTMLButtonElement; active: boolean }[] = []
    leaderLayer.replaceChildren()
    const labelWidth = width < 500 ? 115 : 150
    const limit = Math.min(16, Math.max(4, Math.floor((height - 120) / 54) * 2))
    scene.updateMatrixWorld(true)
    const occluders = parts.filter(p => p.mesh.visible && p.mesh.material.opacity >= 0.5).map(p => p.mesh)
    const candidates = [...parts].sort((a,b) => Number(isActive(b.data))-Number(isActive(a.data)) || b.data.indices.length - a.data.indices.length)
    for (const { mesh, data: item, anchor, normal, label } of candidates) {
      if (!label) continue
      label.hidden = true
      const active = isActive(item)
      if ((connectionFocus && !layerState.labels) || (!layerState.labels && !active) || (hasFocus() && !active) || !mesh.visible || mesh.material.opacity < 0.5 || placed.length >= limit) continue
      const region = atlasRegionById[item.id]
      const world = mesh.localToWorld(anchor.clone())
      const direction = camera.position.clone().sub(world).normalize()
      if (normal.clone().transformDirection(mesh.matrixWorld).dot(direction) < 0.12) continue
      const screen = world.clone().project(camera)
      const x = (screen.x + 1) * width / 2, y = (1-screen.y) * height / 2
      if (screen.z > 1 || x < 20 || x > width-20 || y < 40 || y > height-65) continue
      const text = item.atlas === 'brodmann' ? `BA ${region.number}` : regionLabel(region, layerState.language ?? 'pl')
      const sideX = x < width / 2 ? labelWidth / 2 + 12 : width - labelWidth / 2 - 12
      if (placed.filter(p => p.x === sideX).length >= limit / 2) continue
      raycaster.set(camera.position, world.clone().sub(camera.position).normalize())
      const hit = raycaster.intersectObjects(occluders,false)[0]
      if (hit && hit.object !== mesh && hit.distance < camera.position.distanceTo(world)-1.5) continue
      label.textContent = text
      label.title = regionLabel(region, layerState.language ?? 'pl')
      label.setAttribute('aria-label', label.title)
      label.setAttribute('aria-pressed', String(isActive(item)))
      label.hidden = false
      placed.push({ x: sideX, y, anchorX: x, anchorY: y, label, active: isActive(item) })
    }
    for (const side of [true, false]) {
      const column = placed.filter(p => (p.x < width / 2) === side).sort((a,b) => a.y-b.y)
      let previousBottom = 40
      for (const item of column) {
        const halfHeight = item.label.offsetHeight / 2
        item.y = Math.max(item.y, previousBottom + halfHeight + 8)
        previousBottom = item.y + halfHeight
      }
      let nextTop = height - 70
      for (const item of [...column].reverse()) {
        const halfHeight = item.label.offsetHeight / 2
        item.y = Math.min(item.y, nextTop - halfHeight - 8)
        nextTop = item.y - halfHeight
        item.label.style.left = `${item.x}px`; item.label.style.top = `${item.y}px`
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        const edge = item.x + (side ? labelWidth / 2 : -labelWidth / 2)
        line.setAttribute('d', `M ${item.anchorX} ${item.anchorY} L ${edge} ${item.y}`)
        line.setAttribute('stroke', item.active ? '#b7a5f5' : '#eee3d580')
        line.setAttribute('stroke-width', '1')
        line.setAttribute('fill', 'none')
        leaderLayer.appendChild(line)
      }
    }
  }
  const hitAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    // Transparent cortex must not consume taps on structures beneath it.
    const pickable = parts.filter(({ mesh, data: item }) => mesh.visible &&
      (!(layerState.interior || layerState.isolate) || !isCortex(item) || isActive(item)))
    return raycaster.intersectObjects(pickable.map(part => part.mesh), false)[0]?.object as Mesh | undefined
  }
  const pointers = new Set<number>()
  let holdTimer: ReturnType<typeof setTimeout> | undefined
  let held = false
  let gesture: { x: number; y: number; moved: boolean } | null = null
  const clearHold = () => { clearTimeout(holdTimer); holdTimer = undefined }
  const pathwayHit = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const marker = pathOverlay?.hit(camera,width,height,event.clientX-rect.left,event.clientY-rect.top)
    if (marker) return marker
    const item: BrainMeshData | undefined = hitAt(event)?.userData.parcel
    if (!item) return undefined
    return pathOverlay?.nodes().find(node => {
      const region = spatialAnchors[node.key].region
      return region === item.id || region?.replace(/^Left-/, 'Right-').replace(/^lh_/, 'rh_') === item.id
    })
  }
  const showHover = (event: PointerEvent) => {
    const rect=canvas.getBoundingClientRect()
    const connectionNode=connectionOverlay?.hit(camera,width,height,event.clientX-rect.left,event.clientY-rect.top)
    if (connectionNode) {if(connectionHoverId===connectionNode.id)return;connectionHoverId=connectionNode.id;hoverMesh=null;options.onHover({label:structureById[connectionNode.id].names.pl,structureId:connectionNode.id,hemisphere:connectionNode.side});requestRender();return}
    if(connectionHoverId) {connectionHoverId=null;options.onHover(null)}
    if (pathOverlay) {
      pathOverlay.setHover(pathwayHit(event)?.id ?? null)
      requestRender()
      return
    }
    const candidate = hitAt(event)
    const hit = candidate && (!hasFocus() || isActive(candidate.userData.parcel)) ? candidate : undefined
    if ((hit ?? null) === hoverMesh) return
    hoverMesh = hit ?? null
    const item: BrainMeshData | undefined = hit?.userData.parcel
    canvas.style.cursor = item?.selectable !== false ? 'pointer' : 'grab'
    options.onHover(item ? { label: item.label, structureId: item.structureIds[0], regionId: item.id, hemisphere: item.hemisphere } : null)
    applyAppearance()
  }
  const pointerDown = (event: PointerEvent) => {
    transition = null
    pointers.add(event.pointerId)
    held = false
    if (pointers.size === 1) {
      gesture = { x: event.clientX, y: event.clientY, moved: false }
      if (event.pointerType === 'touch') holdTimer = setTimeout(() => { if (gesture && !gesture.moved) { held = true; showHover(event) } },420)
    } else { clearHold(); if (gesture) gesture.moved = true }
  }
  const pointerMove = (event: PointerEvent) => {
    if (pointers.size) {
      if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6) {
        gesture.moved = true
        clearHold()
        pathOverlay?.setHover(null)
      }
      return
    }
    if (event.pointerType !== 'touch') showHover(event)
  }
  const pointerUp = (event: PointerEvent) => {
    clearHold()
    pointers.delete(event.pointerId)
    const pick = gesture && !gesture.moved && !held && !pointers.size && event.button === 0
    if (!pointers.size) gesture = null
    if (event.pointerType === 'touch') { pathOverlay?.setHover(null); options.onHover(null); requestRender() }
    if (!pick) return
    const rect=canvas.getBoundingClientRect()
    const connectionNode=connectionOverlay?.hit(camera,width,height,event.clientX-rect.left,event.clientY-rect.top)
    if (connectionNode) {options.onPick(connectionNode.id);return}
    const node = pathwayHit(event)
    if (node) { playback?.onNodePick?.(node.nodeId); return }
    const item: BrainMeshData | undefined = hitAt(event)?.userData.parcel
    if (pathOverlay) return
    if (item && item.selectable !== false) options.onPick(atlasRegionById[item.id] ? item.id : item.structureIds[0])
  }
  const pointerCancel = (event: PointerEvent) => { clearHold(); pointers.delete(event.pointerId); gesture = null; pathOverlay?.setHover(null); requestRender() }
  const pointerLeave = () => { connectionHoverId=null;hoverMesh = null; pathOverlay?.setHover(null); options.onHover(null); applyAppearance() }
  const preventTouchScroll = (event: TouchEvent) => { if (event.cancelable) event.preventDefault() }
  const preventContextMenu = (event: Event) => event.preventDefault()
  const cameraChanged = () => {
    if (hoverMesh) pointerLeave()
    else requestRender()
  }
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(0.85) }
    else if (event.key === '-') { event.preventDefault(); zoom(1.18) }
    else if (event.key === 'Home') { event.preventDefault(); setPreset('lateral') }
    else if (event.key.startsWith('Arrow')) {
      event.preventDefault()
      const spherical = new Spherical().setFromVector3(camera.position.clone().sub(controls.target))
      if (event.key === 'ArrowLeft') spherical.theta -= 0.14
      if (event.key === 'ArrowRight') spherical.theta += 0.14
      if (event.key === 'ArrowUp') spherical.phi -= 0.14
      if (event.key === 'ArrowDown') spherical.phi += 0.14
      spherical.makeSafe()
      camera.position.copy(controls.target).add(new Vector3().setFromSpherical(spherical))
      controls.update()
      requestRender()
    }
  }
  const contextLost = (event: Event) => {
    event.preventDefault()
    options.onError('Przeglądarka przerwała wyświetlanie modelu 3D. Odśwież stronę lub otwórz schemat 2D.')
  }
  canvas.addEventListener('contextmenu', preventContextMenu)
  canvas.addEventListener('touchmove', preventTouchScroll, { passive: false })
  canvas.addEventListener('pointerdown', pointerDown)
  canvas.addEventListener('pointermove', pointerMove)
  canvas.addEventListener('pointerup', pointerUp)
  canvas.addEventListener('pointercancel', pointerCancel)
  canvas.addEventListener('pointerleave', pointerLeave)
  canvas.addEventListener('keydown', keyDown)
  canvas.addEventListener('webglcontextlost', contextLost)
  controls.addEventListener('change', cameraChanged)
  const motionChanged = () => { controls.enableDamping = !reducedMotion.matches; requestRender() }
  reducedMotion.addEventListener('change', motionChanged)
  const visibilityChanged = () => {
    pageVisible = document.visibilityState !== 'hidden'
    animationTime = 0
    if (pageVisible) requestRender()
  }
  document.addEventListener('visibilitychange',visibilityChanged)
  const observer = new ResizeObserver(() => {
    width = host.clientWidth; height = host.clientHeight
    if (width <= 0 || height <= 0) return
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, highQuality ? 1.5 : 1), 2, Math.sqrt(2400000 / (width * height))))
    renderer.setSize(width, height)
    lighting.resize(width, height)
    const previousFit = Math.max(1, 1 / camera.aspect)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    zoom(Math.max(1, 1 / camera.aspect) / previousFit)
    requestRender()
  })
  observer.observe(host)
  setPreset('lateral', false)
  applyAppearance()

  return {
    connections(next) {
      connectionFocus=next
      connectionNeighbors=new Set(next ? connectedStructureIds(next.rootId) : [])
      connectionOverlay?.dispose()
      connectionOverlay=next ? createConnectionOverlay(activeModel,next) : undefined
      if(connectionOverlay)brain.add(connectionOverlay.root)
      applyAppearance()
    },
    pathway(next) {
      const changed=playback?.circuit.id!==next?.circuit.id
      playback=next
      // Only segmented nodes belong to the pathway highlight. Landmarks must
      // not light up a larger parent structure as if it were that nucleus.
      pathwayRegions = new Set(next ? bindingsForCircuit(next.circuit).flatMap(key =>
        (spatialGroups[key] ?? [{ key }]).flatMap(binding => {
          const anchor = spatialAnchors[binding.key]
          return anchor.precision === 'region' && anchor.region
            ? [anchor.region, anchor.region.replace(/^Left-/, 'Right-').replace(/^lh_/, 'rh_')]
            : []
        })) : [])
      if(changed) {
        pathOverlay?.dispose()
        pathOverlay=next ? createCircuitOverlay(activeModel,next.circuit,{host,onPick:options.onPick,onEdgePick:index=>playback?.onEdgePick?.(index),onNodePick:id=>playback?.onNodePick?.(id)}) : undefined
        if(pathOverlay)brain.add(pathOverlay.root)
        labelsLayer.hidden=!!pathOverlay
        if(!pathOverlay)for(const key of ['pathwayScenario','pathwayId','pathwayEdges','pathwayElapsed','pathwayPlaying','pathwaySignal'])delete canvas.dataset[key]
      }
      pathOverlay?.setScenario(next?.scenario)
      pathOverlay?.setPlayback(next?.playing ?? false,next?.speed ?? 1)
      pathOverlay?.setActiveNode(next?.activeNodeId)
      animationTime=0
      applyAppearance()
    },
    upgrade(next) {
      activeModel=next
      highQuality = Object.values(next.surfaces ?? {}).some(s => s.positions.length > 300000)
      hoverMesh = null
      options.onHover(null)
      parts.forEach(({ mesh, label }) => {
        brain.remove(mesh)
        mesh.geometry.dispose()
        mesh.material.dispose()
        label?.remove()
      })
      parts.length = 0
      sharedAttributes.clear()
      populate(next)
      vessels.dispose()
      vessels = createCorticalVessels(next)
      brain.add(vessels.root)
      if(playback) {
        const elapsed=pathOverlay?.elapsed() ?? 0
        pathOverlay?.dispose()
        pathOverlay=createCircuitOverlay(next,playback.circuit,{host,onPick:options.onPick,onEdgePick:index=>playback?.onEdgePick?.(index),onNodePick:id=>playback?.onNodePick?.(id)})
        pathOverlay.setScenario(playback.scenario)
        pathOverlay.setActiveNode(playback.activeNodeId)
        pathOverlay.setPlayback(playback.playing,playback.speed)
        pathOverlay.setElapsed(elapsed)
        brain.add(pathOverlay.root)
      }
      if(connectionFocus) {connectionOverlay?.dispose();connectionOverlay=createConnectionOverlay(next,connectionFocus);brain.add(connectionOverlay.root)}
      applyAppearance()
    },
    select(id, ids) { selected = id; highlighted = ids; pointerLeave() },
    layers(next) { layerState = next; pointerLeave() },
    preset: value => setPreset(value),
    zoom,
    reset: () => setPreset('lateral'),
    dispose() {
      disposed = true
      clearHold()
      canvas.removeEventListener('contextmenu', preventContextMenu)
      canvas.removeEventListener('touchmove', preventTouchScroll)
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.removeEventListener('change', cameraChanged)
      controls.dispose()
      reducedMotion.removeEventListener('change', motionChanged)
      document.removeEventListener('visibilitychange',visibilityChanged)
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerCancel)
      canvas.removeEventListener('pointerleave', pointerLeave)
      canvas.removeEventListener('keydown', keyDown)
      canvas.removeEventListener('webglcontextlost', contextLost)
      parts.forEach(({ mesh }) => { mesh.geometry.dispose(); mesh.material.dispose() })
      vessels.dispose()
      pathOverlay?.dispose()
      connectionOverlay?.dispose()
      lighting.dispose()
      tissueTexture.dispose()
      environment.dispose()
      key.shadow.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      labelsLayer.remove()
    },
  }
}
