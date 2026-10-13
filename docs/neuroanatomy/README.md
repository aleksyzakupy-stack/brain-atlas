# Baza opisowa neuroanatomii dla projektu brain-atlas

Pakiet opracowano po polsku na podstawie rzeczywistego katalogu projektu oraz wskazanych plików źródłowych. Zawiera opisy anatomii, czynności, połączeń, lateralizacji i konsekwencji klinicznych. Przebieg dróg uzupełniają przekaźniki, miejsca przełączeń i skrzyżowań. Baza jest podłączona lokalnie do aplikacji. Sposób integracji, nawigację i kontrolę opisuje [INTEGRACJA.md](INTEGRACJA.md).

## Pliki do używania

- **[NEUROANATOMIA_KOMPENDIUM.md](NEUROANATOMIA_KOMPENDIUM.md)** — jeden pełny dokument z indeksem, wszystkimi artykułami i bibliografią.
- **[neuroanatomia-kompendium.json](neuroanatomia-kompendium.json)** — ta sama treść w strukturze danych, z identyfikatorami umożliwiającymi integrację.
- **[PRZEWODNIK.md](PRZEWODNIK.md)** — jak łączyć topografię, drogi, skrzyżowania, unaczynienie i obraz kliniczny.
- **[coverage.json](coverage.json)** — dokładne przyporządkowanie każdego regionu, karty i istniejącego obwodu do artykułu; liczniki, braki i sumy plików projektu.
- **[sources.json](sources.json)** — bibliografia z zakresem weryfikacji i pochodzeniem źródeł.
- **[spatial-index.json](spatial-index.json)** — odsyłacze od schematycznych węzłów do artykułów omawiających ich anatomię i rolę w obwodach; nie jest nowym atlasem geometrycznym.
- **[library/Haines-Neuroanatomy-in-Clinical-Context.pdf](library/Haines-Neuroanatomy-in-Clinical-Context.pdf)** — dodatkowy podręcznik pobrany z udostępnionego folderu MediaFire; pozostaje plikiem lokalnym ignorowanym przez Git.

## Zakres i sposób liczenia

Katalog bazowy ma 268 identyfikatorów atlasu: 148 parcel Destrieux (74 pary lewa/prawa), 38 etykiet ASEG oraz 82 parcele Brodmanna (41 numerów w obu półkulach). Osobno zawiera 28 kart funkcjonalnych i 34 obwody. Tekstowy katalog Brodmanna obejmuje wszystkie 52 numery występujące w projekcie; dla numerów bez geometrii lub o nieustalonej homologii opisano ograniczenia.

Artykuł może obsługiwać parę homologicznych regionów, a opis hipokampa może jednocześnie obsługiwać etykiety ASEG i kartę funkcjonalną. To świadome unikanie powielania identycznych tekstów. Sekcja lateralizacji wyjaśnia różnice stron i ograniczenia reguł. Łącznej liczby artykułów nie należy utożsamiać z liczbą obiektów 3D. Aktualne liczniki znajdują się w `coverage.json`.

Pokrycie oznacza każdy identyfikator z powyższych katalogów, a nie wszystkie znane człowiekowi jądra, warstwy, naczynia i mikropołączenia mózgu. Dodatkowe drogi i wybrane jądra potrzebne do zrozumienia obwodów są opisane jako uzupełnienia. Nie nadano im fikcyjnej geometrii. Lewa i prawa strona modelu nie określają indywidualnej dominacji językowej.

Uwzględniono także sześć grup nadrzędnych z `anatomyHierarchy.ts` i wszystkie nazwane węzły z `pathwaySpatial.ts`. Drobne jądro może być omówione wewnątrz artykułu o większej strukturze lub odpowiedniej drodze; odsyłacz wskazuje ten kontekst, nie osobną maskę MRI. Węzły takie jak nadnercze, tkanki docelowe i siatkówka pozostają elementami schematu poza mózgowiem. Komórka piramidowa i interneuron są typami komórek, nie osobnymi narządami. W `coverage.json` mają odrębne liczniki i mapowania, dzięki czemu nie zawyżają liczby 268 regionów atlasu.

