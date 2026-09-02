import type { Terminology } from './atlas'

export type AnatomyHierarchyNode = {
  id: string
  names: Terminology
  parentId?: string
  childrenIds: string[]
  depth: number
}
