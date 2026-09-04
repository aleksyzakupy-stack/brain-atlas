import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from '../app/App'
import { learningPaths } from '../data/learningPaths'
import { connections, connectionById } from '../data/connections'
import { referenceById } from '../data/references'
import { brainStructures, structureById } from '../data/structures'
import { PROGRESS_KEY, readProgress, validReturnPath } from '../utils/learningProgress'
import { searchAtlas } from '../utils/searchIndex'

describe('nauka i integralność materiału', () => {
  it.each(learningPaths)('pozwala ukończyć trasę $title i wrócić z karty', async path => {
    window.location.hash = `#/nauka/${path.slug}/${path.steps[0].id}`
    const app = render(<App />)
    for (const [index, step] of path.steps.entries()) {
      await screen.findByRole('heading', { name: step.title, level: 1 })
      if (index === 2) {
        const structure = structureById[step.structureIds[0]]
        fireEvent.click(screen.getByRole('button', { name: `${structure.names.pl} ↗` }))
        await screen.findByRole('heading', { name: structure.names.pl, level: 1 })
        fireEvent.click(screen.getByRole('link', { name: '← Wróć do lekcji' }))
        await screen.findByRole('heading', { name: step.title, level: 1 })
      }
      fireEvent.click(screen.getByRole('button', { name: index === 5 ? 'Zakończ trasę →' : 'Dalej →' }))
    }
    await screen.findByRole('status')
    expect(readProgress(localStorage.getItem(PROGRESS_KEY)).completed[path.slug]).toHaveLength(6)
    app.unmount()
    render(<App />)
    fireEvent.click(screen.getByRole('link', { name: /Wróć do ukończonej trasy/ }))
    await screen.findByRole('heading', { name: path.steps[5].title, level: 1 })
  })

  it('ma kompletne źródła i identyfikatory oraz wyszukuje bez polskich znaków', () => {
    for (const path of learningPaths) {
      expect(path.steps).toHaveLength(6)
      for (const step of path.steps) {
        step.structureIds.forEach(id => expect(structureById[id]).toBeDefined())
        step.connectionIds.forEach(id => expect(connectionById[id]).toBeDefined())
        expect(step.referenceIds.length).toBeGreaterThan(0)
        step.referenceIds.forEach(id => expect(referenceById[id]?.url).toMatch(/^https:\/\//))
      }
    }
    for (const connection of connections) {
      expect(structureById[connection.sourceId]).toBeDefined()
      expect(structureById[connection.targetId]).toBeDefined()
      connection.referenceIds.forEach(id => expect(referenceById[id]).toBeDefined())
      if (connection.kind === 'functional') expect(connection.directed).toBe(false)
    }
    expect(brainStructures).toHaveLength(28)
    brainStructures.forEach(structure => expect(structure.references.length).toBeGreaterThan(0))
    expect(searchAtlas('pamiec robocza')).toEqual(searchAtlas('pamięć robocza'))
    expect(searchAtlas('pamiec').some(result => result.type === 'lesson')).toBe(true)
    expect(validReturnPath('https://example.com')).toBeUndefined()
    expect(readProgress('{broken').lastStep).toBeNull()
  })

  it('działa przy niedostępnym localStorage', async () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')!
    Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new Error('Storage unavailable') } })
    try {
      window.location.hash = '#/nauka/pamiec/orientacja'
      render(<App />)
      fireEvent.click(screen.getByRole('button', { name: 'Dalej →' }))
      await waitFor(() => expect(window.location.hash).toContain('/pamiec/struktury'))
      expect(screen.getByRole('heading', { name: learningPaths[0].steps[1].title, level: 1 })).toBeInTheDocument()
    } finally { Object.defineProperty(window, 'localStorage', original) }
  })
})
