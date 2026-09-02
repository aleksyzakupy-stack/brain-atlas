import { useEffect } from 'react'
import { HashRouter, Route, Routes, useParams } from 'react-router-dom'
import { BrainCanvas } from '../components/brain/BrainCanvas'
import { AppHeader } from '../components/layout/AppHeader'
import { ModeNavigation } from '../components/layout/ModeNavigation'
import { ProjectDialog } from '../components/layout/ProjectDialog'
import { StructureExplorer } from '../components/layout/StructureExplorer'
import { MobileStructureSheet } from '../components/panels/MobileStructureSheet'
import { StructurePanel } from '../components/panels/StructurePanel'
import { SearchDialog } from '../components/search/SearchDialog'
import { OnboardingDialog } from '../components/onboarding/OnboardingDialog'
import { structureBySlug } from '../data/structures'
import { useAtlas } from '../hooks/useAtlas'
import { viewportForStructure } from '../hooks/useBrainNavigation'
import { AtlasProvider } from './AtlasProvider'

function AppFrame() {
  const { state, dispatch } = useAtlas()

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        dispatch({ type: 'SET_SEARCH_OPEN', open: true })
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [dispatch])

  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#/"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('atlas')?.focus()
        }}
      >
        Przejdź do atlasu
      </a>
      <AppHeader />
      <div className="atlas-workspace">
        <StructureExplorer />
        <BrainCanvas />
        <StructurePanel />
      </div>
      <ModeNavigation mobile />
      <MobileStructureSheet />
      {state.searchOpen && <SearchDialog />}
      {state.projectOpen && <ProjectDialog />}
      {state.onboardingStatus === 'visible' && <OnboardingDialog />}
    </div>
  )
}

function StructureRoute() {
  const { slug } = useParams()
  const { dispatch } = useAtlas()
  const structure = slug ? structureBySlug[slug] : undefined

  useEffect(() => {
    if (!structure) return
    dispatch({ type: 'SELECT_STRUCTURE', structureId: structure.id })
    if (!structure.displayAtBaseLevel && structure.parentId) {
      dispatch({ type: 'SET_ANATOMY_DEPTH', depth: Math.max(1, structure.depth - 1), focusId: structure.parentId })
    }
    dispatch({ type: 'SET_VIEWPORT', viewport: viewportForStructure(structure.id) })
  }, [dispatch, structure])

  if (!structure) return <NotFound />
  return <AppFrame />
}

function AtlasRootRoute() {
  const { dispatch } = useAtlas()

  useEffect(() => {
    dispatch({ type: 'DESELECT' })
    dispatch({ type: 'RESET_VIEW' })
  }, [dispatch])

  return <AppFrame />
}

function NotFound() {
  return (
    <main className="not-found">
      <span>404 · Nieznana struktura</span>
      <h1>Ta ścieżka nie istnieje w atlasie.</h1>
      <p>Sprawdź adres albo wróć do bocznego widoku mózgu.</p>
      <a href="#/">Wróć do atlasu</a>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AtlasRootRoute />} />
      <Route path="/struktury/:slug" element={<StructureRoute />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export function App() {
  return (
    <HashRouter>
      <AtlasProvider>
        <AppRoutes />
      </AtlasProvider>
    </HashRouter>
  )
}
