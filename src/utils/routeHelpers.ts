import { structureById, structureBySlug } from '../data/structures'

export const structurePath = (structureId: string): string => {
  const structure = structureById[structureId]
  return structure ? `/struktury/${structure.slug}` : '/'
}

export const structureIdFromSlug = (slug?: string): string | null =>
  slug ? structureBySlug[slug]?.id ?? null : null
