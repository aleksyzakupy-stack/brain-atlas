import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { App } from '../app/App'
import { NeuroArticle } from '../components/neuroanatomy/NeuroArticle'
import { NeuroCatalog } from '../components/neuroanatomy/NeuroCatalog'
import { atlasRegions } from '../data/anatomicalAtlas'
import { brainStructures } from '../data/structures'
import { brainCircuits } from '../data/circuits'
import { anatomyHierarchy } from '../data/anatomyHierarchy'
import { spatialAnchors } from '../data/pathwaySpatial'
import { neuroEntries, neuroByRegion, neuroByStructure, neuroByCircuit, neuroByHierarchy, neuroBySpatial, neuroByBrodmann, loadNeuroReference, searchNeuroEntries, entriesForCircuitNode, relatedNeuroEntries } from '../data/neuroanatomy'
import { referenceById } from '../data/references'
import type { NeuroReference } from '../types/neuroanatomy'
const prepared = JSON.parse(readFileSync('docs/neuroanatomy/neuroanatomia-kompendium.json','utf8')) as NeuroReference

describe('integracja kompendium', () => {
  it('pokrywa każdy identyfikator główny dokładnie raz i zachowuje cały tekst źródłowy', async () => {
    const loaded = await loadNeuroReference()
    expect(loaded.entries).toHaveLength(238)
    expect(loaded.sources).toHaveLength(81)
    expect(loaded.counts.wordsInContent).toBe(55013)
    const collections = [
      [atlasRegions.map(item => item.id), neuroByRegion, 'projectRegionIds'],
      [brainStructures.map(item => item.id), neuroByStructure, 'projectStructureIds'],
      [brainCircuits.map(item => item.id), neuroByCircuit, 'projectCircuitIds'],
      [anatomyHierarchy.map(item => item.id), neuroByHierarchy, 'projectHierarchyIds'],
      [Object.keys(spatialAnchors), neuroBySpatial, 'projectSpatialAnchorIds'],
    ] as const
    for (const [ids,map,key] of collections) {
      expect(Object.keys(map).sort()).toEqual([...ids].sort())
      for (const id of ids) expect(loaded.entries.filter(entry => entry[key].includes(id))).toHaveLength(1)
    }
    expect(Object.keys(neuroByBrodmann)).toHaveLength(52)
    expect(neuroEntries.filter(entry => entry.category==='pathway' && !entry.projectCircuitIds.length)).toHaveLength(25)
    for (const original of prepared.entries) {
      const entry = loaded.entries.find(item => item.id === original.id)!
      for (const key of ['anatomy','function','connections','clinical','laterality','limitations','route','decussation','transmitters','evidenceNote','evidenceNotes','sources'] as const) expect(entry[key]).toEqual(original[key])
      entry.inheritedReferenceIds?.forEach(id => expect(referenceById[id]).toBeDefined())
      entry.sources.forEach(citation => expect(loaded.sources.some(source => source.id===citation.sourceId)).toBe(true))
    }
    expect(JSON.stringify(loaded.sources)).not.toMatch(/localPath|sha256|\/Users\//)
  })
  it('udostępnia wszystkie 238 artykułów w katalogu i wyszukuje nazwy PL EN LAT oraz skróty', () => {
    const {container} = render(<MemoryRouter><NeuroCatalog language="pl" /></MemoryRouter>)
    expect(container.querySelectorAll('.neuro-catalog-link')).toHaveLength(238)
    for (const entry of neuroEntries) for (const name of Object.values(entry.names)) expect(searchNeuroEntries(name).some(item => item.id===entry.id)).toBe(true)
    expect(searchNeuroEntries('hipokamp')).toContain(neuroByRegion['Left-Hippocampus'])
    expect(searchNeuroEntries('VTA')).toContain(neuroBySpatial.vta)
    expect(searchNeuroEntries('STN')).toContain(neuroBySpatial.stn)
    for (let number=1;number<=52;number++) expect(searchNeuroEntries('BA '+number)).toEqual([neuroByBrodmann[number]])
    fireEvent.change(screen.getByRole('textbox',{name:'Szukaj w kompendium'}),{target:{value:'corticospinal'}})
    expect(screen.getByRole('link',{name:/Droga korowo-rdzeniowa/})).toHaveAttribute('href','/kompendium/path-corticospinal')
  })
  it('nie używa dodatkowych relacji jako przypisań głównych i wiąże małe jądra przez indeks przestrzenny', () => {
    expect(neuroByStructure.hippocampus!.id).toBe('deep-hippocampus')
    expect(entriesForCircuitNode(brainCircuits.find(c=>c.id==='mesolimbic')!,'n0')).toEqual([neuroBySpatial.vta])
    expect(relatedNeuroEntries(neuroByStructure['motor-cortex']!).some(entry=>entry.id==='path-corticospinal')).toBe(true)
    expect(neuroByRegion['Left-Hippocampus']).toBe(neuroByRegion['Right-Hippocampus'])
    expect(atlasRegions.filter(item=>item.id.endsWith('VentralDC')).every(item=>item.kind==='subcortex')).toBe(true)
    expect(atlasRegions.filter(item=>item.id.startsWith('CC_')).every(item=>item.kind==='white-matter' && item.names.pl.includes('(ASEG)'))).toBe(true)
  })
  it('renderuje pełną treść i lokalizatory książek, domyślnie chowa źródła oraz otwiera sekcje', async () => {
    const entry = prepared.entries.find(item=>item.id==='deep-hippocampus')!
    const {container} = render(<MemoryRouter><NeuroArticle id={entry.id} /></MemoryRouter>)
    await waitFor(()=>expect(container.textContent).toContain(entry.clinical))
    for (const key of ['anatomy','function','connections','clinical','laterality','limitations'] as const) expect(container.textContent).toContain(entry[key])
    const sourcePanel = container.querySelector<HTMLDetailsElement>('.sources-disclosure')!
    expect(sourcePanel.open).toBe(false)
    container.querySelector('summary[aria-label="Źródła"]')!.dispatchEvent(new MouseEvent('click',{bubbles:true}))
    expect(sourcePanel.textContent).toContain('s. PDF 124, 128 (tablice 107, 111)')
    const scroll = vi.fn()
    const section = container.querySelector<HTMLDetailsElement>('[data-section="laterality"]')!
    section.scrollIntoView = scroll
    fireEvent.click(screen.getByRole('button',{name:'Lateralizacja'}))
    expect(section.open).toBe(true)
    expect(scroll).toHaveBeenCalledOnce()
  })
  it('obsługuje bezpośrednią kartę dodatkowej drogi, źródła i nie dokłada pozornej geometrii', async () => {
    window.location.hash='#/kompendium/path-corticospinal'
    const {container} = render(<App />)
    await screen.findByRole('heading',{name:'Droga korowo-rdzeniowa: boczna i przednia',level:1})
    await screen.findByRole('heading',{name:'Skrzyżowania'})
    expect(screen.getByText(/opis bez geometrii 3D/)).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeNull()
    expect(screen.getByText(prepared.entries.find(entry=>entry.id==='path-corticospinal')!.decussation!)).toBeInTheDocument()
  })
  it('zachowuje stronę wybranego regionu w pełnym artykule', async () => {
    window.location.hash='#/atlas?obszar=Right-Hippocampus'
    const {container} = render(<App />)
    expect(await screen.findByText('Prawa półkula')).toBeInTheDocument()
    await waitFor(()=>expect(container.querySelector('[data-article-id="deep-hippocampus"]')).not.toBeNull())
    await screen.findByRole('heading',{name:'Lateralizacja'})
  })
})

describe('nawigacja kompendium i przewodnika', () => {
  it('prowadzi z globalnego wyszukiwania do dodatkowej drogi bez geometrii', async () => {
    window.location.hash='#/'
    render(<App />)
    fireEvent.click(screen.getByRole('button',{name:'Szukaj w atlasie'}))
    fireEvent.change(screen.getByRole('textbox',{name:'Szukaj struktur, funkcji, lekcji i powiązań'}),{target:{value:'corticospinal'}})
    fireEvent.click(screen.getByRole('button',{name:/Droga korowo-rdzeniowa/}))
    await screen.findByRole('heading',{name:'Droga korowo-rdzeniowa: boczna i przednia',level:1})
    expect(window.location.hash).toBe('#/kompendium/path-corticospinal')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
  it('zachowuje sekcje, tabele i lokalizatory pełnego przewodnika', async () => {
    window.location.hash='#/przewodnik'
    const {container} = render(<App />)
    await screen.findByRole('heading',{name:'Jak czytać anatomię, funkcję i objawy w tym atlasie'})
    expect(container.querySelectorAll('.guide-table table')).toHaveLength(3)
    expect(container.textContent).toContain('Spoidło białe przednie rdzenia po przełączeniu w rogu tylnym')
    expect(container.textContent).toContain('PICA, AICA i SCA mają zmienne granice zaopatrzenia.')
    expect(container.querySelectorAll('.neuro-guide > details')).toHaveLength(7)
    expect(screen.getByRole('link',{name:/Netter, rozdział 3, tablice/})).toHaveAttribute('href','#guide-source-netter-neuro')
  })
})
