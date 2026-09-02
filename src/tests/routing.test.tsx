import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../app/App'
import { STORAGE_KEYS } from '../app/atlasState'

describe('bezpośrednie trasy struktur', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, 'true')
  })

  it('wybiera strukturę po otwarciu jej adresu hash', async () => {
    window.location.hash = '#/struktury/hipokamp'
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Hipokamp, struktura głęboka' })).toHaveAttribute('aria-pressed', 'true')
    })
    expect(screen.getAllByRole('heading', { name: 'Hipokamp' }).length).toBeGreaterThan(0)
  })

  it('pokazuje polski stan błędu dla nieznanego slugu', () => {
    window.location.hash = '#/struktury/nie-istnieje'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Ta ścieżka nie istnieje w atlasie.' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Wróć do atlasu' })).toBeInTheDocument()
  })
})
