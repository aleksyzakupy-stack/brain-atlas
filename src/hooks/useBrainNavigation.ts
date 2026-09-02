import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { structureById } from '../data/structures'
import { getBrainAnchor } from '../geometry/brainAnchors'
import { lateralGeometryById } from '../geometry/lateralGeometry'
import { structurePath } from '../utils/routeHelpers'
import { useAtlas } from './useAtlas'

export const viewportForStructure = (structureId: string, zoomOverride?: number) => {
  const anchor = getBrainAnchor(structureId)
  const zoom = zoomOverride ?? anchor.zoom
  return {
    zoom,
    pan: {
      x: 450 - anchor.x * zoom,
      y: 310 - anchor.y * zoom,
    },
  }
}

export const useBrainNavigation = () => {
  const { state, dispatch } = useAtlas()
  const navigate = useNavigate()

  const revealHierarchyFor = useCallback(
    (structureId: string) => {
      const structure = structureById[structureId]
      const parent = structure?.parentId ? structureById[structure.parentId] : undefined
      if (structure && !structure.displayAtBaseLevel && parent) {
        dispatch({ type: 'SET_ANATOMY_DEPTH', depth: parent.depth, focusId: parent.id })
      } else if (
        structure?.displayAtBaseLevel &&
        state.anatomyFocusId &&
        structure.id !== state.anatomyFocusId &&
        structure.parentId !== state.anatomyFocusId
      ) {
        dispatch({ type: 'SET_ANATOMY_DEPTH', depth: 0, focusId: null })
      }
      if (
        lateralGeometryById[structureId]?.layer === 'deep' &&
        !state.activeLayerIds.includes('deep-anatomy')
      ) {
        dispatch({ type: 'TOGGLE_LAYER', layerId: 'deep-anatomy' })
      }
    },
    [dispatch, state.activeLayerIds, state.anatomyFocusId],
  )

  const selectStructure = useCallback(
    (structureId: string, options: { zoom?: boolean; replace?: boolean } = {}) => {
      const structure = structureById[structureId]
      if (!structure) return
      revealHierarchyFor(structureId)
      dispatch({ type: 'SELECT_STRUCTURE', structureId })
      if (options.zoom !== false) {
        dispatch({ type: 'SET_VIEWPORT', viewport: viewportForStructure(structureId) })
      }
      navigate(structurePath(structureId), { replace: options.replace })
    },
    [dispatch, navigate, revealHierarchyFor],
  )

  const deselectStructure = useCallback(() => {
    dispatch({ type: 'DESELECT' })
    navigate('/')
  }, [dispatch, navigate])

  const enterStructure = useCallback(
    (structureId: string) => {
      const structure = structureById[structureId]
      if (!structure?.childrenIds.length) return
      dispatch({ type: 'SET_ANATOMY_DEPTH', depth: structure.depth, focusId: structureId })
      dispatch({ type: 'SET_VIEWPORT', viewport: viewportForStructure(structureId, 2.15) })
    },
    [dispatch],
  )

  const zoomToStructure = useCallback(
    (structureId: string, zoom = 3.05) => {
      dispatch({ type: 'SET_VIEWPORT', viewport: viewportForStructure(structureId, zoom) })
    },
    [dispatch],
  )

  const goUp = useCallback(() => {
    const focus = state.anatomyFocusId ? structureById[state.anatomyFocusId] : undefined
    const parent = focus?.parentId ? structureById[focus.parentId] : undefined
    if (parent?.childrenIds.length) {
      dispatch({ type: 'SET_ANATOMY_DEPTH', depth: parent.depth, focusId: parent.id })
      dispatch({ type: 'SET_VIEWPORT', viewport: viewportForStructure(parent.id, 1.8) })
      return
    }
    dispatch({ type: 'SET_ANATOMY_DEPTH', depth: 0, focusId: null })
    dispatch({ type: 'RESET_VIEW' })
  }, [dispatch, state.anatomyFocusId])

  return { selectStructure, deselectStructure, enterStructure, goUp, zoomToStructure }
}
