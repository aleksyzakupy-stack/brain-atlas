import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { BrainCircuit, TerminologyLanguage } from '../../types/atlas'
import { circuitById } from '../../data/circuits'
import { changeSymbols, pathwayNodeLabel, pathwayScenarios, transmitterName } from '../../data/pathwayScenarios'
import { structureById } from '../../data/structures'
import { resolveReferences } from '../../data/references'
import { AtlasDialog } from '../layout/AtlasDialog'
import { PathwayContent } from '../panels/PathwayContent'
import { Sources } from '../panels/Sources'
import '../../styles/pathways.css'
import '../../styles/brain3d.css'

const Brain3DScene = lazy(() => import('./Brain3DScene'))

const effectColor = { excitation: '#f4bc75', inhibition: '#9dadf0', modulation: '#88d8bb', hormone: '#e3a7ce' }
export function LessonPathwayScene({ ids, language, onSelect }: { ids: string[]; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const [id, setId] = useState(ids[0])
  return <><label className="lesson-pathway-select">Szlak<select aria-label="Szlak w lekcji" value={id} onChange={event => setId(event.target.value)}>{ids.map(value => <option key={value} value={value}>{circuitById[value].names.pl}</option>)}</select></label><PathwayScene key={id} circuit={circuitById[id]} language={language} onSelect={onSelect} /></>
}
export function PathwayScene({ circuit, language, onSelect, initialClinical = false }: { circuit: BrainCircuit; language: TerminologyLanguage; onSelect: (id: string) => void; initialClinical?: boolean }) {
  const [mode, setMode] = useState<'scheme' | 'anatomy'>('anatomy')
  const marker = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const [playOverride, setPlayOverride] = useState<boolean | null>(null)
  const playing = playOverride ?? !reduced
  const [speed, setSpeed] = useState(1)
  const [clinical, setClinical] = useState(initialClinical)
  const availableScenario = pathwayScenarios[circuit.id]
  const scenario = clinical ? availableScenario : undefined
  const [dialog, setDialog] = useState<'article' | 'scenario' | number | { nodeId: string } | null>(null)
  const closeDialog = useCallback(() => setDialog(null), [])
  const pickEdge = useCallback((index: number) => setDialog(index), [])
  const pickNode = useCallback((nodeId: string) => setDialog({nodeId}), [])
  const selectedNode = dialog && typeof dialog === 'object' ? circuit.nodes.find(node=>node.id===dialog.nodeId) : undefined
  const selectedStructure = selectedNode?.structureId ? structureById[selectedNode.structureId] : undefined
  const playback = useMemo(() => ({ circuit, playing: playing && dialog === null, speed, scenario, onEdgePick: pickEdge, onNodePick: pickNode }), [circuit,playing,speed,scenario,pickEdge,pickNode,dialog])
  const selectedEdge = typeof dialog === 'number' ? circuit.edges[dialog] : undefined
  const fromNode = selectedEdge && circuit.nodes.find(node => node.id === selectedEdge.from)
  const toNode = selectedEdge && circuit.nodes.find(node => node.id === selectedEdge.to)
  const effects = { excitation: 'Pobudzenie (+)', inhibition: 'Hamowanie (−)', modulation: 'Modulacja · efekt zależy od receptora', hormone: 'Sygnał hormonalny' }
  const dialogTitle = dialog === 'article' ? 'Opis szlaku' : dialog === 'scenario' ? scenario?.title ?? 'Fizjologia' : selectedNode ? pathwayNodeLabel(selectedNode,language) : 'Połączenie'

  useEffect(() => {
    if (playing && dialog === null) svg.current?.unpauseAnimations?.()
    else {
      svg.current?.pauseAnimations?.()
      if (svg.current?.getCurrentTime?.() === 0) svg.current.setCurrentTime?.(.001)
    }
  }, [playing, mode, circuit.id, speed, dialog])
  const height = circuit.nodes.length * 145 + 10
  const point = (id: string) => ({ x: 350, y: 78 + Number(id.slice(1)) * 145 })
  return <><section className="pathway-scene" aria-label="Widok szlaku" data-scenario={scenario?.id ?? 'physiology'}>
    <div className="pathway-heading"><h1>{language === 'en' ? circuit.names.en : circuit.names.pl}</h1><button className="text-button" onClick={() => setDialog('article')}>Opis szlaku ↗</button></div>
    <div className="pathway-controls">
      <div className="scene-mode-switch" role="group" aria-label="Widok szlaku"><button aria-pressed={mode === 'anatomy'} onClick={() => setMode('anatomy')}>Szlak 3D</button><button aria-pressed={mode === 'scheme'} onClick={() => setMode('scheme')}>Schemat</button></div>
      {availableScenario && <div className="scenario-switch" role="group" aria-label="Stan szlaku"><button aria-pressed={!clinical} onClick={() => setClinical(false)}>Fizjologia</button><button aria-pressed={clinical} onClick={() => setClinical(true)}>Schizofrenia</button></div>}
      <button className="playback-toggle" aria-pressed={playing} onClick={() => setPlayOverride(!playing)}>{playing ? 'Pauza' : 'Odtwórz'}</button>
      <details className="playback-options"><summary>Tempo</summary><label>Tempo animacji<select aria-label="Tempo animacji" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={0.5}>0,5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label></details>
    </div>
    {mode === 'anatomy' ? <Suspense fallback={<div className="model-message model-loading-placeholder">Ładowanie widoku 3D…</div>}><Brain3DScene language={language} highlightedIds={circuit.structureIds} pathway={playback} onSelect={onSelect} onFallback={() => setMode('scheme')} /></Suspense> : <>
      <div className="pathway-signal">{circuit.kind === 'axis' ? 'Oś neuroendokrynna' : circuit.kind === 'loop' ? 'Pętla' : circuit.kind === 'network' ? 'Sieć · powiązania uproszczone' : 'Projekcje'} · {circuit.transmitter}</div>
      <div className="pathway-graph" style={{ aspectRatio: `700 / ${height}` }}>
        <svg key={`${circuit.id}-${speed}`} ref={svg} viewBox={`0 0 700 ${height}`} role="group" data-playing={playing && dialog === null} aria-label={`Schemat: ${circuit.names.pl}. Położenie węzłów umowne, nie traktografia.`}>
          <defs>{Object.entries(effectColor).map(([effect, color]) => <marker key={effect} id={`${marker}-${effect}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={color} /></marker>)}</defs>
          {circuit.edges.map((edge, i) => {
            const from = point(edge.from), to = point(edge.to), branching = edge.from === 'n0' && Number(edge.to.slice(1)) > 1
            const lane = 100 - i * 12
            const path = branching ? `M 218 ${from.y} C ${lane} ${from.y}, ${lane} ${to.y}, 218 ${to.y}` : `M ${from.x} ${from.y + 38} L ${to.x} ${to.y - 38}`
            const sequential = circuit.kind === 'loop' || circuit.kind === 'axis' || circuit.id === 'tuberoinfundibular'
            const duration = (sequential ? circuit.edges.length * 1.6 : 2.6) / speed
            const start = sequential ? i / circuit.edges.length : 0, finish = sequential ? (i + 1) / circuit.edges.length : 1
            const times = [...new Set([0, start, finish, 1])]
            const motionPoints = times.map(t => t <= start ? 0 : 1)
            const opacity = times.map(t => t === start ? 1 : 0)
            return <g key={`${edge.from}-${edge.to}`} data-from={edge.from} data-to={edge.to} data-effect={edge.effect}><path d={path} fill="none" stroke={effectColor[edge.effect]} strokeWidth="3" strokeDasharray={circuit.kind === 'network' ? '7 7' : undefined} markerEnd={circuit.kind === 'network' ? undefined : `url(#${marker}-${edge.effect})`} />
              {circuit.kind === 'network' ? <path d={path} fill="none" stroke={effectColor[edge.effect]} strokeWidth="7" opacity=".15"><animate attributeName="opacity" values=".05;.65;.05" dur={`${2.6 / speed}s`} repeatCount="indefinite" /></path> : <circle r="7" fill={effectColor[edge.effect]} className="pathway-particle" data-animated-edge={i}><animateMotion path={path} dur={`${duration}s`} keyTimes={times.join(';')} keyPoints={motionPoints.join(';')} calcMode="linear" repeatCount="indefinite" /><animate attributeName="opacity" dur={`${duration}s`} values={sequential ? opacity.join(';') : '1;1'} keyTimes={sequential ? times.join(';') : '0;1'} calcMode="discrete" repeatCount="indefinite" /></circle>}
              <text role="button" tabIndex={0} aria-label={`Połączenie: ${circuit.nodes.find(n=>n.id===edge.from)?.label} → ${circuit.nodes.find(n=>n.id===edge.to)?.label} · ${edge.label}`} onClick={() => pickEdge(i)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pickEdge(i) } }} x={branching ? 94 : 370} y={branching ? to.y - 12 : (from.y + to.y) / 2 + 7} fill={effectColor[edge.effect]} fontSize="17">{edge.label}</text></g>
          })}
        </svg>
        {circuit.nodes.map(node => {
          const change = scenario?.changes.find(item => item.nodeId === node.id)
          const label = pathwayNodeLabel(node, language)
          const content = <>{label}{change && <small>{changeSymbols[change.kind]} {change.label.replace(/^[↑↓≈]\s*/, '')}</small>}</>
          return <div className="pathway-node" key={node.id} data-change={change?.kind} style={{ top: `${point(node.id).y / height * 100}%` }}>{<button onClick={() => pickNode(node.id)}>{content} <span>↗</span></button>}</div>
        })}

      </div>
    </>}
    <div className="pathway-key">{[...new Set(circuit.edges.map(edge => edge.effect))].map(effect => <span key={effect}><i style={{ background: effectColor[effect] }} />{effects[effect]}</span>)}<span>{transmitterName(circuit.transmitter)}</span></div>
    <div className={`pathway-insight ${scenario ? 'is-clinical' : ''}`} aria-live="polite">
      <div><span className="insight-kicker">{scenario?.evidenceLabel ?? 'Fizjologia'}</span><p>{scenario?.summary ?? circuit.summary}</p></div>
      {scenario && <button className="text-button" onClick={() => setDialog('scenario')}>Co się zmienia? ↗</button>}
    </div>
    {scenario?.relatedCircuitId && <a className="scenario-related" href={`#/szlaki/${scenario.relatedCircuitId}?stan=schizofrenia`}>Zobacz prążkowie asocjacyjne →</a>}
    <p className="pathway-limit">Przebieg schematyczny · ≈ punkt orientacyjny · ruch pokazuje kierunek sygnału, nie transport cząsteczek ani pomiar częstości impulsów.</p>
  </section>
  {dialog !== null && <AtlasDialog title={dialogTitle} onClose={closeDialog} className="pathway-dialog">
    {dialog === 'article' ? <PathwayContent circuit={circuit} language={language} onSelect={id => { closeDialog(); onSelect(id) }} /> : dialog === 'scenario' && scenario ? <div className="reading-content"><span className="insight-kicker">{scenario.evidenceLabel}</span><h3>Co się zmienia</h3><p>{scenario.mechanism}</p><h3>Znaczenie kliniczne</h3><p>{scenario.manifestation}</p><h3>Jak czytać model</h3><p>{scenario.caveat}</p><Sources references={resolveReferences(scenario.referenceIds)} /></div> : selectedNode ? <div className="reading-content">
      {selectedStructure && <p>{selectedStructure.shortRole}</p>}
      <h3>Rola w tym szlaku</h3>
      <div className="node-connections">{circuit.edges.map((edge,index) => edge.from === selectedNode.id || edge.to === selectedNode.id ? <button key={index} onClick={() => pickEdge(index)}>{pathwayNodeLabel(circuit.nodes.find(node=>node.id===edge.from)!,language)} {circuit.kind === 'network' ? '↔' : '→'} {pathwayNodeLabel(circuit.nodes.find(node=>node.id===edge.to)!,language)}<small>{transmitterName(edge.label)}</small></button> : null)}</div>
      {scenario?.changes.some(change=>change.nodeId===selectedNode.id) && <><h3>W tym scenariuszu</h3><p>{scenario.mechanism}</p><p>{scenario.caveat}</p><Sources references={resolveReferences(scenario.referenceIds)} /></>}
      {selectedNode.structureId && <button className="text-button" onClick={() => { closeDialog(); onSelect(selectedNode.structureId!) }}>Otwórz pełną kartę ↗</button>}
    </div> : selectedEdge && fromNode && toNode ? <div className="reading-content"><h3>{pathwayNodeLabel(fromNode,language)} → {pathwayNodeLabel(toNode,language)}</h3><p className="connection-transmitter">{transmitterName(selectedEdge.label)} · {effects[selectedEdge.effect]}</p><p>{circuit.physiology}</p>{scenario?.changes.some(change=>change.nodeId===toNode.id) && <><h3>W tym scenariuszu</h3><p>{scenario.mechanism}</p><p>{scenario.caveat}</p></>}<details><summary>Receptory i farmakologia</summary><p>{circuit.pharmacology}</p></details><Sources references={resolveReferences(scenario ? [...circuit.referenceIds,...scenario.referenceIds] : circuit.referenceIds)} /></div> : null}
  </AtlasDialog>}
  </>
}
