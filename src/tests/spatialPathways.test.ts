/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { createCircuitOverlay, resolveSpatialNodes } from '../components/brain/three/circuitOverlay'
import { validateBrainModel } from '../components/brain/three/modelTypes'
import { brainCircuits, circuitById } from '../data/circuits'
import { bindingsForCircuit, spatialBindings } from '../data/pathwaySpatial'
import type { BrainModelData } from '../components/brain/three/modelTypes'

const model: BrainModelData=JSON.parse(readFileSync('public/models/brain-detailed.json','utf8'))
validateBrainModel(model)

describe('animacja szlaków we współrzędnych modelu 3D',()=>{
  it('przypisuje wszystkie 34 obwody do istniejących regionów lub jawnych punktów orientacyjnych',()=>{
    expect(Object.keys(spatialBindings)).toHaveLength(34)
    for(const circuit of brainCircuits)for(const side of ['left','right'] as const){
      expect(bindingsForCircuit(circuit)).toHaveLength(circuit.nodes.length)
      const nodes=resolveSpatialNodes(circuit,model,side)
      circuit.nodes.forEach(node=>expect(nodes.some(n=>n.nodeId===node.id)).toBe(true))
      nodes.forEach(node=>{
        expect(node.position.toArray().every(Number.isFinite)).toBe(true)
        if(node.precision!=='external')expect(node.position.length()).toBeLessThan(150)
      })
    }
  })
  it('tworzy przestrzenne geometrie i ruchome cząstki dla każdej krawędzi wszystkich obwodów',()=>{
    for(const circuit of brainCircuits){
      const overlay=createCircuitOverlay(model,circuit)
      expect(overlay.root.children.some(m=>m.type==='Mesh')).toBe(true)
      expect(overlay.stats().renderedEdges).toBeGreaterThanOrEqual(circuit.edges.length)
      overlay.setPlayback(true,1)
      const before=overlay.stats().particles
      overlay.advance(.2)
      expect(overlay.stats().particles).not.toEqual(before)
      expect(overlay.stats().elapsed).toBe(.2)
      overlay.dispose()
      expect(overlay.root.children).toHaveLength(0)
    }
  })
  it('pauzuje bez utraty fazy i zmienia tempo bez przeskoku sygnału',()=>{
    const overlay=createCircuitOverlay(model,circuitById.mesolimbic)
    overlay.setPlayback(true,1);overlay.advance(.4)
    const before=overlay.stats()
    overlay.setPlayback(false,2);overlay.advance(10)
    expect(overlay.stats().elapsed).toBe(before.elapsed)
    expect(overlay.stats().particles).toEqual(before.particles)
    overlay.setPlayback(true,2);overlay.advance(.2)
    expect(overlay.stats().elapsed).toBe(.8)
    overlay.dispose()
  })
  it('sekwencyjnie przechodzi przez drogę pośrednią, a GPi i SNr nie mają jednego fałszywego położenia',()=>{
    const circuit=circuitById['basal-indirect']
    const nodes=resolveSpatialNodes(circuit,model,'left')
    const gpi=nodes.find(n=>n.key==='gpi')!,snr=nodes.find(n=>n.key==='snr')!
    expect(gpi.position.distanceTo(snr.position)).toBeGreaterThan(10)
    const overlay=createCircuitOverlay(model,circuit)
    overlay.setPlayback(true,1);overlay.advance(1.8)
    expect(overlay.stats().particles.length).toBeGreaterThan(0)
    overlay.dispose()
  })
  it('przesuwa kotwice razem z półkulami i odróżnia oś hormonalną oraz mikroukład',()=>{
    const base=resolveSpatialNodes(circuitById.mesolimbic,model,'left')
    const separated=resolveSpatialNodes(circuitById.mesolimbic,model,'left',20)
    expect(separated[1].position.x).toBeCloseTo(base[1].position.x-20)
    expect(resolveSpatialNodes(circuitById.hpa,model,'left').some(n=>n.key==='adrenal'&&n.precision==='external')).toBe(true)
    expect(resolveSpatialNodes(circuitById['cortical-gaba'],model,'left').every(n=>n.precision==='microcircuit')).toBe(true)
  })
})
