import { useEffect, useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadNeuroReference, neuroEntryById, neuroEntryName, neuroEntryUrl, relatedNeuroEntries, pathwayKind } from '../../data/neuroanatomy'
import { atlasRegionById, regionName, regionUrl } from '../../data/anatomicalAtlas'
import { circuitById } from '../../data/circuits'
import { referenceById } from '../../data/references'
import { structureById } from '../../data/structures'
import type { NeuroReference } from '../../types/neuroanatomy'
import type { TerminologyLanguage } from '../../types/atlas'
import { Sources } from '../panels/Sources'
import { InfoIcon, Model3DIcon } from '../common/Icons'
import '../../styles/neuroanatomy.css'

const sections = [
  ['anatomy', 'Anatomia i topografia'], ['function', 'Funkcja'], ['connections', 'Połączenia'],
  ['route', 'Przebieg'], ['decussation', 'Skrzyżowania'], ['transmitters', 'Neuroprzekaźniki'],
  ['clinical', 'Znaczenie kliniczne'], ['laterality', 'Lateralizacja'], ['limitations', 'Ograniczenia interpretacji'],
] as const

export function NeuroArticle({ id, language = 'pl', title, side, header = true, initialSection = 'anatomy', spatialAnchor }: {
  id: string; language?: TerminologyLanguage; title?: string; side?: string; header?: boolean; initialSection?: string; spatialAnchor?: string; fullPage?: boolean
}) {
  const index = neuroEntryById[id]
  const [loaded, setLoaded] = useState<NeuroReference | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const prefix = useId()
  useEffect(() => {
    let active = true
    loadNeuroReference().then(data => { if (active) { setLoaded(data); setFailed(false) } }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [attempt])
  if (!index) return <p role="alert">Nie znaleziono artykułu.</p>
  const entry = loaded?.entries.find(item => item.id === id)
  const related = relatedNeuroEntries(index)
  const modelRegions = [...new Map(index.projectRegionIds.map(regionId => atlasRegionById[regionId]).filter(Boolean).map(region => [`${region.atlas}:${region.sourceRegion}`, region])).values()]
  const sourceById = Object.fromEntries((loaded?.sources ?? []).map(source => [source.id, source]))
  const kind = index.category === 'pathway' ? pathwayKind(index, circuitById[index.projectCircuitIds[0]]) : undefined
  return <article className="neuro-article" data-article-id={id}>
    {header && <h1>{title ?? neuroEntryName(index,language)}{side && side !== 'midline' && <small className="article-side" title={side === 'left' ? 'Lewa półkula' : 'Prawa półkula'}>{side === 'left' ? 'L' : 'P'}</small>}</h1>}
    {kind && <span className="neuro-kind">{kind}</span>}
    {!entry ? failed ? <p role="alert">Nie udało się wczytać artykułu. <button className="text-button" onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button></p> : <p role="status">Wczytywanie artykułu…</p> : <>
      {sections.filter(([key]) => key !== 'limitations' && entry[key]).map(([key,label]) => <details key={id + key} className="neuro-section" data-section={key} open={key === initialSection}>
        <summary id={prefix + key}><h2>{label}</h2></summary><div aria-labelledby={prefix + key}>{entry[key]!.split(/\n\n+/).map((paragraph,i) => <p key={i}>{paragraph}</p>)}</div>
      </details>)}
      <div className="article-footer-tools">
      <details className="article-extra"><summary aria-label="Ograniczenia" title="Ograniczenia"><InfoIcon /></summary><div className="article-extra-content"><h2>Ograniczenia</h2>{index.category === 'pathway' && !index.projectCircuitIds.length && <p>Opis bez modelu 3D.</p>}{[entry.limitations, entry.evidenceNote, entry.evidenceNotes, loaded?.spatialIndexNotes.find(note => note.anchorId === spatialAnchor)?.scope].filter(Boolean).map((note,i) => <p key={i}>{note}</p>)}<details><summary>Nazwy</summary><dl className="article-names"><dt>PL</dt><dd>{index.names.pl}</dd><dt>EN</dt><dd>{index.names.en}</dd><dt>LAT</dt><dd>{index.names.lat}</dd></dl></details></div></details>
      <div data-section="sources"><Sources references={[]}><ol className="sources-list">{entry.sources.map((citation,i) => {
        const source = sourceById[citation.sourceId]
        if (!source) return null
        return <li key={i}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : <strong>{source.title}</strong>}
          <small>{[source.authors,source.year,source.edition].filter(Boolean).join(' · ')}</small><p className="source-locator">{citation.locator}</p>
          <details className="source-verification"><summary>Uwagi</summary>{[source.status,source.verificationStatus,source.scope,source.limitations].filter(Boolean).map((text,j) => <p key={j}>{text}</p>)}</details>
        </li>
      })}</ol>{entry.inheritedReferenceIds?.length ? <details className="source-verification"><summary>Bibliografia materiału wyjściowego</summary><ol className="sources-list">{entry.inheritedReferenceIds.map(referenceId => referenceById[referenceId]).filter(Boolean).map(reference => <li key={reference.id}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title} ↗</a><small>{reference.authors}{reference.year ? ' · ' + reference.year : ''}</small></li>)}</ol></details> : null}</Sources></div>
    {(index.projectRegionIds.length > 0 || index.projectStructureIds.length > 0 || index.projectCircuitIds.length > 0) && <details className="neuro-model-links article-extra"><summary aria-label="Otwórz w atlasie" title="Otwórz w atlasie"><Model3DIcon /></summary><div className="related-links">
      {modelRegions.map(region => <Link key={region.id} to={regionUrl(region)}>{regionName(region,language)} ↗</Link>)}
      {index.projectStructureIds.map(structureId => structureById[structureId]).filter(Boolean).map(structure => <Link key={structure.id} to={'/struktury/' + structure.slug}>{structure.names.pl} ↗</Link>)}
      {index.projectCircuitIds.map(circuitId => circuitById[circuitId]).filter(Boolean).map(circuit => <Link key={circuit.id} to={'/szlaki/' + circuit.id}>{circuit.names.pl} ↗</Link>)}
    </div></details>}
    </div></>}
    {related.length > 0 && <details className="neuro-related"><summary>Powiązane struktury i szlaki</summary><div className="related-links">{related.map(item => <Link key={item.id} to={neuroEntryUrl(item)}>{neuroEntryName(item,language)} ↗</Link>)}</div></details>}
  </article>
}
