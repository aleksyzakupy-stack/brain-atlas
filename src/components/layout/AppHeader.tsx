import { BrainMark, InfoIcon, SearchIcon } from '../common/Icons'
import { useAtlas } from '../../hooks/useAtlas'
import { TerminologySwitch } from './TerminologySwitch'

export function AppHeader() {
  const { dispatch } = useAtlas()

  return (
    <header className="app-header">
      <a className="brand" href="#/" aria-label="Atlas mózgu w psychiatrii — strona główna">
        <span className="brand-mark"><BrainMark /></span>
        <span className="brand-copy">
          <strong>Atlas mózgu w psychiatrii</strong>
          <small>Interaktywny atlas neuroanatomii funkcjonalnej</small>
        </span>
      </a>

      <div className="header-actions">
        <button
          type="button"
          className="search-trigger"
          onClick={() => dispatch({ type: 'SET_SEARCH_OPEN', open: true })}
          aria-label="Otwórz wyszukiwanie"
        >
          <SearchIcon />
          <span className="search-placeholder">Szukaj struktur…</span>
          <kbd>⌘ K</kbd>
        </button>
        <TerminologySwitch />
        <label className="view-selector">
          <span>Widok</span>
          <select defaultValue="lateral" aria-label="Wybierz widok mózgu">
            <option value="lateral">Boczny</option>
            <option value="medial" disabled>Przyśrodkowy — w przygotowaniu</option>
            <option value="sagittal" disabled>Strzałkowy — w przygotowaniu</option>
            <option value="coronal" disabled>Czołowy — w przygotowaniu</option>
          </select>
        </label>
        <button
          type="button"
          className="about-button"
          onClick={() => dispatch({ type: 'SET_PROJECT_OPEN', open: true })}
        >
          <InfoIcon />
          <span>O projekcie</span>
        </button>
      </div>
    </header>
  )
}
