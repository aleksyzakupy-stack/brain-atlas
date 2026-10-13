import { Link } from 'react-router-dom'
import { neuroByCircuit } from '../../data/neuroanatomy'
import type { BrainCircuit, TerminologyLanguage } from '../../types/atlas'
import { NeuroArticle } from '../neuroanatomy/NeuroArticle'
export function CircuitArticle({ circuit, compact = false }: { circuit: BrainCircuit; compact?: boolean }) {
  const entry = neuroByCircuit[circuit.id]
  return <section className="circuit-article" data-circuit-id={circuit.id}>{compact ? <div className="neuro-links-short"><Link to={'/szlaki/' + circuit.id}>{circuit.names.pl} ↗</Link></div> : entry && <NeuroArticle id={entry.id} header={false} />}</section>
}
export function PathwayContent({ circuit, language }: { circuit: BrainCircuit; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const entry = neuroByCircuit[circuit.id]
  return <div className="reading-content pathway-content">{entry && <NeuroArticle id={entry.id} title={language === 'en' ? circuit.names.en : circuit.names.pl} language={language} header={false} initialSection="route" />}</div>
}
