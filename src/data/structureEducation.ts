import { resolveReferences } from './references'

const material: Record<string, [string, string[]]> = {
  'prefrontal-cortex': ['Warto rozdzielać utrzymanie celu, ocenę wartości i dobór działania. Termin „funkcje wykonawcze” obejmuje kilka procesów i współpracujących obszarów.', ['working-memory', 'control']],
  dlpfc: ['Przy analizie pamięci roboczej pytaj, czy trudność dotyczy utrzymania informacji, czy operowania nią. Dane o dlPFC opisują mechanizmy poznawcze; sam objaw nie pozwala zlokalizować dysfunkcji.', ['working-memory', 'control']],
  vmpfc: ['Badania wygaszania reakcji warunkowych pomagają rozumieć uczenie bezpieczeństwa. Udział vmPFC nie oznacza, że jeden obszar „wyłącza” każdą emocję.', ['fear', 'regulation']],
  ofc: ['Ocenę konsekwencji warto odróżniać od hamowania reakcji. Okolica oczodołowa należy do szerszych układów uczenia i wyboru zachowania.', ['anatomy', 'brain']],
  acc: ['Różne części kory obręczy uczestniczą w różnych procesach. Wynik dotyczący grzbietowej ACC nie opisuje automatycznie całego zakrętu.', ['salience', 'control']],
  pcc: ['PCC jest jednym z obszarów analizowanych w badaniach pamięci i procesów wewnętrznych. Etykieta sieci nie jest rozpoznaniem klinicznym.', ['memory-systems', 'episodic']],
  insula: ['Sygnały cielesne są częścią doświadczenia emocji. W badaniach sieci istotności szczególne znaczenie ma przednia wyspa; cała wyspa nie jest funkcjonalnie jednorodna.', ['salience', 'brain']],
  precuneus: ['Przedklinek pomaga omawiać przestrzenny i osobisty kontekst doświadczeń. Opis udziału regionu w zadaniu nie oznacza swoistości dla jednego procesu.', ['episodic', 'memory-systems']],
  'motor-cortex': ['Obserwację ruchu można porządkować według wykonania, koordynacji i wyboru działania. Te etapy angażują różne elementy układu ruchowego.', ['brain', 'basal']],
  'somatosensory-cortex': ['Rozróżnij przetwarzanie sygnału z ciała od jego interpretacji emocjonalnej. Pierwotna kora czuciowa jest częścią rozległego układu przetwarzania somatycznego.', ['brain', 'anatomy']],
  'visual-cortex': ['Widzenie powstaje w wielu etapach. V1 oznacza pierwotną korę wzrokową; nie jest nazwą wszystkich obszarów wzrokowych ani pojedynczym wyjaśnieniem zaburzeń percepcji.', ['brain', 'anatomy']],
  'auditory-cortex': ['Analiza dźwięku i rozumienie jego znaczenia wymagają wielu obszarów. Nie należy sprowadzać złożonego doświadczenia słuchowego do aktywności A1.', ['brain', 'anatomy']],
  amygdala: ['Uczenie znaczenia bodźców obejmuje relację między sytuacją a przewidywanym wynikiem. Ciało migdałowate nie jest wyłącznie „ośrodkiem strachu”.', ['fear', 'emotional-memory']],
  hippocampus: ['W rozmowie o pamięci oddzielaj tworzenie nowego śladu od jego późniejszego wydobywania. Uszkodzenia przyśrodkowych części płatów skroniowych dostarczyły ważnych danych o tej różnicy.', ['hm', 'episodic']],
  'parahippocampal-gyrus': ['Kontekst miejsca i sceny pomaga organizować wspomnienia. Zakręt przyhipokampowy i hipokamp są odrębnymi strukturami współpracującego układu.', ['memory-systems', 'episodic']],
  striatum: ['Prążkowie uczestniczy w pętlach ruchowych i poznawczych. Podział na części pomaga odróżniać przetwarzanie związane z ruchem od wyboru i uczenia działania.', ['basal']],
  caudate: ['Jądro ogoniaste należy do prążkowia. Powiązania z korą należy rozumieć w kontekście całych pętli jąder podstawy.', ['basal']],
  putamen: ['Skorupa jest jednym z węzłów pętli czuciowo-ruchowych. Automatyzacja działania nie zachodzi w izolowanym regionie.', ['basal']],
  'nucleus-accumbens': ['Jądro półleżące jest częścią prążkowia brzusznego. Sygnału dopaminowego nie należy utożsamiać po prostu z przyjemnością.', ['neurochemistry', 'basal']],
  'globus-pallidus': ['Segmenty gałki bladej mają różne połączenia. Zbiorczy obraz regionu upraszcza strukturę pętli jąder podstawy.', ['basal']],
  thalamus: ['Wzgórze zawiera wiele jąder o odmiennych połączeniach. Zbiorcza etykieta nie opisuje jednego wspólnego mechanizmu dla wszystkich funkcji.', ['anatomy', 'basal']],
  hypothalamus: ['Objawy autonomiczne i zmiany homeostazy można omawiać jako współpracę podwzgórza, pnia i struktur korowych. Jest to poziom mechanizmu, nie lokalizacyjna diagnoza objawu.', ['visceral']],
  vta: ['Układy dopaminowe mają różne cele projekcji i zróżnicowane komórki. Sama nazwa neuroprzekaźnika nie wyjaśnia efektu leku ani obrazu zaburzenia.', ['neurochemistry']],
  'substantia-nigra': ['Część zbita i siatkowata mają odmienne role. Pierwsza jest ważnym źródłem dopaminy dla prążkowia, druga stanowi element wyjścia jąder podstawy.', ['basal', 'neurochemistry']],
  'locus-coeruleus': ['Układ noradrenergiczny pomaga omawiać regulację czuwania i reagowania na otoczenie. Jednego objawu pobudzenia nie można przypisać jednemu jądru.', ['neurochemistry']],
  'raphe-nuclei': ['Jądra szwu tworzą zróżnicowaną grupę. Opis projekcji serotoninergicznych nie uzasadnia modelu zaburzenia jako prostego niedoboru serotoniny.', ['neurochemistry']],
  pag: ['PAG łączy przetwarzanie obronne i autonomiczne ze zstępującą modulacją bólu. W atlasie ma postać orientacyjnego schematu.', ['visceral', 'brain']],
  cerebellum: ['Przy analizie ruchu odróżniaj dobór działania od jego koordynacji i korygowania błędów. Móżdżek współpracuje z korą i pniem w rozległych pętlach.', ['cerebellum']],
}

export function educationFor(id: string) {
  const [psychiatrySummary, ids] = material[id] ?? ['', ['anatomy']]
  return {
    psychiatrySummary,
    references: resolveReferences([...ids, 'anatomy']),
    interpretationNote: 'Opis edukacyjny dotyczy udziału struktury w układach mózgu. Nie pozwala wnioskować o przyczynie objawu ani o rozpoznaniu u konkretnej osoby.',
  }
}
