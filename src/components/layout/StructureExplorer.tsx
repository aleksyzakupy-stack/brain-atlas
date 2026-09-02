import type { CSSProperties } from 'react'
import { functionalCategories } from '../../data/categories'
import { brainStructures, structureById } from '../../data/structures'
import { useAtlas } from '../../hooks/useAtlas'
import { useBrainNavigation } from '../../hooks/useBrainNavigation'
import { getStructureName } from '../../utils/terminology'
import { ChevronRightIcon } from '../common/Icons'
import { ModeNavigation } from './ModeNavigation'
import { ProjectFooter } from './ProjectFooter'

export function StructureExplorer() {
  const { state } = useAtlas()
  const { selectStructure } = useBrainNavigation()
  const selectedId = state.primarySelection?.type === 'structure' ? state.primarySelection.id : null
  const focus = state.anatomyFocusId ? structureById[state.anatomyFocusId] : undefined

  return (
    <aside className="structure-explorer" aria-label="Eksplorator struktur">
      <ModeNavigation />
      <div className="explorer-heading">
        <span className="eyebrow">Anatomia funkcjonalna</span>
        <h2>{focus ? getStructureName(focus, state.terminologyLanguage) : 'Struktury podstawowe'}</h2>
        <p>{focus ? 'Poziom szczegółowy' : 'Wybierz obszar na liście lub bezpośrednio na mózgu.'}</p>
      </div>

      <div className="structure-groups">
        {focus ? (
          <div className="structure-group">
            <span className="group-label">Podstruktury</span>
            {focus.childrenIds.map((id) => {
              const item = structureById[id]
              if (!item) return null
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`structure-list-item ${selectedId === item.id ? 'is-selected' : ''}`}
                  onClick={() => selectStructure(item.id)}
                >
                  <span className="category-dot" style={{ '--category-color': functionalCategories.find((category) => category.id === item.categoryId)?.color } as CSSProperties} />
                  <span>{getStructureName(item, state.terminologyLanguage)}</span>
                  <ChevronRightIcon />
                </button>
              )
            })}
          </div>
        ) : (
          functionalCategories.map((category) => {
            const structures = brainStructures.filter(
              (item) => item.displayAtBaseLevel && item.categoryId === category.id,
            )
            if (!structures.length) return null
            return (
              <div className="structure-group" key={category.id}>
                <span className="group-label">
                  <span className="category-dot" style={{ '--category-color': category.color } as CSSProperties} />
                  {category.label}
                </span>
                {structures.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`structure-list-item ${selectedId === item.id ? 'is-selected' : ''}`}
                    onClick={() => selectStructure(item.id)}
                  >
                    <span>{getStructureName(item, state.terminologyLanguage)}</span>
                    <ChevronRightIcon />
                  </button>
                ))}
              </div>
            )
          })
        )}
      </div>
      <ProjectFooter />
    </aside>
  )
}
