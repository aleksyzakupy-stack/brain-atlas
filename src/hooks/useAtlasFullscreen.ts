import { createContext, useContext, useState } from 'react'

export const FullscreenContext = createContext<{ fullscreen: boolean; toggleFullscreen: () => void } | null>(null)

export function useAtlasFullscreen() {
  const value = useContext(FullscreenContext)
  const [localFullscreen,setLocalFullscreen] = useState(false)
  return value ?? { fullscreen: localFullscreen, toggleFullscreen: () => setLocalFullscreen(value=>!value) }
}
