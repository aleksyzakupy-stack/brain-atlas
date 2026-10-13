import type { Reference } from '../../types/atlas'

export function Sources({ references }: { references: Reference[] }) {
  return <ol className="sources-list">{references.map(reference => <li key={reference.id}>
    <a href={reference.url} target="_blank" rel="noreferrer">{reference.title} <span aria-hidden="true">↗</span></a>
    <small>{reference.authors}{reference.year ? ` · ${reference.year}` : ''}</small>
  </li>)}</ol>
}
