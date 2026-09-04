import geometry from './generated/atlas.json'
import type { AtlasView } from '../types/atlas'

export type Region = { label: string; path: string; anchor: { x: number; y: number } }
export type TeachingRegion = { id: string; path: string; anchor: { x: number; y: number }; approximate: boolean }
export type Projection = keyof typeof geometry

// Anatomical parcels keep their source identity. Functional regions below are
// independently drawn teaching overlays, never renamed DK parcels.
const anatomical: Record<string, string[]> = {
  acc: ['lh_rostralanteriorcingulate', 'lh_caudalanteriorcingulate'],
  pcc: ['lh_posteriorcingulate'], insula: ['lh_insula'], precuneus: ['lh_precuneus'],
  'parahippocampal-gyrus': ['lh_parahippocampal'],
  hippocampus: ['Left-Hippocampus', 'Right-Hippocampus'],
  amygdala: ['Left-Amygdala', 'Right-Amygdala'],
  thalamus: ['Left-Thalamus', 'Right-Thalamus'],
  caudate: ['Left-Caudate', 'Right-Caudate'],
  putamen: ['Left-Putamen', 'Right-Putamen'],
  'globus-pallidus': ['Left-Pallidum', 'Right-Pallidum'],
  cerebellum: ['Left-Cerebellum-Cortex', 'Right-Cerebellum-Cortex'],
  striatum: ['Left-Caudate', 'Right-Caudate', 'Left-Putamen', 'Right-Putamen'],
}

const overlay = (id: string, path: string, x: number, y: number): TeachingRegion => ({ id, path, anchor: { x, y }, approximate: true })
const functional: Partial<Record<Projection, TeachingRegion[]>> = {
  lateral: [
    overlay('prefrontal-cortex', 'M78 365 C55 303 83 236 142 200 C193 161 245 164 283 196 L245 271 C220 302 223 333 241 355 L196 408 C129 424 92 408 78 365Z', 130, 327),
    overlay('dlpfc', 'M105 277 C135 229 190 196 244 200 L254 231 C228 260 196 277 182 309 L126 321Z', 180, 263),
    overlay('ofc', 'M94 407 C129 400 163 407 198 420 L220 437 C190 458 147 452 109 435Z', 160, 428),
    overlay('motor-cortex', 'M285 100 C309 86 326 102 326 137 L337 211 L382 297 L365 324 C327 282 308 259 297 210Z', 319, 215),
    overlay('somatosensory-cortex', 'M356 94 C378 87 393 106 386 145 L397 221 L422 274 L399 301 C369 255 354 204 354 158Z', 384, 190),
    overlay('visual-cortex', 'M664 287 C717 303 748 340 724 390 L667 422 L631 395 L640 339Z', 689, 364),
    overlay('auditory-cortex', 'M344 365 C363 347 400 340 430 345 L439 365 C406 380 374 386 350 382Z', 391, 361),
  ],
  medial: [
    overlay('prefrontal-cortex', 'M592 142 C660 171 711 231 735 303 L742 390 L689 450 L660 412 C697 335 663 286 615 261Z', 691, 263),
    overlay('vmpfc', 'M663 349 C695 358 716 379 716 409 L672 458 L617 459 L616 438 C652 413 673 392 663 349Z', 671, 416),
    overlay('ofc', 'M651 446 L608 451 L571 467 L579 486 C624 486 670 468 679 453Z', 619, 464),
    overlay('visual-cortex', 'M86 335 C135 318 176 323 209 345 L186 373 L116 383 L81 364Z', 141, 355),
  ],
}

export const preferredView = (id: string): AtlasView => {
  if (['acc', 'pcc', 'precuneus', 'vmpfc', 'ofc', 'parahippocampal-gyrus'].includes(id)) return 'medial'
  if (['prefrontal-cortex', 'dlpfc', 'motor-cortex', 'somatosensory-cortex', 'visual-cortex', 'auditory-cortex', 'insula'].includes(id)) return 'lateral'
  return 'deep'
}

export const getProjection = (view: AtlasView, side: boolean): Projection => view === 'deep' && side ? 'deepSide' : view
export const sourceRegions = (projection: Projection): Region[] => geometry[projection].regions
export function teachingRegions(projection: Projection): TeachingRegion[] {
  const source = sourceRegions(projection)
  const mapped = Object.entries(anatomical).flatMap(([id, labels]) => {
    const regions = source.filter(region => labels.includes(region.label))
    if (!regions.length) return []
    return [{ id, path: regions.map(region => region.path).join(' '), anchor: regions[0].anchor, approximate: false }]
  })
  return [...mapped, ...(functional[projection] ?? [])]
}

export const geometryReferenceIds = ['dk', 'aseg']
export const functionalReferenceIds: Record<string, string[]> = {
  'prefrontal-cortex': ['encoding', 'working-memory'], dlpfc: ['working-memory', 'control'],
  vmpfc: ['fear'], ofc: ['brain'], 'motor-cortex': ['anatomy'],
  'somatosensory-cortex': ['anatomy'], 'visual-cortex': ['anatomy'], 'auditory-cortex': ['anatomy'],
}

export const separateSchematicIds = ['hypothalamus', 'nucleus-accumbens', 'substantia-nigra', 'vta', 'locus-coeruleus', 'raphe-nuclei', 'pag']
