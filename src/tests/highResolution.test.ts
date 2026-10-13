/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { validateBrainModel } from '../components/brain/three/modelTypes'
import { atlasRegions } from '../data/anatomicalAtlas'

describe('pełna powierzchnia fsaverage HQ', () => {
  it('ma przypięte sumy i czterokrotnie gęstszą korę bez zmiany identyfikatorów', () => {
    const compressed=readFileSync('public/models/brain-high-resolution.json.gz')
    const raw=gunzipSync(compressed)
    const provenance=JSON.parse(readFileSync('public/models/brain-high-resolution-provenance.json','utf8'))
    expect(createHash('sha256').update(raw).digest('hex')).toBe(provenance.outputSha256)
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(provenance.compressedSha256)
    const model:unknown=JSON.parse(raw.toString())
    validateBrainModel(model)
    for (const atlas of ['anatomy','brodmann']) for (const hemisphere of ['left','right']) {
      const meshes=model.meshes.filter(m=>m.atlas===atlas&&m.hemisphere===hemisphere)
      expect(meshes.reduce((sum,m)=>sum+m.indices.length/3,0)).toBe(327680)
      expect(meshes.every(m=>m.positions.length===163842*3&&m.normals?.length===m.positions.length&&m.relief?.length===163842)).toBe(true)
      const triangles = meshes.flatMap(m=>Array.from({length:m.indices.length/3},(_,i)=>m.indices.slice(i*3,i*3+3).join(',')))
      expect(new Set(triangles).size).toBe(327680)
    }
    expect(model.meshes.filter(m=>m.selectable).map(m=>m.id).sort()).toEqual(atlasRegions.map(r=>r.id).sort())
  },20000)
})
