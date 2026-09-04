import { useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categoryById } from '../../data/categories'
import { connections } from '../../data/connections'
import { learningPaths } from '../../data/learningPaths'
import { resolveReferences } from '../../data/references'
import { structureById } from '../../data/structures'
import { functionalReferenceIds, separateSchematicIds } from '../../geometry/atlasGeometry'
import type { BrainStructure, LearningPath, LearningStep, Reference, TerminologyLanguage } from '../../types/atlas'
import { lessonUrl } from '../../utils/learningProgress'
import { getStructureName } from '../../utils/terminology'

export function Sources({ references }: { references: Reference[] }) {
  return <ol className="sources-list">{references.map(reference => <li key={reference.id}>
    <a href={reference.url} target="_blank" rel="noreferrer">{reference.title} <span aria-hidden="true">↗</span></a>
    <small>{reference.authors}{reference.year ? ` · ${reference.year}` : ''}</small>
  </li>)}</ol>
}

export function LessonContent({ path, step, language, onSelect }: { path: LearningPath; step: LearningStep; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const currentConnections = connections.filter(connection => step.connectionIds.includes(connection.id))
  return <article className="reading-content" style={{ '--category': categoryById[path.categoryId].color } as CSSProperties}>
    <span className="eyebrow">{step.stage} · {path.steps.indexOf(step) + 1} z 6</span>
    <h1 tabIndex={-1}>{step.title}</h1>
    <p className="reading-lead">{step.lead}</p>
    {step.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    <details className="reading-detail"><summary>{step.detail.title}</summary><p>{step.detail.text}</p></details>
    <div className="takeaway"><span>Zapamiętaj</span><p>{step.takeaway}</p></div>
    <section className="related-section"><h2>Struktury w tym kroku</h2><div className="related-links">{step.structureIds.map(id => <button key={id} onClick={() => onSelect(id)}><span className="category-dot" style={{ background: categoryById[structureById[id].categoryId].color }} />{getStructureName(structureById[id], language)} <span>↗</span></button>)}</div></section>
    {currentConnections.length > 0 && <section className="connections-reading"><h2>Jak czytać powiązania</h2>{currentConnections.map(connection => <details key={connection.id}><summary>{connection.title}</summary><p>{connection.description}</p><Sources references={resolveReferences(connection.referenceIds)} /></details>)}</section>}
    <details className="source-details"><summary>Źródła tego kroku · {step.referenceIds.length}</summary><Sources references={resolveReferences(step.referenceIds)} /></details>
  </article>
}

const cardTabs = ['W skrócie', 'Powiązania', 'W psychiatrii', 'Źródła']
export function StructureContent({ structure, language, onSelect, returnTo }: { structure: BrainStructure; language: TerminologyLanguage; onSelect: (id: string) => void; returnTo?: string }) {
  const location = useLocation()
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get('sekcja') === 'powiazania' ? 1 : 0)
  const category = categoryById[structure.categoryId]
  const relatedConnections = connections.filter(connection => connection.sourceId === structure.id || connection.targetId === structure.id)
  const paths = learningPaths.filter(path => path.steps.some(step => step.structureIds.includes(structure.id)))
  const geometrySources = resolveReferences([...(functionalReferenceIds[structure.id] ?? []), 'dk', 'aseg'])
  const references = [...new Map([...structure.references, ...geometrySources].map(reference => [reference.id, reference])).values()]
  function switchTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % 4 : event.key === 'ArrowLeft' ? (index + 3) % 4 : event.key === 'Home' ? 0 : event.key === 'End' ? 3 : undefined
    if (next !== undefined) { event.preventDefault(); setTab(next); document.getElementById(`structure-tab-${next}`)?.focus() }
  }
  return <article className="reading-content structure-content" style={{ '--category': category.color } as CSSProperties}>
    {returnTo && <Link className="return-link" to={returnTo}>← Wróć do lekcji</Link>}
    <span className="eyebrow"><span className="category-dot" />{category.label}</span>
    <h1>{getStructureName(structure, language)}</h1>
    <p className="anatomical-name">{language === 'en' ? structure.names.la : structure.names.en}{structure.names.abbreviation ? ` · ${structure.names.abbreviation}` : ''}</p>
    <div className="card-tabs" role="tablist" aria-label="Informacje o strukturze">{cardTabs.map((name, index) => <button key={name} role="tab" id={`structure-tab-${index}`} aria-selected={tab === index} aria-controls="structure-tab-content" tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => switchTab(event, index)}>{name}</button>)}</div>
    <div role="tabpanel" id="structure-tab-content" aria-labelledby={`structure-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <>
        <h2>Główna rola</h2><p className="reading-lead">{structure.shortRole}</p>
        <h2>Gdzie się znajduje</h2><p>{structure.localization}</p>
        <h2>W czym uczestniczy</h2><ul className="function-list">{structure.functions.map(item => <li key={item}>{item}</li>)}</ul>
        {(functionalReferenceIds[structure.id] || separateSchematicIds.includes(structure.id)) && <p className="interpretation">{separateSchematicIds.includes(structure.id) ? 'Ilustracja jest odrębnym schematem dydaktycznym. Ta struktura nie ma osobnego konturu w wykorzystanej geometrii aseg.' : 'Przerywany obrys to orientacyjna nakładka dydaktyczna. Granice funkcjonalne nie są tożsame z parcelami anatomicznymi DK.'}</p>}
        {structure.id === 'striatum' && <p className="interpretation">Zaznaczono część grzbietową: jądro ogoniaste i skorupę. Część brzuszną omawia osobna karta jądra półleżącego.</p>}
        <details className="source-details"><summary>Podstawa opisu i ilustracji</summary><Sources references={references} /></details>
      </>}
      {tab === 1 && <>
        <h2>W kontekście układu</h2><p>Powiązanie funkcjonalne nie jest dowodem bezpośredniego połączenia anatomicznego.</p>
        {relatedConnections.map(connection => <section className="connection-card" key={connection.id}><span className="eyebrow">{connection.kind === 'anatomical' ? 'Anatomia' : 'Funkcja'}{connection.directed ? ' · kierunek udokumentowany' : ''}</span><h3>{connection.title}</h3><p>{connection.description}</p><Sources references={resolveReferences(connection.referenceIds)} /></section>)}
        <h2>Struktury do porównania</h2><div className="related-links">{structure.relatedStructureIds.filter(id => structureById[id]).map(id => <button key={id} onClick={() => onSelect(id)}>{getStructureName(structureById[id], language)} <span>↗</span></button>)}</div>
      </>}
      {tab === 2 && <><h2>Od anatomii do rozumienia objawów</h2><p>{structure.psychiatrySummary}</p><p className="interpretation">{structure.interpretationNote}</p><Sources references={structure.references} />{paths.length > 0 && <><h2>Prześledź cały mechanizm</h2><div className="related-links">{paths.map(path => <Link key={path.slug} to={lessonUrl(path.slug, path.steps[0].id)}>{path.title} <span>→</span></Link>)}</div></>}</>}
      {tab === 3 && <><h2>Bibliografia i pochodzenie</h2><Sources references={references} /><p className="interpretation">Kontury: ggseg.formats, DK / aseg (FreeSurfer). Nakładki funkcjonalne: autorskie, o przybliżonych granicach. Opis i bibliografia nie oznaczają zewnętrznej recenzji klinicznej.</p><a href={`${import.meta.env.BASE_URL}licenses/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">Pochodzenie danych i licencje ↗</a></>}
    </div>
  </article>
}
