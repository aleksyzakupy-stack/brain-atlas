/// <reference types="node" />
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { decodeBrainModel } from '../components/brain/three/loadBrainModel'

const model = {version:1,coordinateSystem:'surface-RAS',meshes:[{id:'test',label:'test',kind:'cortex',hemisphere:'left',structureIds:[],approximate:false,positions:[0,0,0,1,0,0,0,1,0],indices:[0,1,2]}]}
describe('transport modelu', () => {
  it('dekoduje statyczny plik gzip bez Content-Encoding', async () => {
    const compressed = new Uint8Array(gzipSync(JSON.stringify(model)))
    expect(await decodeBrainModel(new Response(compressed),true)).toEqual(model)
  })
  it('nie dekompresuje ponownie odpowiedzi rozpakowanej przez Fetch', async () => {
    expect(await decodeBrainModel(new Response(JSON.stringify(model),{headers:{'content-encoding':'gzip'}}),true)).toEqual(model)
  })
  it('obsługuje zwykły JSON i odrzuca odpowiedź błędu', async () => {
    expect(await decodeBrainModel(new Response(JSON.stringify(model)),false)).toEqual(model)
    await expect(decodeBrainModel(new Response(null,{status:404}),true)).rejects.toThrow('Model unavailable')
  })
})
