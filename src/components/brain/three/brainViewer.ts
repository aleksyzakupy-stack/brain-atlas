import {
  AmbientLight, Box3, BufferGeometry, Color, DirectionalLight, DoubleSide,
  Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Raycaster, Scene, Spherical, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { categoryById } from '../../../data/categories'
import { structureById } from '../../../data/structures'
import { atlasRegionById, regionLabel } from '../../../data/anatomicalAtlas'
import { isCortex, isLeft, isRight } from './modelTypes'
import type { BrainLayers, BrainMeshData, BrainModelData, CameraPreset, HoveredParcel } from './modelTypes'

type Options = {
  onPick: (id: string) => void
  onHover: (parcel: HoveredParcel | null) => void
  onError: (message: string) => void
}

export type BrainViewer = {
  select: (id: string | undefined, highlighted: string[]) => void
  layers: (layers: BrainLayers) => void
  preset: (preset: CameraPreset) => void
  zoom: (factor: number) => void
  reset: () => void
  dispose: () => void
}

export function createBrainViewer(host: HTMLElement, data: BrainModelData, options: Options): BrainViewer {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  const canvas = renderer.domElement
  canvas.className = 'brain-3d-canvas'
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', 'Model mózgu 3D. Przeciągnij, aby obracać. Strzałki obracają, plus i minus zmieniają powiększenie. Home przywraca widok.')
  canvas.tabIndex = 0
  host.appendChild(canvas)
  const scene = new Scene()
  const camera = new PerspectiveCamera(35, 1, 1, 2000)
  const controls = new OrbitControls(camera, canvas)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  controls.enableDamping = !reducedMotion.matches
  controls.dampingFactor = 0.09
  controls.enablePan = true
  controls.rotateSpeed = 0.7
  controls.zoomSpeed = 0.8
  controls.minDistance = 110
  controls.maxDistance = 800
  controls.screenSpacePanning = true
  // Source RAS: right, anterior, superior. World: right, superior, posterior.
  const brain = new Group()
  brain.rotation.x = -Math.PI / 2
  scene.add(brain)
  scene.add(new AmbientLight('#fff3eb', 0.35))
  scene.add(new HemisphereLight('#fff8f2', '#52403b', 1.3))
  const key = new DirectionalLight('#fff4e6', 2.2)
  key.position.set(-180, 250, 230)
  scene.add(key)
  const fill = new DirectionalLight('#e4edff', 0.7)
  fill.position.set(170, 40, -180)
  scene.add(fill)

  const parts: { mesh: Mesh<BufferGeometry, MeshStandardMaterial>; data: BrainMeshData; anchor: Vector3; normal: Vector3; label: HTMLButtonElement | null }[] = []
  const labelsLayer = document.createElement('div')
  labelsLayer.className = 'atlas-labels'
  labelsLayer.setAttribute('aria-label', 'Podpisy anatomiczne')
  host.appendChild(labelsLayer)
  const sharedAttributes = new Map<string, { position: Float32BufferAttribute; normal: Float32BufferAttribute; color: Float32BufferAttribute }>()
  for (const item of data.meshes) {
    const geometry = new BufferGeometry()
    let attributes = item.surfaceId ? sharedAttributes.get(item.surfaceId) : undefined
    if (!attributes) {
      const relief = item.relief ?? Array(item.positions.length / 3).fill(0.35)
      attributes = { position: new Float32BufferAttribute(item.positions, 3), normal: new Float32BufferAttribute(item.normals ?? [], 3), color: new Float32BufferAttribute(relief.flatMap(value => { const shade = 1 - value * 0.55; return [shade, shade, shade] }), 3) }
      if (item.surfaceId) sharedAttributes.set(item.surfaceId, attributes)
    }
    geometry.setAttribute('position', attributes.position)
    geometry.setIndex(item.indices)
    geometry.setAttribute('color', attributes.color)
    if (item.normals?.length === item.positions.length) geometry.setAttribute('normal', attributes.normal)
    else geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    const material = new MeshStandardMaterial({ color: '#c6a095', roughness: 0.88, metalness: 0, side: DoubleSide, vertexColors: true })
    const mesh = new Mesh(geometry, material)
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
  brain.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(brain)
  const center = bounds.getCenter(new Vector3())
  brain.position.sub(center)
  const target = new Vector3(0, 4, 0)
  let selected: string | undefined
  let highlighted: string[] = []
  let layerState: BrainLayers = { interior: false, hemisphere: 'both', separation: 0, atlas: 'anatomy', texture: true, colors: false, labels: false, language: 'pl' }
  let hoverMesh: Mesh | null = null
  let disposed = false
  let frame = 0
  let width = 0, height = 0
  let transition: { start: number; from: Vector3; to: Vector3; targetFrom: Vector3 } | null = null
  const render = () => {
    frame = 0
    if (disposed || width <= 0 || height <= 0) return
    if (transition) {
      const progress = Math.min(1, (performance.now() - transition.start) / 360)
      const eased = 1 - (1 - progress) ** 3
      camera.position.lerpVectors(transition.from, transition.to, eased)
      controls.target.lerpVectors(transition.targetFrom, target, eased)
      if (progress === 1) transition = null
    }
    const moving = controls.update()
    renderer.render(scene, camera)
    canvas.dataset.triangles = String(renderer.info.render.triangles)
    if (moving || transition) {
      labelsLayer.style.visibility = 'hidden'
      requestRender()
    } else {
      labelsLayer.style.visibility = ''
      updateLabels()
    }
  }
  const requestRender = () => { if (!disposed && !frame) frame = requestAnimationFrame(render) }
  const isActive = (item: BrainMeshData) => selected ? item.id === selected || item.structureIds.includes(selected) : highlighted.some(id => item.structureIds.includes(id))

  const applyAppearance = () => {
    for (const { mesh, data: item } of parts) {
      const cortical = isCortex(item)
      const active = isActive(item)
      const hovered = mesh === hoverMesh
      const id = active && selected ? selected : item.structureIds[0]
      const category = id && structureById[id] ? categoryById[structureById[id].categoryId] : undefined
      mesh.visible = layerState.hemisphere === 'both' ||
        (layerState.hemisphere === 'left' ? !isRight(item.hemisphere) : !isLeft(item.hemisphere))
      if (item.atlas && item.atlas !== 'both' && item.atlas !== layerState.atlas) mesh.visible = false
      if (item.kind === 'white-matter' && !active) mesh.visible = false
      if (!cortical && item.kind !== 'cerebellum' && !layerState.interior && !active) mesh.visible = false
      if (layerState.isolate && !active && !cortical) mesh.visible = false
      mesh.position.x = isLeft(item.hemisphere) ? -layerState.separation : isRight(item.hemisphere) ? layerState.separation : 0
      const transparent = !!(layerState.interior || layerState.isolate) && cortical && !active && !hovered
      mesh.material.transparent = transparent
      mesh.material.opacity = transparent ? layerState.isolate ? 0.025 : 0.075 : 1
      mesh.material.depthWrite = !transparent
      mesh.renderOrder = transparent ? 2 : 0
      const neutral = cortical ? '#d2b1a4' : item.kind === 'white-matter' ? '#eee1c5' : '#bd9d8b'
      const color = active && selected && structureById[selected] ? category?.color ?? item.color ?? '#d3ba8a' : item.color ?? category?.color ?? '#d3ba8a'
      mesh.material.vertexColors = !!layerState.texture
      mesh.material.color.set(active || hovered || layerState.colors ? color : neutral)
      if (hovered && !active) mesh.material.color.lerp(new Color('#ffffff'), 0.12)
      mesh.material.emissive.copy(new Color(active ? color : '#000000'))
      mesh.material.emissiveIntensity = active ? 0.12 : 0
      mesh.material.needsUpdate = true
    }
    requestRender()
  }

  const setPreset = (preset: CameraPreset, animate = true) => {
    const distance = Math.max(bounds.getSize(new Vector3()).length() * 1.08, 310) * Math.max(1, 1 / camera.aspect)
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
    const placed: { x: number; y: number; w: number }[] = []
    scene.updateMatrixWorld(true)
    const candidates = [...parts].sort((a,b) => Number(isActive(b.data))-Number(isActive(a.data)) || b.data.indices.length - a.data.indices.length)
    for (const { mesh, data: item, anchor, normal, label } of candidates) {
      if (!label) continue
      label.hidden = true
      if (!layerState.labels || !mesh.visible || mesh.material.opacity < 0.5 || placed.length >= 14) continue
      const region = atlasRegionById[item.id]
      const world = mesh.localToWorld(anchor.clone())
      const direction = camera.position.clone().sub(world).normalize()
      if (normal.clone().transformDirection(mesh.matrixWorld).dot(direction) < 0.12) continue
      const screen = world.clone().project(camera)
      const x = (screen.x + 1) * width / 2, y = (1-screen.y) * height / 2
      if (screen.z > 1 || x < 20 || x > width-20 || y < 40 || y > height-65) continue
      const text = item.atlas === 'brodmann' ? `BA ${region.number}` : regionLabel(region, layerState.language ?? 'pl')
      const w = Math.min(165, text.length * 5.8 + 16)
      if (placed.some(p => Math.abs(p.x-x) < (p.w+w)/2+7 && Math.abs(p.y-y) < 48)) continue
      raycaster.set(camera.position, world.clone().sub(camera.position).normalize())
      const occluders = parts.filter(p => p.mesh.visible && p.mesh.material.opacity >= 0.5).map(p => p.mesh)
      const hit = raycaster.intersectObjects(occluders,false)[0]
      if (hit && hit.object !== mesh && hit.distance < camera.position.distanceTo(world)-1.5) continue
      label.textContent = text
      label.title = regionLabel(region, layerState.language ?? 'pl')
      label.setAttribute('aria-label', label.title)
      label.setAttribute('aria-pressed', String(isActive(item)))
      label.style.left = `${x}px`; label.style.top = `${y}px`
      label.hidden = false
      placed.push({x,y,w})
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
  let gesture: { x: number; y: number; moved: boolean } | null = null
  const pointerDown = (event: PointerEvent) => {
    transition = null
    pointers.add(event.pointerId)
    if (pointers.size === 1) gesture = { x: event.clientX, y: event.clientY, moved: false }
    else if (gesture) gesture.moved = true
  }
  const pointerMove = (event: PointerEvent) => {
    if (pointers.size) {
      if (gesture && Math.hypot(event.clientX - gesture.x, event.clientY - gesture.y) > 6) gesture.moved = true
      return
    }
    if (event.pointerType === 'touch') return
    const hit = hitAt(event)
    if ((hit ?? null) === hoverMesh) return
    hoverMesh = hit ?? null
    const item: BrainMeshData | undefined = hit?.userData.parcel
    canvas.style.cursor = item?.selectable !== false ? 'pointer' : 'grab'
    options.onHover(item ? { label: item.label, structureId: item.structureIds[0], regionId: item.id, hemisphere: item.hemisphere } : null)
    applyAppearance()
  }
  const pointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId)
    const pick = gesture && !gesture.moved && !pointers.size && event.button === 0
    if (!pointers.size) gesture = null
    if (!pick) return
    const item: BrainMeshData | undefined = hitAt(event)?.userData.parcel
    if (item && item.selectable !== false) options.onPick(atlasRegionById[item.id] ? item.id : item.structureIds[0])
  }
  const pointerCancel = (event: PointerEvent) => { pointers.delete(event.pointerId); gesture = null }
  const pointerLeave = () => { hoverMesh = null; options.onHover(null); applyAppearance() }
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
  const observer = new ResizeObserver(() => {
    width = host.clientWidth; height = host.clientHeight
    if (width <= 0 || height <= 0) return
    renderer.setSize(width, height)
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
    select(id, ids) { selected = id; highlighted = ids; pointerLeave() },
    layers(next) { layerState = next; pointerLeave() },
    preset: value => setPreset(value),
    zoom,
    reset: () => setPreset('lateral'),
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.removeEventListener('change', cameraChanged)
      controls.dispose()
      reducedMotion.removeEventListener('change', motionChanged)
      canvas.removeEventListener('pointerdown', pointerDown)
      canvas.removeEventListener('pointermove', pointerMove)
      canvas.removeEventListener('pointerup', pointerUp)
      canvas.removeEventListener('pointercancel', pointerCancel)
      canvas.removeEventListener('pointerleave', pointerLeave)
      canvas.removeEventListener('keydown', keyDown)
      canvas.removeEventListener('webglcontextlost', contextLost)
      parts.forEach(({ mesh }) => { mesh.geometry.dispose(); mesh.material.dispose() })
      renderer.dispose()
      renderer.forceContextLoss()
      canvas.remove()
      labelsLayer.remove()
    },
  }
}
