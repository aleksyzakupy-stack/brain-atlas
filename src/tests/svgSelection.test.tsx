import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../app/App'
import { STORAGE_KEYS } from '../app/atlasState'

describe('interakcja z atlasem SVG', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, 'true')
    window.location.hash = '#/atlas'
  })

  it('otwiera kartę informacyjną po wybraniu struktury SVG', async () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Schemat 2D' }))
    fireEvent.click(screen.getByRole('button', { name: 'Struktury głębokie' }))
    const amygdala = container.querySelector<SVGPathElement>('[data-structure-id="amygdala"]')
    expect(amygdala).not.toBeNull()
    fireEvent.click(amygdala!)

    await waitFor(() => expect(window.location.hash).toBe('#/struktury/cialo-migdalowate'))
    expect(screen.getAllByRole('heading', { name: 'Ciało migdałowate' }).length).toBeGreaterThan(0)
    expect(await screen.findByRole('heading', { name: 'Anatomia i topografia' })).toBeInTheDocument()
  })

  it('obsługuje wybór klawiszem Enter', async () => {
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Schemat 2D' }))
    const cortex = container.querySelector<SVGPathElement>('[data-structure-id="visual-cortex"]')
    expect(cortex).not.toBeNull()
    fireEvent.keyDown(cortex!, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/struktury/kora-wzrokowa'))
  })

  it('podświetla inną strukturę po wyborze, pozwala wyłączyć hover i odznaczyć tło', async () => {
    window.localStorage.removeItem('brainAtlas.hoverHighlight')
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Schemat 2D' }))
    fireEvent.click(screen.getByRole('button', { name: 'Struktury głębokie' }))
    const amygdala = container.querySelector<SVGPathElement>('[data-structure-id="amygdala"]')!
    const hippocampus = container.querySelector<SVGPathElement>('[data-structure-id="hippocampus"]')!
    fireEvent.click(amygdala)
    await waitFor(() => expect(window.location.hash).toBe('#/struktury/cialo-migdalowate'))

    fireEvent.mouseEnter(hippocampus)
    expect(hippocampus).toHaveClass('is-hovered')
    expect(amygdala).toHaveClass('is-selected')

    const hoverToggle = screen.getByRole('button', { name: 'Podświetlaj pod kursorem' })
    fireEvent.click(hoverToggle)
    expect(hoverToggle).toHaveAttribute('aria-pressed', 'false')
    expect(window.localStorage.getItem('brainAtlas.hoverHighlight')).toBe('false')
    expect(hippocampus).not.toHaveClass('is-hovered')
    fireEvent.mouseEnter(hippocampus)
    expect(hippocampus).not.toHaveClass('is-hovered')

    fireEvent.click(screen.getByRole('group', { name: /Mózg —/ }))
    await waitFor(() => expect(window.location.hash).toBe('#/atlas?warstwa=anatomy'))
  })

  it('pokazuje jedną pozycję dla obu półkul i pozwala odznaczyć region atlasu', async () => {
    window.location.hash = '#/atlas?obszar=Right-Hippocampus'
    const { container } = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Schemat 2D' }))
    expect(screen.queryByRole('button', { name: /Hipokamp [LP]$/ })).not.toBeInTheDocument()
    const diagram = container.querySelector<SVGSVGElement>('.anatomy-svg')
    expect(diagram).not.toBeNull()
    fireEvent.click(diagram!)
    await waitFor(() => expect(window.location.hash).toBe('#/atlas?warstwa=anatomy'))
    expect(screen.getByRole('button', { name: 'Biegun potyliczny' })).toBeInTheDocument()
  })
})
