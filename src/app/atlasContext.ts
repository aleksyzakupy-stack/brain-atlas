import { createContext } from 'react'
import type { Dispatch } from 'react'
import type { AtlasAction } from './atlasReducer'
import type { AtlasState } from './atlasState'

export type AtlasContextValue = {
  state: AtlasState
  dispatch: Dispatch<AtlasAction>
}

export const AtlasContext = createContext<AtlasContextValue | null>(null)