## Zasady treści i źródeł

Tekst jest autorską syntezą i rozwinięciem istniejącego materiału projektu. Odróżnia ustaloną anatomię od interpretacji funkcjonalnej, wyników badań grupowych i modeli mechanizmów psychiatrycznych. Materiał ma charakter edukacyjny; nie jest indywidualnym planem diagnostyki lub leczenia. Nie przeszedł zewnętrznej recenzji klinicznej.

Podstawowymi książkami były trzy pliki podane przez użytkownika. PDF z atlasem ogólnym ma 588 stron, Repetytorium 98 stron, a EPUB neuroanatomiczny zawiera 449 obrazów. Wykonano ekstrakcję tekstu obu PDF i lokalny OCR EPUB, a następnie konsultowano odpowiednie fragmenty i ilustracje. Nie oznacza to przeczytania i indywidualnego sprawdzenia każdej strony wszystkich książek.

Odsyłacze `s. PDF` są liczone od pierwszej strony fizycznego pliku. `s. druk.` oznacza numer nadrukowany na stronie. Numery tablic i obrazy EPUB są odrębnymi lokalizatorami. Nie przyjęto jednej stałej różnicy stron dla wszystkich formatów. Błędy OCR rozstrzygano na podstawie obrazu i kontekstu; niesprawdzone numery nie powinny być dodawane przy dalszej redakcji.

Publiczne badania pierwotne i akademickie materiały źródłowe służą przede wszystkim do sprawdzania precyzyjnych granic, połączeń oraz ograniczeń dawnych uproszczeń. Przy źródłach zaznaczono zakres odczytu. Bibliografii odziedziczonej z `src/data/` nie uznano automatycznie za ponownie zweryfikowaną. `project-brodmann` i `project-circuits` dokumentują pochodzenie materiału; nie są niezależnymi źródłami naukowymi.

Oryginalne ilustracje, skany i pełne teksty książek nie są częścią treści kompendium. Warunki projektu dotyczące własnych tekstów nie przenoszą się na cudze publikacje. Podręcznik Haines w `library/` jest lokalną kopią roboczą, wyłączoną z Git przez lokalny `.gitignore`. Udostępnienie folderu MediaFire nie jest informacją o otwartej licencji książki.

## Ważne rozbieżności zauważone podczas opracowania

| Miejsce | Co trzeba rozróżnić | Jak zapisano to w nowym materiale |
|---|---|---|
| Projekt: `Left-VentralDC` / `Right-VentralDC` | `kind: ventricle` jest niewłaściwą kategorią tej złożonej etykiety międzymózgowia | Opis jako złożonego obszaru segmentacji; nie jako komory i nie jako wyizolowanego podwzgórza. Uwaga do ewentualnej późniejszej korekty kodu. |
| Projekt: pięć etykiet `CC_*` | Podział geometryczny nie jest ścisłym podziałem na dziób, kolano, pień, cieśń i płat | Zachowano ID; omówiono orientacyjny charakter podziału i brak jednoznacznego przypisania włókien. |
| Pola Brodmanna 12–16, 26–27, 34, 48–52 | Mapy historyczne, różne gatunki i późniejsze modyfikacje nie są identyczne | Nie dorobiono osobnych ludzkich funkcji lub granic bez uzasadnienia; BA50/51 pozostały wpisami bez ustalonej parceli. |
| Repetytorium, s. PDF 20 | Ciało modzelowate ma również połączenia skroniowe | Nie przejęto stwierdzenia, że płaty skroniowe stanowią wyjątek łączony wyłącznie spoidłem przednim. |
| Repetytorium, s. PDF 21 | Promienistości wzrokowa i słuchowa mają różne główne odcinki w stosunku do soczewki | Dla słuchowej opisano głównie część podsoczewkową; dla wzrokowej zasoczewkową i dalszy przebieg promienistości. |
| Repetytorium, s. PDF 49–50 | Skrzyżowanie większości drogi korowo-rdzeniowej nie oznacza skrzyżowania wszystkich jej włókien; korowo-jądrowe są w znacznej części obustronne | Podano poziom skrzyżowania, wyjątki i stronę objawów zależną od poziomu uszkodzenia. |
| Repetytorium, s. PDF 29 | Wazopresyna i oksytocyna nie mają rozłącznego przypisania odpowiednio tylko SON i tylko PVN | Rozróżniono populacje wielko- i drobnokomórkowe oraz oba układy neurosekrecyjne. |
| Klasyczne skróty o korze | BA42 nie jest po prostu drugim oznaczeniem całej pierwotnej kory słuchowej; smak nie mieści się wyłącznie w BA43 | Opisano rdzeń i obszary pozapierwotne słuchu oraz sieć wyspowo-wieczkową. |
| Interpretacje psychiatryczne | Objaw, aktywacja fMRI, poziom przekaźnika i przyczynowe uszkodzenie to różne dane | Unikano przypisania jednego zaburzenia pojedynczemu zakrętowi lub prostemu niedoborowi przekaźnika. |

