import { beforeEach, describe, expect, it } from 'vitest'
import { atlasReducer } from '../app/atlasReducer'
import { createInitialAtlasState } from '../app/atlasState'

describe('atlasReducer', () => {
  beforeEach(() => window.localStorage.clear())

  it('wybiera i odznacza strukturę', () => {
    const initial = createInitialAtlasState()
    const selected = atlasReducer(initial, { type: 'SELECT_STRUCTURE', structureId: 'amygdala' })
    expect(selected.primarySelection).toEqual({ type: 'structure', id: 'amygdala' })
    expect(selected.panelState).toBe('medium')
    expect(atlasReducer(selected, { type: 'DESELECT' }).primarySelection).toBeNull()
  })

  it('zmienia terminologię, zoom i głębokość anatomii', () => {
    const initial = createInitialAtlasState()
    const translated = atlasReducer(initial, { type: 'SET_TERMINOLOGY', language: 'la' })
    const zoomed = atlasReducer(translated, { type: 'SET_ZOOM', zoom: 2.5 })
    const deeper = atlasReducer(zoomed, { type: 'SET_ANATOMY_DEPTH', depth: 2, focusId: 'prefrontal-cortex' })

    expect(deeper.terminologyLanguage).toBe('la')
    expect(deeper.viewport.zoom).toBe(2.5)
    expect(deeper.anatomyDepth).toBe(2)
    expect(deeper.anatomyFocusId).toBe('prefrontal-cortex')
  })

  it('ogranicza zoom do bezpiecznego zakresu', () => {
    const initial = createInitialAtlasState()
    expect(atlasReducer(initial, { type: 'SET_ZOOM', zoom: 9 }).viewport.zoom).toBe(4)
    expect(atlasReducer(initial, { type: 'SET_ZOOM', zoom: 0.1 }).viewport.zoom).toBe(1)
  })
})
