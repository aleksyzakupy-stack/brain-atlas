import type {
  AtlasMode,
  BrainViewId,
  OverlayLayerId,
  PanelState,
  PrimarySelection,
  TerminologyLanguage,
  ViewportState,
} from '../types/atlas'
import { readStorage } from '../utils/storage'

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
  const stored = readStorage(STORAGE_KEYS.terminology)
  return stored === 'en' || stored === 'la' ? stored : 'pl'
}

const readStoredView = (): BrainViewId => {
  if (typeof window === 'undefined') return 'lateral'
  const view = readStorage(STORAGE_KEYS.brainView)
  return view === 'medial' || view === 'deep' ? view : 'lateral'
}

export const createInitialAtlasState = (): AtlasState => ({
  currentMode: 'structures',
  terminologyLanguage: readStoredTerminology(),
  currentBrainView: readStoredView(),
  primarySelection: null,
  activeLayerIds: [],
  anatomyDepth: 0,
  anatomyFocusId: null,
  viewport: { zoom: 1, pan: { x: 0, y: 0 } },
  panelState: 'collapsed',
  onboardingStatus:
    typeof window !== 'undefined' &&
    readStorage(STORAGE_KEYS.onboardingDismissed) === 'true'
      ? 'dismissed'
      : 'visible',
  searchOpen: false,
  projectOpen: false,
})
