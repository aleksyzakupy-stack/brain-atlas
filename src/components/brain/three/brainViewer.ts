import {
  AmbientLight, Box3, BufferGeometry, Color, DirectionalLight, DoubleSide,
  Float32BufferAttribute, Group, HemisphereLight, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Raycaster, Scene, Spherical, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { categoryById } from '../../../data/categories'
import { structureById } from '../../../data/structures'
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
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
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
  controls.enableDamping = false
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
  scene.add(new AmbientLight('#d8c7e7', 0.55))
  scene.add(new HemisphereLight('#ebf2ff', '#323049', 1.5))
  const key = new DirectionalLight('#fff4e6', 2.6)
  key.position.set(-180, 250, 230)
  scene.add(key)
  const fill = new DirectionalLight('#acaeff', 1)
  fill.position.set(170, 40, -180)
  scene.add(fill)

  const parts: { mesh: Mesh<BufferGeometry, MeshStandardMaterial>; data: BrainMeshData }[] = []
  for (const item of data.meshes) {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(item.positions, 3))
    geometry.setIndex(item.indices)
    if (item.normals?.length === item.positions.length) geometry.setAttribute('normal', new Float32BufferAttribute(item.normals, 3))
    else geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    const material = new MeshStandardMaterial({ color: '#a49cb4', roughness: 0.84, metalness: 0, side: DoubleSide })
    const mesh = new Mesh(geometry, material)
    mesh.name = item.id
    mesh.userData.parcel = item
    brain.add(mesh)
    parts.push({ mesh, data: item })
  }
  brain.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(brain)
  const center = bounds.getCenter(new Vector3())
  brain.position.sub(center)
  const target = new Vector3(0, 4, 0)
  let selected: string | undefined
  let highlighted: string[] = []
  let layerState: BrainLayers = { interior: false, hemisphere: 'both', separation: 0 }
  let hoverMesh: Mesh | null = null
  let disposed = false
  let frame = 0
  let width = 0, height = 0
  const render = () => {
    frame = 0
    if (!disposed && width > 0 && height > 0) renderer.render(scene, camera)
  }
  const requestRender = () => { if (!disposed && !frame) frame = requestAnimationFrame(render) }
  const isActive = (item: BrainMeshData) => selected ? item.structureIds.includes(selected) : highlighted.some(id => item.structureIds.includes(id))

  const applyAppearance = () => {
    for (const { mesh, data: item } of parts) {
      const cortical = isCortex(item)
      const active = isActive(item)
      const hovered = mesh === hoverMesh
      const id = active && selected ? selected : item.structureIds[0]
      const category = id && structureById[id] ? categoryById[structureById[id].categoryId] : undefined
      mesh.visible = layerState.hemisphere === 'both' ||
        (layerState.hemisphere === 'left' ? !isRight(item.hemisphere) : !isLeft(item.hemisphere))
      mesh.position.x = isLeft(item.hemisphere) ? -layerState.separation : isRight(item.hemisphere) ? layerState.separation : 0
      const transparent = layerState.interior && cortical && !active && !hovered
      mesh.material.transparent = transparent
      mesh.material.opacity = transparent ? 0.075 : 1
      mesh.material.depthWrite = !transparent
      mesh.renderOrder = transparent ? 2 : 0
      const neutral = cortical ? '#a99caf' : '#8896b0'
      mesh.material.color.set(active || hovered || (layerState.interior && !cortical) ? category?.color ?? '#bca6de' : neutral)
      mesh.material.emissive.copy(new Color(active ? category?.color ?? '#bca6de' : '#000000'))
      mesh.material.emissiveIntensity = active ? 0.17 : 0
      mesh.material.needsUpdate = true
    }
    requestRender()
  }

  const setPreset = (preset: CameraPreset) => {
    controls.target.copy(target)
    const distance = Math.max(bounds.getSize(new Vector3()).length() * 1.08, 310) * Math.max(1, 1 / camera.aspect)
    if (preset === 'front') camera.position.set(0, 12, -distance)
    else if (preset === 'top') camera.position.set(0, distance, 0.1)
    else camera.position.set(-distance * 0.91, distance * 0.24, -distance * 0.34)
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
  const hitAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    scene.updateMatrixWorld(true)
    raycaster.setFromCamera(pointer, camera)
    // Transparent cortex must not consume taps on structures beneath it.
    const pickable = parts.filter(({ mesh, data: item }) => mesh.visible &&
      (!layerState.interior || !isCortex(item) || isActive(item)))
    return raycaster.intersectObjects(pickable.map(part => part.mesh), false)[0]?.object as Mesh | undefined
  }
  const pointers = new Set<number>()
  let gesture: { x: number; y: number; moved: boolean } | null = null
  const pointerDown = (event: PointerEvent) => {
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
    canvas.style.cursor = item?.structureIds.length ? 'pointer' : 'grab'
    options.onHover(item ? { label: item.label, structureId: item.structureIds[0], hemisphere: item.hemisphere } : null)
    applyAppearance()
  }
  const pointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId)
    const pick = gesture && !gesture.moved && !pointers.size && event.button === 0
    if (!pointers.size) gesture = null
    if (!pick) return
    const item: BrainMeshData | undefined = hitAt(event)?.userData.parcel
    const id = item?.structureIds[0]
    if (id && structureById[id]) options.onPick(id)
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
  setPreset('lateral')
  applyAppearance()

  return {
    select(id, ids) { selected = id; highlighted = ids; pointerLeave() },
    layers(next) { layerState = next; pointerLeave() },
    preset: setPreset,
    zoom,
    reset: () => setPreset('lateral'),
    dispose() {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.removeEventListener('change', cameraChanged)
      controls.dispose()
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
    },
  }
}
