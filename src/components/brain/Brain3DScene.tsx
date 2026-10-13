import type { StructureConnectionFocus } from '../../data/structureConnections'
import { useAtlasFullscreen } from '../../hooks/useAtlasFullscreen'
import { useHoverHighlight } from '../../hooks/useHoverHighlight'
import { useEffect, useRef, useState } from 'react'
import { structureById } from '../../data/structures'
import { atlasRegionById, regionName } from '../../data/anatomicalAtlas'
import type { AtlasMode } from '../../data/anatomicalAtlas'
import { categoryById } from '../../data/categories'
import type { TerminologyLanguage } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'
import { MinusIcon, PlusIcon, ResetIcon, FullscreenIcon, ViewSettingsIcon } from '../common/Icons'
import { createBrainViewer } from './three/brainViewer'
import type { BrainViewer, PathwayPlayback } from './three/brainViewer'
import { LandscapePrompt } from './LandscapePrompt'
import { isCortex } from './three/modelTypes'
import { decodeBrainModel } from './three/loadBrainModel'
import { decodeStudioModel } from './three/studioModel'
import { readStorage, writeStorage } from '../../utils/storage'
import type { BrainModelData, CameraPreset, Hemisphere, HoveredParcel } from './three/modelTypes'

type Props = {
  selectedId?: string; highlightedIds?: string[]; language: TerminologyLanguage;
  onSelect: (id: string) => void; onClear?: () => void; onFallback: () => void;
  atlasMode?: AtlasMode; onAtlasMode?: (mode: AtlasMode) => void;
  pathway?: PathwayPlayback; connectionFocus?: StructureConnectionFocus;
}
const emptyIds: string[] = []
type Quality = 'standard' | 'high'
const modelPromises: Partial<Record<Quality, Promise<BrainModelData>>> = {}
function loadModel(quality: Quality) {
  const compressed = typeof DecompressionStream !== 'undefined'
  const file = quality === 'high' ? 'brain-high-resolution' : 'brain-detailed'
  modelPromises[quality] ??= fetch(`${import.meta.env.BASE_URL}models/brain-studio-${quality}.glb`)
    .then(response => decodeStudioModel(response, false))
    .catch(() => fetch(`${import.meta.env.BASE_URL}models/${file}.json${compressed ? '.gz' : ''}`).then(response => decodeBrainModel(response, compressed)))
    .catch(error => { delete modelPromises[quality]; throw error })
  return modelPromises[quality]!
}

