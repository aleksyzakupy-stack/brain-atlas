import { Link } from 'react-router-dom'
import { atlasRegions, regionUrl, regionName } from '../../data/anatomicalAtlas'
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
  return <article className="reading-content"><h1>Pole Brodmanna {number}</h1><BrodmannArticle number={number} /><div className="related-links">{regions[0] && <Link to={regionUrl(regions[0])}>Otwórz w atlasie ↗</Link>}</div></article>
}
export function RegionContent({ region, language }: { region: AtlasRegion; language: TerminologyLanguage }) {
  const entry = neuroByRegion[region.id]
  return <article className="reading-content">{entry && <NeuroArticle id={entry.id} title={regionName(region,language)} language={language} />}</article>
}
