import modelData from '../../public/models/brain-atlas.json'
import { describe, expect, it } from 'vitest'
import { validateBrainModel } from '../components/brain/three/modelTypes'
import { structureById } from '../data/structures'

const triangle = {
  id: 'test-mesh', label: 'Test', hemisphere: 'left', kind: 'cortex',
  structureIds: ['motor-cortex'], approximate: true,
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0], indices: [0, 1, 2],
}

describe('geometria modelu 3D', () => {
  it('dostarcza spójny model z poprawnymi odwołaniami do kart atlasu', () => {
    const model: unknown = modelData
    validateBrainModel(model)

    expect(model.version).toBe(1)
    expect(model.coordinateSystem).toBe('surface-RAS')
    expect(new Set(model.meshes.map(mesh => mesh.id)).size).toBe(model.meshes.length)
    for (const mesh of model.meshes) {
      expect(['left', 'right', 'midline']).toContain(mesh.hemisphere)
      mesh.structureIds.forEach(id => expect(structureById[id]).toBeDefined())
      if (mesh.normals) {
        expect(mesh.normals.length).toBe(mesh.positions.length)
        expect(mesh.normals.every(Number.isFinite)).toBe(true)
      }
    }
    for (const id of ['hippocampus', 'amygdala', 'thalamus', 'nucleus-accumbens', 'motor-cortex']) {
      expect(model.meshes.some(mesh => mesh.hemisphere === 'left' && mesh.structureIds.includes(id))).toBe(true)
      expect(model.meshes.some(mesh => mesh.hemisphere === 'right' && mesh.structureIds.includes(id))).toBe(true)
    }
  })

  it('odrzuca trójkąt wskazujący poza tablicę wierzchołków', () => {
    expect(() => validateBrainModel({ meshes: [{ ...triangle, indices: [0, 1, 3] }] })).toThrow('Nieprawidłowa geometria modelu.')
  })

  it('odrzuca niepełne lub nieskończone współrzędne przed utworzeniem renderera', () => {
    for (const positions of [[], [0, 0], [0, 0, 0, Infinity, 0, 0, 0, 1, 0]]) {
      expect(() => validateBrainModel({ meshes: [{ ...triangle, positions }] })).toThrow('Nieprawidłowa geometria modelu.')
    }
    expect(() => validateBrainModel({ meshes: [] })).toThrow('Brak geometrii w pliku modelu.')
    expect(() => validateBrainModel({ meshes: [null] })).toThrow('Nieprawidłowa geometria modelu.')
  })
})
