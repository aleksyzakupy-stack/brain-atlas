import { useAtlas } from '../../hooks/useAtlas'

export function ProjectFooter() {
  const { dispatch } = useAtlas()

  return (
    <footer className="project-footer">
      <div>
        <strong>Atlas mózgu w psychiatrii</strong>
        <span>Projekt edukacyjny</span>
      </div>
      <p>lek. Aleksy Kasperowicz<br />specjalista psychiatra</p>
      <nav aria-label="Informacje o projekcie">
        <button type="button" onClick={() => dispatch({ type: 'SET_PROJECT_OPEN', open: true })}>O projekcie</button>
        <span title="Moduł w przygotowaniu">Metodologia</span>
        <span title="Moduł w przygotowaniu">Źródła</span>
        <span title="Adres repozytorium zostanie dodany po publikacji">GitHub</span>
      </nav>
    </footer>
  )
}
