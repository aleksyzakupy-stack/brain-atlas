import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { FullscreenContext } from '../hooks/useAtlasFullscreen'

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [fullscreen,setFullscreen] = useState(false)
  const toggleFullscreen = () => {
    if (fullscreen) {
      setFullscreen(false)
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {})
    } else {
      setFullscreen(true)
    }
  }
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]')) setFullscreen(false)
    }
    document.addEventListener('keydown',escape)
    return () => { document.removeEventListener('keydown',escape) }
  },[])
  return <FullscreenContext value={{fullscreen,toggleFullscreen}}>{children}</FullscreenContext>
}
