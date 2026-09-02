import { BrainLegend } from './BrainLegend'
import { BrainToolbar } from './BrainToolbar'
import { BrainZoomControls } from './BrainZoomControls'
import { LateralBrainView } from './views/LateralBrainView'

export function BrainCanvas() {
  return (
    <main id="atlas" className="brain-canvas" tabIndex={-1}>
      <BrainToolbar />
      <div className="brain-stage">
        <div className="orientation-marker" aria-hidden="true"><strong>L</strong><span>bok lewy</span></div>
        <LateralBrainView />
        <p className="interaction-hint">Dotknij struktury · przeciągnij, aby przesunąć · uszczypnij, aby powiększyć</p>
      </div>
      <BrainLegend />
      <BrainZoomControls />
      <p className="scientific-note">Schemat edukacyjny. Lokalizacja struktur i granice obszarów mają charakter orientacyjny.</p>
    </main>
  )
}
