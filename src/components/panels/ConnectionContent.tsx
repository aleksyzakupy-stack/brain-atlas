import { Link } from 'react-router-dom'
import { connectedStructureIds, connectionExamples, linksForStructure, structureConnectionUrl } from '../../data/structureConnections'
import type { StructureConnectionFocus } from '../../data/structureConnections'
import { atlasRegionById, regionLabel, regionUrl } from '../../data/anatomicalAtlas'
import { structureById } from '../../data/structures'
import { resolveReferences } from '../../data/references'
import { getStructureName } from '../../utils/terminology'
import type { TerminologyLanguage } from '../../types/atlas'
import { ConnectionsIcon, BookIcon, InfoIcon } from '../common/Icons'
import { Sources } from './Sources'

export function ConnectionExamples({ language }: {language:TerminologyLanguage}) {
  return <section className="connection-examples"><h1>Połączenia</h1><nav aria-label="10 przykładów połączeń">{connectionExamples.map((item,index)=><Link key={item.id} to={structureConnectionUrl(item.id)}><span>{index+1}</span>{getStructureName(item,language)}<ConnectionsIcon /></Link>)}</nav></section>
}
export function ConnectionContent({ focus, language }: {focus:StructureConnectionFocus;language:TerminologyLanguage}) {
  const root = structureById[focus.rootId]
  const region = focus.selectionId ? atlasRegionById[focus.selectionId] : undefined
  const links = linksForStructure(root.id)
  const neighbors = connectedStructureIds(root.id)
  return <section className="connection-content">
    <div className="connection-content-heading"><h1>{region ? regionLabel(region,language) : getStructureName(root,language)+(focus.hemisphere==='left' ? ' · L' : focus.hemisphere==='right' ? ' · P' : '')}</h1><Link className="icon-button" aria-label="Opis struktury" title="Opis struktury" to={region ? regionUrl(region) : '/struktury/'+root.slug}><BookIcon /></Link></div>
    <div className="connection-legend"><span><i className="connection-root-dot" />{getStructureName(root,language)}</span><span><i className="connection-related-dot" />Połączenia · {neighbors.length}</span></div>
    <nav className="connection-neighbors" aria-label="Połączone struktury">{neighbors.map(id=>{
      const item=structureById[id]
      const entries=links.filter(link=>link.sourceId===id || link.targetId===id)
      return <div key={id}><Link to={structureConnectionUrl(id,undefined,focus.hemisphere)}><ConnectionsIcon />{getStructureName(item,language)}</Link>{entries.map(link=><details key={link.id}><summary><span className={`connection-line ${link.kind}`} />{link.directed ? link.sourceId===root.id ? '→' : '←' : '↔'} {link.title}</summary><p>{link.description}</p>{link.circuitId && <Link to={'/szlaki/'+link.circuitId}>Otwórz szlak ↗</Link>}<Sources references={resolveReferences(link.referenceIds)} /></details>)}</div>
    })}</nav>
    <details className="article-extra"><summary aria-label="O widoku połączeń" title="O widoku połączeń"><InfoIcon /></summary><div className="article-extra-content"><p>10 połączonych przykładów. Widok obejmuje powiązania opisane w atlasie, nie pełny konektom. Linia ciągła oznacza powiązanie anatomiczne, przerywana — funkcjonalne. Linie pokazują relacje między strukturami, nie przebieg pęczków. Pola funkcjonalne i punkty połączeń są przybliżeniami; zakres połączenia może dotyczyć części wyświetlanego regionu.</p></div></details>
    <details className="connection-more"><summary>10 przykładów</summary><ConnectionExamples language={language} /></details>
  </section>
}
