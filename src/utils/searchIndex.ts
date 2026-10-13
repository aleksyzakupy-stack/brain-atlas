import { brainStructures } from '../data/structures'
import { learningPaths } from '../data/learningPaths'
import { connections } from '../data/connections'
import type { BrainStructure } from '../types/atlas'
import { normalizeSearch } from './normalizeSearch'
import { atlasRegions, matchesRegion, regionLabel, regionUrl } from '../data/anatomicalAtlas'
import { brainCircuits } from '../data/circuits'
import { brodmannDescriptions } from '../data/brodmann'
import { searchNeuroEntries, neuroEntryUrl } from '../data/neuroanatomy'

export type StructureSearchResult = {
  type: 'structure'
  structure: BrainStructure
  score: number
  matchedOn: string
}

const searchableValues = (structure: BrainStructure): string[] => [
  structure.names.pl,
  structure.names.en,
  structure.names.la || '',
  structure.names.abbreviation || '',
  ...structure.aliases,
  ...structure.brodmannAreas,
  structure.shortRole,
  ...structure.functions,
]

export const searchStructures = (rawQuery: string): StructureSearchResult[] => {
  const query = normalizeSearch(rawQuery)
  if (!query) return []

  return brainStructures
    .map((structure) => {
      const values = searchableValues(structure)
      const normalized = values.map(normalizeSearch)
      const exactIndex = normalized.findIndex((value) => value === query)
      const prefixIndex = normalized.findIndex((value) => value.startsWith(query))
      const containsIndex = normalized.findIndex((value) => value.includes(query))

      if (exactIndex >= 0) {
        return { type: 'structure' as const, structure, score: 300, matchedOn: values[exactIndex] }
      }
      if (prefixIndex >= 0) {
        return { type: 'structure' as const, structure, score: 200, matchedOn: values[prefixIndex] }
      }
      if (containsIndex >= 0) {
        return { type: 'structure' as const, structure, score: 100, matchedOn: values[containsIndex] }
      }
      return null
    })
    .filter((result): result is StructureSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.structure.names.pl.localeCompare(b.structure.names.pl, 'pl'))
}

export type AtlasSearchResult = { id: string; title: string; subtitle: string; to: string; type: 'structure' | 'lesson' | 'connection' | 'atlas-region' | 'circuit' | 'brodmann' | 'article' | 'guide' }
export function searchAtlas(rawQuery: string): AtlasSearchResult[] {
  const query = normalizeSearch(rawQuery)
  if (!query) return []
  const results: AtlasSearchResult[] = searchStructures(rawQuery).map(({ structure }) => ({ id: structure.id, title: structure.names.pl, subtitle: structure.names.en, to: `/struktury/${structure.slug}`, type: 'structure' }))
  const exactBA = /^(?:ba|pole(?: brodmanna)?|brodmann(?: area)?)\s*(\d+)$/i.exec(query)
  for (const description of brodmannDescriptions) {
    if (exactBA ? description.number === Number(exactBA[1]) : normalizeSearch([description.title,description.location,...description.functions].join(' ')).includes(query)) results.push({ id: `ba-${description.number}`, title: `BA ${description.number} · ${description.title}`, subtitle: 'Funkcje i klinika', to: `/pola/${description.number}`, type: 'brodmann' })
  }
  for (const circuit of brainCircuits) if (normalizeSearch([circuit.names.pl,circuit.names.en,circuit.transmitter,circuit.summary,...circuit.nodes.map(node=>node.label)].join(' ')).includes(query)) results.unshift({id:circuit.id,title:circuit.names.pl,subtitle:circuit.names.en,to:`/szlaki/${circuit.id}`,type:'circuit'})
  for (const region of atlasRegions) {
    if (matchesRegion(region,rawQuery)) results.unshift({ id: region.id, title: regionLabel(region,'pl'), subtitle: region.source, to: regionUrl(region), type: 'atlas-region' })
  }
  for (const path of learningPaths) for (const step of path.steps) {
    if (normalizeSearch([path.title, step.title, step.lead, ...step.paragraphs].join(' ')).includes(query)) results.push({ id: `${path.slug}-${step.id}`, title: step.title, subtitle: path.title, to: `/nauka/${path.slug}/${step.id}`, type: 'lesson' })
  }
  for (const connection of connections) {
    if (normalizeSearch(`${connection.title} ${connection.description}`).includes(query)) {
      const path = learningPaths.find(path => path.steps.some(step => step.connectionIds.includes(connection.id)))
      const step = path?.steps.find(step => step.connectionIds.includes(connection.id))
      const structure = brainStructures.find(structure => structure.id === connection.sourceId)!
      results.push({ id: connection.id, title: connection.title, subtitle: connection.kind === 'anatomical' ? 'Połączenie anatomiczne' : 'Związek funkcjonalny', to: path && step ? `/nauka/${path.slug}/${step.id}` : `/struktury/${structure.slug}?sekcja=powiazania`, type: 'connection' })
    }
  }
  results.unshift(...searchNeuroEntries(rawQuery).map(entry => ({ id:entry.id, title:entry.names.pl, subtitle:entry.names.en, to:neuroEntryUrl(entry), type:'article' as const })))
  if (normalizeSearch('Przewodnik anatomii skrzyżowania unaczynienie lokalizacja kliniczna').includes(query)) results.unshift({id:'guide',title:'Przewodnik anatomii i lokalizacji klinicznej',subtitle:'Skrzyżowania i unaczynienie',to:'/przewodnik',type:'guide'})
  return results
}
