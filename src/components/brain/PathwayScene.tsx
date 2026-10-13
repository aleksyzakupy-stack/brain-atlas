import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { BrainCircuit, TerminologyLanguage } from '../../types/atlas'
import { circuitById } from '../../data/circuits'
import '../../styles/pathways.css'
import '../../styles/brain3d.css'

const Brain3DScene = lazy(() => import('./Brain3DScene'))

const effectColor = { excitation: '#f4bc75', inhibition: '#9dadf0', modulation: '#88d8bb', hormone: '#e3a7ce' }
export function LessonPathwayScene({ ids, language, onSelect }: { ids: string[]; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const [id, setId] = useState(ids[0])
  return <><label className="lesson-pathway-select">Szlak<select aria-label="Szlak w lekcji" value={id} onChange={event => setId(event.target.value)}>{ids.map(value => <option key={value} value={value}>{circuitById[value].names.pl}</option>)}</select></label><PathwayScene circuit={circuitById[id]} language={language} onSelect={onSelect} /></>
}
export function PathwayScene({ circuit, language, onSelect }: { circuit: BrainCircuit; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<'scheme' | 'anatomy'>('anatomy')
  const marker = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const [playOverride, setPlayOverride] = useState<boolean | null>(null)
  const playing = playOverride ?? !reduced
  const [speed, setSpeed] = useState(1)
  const playback = useMemo(() => ({ circuit, playing, speed }), [circuit,playing,speed])
  useEffect(() => { if (playing) svg.current?.unpauseAnimations?.(); else svg.current?.pauseAnimations?.() }, [playing, mode, circuit.id, speed])
  const height = circuit.nodes.length * 145 + 10
  const point = (id: string) => ({ x: 350, y: 78 + Number(id.slice(1)) * 145 })
  return <section className="pathway-scene" aria-label="Widok szlaku">
    <div className="scene-mode-switch" role="group" aria-label="Widok szlaku"><button aria-pressed={mode === 'anatomy'} onClick={() => setMode('anatomy')}>Szlak 3D</button><button aria-pressed={mode === 'scheme'} onClick={() => setMode('scheme')}>Schemat</button></div>
    <div className="pathway-animation-tools"><button aria-pressed={playing} onClick={() => setPlayOverride(!playing)}>{playing ? 'Pauza' : 'Odtwórz'}</button><label>Tempo<select aria-label="Tempo animacji" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={0.5}>0,5×</option><option value={1}>1×</option><option value={2}>2×</option></select></label><span>{circuit.transmitter}</span></div>
    {mode === 'anatomy' ? <Suspense fallback={<div className="model-message model-loading-placeholder">Ładowanie widoku 3D…</div>}><Brain3DScene language={language} highlightedIds={circuit.structureIds} pathway={playback} onSelect={onSelect} onFallback={() => setMode('scheme')} /></Suspense> : <>
      <div className="pathway-signal">{circuit.kind === 'axis' ? 'Oś neuroendokrynna' : circuit.kind === 'loop' ? 'Pętla' : circuit.kind === 'network' ? 'Sieć · powiązania uproszczone' : 'Projekcje'} · {circuit.transmitter}</div>
      <div className="pathway-graph" style={{ aspectRatio: `700 / ${height}` }}>
        <svg key={`${circuit.id}-${speed}`} ref={svg} viewBox={`0 0 700 ${height}`} role="img" data-playing={playing} aria-label={`Schemat: ${circuit.names.pl}. Położenie węzłów umowne, nie traktografia.`}>
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
              <text x={branching ? 94 : 370} y={branching ? to.y - 12 : (from.y + to.y) / 2 + 7} fill={effectColor[edge.effect]} fontSize="17">{edge.label}</text></g>
          })}
        </svg>
        {circuit.nodes.map(node => <div className="pathway-node" key={node.id} style={{ top: `${point(node.id).y / height * 100}%` }}>{node.structureId ? <button onClick={() => onSelect(node.structureId!)}>{node.label} <span>↗</span></button> : <span>{node.label}</span>}</div>)}
      </div>
    </>}
    <div className="pathway-key"><span><i style={{ background: effectColor.excitation }} />Glu +</span><span><i style={{ background: effectColor.inhibition }} />GABA −</span><span><i style={{ background: effectColor.modulation }} />Modulacja</span><span><i style={{ background: effectColor.hormone }} />Hormony</span></div>
    <p className="pathway-limit">Przebieg schematyczny, nie traktografia. ≈ Punkt orientacyjny. Czas umowny.</p>
  </section>
}
