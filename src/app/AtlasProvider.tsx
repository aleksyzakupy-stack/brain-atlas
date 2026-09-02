import { useEffect, useReducer, type PropsWithChildren } from 'react'
import { AtlasContext } from './atlasContext'
import { atlasReducer } from './atlasReducer'
import { createInitialAtlasState, STORAGE_KEYS } from './atlasState'

export function AtlasProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(atlasReducer, undefined, createInitialAtlasState)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.terminology, state.terminologyLanguage)
  }, [state.terminologyLanguage])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.brainView, state.currentBrainView)
  }, [state.currentBrainView])

  useEffect(() => {
    if (state.onboardingStatus === 'dismissed') {
      window.localStorage.setItem(STORAGE_KEYS.onboardingDismissed, 'true')
    }
  }, [state.onboardingStatus])

  return <AtlasContext.Provider value={{ state, dispatch }}>{children}</AtlasContext.Provider>
}
