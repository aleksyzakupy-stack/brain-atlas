import index from './generated/neuroanatomy-index.json'
import type { NeuroCategory, NeuroIndexEntry, NeuroReference } from '../types/neuroanatomy'
import type { BrainCircuit, TerminologyLanguage } from '../types/atlas'
import { structureById } from './structures'
import { atlasRegionById } from './anatomicalAtlas'
import { bindingsForCircuit, spatialGroups } from './pathwaySpatial'
import { normalizeSearch } from '../utils/normalizeSearch'

export const neuroEntries = index as NeuroIndexEntry[]
export const neuroEntryById = Object.fromEntries(neuroEntries.map(entry => [entry.id, entry])) as Record<string, NeuroIndexEntry | undefined>
const mapping = (key: 'projectRegionIds' | 'projectStructureIds' | 'projectCircuitIds' | 'projectHierarchyIds' | 'projectSpatialAnchorIds') =>
  Object.fromEntries(neuroEntries.flatMap(entry => entry[key].map(id => [id, entry]))) as Record<string, NeuroIndexEntry | undefined>
export const neuroByRegion = mapping('projectRegionIds')
export const neuroByStructure = mapping('projectStructureIds')
export const neuroByCircuit = mapping('projectCircuitIds')
export const neuroByHierarchy = mapping('projectHierarchyIds')
export const neuroBySpatial = mapping('projectSpatialAnchorIds')
export const neuroByBrodmann = Object.fromEntries(neuroEntries.filter(entry => entry.number).map(entry => [entry.number, entry])) as Record<number, NeuroIndexEntry | undefined>
export const neuroCategories: Record<NeuroCategory, string> = {
  system: 'Układy anatomiczne', cortex: 'Zakręty i bruzdy', subcortex: 'Struktury podkorowe', functional: 'Obszary funkcjonalne',
  brainstem: 'Pień i małe jądra', ventricle: 'Układ komorowy', 'white-matter': 'Istota biała', cerebellum: 'Móżdżek', supporting: 'Struktury uzupełniające', brodmann: 'Pola Brodmanna', pathway: 'Drogi i obwody',
}
export const neuroEntryName = (entry: NeuroIndexEntry, language: TerminologyLanguage) => entry.names[language === 'la' ? 'lat' : language]
export const neuroEntryUrl = (entry: NeuroIndexEntry) => '/kompendium/' + entry.id
let referencePromise: Promise<NeuroReference> | undefined
export function loadNeuroReference() {
  return referencePromise ??= import('./generated/neuroanatomy-content.json').then(module => module.default as NeuroReference).catch(error => { referencePromise = undefined; throw error })
}
export const loadNeuroGuide = () => import('./generated/neuroanatomy-guide.json').then(module => module.default)
const searchable = neuroEntries.map(entry => {
  const names = [...Object.values(entry.names)]
  for (const id of entry.projectStructureIds) {
    const structure = structureById[id]
    if (structure) names.push(...Object.values(structure.names), ...structure.aliases)
  }
  for (const id of entry.projectRegionIds) {
    const region = atlasRegionById[id]
    if (region) names.push(...Object.values(region.names))
  }
  names.push(...entry.projectSpatialAnchorIds)
  if (entry.number) names.push('BA ' + entry.number, 'Brodmann ' + entry.number, 'Pole Brodmanna ' + entry.number, String(entry.number))
  return { entry, names: names.map(normalizeSearch) }
})
export function searchNeuroEntries(rawQuery: string) {
  const query = normalizeSearch(rawQuery)
  if (!query) return neuroEntries
  const words = query.split(' ')
  const ba = /^(?:(?:ba|pole(?: brodmanna)?|brodmann(?: area)?|area brodmann)\s*)?(\d+)$/.exec(query)
  return searchable.flatMap(({ entry, names }) => {
    if (ba) return entry.number === Number(ba[1]) ? [{ entry, score: 4 }] : []
    const score = names.some(name => name === query) ? 3 : names.some(name => name.startsWith(query)) ? 2 : names.some(name => words.every(word => name.includes(word))) ? 1 : 0
    return score ? [{ entry, score }] : []
  }).sort((a,b) => b.score - a.score || a.entry.names.pl.localeCompare(b.entry.names.pl, 'pl')).map(result => result.entry)
}
export function entriesForCircuitNode(circuit: BrainCircuit, nodeId: string) {
  const nodeIndex = circuit.nodes.findIndex(node => node.id === nodeId)
  if (nodeIndex < 0) return []
  const key = bindingsForCircuit(circuit)[nodeIndex]
  return [...new Map((spatialGroups[key] ?? [{ key }]).flatMap(binding => neuroBySpatial[binding.key] ? [[neuroBySpatial[binding.key]!.id, neuroBySpatial[binding.key]!]] as const : []).map(pair => pair)).values()]
}
export function relatedNeuroEntries(entry: NeuroIndexEntry) {
  const result = new Map<string, NeuroIndexEntry>()
  for (const id of entry.relatedStructureIds) if (neuroByStructure[id]) result.set(neuroByStructure[id]!.id, neuroByStructure[id]!)
  for (const id of entry.relatedCircuitIds) if (neuroByCircuit[id]) result.set(neuroByCircuit[id]!.id, neuroByCircuit[id]!)
  for (const candidate of neuroEntries) if (candidate.relatedStructureIds.some(id => entry.projectStructureIds.includes(id)) || candidate.relatedCircuitIds.some(id => entry.projectCircuitIds.includes(id))) result.set(candidate.id, candidate)
  result.delete(entry.id)
  return [...result.values()].sort((a,b) => a.names.pl.localeCompare(b.names.pl, 'pl'))
}
export function pathwayKind(entry: NeuroIndexEntry, circuit?: BrainCircuit) {
  if (circuit?.kind === 'axis' || circuit?.id === 'tuberoinfundibular') return 'Oś neuroendokrynna'
  if (circuit?.kind === 'loop') return 'Obwód wielosynaptyczny'
  if (circuit?.kind === 'network') return 'Sieć połączeń'
  if (circuit && ['dopamine', 'modulation'].includes(circuit.group)) return 'Projekcja modulująca'
  if (entry.id === 'path-vestibular-mlf') return 'Obwód odruchowy i pęczek anatomiczny'
  if (['path-visual','path-auditory','path-olfactory','path-gustatory','path-trigeminal-sensory'].includes(entry.id)) return 'Droga wielosynaptyczna'
  return circuit ? 'Projekcje anatomiczne' : 'Droga lub pęczek anatomiczny'
}
