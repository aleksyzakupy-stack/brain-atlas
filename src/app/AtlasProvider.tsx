import { useEffect, useReducer, type PropsWithChildren } from 'react'
import { AtlasContext } from './atlasContext'
import { atlasReducer } from './atlasReducer'
import { createInitialAtlasState, STORAGE_KEYS } from './atlasState'
import { writeStorage } from '../utils/storage'

export function AtlasProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(atlasReducer, undefined, createInitialAtlasState)

  useEffect(() => {
    writeStorage(STORAGE_KEYS.terminology, state.terminologyLanguage)
  }, [state.terminologyLanguage])

  useEffect(() => {
    writeStorage(STORAGE_KEYS.brainView, state.currentBrainView)
  }, [state.currentBrainView])

  useEffect(() => {
    if (state.onboardingStatus === 'dismissed') {
      writeStorage(STORAGE_KEYS.onboardingDismissed, 'true')
    }
  }, [state.onboardingStatus])

  return <AtlasContext.Provider value={{ state, dispatch }}>{children}</AtlasContext.Provider>
}
