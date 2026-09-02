import { useAtlas } from '../../hooks/useAtlas'
import { MinusIcon, PlusIcon, ResetIcon } from '../common/Icons'

export function BrainZoomControls() {
  const { state, dispatch } = useAtlas()

  return (
    <div className="zoom-controls" aria-label="Sterowanie widokiem">
      <button type="button" aria-label="Pomniejsz" disabled={state.viewport.zoom <= 1} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.viewport.zoom - 0.25 })}><MinusIcon /></button>
      <output aria-label="Poziom powiększenia">{Math.round(state.viewport.zoom * 100)}%</output>
      <button type="button" aria-label="Powiększ" disabled={state.viewport.zoom >= 4} onClick={() => dispatch({ type: 'SET_ZOOM', zoom: state.viewport.zoom + 0.25 })}><PlusIcon /></button>
      <button type="button" className="reset-control" onClick={() => dispatch({ type: 'RESET_VIEW' })}><ResetIcon /><span>Resetuj widok</span></button>
    </div>
  )
}
