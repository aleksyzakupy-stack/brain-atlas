import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useReducedMotion } from '../hooks/useReducedMotion'

function MotionProbe() {
  const reduced = useReducedMotion()
  return <output aria-label="preferencja ruchu">{reduced ? 'ograniczony' : 'pełny'}</output>
}

describe('preferencja ograniczenia ruchu', () => {
  it('odczytuje prefers-reduced-motion z systemu', () => {
    vi.mocked(window.matchMedia).mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    render(<MotionProbe />)
    expect(screen.getByLabelText('preferencja ruchu')).toHaveTextContent('ograniczony')
  })
})
