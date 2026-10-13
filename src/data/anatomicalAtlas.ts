import entries from './atlasRegions.json'
import type { TerminologyLanguage } from '../types/atlas'
import { normalizeSearch } from '../utils/normalizeSearch'

export type AtlasMode = 'anatomy' | 'brodmann'
export type AtlasRegion = {
  id: string; hemisphere: string; kind: string; atlas: string; color: string;
  names: { pl: string; en: string; lat: string }; sourceRegion: string;
  number: number | null; source: string;
}
export const atlasRegions: AtlasRegion[] = entries
export const atlasRegionById = Object.fromEntries(atlasRegions.map(region => [region.id, region]))
export const hemisphereName = (side: string) => side === 'left' ? 'L' : side === 'right' ? 'P' : ''
export const regionName = (region: AtlasRegion, language: TerminologyLanguage) => region.names[language === 'la' ? 'lat' : language]
export const regionLabel = (region: AtlasRegion, language: TerminologyLanguage) => `${regionName(region, language)}${hemisphereName(region.hemisphere) ? ` · ${hemisphereName(region.hemisphere)}` : ''}`
export const regionUrl = (region: AtlasRegion) => `/atlas?warstwa=${region.atlas === 'brodmann' ? 'brodmann' : 'anatomy'}&obszar=${encodeURIComponent(region.id)}`
export const regionsForMode = (mode: AtlasMode) => atlasRegions.filter(region => region.atlas === mode || region.atlas === 'both').sort((a,b) => {
  if (a.number !== null || b.number !== null) return (a.number ?? Infinity) - (b.number ?? Infinity) || a.hemisphere.localeCompare(b.hemisphere)
  return regionLabel(a,'pl').localeCompare(regionLabel(b,'pl'),'pl')
})
export function matchesRegion(region: AtlasRegion, rawQuery: string) {
  const query = normalizeSearch(rawQuery)
  const ba = /^(?:ba|brodmann|brodmanna|pole brodmanna|brodmann area)\s*(\d+)$/.exec(query)
  return ba ? region.number === Number(ba[1]) : normalizeSearch(`${Object.values(region.names).join(' ')} ${region.sourceRegion}`).includes(query)
}
