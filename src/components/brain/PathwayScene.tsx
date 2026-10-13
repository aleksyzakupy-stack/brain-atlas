import { lazy, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { BrainCircuit, TerminologyLanguage } from '../../types/atlas'
import { circuitById } from '../../data/circuits'
import { pathwayNodeLabel, pathwayScenarios, transmitterName } from '../../data/pathwayScenarios'
import { resolveReferences } from '../../data/references'
import { bindingsForCircuit } from '../../data/pathwaySpatial'
import { entriesForCircuitNode, neuroByCircuit, neuroEntryName, neuroEntryUrl } from '../../data/neuroanatomy'
import { AtlasDialog } from '../layout/AtlasDialog'
import { PathwayContent } from '../panels/PathwayContent'
import { Sources } from '../panels/Sources'
import { LandscapePrompt } from './LandscapePrompt'
import { NeuroArticle } from '../neuroanatomy/NeuroArticle'
import { Model3DIcon, Model2DIcon, PlayIcon, PauseIcon, PreviousIcon, NextIcon, StepsIcon, BookIcon, CloseIcon, InfoIcon } from '../common/Icons'
import '../../styles/pathways.css'
import '../../styles/brain3d.css'

const Brain3DScene = lazy(() => import('./Brain3DScene'))
const effectColor = { excitation: '#f4bc75', inhibition: '#9dadf0', modulation: '#88d8bb', hormone: '#e3a7ce' }
export function LessonPathwayScene({ ids, language, onSelect }: { ids: string[]; language: TerminologyLanguage; onSelect: (id: string) => void }) {
  const [id, setId] = useState(ids[0])
  return <><label className="lesson-pathway-select">Szlak<select aria-label="Szlak w lekcji" value={id} onChange={event => setId(event.target.value)}>{ids.map(value => <option key={value} value={value}>{circuitById[value].names.pl}</option>)}</select></label><PathwayScene key={id} circuit={circuitById[id]} language={language} onSelect={onSelect} /></>
}
export function PathwayScene({ circuit, language, onSelect, initialClinical = false, panelTarget, onRegisterPlayerCloser }: { circuit: BrainCircuit; language: TerminologyLanguage; onSelect: (id: string) => void; initialClinical?: boolean; panelTarget?: HTMLElement | null; onRegisterPlayerCloser?: (close: (()=>void) | null) => void }) {
  const [mode, setMode] = useState<'scheme' | 'anatomy'>('anatomy')
  const marker = useId().replace(/:/g, '')
  const reduced = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [playing, setPlaying] = useState(!reduced)
  const [clinical, setClinical] = useState(initialClinical)
  const [stepIndex, setStepIndex] = useState<number | null>(null)
  const [stepPlaying, setStepPlaying] = useState(false)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'article' | 'scenario' | number | null>(null)
  const closePlayer = useCallback(()=>{setStepIndex(null);setStepPlaying(false)},[])
  useEffect(()=>{onRegisterPlayerCloser?.(closePlayer);return ()=>onRegisterPlayerCloser?.(null)},[closePlayer,onRegisterPlayerCloser])
  const scenario = clinical ? pathwayScenarios[circuit.id] : undefined
  const activeNode = stepIndex === null ? undefined : circuit.nodes[stepIndex]
  const activeEntries = activeNode ? entriesForCircuitNode(circuit,activeNode.id) : []
  const closeDialog = useCallback(() => setDialog(null), [])
  const pickEdge = useCallback((index: number) => setDialog(index), [])
  const pickNode = useCallback((id: string) => { const index = circuit.nodes.findIndex(node => node.id === id); if (index >= 0) { setStepIndex(index); setStepPlaying(false) } }, [circuit])
  const playback = useMemo(() => ({ circuit, playing: playing && dialog === null, speed: 1, scenario, onEdgePick: pickEdge, onNodePick: pickNode, activeNodeId: activeNode?.id }), [circuit,playing,scenario,pickEdge,pickNode,dialog,activeNode?.id])
  const selectedEdge = typeof dialog === 'number' ? circuit.edges[dialog] : undefined
  const effects = { excitation: 'Pobudzenie', inhibition: 'Hamowanie', modulation: 'Modulacja', hormone: 'Sygnał hormonalny' }
  useEffect(() => {
    if (!stepPlaying || dialog !== null || stepIndex === circuit.nodes.length-1) return
    const timer = setInterval(() => {
      setStepIndex(index => index === null || index >= circuit.nodes.length - 1 ? index : index + 1)
    },8000)
    return () => clearInterval(timer)
  },[stepPlaying,stepIndex,dialog,circuit.nodes.length])
  useEffect(() => () => clearTimeout(holdTimer.current),[])
  useEffect(() => {
    if (playing && dialog === null) svg.current?.unpauseAnimations?.()
    else { svg.current?.pauseAnimations?.(); if (svg.current?.getCurrentTime?.() === 0) svg.current.setCurrentTime?.(.001) }
  }, [playing, mode, circuit.id, dialog])
  const step = (delta: number) => { setStepPlaying(false); setStepIndex(index => Math.max(0,Math.min(circuit.nodes.length-1,(index ?? 0)+delta))) }
  const point = (id: string) => { const index = circuit.nodes.findIndex(node => node.id === id); return {x:160+(index%3)*240,y:100+Math.floor(index/3)*200} }
  const height = Math.max(300,Math.ceil(circuit.nodes.length/3)*200)
  const playerRunning = stepPlaying && stepIndex !== circuit.nodes.length-1
  const player = activeNode ? <aside className="pathway-player" aria-label="Krok szlaku">
        <div className="pathway-player-controls"><button className="icon-button" aria-label="Poprzednia struktura" disabled={stepIndex === 0} onClick={() => step(-1)}><PreviousIcon /></button><button className="icon-button" aria-label={playerRunning ? 'Wstrzymaj kroki' : 'Odtwórz kroki'} onClick={() => { if(stepIndex === circuit.nodes.length-1)setStepIndex(0); setStepPlaying(!playerRunning); setPlaying(true) }}>{playerRunning ? <PauseIcon /> : <PlayIcon />}</button><button className="icon-button" aria-label="Następna struktura" disabled={stepIndex === circuit.nodes.length-1} onClick={() => step(1)}><NextIcon /></button><span>{(stepIndex ?? 0)+1}/{circuit.nodes.length}</span><button className="icon-button" aria-label="Zamknij kroki" onClick={() => {setStepIndex(null);setStepPlaying(false)}}><CloseIcon /></button></div>
        <div className="pathway-step-text" key={activeNode.id}><h2>{pathwayNodeLabel(activeNode,language)}</h2>
          <span className="step-transmitter">{[...new Set(circuit.edges.filter(edge=>edge.from===activeNode.id || edge.to===activeNode.id).map(edge=>edge.label))].map(transmitterName).join(' · ')}</span>
          {activeEntries.length === 1 ? <NeuroArticle id={activeEntries[0].id} language={language} header={false} initialSection="function" spatialAnchor={bindingsForCircuit(circuit)[stepIndex ?? 0]} /> : <div className="related-links">{activeEntries.map(entry => <Link key={entry.id} to={neuroEntryUrl(entry)}>{neuroEntryName(entry,language)} ↗</Link>)}</div>}
          <details className="neuro-section"><summary>Połączenia w szlaku</summary><div className="step-connections">{circuit.edges.filter(edge => edge.from === activeNode.id || edge.to === activeNode.id).map((edge,i) => {
            const outgoing = edge.from === activeNode.id
            const other = circuit.nodes.find(node=>node.id===(outgoing ? edge.to : edge.from))!
            return <button key={i} onClick={()=>pickNode(other.id)}>{outgoing ? '→' : '←'} {pathwayNodeLabel(other,language)}</button>
          })}</div></details>
          {scenario?.changes.some(change=>change.nodeId===activeNode.id) && <details className="neuro-section"><summary>Schizofrenia</summary><p>{scenario.mechanism}</p><p>{scenario.manifestation}</p><details className="article-extra"><summary aria-label="Ograniczenia" title="Ograniczenia"><InfoIcon /></summary><p>{scenario.caveat}</p></details></details>}
        </div>
      </aside> : null
  return <><section className={`pathway-scene ${activeNode && !panelTarget ? 'with-player' : ''}`} aria-label="Widok szlaku" data-scenario={scenario?.id ?? 'physiology'}>
    <div className="pathway-heading"><h1>{language === 'en' ? circuit.names.en : circuit.names.pl}</h1>
      <div className="pathway-controls">
        {pathwayScenarios[circuit.id] && <div className="scenario-switch" role="group" aria-label="Stan szlaku"><button aria-pressed={!clinical} onClick={() => setClinical(false)}>Fizjologia</button><button aria-pressed={clinical} onClick={() => setClinical(true)}>Schizofrenia</button></div>}
        <button className="icon-button" aria-label={playing ? 'Wstrzymaj animację' : 'Odtwórz animację'} title={playing ? 'Wstrzymaj animację' : 'Odtwórz animację'} onClick={() => setPlaying(!playing)}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
        <button className="icon-button" aria-label="Krok po kroku" title="Krok po kroku" aria-pressed={stepIndex !== null} onClick={() => { setStepIndex(stepIndex === null ? 0 : null); setStepPlaying(false) }}><StepsIcon /></button>
        <button className="icon-button" aria-label="Opis szlaku" title="Opis szlaku" onClick={() => setDialog('article')}><BookIcon /></button>
      </div>
    </div>
    <div className="pathway-body">
      <div className="pathway-visual">
        <LandscapePrompt />
        <div className="scene-mode-switch" role="group" aria-label="Widok szlaku"><button aria-label="Szlak 3D" title="Szlak 3D" aria-pressed={mode === 'anatomy'} onClick={() => setMode('anatomy')}><Model3DIcon /></button><button aria-label="Schemat" title="Schemat 2D" aria-pressed={mode === 'scheme'} onClick={() => setMode('scheme')}><Model2DIcon /></button></div>
        {mode === 'anatomy' ? <Suspense fallback={<div className="model-message model-loading-placeholder">Ładowanie…</div>}><Brain3DScene language={language} highlightedIds={circuit.structureIds} pathway={playback} onSelect={onSelect} onFallback={() => setMode('scheme')} /></Suspense> : <div className="pathway-graph">
          <svg ref={svg} viewBox={`0 0 800 ${height}`} role="group" data-playing={playing && dialog === null} aria-label={circuit.names.pl}>
            <defs>{Object.entries(effectColor).map(([effect,color]) => <marker key={effect} id={`${marker}-${effect}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill={color} /></marker>)}</defs>
            {circuit.edges.map((edge,i) => {
              const from = point(edge.from), to = point(edge.to)
              const path = `M ${from.x} ${from.y} Q ${(from.x+to.x)/2} ${(from.y+to.y)/2-35} ${to.x} ${to.y}`
              const focused = !activeNode || edge.from === activeNode.id
              return <g key={i} opacity={focused ? 1 : .2}><path d={path} fill="none" stroke={effectColor[edge.effect]} strokeWidth="3" markerEnd={`url(#${marker}-${edge.effect})`} />{focused && <circle r="6" fill={effectColor[edge.effect]}><animateMotion path={path} dur="2.6s" repeatCount="indefinite" /></circle>}</g>
            })}
            {circuit.nodes.map(node => { const position = point(node.id); const active = activeNode?.id === node.id; return <g key={node.id} role="button" tabIndex={0} aria-label={pathwayNodeLabel(node,language)} onClick={() => pickNode(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pickNode(node.id) } }} onPointerEnter={event => { if(event.pointerType !== 'touch')setHoveredNode(node.id) }} onPointerLeave={() => {clearTimeout(holdTimer.current);setHoveredNode(null)}} onPointerDown={event => {if(event.pointerType === 'touch')holdTimer.current=setTimeout(()=>setHoveredNode(node.id),420)}} onPointerUp={() => clearTimeout(holdTimer.current)} onPointerCancel={() => {clearTimeout(holdTimer.current);setHoveredNode(null)}}><circle cx={position.x} cy={position.y} r={active ? 19 : 13} fill="#88d8bb" stroke={active ? '#f6ddb4' : '#d1f3e7'} strokeWidth="3" />{(hoveredNode === node.id || active) && <text x={position.x} y={position.y+44} textAnchor="middle" fill="#e4f5ef" fontSize="16">{pathwayNodeLabel(node,language)}</text>}</g> })}
          </svg>
        </div>}
      </div>
      {player && (panelTarget ? createPortal(player,panelTarget) : player)}
    </div>
  </section>
  {dialog !== null && <AtlasDialog title={dialog === 'article' ? circuit.names.pl : dialog === 'scenario' ? 'Schizofrenia' : 'Połączenie'} onClose={closeDialog} className="pathway-dialog">
    {dialog === 'article' ? <PathwayContent circuit={circuit} language={language} onSelect={id => {closeDialog();onSelect(id)}} /> : dialog === 'scenario' && scenario ? <div className="reading-content"><p>{scenario.mechanism}</p><p>{scenario.manifestation}</p><details className="article-extra"><summary aria-label="Ograniczenia"><InfoIcon /></summary><p>{scenario.caveat}</p></details><Sources references={resolveReferences(scenario.referenceIds)} /></div> : selectedEdge ? <div className="reading-content"><h3>{pathwayNodeLabel(circuit.nodes.find(node=>node.id===selectedEdge.from)!,language)} → {pathwayNodeLabel(circuit.nodes.find(node=>node.id===selectedEdge.to)!,language)}</h3><p>{transmitterName(selectedEdge.label)} · {effects[selectedEdge.effect]}</p>{neuroByCircuit[circuit.id] && <NeuroArticle id={neuroByCircuit[circuit.id]!.id} language={language} header={false} initialSection="route" />}</div> : null}
  </AtlasDialog>}
  </>
}
