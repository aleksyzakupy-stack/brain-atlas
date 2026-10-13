import { CatmullRomCurve3, ConeGeometry, Group, Mesh, MeshBasicMaterial, Quaternion, SphereGeometry, TubeGeometry, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import { bindingsForCircuit, spatialAnchors, spatialGroups, spatialGuides } from '../../../data/pathwaySpatial'
import type { SpatialAnchor } from '../../../data/pathwaySpatial'
import type { BrainCircuit } from '../../../types/atlas'
import type { BrainLayers, BrainModelData } from './modelTypes'

export const signalColors = { excitation: '#f4bc75', inhibition: '#9dadf0', modulation: '#88d8bb', hormone: '#e3a7ce' }
const centroids = new WeakMap<BrainModelData, Map<string, Vector3>>()
function centroid(model: BrainModelData, id: string) {
  let cache = centroids.get(model)
  if (!cache) { cache = new Map(); centroids.set(model, cache) }
  let point = cache.get(id)
  if (!point) {
    const mesh = model.meshes.find(m => m.id === id)
    if (!mesh) throw new Error(`Brak regionu dla szlaku: ${id}`)
    point = new Vector3()
    const vertices = new Set(mesh.indices)
    for (const index of vertices) point.add(new Vector3().fromArray(mesh.positions, index * 3))
    point.divideScalar(vertices.size)
    cache.set(id, point)
  }
  return point.clone()
}

export type SpatialNode = {
  id: string; nodeId: string; key: string; label: string; structureId?: string
  position: Vector3; precision: SpatialAnchor['precision']; hemisphere: 'left' | 'right' | 'midline'
}
export function resolveSpatialNodes(circuit: BrainCircuit, model: BrainModelData, side: 'left' | 'right', separation = 0): SpatialNode[] {
  const bindings = bindingsForCircuit(circuit)
  return circuit.nodes.flatMap((node, i) => (spatialGroups[bindings[i]] ?? [{key:bindings[i],label:node.label}]).map(binding => {
    const anchor = spatialAnchors[binding.key]
    const right = side === 'right'
    const id = anchor.region ? right ? anchor.region.replace(/^Left-/, 'Right-').replace(/^lh_/, 'rh_') : anchor.region : undefined
    const position = id ? centroid(model, id) : new Vector3(...anchor.point!)
    if (!id && right && !anchor.midline) position.x *= -1
    if (anchor.offset) position.add(new Vector3(anchor.offset[0] * (right ? -1 : 1), anchor.offset[1], anchor.offset[2]))
    if (!anchor.midline) position.x += (right ? 1 : -1) * separation
    return { id: `${node.id}:${binding.key}:${anchor.midline ? 'midline' : side}`, nodeId:node.id, key:binding.key,
      label:binding.label, structureId:node.structureId, position, precision:anchor.precision, hemisphere:anchor.midline ? 'midline' : side }
  }))
}

const material = (color: string, opacity: number) => new MeshBasicMaterial({color,transparent:true,opacity,depthTest:false,depthWrite:false,toneMapped:false})
const precisionNote = { region:'Punkt reprezentujący region źródłowej siatki', landmark:'Orientacyjny punkt anatomiczny; jądro nie jest osobno segmentowane', microcircuit:'Powiększony schemat populacji komórek, nie lokalizacja pojedynczych neuronów', external:'Element poza modelem mózgu; położenie na ilustracji umowne' }
type Connection = { curve: CatmullRomCurve3; particles: Mesh[]; trace: MeshBasicMaterial; logicalIndex: number; external: boolean }
type Label = { node: SpatialNode; element: HTMLButtonElement | HTMLSpanElement; marker: Mesh; line: SVGPathElement; height: number }

export function createCircuitOverlay(model: BrainModelData, circuit: BrainCircuit, options?: { host: HTMLElement; onPick: (id: string) => void }) {
  const root = new Group()
  root.name = `Animated pathway: ${circuit.id}`
  const connections: Connection[] = []
  const materials = new Set<MeshBasicMaterial>()
  const geometries = new Set<SphereGeometry | TubeGeometry | ConeGeometry>()
  const labels: Label[] = []
  let currentNodes: SpatialNode[] = []
  let state = {hemisphere:'left', separation:0, labels:true} as Pick<BrainLayers,'hemisphere'|'separation'|'labels'>
  let signature = ''
  let playing = false, speed = 1, elapsed = 0
  const labelLayer = options ? document.createElement('div') : null
  if (labelLayer) { labelLayer.className = 'pathway-3d-labels'; labelLayer.setAttribute('aria-label','Węzły szlaku na modelu 3D'); options!.host.appendChild(labelLayer) }
  const leaders = labelLayer ? document.createElementNS('http://www.w3.org/2000/svg','svg') : null
  if (leaders) { leaders.classList.add('atlas-label-leaders'); leaders.setAttribute('aria-hidden','true'); labelLayer!.appendChild(leaders) }
  const ownMaterial = (color: string, opacity: number) => { const value = material(color,opacity); materials.add(value); return value }
  const mesh = (geometry: SphereGeometry | TubeGeometry | ConeGeometry, mat: MeshBasicMaterial, order: number) => {
    geometries.add(geometry)
    const value = new Mesh(geometry,mat); value.renderOrder = order; root.add(value); return value
  }
  const clear = () => {
    geometries.forEach(g=>g.dispose()); geometries.clear()
    materials.forEach(m=>m.dispose()); materials.clear()
    root.clear(); connections.length=0; labels.forEach(l=>l.element.remove()); labels.length=0; leaders?.replaceChildren()
  }
  function rebuild() {
    clear()
    const sides = state.hemisphere === 'both' ? ['left','right'] as const : [state.hemisphere] as ('left'|'right')[]
    const seenNodes = new Set<string>(), seenConnections = new Set<string>()
    currentNodes = []
    for (const side of sides) {
      const nodes = resolveSpatialNodes(circuit,model,side,state.separation)
      currentNodes.push(...nodes)
      for (const node of nodes) {
        const identity = `${node.key}:${node.hemisphere}`
        if (seenNodes.has(identity)) continue
        seenNodes.add(identity)
        const mat = ownMaterial(node.precision === 'external' ? signalColors.hormone : '#d1f3e7', .95)
        const marker = mesh(new SphereGeometry(node.precision === 'region' ? 2.1 : 1.7,12,8),mat,32)
        marker.position.copy(node.position); marker.userData.nodeId = node.nodeId
        if (labelLayer && leaders) {
          const element = document.createElement(node.structureId ? 'button' : 'span')
          element.className='pathway-3d-label'
          const qualifier = node.precision === 'region' ? '' : node.precision === 'external' ? ' · poza mózgiem' : node.precision === 'microcircuit' ? ' · powiększenie' : ' ≈'
          element.textContent = node.label + qualifier
          element.title = precisionNote[node.precision]
          element.dataset.nodeId = node.nodeId
          element.dataset.precision = node.precision
          if (node.structureId) element.addEventListener('click',()=>options!.onPick(node.structureId!))
          // Both sides remain in 3D; one set of callouts keeps the view readable.
          element.hidden = state.hemisphere === 'both' && node.hemisphere === 'right'
          labelLayer.appendChild(element)
          const line=document.createElementNS('http://www.w3.org/2000/svg','path')
          line.setAttribute('fill','none'); line.setAttribute('stroke','#88d8bb90'); line.setAttribute('stroke-width','1')
          leaders.appendChild(line)
          labels.push({node,element,marker,line,height:0})
        }
      }
      for (const [logicalIndex, edge] of circuit.edges.entries()) {
        const starts=nodes.filter(n=>n.nodeId===edge.from), ends=nodes.filter(n=>n.nodeId===edge.to)
        for (const from of starts) for (const to of ends) {
          const identity=`${logicalIndex}:${from.key}:${from.hemisphere}:${to.key}:${to.hemisphere}`
          if (seenConnections.has(identity)) continue
          seenConnections.add(identity)
          const guide=spatialGuides[circuit.id]?.[logicalIndex]
          const sign=side==='left' ? -1 : 1
          const points=guide?.length ? guide.map(p=>new Vector3(side==='right' ? -p[0] : p[0],p[1],p[2]).add(new Vector3(sign*state.separation,0,0))) : [
            from.position.clone().lerp(to.position,.32).add(new Vector3(sign*(4+logicalIndex%3),0,5)),
            from.position.clone().lerp(to.position,.68).add(new Vector3(sign*(4+logicalIndex%3),0,5)),
          ]
          const curve=new CatmullRomCurve3([from.position,...points,to.position],false,'centripetal')
          const external=from.precision==='external'||to.precision==='external'||(circuit.id==='tuberoinfundibular'&&logicalIndex===1)
          const color=signalColors[edge.effect]
          const trace=ownMaterial(color,.68)
          if (external) {
            for(let i=0;i<18;i++) mesh(new TubeGeometry(new CatmullRomCurve3([curve.getPointAt(i/18),curve.getPointAt((i+.55)/18)]),3,.55,6,false),trace,20)
          } else mesh(new TubeGeometry(curve,64,.65,8,false),trace,20)
          if(circuit.kind!=='network') {
            const arrow=mesh(new ConeGeometry(1.6,3.8,10),ownMaterial(color,.95),30)
            arrow.position.copy(curve.getPointAt(.88)); arrow.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),curve.getTangentAt(.88)))
          }
          const particles=[0,1].map(()=>mesh(new SphereGeometry(1.65,10,8),ownMaterial(color,1),34))
          connections.push({curve,particles,trace,logicalIndex,external})
        }
      }
    }
    updateSignals()
  }
  function updateSignals() {
    const sequential=circuit.kind==='loop'||circuit.kind==='axis'||circuit.id==='tuberoinfundibular'
    const duration=sequential ? circuit.edges.length*1.6 : 2.6
    const phase=(elapsed%duration)/duration
    for(const connection of connections) {
      const stage=phase*circuit.edges.length
      for(const [i,particle] of connection.particles.entries()) {
        let progress=(phase+i*.5)%1
        if(sequential) { progress=stage-connection.logicalIndex; particle.visible=progress>=0&&progress<1&&i===0 }
        else particle.visible=true
        if(circuit.kind==='network'&&i===1)progress=1-progress
        particle.position.copy(connection.curve.getPointAt(Math.min(1,Math.max(0,progress))))
      }
      connection.trace.opacity=circuit.kind==='network' ? .45+.25*(Math.sin(phase*Math.PI*2)+1)/2 : .68
    }
  }
  rebuild()
  return {
    root,
    nodes:()=>currentNodes,
    setPlayback(nextPlaying: boolean, nextSpeed: number) { playing=nextPlaying; speed=nextSpeed },
    elapsed:()=>elapsed,
    setElapsed(value: number) { elapsed=value; updateSignals() },
    advance(seconds: number) { if(playing)elapsed+=seconds*speed; updateSignals() },
    updateLayers(layers: BrainLayers) {
      state={hemisphere:layers.hemisphere,separation:layers.separation,labels:layers.labels}
      const nextSignature=`${state.hemisphere}:${state.separation}`
      if(signature!==nextSignature){signature=nextSignature;rebuild()}
      if(labelLayer)labelLayer.hidden=!layers.labels
    },
    updateLabels(camera: PerspectiveCamera, width: number, height: number) {
      if(!labelLayer||!leaders||!state.labels)return
      const labelWidth=width<500 ? 120 : 156
      const placed: {label:Label;x:number;y:number;anchorX:number;anchorY:number}[]=[]
      root.updateWorldMatrix(true,true)
      for(const label of labels) {
        if(state.hemisphere==='both'&&label.node.hemisphere==='right')continue
        const point=label.marker.getWorldPosition(new Vector3()).project(camera)
        const anchorX=(point.x+1)*width/2, anchorY=(1-point.y)*height/2
        label.element.hidden=point.z>1||point.z< -1
        label.line.style.display=label.element.hidden ? 'none' : ''
        if(label.element.hidden)continue
        label.height=label.element.offsetHeight||36
        const x=anchorX<width/2 ? labelWidth/2+10 : width-labelWidth/2-10
        placed.push({label,x,y:Math.min(height-50,Math.max(45,anchorY)),anchorX,anchorY})
      }
      for(const left of [true,false]) {
        const column=placed.filter(p=>(p.x<width/2)===left).sort((a,b)=>a.y-b.y)
        let bottom=40
        for(const p of column){p.y=Math.max(p.y,bottom+p.label.height/2+6);bottom=p.y+p.label.height/2}
        let top=height-52
        for(const p of [...column].reverse()) {
          p.y=Math.min(p.y,top-p.label.height/2-6);top=p.y-p.label.height/2
          p.label.element.style.left=`${p.x}px`;p.label.element.style.top=`${p.y}px`
          p.label.line.setAttribute('d',`M ${p.anchorX} ${p.anchorY} L ${p.x+(left ? labelWidth/2 : -labelWidth/2)} ${p.y}`)
        }
      }
    },
    stats:()=>({id:circuit.id,logicalEdges:circuit.edges.length,renderedEdges:connections.length,nodeCount:new Set(currentNodes.map(n=>`${n.key}:${n.hemisphere}`)).size,elapsed:+elapsed.toFixed(4),playing,particles:connections.flatMap(c=>c.particles.filter(p=>p.visible).map(p=>p.position.toArray().map(v=>+v.toFixed(3))))}),
    dispose() { clear(); labelLayer?.remove(); root.removeFromParent() },
  }
}
