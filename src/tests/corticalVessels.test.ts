import { beforeAll, describe, expect, it } from 'vitest'
import { Mesh, SphereGeometry, Vector3 } from 'three'
import { createCorticalVessels } from '../components/brain/three/corticalVessels'
import type { BrainLayers, BrainModelData } from '../components/brain/three/modelTypes'

const model: BrainModelData = { version: 2, coordinateSystem: 'surface-RAS', meshes: [-1, 1].map(sign => {
  const sphere = new SphereGeometry(1, 32, 24).scale(36, 86, 65).translate(sign * 36, -20, 15)
  return { id: String(sign), label: 'cortex', kind: 'cortex', hemisphere: sign < 0 ? 'left' : 'right', atlas: 'anatomy', approximate: false, structureIds: [], positions: Array.from(sphere.attributes.position.array), indices: Array.from(sphere.index!.array) }
}) }
let vessels: ReturnType<typeof createCorticalVessels>
beforeAll(() => { vessels = createCorticalVessels(model) })
const visible: BrainLayers = { interior: false, hemisphere: 'both', separation: 0, vessels: true }

describe('illustrative cortical vessel layer', () => {
  it('creates four finite, outward-facing tube meshes without modifying source anatomy', () => {
    expect(vessels.root.children).toHaveLength(4)
    const before = JSON.stringify(model)
    for (const child of vessels.root.children) {
      const geometry = (child as Mesh).geometry
      const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
      expect(Array.from(position.array).every(Number.isFinite)).toBe(true)
      expect(Array.from(normal.array).every(Number.isFinite)).toBe(true)
      expect(geometry.index!.count).toBeGreaterThan(1000)
      // Every tube ring has eight sides plus its seam vertex. A reversed
      // winding produces inward normals and broken-looking vessels in WebGL.
      const center = new Vector3()
      for (let j = 0; j < 8; j++) center.add(new Vector3().fromBufferAttribute(position, 9 + j))
      center.divideScalar(8)
      const outward = new Vector3().fromBufferAttribute(position, 9).sub(center).normalize()
      expect(outward.dot(new Vector3().fromBufferAttribute(normal, 9))).toBeGreaterThan(0.7)
    }
    vessels.update({ ...visible, hemisphere: 'left', separation: 35 })
    expect(JSON.stringify(model)).toBe(before)
  })

  it('follows hemisphere visibility and separation, and hides over transparent interiors', () => {
    vessels.update({ ...visible, hemisphere: 'left', separation: 35 })
    for (const child of vessels.root.children) {
      expect(child.visible).toBe(child.userData.hemisphere === 'left')
      expect(child.position.x).toBe(child.userData.hemisphere === 'left' ? -35 : 35)
    }
    vessels.update({ ...visible, interior: true })
    expect(vessels.root.visible).toBe(false)
    vessels.update({ ...visible, isolate: true })
    expect(vessels.root.visible).toBe(false)
    vessels.update({ ...visible, vessels: false })
    expect(vessels.root.visible).toBe(false)
    vessels.update(visible)
    expect(vessels.root.visible).toBe(true)
    expect(vessels.root.children.every(child => child.visible && child.position.x === 0)).toBe(true)
  })

  it('releases the four geometries and two shared materials on teardown', () => {
    let disposedGeometry = 0, disposedMaterial = 0
    const materials = new Set(vessels.root.children.map(child => (child as Mesh).material))
    vessels.root.children.forEach(child => (child as Mesh).geometry.addEventListener('dispose', () => disposedGeometry++))
    materials.forEach(material => { if (!Array.isArray(material)) material.addEventListener('dispose', () => disposedMaterial++) })
    vessels.dispose()
    expect(disposedGeometry).toBe(4)
    expect(disposedMaterial).toBe(2)
    expect(vessels.root.parent).toBeNull()
  })
})
