import { connections } from './connections'
import { circuitById } from './circuits'
import { structureById } from './structures'
import regionBindings from './connectionRegions.json'
import type { Connection } from '../types/atlas'

export const connectionExampleIds = ['hippocampus','parahippocampal-gyrus','amygdala','prefrontal-cortex','dlpfc','pcc','striatum','caudate','globus-pallidus','thalamus'] as const
export type ConnectionExampleId = typeof connectionExampleIds[number]
export type StructureLink = Connection & { circuitId?: string }
const exampleSet = new Set<string>(connectionExampleIds)
export const isConnectionExample = (id: string): id is ConnectionExampleId => exampleSet.has(id)
const regionExamples = regionBindings as Record<string,string[] | undefined>
export function connectionExamplesForSelection(id?: string) {
  if (!id) return []
  if (isConnectionExample(id)) return [id]
  return [...(regionExamples[id] ?? [])].sort((a,b)=>Number(b==='caudate' || b==='dlpfc')-Number(a==='caudate' || a==='dlpfc')).filter(isConnectionExample)
}
const links: StructureLink[] = connections.filter(link=>exampleSet.has(link.sourceId) && exampleSet.has(link.targetId))
for (const id of ['thalamocortical','cstc-associative','papez']) {
  const circuit = circuitById[id]
  for (const [index,edge] of circuit.edges.entries()) {
    const sourceId = circuit.nodes.find(node=>node.id===edge.from)?.structureId
    const targetId = circuit.nodes.find(node=>node.id===edge.to)?.structureId
    if (!sourceId || !targetId || sourceId===targetId || !exampleSet.has(sourceId) || !exampleSet.has(targetId)) continue
    const duplicate = links.find(link=>link.kind==='anatomical' && ((link.sourceId===sourceId && link.targetId===targetId) || (!link.directed && link.sourceId===targetId && link.targetId===sourceId)))
    if (!duplicate) links.push({id:`${id}-${index}`,sourceId,targetId,kind:'anatomical',directed:true,title:circuit.names.pl,description:circuit.anatomy,referenceIds:circuit.referenceIds,circuitId:id})
  }
}
export const structureLinks = links
export function linksForStructure(id: string) {return structureLinks.filter(link=>link.sourceId===id || link.targetId===id)}
export function connectedStructureIds(id: string) {return [...new Set(linksForStructure(id).map(link=>link.sourceId===id ? link.targetId : link.sourceId))]}
export const structureConnectionUrl = (id: string, regionId?: string, hemisphere?: string) => '/polaczenia/'+id+(regionId ? '?obszar='+encodeURIComponent(regionId) : hemisphere==='left' || hemisphere==='right' ? '?strona='+hemisphere : '')
export type StructureConnectionFocus = { rootId: string; selectionId?: string; hemisphere?: string; atlas?: 'anatomy' | 'brodmann'; links: StructureLink[] }
export const connectionExamples = connectionExampleIds.map(id=>structureById[id])
