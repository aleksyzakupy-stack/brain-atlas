import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../app/App'
import { STORAGE_KEYS } from '../app/atlasState'

describe('przełącznik terminologii PL / EN / LAT', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, 'true')
    window.location.hash = '#/'
  })

  it('zmienia podstawową nazwę wybranej struktury bez zmiany języka interfejsu', async () => {
    const { container } = render(<App />)
    const prefrontalRegion = container.querySelector<SVGPathElement>('[data-structure-id="prefrontal-cortex"]')
    expect(prefrontalRegion).not.toBeNull()
    fireEvent.click(prefrontalRegion!)

    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Prefrontal cortex' }).length).toBeGreaterThan(0))
    expect(screen.getByText('Główna rola')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'LAT' }))
    await waitFor(() => expect(screen.getAllByRole('heading', { name: 'Cortex praefrontalis' }).length).toBeGreaterThan(0))
  })
})