export default function Brain3DScene({ selectedId, highlightedIds = emptyIds, language, onSelect, onClear, onFallback, atlasMode = 'anatomy', pathway, connectionFocus }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<BrainViewer | null>(null)
  const [model, setModel] = useState<BrainModelData | null>(null)
  const [quality, setQuality] = useState<Quality>(() => typeof DecompressionStream !== 'undefined' && readStorage('brainAtlas.quality') === 'high' ? 'high' : 'standard')
  const [loadedQuality, setLoadedQuality] = useState<Quality | null>(null)
  const [qualityNotice, setQualityNotice] = useState('')
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<HoveredParcel | null>(null)
  const [texture, setTexture] = useState(true)
  const [vessels, setVessels] = useState(() => !['tissue', 'atlas'].includes(readStorage('brainAtlas.visualMode') ?? 'vessels'))
  const [colors, setColors] = useState(() => readStorage('brainAtlas.visualMode') === 'atlas')
  const [vesselType, setVesselType] = useState<'both' | 'arteries' | 'veins'>('both')
  const [microvessels, setMicrovessels] = useState(true)
  const [labels, setLabels] = useState(false)
  const [hemisphereOverride, setHemisphereOverride] = useState<{ selection: string; value: Hemisphere } | null>(null)
  const [separation, setSeparation] = useState(0)
  const { enabled: hoverEnabled, toggle: toggleHover } = useHoverHighlight()
  const { fullscreen, toggleFullscreen } = useAtlasFullscreen()
  const fullscreenButton = useRef<HTMLButtonElement>(null)
  const [isolate, setIsolate] = useState(false)
  const [interiorOverride, setInteriorOverride] = useState<{ key: string; value: boolean } | null>(null)
  const callbacks = useRef({ onSelect, onClear })
  useEffect(() => { callbacks.current = { onSelect, onClear } }, [onSelect, onClear])
  const ids = selectedId ? [selectedId] : highlightedIds
  const selectionKey = ids.join(',')
  const hemisphere = hemisphereOverride?.selection === selectionKey ? hemisphereOverride.value : 'both'
  const selectionMeshes = model?.meshes.filter(mesh => (mesh.atlas === atlasMode || mesh.atlas === 'both') && ids.some(id => mesh.id === id || mesh.structureIds.includes(id))) ?? []
  const needsInterior = selectionMeshes.some(mesh => !isCortex(mesh)) || ids.some(id => ['insula', 'auditory-cortex', 'acc', 'pcc', 'vmpfc'].includes(id))
  const interior = interiorOverride?.key === selectionKey ? interiorOverride.value : !!connectionFocus || !!pathway || needsInterior
  const selected = selectedId ? structureById[selectedId] : undefined
  const region = atlasRegionById[hovered ? hovered.regionId ?? '' : selectedId ?? '']
  const caption = hovered?.structureId ? structureById[hovered.structureId] : selected
  const availableIds = new Set(model?.meshes.flatMap(mesh => [...mesh.structureIds, mesh.id]))
  const approximate = selectionMeshes.some(mesh => mesh.approximate)
  const canIsolate = selectionMeshes.length > 0
  const ready = !!model && !error
  const visualMode = vessels ? 'vessels' : colors || atlasMode === 'brodmann' ? 'atlas' : 'tissue'
  const changeVisualMode = (mode: 'tissue' | 'vessels' | 'atlas') => {
    setVessels(mode === 'vessels')
    setColors(mode === 'atlas')
    if (mode !== 'vessels') { setInteriorOverride({ key: selectionKey, value: false }); setIsolate(false) }
    writeStorage('brainAtlas.visualMode', mode)
  }

  useEffect(() => {
    let alive = true
    async function initialize() {
      try {
        if (typeof window.WebGL2RenderingContext === 'undefined') throw new Error('WebGL2 unavailable')
        const data = await loadModel(quality)
        if (!alive || !host.current) return
        if (viewer.current) viewer.current.upgrade(data)
        else viewer.current = createBrainViewer(host.current, data, {
          onPick: id => callbacks.current.onSelect(id),
          onClear: () => callbacks.current.onClear?.(),
          onHover: setHovered,
          onError: message => setError(message),
          onNotice: setQualityNotice,
        })
        setLoadedQuality(quality)
        setModel(data)
      } catch (failure) {
        if (typeof window.WebGL2RenderingContext !== 'undefined') console.error('Model 3D:', failure)
        if (alive && quality === 'high') {
          setQualityNotice('HQ niedostępne. Wybrano wersję standardową.')
          setQuality('standard')
        } else if (alive) setError('Brak połączenia lub obsługi WebGL2.')
      }
    }
    void initialize()
    return () => { alive = false }
  }, [quality])
  useEffect(() => {
    return () => { viewer.current?.dispose(); viewer.current = null }
  }, [])

  useEffect(() => { viewer.current?.select(selectedId, highlightedIds) }, [selectedId, highlightedIds, model])
  useEffect(() => { viewer.current?.hover(hoverEnabled) }, [hoverEnabled, model])
  useEffect(() => { viewer.current?.pathway(pathway) }, [pathway, model])
  useEffect(() => { viewer.current?.connections(connectionFocus) }, [connectionFocus, model])
  useEffect(() => { viewer.current?.layers({ interior, hemisphere: pathway || connectionFocus ? 'both' : hemisphere, separation: pathway || connectionFocus ? 0 : separation, atlas: atlasMode, texture, vessels: vessels && !pathway && !connectionFocus, vesselType, microvessels, colors: colors || atlasMode === 'brodmann', labels: labels, isolate: !!connectionFocus || isolate && canIsolate, language }) }, [interior, hemisphere, separation, atlasMode, texture, vessels, vesselType, microvessels, colors, labels, isolate, canIsolate, language, model, pathway, connectionFocus])

  return <section className={`brain-3d${pathway ? ' pathway-model' : ''}`} aria-label="Interaktywny model mózgu 3D">
    <details className="model-options" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus() } }}>
      <summary aria-label="Widok" title="Widok"><ViewSettingsIcon /></summary>
      <div className="model-options-panel">
        <div className="model-tools">
          <button className="interior-toggle" disabled={!ready} aria-pressed={interior} onClick={() => setInteriorOverride({ key: selectionKey, value: !interior })}>Wnętrze</button>
        </div>
        {!pathway && !connectionFocus && <div className="hemisphere-controls">
          <div role="group" aria-label="Półkule">{([['both', 'Całość'], ['left', 'Lewa'], ['right', 'Prawa']] as const).map(([value, label]) => <button key={value} disabled={!ready} aria-pressed={hemisphere === value} onClick={() => setHemisphereOverride({ selection: selectionKey, value })}>{label}</button>)}</div>
          <label>Rozsuń półkule<input type="range" aria-label="Rozsuń półkule" min="0" max="35" step="1" disabled={!ready || hemisphere !== 'both'} value={separation} onChange={event => setSeparation(Number(event.target.value))} /></label>
          {separation > 0 && hemisphere === 'both' && <small>Rozsunięcie zmienia naturalne relacje przestrzenne.</small>}
        </div>}
        <div className="model-layer-tools" role="group" aria-label="Warstwy modelu">
          <button disabled={!ready} aria-pressed={texture} onClick={() => setTexture(!texture)}>Tekstura</button>
          {!pathway && <button disabled={!ready} aria-pressed={labels} onClick={() => setLabels(!labels)}>Podpisy</button>}
          {!pathway && !connectionFocus && canIsolate && <button disabled={!ready} aria-pressed={isolate} onClick={() => setIsolate(!isolate)}>Izoluj</button>}
          <button className="hover-highlight-toggle" disabled={!ready} aria-pressed={hoverEnabled} onClick={toggleHover}>Podświetlaj pod kursorem</button>
        </div>
        {vessels && !pathway && !connectionFocus && <div className="vascular-options">
          <div role="group" aria-label="Rodzaj naczyń">{([['both', 'Oba'], ['arteries', 'Tętnice'], ['veins', 'Żyły']] as const).map(([value, label]) => <button key={value} aria-pressed={vesselType === value} onClick={() => setVesselType(value)}>{label}</button>)}</div>
          <button aria-pressed={microvessels} onClick={() => setMicrovessels(!microvessels)}>Drobne naczynia</button>
          <button onClick={() => { setSeparation(0); setHemisphereOverride({ selection: selectionKey, value: 'both' }); setInteriorOverride({ key: selectionKey, value: true }); viewer.current?.preset('bottom') }}>Podstawa mózgu</button>
        </div>}
        <div className="model-presets" role="group" aria-label="Ustawienie kamery">{([['lateral', 'Bok'], ['front', 'Przód'], ['top', 'Góra']] as [CameraPreset, string][]).map(([value, label]) => <button key={value} disabled={!ready} onClick={() => viewer.current?.preset(value)}>{label}</button>)}</div>
        <label className="model-quality">Jakość<select aria-label="Jakość modelu" value={quality} onChange={event => { setQualityNotice(''); setQuality(event.target.value as Quality); writeStorage('brainAtlas.quality', event.target.value) }}><option value="standard">Standard</option><option value="high" disabled={typeof DecompressionStream === 'undefined'}>HQ</option></select></label>
      </div>
    </details>
    <div className="model-stage">
      {!pathway && !connectionFocus && <div className="model-visual-modes" role="group" aria-label="Wygląd modelu">
        {([['tissue', 'Tkanka'], ['vessels', 'Naczynia'], ['atlas', 'Atlas']] as const).map(([value, label]) => <button key={value} disabled={!ready || atlasMode === 'brodmann' && value !== 'atlas'} aria-pressed={visualMode === value} onClick={() => changeVisualMode(value)}>{label}</button>)}
      </div>}
      <LandscapePrompt />
      <div className="model-display-controls">
        <button ref={fullscreenButton} className="model-fullscreen-toggle" aria-label={fullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'} title={fullscreen ? 'Zamknij pełny ekran' : 'Pełny ekran'} aria-pressed={fullscreen} onClick={toggleFullscreen}><FullscreenIcon expanded={fullscreen} /></button>
      </div>
      {quality !== loadedQuality && <span className="model-badge" aria-live="polite">Ładowanie {quality === 'high' ? 'HQ' : 'Standard'}…</span>}
      <div className="brain-3d-host" ref={host} aria-hidden={error ? true : undefined} />
      {!ready && <div className="model-message" aria-live="polite">{error ? <><strong>Model 3D jest niedostępny</strong><p>{error}</p><button className="secondary-button" onClick={onFallback}>Otwórz schemat 2D</button></> : <><span className="model-loading" aria-hidden="true" /><p>Ładowanie anatomii 3D…</p></>}</div>}
      {ready && <>
        {vessels && !pathway && !connectionFocus && !(isolate && canIsolate) && <div className="model-vessel-legend">{vesselType !== 'veins' && <span><i className="vessel-artery" />Tętnice</span>}{vesselType !== 'arteries' && <span><i className="vessel-vein" />Żyły</span>}<small>Przebieg poglądowy · drobne naczynia uwydatnione</small></div>}
        <div className="zoom-controls" role="group" aria-label="Powiększenie modelu 3D"><button aria-label="Pomniejsz model" onClick={() => viewer.current?.zoom(1.2)}><MinusIcon /></button><button aria-label="Przywróć model" onClick={() => viewer.current?.reset()}><ResetIcon /></button><button aria-label="Powiększ model" onClick={() => viewer.current?.zoom(0.83)}><PlusIcon /></button></div>
        {!pathway && (region || hovered || caption) && <div className="model-caption" aria-live="polite" title={hovered?.label}>
          <span className="category-dot" style={{ background: region?.color ?? (caption ? categoryById[caption.categoryId].color : 'var(--muted)') }} />
          <span>{region ? regionName(region,language) : hovered && !hovered.structureId ? hovered.label : caption ? getStructureName(caption, language) : ''}{approximate && !region && !hovered && <abbr title="Przybliżenie funkcjonalne" className="approximation-mark"> ≈</abbr>}</span>
        </div>}
      </>}
    </div>
    {ready && qualityNotice && <p className="model-notice" role="status">{qualityNotice}</p>}
    {ready && selected && !availableIds.has(selected.id) && <p className="model-notice">Brak modelu tej struktury. <button className="text-button" onClick={onFallback}>Schemat 2D ↗</button></p>}
  </section>
}
