import { Link } from 'react-router-dom'
import { atlasRegions, regionUrl, regionName, regionLabel } from '../../data/anatomicalAtlas'
import type { AtlasRegion } from '../../data/anatomicalAtlas'
import { neuroByBrodmann, neuroByRegion } from '../../data/neuroanatomy'
import type { TerminologyLanguage } from '../../types/atlas'
import { NeuroArticle } from '../neuroanatomy/NeuroArticle'

export function BrodmannArticle({ number, compact = false }: { number: number; compact?: boolean }) {
  const entry = neuroByBrodmann[number]
  if (!entry) return null
  return <section className="brodmann-article" data-ba={number}>{compact ? <div className="neuro-links-short"><Link to={'/pola/' + number}>{entry.names.pl} ↗</Link></div> : <NeuroArticle id={entry.id} header={false} />}</section>
}
export function BrodmannPage({ number }: { number: number }) {
  const regions = atlasRegions.filter(item => item.number === number && item.atlas === 'brodmann')
  return <article className="reading-content"><h1>Pole Brodmanna {number}</h1><BrodmannArticle number={number} /><div className="related-links">{regions.map(region => <Link key={region.id} to={regionUrl(region)}>{regionLabel(region,'pl')} · Model 3D ↗</Link>)}</div>{!regions.length && <p className="neuro-context">Bez odrębnej parceli w modelu PALS-B12.</p>}</article>
}
export function RegionContent({ region, language, onSelect }: { region: AtlasRegion; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const entry = neuroByRegion[region.id]
  return <article className="reading-content">{entry && <NeuroArticle id={entry.id} title={regionName(region,language)} side={region.hemisphere} language={language} />}<div className="related-links">{atlasRegions.filter(item => item.sourceRegion === region.sourceRegion && item.id !== region.id).map(item => <button key={item.id} onClick={() => onSelect(item.id)}>{regionLabel(item,language)} ↗</button>)}</div></article>
}
