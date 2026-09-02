import { useCallback, useMemo, useRef, useState } from 'react'
import { brainStructures } from '../../data/structures'
import { useAtlas } from '../../hooks/useAtlas'
import { useBrainNavigation } from '../../hooks/useBrainNavigation'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { searchStructures } from '../../utils/searchIndex'
import { getStructureName } from '../../utils/terminology'
import { CloseIcon, SearchIcon } from '../common/Icons'

export function SearchDialog() {
  const { state, dispatch } = useAtlas()
  const { selectStructure } = useBrainNavigation()
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => dispatch({ type: 'SET_SEARCH_OPEN', open: false }), [dispatch])
  useDialogFocus(dialogRef, close)

  const results = useMemo(
    () => query.trim() ? searchStructures(query).slice(0, 10) : brainStructures.slice(0, 6).map((structure) => ({ type: 'structure' as const, structure, score: 0, matchedOn: '' })),
    [query],
  )

  return (
    <div className="dialog-backdrop search-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div ref={dialogRef} className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
        <h2 id="search-title" className="visually-hidden">Szukaj w atlasie</h2>
        <div className="search-input-row">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nazwa polska, angielska, łacińska lub skrót…"
            aria-label="Szukaj struktur"
          />
          <button type="button" className="icon-button" onClick={close} aria-label="Zamknij wyszukiwanie">
            <CloseIcon />
          </button>
        </div>
        <div className="search-meta">
          <span>{query ? `Wyniki: ${results.length}` : 'Sugerowane struktury'}</span>
          <kbd>ESC</kbd>
        </div>
        <div className="search-results" aria-live="polite">
          <h3>Struktury</h3>
          {results.length ? results.map(({ structure, matchedOn }) => (
            <button
              type="button"
              key={structure.id}
              className="search-result"
              onClick={() => {
                close()
                selectStructure(structure.id)
              }}
            >
              <span>
                <strong>{getStructureName(structure, state.terminologyLanguage)}</strong>
                <small>{structure.names.en}{structure.names.abbreviation ? ` · ${structure.names.abbreviation}` : ''}</small>
              </span>
              {query && matchedOn && <em>Zgodność: {matchedOn}</em>}
            </button>
          )) : (
            <div className="search-empty">
              <p>Nie znaleziono struktury.</p>
              <span>Spróbuj nazwy angielskiej, łacińskiej albo skrótu.</span>
            </div>
          )}
        </div>
        <p className="search-scope-note">W kolejnych etapach wyszukiwarka obejmie także obwody, sieci, objawy i leczenie.</p>
      </div>
    </div>
  )
}
