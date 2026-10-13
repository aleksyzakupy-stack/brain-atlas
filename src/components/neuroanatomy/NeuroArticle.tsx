import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadNeuroReference, neuroEntryById, neuroEntryName, neuroEntryUrl, relatedNeuroEntries, pathwayKind } from '../../data/neuroanatomy'
import { atlasRegionById, regionLabel, regionUrl } from '../../data/anatomicalAtlas'
import { circuitById } from '../../data/circuits'
import { referenceById } from '../../data/references'
import { structureById } from '../../data/structures'
import type { NeuroReference } from '../../types/neuroanatomy'
import type { TerminologyLanguage } from '../../types/atlas'
import { Sources } from '../panels/Sources'
import '../../styles/neuroanatomy.css'

const sections = [
  ['anatomy', 'Anatomia i topografia'], ['function', 'Funkcja'], ['connections', 'Połączenia'],
  ['route', 'Przebieg'], ['decussation', 'Skrzyżowania'], ['transmitters', 'Neuroprzekaźniki'],
  ['clinical', 'Znaczenie kliniczne'], ['laterality', 'Lateralizacja'], ['limitations', 'Ograniczenia interpretacji'],
] as const

export function NeuroArticle({ id, language = 'pl', title, side, header = true, initialSection = 'anatomy', spatialAnchor, fullPage = false }: {
  id: string; language?: TerminologyLanguage; title?: string; side?: string; header?: boolean; initialSection?: string; spatialAnchor?: string; fullPage?: boolean
}) {
  const index = neuroEntryById[id]
  const [loaded, setLoaded] = useState<NeuroReference | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const root = useRef<HTMLElement>(null)
  const prefix = useId()
  useEffect(() => {
    let active = true
    loadNeuroReference().then(data => { if (active) { setLoaded(data); setFailed(false) } }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [attempt])
  if (!index) return <p role="alert">Nie znaleziono artykułu.</p>
  const entry = loaded?.entries.find(item => item.id === id)
  const related = relatedNeuroEntries(index)
  function jump(key: string) {
    const target = root.current?.querySelector<HTMLDetailsElement>('[data-section="' + key + '"]')
    if (!target) return
    const disclosure = target.tagName === 'DETAILS' ? target : target.querySelector<HTMLDetailsElement>('details')
    if (disclosure) disclosure.open = true
    target.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    if (disclosure) disclosure.querySelector<HTMLElement>('summary')?.focus({ preventScroll: true })
  }
  const sourceById = Object.fromEntries((loaded?.sources ?? []).map(source => [source.id, source]))
  const kind = index.category === 'pathway' ? pathwayKind(index, circuitById[index.projectCircuitIds[0]]) : undefined
  return <article className="neuro-article" ref={root} data-article-id={id}>
    {header && <h1>{title ?? neuroEntryName(index,language)}</h1>}
    {!fullPage && <div className="neuro-links-short"><Link to={neuroEntryUrl(index)}>Czytaj w pełnym widoku ↗</Link></div>}
    {side && <p className="neuro-side">{side === 'left' ? 'Lewa półkula' : side === 'right' ? 'Prawa półkula' : 'Struktura pośrodkowa'}</p>}
    {kind && <p className="neuro-kind">{kind}{!index.projectCircuitIds.length && ' · opis bez geometrii 3D'}</p>}
    {spatialAnchor && loaded?.spatialIndexNotes.find(note => note.anchorId === spatialAnchor)?.scope && <p className="neuro-context">{loaded.spatialIndexNotes.find(note => note.anchorId === spatialAnchor)!.scope}</p>}
    <details className="neuro-names"><summary>Nazwy PL / EN / LAT</summary><dl><dt>PL</dt><dd>{index.names.pl}</dd><dt>EN</dt><dd>{index.names.en}</dd><dt>LAT</dt><dd>{index.names.lat}</dd></dl></details>
    {!entry ? failed ? <p role="alert">Nie udało się wczytać artykułu. <button className="text-button" onClick={() => setAttempt(value => value + 1)}>Spróbuj ponownie</button></p> : <p role="status">Wczytywanie artykułu…</p> : <>
      <nav className="neuro-sections" aria-label="Sekcje artykułu">{sections.filter(([key]) => entry[key]).map(([key,label]) => <button key={key} onClick={() => jump(key)}>{label}</button>)}<button onClick={() => jump('sources')}>Źródła</button></nav>
      {sections.filter(([key]) => entry[key]).map(([key,label]) => <details key={id + key} className="neuro-section" data-section={key} open={key === initialSection}>
        <summary id={prefix + key}><h2>{label}</h2></summary><div aria-labelledby={prefix + key}>{entry[key]!.split(/\n\n+/).map((paragraph,i) => <p key={i}>{paragraph}</p>)}</div>
        {key === 'limitations' && [entry.evidenceNote, entry.evidenceNotes].filter(Boolean).map((note,i) => <p key={i}>{note}</p>)}
      </details>)}
      <div data-section="sources"><Sources references={[]}><ol className="sources-list">{entry.sources.map((citation,i) => {
        const source = sourceById[citation.sourceId]
        if (!source) return null
        return <li key={i}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a> : <strong>{source.title}</strong>}
          <small>{[source.authors,source.year,source.edition].filter(Boolean).join(' · ')}</small><p className="source-locator">{citation.locator}</p>
          <details className="source-verification"><summary>Zakres weryfikacji</summary>{[source.status,source.verificationStatus,source.scope,source.limitations].filter(Boolean).map((text,j) => <p key={j}>{text}</p>)}</details>
        </li>
      })}</ol>{entry.inheritedReferenceIds?.length ? <details className="source-verification"><summary>Bibliografia materiału wyjściowego</summary><p>Odsyłacze odziedziczone z projektu; bez ponownej weryfikacji w kompendium.</p><ol className="sources-list">{entry.inheritedReferenceIds.map(referenceId => referenceById[referenceId]).filter(Boolean).map(reference => <li key={reference.id}><a href={reference.url} target="_blank" rel="noreferrer">{reference.title} ↗</a><small>{reference.authors}{reference.year ? ' · ' + reference.year : ''}</small></li>)}</ol></details> : null}</Sources></div>
    </>}
    {(index.projectRegionIds.length > 0 || index.projectStructureIds.length > 0 || index.projectCircuitIds.length > 0) && <details className="neuro-model-links"><summary>Model i karty</summary><div className="related-links">
      {index.projectRegionIds.map(regionId => atlasRegionById[regionId]).filter(Boolean).map(region => <Link key={region.id} to={regionUrl(region)}>{regionLabel(region,language)} · Model 3D ↗</Link>)}
      {index.projectStructureIds.map(structureId => structureById[structureId]).filter(Boolean).map(structure => <Link key={structure.id} to={'/struktury/' + structure.slug}>{structure.names.pl} ↗</Link>)}
      {index.projectCircuitIds.map(circuitId => circuitById[circuitId]).filter(Boolean).map(circuit => <Link key={circuit.id} to={'/szlaki/' + circuit.id}>{circuit.names.pl} · Szlak 3D ↗</Link>)}
    </div></details>}
    {related.length > 0 && <details className="neuro-related"><summary>Powiązane struktury i szlaki</summary><div className="related-links">{related.map(item => <Link key={item.id} to={neuroEntryUrl(item)}>{neuroEntryName(item,language)} ↗</Link>)}</div></details>}
  </article>
}
