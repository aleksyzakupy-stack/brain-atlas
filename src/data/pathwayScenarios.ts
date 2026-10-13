import type { BrainCircuit, PathwayScenario, TerminologyLanguage } from '../types/atlas'
import { structureById } from './structures'
import { getStructureName } from '../utils/terminology'

// Deliberately limited to sourced dopamine examples. No automatic disease
// overlay is inferred for other pathways, targets, or neurotransmitters.
export const pathwayScenarios: Partial<Record<string, PathwayScenario>> = {
  mesolimbic: {
    id: 'schizophrenia',
    title: 'Nieadekwatne nadawanie istotności',
    summary: 'Model psychozy: neutralny bodziec może zyskać nieproporcjonalne znaczenie.',
    mechanism: 'Dysregulacja dopaminowa może zaburzać uczenie znaczenia bodźców. Zaznaczenie jądra półleżącego pokazuje element modelu istotności, nie pomiar nadmiaru dopaminy w tej strukturze.',
    manifestation: 'Może pomagać wyjaśniać, dlaczego przypadkowe zdarzenia są przeżywane jako szczególnie ważne i otrzymują interpretację urojeniową. Nie wyjaśnia wszystkich objawów schizofrenii.',
    caveat: 'Dane PET wskazują również na prążkowie asocjacyjne. Nie należy sprowadzać psychozy do projekcji VTA → jądro półleżące ani zakładać wzrostu aktywności wszystkich gałęzi.',
    evidenceLabel: 'Model mechanizmu',
    referenceIds: ['dopamine-modern', 'kegeles-striatum'],
    relatedCircuitId: 'nigrostriatal',
    changes: [{ nodeId: 'n1', kind: 'dysregulation', label: 'Istotność · model' }],
  },
  nigrostriatal: {
    id: 'schizophrenia',
    title: 'Dopamina w prążkowiu asocjacyjnym',
    summary: '↑ Synaptyczna transmisja DA w części asocjacyjnej prążkowia — obserwacja PET w badanej grupie.',
    mechanism: 'Badanie po zmniejszeniu dostępności endogennej dopaminy wskazało na wyższy poziom dopaminy synaptycznej w prążkowiu asocjacyjnym, szczególnie przedspoidłowej grzbietowej części jądra ogoniastego.',
    manifestation: 'Zmiana modulacji dopaminowej może wpływać na przetwarzanie informacji z kory przedczołowej. Związek z psychozą nie oznacza jednolitej nadaktywności całego układu ruchowego.',
    caveat: 'Jądro ogoniaste jest tu punktem orientacyjnym: model nie wydziela jego części asocjacyjnej. PET nie określa częstotliwości wyładowań SNc ani źródła każdej projekcji. Skorupie nie przypisano tego samego wyniku.',
    evidenceLabel: 'Obserwacja PET · wynik grupowy',
    referenceIds: ['kegeles-striatum'],
    changes: [{ nodeId: 'n1', kind: 'increase', label: '↑ DA · część asocjacyjna' }],
  },
  mesocortical: {
    id: 'schizophrenia',
    title: 'Osłabione uwalnianie DA w dlPFC',
    summary: '↓ Uwalnianie dopaminy po próbie amfetaminowej w dlPFC — wynik badania PET.',
    mechanism: 'W badanej grupie osób ze schizofrenią odpowiedź dopaminowa dlPFC na amfetaminę była słabsza niż u osób kontrolnych. To pomiar odpowiedzi na próbę, nie stałego stężenia DA w całej korze.',
    manifestation: 'Dopamina uczestniczy w regulacji pamięci roboczej. Wynik pomaga badać jej zaburzenia; nie dowodzi, że wszystkie objawy poznawcze lub negatywne wynikają z jednego niedoboru.',
    caveat: 'Nie przenosimy wyniku dlPFC automatycznie na vmPFC i ACC. Badanie nie mierzy częstotliwości impulsów VTA; szybkość animacji pozostaje umowna.',
    evidenceLabel: 'Obserwacja PET · próba farmakologiczna',
    referenceIds: ['slifstein-pfc'],
    changes: [{ nodeId: 'n1', kind: 'decrease', label: '↓ Uwalnianie DA · próba' }],
  },
}

export const changeSymbols = { increase: '↑', decrease: '↓', dysregulation: '' }
export const changeColor = '#edb17f'

export function pathwayNodeLabel(node: BrainCircuit['nodes'][number], language: TerminologyLanguage) {
  if (node.label === 'VTA') return language === 'en' ? 'Ventral tegmental area · VTA' : language === 'la' ? 'Area tegmentalis ventralis · VTA' : 'Pole brzuszne nakrywki · VTA'
  if (node.label === 'SN pars compacta') return language === 'en' ? 'Substantia nigra · SNc' : language === 'la' ? 'Substantia nigra pars compacta' : 'Istota czarna · SNc'
  const structure = node.structureId ? structureById[node.structureId] : undefined
  if (structure && ((language !== 'pl' && node.label === structure.names.pl) || ['dlPFC', 'vmPFC', 'ACC'].includes(node.label))) return getStructureName(structure, language)
  return node.label
}

export const transmitterName = (label: string) => label.replace(/\bDA\b/g, 'dopamina (DA)').replace(/\bGlu\b/g, 'glutaminian (Glu)').replace(/\bGABA\b/g, 'GABA').replace(/\bNA\b/g, 'noradrenalina (NA)').replace(/5-HT/g, 'serotonina (5-HT)').replace(/\bACh\b/g, 'acetylocholina (ACh)')
