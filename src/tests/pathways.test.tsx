import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { App } from '../app/App'
import { PathwayScene } from '../components/brain/PathwayScene'
import { brainCircuits, circuitById } from '../data/circuits'
import { brodmannDescriptions } from '../data/brodmann'
import { learningPaths } from '../data/learningPaths'
import { referenceById } from '../data/references'
import { structureById } from '../data/structures'
import { atlasRegions } from '../data/anatomicalAtlas'
import { validReturnPath } from '../utils/learningProgress'

describe('szlaki, animacja i pełny katalog BA', () => {
  it('ma spójny katalog 34 obwodów z opisami, źródłami i poprawnymi węzłami', () => {
    expect(brainCircuits).toHaveLength(34)
    expect(new Set(brainCircuits.map(c => c.id)).size).toBe(34)
    for (const c of brainCircuits) {
      const ids = c.nodes.map(n => n.id)
      expect(c.edges.length).toBeGreaterThan(0)
      c.edges.forEach(e => { expect(ids).toContain(e.from); expect(ids).toContain(e.to) })
      c.structureIds.forEach(id => expect(structureById[id]).toBeDefined())
      c.referenceIds.forEach(id => expect(referenceById[id]).toBeDefined())
      for (const value of [c.anatomy, c.physiology, c.psychiatry, c.pharmacology, c.evidence]) expect(value.length).toBeGreaterThan(90)
    }
    expect(circuitById['tuberoinfundibular'].edges[1]).toMatchObject({ from:'n1', to:'n2', label:'DA · krew wrotna' })
    expect(circuitById['basal-indirect'].edges.map(e => e.effect)).toEqual(['excitation','inhibition','inhibition','excitation','inhibition','excitation'])
  })

  it('animuje każdą krawędź wszystkich schematów, a sieci nie udają jednokierunkowych traktów', () => {
    for (const circuit of brainCircuits) {
      const {container, unmount} = render(<PathwayScene circuit={circuit} language="pl" onSelect={vi.fn()} />)
      fireEvent.click(screen.getByRole('button',{name:'Schemat'}))
      expect(container.querySelectorAll('animateMotion, path > animate')).toHaveLength(circuit.edges.length)
      expect(container.querySelectorAll('path[marker-end]')).toHaveLength(circuit.kind === 'network' ? 0 : circuit.edges.length)
      expect(container.querySelector('svg')).toHaveAttribute('data-playing','true')
      unmount()
    }
  })

  it('pauzuje całą oś czasu, zmienia tempo i otwiera wybraną strukturę', () => {
    const select=vi.fn()
    const pause=vi.fn(), resume=vi.fn()
    const {container} = render(<PathwayScene circuit={circuitById['basal-direct']} language="pl" onSelect={select} />)
    fireEvent.click(screen.getByRole('button',{name:'Schemat'}))
    const svg = container.querySelector('svg')!
    Object.assign(svg,{pauseAnimations:pause,unpauseAnimations:resume})
    fireEvent.click(screen.getByRole('button',{name:'Pauza'}))
    expect(pause).toHaveBeenCalledOnce()
    expect(svg).toHaveAttribute('data-playing','false')
    fireEvent.click(screen.getByRole('button',{name:'Odtwórz'}))
    expect(resume).toHaveBeenCalledOnce()
    fireEvent.change(screen.getByRole('combobox',{name:'Tempo animacji'}),{target:{value:'2'}})
    expect(container.querySelector('animateMotion')).toHaveAttribute('dur','3.2s')
    fireEvent.click(screen.getByRole('button',{name:/Prążkowie D1/}))
    expect(select).toHaveBeenCalledWith('striatum')
  })

  it('respektuje ograniczenie ruchu i pozwala świadomie odtworzyć animację', () => {
    const original=window.matchMedia
    window.matchMedia=vi.fn().mockImplementation(query=>({matches:true,media:query,addEventListener:vi.fn(),removeEventListener:vi.fn()}))
    try {
      const {container}=render(<PathwayScene circuit={circuitById.mesolimbic} language="pl" onSelect={vi.fn()} />)
      fireEvent.click(screen.getByRole('button',{name:'Schemat'}))
      expect(container.querySelector('svg')).toHaveAttribute('data-playing','false')
      fireEvent.click(screen.getByRole('button',{name:'Odtwórz'}))
      expect(container.querySelector('svg')).toHaveAttribute('data-playing','true')
    } finally { window.matchMedia=original }
  })

  it('opisuje numery BA1–52 bez wymyślania funkcji BA50/51 i parceli dla brakujących pól', () => {
    expect(brodmannDescriptions.map(b=>b.number)).toEqual(Array.from({length:52},(_,i)=>i+1))
    for (const b of brodmannDescriptions) b.referenceIds.forEach(id=>expect(referenceById[id]).toBeDefined())
    for (const number of [50,51]) expect(brodmannDescriptions.find(b=>b.number===number)?.functions).toEqual([])
    expect(new Set(atlasRegions.filter(r=>r.atlas==='brodmann').map(r=>r.number)).size).toBe(41)
    const taught = new Set(learningPaths.flatMap(p=>p.steps.flatMap(s=>s.brodmannNumbers??[])))
    expect(taught.size).toBe(52)
    const taughtCircuits = new Set(learningPaths.flatMap(p=>p.steps.flatMap(s=>s.circuitIds??[])))
    brainCircuits.forEach(c=>expect(taughtCircuits.has(c.id)).toBe(true))
  })

  it('zachowuje powrót z karty do szlaku i odrzuca obce adresy powrotu', async () => {
    window.location.hash='#/szlaki/mesolimbic'
    render(<App />)
    fireEvent.click(screen.getByRole('button',{name:'Schemat'}))
    fireEvent.click(screen.getAllByRole('button',{name:/Jądro półleżące ↗/})[0])
    await screen.findByRole('heading',{name:'Jądro półleżące',level:1})
    fireEvent.click(screen.getByRole('link',{name:'← Wróć do szlaku'}))
    await screen.findByRole('heading',{name:'Szlak mezolimbiczny',level:1})
    expect(window.location.hash).toBe('#/szlaki/mesolimbic')
    expect(validReturnPath('/szlaki/mesolimbic')).toBe('/szlaki/mesolimbic')
    expect(validReturnPath('/szlaki/missing')).toBeUndefined()
    expect(validReturnPath('https://example.com/szlaki/mesolimbic')).toBeUndefined()
  })
})
