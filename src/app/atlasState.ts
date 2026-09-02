import type {
  AtlasMode,
  BrainViewId,
  OverlayLayerId,
  PanelState,
  PrimarySelection,
  TerminologyLanguage,
  ViewportState,
} from '../types/atlas'

export const STORAGE_KEYS = {
  terminology: 'brainAtlas.terminology',
  onboardingDismissed: 'brainAtlas.onboardingDismissed',
  brainView: 'brainAtlas.brainView',
} as const

export type AtlasState = {
  currentMode: AtlasMode
  terminologyLanguage: TerminologyLanguage
  currentBrainView: BrainViewId
  primarySelection: PrimarySelection
  activeLayerIds: OverlayLayerId[]
  anatomyDepth: number
  anatomyFocusId: string | null
  viewport: ViewportState
  panelState: PanelState
  onboardingStatus: 'visible' | 'dismissed'
  searchOpen: boolean
  projectOpen: boolean
}

const readStoredTerminology = (): TerminologyLanguage => {
  if (typeof window === 'undefined') return 'pl'
  const stored = window.localStorage.getItem(STORAGE_KEYS.terminology)
  return stored === 'en' || stored === 'la' ? stored : 'pl'
}

const readStoredView = (): BrainViewId => {
  if (typeof window === 'undefined') return 'lateral'
  return window.localStorage.getItem(STORAGE_KEYS.brainView) === 'lateral' ? 'lateral' : 'lateral'
}

export const createInitialAtlasState = (): AtlasState => ({
  currentMode: 'structures',
  terminologyLanguage: readStoredTerminology(),
  currentBrainView: readStoredView(),
  primarySelection: null,
  activeLayerIds: ['deep-anatomy'],
  anatomyDepth: 0,
  anatomyFocusId: null,
  viewport: { zoom: 1, pan: { x: 0, y: 0 } },
  panelState: 'collapsed',
  onboardingStatus:
    typeof window !== 'undefined' &&
    window.localStorage.getItem(STORAGE_KEYS.onboardingDismissed) === 'true'
      ? 'dismissed'
      : 'visible',
  searchOpen: false,
  projectOpen: false,
})
