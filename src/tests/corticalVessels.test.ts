import { beforeAll, describe, expect, it } from 'vitest'
import { Mesh, SphereGeometry, Vector3 } from 'three'
import { createCorticalVessels } from '../components/brain/three/corticalVessels'
import { majorVascularRoutes } from '../components/brain/three/cerebralVascularRoutes'
import type { BrainLayers, BrainModelData } from '../components/brain/three/modelTypes'

const model: BrainModelData = { version: 2, coordinateSystem: 'surface-RAS', meshes: [-1, 1].map(sign => {
  const sphere = new SphereGeometry(1, 32, 24).scale(36, 86, 65).translate(sign * 36, -20, 15)
  return { id: String(sign), label: 'cortex', kind: 'cortex', hemisphere: sign < 0 ? 'left' : 'right', atlas: 'anatomy', approximate: false, structureIds: [], positions: Array.from(sphere.attributes.position.array), indices: Array.from(sphere.index!.array) }
}) }
let vessels: ReturnType<typeof createCorticalVessels>
beforeAll(() => { vessels = createCorticalVessels(model) })
const visible: BrainLayers = { interior: false, hemisphere: 'both', separation: 0, vessels: true }

describe('illustrative cortical vessel layer', () => {
  it('batches a finite, outward-facing vascular tree without modifying source anatomy', () => {
    expect(vessels.root.children.length).toBeLessThanOrEqual(14)
    const before = JSON.stringify(model)
    for (const child of vessels.root.children) {
      const geometry = (child as Mesh).geometry
      const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal')
      expect(Array.from(position.array).every(Number.isFinite)).toBe(true)
      expect(Array.from(normal.array).every(Number.isFinite)).toBe(true)
      expect(geometry.index!.count).toBeGreaterThan(1000)
      // Tube rings have eight sides (five for microvessels) plus a seam. A reversed
      // winding produces inward normals and broken-looking vessels in WebGL.
      const center = new Vector3()
      const sides = child.userData.scope === 'micro' ? 5 : 8
      for (let j = 0; j < sides; j++) center.add(new Vector3().fromBufferAttribute(position, sides + 1 + j))
      center.divideScalar(sides)
      const outward = new Vector3().fromBufferAttribute(position, sides + 1).sub(center).normalize()
      expect(outward.dot(new Vector3().fromBufferAttribute(normal, sides + 1))).toBeGreaterThan(0.7)
    }
    vessels.update({ ...visible, hemisphere: 'left', separation: 35 })
    expect(JSON.stringify(model)).toBe(before)
  })

  it('supports transparent cortex, artery/vein filtering and hides disconnected basal trunks when separated', () => {
    vessels.update({ ...visible, hemisphere: 'left', separation: 35 })
    for (const child of vessels.root.children) {
      expect(child.visible).toBe(child.userData.hemisphere === 'left' && child.userData.scope !== 'major')
      expect(child.position.x).toBe(child.userData.hemisphere === 'midline' ? 0 : child.userData.hemisphere === 'left' ? -35 : 35)
    }
    vessels.update({ ...visible, interior: true })
    expect(vessels.root.visible).toBe(true)
    vessels.update({ ...visible, vesselType: 'arteries' })
    expect(vessels.root.children.filter(child => child.visible).every(child => child.userData.vesselType === 'arteries')).toBe(true)
    vessels.update({ ...visible, vesselType: 'veins' })
    expect(vessels.root.children.filter(child => child.visible).every(child => child.userData.vesselType === 'veins')).toBe(true)
    vessels.detail(650)
    expect(vessels.root.children.filter(child => child.userData.scope === 'micro').every(child => !child.visible)).toBe(true)
    vessels.detail(250)
    vessels.update({ ...visible, isolate: true })
    expect(vessels.root.visible).toBe(false)
    vessels.update({ ...visible, vessels: false })
    expect(vessels.root.visible).toBe(false)
    vessels.update(visible)
    expect(vessels.root.visible).toBe(true)
    expect(vessels.root.children.every(child => child.visible && child.position.x === 0)).toBe(true)
  })

  it('keeps both carotid and vertebrobasilar supplies connected to the Circle of Willis', () => {
    const routes = majorVascularRoutes().filter(route => !route.vein)
    const reaches = new Set<string>([JSON.stringify(routes.find(route => route.id === 'left-ICA')!.points[0])])
    for (let i = 0; i < routes.length; i++) for (const route of routes) {
      if (route.points.some(point => reaches.has(JSON.stringify(point)))) route.points.forEach(point => reaches.add(JSON.stringify(point)))
    }
    for (const id of ['right-ICA', 'left-VA', 'right-VA', 'BA', 'ACom', 'left-PCom', 'right-PCom', 'left-MCA-M1', 'right-MCA-M1']) {
      expect(routes.find(route => route.id === id)!.points.every(point => reaches.has(JSON.stringify(point)))).toBe(true)
    }
  })

  it('releases every geometry and shared material on teardown', () => {
    let disposedGeometry = 0, disposedMaterial = 0
    const materials = new Set(vessels.root.children.map(child => (child as Mesh).material))
    vessels.root.children.forEach(child => (child as Mesh).geometry.addEventListener('dispose', () => disposedGeometry++))
    materials.forEach(material => { if (!Array.isArray(material)) material.addEventListener('dispose', () => disposedMaterial++) })
    vessels.dispose()
    expect(disposedGeometry).toBe(vessels.root.children.length)
    expect(disposedMaterial).toBe(materials.size)
    expect(vessels.root.parent).toBeNull()
  })
})
