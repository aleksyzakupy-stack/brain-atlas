import { lateralGeometryById } from '../../geometry/lateralGeometry'
import { structureById } from '../../data/structures'
import type { TerminologyLanguage } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'

type BrainLabelsProps = {
  hoveredId: string | null
  selectedId: string | null
  terminologyLanguage: TerminologyLanguage
  focusId: string | null
  zoom: number
}

const baseLabels = ['prefrontal-cortex', 'motor-cortex', 'somatosensory-cortex', 'visual-cortex', 'cerebellum']

export function BrainLabels({ hoveredId, selectedId, terminologyLanguage, focusId, zoom }: BrainLabelsProps) {
  const focus = focusId ? structureById[focusId] : undefined
  const labelIds = focus?.childrenIds.length
    ? focus.childrenIds
    : Array.from(new Set([...baseLabels, ...(hoveredId ? [hoveredId] : []), ...(selectedId ? [selectedId] : [])]))

  return (
    <g id="labels" className="brain-labels" pointerEvents="none">
      {labelIds.map((id) => {
        const structure = structureById[id]
        const geometry = lateralGeometryById[id]
        if (!structure || !geometry) return null
        const isEmphasized = id === hoveredId || id === selectedId || Boolean(focus)
        const label = structure.names.abbreviation && !isEmphasized
          ? structure.names.abbreviation
          : getStructureName(structure, terminologyLanguage)
        const width = Math.max(48, Math.min(178, label.length * 7.2 + 20))
        const x = geometry.labelAnchor.x
        const y = geometry.labelAnchor.y
        return (
          <g key={id} className={`brain-label ${isEmphasized ? 'is-emphasized' : ''}`} transform={`translate(${x} ${y}) scale(${1 / zoom})`}>
            <rect x={-width / 2} y={-14} width={width} height="28" rx="8" />
            <text textAnchor="middle" dominantBaseline="central">{label}</text>
          </g>
        )
      })}
    </g>
  )
}
