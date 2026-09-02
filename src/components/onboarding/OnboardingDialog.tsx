import { useCallback, useRef } from 'react'
import { useAtlas } from '../../hooks/useAtlas'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { BrainMark } from '../common/Icons'

export function OnboardingDialog() {
  const { dispatch } = useAtlas()
  const dialogRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => dispatch({ type: 'DISMISS_ONBOARDING' }), [dispatch])
  useDialogFocus(dialogRef, close)

  return (
    <div className="dialog-backdrop onboarding-backdrop">
      <div ref={dialogRef} className="onboarding-dialog" role="dialog" aria-modal="true" aria-labelledby="onboarding-title" aria-describedby="onboarding-description">
        <span className="onboarding-mark"><BrainMark /></span>
        <span className="eyebrow">Interaktywny atlas</span>
        <h2 id="onboarding-title">Poznaj mózg warstwa po warstwie</h2>
        <p id="onboarding-description">Dotknij struktury mózgu, aby zobaczyć jej funkcje, lokalizację i główne połączenia.</p>
        <button type="button" className="primary-action" onClick={close}>Rozpocznij eksplorację</button>
        <small>Steruj dotykiem, gładzikiem lub klawiaturą.</small>
      </div>
    </div>
  )
}
