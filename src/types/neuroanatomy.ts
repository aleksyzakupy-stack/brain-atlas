export type NeuroNames = { pl: string; en: string; lat: string }
export type NeuroCategory = 'system' | 'cortex' | 'subcortex' | 'functional' | 'brainstem' | 'ventricle' | 'white-matter' | 'cerebellum' | 'supporting' | 'brodmann' | 'pathway'
export type NeuroIndexEntry = {
  id: string; names: NeuroNames; category: NeuroCategory; number?: number; supplementary: boolean
  projectRegionIds: string[]; projectStructureIds: string[]; projectCircuitIds: string[]
  projectHierarchyIds: string[]; projectSpatialAnchorIds: string[]; relatedStructureIds: string[]; relatedCircuitIds: string[]
}
export type NeuroSource = {
  id: string; title: string; authors?: string; year?: number; edition?: string; url?: string
  status?: string; scope?: string; limitations?: string; verificationStatus?: string; doi?: string; type?: string; accessed?: string
}
export type NeuroEntry = NeuroIndexEntry & {
  anatomy: string; function: string; connections: string; clinical: string; laterality: string; limitations: string
  route?: string; decussation?: string; transmitters?: string; evidenceNote?: string; evidenceNotes?: string
  sources: { sourceId: string; locator: string }[]; inheritedReferenceIds?: string[]
}
export type NeuroReference = {
  entries: NeuroEntry[]; sources: NeuroSource[]
  spatialIndexNotes: { anchorId: string; articleId: string; scope: string }[]
  counts: { articles: number; atlasRegions: number; functionalCards: number; existingCircuits: number; supplementaryPathways: number; hierarchyNodes: number; spatialAnchors: number; sources: number; wordsInContent: number }
}
