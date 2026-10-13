import { Link } from 'react-router-dom'
import { circuitGroups } from '../../data/circuits'
import { resolveReferences } from '../../data/references'
import { structureById } from '../../data/structures'
import type { BrainCircuit, TerminologyLanguage } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'
import { Sources } from './Sources'

export function CircuitArticle({ circuit, compact = false }: { circuit: BrainCircuit; compact?: boolean }) {
  return <section className="circuit-article" data-circuit-id={circuit.id}>
    {compact && <h2><Link to={`/szlaki/${circuit.id}`}>{circuit.names.pl} ↗</Link></h2>}
    <p className="reading-lead">{circuit.summary}</p>
    <details className="reading-detail"><summary>Anatomia</summary><p>{circuit.anatomy}</p></details>
    <details className="reading-detail"><summary>Fizjologia</summary><p>{circuit.physiology}</p></details>
    <details className="reading-detail"><summary>W psychiatrii</summary><p>{circuit.psychiatry}</p></details>
    <details className="reading-detail"><summary>Farmakologia</summary><p>{circuit.pharmacology}</p></details>
    <details className="source-details"><summary>Badania i źródła</summary><p>{circuit.evidence}</p>{circuit.hainesPages && <p>Haines, wyd. 9, s. {circuit.hainesPages} (numeracja drukowana).</p>}<Sources references={resolveReferences(circuit.referenceIds)} /></details>
  </section>
}

export function PathwayContent({ circuit, language, onSelect }: { circuit: BrainCircuit; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  return <article className="reading-content pathway-content">
    <h1>{language === 'en' ? circuit.names.en : circuit.names.pl}</h1>
    <dl className="atlas-region-data"><div><dt>Układ</dt><dd>{circuitGroups[circuit.group]}</dd></div><div><dt>Sygnał</dt><dd>{circuit.transmitter}</dd></div></dl>
    <CircuitArticle circuit={circuit} />
    <h2>Struktury</h2><div className="related-links">{circuit.structureIds.map(id => <button key={id} onClick={() => onSelect(id)}>{getStructureName(structureById[id], language)} ↗</button>)}</div>
  </article>
}
