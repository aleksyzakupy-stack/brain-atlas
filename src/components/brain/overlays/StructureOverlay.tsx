import type { CSSProperties, KeyboardEvent } from 'react'
import { categoryById } from '../../../data/categories'
import { structureById } from '../../../data/structures'
import { lateralGeometry } from '../../../geometry/lateralGeometry'
import type { TerminologyLanguage } from '../../../types/atlas'
import { getStructureName } from '../../../utils/terminology'

type StructureOverlayProps = {
  selectedId: string | null
  focusId: string | null
  deepAnatomyVisible: boolean
  terminologyLanguage: TerminologyLanguage
  onSelect: (structureId: string) => void
  onZoom: (structureId: string) => void
  onHover: (structureId: string | null) => void
}

export function StructureOverlay({
  selectedId,
  focusId,
  deepAnatomyVisible,
  terminologyLanguage,
  onSelect,
  onZoom,
  onHover,
}: StructureOverlayProps) {
  const focus = focusId ? structureById[focusId] : undefined
  const focusIds = new Set(focus ? [focus.id, ...focus.childrenIds] : [])
  const relatedIds = new Set(selectedId ? structureById[selectedId]?.relatedStructureIds ?? [] : [])

  const geometries = lateralGeometry.filter((geometry) => {
    const structure = structureById[geometry.structureId]
    if (!structure) return false
    if (focus) return focusIds.has(structure.id)
    if (!structure.displayAtBaseLevel) return false
    return geometry.layer !== 'deep' || deepAnatomyVisible
  })

  const handleKeyDown = (event: KeyboardEvent<SVGPathElement>, structureId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(structureId)
    }
  }

  return (
    <g id="interaction-overlay">
      {geometries.map((geometry) => {
        const structure = structureById[geometry.structureId]
        const isFocusParent = focus?.id === structure.id
        const isSelected = selectedId === structure.id
        const isRelated = Boolean(selectedId && relatedIds.has(structure.id))
        const isDimmed = Boolean(selectedId && !isSelected && !isRelated)
        const classNames = [
          'brain-region',
          `region-${geometry.layer}`,
          isSelected && 'is-selected',
          isRelated && 'is-related',
          isDimmed && 'is-dimmed',
          isFocusParent && 'is-focus-parent',
        ].filter(Boolean).join(' ')
        const category = categoryById[structure.categoryId]
        const depthNote = geometry.layer === 'deep' ? ', struktura głęboka' : ''

        return (
          <path
            key={geometry.structureId}
            d={geometry.path}
            className={classNames}
            style={{ '--region-color': category.color } as CSSProperties}
            role={isFocusParent ? undefined : 'button'}
            tabIndex={isFocusParent ? -1 : 0}
            data-structure-id={structure.id}
            aria-label={`${getStructureName(structure, terminologyLanguage)}${depthNote}`}
            aria-pressed={isFocusParent ? undefined : isSelected}
            onClick={(event) => {
              event.stopPropagation()
              if (!isFocusParent) onSelect(structure.id)
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()
              if (!isFocusParent) onZoom(structure.id)
            }}
            onKeyDown={(event) => !isFocusParent && handleKeyDown(event, structure.id)}
            onMouseEnter={() => !isFocusParent && onHover(structure.id)}
            onMouseLeave={() => onHover(null)}
            onFocus={() => !isFocusParent && onHover(structure.id)}
            onBlur={() => onHover(null)}
          />
        )
      })}
    </g>
  )
}
