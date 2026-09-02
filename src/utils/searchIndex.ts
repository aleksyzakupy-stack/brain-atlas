import { brainStructures } from '../data/structures'
import type { BrainStructure } from '../types/atlas'
import { normalizeSearch } from './normalizeSearch'

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
