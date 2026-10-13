import { describe, expect, it } from 'vitest'
import { decodeStudioModel } from '../components/brain/three/studioModel'

function fixture(identity = true) {
  const positions = new Float32Array([.01,.02,.03, .02,.02,.03, .01,.03,.03])
  const document = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation: [.1,.2,-.3], extras: identity ? {
      atlasId: 'Left-Hippocampus', label: 'Hipokamp', hemisphere: 'left', kind: 'subcortex',
      atlas: 'both', structureIds: ['hippocampus'], approximate: false, quality: 'high',
    } : {} }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: positions.byteLength }],
    bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [.01,.02,.03], max: [.02,.03,.03] }],
  }
  const json = new TextEncoder().encode(JSON.stringify(document))
  const padded = Math.ceil(json.byteLength / 4) * 4
  const buffer = new ArrayBuffer(28 + padded + positions.byteLength)
  const view = new DataView(buffer), bytes = new Uint8Array(buffer)
  view.setUint32(0,0x46546c67,true); view.setUint32(4,2,true); view.setUint32(8,buffer.byteLength,true)
  view.setUint32(12,padded,true); view.setUint32(16,0x4e4f534a,true)
  bytes.fill(32,20,20+padded); bytes.set(json,20)
  view.setUint32(20+padded,positions.byteLength,true); view.setUint32(24+padded,0x004e4942,true)
  bytes.set(new Uint8Array(positions.buffer),28+padded)
  return buffer
}

describe('Blender model handoff', () => {
  it('restores RAS millimetres, hierarchy transforms and atlas identity', async () => {
    const model = await decodeStudioModel(new Response(fixture()), false)
    expect(model.coordinateSystem).toBe('surface-RAS')
    expect(model.quality).toBe('high')
    expect(model.meshes[0]).toMatchObject({id:'Left-Hippocampus',hemisphere:'left',structureIds:['hippocampus'],atlas:'both',indices:[0,1,2]})
    expect(model.meshes[0].positions[0]).toBeCloseTo(110, 4)
    expect(model.meshes[0].positions[1]).toBeCloseTo(270, 4)
    expect(model.meshes[0].positions[2]).toBeCloseTo(220, 4)
  })
  it('rejects an unrelated Blender mesh and a failed download', async () => {
    await expect(decodeStudioModel(new Response(fixture(false)), false)).rejects.toThrow('Missing atlas identity')
    await expect(decodeStudioModel(new Response(null,{status:404}), false)).rejects.toThrow('Studio model unavailable')
  })
})
