import { useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { categoryById } from '../../data/categories'
import { connections } from '../../data/connections'
import { learningPaths } from '../../data/learningPaths'
import { resolveReferences } from '../../data/references'
import { structureById } from '../../data/structures'
import { functionalReferenceIds, separateSchematicIds } from '../../geometry/atlasGeometry'
import type { BrainStructure, LearningPath, LearningStep, TerminologyLanguage } from '../../types/atlas'
import { circuitById } from '../../data/circuits'
import { CircuitArticle } from './PathwayContent'
import { BrodmannArticle } from './BrodmannContent'
import { Sources } from './Sources'
import { lessonUrl } from '../../utils/learningProgress'
import { getStructureName } from '../../utils/terminology'

export function LessonContent({ path, step, language, onSelect }: { path: LearningPath; step: LearningStep; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const currentConnections = connections.filter(connection => step.connectionIds.includes(connection.id))
  return <article className="reading-content" style={{ '--category': categoryById[path.categoryId].color } as CSSProperties}>
    <h1 tabIndex={-1}>{step.title}</h1>
    <p className="reading-lead">{step.lead}</p>
    {step.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {step.circuitIds?.map(id => <CircuitArticle key={id} circuit={circuitById[id]} compact />)}
    {step.brodmannNumbers?.map(number => <BrodmannArticle key={number} number={number} compact />)}
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
    {returnTo && <Link className="return-link" to={returnTo}>← {returnTo.startsWith('/szlaki/') ? 'Wróć do szlaku' : 'Wróć do lekcji'}</Link>}
    <h1>{getStructureName(structure, language)}</h1>
    <div className="card-tabs" role="tablist" aria-label="Informacje o strukturze">{cardTabs.map((name, index) => <button key={name} role="tab" id={`structure-tab-${index}`} aria-selected={tab === index} aria-controls="structure-tab-content" tabIndex={tab === index ? 0 : -1} onClick={() => setTab(index)} onKeyDown={event => switchTab(event, index)}>{name}</button>)}</div>
    <div role="tabpanel" id="structure-tab-content" aria-labelledby={`structure-tab-${tab}`} tabIndex={0}>
      {tab === 0 && <>
        <p className="reading-lead">{structure.shortRole}</p>
        <h2>Lokalizacja</h2><p>{structure.localization}</p>
        <h2>Funkcje</h2><ul className="function-list">{structure.functions.map(item => <li key={item}>{item}</li>)}</ul>
      </>}
      {tab === 1 && <>
        {relatedConnections.map(connection => <section className="connection-card" key={connection.id}><span className="eyebrow">{connection.kind === 'anatomical' ? 'Anatomia' : 'Funkcja'}{connection.directed ? ' · kierunek udokumentowany' : ''}</span><h3>{connection.title}</h3><p>{connection.description}</p><Sources references={resolveReferences(connection.referenceIds)} /></section>)}
        <h2>Struktury do porównania</h2><div className="related-links">{structure.relatedStructureIds.filter(id => structureById[id]).map(id => <button key={id} onClick={() => onSelect(id)}>{getStructureName(structureById[id], language)} <span>↗</span></button>)}</div>
      </>}
      {tab === 2 && <><p>{structure.psychiatrySummary}</p><p className="interpretation">{structure.interpretationNote}</p><Sources references={structure.references} />{paths.length > 0 && <><h2>Trasy nauki</h2><div className="related-links">{paths.map(path => <Link key={path.slug} to={lessonUrl(path.slug, path.steps[0].id)}>{path.title} <span>→</span></Link>)}</div></>}</>}
      {tab === 3 && <><Sources references={references} /><p className="interpretation">Model 3D: FreeSurfer fsaverage (HQ) / fsaverage6 (Standard), powierzchnie pial, Destrieux, PALS-B12 i ASEG. Kontury 2D: ggseg.formats. Przypisania funkcjonalne: dydaktyczne, o przybliżonych granicach. Powiązanie funkcjonalne nie oznacza bezpośredniego połączenia anatomicznego.</p>{separateSchematicIds.includes(structure.id) && <p>W 2D tę strukturę przedstawia schemat o umownym położeniu elementów.</p>}{structure.id === 'striatum' && <p>Model 3D prążkowia obejmuje jądro ogoniaste, skorupę i jądro półleżące. W schemacie 2D zaznaczono część grzbietową: jądro ogoniaste i skorupę.</p>}<a href={`${import.meta.env.BASE_URL}licenses/THIRD_PARTY_NOTICES.md`} target="_blank" rel="noreferrer">Pochodzenie danych i licencje ↗</a></>}
    </div>
  </article>
}
