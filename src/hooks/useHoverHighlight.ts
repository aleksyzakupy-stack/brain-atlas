import { useState } from 'react'
import { readStorage, writeStorage } from '../utils/storage'

const storageKey = 'brainAtlas.hoverHighlight'

export function useHoverHighlight() {
  const [enabled, setEnabled] = useState(() => readStorage(storageKey) !== 'false')
  const toggle = () => setEnabled(current => {
    const next = !current
    writeStorage(storageKey, String(next))
    return next
  })
  return { enabled, toggle }
}
