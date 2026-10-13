import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AnatomicalDirectory } from './AnatomicalDirectory'
import { atlasRegions, matchesRegion, regionsForMode } from '../../data/anatomicalAtlas'
import type { AtlasMode } from '../../data/anatomicalAtlas'
import { brainStructures } from '../../data/structures'
import { brainCircuits, circuitGroups } from '../../data/circuits'
import { neuroEntryName, neuroEntryUrl, searchNeuroEntries } from '../../data/neuroanatomy'
import { brodmannDescriptions } from '../../data/brodmann'
import { normalizeSearch } from '../../utils/normalizeSearch'
import { getStructureName } from '../../utils/terminology'
import type { TerminologyLanguage } from '../../types/atlas'
import { BookIcon, StepsIcon } from '../common/Icons'

type PanelSection = 'anatomy' | 'physiology' | 'pathways'
export function AtlasSidePanel({ language, atlasMode, selectedId, route, content, player, onSelect, onAtlasMode, onBrowse }: {
  language: TerminologyLanguage; atlasMode: AtlasMode; selectedId?: string; route: string;
  content?: ReactNode; player?: ReactNode; onSelect: (id: string) => void; onAtlasMode: (mode: AtlasMode) => void; onBrowse?: () => void
}) {
  const [section,setSection] = useState<PanelSection>(route.startsWith('/szlaki/') ? 'pathways' : 'anatomy')
  const [directoryRoute,setDirectoryRoute] = useState<string | null>(null)
  const [query,setQuery] = useState('')
  const showContent = content && directoryRoute !== route
  const search = normalizeSearch(query)
  const pick = (id: string) => { setDirectoryRoute(null); onSelect(id) }
  return <aside className="atlas-side-panel" aria-label="Atlas neuroanatomii i neurofizjologii">
    <header className="atlas-panel-header"><h2>Atlas neuroanatomii i neurofizjologii</h2><Link className="icon-button" to="/kompendium" aria-label="Wszystkie artykuły" title="Wszystkie artykuły"><BookIcon /></Link></header>
    <nav className="atlas-panel-tabs" aria-label="Dział atlasu">{([['anatomy','Anatomia'],['physiology','Fizjologia'],['pathways','Szlaki']] as const).map(([value,label]) => <button key={value} aria-pressed={!showContent && section===value} onClick={() => {onBrowse?.();setSection(value);setDirectoryRoute(route);setQuery('')}}>{label}</button>)}</nav>
    <div className="atlas-panel-default" onClickCapture={event => { if ((event.target as HTMLElement).closest('a')) setDirectoryRoute(null) }}>
      {showContent ? <div className="atlas-panel-reading" key={route}>{content}</div> : <div className="atlas-panel-directory">
        {section==='anatomy' && <div className="atlas-index-switch"><button aria-pressed={atlasMode==='anatomy'} onClick={() => {setDirectoryRoute(null);onAtlasMode('anatomy')}}>Struktury</button><button aria-pressed={atlasMode==='brodmann'} onClick={() => {setDirectoryRoute(null);onAtlasMode('brodmann')}}>Pola BA</button></div>}
        <input className="region-filter" aria-label="Filtruj katalog atlasu" placeholder="Nazwa, skrót lub BA…" value={query} onChange={event=>setQuery(event.target.value)} />
        {section==='anatomy' ? <><AnatomicalDirectory regions={regionsForMode(atlasMode).filter(item=>matchesRegion(item,query))} selectedId={selectedId} searching={!!query.trim()} language={language} onSelect={pick} defaultOpen />{atlasMode==='brodmann' && <nav className="structure-directory" aria-label="Pozostałe pola Brodmanna">{brodmannDescriptions.filter(item => !atlasRegions.some(region=>region.number===item.number && region.atlas==='brodmann') && (!search || normalizeSearch(`BA ${item.number} ${item.title}`).includes(search))).map(item=><Link key={item.number} to={'/pola/'+item.number}>BA {item.number} · {item.title}</Link>)}</nav>}</> : section==='physiology' ? <nav className="structure-directory" aria-label="Neurofizjologia">{brainStructures.filter(item=>!search || normalizeSearch([item.names.pl,item.names.en,item.names.la,item.names.abbreviation,...item.aliases,...item.functions].join(' ')).includes(search)).map(item=><button key={item.id} onClick={()=>pick(item.id)} aria-current={selectedId===item.id ? 'page' : undefined}>{getStructureName(item,language)}</button>)}</nav> : <><nav className="structure-directory" aria-label="Szlaki i obwody">{Object.entries(circuitGroups).map(([group,label])=>{
          const items=brainCircuits.filter(item=>item.group===group && (!search || normalizeSearch([item.names.pl,item.names.en,item.transmitter,...item.nodes.map(node=>node.label)].join(' ')).includes(search)))
          return items.length ? <details key={group} open={!!search || group==='dopamine'}><summary>{label}</summary>{items.map(item=><Link key={item.id} to={'/szlaki/'+item.id}>{language==='en' ? item.names.en : item.names.pl}</Link>)}</details> : null
        })}</nav><details className="additional-pathways" open={!!search}><summary>Pozostałe drogi</summary><div className="related-links">{searchNeuroEntries(query).filter(entry=>entry.category==='pathway' && !entry.projectCircuitIds.length).map(entry=><Link key={entry.id} to={neuroEntryUrl(entry)}>{neuroEntryName(entry,language)}</Link>)}</div></details></>}
        <Link className="atlas-guide-link" to="/przewodnik"><StepsIcon />Anatomia i lokalizacja kliniczna</Link>
      </div>}
    </div>
    {player}
  </aside>
}
