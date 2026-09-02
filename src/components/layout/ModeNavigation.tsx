import { useAtlas } from '../../hooks/useAtlas'

type ModeNavigationProps = {
  mobile?: boolean
}

export function ModeNavigation({ mobile = false }: ModeNavigationProps) {
  const { state } = useAtlas()

  return (
    <nav className={mobile ? 'mode-navigation mobile' : 'mode-navigation'} aria-label="Moduły atlasu">
      <button type="button" className="is-active" aria-current={state.currentMode === 'structures' ? 'page' : undefined}>
        <span>Struktury</span>
      </button>
      <button type="button" disabled aria-describedby={mobile ? undefined : 'circuits-status'}>
        <span>Obwody</span>
        {!mobile && <small id="circuits-status">W przygotowaniu</small>}
      </button>
      <button type="button" disabled aria-describedby={mobile ? undefined : 'networks-status'}>
        <span>Sieci</span>
        {!mobile && <small id="networks-status">W przygotowaniu</small>}
      </button>
    </nav>
  )
}
