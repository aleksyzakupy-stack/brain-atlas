import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HashRouter, Link, useLocation, useMatch, useNavigate } from 'react-router-dom'
import { AtlasScene } from '../components/brain/AtlasScene'
import { SearchIcon, FullscreenIcon, ConnectionsIcon } from '../components/common/Icons'
import { AtlasSearch } from '../components/layout/AtlasDialog'
import { AtlasSidePanel } from '../components/layout/AtlasSidePanel'
import { TerminologySwitch } from '../components/layout/TerminologySwitch'
import { StructureContent } from '../components/panels/AtlasContent'
import { brainStructures, structureById } from '../data/structures'
import { preferredView } from '../geometry/atlasGeometry'
import { useAtlas } from '../hooks/useAtlas'
import type { AtlasView } from '../types/atlas'
import { validReturnPath } from '../utils/learningProgress'
import { AtlasProvider } from './AtlasProvider'
import { FullscreenProvider } from './FullscreenProvider'
import { useAtlasFullscreen } from '../hooks/useAtlasFullscreen'
import { atlasRegionById, atlasRegions, regionUrl } from '../data/anatomicalAtlas'
import type { AtlasMode } from '../data/anatomicalAtlas'
import { circuitById } from '../data/circuits'
import { brodmannByNumber } from '../data/brodmann'
import { PathwayScene } from '../components/brain/PathwayScene'
import { PathwayContent } from '../components/panels/PathwayContent'
import { BrodmannPage, RegionContent } from '../components/panels/BrodmannContent'
import { ConnectionContent, ConnectionExamples } from '../components/panels/ConnectionContent'
import { connectionExamplesForSelection, isConnectionExample, linksForStructure, connectedStructureIds, structureConnectionUrl } from '../data/structureConnections'
import { NeuroArticle } from '../components/neuroanatomy/NeuroArticle'
import { NeuroCatalog } from '../components/neuroanatomy/NeuroCatalog'
import { NeuroGuide } from '../components/neuroanatomy/NeuroGuide'
import { neuroEntryById, neuroEntryName } from '../data/neuroanatomy'

