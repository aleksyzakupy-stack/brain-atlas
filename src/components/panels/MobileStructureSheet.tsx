import { useRef } from 'react'
import { categoryById } from '../../data/categories'
import { structureById } from '../../data/structures'
import { useAtlas } from '../../hooks/useAtlas'
import { getStructureName } from '../../utils/terminology'
import { StructureInfoContent } from './StructureInfoContent'

export function MobileStructureSheet() {
  const { state, dispatch } = useAtlas()
  const dragStartY = useRef<number | null>(null)
  const selected = state.primarySelection?.type === 'structure'
    ? structureById[state.primarySelection.id]
    : undefined

  if (!selected) return null
  const category = categoryById[selected.categoryId]

  const cycleSheet = () => {
    const next = state.panelState === 'collapsed'
      ? 'medium'
      : state.panelState === 'medium' ? 'expanded' : 'medium'
    dispatch({ type: 'SET_PANEL_STATE', panelState: next })
  }

  return (
    <aside className={`mobile-structure-sheet is-${state.panelState}`} aria-label="Informacje o strukturze">
      <button
        type="button"
        className="sheet-handle-area"
        aria-label={state.panelState === 'expanded' ? 'Zwiń panel' : 'Rozwiń panel'}
        onClick={cycleSheet}
        onPointerDown={(event) => {
          dragStartY.current = event.clientY
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerUp={(event) => {
          if (dragStartY.current !== null && event.clientY - dragStartY.current > 48) {
            dispatch({
              type: 'SET_PANEL_STATE',
              panelState: state.panelState === 'expanded' ? 'medium' : 'collapsed',
            })
          }
          dragStartY.current = null
        }}
      >
        <span className="sheet-handle" />
      </button>

      {state.panelState === 'collapsed' ? (
        <div className="sheet-collapsed-copy">
          <span className="sheet-category-dot" style={{ background: category.color }} />
          <strong>{getStructureName(selected, state.terminologyLanguage)}</strong>
        </div>
      ) : state.panelState === 'medium' ? (
        <div className="sheet-medium-content">
          <StructureInfoContent key={selected.id} structure={selected} compact />
          <div className="sheet-quick-actions">
            <button type="button" onClick={() => dispatch({ type: 'SET_PANEL_STATE', panelState: 'expanded' })}>
              Pełny opis
            </button>
            <button type="button" onClick={() => dispatch({ type: 'RESET_VIEW' })}>
              Resetuj widok
            </button>
          </div>
        </div>
      ) : (
        <div className="sheet-expanded-content">
          <StructureInfoContent key={selected.id} structure={selected} />
        </div>
      )}
    </aside>
  )
}
