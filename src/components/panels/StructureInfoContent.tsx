import { useState, type CSSProperties } from 'react'
import { categoryById } from '../../data/categories'
import { structureById } from '../../data/structures'
import { useAtlas } from '../../hooks/useAtlas'
import { useBrainNavigation } from '../../hooks/useBrainNavigation'
import type { BrainStructure } from '../../types/atlas'
import { getStructureName } from '../../utils/terminology'
import { ChevronRightIcon } from '../common/Icons'
import { StructureBreadcrumbs } from './StructureBreadcrumbs'

type StructureInfoContentProps = {
  structure: BrainStructure
  compact?: boolean
}

const DetailList = ({ title, values }: { title: string; values: string[] }) => (
  <section className="info-section">
    <h3>{title}</h3>
    {values.length ? (
      <ul>{values.map((value) => <li key={value}>{value}</li>)}</ul>
    ) : (
      <p className="muted-copy">Brak danych na tym poziomie atlasu.</p>
    )}
  </section>
)

export function StructureInfoContent({ structure, compact = false }: StructureInfoContentProps) {
  const { state } = useAtlas()
  const { selectStructure, enterStructure } = useBrainNavigation()
  const [tab, setTab] = useState<'basics' | 'details'>('basics')
  const category = categoryById[structure.categoryId]

  if (compact) {
    return (
      <div className="compact-structure-info">
        <span className="category-badge" style={{ '--category-color': category.color } as CSSProperties}>
          <span />{category.label}
        </span>
        <h2>{getStructureName(structure, state.terminologyLanguage)}</h2>
        <p>{structure.shortRole}</p>
      </div>
    )
  }

  return (
    <article className="structure-info">
      <StructureBreadcrumbs structureId={structure.id} />
      <header className="structure-info-header">
        <span className="category-badge" style={{ '--category-color': category.color } as CSSProperties}>
          <span />{category.label}
        </span>
        <h2>{getStructureName(structure, state.terminologyLanguage)}</h2>
        <div className="terminology-line">
          <span>{structure.names.en}</span>
          {structure.names.la && <span>{structure.names.la}</span>}
          {structure.names.abbreviation && <strong>{structure.names.abbreviation}</strong>}
        </div>
      </header>

      <div className="info-tabs" role="tablist" aria-label="Zakres informacji">
        <button type="button" role="tab" aria-selected={tab === 'basics'} className={tab === 'basics' ? 'is-active' : ''} onClick={() => setTab('basics')}>
          Podstawy
        </button>
        <button type="button" role="tab" aria-selected={tab === 'details'} className={tab === 'details' ? 'is-active' : ''} onClick={() => setTab('details')}>
          Szczegóły
        </button>
      </div>

      {tab === 'basics' ? (
        <div className="info-tab-content" role="tabpanel">
          <section className="main-role">
            <span>Główna rola</span>
            <p>{structure.shortRole}</p>
          </section>
          <DetailList title="Funkcje" values={structure.functions} />
          <section className="info-section">
            <h3>Lokalizacja</h3>
            <p>{structure.localization}</p>
          </section>
          {structure.childrenIds.length > 0 && state.anatomyFocusId !== structure.id && (
            <button type="button" className="primary-action" onClick={() => enterStructure(structure.id)}>
              Przejdź głębiej <ChevronRightIcon />
            </button>
          )}
        </div>
      ) : (
        <div className="info-tab-content" role="tabpanel">
          <DetailList title="Główne wejścia" values={structure.inputs} />
          <DetailList title="Główne wyjścia" values={structure.outputs} />
          <section className="info-section">
            <h3>Powiązane struktury</h3>
            <div className="related-links">
              {structure.relatedStructureIds.map((id) => {
                const related = structureById[id]
                return related ? (
                  <button type="button" key={id} onClick={() => selectStructure(id)}>
                    {getStructureName(related, state.terminologyLanguage)}
                  </button>
                ) : null
              })}
            </div>
          </section>
          <DetailList title="Neuroprzekaźnictwo" values={structure.neurotransmitters} />
          <DetailList title="Pola Brodmanna" values={structure.brodmannAreas} />
          <section className="info-section">
            <h3>Podstruktury</h3>
            {structure.childrenIds.length ? (
              <div className="related-links">
                {structure.childrenIds.map((id) => {
                  const child = structureById[id]
                  return child ? <button type="button" key={id} onClick={() => selectStructure(id)}>{getStructureName(child, state.terminologyLanguage)}</button> : null
                })}
              </div>
            ) : <p className="muted-copy">Brak podstruktur na obecnym poziomie atlasu.</p>}
          </section>
          <section className="info-section future-section">
            <h3>Znaczenie w psychiatrii</h3>
            <p>Rozszerzony moduł kliniczny zostanie dodany w kolejnym etapie atlasu.</p>
          </section>
          <section className="info-section">
            <h3>Źródła</h3>
            <p className="muted-copy">Bibliografia zostanie uzupełniona w kolejnym etapie redakcyjnym.</p>
          </section>
        </div>
      )}
    </article>
  )
}
