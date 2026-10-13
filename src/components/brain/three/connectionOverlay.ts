import { CatmullRomCurve3, ConeGeometry, Group, Mesh, MeshBasicMaterial, Quaternion, SphereGeometry, TubeGeometry, Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import type { BrainLayers, BrainModelData } from './modelTypes'
import { connectedStructureIds } from '../../../data/structureConnections'
import type { StructureConnectionFocus } from '../../../data/structureConnections'

const centroidCache = new WeakMap<BrainModelData,Map<string,Vector3>>()
function meshCenter(model: BrainModelData, id: string) {
  let cache=centroidCache.get(model)
  if (!cache) {cache=new Map();centroidCache.set(model,cache)}
  if (!cache.has(id)) {
    const data=model.meshes.find(item=>item.id===id)
    if (!data) return undefined
    const indices=[...new Set(data.indices)],center=new Vector3()
    for (const index of indices) center.add(new Vector3().fromArray(data.positions,index*3))
    center.divideScalar(indices.length)
    cache.set(id,center)
  }
  return cache.get(id)!.clone()
}
export function createConnectionOverlay(model: BrainModelData, focus: StructureConnectionFocus) {
  const root=new Group()
  const nodes: {id:string;side:string;marker:Mesh}[]=[]
  const geometries: (SphereGeometry|TubeGeometry|ConeGeometry)[]=[]
  const materials: MeshBasicMaterial[]=[]
  let signature=''
  const clear=()=>{geometries.forEach(item=>item.dispose());materials.forEach(item=>item.dispose());geometries.length=0;materials.length=0;nodes.length=0;root.clear()}
  const mesh=(geometry:SphereGeometry|TubeGeometry|ConeGeometry,color:string)=>{
    const material=new MeshBasicMaterial({color,transparent:true,opacity:.88,depthTest:false,depthWrite:false,toneMapped:false})
    const item=new Mesh(geometry,material);item.renderOrder=25;root.add(item);geometries.push(geometry);materials.push(material);return item
  }
  const center=(id:string,side:string,separation:number)=>{
    const meshes=model.meshes.filter(item=>((item.atlas ?? 'anatomy')===(focus.atlas ?? 'anatomy') || item.atlas==='both') && (side==='left' ? ['left','lh','L'].includes(item.hemisphere) : ['right','rh','R'].includes(item.hemisphere)) && (id===focus.rootId && focus.selectionId ? item.id===focus.selectionId : item.structureIds.includes(id)))
    if (!meshes.length) return undefined
    const value=new Vector3()
    for (const item of meshes) value.add(meshCenter(model,item.id)!)
    value.divideScalar(meshes.length);value.x+=(side==='left' ? -1 : 1)*separation
    return value
  }
  return {
    root,
    updateLayers(layers:BrainLayers) {
      const next=`${layers.hemisphere}:${layers.separation}`
      if (next===signature) return
      signature=next;clear()
      const sides=layers.hemisphere==='both' ? ['left','right'] : [layers.hemisphere]
      for (const side of sides) {
        if (focus.hemisphere && focus.hemisphere!==side) continue
        const origin=center(focus.rootId,side,layers.separation)
        if (!origin) continue
        const rootMarker=mesh(new SphereGeometry(2.8,12,8),'#efc47e');rootMarker.position.copy(origin);nodes.push({id:focus.rootId,side,marker:rootMarker})
        for (const [index,id] of connectedStructureIds(focus.rootId).entries()) {
          const destination=center(id,side,layers.separation)
          if (!destination) continue
          const marker=mesh(new SphereGeometry(2.1,12,8),'#88d8bb');marker.position.copy(destination);nodes.push({id,side,marker})
          for (const link of focus.links.filter(item=>item.sourceId===id || item.targetId===id)) {
            const incoming=link.directed && link.targetId===focus.rootId
            const from=incoming ? destination : origin,to=incoming ? origin : destination
            const sign=side==='left' ? -1 : 1
            const middle=from.clone().lerp(to,.5).add(new Vector3(sign*(5+index%3),0,4))
            const curve=new CatmullRomCurve3([from,middle,to])
            const color=link.kind==='functional' ? '#ad9cf0' : '#88d8bb'
            if (link.kind==='functional') for(let dash=0;dash<16;dash++) mesh(new TubeGeometry(new CatmullRomCurve3([curve.getPointAt(dash/16),curve.getPointAt((dash+.55)/16)]),3,.5,5,false),color)
            else mesh(new TubeGeometry(curve,40,.65,6,false),color)
            if (link.directed) {const arrow=mesh(new ConeGeometry(1.8,4.2,8),color);arrow.position.copy(curve.getPointAt(.82));arrow.quaternion.copy(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),curve.getTangentAt(.82)))}
          }
        }
      }
    },
    hit(camera:PerspectiveCamera,width:number,height:number,x:number,y:number) {
      let selected:{id:string;side:string}|undefined,distance=22
      root.updateWorldMatrix(true,true)
      for (const node of nodes) {const point=node.marker.getWorldPosition(new Vector3()).project(camera);if(point.z>1 || point.z< -1)continue;const gap=Math.hypot((point.x+1)*width/2-x,(1-point.y)*height/2-y);if(gap<distance){selected=node;distance=gap}}
      return selected
    },
    dispose(){clear();root.removeFromParent()},
  }
}
