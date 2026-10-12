import { useEffect, useRef, useState } from 'react'
import { brainStructures, structureById } from '../../data/structures'
import { categoryById } from '../../data/categories'
import type { TerminologyLanguage } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'
import { MinusIcon, PlusIcon, ResetIcon } from '../common/Icons'
import { createBrainViewer } from './three/brainViewer'
import type { BrainViewer } from './three/brainViewer'
import { isCortex, validateBrainModel } from './three/modelTypes'
import type { BrainModelData, CameraPreset, Hemisphere, HoveredParcel } from './three/modelTypes'

type Props = {
  selectedId?: string; highlightedIds?: string[]; language: TerminologyLanguage;
  onSelect: (id: string) => void; onFallback: () => void;
}
const emptyIds: string[] = []
let modelPromise: Promise<BrainModelData> | undefined
function loadModel() {
  modelPromise ??= fetch(`${import.meta.env.BASE_URL}models/brain-atlas.json`)
    .then(async response => {
      if (!response.ok) throw new Error('Model unavailable')
      const value: unknown = await response.json()
      validateBrainModel(value)
      return value
    }).catch(error => { modelPromise = undefined; throw error })
  return modelPromise
}

export default function Brain3DScene({ selectedId, highlightedIds = emptyIds, language, onSelect, onFallback }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const viewer = useRef<BrainViewer | null>(null)
  const [model, setModel] = useState<BrainModelData | null>(null)
  const [error, setError] = useState('')
  const [hovered, setHovered] = useState<HoveredParcel | null>(null)
  const [hemisphere, setHemisphere] = useState<Hemisphere>('both')
  const [separation, setSeparation] = useState(0)
  const [interiorOverride, setInteriorOverride] = useState<{ key: string; value: boolean } | null>(null)
  const callbacks = useRef({ onSelect })
  useEffect(() => { callbacks.current = { onSelect } }, [onSelect])
  const ids = selectedId ? [selectedId] : highlightedIds
  const selectionKey = ids.join(',')
  const selectionMeshes = model?.meshes.filter(mesh => ids.some(id => mesh.structureIds.includes(id))) ?? []
  const needsInterior = selectionMeshes.some(mesh => !isCortex(mesh)) || ids.some(id => ['insula', 'auditory-cortex', 'acc', 'pcc', 'vmpfc'].includes(id))
  const interior = interiorOverride?.key === selectionKey ? interiorOverride.value : needsInterior
  const selected = selectedId ? structureById[selectedId] : undefined
  const caption = hovered?.structureId ? structureById[hovered.structureId] : selected
  const availableIds = new Set(model?.meshes.flatMap(mesh => mesh.structureIds))
  const approximate = selectionMeshes.some(mesh => mesh.approximate)
  const ready = !!model && !error

  useEffect(() => {
    let alive = true
    async function initialize() {
      try {
        if (typeof window.WebGL2RenderingContext === 'undefined') throw new Error('WebGL2 unavailable')
        const data = await loadModel()
        if (!alive || !host.current) return
        viewer.current = createBrainViewer(host.current, data, {
          onPick: id => callbacks.current.onSelect(id),
          onHover: setHovered,
          onError: message => { if (alive) setError(message) },
        })
        setModel(data)
      } catch {
        if (alive) setError('Nie udało się uruchomić modelu 3D. Sprawdź połączenie i obsługę WebGL w przeglądarce lub skorzystaj ze schematu 2D.')
      }
    }
    void initialize()
    return () => { alive = false; viewer.current?.dispose(); viewer.current = null }
  }, [])

  useEffect(() => { viewer.current?.select(selectedId, highlightedIds) }, [selectedId, highlightedIds, model])
  useEffect(() => { viewer.current?.layers({ interior, hemisphere, separation }) }, [interior, hemisphere, separation, model])

  return <section className="brain-3d" aria-label="Interaktywny model mózgu 3D">
    <div className="model-tools">
      <button className="interior-toggle" disabled={!ready} aria-pressed={interior} onClick={() => setInteriorOverride({ key: selectionKey, value: !interior })}>Wnętrze</button>
      <div className="model-hemispheres" role="group" aria-label="Widoczne półkule">{([['both', 'Obie'], ['left', 'Lewa'], ['right', 'Prawa']] as const).map(([value, label]) => <button key={value} disabled={!ready} aria-pressed={hemisphere === value} onClick={() => setHemisphere(value)}>{label}</button>)}</div>
    </div>
    <div className="model-stage">
      <div className="brain-3d-host" ref={host} aria-hidden={error ? true : undefined} />
      {!ready && <div className="model-message" aria-live="polite">{error ? <><strong>Model 3D jest niedostępny</strong><p>{error}</p><button className="secondary-button" onClick={onFallback}>Otwórz schemat 2D</button></> : <><span className="model-loading" aria-hidden="true" /><p>Ładowanie anatomii 3D…</p></>}</div>}
      {ready && <>
        <div className="model-presets" role="group" aria-label="Ustawienie kamery">{([['lateral', 'Bok'], ['front', 'Przód'], ['top', 'Góra']] as [CameraPreset, string][]).map(([value, label]) => <button key={value} onClick={() => viewer.current?.preset(value)}>{label}</button>)}</div>
        <div className="zoom-controls" role="group" aria-label="Powiększenie modelu 3D"><button aria-label="Pomniejsz model" onClick={() => viewer.current?.zoom(1.2)}><MinusIcon /></button><button aria-label="Przywróć model" onClick={() => viewer.current?.reset()}><ResetIcon /></button><button aria-label="Powiększ model" onClick={() => viewer.current?.zoom(0.83)}><PlusIcon /></button></div>
        {(hovered || caption) && <div className="model-caption" aria-live="polite" title={hovered?.label}>
          <span className="category-dot" style={{ background: caption ? categoryById[caption.categoryId].color : 'var(--muted)' }} />
          <span>{hovered && !hovered.structureId ? hovered.label : caption ? getStructureName(caption, language) : ''}{approximate && !hovered && <abbr title="Przybliżenie obszaru funkcjonalnego na parcelach DK" className="approximation-mark"> ≈</abbr>}</span>
        </div>}
      </>}
    </div>
    {ready && <div className="model-bottom">
      <label className="hemisphere-spacing">Rozsuń półkule<input type="range" min="0" max="45" step="1" value={separation} onChange={event => setSeparation(Number(event.target.value))} /></label>
      <div className="model-selection"><select aria-label="Wybierz strukturę w modelu" value={selectedId && availableIds.has(selectedId) ? selectedId : ''} onChange={event => { if (event.target.value) onSelect(event.target.value) }}><option value="">Wybierz strukturę…</option>{brainStructures.filter(item => availableIds.has(item.id)).map(item => <option key={item.id} value={item.id}>{getStructureName(item, language)}</option>)}</select></div>
      {selected && !availableIds.has(selected.id) && <p className="model-notice">Brak modelu tej struktury. <button className="text-button" onClick={onFallback}>Schemat 2D ↗</button></p>}
    </div>}
  </section>
}
