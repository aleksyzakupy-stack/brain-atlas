import type { AtlasState } from './atlasState'
import type {
  AtlasMode,
  BrainViewId,
  OverlayLayerId,
  PanelState,
  TerminologyLanguage,
  ViewportState,
} from '../types/atlas'

export type AtlasAction =
  | { type: 'SET_MODE'; mode: AtlasMode }
  | { type: 'SET_TERMINOLOGY'; language: TerminologyLanguage }
  | { type: 'SET_BRAIN_VIEW'; view: BrainViewId }
  | { type: 'SELECT_STRUCTURE'; structureId: string }
  | { type: 'DESELECT' }
  | { type: 'TOGGLE_LAYER'; layerId: OverlayLayerId }
  | { type: 'SET_ZOOM'; zoom: number }
  | { type: 'SET_VIEWPORT'; viewport: ViewportState }
  | { type: 'PAN_BY'; dx: number; dy: number }
  | { type: 'RESET_VIEW' }
  | { type: 'SET_PANEL_STATE'; panelState: PanelState }
  | { type: 'SET_ANATOMY_DEPTH'; depth: number; focusId?: string | null }
  | { type: 'DISMISS_ONBOARDING' }
  | { type: 'SET_SEARCH_OPEN'; open: boolean }
  | { type: 'SET_PROJECT_OPEN'; open: boolean }

const clampZoom = (zoom: number) => Math.min(4, Math.max(1, zoom))

export const atlasReducer = (state: AtlasState, action: AtlasAction): AtlasState => {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, currentMode: action.mode }
    case 'SET_TERMINOLOGY':
      return { ...state, terminologyLanguage: action.language }
    case 'SET_BRAIN_VIEW':
      return { ...state, currentBrainView: action.view }
    case 'SELECT_STRUCTURE':
      return {
        ...state,
        primarySelection: { type: 'structure', id: action.structureId },
        panelState: state.panelState === 'expanded' ? 'expanded' : 'medium',
      }
    case 'DESELECT':
      return { ...state, primarySelection: null, panelState: 'collapsed' }
    case 'TOGGLE_LAYER':
      return {
        ...state,
        activeLayerIds: state.activeLayerIds.includes(action.layerId)
          ? state.activeLayerIds.filter((id) => id !== action.layerId)
          : [...state.activeLayerIds, action.layerId],
      }
    case 'SET_ZOOM':
      return { ...state, viewport: { ...state.viewport, zoom: clampZoom(action.zoom) } }
    case 'SET_VIEWPORT':
      return {
        ...state,
        viewport: { ...action.viewport, zoom: clampZoom(action.viewport.zoom) },
      }
    case 'PAN_BY':
      return {
        ...state,
        viewport: {
          ...state.viewport,
          pan: {
            x: state.viewport.pan.x + action.dx,
            y: state.viewport.pan.y + action.dy,
          },
        },
      }
    case 'RESET_VIEW':
      return {
        ...state,
        viewport: { zoom: 1, pan: { x: 0, y: 0 } },
        anatomyDepth: 0,
        anatomyFocusId: null,
      }
    case 'SET_PANEL_STATE':
      return { ...state, panelState: action.panelState }
    case 'SET_ANATOMY_DEPTH':
      return {
        ...state,
        anatomyDepth: Math.max(0, action.depth),
        anatomyFocusId: action.focusId === undefined ? state.anatomyFocusId : action.focusId,
      }
    case 'DISMISS_ONBOARDING':
      return { ...state, onboardingStatus: 'dismissed' }
    case 'SET_SEARCH_OPEN':
      return { ...state, searchOpen: action.open }
    case 'SET_PROJECT_OPEN':
      return { ...state, projectOpen: action.open }
    default:
      return state
  }
}
