export type BrainMeshData = {
  id: string
  label: string
  hemisphere: string
  kind: string
  structureIds: string[]
  approximate: boolean
  positions: number[]
  normals?: number[]
  indices: number[]
}

export type BrainModelData = {
  version: number
  coordinateSystem: string
  meshes: BrainMeshData[]
}

export type Hemisphere = 'both' | 'left' | 'right'
export type BrainLayers = { interior: boolean; hemisphere: Hemisphere; separation: number }
export type CameraPreset = 'lateral' | 'front' | 'top'
export type HoveredParcel = { label: string; structureId?: string; hemisphere: string }

export const isCortex = (mesh: BrainMeshData) => mesh.kind === 'cortex' || mesh.kind === 'cortical'
export const isLeft = (hemisphere: string) => ['left', 'lh', 'L'].includes(hemisphere)
export const isRight = (hemisphere: string) => ['right', 'rh', 'R'].includes(hemisphere)

export function validateBrainModel(value: unknown): asserts value is BrainModelData {
  if (!value || typeof value !== 'object' || !('meshes' in value) || !Array.isArray(value.meshes) || !value.meshes.length) {
    throw new Error('Brak geometrii w pliku modelu.')
  }
  for (const mesh of value.meshes as BrainMeshData[]) {
    if (!mesh || typeof mesh !== 'object' || typeof mesh.id !== 'string' || typeof mesh.label !== 'string' ||
      typeof mesh.hemisphere !== 'string' || typeof mesh.kind !== 'string' ||
      !Array.isArray(mesh.positions) || !mesh.positions.length || mesh.positions.length % 3 ||
      !Array.isArray(mesh.indices) || !mesh.indices.length || mesh.indices.length % 3 ||
      !Array.isArray(mesh.structureIds) || !mesh.structureIds.every(id => typeof id === 'string') ||
      (mesh.normals !== undefined && (!Array.isArray(mesh.normals) || mesh.normals.length !== mesh.positions.length || !mesh.normals.every(Number.isFinite))) ||
      !mesh.positions.every(Number.isFinite) ||
      !mesh.indices.every(index => Number.isInteger(index) && index >= 0 && index < mesh.positions.length / 3)) {
      throw new Error('Nieprawidłowa geometria modelu.')
    }
  }
}
