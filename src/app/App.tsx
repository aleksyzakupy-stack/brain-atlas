import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { HashRouter, Link, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AtlasScene } from '../components/brain/AtlasScene'
import { SearchIcon } from '../components/common/Icons'
import { AboutAtlas, AtlasDialog, AtlasSearch } from '../components/layout/AtlasDialog'
import { AnatomicalDirectory } from '../components/layout/AnatomicalDirectory'
import { TerminologySwitch } from '../components/layout/TerminologySwitch'
import { LessonContent, StructureContent } from '../components/panels/AtlasContent'
import { categoryById, functionalCategories } from '../data/categories'
import { learningPathBySlug, learningPaths } from '../data/learningPaths'
import { brainStructures, structureById } from '../data/structures'
import { preferredView } from '../geometry/atlasGeometry'
import { useAtlas } from '../hooks/useAtlas'
import { useLearningProgress } from '../hooks/useLearningProgress'
import type { AtlasView } from '../types/atlas'
import { lessonUrl, validReturnPath } from '../utils/learningProgress'
import { getStructureName } from '../utils/terminology'
import { AtlasProvider } from './AtlasProvider'
import { atlasRegionById, atlasRegions, matchesRegion, regionUrl, regionsForMode } from '../data/anatomicalAtlas'
import type { AtlasMode } from '../data/anatomicalAtlas'
import { brainCircuits, circuitById, circuitGroups } from '../data/circuits'
import { brodmannByNumber, brodmannDescriptions } from '../data/brodmann'
import { normalizeSearch } from '../utils/normalizeSearch'
import { LessonPathwayScene, PathwayScene } from '../components/brain/PathwayScene'
import { BrodmannPage, RegionContent } from '../components/panels/BrodmannContent'

