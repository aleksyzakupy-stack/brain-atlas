import { useEffect, useRef, useState } from 'react'
import type { StructureConnectionFocus } from '../../data/structureConnections'
import { connectedStructureIds } from '../../data/structureConnections'
import { structureById } from '../../data/structures'
import { getStructureName } from '../../utils/terminology'
import type { TerminologyLanguage } from '../../types/atlas'
export function ConnectionScheme({ focus,language,onSelect }: {focus:StructureConnectionFocus;language:TerminologyLanguage;onSelect:(id:string)=>void}) {
  const [hover,setHover]=useState<string | null>(null)
  const timer=useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(()=>()=>clearTimeout(timer.current),[])
  const ids=connectedStructureIds(focus.rootId)
  const points=Object.fromEntries(ids.map((id,index)=>{const angle=index/ids.length*Math.PI*2-Math.PI/2;return [id,{x:400+250*Math.cos(angle),y:300+210*Math.sin(angle)}]}))
  return <div className="connection-scheme"><svg viewBox="0 0 800 600" role="group" aria-label="Połączenia struktury">
    {focus.links.map(link=>{const id=link.sourceId===focus.rootId ? link.targetId : link.sourceId;return <line key={link.id} x1="400" y1="300" x2={points[id].x} y2={points[id].y} stroke={link.kind==='functional' ? '#ad9cf0' : '#88d8bb'} strokeWidth="2" strokeDasharray={link.kind==='functional' ? '7 7' : undefined} />})}
    {[[focus.rootId,{x:400,y:300}],...Object.entries(points)].map(([id,position])=>{const key=id as string,point=position as {x:number;y:number};return <g key={key} onPointerEnter={event=>{if(event.pointerType!=='touch')setHover(key)}} onPointerLeave={()=>{clearTimeout(timer.current);setHover(null)}} onPointerDown={event=>{if(event.pointerType==='touch')timer.current=setTimeout(()=>setHover(key),420)}} onPointerUp={()=>clearTimeout(timer.current)} onPointerCancel={()=>{clearTimeout(timer.current);setHover(null)}} role="button" tabIndex={0} aria-label={getStructureName(structureById[key],language)} onClick={()=>onSelect(key)} onKeyDown={event=>{if(event.key==='Enter' || event.key===' '){event.preventDefault();onSelect(key)}}}><circle cx={point.x} cy={point.y} r={key===focus.rootId ? 24 : 18} fill={key===focus.rootId ? '#efc47e' : '#88d8bb'} />{(hover===key || key===focus.rootId) && <text x={point.x} y={point.y+40} textAnchor="middle" fill="#e7e9ed" fontSize="15">{getStructureName(structureById[key],language)}</text>}</g>})}
  </svg></div>
}
