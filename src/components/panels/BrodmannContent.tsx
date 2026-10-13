import { Link } from 'react-router-dom'
import { atlasRegions, regionUrl } from '../../data/anatomicalAtlas'
import type { AtlasRegion } from '../../data/anatomicalAtlas'
import { regionName, regionLabel } from '../../data/anatomicalAtlas'
import { brodmannByNumber } from '../../data/brodmann'
import { resolveReferences } from '../../data/references'
import type { TerminologyLanguage } from '../../types/atlas'
import { Sources } from './Sources'

export function BrodmannArticle({ number, compact = false }: { number: number; compact?: boolean }) {
  const description = brodmannByNumber[number]
  if (!description) return null
  return <section className="brodmann-article" data-ba={number}>
    {compact && <h2><Link to={`/pola/${number}`}>BA {number} · {description.title} ↗</Link></h2>}
    <p className="reading-lead">{description.title}</p>
    <h2>Lokalizacja</h2><p>{description.location}</p>
    {description.functions.length > 0 && <><h2>Funkcje</h2><ul className="function-list">{description.functions.map(text => <li key={text}>{text}</li>)}</ul></>}
    <h2>Mechanizm i połączenia</h2><p>{description.mechanism}</p>
    <h2>Znaczenie kliniczne</h2><p>{description.clinical}</p>
    <h2>Lateralizacja</h2><p>{description.lateralization}</p>
    {description.uncertainty && <p className="interpretation">{description.uncertainty}</p>}
    <Sources references={resolveReferences(description.referenceIds)}><p>BA: podział cytoarchitektoniczny. Granice PALS-B12 są projekcją atlasową.</p></Sources>
  </section>
}

export function BrodmannPage({ number }: { number: number }) {
  const regions = atlasRegions.filter(item => item.number === number && item.atlas === 'brodmann')
  return <article className="reading-content"><h1>Pole Brodmanna {number}</h1><BrodmannArticle number={number} /><div className="related-links">{regions.map(item => <Link key={item.id} to={regionUrl(item)}>{regionLabel(item, 'pl')} · Model 3D ↗</Link>)}</div>{!regions.length && <p className="interpretation">Bez odrębnej parceli w modelu PALS-B12.</p>}</article>
}

export function RegionContent({ region, language, onSelect }: { region: AtlasRegion; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const metadata = <><dl className="atlas-region-data"><div><dt>Półkula</dt><dd>{region.hemisphere === 'left' ? 'Lewa' : region.hemisphere === 'right' ? 'Prawa' : 'Struktura pośrodkowa'}</dd></div><div><dt>EN</dt><dd>{region.names.en}</dd></div><div><dt>LAT</dt><dd>{region.names.lat}</dd></div><div><dt>Atlas</dt><dd>{region.source}</dd></div><div><dt>Identyfikator źródłowy</dt><dd>{region.sourceRegion}</dd></div></dl><div className="about-links"><a target="_blank" rel="noreferrer" href={region.source === 'PALS-B12' ? 'https://surfer.nmr.mgh.harvard.edu/fswiki/PALS_B12' : region.source === 'Destrieux' ? 'https://pubmed.ncbi.nlm.nih.gov/20547229/' : 'https://surfer.nmr.mgh.harvard.edu/fswiki/SubcorticalSegmentation'}>{region.source} ↗</a></div></>
  return <article className="reading-content"><h1>{regionName(region, language)}</h1>{region.number && <BrodmannArticle number={region.number} />}<Sources references={[]}>{metadata}</Sources><div className="related-links">{atlasRegions.filter(item => item.sourceRegion === region.sourceRegion && item.id !== region.id).map(item => <button key={item.id} onClick={() => onSelect(item.id)}>{regionLabel(item, language)} ↗</button>)}</div></article>
}
