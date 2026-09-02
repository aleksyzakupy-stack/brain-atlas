import type { BrainStructure, TerminologyLanguage } from '../types/atlas'

export const getStructureName = (
  structure: BrainStructure,
  language: TerminologyLanguage,
): string => {
  if (language === 'la') return structure.names.la || structure.names.en
  return structure.names[language]
}

export const terminologyLabels: Record<TerminologyLanguage, string> = {
  pl: 'PL',
  en: 'EN',
  la: 'LAT',
}
