import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { categoryById } from '../../data/categories'
import { connections } from '../../data/connections'
import { resolveReferences } from '../../data/references'
import { structureById } from '../../data/structures'
import type { BrainStructure, LearningPath, LearningStep, TerminologyLanguage } from '../../types/atlas'
import { circuitById } from '../../data/circuits'
import { CircuitArticle } from './PathwayContent'
import { BrodmannArticle } from './BrodmannContent'
import { Sources } from './Sources'
import { getStructureName } from '../../utils/terminology'
import { neuroByStructure } from '../../data/neuroanatomy'
import { NeuroArticle } from '../neuroanatomy/NeuroArticle'

export function LessonContent({ path, step, language, onSelect }: { path: LearningPath; step: LearningStep; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const currentConnections = connections.filter(connection => step.connectionIds.includes(connection.id))
  return <article className="reading-content" style={{ '--category': categoryById[path.categoryId].color } as CSSProperties}>
    <h1 tabIndex={-1}>{step.title}</h1>
    <p className="reading-lead">{step.lead}</p>
    {step.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {step.circuitIds?.map(id => <CircuitArticle key={id} circuit={circuitById[id]} compact />)}
    {step.brodmannNumbers?.map(number => <BrodmannArticle key={number} number={number} compact />)}
    <details className="reading-detail"><summary>{step.detail.title}</summary><p>{step.detail.text}</p></details>
    <section className="related-section"><h2>Struktury w tym kroku</h2><div className="related-links">{step.structureIds.map(id => <button key={id} onClick={() => onSelect(id)}><span className="category-dot" style={{ background: categoryById[structureById[id].categoryId].color }} />{getStructureName(structureById[id], language)} <span>↗</span></button>)}</div></section>
    {currentConnections.length > 0 && <section className="connections-reading"><h2>Powiązania</h2>{currentConnections.map(connection => <details key={connection.id}><summary>{connection.title}</summary><p>{connection.description}</p><Sources references={resolveReferences(connection.referenceIds)} /></details>)}</section>}
    <Sources references={resolveReferences(step.referenceIds)} />
  </article>
}

export function StructureContent({ structure, language, returnTo }: { structure: BrainStructure; language: TerminologyLanguage; onSelect: (id: string) => void; returnTo?: string }) {
  const entry = neuroByStructure[structure.id]
  return <article className="reading-content structure-content">
    {returnTo && <Link className="return-link" to={returnTo}>← {returnTo.startsWith('/szlaki/') ? 'Wróć do szlaku' : 'Wróć do lekcji'}</Link>}
    {entry && <NeuroArticle id={entry.id} title={getStructureName(structure,language)} language={language} />}
  </article>
}
