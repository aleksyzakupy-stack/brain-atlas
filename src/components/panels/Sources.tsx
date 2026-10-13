import type { Reference } from '../../types/atlas'
import type { ReactNode } from 'react'

export function Sources({ references, children }: { references: Reference[]; children?: ReactNode }) {
  if (!references.length && !children) return null
  return <details className="sources-disclosure" onKeyDown={event => { if (event.key === 'Escape') { event.currentTarget.open = false; event.currentTarget.querySelector('summary')?.focus(); event.stopPropagation() } }}>
    <summary aria-label="Źródła" title="Źródła"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></svg></summary>
    <div className="sources-drawer">{references.length > 0 && <ol className="sources-list">{references.map(reference => <li key={reference.id}>
    <a href={reference.url} target="_blank" rel="noreferrer">{reference.title} <span aria-hidden="true">↗</span></a>
    <small>{reference.authors}{reference.year ? ` · ${reference.year}` : ''}</small>
  </li>)}</ol>}{children}</div></details>
}
