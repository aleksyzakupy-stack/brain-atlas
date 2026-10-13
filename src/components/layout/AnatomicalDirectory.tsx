import type { AtlasRegion } from '../../data/anatomicalAtlas'
import { regionName } from '../../data/anatomicalAtlas'
import type { TerminologyLanguage } from '../../types/atlas'

const groups = [
  ['cortex', 'Kora mózgu'],
  ['subcortex', 'Struktury głębokie'],
  ['cerebellum', 'Móżdżek'],
  ['ventricle', 'Układ komorowy'],
  ['white-matter', 'Istota biała'],
] as const

export function AnatomicalDirectory({ regions, selectedId, searching, language, onSelect, defaultOpen = false }: {
  regions: AtlasRegion[]; selectedId?: string; searching: boolean; language: TerminologyLanguage; onSelect: (id: string) => void; defaultOpen?: boolean
}) {
  return <nav className="anatomical-directory" aria-label="Struktury mózgu">
    {!regions.length && <p className="directory-empty" role="status">Brak pasujących struktur.</p>}
    {groups.map(([kind,label]) => {
      const matches = regions.filter(region => region.kind === kind)
      const pairs = new Map<string, AtlasRegion[]>()
      matches.forEach(region => pairs.set(region.names.pl, [...(pairs.get(region.names.pl) ?? []), region]))
      return matches.length ? <details key={kind} open={searching || matches.some(region=>region.id===selectedId) || (defaultOpen && !selectedId && kind === groups.find(([value])=>regions.some(region=>region.kind===value))?.[0])}><summary>{label}<small>{pairs.size}</small></summary>
        {[...pairs.entries()].map(([key,pair]) => <div key={key} className="region-pair"><button aria-current={pair.some(region => region.id === selectedId) ? 'page' : undefined} onClick={() => onSelect(pair[0].id)}>{regionName(pair[0],language)}</button></div>)}
      </details> : null
    })}
  </nav>
}
