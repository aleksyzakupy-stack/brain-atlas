import { structureById } from '../../data/structures'
import { useAtlas } from '../../hooks/useAtlas'
import { BrainMark, SearchIcon } from '../common/Icons'
import { StructureInfoContent } from './StructureInfoContent'

export function StructurePanel() {
  const { state, dispatch } = useAtlas()
  const selected = state.primarySelection?.type === 'structure'
    ? structureById[state.primarySelection.id]
    : undefined

  return (
    <aside className="structure-panel" aria-label="Informacje o strukturze">
      {selected ? (
        <StructureInfoContent key={selected.id} structure={selected} />
      ) : (
        <div className="panel-empty-state">
          <BrainMark />
          <span className="eyebrow">Atlas gotowy</span>
          <h2>Wybierz strukturę</h2>
          <p>Dotknij obszaru mózgu albo użyj wyszukiwarki, aby poznać jego funkcje i główne połączenia.</p>
          <button type="button" onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}>
            <SearchIcon /> Szukaj w atlasie
          </button>
        </div>
      )}
    </aside>
  )
}
