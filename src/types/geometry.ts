export type BrainGeometryLayer = 'cortex' | 'deep' | 'external'

export type BrainRegionGeometry = {
  structureId: string
  path: string
  layer: BrainGeometryLayer
  labelAnchor: { x: number; y: number }
  zoomAnchor: { x: number; y: number; zoom: number }
}

export type BrainAnchor = {
  x: number
  y: number
  zoom: number
}
