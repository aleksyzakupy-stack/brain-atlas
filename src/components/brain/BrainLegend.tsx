import { functionalCategories } from '../../data/categories'

export function BrainLegend() {
  return (
    <div className="brain-legend" aria-label="Legenda kategorii funkcjonalnych">
      {functionalCategories.map((category) => (
        <span key={category.id} title={category.description}>
          <i style={{ background: category.color }} />
          {category.label}
        </span>
      ))}
      <span className="legend-depth"><i /> anatomia głęboka</span>
    </div>
  )
}
