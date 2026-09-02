import { hierarchyNodeById } from '../data/anatomyHierarchy'
import { structureById } from '../data/structures'
import type { TerminologyLanguage } from '../types/atlas'

export type BreadcrumbItem = { id: string; label: string }

const nameForId = (id: string, language: TerminologyLanguage): string => {
  const names = structureById[id]?.names ?? hierarchyNodeById[id]?.names
  if (!names) return id
  if (language === 'la') return names.la || names.en
  return names[language]
}

const parentForId = (id: string): string | undefined =>
  structureById[id]?.parentId ?? hierarchyNodeById[id]?.parentId

export const getAnatomyBreadcrumb = (
  structureId: string,
  language: TerminologyLanguage,
): BreadcrumbItem[] => {
  const items: BreadcrumbItem[] = []
  const seen = new Set<string>()
  let currentId: string | undefined = structureId

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId)
    items.unshift({ id: currentId, label: nameForId(currentId, language) })
    currentId = parentForId(currentId)
  }

  if (items[0]?.id !== 'brain') {
    items.unshift({ id: 'brain', label: nameForId('brain', language) })
  }
  return items
}
