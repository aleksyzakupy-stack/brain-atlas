import { useEffect, useState } from 'react'

const mediaQuery = '(prefers-reduced-motion: reduce)'

export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(mediaQuery).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(mediaQuery)
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  return reducedMotion
}