function Workspace() {
  const location = useLocation(), navigate = useNavigate()
  const connectionMatch = useMatch('/polaczenia/:id')
  const connectionId = connectionMatch?.params.id
  const connectionRoot = connectionId && isConnectionExample(connectionId) ? connectionId : undefined
  const connectionsCatalog = location.pathname==='/polaczenia'
  const structureMatch = useMatch('/struktury/:slug'), articleMatch = useMatch('/kompendium/:id')
  const circuitMatch = useMatch('/szlaki/:id'), baMatch = useMatch('/pola/:number')
  const article = neuroEntryById[articleMatch?.params.id ?? '']
  const catalog = location.pathname === '/kompendium', guide = location.pathname === '/przewodnik'
  const circuit = circuitById[circuitMatch?.params.id ?? article?.projectCircuitIds[0] ?? '']
  const baNumber = baMatch && /^\d+$/.test(baMatch.params.number ?? '') ? Number(baMatch.params.number) : undefined
  const baDescription = baNumber ? brodmannByNumber[baNumber] : undefined
  const structure = structureMatch ? brainStructures.find(item=>item.slug===structureMatch.params.slug) : undefined
  const query = new URLSearchParams(location.search)
  const requestedConnectionRegion = connectionRoot ? atlasRegionById[query.get('obszar') ?? ''] : undefined
  const connectionRegion = requestedConnectionRegion && connectionExamplesForSelection(requestedConnectionRegion.id).includes(connectionRoot!) ? requestedConnectionRegion : undefined
  const region = location.pathname === '/atlas' ? atlasRegionById[query.get('obszar') ?? ''] : undefined
  const atlasMode: AtlasMode = baDescription || connectionRegion?.atlas === 'brodmann' || region?.atlas === 'brodmann' || article?.category === 'brodmann' || query.get('warstwa') === 'brodmann' ? 'brodmann' : 'anatomy'
  const { state } = useAtlas()
  const { fullscreen,toggleFullscreen } = useAtlasFullscreen()
  const [viewOverride,setViewOverride] = useState<{route:string;view:AtlasView} | null>(null)
  const [searchOpen,setSearchOpen] = useState(false)
  const playerCloser = useRef<(() => void) | null>(null)
  const registerPlayerCloser = useCallback((close: (() => void) | null) => {playerCloser.current=close},[])
  const [panelTarget,setPanelTarget] = useState<HTMLDivElement | null>(null)
  const closeSearch = useCallback(()=>setSearchOpen(false),[])
  const home = location.pathname === '/'
  const valid = !!connectionRoot || connectionsCatalog || home || location.pathname === '/atlas' || !!structure || !!article || catalog || guide || !!circuit || !!baDescription
  const language = state.terminologyLanguage
  const previousRoute = validReturnPath(query.get('powrot'))
  const returnTo = previousRoute?.startsWith('/szlaki/') ? previousRoute : undefined
  const selectedId = connectionRoot ? connectionRegion?.id ?? connectionRoot : region?.id ?? structure?.id ?? (baNumber ? atlasRegions.find(item=>item.number===baNumber && item.hemisphere==='left')?.id : undefined)
  const highlightedIds = connectionRoot ? connectedStructureIds(connectionRoot) : article ? article.projectRegionIds.length ? article.projectRegionIds : article.projectStructureIds : undefined
  const requestedConnectionSide=query.get('strona')
  const connectionSide=connectionRegion?.hemisphere ?? (requestedConnectionSide==='left' || requestedConnectionSide==='right' ? requestedConnectionSide : undefined)
  const connectionFocus = useMemo(()=>connectionRoot ? {rootId:connectionRoot,selectionId:connectionRegion?.id,hemisphere:connectionSide,atlas:atlasMode,links:linksForStructure(connectionRoot)} : undefined,[connectionRoot,connectionRegion,atlasMode,connectionSide])
  const connectionCandidates=connectionExamplesForSelection(selectedId ?? article?.projectRegionIds[0] ?? article?.projectStructureIds[0])
  const view = viewOverride?.route===location.pathname ? viewOverride.view : structure ? preferredView(structure.id) : 'lateral'
  const route = location.pathname+location.search

  useEffect(()=>{
    if (location.pathname.startsWith('/nauka/')) navigate('/',{replace:true})
  },[location.pathname,navigate])
  useEffect(()=>{
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='k' && !document.querySelector('[role="dialog"]')) {event.preventDefault();setSearchOpen(true)}
    }
    window.addEventListener('keydown',shortcut)
    return ()=>window.removeEventListener('keydown',shortcut)
  },[])
  useEffect(()=>{document.title=`${article ? neuroEntryName(article,language) : circuit?.names.pl ?? region?.names.pl ?? structure?.names.pl ?? 'Atlas neuroanatomii i neurofizjologii'} · Neuroatlas`},[article,circuit,region,structure,language])

  function select(id: string) {
    const parcel = atlasRegionById[id]
    if (connectionFocus) {const candidate=connectionExamplesForSelection(id)[0];if(candidate){navigate(structureConnectionUrl(candidate,parcel?.id,connectionFocus.hemisphere));return}}
    if (parcel) {navigate(regionUrl(parcel)+(circuit ? `&powrot=${encodeURIComponent('/szlaki/'+circuit.id)}` : ''));return}
    const target = structureById[id]
    if (target) navigate('/struktury/'+target.slug+(circuit ? `?powrot=${encodeURIComponent('/szlaki/'+circuit.id)}` : ''))
  }
  const readingContent = article ? <NeuroArticle key={article.id} id={article.id} language={language} fullPage /> : catalog ? <NeuroCatalog language={language} /> : guide ? <NeuroGuide /> : baDescription && baNumber ? <BrodmannPage number={baNumber} /> : structure ? <StructureContent key={structure.id} structure={structure} language={language} onSelect={select} returnTo={returnTo} /> : region ? <RegionContent region={region} language={language} onSelect={select} /> : circuit ? <PathwayContent circuit={circuit} language={language} onSelect={select} /> : !valid ? <div className="reading-content"><p>Nie znaleziono strony.</p><Link to="/">Wróć do atlasu</Link></div> : undefined

  const content = connectionFocus ? <ConnectionContent focus={connectionFocus} language={language} /> : connectionsCatalog ? <ConnectionExamples language={language} /> : readingContent && <>{connectionCandidates.length>0 && !circuit && <div className="structure-actions"><Link className="icon-button" aria-label="Połączenia struktury" title="Połączenia struktury" to={structureConnectionUrl(connectionCandidates[0],region?.id)}><ConnectionsIcon /></Link></div>}{readingContent}</>

  return <><div className={`app-shell${fullscreen ? ' is-fullscreen' : ''}`} inert={searchOpen}>
    <a className="skip-link" href="#main" onClick={event=>{event.preventDefault();document.getElementById('main')?.focus()}}>Przejdź do treści</a>
    <header className="app-header">
      <nav className="mode-nav" aria-label="Główna nawigacja"><Link to="/" aria-current={!circuit ? 'page' : undefined}>Atlas</Link><Link to="/szlaki/mesolimbic" aria-current={circuit ? 'page' : undefined}>Szlaki</Link></nav>
      <div className="header-tools"><Link className="icon-button" to="/polaczenia" aria-label="10 przykładów połączeń" title="Połączenia"><ConnectionsIcon /></Link><button className="search-trigger" onClick={()=>setSearchOpen(true)} aria-label="Szukaj w atlasie" title="Szukaj"><SearchIcon /></button><button className="icon-button" aria-label="Pełny ekran" title="Pełny ekran" onClick={toggleFullscreen}><FullscreenIcon /></button>
        <details className="app-menu"><summary aria-label="Menu atlasu">⋯</summary><div className="app-menu-panel"><span>Terminologia</span><TerminologySwitch /><Link to="/kompendium" onClick={event=>{event.currentTarget.closest('details')!.open=false}}>Wszystkie artykuły</Link><Link to="/przewodnik" onClick={event=>{event.currentTarget.closest('details')!.open=false}}>Anatomia i lokalizacja kliniczna</Link></div></details>
      </div>
    </header>
    {fullscreen && <button className="workspace-fullscreen-exit icon-button" aria-label="Zamknij pełny ekran atlasu" title="Zamknij pełny ekran" onClick={toggleFullscreen}><FullscreenIcon expanded /></button>}
    <main id="main" tabIndex={-1} className="atlas-workspace atlas-with-panel">
      <div className="workspace-scene">{circuit ? <PathwayScene key={circuit.id} initialClinical={query.get('stan')==='schizofrenia'} circuit={circuit} language={language} onSelect={select} panelTarget={panelTarget} onRegisterPlayerCloser={registerPlayerCloser} /> : <AtlasScene view={view} onView={next=>setViewOverride({route:location.pathname,view:next})} selectedId={selectedId} highlightedIds={highlightedIds} connectionFocus={connectionFocus} language={language} atlasMode={atlasMode} onSelect={select} onSelect3d={select} />}</div>
      <AtlasSidePanel language={language} atlasMode={atlasMode} selectedId={selectedId} route={route} content={content} onSelect={select} onBrowse={()=>playerCloser.current?.()} onAtlasMode={mode=>navigate('/atlas?warstwa='+mode)} player={<div className="atlas-player-slot" ref={setPanelTarget} />} />
    </main>
  </div>{searchOpen && <AtlasSearch onClose={closeSearch} returnTo={circuit ? '/szlaki/'+circuit.id : undefined} />}</>
}
export function App() {return <HashRouter><AtlasProvider><FullscreenProvider><Workspace /></FullscreenProvider></AtlasProvider></HashRouter>}
