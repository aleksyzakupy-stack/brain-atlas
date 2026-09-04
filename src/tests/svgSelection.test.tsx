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
    fireEvent.click(screen.getByRole('button', { name: 'Struktury głębokie' }))
    const amygdala = container.querySelector<SVGPathElement>('[data-structure-id="amygdala"]')
    expect(amygdala).not.toBeNull()
    fireEvent.click(amygdala!)

    await waitFor(() => expect(window.location.hash).toBe('#/struktury/cialo-migdalowate'))
    expect(screen.getAllByRole('heading', { name: 'Ciało migdałowate' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ocenie znaczenia emocjonalnego bodźców/i).length).toBeGreaterThan(0)
  })

  it('obsługuje wybór klawiszem Enter', async () => {
    const { container } = render(<App />)
    const cortex = container.querySelector<SVGPathElement>('[data-structure-id="visual-cortex"]')
    expect(cortex).not.toBeNull()
    fireEvent.keyDown(cortex!, { key: 'Enter' })
    await waitFor(() => expect(window.location.hash).toBe('#/struktury/kora-wzrokowa'))
  })
})
