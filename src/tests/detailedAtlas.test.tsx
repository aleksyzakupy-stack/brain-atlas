/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gunzipSync } from 'node:zlib'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../app/App'
import { atlasRegions, atlasRegionById, regionUrl } from '../data/anatomicalAtlas'
import { validateBrainModel } from '../components/brain/three/modelTypes'
import { searchAtlas } from '../utils/searchIndex'

const raw = readFileSync('public/models/brain-detailed.json')
const data: unknown = JSON.parse(raw.toString())
validateBrainModel(data)
const provenance = JSON.parse(readFileSync('public/models/brain-detailed-provenance.json','utf8'))

describe('anatomia Destrieux i pola Brodmanna', () => {
  it('zachowuje kompletną siatkę 81920 trójkątów na półkulę w obu atlasach bez duplikacji', () => {
    expect(data.version).toBe(2)
    expect(Object.keys(data.surfaces ?? {})).toHaveLength(2)
    for (const atlas of ['anatomy','brodmann']) for (const hemisphere of ['left','right']) {
      const meshes = data.meshes.filter(m => m.atlas === atlas && m.hemisphere === hemisphere)
      const faces = meshes.flatMap(m => Array.from({length:m.indices.length/3},(_,i) => m.indices.slice(i*3,i*3+3).join(',')))
      expect(faces).toHaveLength(81920)
      expect(new Set(faces).size).toBe(81920)
      expect(meshes.every(m => m.positions.length === 40962*3 && m.normals?.length === m.positions.length && m.relief?.length === 40962)).toBe(true)
    }
    expect(new Set(data.meshes.map(m => m.id)).size).toBe(data.meshes.length)
  })

  it('udostępnia każdą nazwaną parcelę i nie łączy BA3 z BA33 przez wspólny kolor', () => {
    expect(atlasRegions).toHaveLength(268)
    for (const side of ['left','right']) {
      expect(atlasRegions.filter(r => r.atlas === 'anatomy' && r.hemisphere === side)).toHaveLength(74)
      expect(atlasRegions.filter(r => r.atlas === 'brodmann' && r.hemisphere === side)).toHaveLength(41)
    }
    expect(atlasRegions.filter(r => r.atlas === 'both')).toHaveLength(38)
    expect(atlasRegionById['lh_Brodmann.3'].number).toBe(3)
    expect(atlasRegionById['lh_Brodmann.33'].number).toBe(33)
    const selectable = data.meshes.filter(m => m.selectable)
    expect(selectable.length).toBe(atlasRegions.length)
    expect(selectable.every(m => atlasRegionById[m.id])).toBe(true)
    expect(data.meshes.some(m => m.id.toLowerCase().includes('hypothalamus'))).toBe(false)
    expect(data.meshes.filter(m => m.id.includes('VentralDC')).length).toBe(2)
  })

  it('ma odtwarzalny manifest i skompresowany plik identyczny z JSON', () => {
    expect(createHash('sha256').update(raw).digest('hex')).toBe(provenance.outputSha256)
    const compressed = readFileSync('public/models/brain-detailed.json.gz')
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(provenance.compressedSha256)
    expect(gunzipSync(compressed).equals(raw)).toBe(true)
    expect(provenance.cortex.every((r: {sphereMaxDistance: number}) => r.sphereMaxDistance === 0)).toBe(true)
  })

  it('wyszukuje dokładny numer BA oraz nazwy anatomiczne w trzech językach', () => {
    expect(searchAtlas('BA 4').filter(r => r.type === 'atlas-region').map(r => r.id).sort()).toEqual(['lh_Brodmann.4','rh_Brodmann.4'])
    for (const query of ['bruzda srodkowa','central sulcus','sulcus centralis']) expect(searchAtlas(query).some(r => r.id === 'lh_S_central')).toBe(true)
  })

  it('odrzuca uszkodzone dane tekstury i nieznany identyfikator powierzchni', () => {
    const mesh={id:'test',label:'test',kind:'cortex',hemisphere:'left',structureIds:[],approximate:false,surfaceId:'lh',indices:[0,1,2]}
    const surface={positions:[0,0,0,1,0,0,0,1,0],normals:[0,0,1,0,0,1,0,0,1],relief:[0.2,NaN,0.3]}
    expect(()=>validateBrainModel({meshes:[mesh],surfaces:{lh:surface}})).toThrow('Nieprawidłowa powierzchnia modelu.')
    expect(()=>validateBrainModel({meshes:[mesh],surfaces:{}})).toThrow('Nieprawidłowa powierzchnia modelu.')
  })

  it('otwiera BA33 bezpośrednio i zmienia atlas bez utraty nawigacji', async () => {
    window.location.hash = `#${regionUrl(atlasRegionById['lh_Brodmann.33'])}`
    render(<App />)
    expect(await screen.findByRole('heading',{name:'Pole Brodmanna 33',level:1})).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Anatomia i topografia' })).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button',{name:'Anatomia'})[0])
    expect(await screen.findByRole('heading',{name:'Anatomia mózgu',level:1})).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox',{name:'Filtruj obszary atlasu'}),{target:{value:'bruzda srodkowa'}})
    fireEvent.click(await screen.findByRole('button',{name:/Bruzda środkowa\s*L/}))
    expect(await screen.findByRole('heading',{name:'Bruzda środkowa',level:1})).toBeInTheDocument()
    expect(window.location.hash).toContain('obszar=lh_S_central')
  })
})
