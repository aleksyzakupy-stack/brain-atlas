import type { AtlasRegion } from '../../data/anatomicalAtlas'
import { hemisphereName, regionName } from '../../data/anatomicalAtlas'
import type { TerminologyLanguage } from '../../types/atlas'

const groups = [
  ['cortex', 'Kora mózgu'],
  ['subcortex', 'Struktury głębokie'],
  ['cerebellum', 'Móżdżek'],
  ['ventricle', 'Układ komorowy'],
  ['white-matter', 'Istota biała'],
] as const

export function AnatomicalDirectory({ regions, selectedId, searching, language, onSelect }: {
  regions: AtlasRegion[]; selectedId?: string; searching: boolean; language: TerminologyLanguage; onSelect: (id: string) => void
}) {
  return <nav className="anatomical-directory" aria-label="Struktury mózgu">
    {!regions.length && <p className="directory-empty" role="status">Brak pasujących struktur.</p>}
    {groups.map(([kind,label]) => {
      const matches = regions.filter(region => region.kind === kind)
      const pairs = new Map<string, AtlasRegion[]>()
      matches.forEach(region => pairs.set(region.names.pl, [...(pairs.get(region.names.pl) ?? []), region]))
      return matches.length ? <details key={kind} open={searching || matches.some(region=>region.id===selectedId)}><summary>{label}<small>{pairs.size}</small></summary>
        {[...pairs.entries()].map(([key,pair]) => <div key={key} className="region-pair"><span>{regionName(pair[0],language)}</span><div>{pair.map(region => <button key={region.id} aria-label={`${regionName(region,language)} ${hemisphereName(region.hemisphere)}`.trim()} title={region.hemisphere === 'left' ? 'Lewa półkula' : region.hemisphere === 'right' ? 'Prawa półkula' : 'Wybierz strukturę'} aria-current={selectedId===region.id ? 'page' : undefined} onClick={()=>onSelect(region.id)}>{hemisphereName(region.hemisphere) || '↗'}</button>)}</div></div>)}
      </details> : null
    })}
  </nav>
}
