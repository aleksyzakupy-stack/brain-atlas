import type { TerminologyLanguage } from '../../types/atlas'
import { terminologyLabels } from '../../utils/terminology'
import { useAtlas } from '../../hooks/useAtlas'

const languages: TerminologyLanguage[] = ['pl', 'en', 'la']

export function TerminologySwitch() {
  const { state, dispatch } = useAtlas()

  return (
    <div className="terminology-switch" role="group" aria-label="Język terminologii anatomicznej">
      {languages.map((language) => (
        <button
          key={language}
          type="button"
          className={state.terminologyLanguage === language ? 'is-active' : ''}
          aria-pressed={state.terminologyLanguage === language}
          onClick={() => dispatch({ type: 'SET_TERMINOLOGY', language })}
        >
          {terminologyLabels[language]}
        </button>
      ))}
    </div>
  )
}
