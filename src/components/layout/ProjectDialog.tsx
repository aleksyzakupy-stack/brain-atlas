import { useCallback, useRef } from 'react'
import { useAtlas } from '../../hooks/useAtlas'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { CloseIcon } from '../common/Icons'
import { ProjectFooter } from './ProjectFooter'

export function ProjectDialog() {
  const { dispatch } = useAtlas()
  const dialogRef = useRef<HTMLDivElement>(null)
  const close = useCallback(() => dispatch({ type: 'SET_PROJECT_OPEN', open: false }), [dispatch])
  useDialogFocus(dialogRef, close)

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div ref={dialogRef} className="project-dialog" role="dialog" aria-modal="true" aria-labelledby="project-title">
        <button type="button" className="icon-button dialog-close" onClick={close} aria-label="Zamknij informacje o projekcie"><CloseIcon /></button>
        <span className="eyebrow">O projekcie</span>
        <h2 id="project-title">Neuroanatomia w klinicznym kontekście</h2>
        <p>Atlas porządkuje anatomię funkcjonalną ważną dla rozumienia procesów psychicznych. Etap pierwszy obejmuje struktury i ich podstawowe relacje anatomiczne.</p>
        <div className="scientific-note-block">
          <strong>Nota naukowa</strong>
          <p>Schemat edukacyjny. Lokalizacja struktur i granice obszarów mają charakter orientacyjny.</p>
        </div>
        <ProjectFooter />
      </div>
    </div>
  )
}
