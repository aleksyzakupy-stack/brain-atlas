import { lateralGeometryById } from './lateralGeometry'
import type { BrainAnchor } from '../types/geometry'

export const defaultBrainAnchor: BrainAnchor = { x: 450, y: 310, zoom: 1 }

export const getBrainAnchor = (structureId: string): BrainAnchor =>
  lateralGeometryById[structureId]?.zoomAnchor ?? defaultBrainAnchor