Powyższe uwagi dokumentują redakcję tego pakietu. Nie są raportem wykonanych zmian w kodzie aplikacji.

## Dane i integracja

Główny JSON zawiera `schemaVersion`, `language`, `date`, `status`, `counts`, `entries` i `sources`. Każdy artykuł ma:

- `id`, `names.pl/en/lat` oraz `category`;
- `projectRegionIds`, `projectStructureIds`, `projectCircuitIds` — rzeczywiste ID projektu lub puste listy dla uzupełnienia;
- `relatedStructureIds`, `relatedCircuitIds` — opcjonalne odsyłacze do powiązanych kart i obwodów; nie zastępują ich głównego opisu i nie są liczone ponownie jako pokrycie;
- `projectHierarchyIds`, `projectSpatialAnchorIds` — grupy nadrzędne i nazwane orientacyjne węzły schematów; drobne struktury są niekiedy opisane wewnątrz szerszej karty;
- `anatomy`, `function`, `connections`, `clinical`, `laterality`, `limitations`;
- `sources` — identyfikator źródła i lokalizator/zakres odwołania;
- dla dróg także `route`, `decussation`, `transmitters`;
- opcjonalnie dodatkowe uwagi dowodowe i identyfikatory wcześniejszej bibliografii.

Przykładowe wyszukanie opisu bez ingerencji w aplikację:

```js
const article = reference.entries.find(entry =>
  entry.projectRegionIds.includes('Left-Hippocampus')
);
```

Puste listy nie oznaczają brakującej karty: mogą opisywać świadome rozszerzenie poza obecny katalog. Z kolei każde istniejące ID atlasu, karty i obwodu musi mieć dokładnie jeden artykuł główny. Walidator odrzuca braki, nieznane ID i wieloznaczne mapowanie.

## Odtwarzanie i kontrola

Źródłem redakcyjnym jest sześć plików `parts/*.json`, indeks `spatial-index.json` oraz rejestr `sources.json`. `inventory.mjs` odczytuje aktualny katalog z projektu, w tym cztery obwody zbudowane programowo, grupy hierarchii i węzły przestrzenne. Korzysta z zainstalowanego w projekcie TypeScriptu. Nie uruchamia aplikacji.

Z katalogu głównego repozytorium, przy zainstalowanych zależnościach projektu:

```sh
python3 docs/neuroanatomy/build_reference.py
python3 docs/neuroanatomy/build_reference.py --check
```

Potrzebne są Python 3 i Node.js dostępny jako `node`. Jeśli Node ma inne położenie, można wskazać go zmienną `BRAIN_ATLAS_NODE`. Tryb `--check` niczego nie zapisuje i sprawdza, czy zredagowane dane nadal generują identyczne Markdown, JSON i raport pokrycia.

Kontrola techniczna obejmuje kompletność pól, jednoznaczność ID, rejestr źródeł, wszystkie numery Brodmanna oraz aktualność eksportu. Nie jest testem prawdziwości każdego twierdzenia medycznego. Spis źródeł i ograniczenia merytoryczne trzeba zachowywać także po ewentualnym przeniesieniu treści do interfejsu.