function Workspace() {
  const location = useLocation(), navigate = useNavigate()
  const lessonMatch = useMatch('/nauka/:slug/:stepId'), structureMatch = useMatch('/struktury/:slug')
  const circuitMatch = useMatch('/szlaki/:id'), baMatch = useMatch('/pola/:number')
  const circuit = circuitById[circuitMatch?.params.id ?? '']
  const baNumber = baMatch && /^\d+$/.test(baMatch.params.number ?? '') ? Number(baMatch.params.number) : undefined
  const baDescription = baNumber ? brodmannByNumber[baNumber] : undefined
  const path = lessonMatch ? learningPaths.find(item => item.slug === lessonMatch.params.slug) : undefined
  const step = path?.steps.find(item => item.id === lessonMatch?.params.stepId)
  const structure = structureMatch ? brainStructures.find(item => item.slug === structureMatch.params.slug) : undefined
  const query = new URLSearchParams(location.search)
  const region = location.pathname === '/atlas' ? atlasRegionById[query.get('obszar') ?? ''] : undefined
  const atlasMode: AtlasMode = baDescription || region?.atlas === 'brodmann' || query.get('warstwa') === 'brodmann' ? 'brodmann' : 'anatomy'
  const [regionQuery, setRegionQuery] = useState('')
  const [circuitQuery, setCircuitQuery] = useState('')
  const [functionalIndex, setFunctionalIndex] = useState(false)
  const anatomicalIndex = !step && !structure && !functionalIndex && !circuit
  const { state } = useAtlas()
  const { progress, complete } = useLearningProgress(step ? path?.slug : undefined, step?.id)
  const [viewOverride, setViewOverride] = useState<{ route: string; view: AtlasView } | null>(null)
  const [searchOpen, setSearchOpen] = useState(false), [aboutOpen, setAboutOpen] = useState(false), [drawerOpen, setDrawerOpen] = useState(false)
  const [mobilePane, setMobilePane] = useState<'diagram' | 'description'>('diagram')
  const [category, setCategory] = useState('all')
  const [focusMode, setFocusMode] = useState(false)
  const [closedReading, setClosedReading] = useState<string | null>(null)
  const readingKey = `${location.pathname}${location.search}`
  const hasReading = !!(step || structure || region || baDescription)
  const showReading = hasReading && closedReading !== readingKey
  const closeSearch = useCallback(() => setSearchOpen(false), [setSearchOpen]), closeAbout = useCallback(() => setAboutOpen(false), [setAboutOpen]), closeDrawer = useCallback(() => setDrawerOpen(false), [setDrawerOpen])
  const home = location.pathname === '/'
  const valid = home || location.pathname === '/atlas' || !!structure || !!step || !!circuit || !!baDescription
  const returnTo = circuit ? `/szlaki/${circuit.id}` : step && path ? lessonUrl(path.slug, step.id) : validReturnPath(new URLSearchParams(location.search).get('powrot'))
  const view = viewOverride?.route === location.pathname ? viewOverride.view : step?.view ?? (structure ? preferredView(structure.id) : 'lateral')
  const selectedId = region?.id ?? structure?.id
  const index = path && step ? path.steps.indexOf(step) : 0
  const completedPath = learningPathBySlug[new URLSearchParams(location.search).get('ukonczono') ?? '']
  const showCompletion = completedPath && progress.completed[completedPath.slug]?.length === 6
  const anyModal = searchOpen || aboutOpen || drawerOpen
  const language = state.terminologyLanguage

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('[role="dialog"]') && !(event.target instanceof HTMLElement && event.target.closest('details[open]'))) setFocusMode(false)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !document.querySelector('[role="dialog"]')) { event.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [location.pathname])
  useEffect(() => { document.title = `${circuit?.names.pl ?? baDescription?.title ?? step?.title ?? region?.names.pl ?? structure?.names.pl ?? 'Mózg w psychiatrii'} · Neuroatlas` }, [circuit?.names.pl, baDescription?.title, step?.title, structure?.names.pl, region?.names.pl])

  function select(id: string, keepModel = false) {
    const parcel = atlasRegionById[id]
    if (parcel) {
      navigate(regionUrl(parcel) + (returnTo ? `&powrot=${encodeURIComponent(returnTo)}` : ''))
      setMobilePane(keepModel ? 'diagram' : 'description')
      setDrawerOpen(false)
      return
    }
    const target = structureById[id]
    if (!target) return
    navigate(`/struktury/${target.slug}${returnTo ? `?powrot=${encodeURIComponent(returnTo)}` : ''}`)
    setMobilePane(keepModel ? 'diagram' : 'description')
    setDrawerOpen(false)
  }
  const changeAtlas = (mode: AtlasMode) => { navigate(`/atlas?warstwa=${mode}`); setFunctionalIndex(false); setRegionQuery('') }
  const sidebar = step && path ? <>
    <Link className="back-to-paths" to="/">← Wszystkie trasy</Link>
    <h2>{path.title}</h2>
    <nav className="step-list" aria-label="Kroki trasy">{path.steps.map((item, itemIndex) => <Link key={item.id} to={lessonUrl(path.slug, item.id)} onClick={closeDrawer} aria-current={item.id === step.id ? 'step' : undefined}><span className={`step-count ${progress.completed[path.slug]?.includes(item.id) ? 'is-complete' : ''}`}>{progress.completed[path.slug]?.includes(item.id) ? '✓' : `0${itemIndex + 1}`}</span><span>{item.stage}<small>{item.title}</small></span></Link>)}</nav>
    <div className="learning-progress"><span>{progress.completed[path.slug]?.length ?? 0} z 6 kroków ukończonych</span><progress max={6} value={progress.completed[path.slug]?.length ?? 0} aria-label="Postęp trasy" /></div>
  </> : circuit ? <>
    <h2>Szlaki i obwody</h2>
    <input className="region-filter" aria-label="Filtruj szlaki" placeholder="Nazwa, przekaźnik…" value={circuitQuery} onChange={event => setCircuitQuery(event.target.value)} />
    <nav className="structure-directory" aria-label="Szlaki i obwody">{Object.entries(circuitGroups).map(([group, label]) => {
      const items = brainCircuits.filter(item => item.group === group && normalizeSearch([item.names.pl,item.names.en,item.transmitter,item.summary].join(' ')).includes(normalizeSearch(circuitQuery)))
      return items.length ? <section key={group}><h3 className="circuit-directory-group">{label}</h3>{items.map(item => <button key={item.id} aria-current={circuit.id === item.id ? 'page' : undefined} onClick={() => { navigate(`/szlaki/${item.id}`); setMobilePane('diagram'); closeDrawer() }}><span>{language === 'en' ? item.names.en : item.names.pl}</span></button>)}</section> : null
    })}</nav>
  </> : <>
    <h2>Struktury mózgu</h2>
    <div className="atlas-index-switch"><button aria-pressed={anatomicalIndex && atlasMode === 'anatomy'} onClick={() => changeAtlas('anatomy')}>Anatomia</button><button aria-pressed={anatomicalIndex && atlasMode === 'brodmann'} onClick={() => changeAtlas('brodmann')}>Brodmann</button><button aria-pressed={!anatomicalIndex} onClick={() => setFunctionalIndex(true)}>Funkcje</button></div>
    {anatomicalIndex ? <>
      <input className="region-filter" aria-label="Filtruj obszary atlasu" placeholder="Nazwa lub BA…" value={regionQuery} onChange={event => setRegionQuery(event.target.value)} />
      <AnatomicalDirectory regions={regionsForMode(atlasMode).filter(item=>matchesRegion(item,regionQuery))} selectedId={selectedId} searching={!!regionQuery.trim()} language={language} onSelect={select} />
      {(atlasMode === 'brodmann' || baDescription) && <nav className="structure-directory" aria-label="Pola bez parceli 3D">{brodmannDescriptions.filter(item => !atlasRegions.some(region => region.atlas === 'brodmann' && region.number === item.number) && matchesRegion({ ...atlasRegions.find(region => region.atlas === 'brodmann')!, number: item.number, names: { pl: `Pole Brodmanna ${item.number} ${item.title}`, en: `Brodmann area ${item.number}`, lat: `Area Brodmann ${item.number}` }, sourceRegion: `Brodmann.${item.number}` }, regionQuery)).map(item => <button className="text-only-ba" key={item.number} aria-current={baNumber === item.number ? 'page' : undefined} onClick={() => { navigate(`/pola/${item.number}`); setMobilePane('description'); closeDrawer() }}><span>BA {item.number} · {item.title}</span><small>Opis</small></button>)}</nav>}
    </> : <>
      <label className="category-filter">Obszar funkcjonalny<select value={category} onChange={event => setCategory(event.target.value)}><option value="all">Wszystkie obszary</option>{functionalCategories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      <nav className="structure-directory" aria-label="Struktury mózgu">{brainStructures.filter(item => category === 'all' || item.categoryId === category).map(item => <button key={item.id} onClick={() => select(item.id)} aria-current={selectedId === item.id ? 'page' : undefined} style={{ '--category': categoryById[item.categoryId].color } as CSSProperties}><span className="category-dot" /><span>{getStructureName(item, language)}</span>{item.names.abbreviation && <small>{item.names.abbreviation}</small>}</button>)}</nav>
    </>}
  </>

  return <><div className={`app-shell ${focusMode ? 'is-focused' : ''}`} inert={anyModal}>
    <a className="skip-link" href="#main" onClick={event => { event.preventDefault(); document.getElementById('main')?.focus() }}>Przejdź do treści</a>
    <header className="app-header">
      {!home && <button className="directory-trigger" onClick={() => setDrawerOpen(true)} aria-label={step ? 'Kroki trasy' : circuit ? 'Lista szlaków' : 'Lista struktur'}>☰</button>}
      <nav className="mode-nav" aria-label="Główna nawigacja"><Link to="/" aria-current={home || !!step ? 'page' : undefined}>Nauka</Link><Link to="/atlas" aria-current={!home && !step && !circuit ? 'page' : undefined}>Atlas</Link><Link to="/szlaki/mesolimbic" aria-current={circuit ? 'page' : undefined}>Szlaki</Link></nav>
      <div className="header-tools"><button className="search-trigger" onClick={() => setSearchOpen(true)} aria-label="Szukaj w atlasie" title="Szukaj (⌘K / Ctrl+K)"><SearchIcon /></button>
        <details className="app-menu" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}><summary aria-label="Menu atlasu">⋯</summary><div className="app-menu-panel"><span>Terminologia</span><TerminologySwitch /><button onClick={event => { event.currentTarget.closest('details')!.open = false; setFocusMode(true) }}>Skupienie</button><button onClick={event => { event.currentTarget.closest('details')!.open = false; setAboutOpen(true) }}>O atlasie i źródłach</button></div></details>
      </div>
    </header>
    {focusMode && <button className="exit-focus" onClick={() => setFocusMode(false)}>↙ Wyjdź ze skupienia</button>}

    {!valid ? <main className="not-found" id="main" tabIndex={-1}><span>404</span><h1>Ta ścieżka nie istnieje w atlasie.</h1><Link className="primary-button" to="/atlas">Wróć do atlasu</Link></main> : home ? <main id="main" tabIndex={-1} className="learning-home">
      {showCompletion && <div className="completion-notice" role="status">✓ Trasa „{completedPath.title}” ukończona.</div>}
      <div className="home-grid"><div className="home-brain"><AtlasScene view={view} onView={next => setViewOverride({ route: location.pathname, view: next })} language={language} atlasMode={atlasMode} onSelect={select} onSelect3d={id => select(id, true)} /><div className="home-brain-caption"><Link to="/atlas">Otwórz pełny atlas ↗</Link></div></div>
        <section className="path-selection"><div className="section-heading"><h2>Trasy nauki</h2></div>{learningPaths.map(item => {
          const done = progress.completed[item.slug]?.length ?? 0
          return <Link className="path-card" key={item.slug} to={lessonUrl(item.slug, item.steps[0].id)} style={{ '--category': categoryById[item.categoryId].color } as CSSProperties}><div className="path-card-top"><span>{item.minutes} min</span>{done > 0 && <span className="path-done">{done}/6 ✓</span>}</div><h3>{item.title}</h3><span className="path-card-arrow" aria-hidden="true">↗</span></Link>
        })}</section></div>
    </main> : <>
      {hasReading && <div className="mobile-view-switch" role="group" aria-label="Widok treści"><button aria-pressed={mobilePane === 'diagram'} onClick={() => setMobilePane('diagram')}>Mózg</button><button aria-pressed={mobilePane === 'description'} onClick={() => { setClosedReading(null); setMobilePane('description') }}>Opis</button></div>}

      <main id="main" tabIndex={-1} className={`atlas-workspace mobile-${hasReading ? mobilePane : 'diagram'} ${step ? 'is-learning' : ''} ${showReading ? '' : 'without-reading'}`}>
        <aside className="workspace-sidebar">{sidebar}</aside>
        <div className="workspace-scene">{!showReading && hasReading && <button className="reopen-reading text-button" onClick={() => { setClosedReading(null); setMobilePane('description') }}>Pokaż opis ↗</button>}{!hasReading && !circuit && <div className="atlas-empty-heading"><h1>{atlasMode === 'brodmann' ? 'Pola Brodmanna' : 'Anatomia mózgu'}</h1></div>}{circuit ? <PathwayScene key={circuit.id} initialClinical={query.get('stan') === 'schizofrenia'} circuit={circuit} language={language} onSelect={select} /> : step?.circuitIds?.length ? <LessonPathwayScene key={`${path?.slug}-${step.id}`} ids={step.circuitIds} language={language} onSelect={select} /> : baNumber && baDescription ? <AtlasScene view={view} onView={next => setViewOverride({ route: location.pathname, view: next })} language={language} selectedId={atlasRegions.find(item => item.number === baNumber && item.hemisphere === 'left')?.id} atlasMode="brodmann" onSelect={select} /> : <AtlasScene key={step ? `${path?.slug}-${step.id}` : 'atlas'} view={view} onView={next => setViewOverride({ route: location.pathname, view: next })} selectedId={selectedId} step={step} language={language} atlasMode={step?.brodmannNumbers?.length ? 'brodmann' : atlasMode} onSelect={select} onSelect3d={id => select(id, true)} />}</div>
        <aside className="workspace-reading" key={location.pathname} aria-label="Opis" hidden={!showReading}><button className="close-reading" aria-label="Zamknij opis" onClick={() => { setClosedReading(readingKey); setMobilePane('diagram') }}>×</button>{baDescription && baNumber ? <BrodmannPage number={baNumber} /> : step && path ? <LessonContent path={path} step={step} language={language} onSelect={select} /> : structure ? <StructureContent key={structure.id} structure={structure} language={language} onSelect={select} returnTo={returnTo} /> : region ? <RegionContent region={region} language={language} onSelect={id => select(id,true)} /> : null}</aside>
      </main>
      {path && step && <footer className="lesson-navigation"><Link className="secondary-button" to={index === 0 ? '/' : lessonUrl(path.slug, path.steps[index - 1].id)}>← Wstecz</Link><span><strong>{index + 1} / 6</strong><small>{step.stage}</small></span><button className="primary-button" onClick={() => { complete(path.slug, step.id); navigate(index === 5 ? `/?ukonczono=${path.slug}` : lessonUrl(path.slug, path.steps[index + 1].id)) }}>{index === 5 ? 'Zakończ trasę' : 'Dalej'} →</button></footer>}
      {returnTo && !step && !circuit && <div className="lesson-return-bar"><Link to={returnTo}>← {returnTo.startsWith('/szlaki/') ? `Wróć do szlaku · ${circuitById[returnTo.split('/')[2]]?.names.pl}` : `Wróć do lekcji · ${learningPathBySlug[returnTo.split('/')[2]]?.title}`}</Link></div>}
    </>}
    {home && <footer className="home-footer"><button className="text-button" onClick={() => setAboutOpen(true)}>O atlasie i źródłach ↗</button></footer>}
  </div>
    {searchOpen && <AtlasSearch onClose={closeSearch} returnTo={returnTo} />}
    {aboutOpen && <AboutAtlas onClose={closeAbout} />}
    {drawerOpen && <AtlasDialog title={step ? 'Kroki trasy' : 'Struktury mózgu'} onClose={closeDrawer} className="directory-drawer">{sidebar}</AtlasDialog>}
  </>
}

export function App() { return <HashRouter><AtlasProvider><Workspace /></AtlasProvider></HashRouter> }
