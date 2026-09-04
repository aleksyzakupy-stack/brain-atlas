import { useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { TransformComponent, TransformWrapper, useControls } from 'react-zoom-pan-pinch'
import { categoryById } from '../../data/categories'
import { connectionById } from '../../data/connections'
import { structureById } from '../../data/structures'
import { getProjection, separateSchematicIds, sourceRegions, teachingRegions } from '../../geometry/atlasGeometry'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import type { AtlasView, LearningStep, TerminologyLanguage } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'
import { MinusIcon, PlusIcon, ResetIcon } from '../common/Icons'

const viewLabels: Record<AtlasView, string> = { lateral: 'Boczny', medial: 'Przyśrodkowy', deep: 'Struktury głębokie' }
type Props = {
  view: AtlasView; onView: (view: AtlasView) => void; selectedId?: string;
  step?: LearningStep; language: TerminologyLanguage; onSelect: (id: string) => void;
}

function ZoomControls({ reduced }: { reduced: boolean }) {
  const { zoomIn, zoomOut, resetTransform } = useControls()
  return <div className="zoom-controls" role="group" aria-label="Powiększenie schematu">
    <button aria-label="Pomniejsz" onClick={() => zoomOut(0.25, reduced ? 0 : 180)}><MinusIcon /></button>
    <button aria-label="Przywróć widok" onClick={() => resetTransform(reduced ? 0 : 180)}><ResetIcon /></button>
    <button aria-label="Powiększ" onClick={() => zoomIn(0.25, reduced ? 0 : 180)}><PlusIcon /></button>
  </div>
}

const pointFor = (index: number, count: number) => {
  if (count === 1) return { x: 400, y: 290 }
  if (count === 2) return { x: index ? 585 : 215, y: 290 }
  if (count === 3) return [{ x: 400, y: 155 }, { x: 215, y: 410 }, { x: 585, y: 410 }][index]
  return { x: index % 2 ? 590 : 210, y: 165 + Math.floor(index / 2) * (count > 4 ? 175 : 260) }
}

function ConnectionScene({ step, language, onSelect }: Pick<Props, 'language' | 'onSelect'> & { step: LearningStep }) {
  const connections = step.connectionIds.map(id => connectionById[id])
  const ids = [...new Set([...step.structureIds, ...connections.flatMap(c => [c.sourceId, c.targetId])])]
  const points = Object.fromEntries(ids.map((id, index) => [id, pointFor(index, ids.length)]))
  return <div className="network-scene">
    <svg viewBox="0 0 800 600" aria-label="Schemat powiązań, położenie węzłów umowne" role="img">
      <defs><marker id="connection-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#c6c4d9" /></marker></defs>
      {connections.map(connection => {
        const from = points[connection.sourceId], to = points[connection.targetId]
        const length = Math.hypot(to.x - from.x, to.y - from.y)
        const offset = 94 / length
        return <line key={connection.id} data-connection-id={connection.id} data-kind={connection.kind}
          x1={from.x + (to.x - from.x) * offset} y1={from.y + (to.y - from.y) * offset}
          x2={to.x - (to.x - from.x) * offset} y2={to.y - (to.y - from.y) * offset}
          stroke="#c6c4d9" strokeWidth="3" strokeDasharray={connection.kind === 'functional' ? '8 8' : undefined}
          markerEnd={connection.directed ? 'url(#connection-arrow)' : undefined}><title>{connection.title}</title></line>
      })}
      {ids.map(id => <circle key={id} cx={points[id].x} cy={points[id].y} r="88" fill={categoryById[structureById[id].categoryId].color} fillOpacity=".07" stroke={categoryById[structureById[id].categoryId].color} strokeOpacity=".3" />)}
    </svg>
    {ids.map(id => <button key={id} className="network-node" data-structure-id={id}
      style={{ left: `${points[id].x / 8}%`, top: `${points[id].y / 6}%`, '--category': categoryById[structureById[id].categoryId].color } as CSSProperties}
      onClick={() => onSelect(id)}><span className="category-dot" />{getStructureName(structureById[id], language)}<span className="node-hint">Otwórz strukturę ↗</span></button>)}
  </div>
}

function SeparateSchematic({ id, language, onSelect }: { id: string } & Pick<Props, 'language' | 'onSelect'>) {
  const groups = id === 'nucleus-accumbens' ? ['caudate', 'putamen', id] : id === 'hypothalamus' ? ['thalamus', id] : ['substantia-nigra', 'vta', 'pag', 'locus-coeruleus', 'raphe-nuclei']
  return <div className="separate-schematic">
    <span className="eyebrow">Schemat dydaktyczny</span>
    <h2>{id === 'nucleus-accumbens' ? 'Prążkowie i jego część brzuszna' : id === 'hypothalamus' ? 'Międzymózgowie' : 'Wybrane układy pnia mózgu'}</h2>
    <p>Układ elementów jest umowny. Schemat nie przedstawia ich kształtu, wielkości ani dokładnych granic.</p>
    <div className="schematic-nodes">{groups.map(item => <button key={item} aria-pressed={item === id} onClick={() => onSelect(item)}
      style={{ '--category': categoryById[structureById[item].categoryId].color } as CSSProperties}>
      <span className="category-dot" />{getStructureName(structureById[item], language)}
      <small>{item === 'locus-coeruleus' ? 'Most' : item === 'raphe-nuclei' ? 'Różne poziomy pnia mózgu' : ['vta', 'pag', 'substantia-nigra'].includes(item) ? 'Śródmózgowie' : structureById[item].localization}</small>
    </button>)}</div>
    <small>Ta struktura nie ma osobnego konturu w wykorzystanej projekcji aseg. Lokalizację opisano w karcie i źródłach.</small>
  </div>
}

export function AtlasScene({ view, onView, selectedId, step, language, onSelect }: Props) {
  const reduced = useReducedMotion()
  const [labels, setLabels] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [deepSide, setDeepSide] = useState(false)
  const [showAnatomy, setShowAnatomy] = useState(false)
  const gesture = useRef<{ x: number; y: number; moved: boolean } | null>(null)
  const projection = getProjection(view, selectedId === 'cerebellum' || deepSide)
  const allRegions = teachingRegions(projection).filter(region => structureById[region.id])
  const highlighted = selectedId ? [selectedId] : step?.structureIds ?? []
  const regions = allRegions.filter(region => (region.id !== 'striatum' || highlighted.includes('striatum')) && (region.id !== 'dlpfc' || highlighted.includes('dlpfc')))
  const visibleIds = new Set(regions.map(region => region.id))
  const isNetwork = step?.scene === 'connections' && !showAnatomy
  const isSeparate = selectedId && separateSchematicIds.includes(selectedId) && view === 'deep'
  const selected = selectedId ? structureById[selectedId] : undefined
  const caption = hovered ? structureById[hovered] : selected
  const pick = (id: string) => { if (!gesture.current?.moved) onSelect(id) }

  return <section className="scene-panel" aria-label="Interaktywny schemat mózgu">
    <div className="scene-topline"><span>{isNetwork ? 'Jak współpracują struktury' : 'Odkrywaj anatomię'}</span><span className="scene-number">{isNetwork ? 'Schemat relacji' : 'Atlas 2D'}</span></div>
    <div className="scene-toolbar">
      <div className="view-switch" role="group" aria-label="Widok mózgu">{(Object.keys(viewLabels) as AtlasView[]).map(id =>
        <button key={id} aria-pressed={view === id && !isNetwork} onClick={() => { onView(id); setShowAnatomy(true) }}>{viewLabels[id]}</button>)}</div>
      {step?.scene === 'connections' && <button className="text-button" aria-pressed={!!isNetwork} onClick={() => setShowAnatomy(!showAnatomy)}>{isNetwork ? 'Pokaż anatomię' : 'Pokaż powiązania'}</button>}
    </div>
    {!isNetwork && view === 'deep' && !isSeparate && <div className="projection-line"><label>Projekcja <select aria-label="Projekcja struktur głębokich" value={projection === 'deepSide' ? 'side' : 'front'} onChange={event => setDeepSide(event.target.value === 'side')} disabled={selectedId === 'cerebellum'}><option value="front">Czołowa</option><option value="side">Strzałkowa</option></select></label><span>Model atlasowy, nie obraz MR</span></div>}
    <TransformWrapper key={`${projection}-${isNetwork}-${isSeparate ? selectedId : ''}`} minScale={1} maxScale={3.5} smooth={!reduced}
      wheel={{ activationKeys: ['Control'] }} doubleClick={{ disabled: true }} panning={{ velocityDisabled: true }}
      keyboard={{ disabled: false, animationTime: reduced ? 0 : 150 }} velocityAnimation={{ disabled: true }}
      zoomAnimation={{ disabled: reduced }} autoAlignment={{ disabled: reduced }}>
      <div className="scene-surface" data-reduced-motion={reduced}>
        {isSeparate ? <SeparateSchematic id={selectedId} language={language} onSelect={onSelect} /> : <>
          {!isNetwork && <div className="orientation" aria-label="Orientacja projekcji"><span>Góra</span><span>{view === 'deep' ? (projection === 'deepSide' ? 'Tył' : 'L') : view === 'medial' ? 'Tył' : 'Przód'}</span><span>{view === 'deep' ? (projection === 'deepSide' ? 'Przód' : 'P') : view === 'medial' ? 'Przód' : 'Tył'}</span></div>}
          <TransformComponent wrapperClass="brain-transform" contentClass="brain-transform-content">
            {isNetwork && step ? <ConnectionScene step={step} language={language} onSelect={onSelect} /> : <svg className="anatomy-svg" viewBox="0 0 800 600" role="group" aria-label={`Mózg — ${viewLabels[view]}`}
              onPointerDown={event => { gesture.current = { x: event.clientX, y: event.clientY, moved: false } }}
              onPointerMove={event => { if (gesture.current && Math.hypot(event.clientX - gesture.current.x, event.clientY - gesture.current.y) > 7) gesture.current.moved = true }}
              onPointerCancel={() => { gesture.current = null }}>
              <g className="anatomical-layer" aria-label="Kontury anatomiczne DK i aseg">{sourceRegions(projection).map(region => <path key={region.label} d={region.path} data-parcel={region.label} fillRule="evenodd"><title>{region.label}</title></path>)}</g>
              {regions.map(region => {
                const structure = structureById[region.id], active = highlighted.includes(region.id)
                return <path key={region.id} d={region.path} data-structure-id={region.id} data-layer={region.approximate ? 'functional-overlay' : 'anatomy'}
                  className={`teaching-region ${active ? 'is-selected' : ''} ${region.approximate ? 'approximate-region' : ''}`}
                  style={{ '--category': categoryById[structure.categoryId].color } as CSSProperties}
                  role="button" tabIndex={0} aria-label={getStructureName(structure, language)} aria-pressed={active}
                  onClick={() => pick(region.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(region.id) } }}
                  onMouseEnter={() => setHovered(region.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(region.id)} onBlur={() => setHovered(null)}>
                  <title>{getStructureName(structure, language)}{region.approximate ? ' — przybliżony obszar funkcjonalny' : ''}</title>
                </path>
              })}
            </svg>}
          </TransformComponent>
          <ZoomControls reduced={reduced} />
          {caption && !isNetwork && <div className="structure-caption"><span className="category-dot" style={{ background: categoryById[caption.categoryId].color }} />{getStructureName(caption, language)}</div>}
        </>}
      </div>
    </TransformWrapper>
    <div className="scene-footnote">
      <p>{isNetwork ? 'Położenie węzłów jest umowne. Wybierz strukturę, aby otworzyć jej kartę.' : isSeparate ? 'Uzupełniający schemat lokalizacji • opis i źródła w karcie' : view === 'deep' ? (projection === 'deepSide' ? 'Projekcja strzałkowa; przód po prawej. Zestawienie struktur obu półkul, nie pojedynczy przekrój.' : 'L / P — lewa / prawa strona według etykiet atlasu aseg. Zestawienie struktur w projekcji.') : 'Lewa półkula • projekcja atlasowa DK; wyspa i kora słuchowa są odsłonięte w modelu.'}</p>
      {!isSeparate && <div className="diagram-key">{isNetwork ? <><span><i className="line-sample" />Połączenie anatomiczne</span><span><i className="line-sample dashed" />Związek funkcjonalny</span></> : <><span><i className="area-sample" />Kontur anatomiczny</span><span><i className="area-sample dashed" />Przybliżony obszar funkcjonalny</span></>}
        {!isNetwork && <button className="text-button" aria-pressed={labels} onClick={() => setLabels(!labels)}>{labels ? 'Ukryj podpisy' : 'Pokaż podpisy'}</button>}
      </div>}
      {!isNetwork && <div className="structure-chips" aria-label="Podpisy struktur">{regions.filter(region => labels || highlighted.includes(region.id) || (!highlighted.length && ['motor-cortex', 'visual-cortex', 'hippocampus', 'precuneus'].includes(region.id))).map(region => <button key={region.id} onClick={() => onSelect(region.id)} style={{ '--category': categoryById[structureById[region.id].categoryId].color } as CSSProperties}><span className="category-dot" />{getStructureName(structureById[region.id], language)}</button>)}</div>}
      {!isNetwork && highlighted.some(id => !visibleIds.has(id) && !separateSchematicIds.includes(id)) && <div className="off-view">Poza tą projekcją: {highlighted.filter(id => !visibleIds.has(id)).map(id => <button className="text-button" key={id} onClick={() => onSelect(id)}>{getStructureName(structureById[id], language)} ↗</button>)}</div>}
      {!isNetwork && !isSeparate && <small className="gesture-hint">Przeciągnij, aby przesunąć · + / −, gest szczypania lub Ctrl + przewijanie, aby powiększyć</small>}
    </div>
  </section>
}
