import { circuitById } from './circuits'
import type { LearningPath, LearningStep } from '../types/atlas'

const circuitStep = (id: string, title: string, lead: string, circuitIds: string[], comparison: string): LearningStep => {
  const items = circuitIds.map(id => circuitById[id])
  return { id, stage: title, title, lead, paragraphs: [], circuitIds, detail: { title: 'Porównanie mechanizmów', text: comparison }, takeaway: comparison, view: 'deep', structureIds: [...new Set(items.flatMap(item => item.structureIds))], referenceIds: [...new Set(items.flatMap(item => item.referenceIds))], connectionIds: [], scene: 'anatomy' }
}
type StepInput = [id: string, title: string, lead: string, circuitIds: string[], comparison: string]
const course = (slug: string, title: string, categoryId: LearningPath['categoryId'], minutes: number, inputs: StepInput[]): LearningPath => ({ slug, title, categoryId, minutes, subtitle: '', description: title, steps: inputs.map(args => circuitStep(...args)) })

export const extendedLearningPaths: LearningPath[] = [
  course('dopamina', 'Dopamina: szlaki i klinika', 'reward-motivation', 45, [
    ['mezolimbiczny', 'Szlak mezolimbiczny: znaczenie i uczenie', 'Projekcje VTA i rozróżnienie nagrody, motywacji oraz błędu przewidywania.', ['mesolimbic'], 'Nagroda jest wynikiem, wzmocnienie zmianą zachowania, a sygnał dopaminowy jednym z mechanizmów uczenia. Nie utożsamiaj dopaminy z przyjemnością.'],
    ['mezokortykalny', 'Szlak mezokortykalny: cel i pamięć robocza', 'Dopamina, glutaminian i lokalne hamowanie w PFC.', ['mesocortical', 'cortical-gaba'], 'Dopamina moduluje sieć, glutaminian przekazuje pobudzenie, a interneurony regulują timing i selektywność. Zaburzenie jednego elementu nie oznacza globalnego niedoboru przekaźnika.'],
    ['nigrostriatalny', 'Szlak nigrostriatalny: działanie i nawyk', 'SNc, SNr i terytoria prążkowia.', ['nigrostriatal', 'cstc-motor'], 'SNc jest źródłem dopaminy, SNr wyjściem GABA-ergicznym. Ich sąsiedztwo nie czyni ich tym samym układem.'],
    ['guzowo-lejkowy', 'Szlak guzowo-lejkowy: dopamina i prolaktyna', 'Droga neuronalna do wyniosłości pośrodkowej i etap naczyniowy do przysadki.', ['tuberoinfundibular'], 'Przedni płat jest regulowany przez substancje dostarczane układem wrotnym. Tylny płat otrzymuje inne projekcje i uwalnia oksytocynę oraz wazopresynę.'],
    ['awersja', 'Nagroda, awersja i uzależnienie', 'Porównaj obwody dopaminowe z układami uzdeczki i kontroli wartości.', ['habenula-lateral', 'habenula-medial', 'cstc-orbitofrontal'], 'MHb–IPN nie jest tym samym co LHb–RMTg. Etapy intoksykacji, odstawienia i oczekiwania angażują różne obwody.'],
    ['psychoza', 'Dopamina w psychozie: model i dowody', 'Klasyczny podział szlaków i współczesne badania prążkowia asocjacyjnego.', ['cstc-associative'], 'PET wspiera zmiany syntezy i uwalniania dopaminy w prążkowiu w części grup z psychozą. Objawy negatywne mogą mieć także przyczyny wtórne: depresję, objawy pozytywne i sedację. Rozdziel farmakologię D2 od hipotez etiologicznych.'],
  ]),
  course('neuromodulacja', 'Neuromodulacja i sen', 'neuromodulation', 50, [
    ['noradrenalina', 'Noradrenalina: uwaga, stres i ciało', 'Porównaj LC i grupy noradrenergiczne rdzenia przedłużonego.', ['noradrenergic-ascending', 'noradrenergic-visceral'], 'Czuwanie nie oznacza skutecznej kontroli uwagi. Bardzo silne pobudzenie może zaburzać PFC; LC i A1/A2 mają różne cele i role.'],
    ['serotonina', 'Serotonina: populacje i receptory', 'Projekcje grzbietowego, pośrodkowego i kaudalnego szwu.', ['serotonin-dorsal', 'serotonin-median', 'serotonin-descending'], 'Miejsce uwalniania, receptor i komórka docelowa rozstrzygają o efekcie. Serotonina nie jest jednolitym sygnałem „dobrego nastroju”.'],
    ['acetylocholina', 'Acetylocholina: uwaga i pamięć', 'Trzy zespoły projekcji cholinergicznych.', ['cholinergic-basal', 'septohippocampal', 'cholinergic-pontine'], 'Jądro podstawne, przegroda i PPN/LDT mają odmienne cele. Receptory nikotynowe i muskarynowe nie są wymiennymi mechanizmami.'],
    ['czuwanie', 'Histamina i oreksyna', 'Podwzgórzowa stabilizacja czuwania.', ['histaminergic', 'orexin'], 'Oreksyna stabilizuje wiele układów czuwania. Sedacja może wynikać z kilku mechanizmów jednego leku i nie jest tożsama ze snem fizjologicznym.'],
    ['sen', 'Sen: hamowanie i pętle wzgórza', 'Układy przedwzrokowe i rytmy wzgórzowo-korowe.', ['sleep-gaba', 'thalamocortical'], 'Presja snu, rytm dobowy i przełączanie stanów są różnymi procesami. Nie istnieje jeden ośrodek odpowiedzialny za całą architekturę snu.'],
    ['rytm-dobowy', 'Światło i zegar biologiczny', 'Synchronizacja dobowa różni się od działania nasennego.', ['circadian'], 'Przesunięcie fazy zależy od czasu bodźca. Istotna jest nie tylko substancja lub światło, ale także pora w rytmie biologicznym.'],
  ]),
  course('obwody-psychiatrii', 'Obwody psychiatrii', 'emotion-salience', 60, [
    ['drogi-jader-podstawy', 'Drogi jąder podstawy', 'Droga bezpośrednia, pośrednia i hiperbezpośrednia.', ['basal-direct', 'basal-indirect', 'basal-hyperdirect'], 'Zahamowanie komórki hamującej odhamowuje jej cel. Znak synapsy i efekt całego obwodu są różnymi rzeczami.'],
    ['petle-cstc', 'CSTC: ruch, reguły, wartość i motywacja', 'Terytoria ruchowe, asocjacyjne, oczodołowe i limbiczne.', ['cstc-motor', 'cstc-associative', 'cstc-orbitofrontal', 'cstc-limbic'], 'CSTC jest rodziną pętli, nie pojedynczym szlakiem OCD. Nazwa całego jądra jest mniej precyzyjna niż terytorium jego połączeń.'],
    ['pamiec-limbiczna', 'Obwód Papeza i pamięć', 'Sklepienie, ciała suteczkowate, wzgórze i kora przyśrodkowa.', ['papez', 'septohippocampal'], 'Amnezja może powstać także wskutek uszkodzenia poza hipokampem. Podobny objaw nie dowodzi identycznej lokalizacji ani mechanizmu.'],
    ['strach', 'Strach i uczenie bezpieczeństwa', 'Nabywanie reakcji, ekspresja i wygaszanie.', ['amygdala-output', 'fear-extinction'], 'Ekspresja autonomiczna nie jest tym samym co świadome poczucie strachu. Nowe uczenie nie musi usuwać wcześniejszego skojarzenia.'],
    ['stres-bol', 'Stres i modulacja bólu', 'Odpowiedź hormonalna oraz neuronalna regulacja nocycepcji.', ['hpa', 'pain-descending'], 'HPA jest osią hormonalną, a projekcje pniowe układem neuronalnym. Objaw cielesny nie dowodzi jednej określonej aktywności mózgowej.'],
    ['integracja', 'Kora i móżdżek: integracja', 'Mikroukład, projekcja i pętla.', ['corticocortical', 'cortical-gaba', 'cerebellar-cognitive'], 'Traktografia szacuje drogi włókien, fMRI mierzy pośredni sygnał hemodynamiczny, a badania uszkodzeń testują następstwa utraty elementu sieci. Anatomia, korelacja i przyczynowość wymagają różnych dowodów.'],
  ]),
  { slug: 'pola-brodmanna', title: 'Pola Brodmanna: funkcje i sieci', subtitle: '', description: 'Cytoarchitektura, lateralizacja i znaczenie kliniczne.', categoryId: 'integration', minutes: 75, steps: [
    ['czucie-i-ruch', 'Czucie, ruch i orientacja', [1,2,3,4,5,6,7,8], ['somatosensory-cortex','motor-cortex','precuneus']],
    ['kora-czolowa', 'Kora przedczołowa', [9,10,11,12,44,45,46,47], ['dlpfc','ofc','prefrontal-cortex']],
    ['widzenie-i-skron', 'Widzenie i kora skroniowa', [17,18,19,20,21,22,37,38], ['visual-cortex','auditory-cortex','parahippocampal-gyrus']],
    ['obreczy', 'Kora obręczy', [23,24,25,26,29,30,31,32,33], ['acc','pcc','vmpfc']],
    ['okolica-hipokampa', 'Kora przyhipokampowa', [27,28,34,35,36,48,49], ['hippocampus','parahippocampal-gyrus']],
    ['integracja-i-granice', 'Integracja i granice mapy', [13,14,15,16,39,40,41,42,43,50,51,52], ['insula','auditory-cortex','prefrontal-cortex']],
  ].map(([id,title,numbers,structures]) => ({ id: id as string, title: title as string, stage: title as string, lead: 'Lokalizacja, połączenia, udział w procesie i znaczenie kliniczne.', paragraphs: ['Pola Brodmanna definiuje budowa komórkowa. Granice zakrętów i współczesnych pól funkcjonalnych nie są identyczne z tą historyczną mapą.', 'Katalog obejmuje numery 1–52. Tylko 41 pól ma granice w źródłowej mapie PALS-B12; pozostałe wpisy opisują brak parceli lub problemy nomenklatury, bez pozornej pełnej segmentacji 3D.'], brodmannNumbers: numbers as number[], structureIds: structures as string[], referenceIds: ['haines','pfc-architecture','cingulate-architecture','entorhinal','language-modern'], connectionIds: [], view: 'medial', scene: 'anatomy', detail: { title: 'Co wynika z aktywacji?', text: 'BOLD, traktografia, badanie uszkodzeniowe i histologia odpowiadają na inne pytania. Aktywacja podczas zadania wskazuje na udział w określonych warunkach, nie wyłączną odpowiedzialność ani rozpoznanie.' }, takeaway: 'Odróżniaj udział w sieci od wyłącznej odpowiedzialności za funkcję.' } as LearningStep)) },
]
