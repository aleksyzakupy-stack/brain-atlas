import { useAtlas } from '../../hooks/useAtlas'
import { useBrainNavigation } from '../../hooks/useBrainNavigation'
import { LayersIcon } from '../common/Icons'

export function BrainToolbar() {
  const { state, dispatch } = useAtlas()
  const { goUp } = useBrainNavigation()
  const deepVisible = state.activeLayerIds.includes('deep-anatomy')

  return (
    <div className="brain-toolbar">
      <div className="view-chip"><span>Widok</span><strong>Boczny</strong></div>
      <button
        type="button"
        className={`layer-toggle ${deepVisible ? 'is-active' : ''}`}
        aria-pressed={deepVisible}
        onClick={() => dispatch({ type: 'TOGGLE_LAYER', layerId: 'deep-anatomy' })}
      >
        <LayersIcon />
        <span>Warstwa głęboka</span>
      </button>
      {state.anatomyFocusId && (
        <button type="button" className="level-up-button" onClick={goUp}>← Wróć poziom wyżej</button>
      )}
    </div>
  )
}
