# Neuroatlas — mózg w psychiatrii

Statyczny, polskojęzyczny atlas edukacyjny w React, TypeScript, Vite, Three.js i SVG.

- Nauka: siedem tras, 42 kroki — pamięć, emocje, kontrola poznawcza, dopamina, neuromodulacja, obwody psychiatryczne i pola Brodmanna. Nowe lekcje udostępniają animowane schematy oraz szczegółowe artykuły ze źródłami.
- Atlas: 148 obszarów korowych Destrieux, 38 struktur ASEG i 82 regiony pól Brodmanna (41 w każdej półkuli), wybierane bezpośrednio na modelu i z listy; nazwy PL / EN / LAT. Osobny indeks Funkcje zachowuje 28 kart edukacyjnych.
- Model 3D: pełne fsaverage HQ, 655 360 trójkątów kory, czterokrotnie więcej niż Standard (fsaverage6). Płynne sterowanie, tekstura z głębokości bruzd, kolory atlasów i podpisy z liniami wskazującymi. Zmiana jakości nie resetuje kamery ani wyboru. Podpisy są domyślnie włączone; ocena widoczności ogranicza nakładanie i podpisywanie zasłoniętej anatomii.
- Szlaki: 34 układy i obwody, anatomia, fizjologia, znaczenie psychiatryczne, farmakologia i ograniczenia dowodów. Wszystkie krawędzie schematów są animowane: sygnał w projekcjach, kolejne etapy pętli i osi, pulsacja relacji sieciowych. Pauza i tempo 0,5× / 1× / 2×; ograniczenie ruchu zatrzymuje animację do świadomego odtworzenia. To schematy, nie traktografia ani pomiar czasu przewodzenia.
- Pola Brodmanna: katalog numerów 1–52 z lokalizacją, funkcjami, mechanizmem i kontekstem klinicznym. 41 pól ma geometrię PALS-B12; pozostałe opisy wyjaśniają brak parceli lub ograniczenia historycznej nomenklatury. BA50/51 nie otrzymują wymyślonej funkcji.
- Typografia: lokalne Manrope i Source Serif 4, licencje OFL; brak zapytań do zewnętrznego serwera fontów.
- Schematy 2D: boczny, przyśrodkowy i struktury głębokie (projekcje czołowa / strzałkowa). Pozostają dostępne także bez WebGL. Lekcje o połączeniach rozpoczynają się od schematu relacji.
- Wyszukiwanie struktur, funkcji, lekcji i powiązań z obsługą PL / EN / LAT i tekstu bez polskich znaków.
- Powrót z karty do lekcji, dowolny wybór kroku, lokalny postęp w formacie `brainAtlas.learning.v1`; brak localStorage nie blokuje nauki.
- 3D: przeciąganie obraca, kółko lub szczypanie przybliża, prawy przycisk lub dwa palce przesuwają. Strzałki obracają, + / − zmieniają skalę, Home przywraca kamerę. Wybór dostępny także z listy bez celowania w model. Kamera nie resetuje się przy wyborze kolejnej struktury w atlasie. Brak automatycznego obrotu i ciągłego renderowania w spoczynku.
- 2D: react-zoom-pan-pinch 4.2.0; Ctrl + kółko, szczypanie i przyciski + / −. Ctrl/Cmd + K otwiera wyszukiwanie.
- Na tablecie wysuwana lista; na telefonie przełącznik Mózg / Opis i stale dostępne sterowanie lekcją. Dotknięcie modelu 3D nie chowa go automatycznie.

## Uruchomienie

```sh
npm ci
npm run dev -- --port 5184
```

```sh
npm run lint
npm test
npm run build
```

Adresy: `/#/`, `/#/atlas`, `/#/struktury/hipokamp`, `/#/nauka/pamiec/orientacja`.
Istniejące adresy kart zostały zachowane. Po publikacji pod ścieżką repozytorium stosowany jest `VITE_BASE_PATH=/brain-atlas/`.

GitHub Pages jest publikowany przez istniejący workflow po zmianie `main`; wykonuje lint, testy i build przed wysłaniem artefaktu.

## Pochodzenie geometrii

### Model 3D

Domyślne HQ (`public/models/brain-high-resolution.json.gz`) zawiera pełne powierzchnie fsaverage: 163 842 wierzchołki i 327 680 trójkątów na półkulę. Plik ma 16,36 MB, 58,71 MB po rozpakowaniu. Standard (`brain-detailed.json.gz`) zachowuje fsaverage6: 40 962 wierzchołki i 81 920 trójkątów na półkulę. Oba warianty mają te same regiony Destrieux/PALS-B12/ASEG, wspólne współrzędne surface-RAS i identyfikatory. Przeglądarki bez DecompressionStream używają zwykłego JSON Standard. Błąd pobrania HQ przełącza na Standard. Three.js ładuje się osobno.

PALS-B12 dostarcza pola 1–11, 17–33 i 35–47. Brakujące numery nie otrzymują wymyślonych granic. Podwzgórze, VTA, istota czarna, miejsce sinawe, jądra szwu i PAG nie mają osobnej geometrii; VentralDC nie jest osobną segmentacją podwzgórza. Przypisania kart funkcjonalnych przez nakładanie z DK są przybliżeniami dydaktycznymi i nie wyznaczają granic Brodmanna. Rozsuwanie półkul zmienia naturalne relacje przestrzenne.

Reprodukowalny eksporter, sumy SHA-256, współrzędne i ograniczenia: [pochodzenie szczegółowego modelu 3D](public/licenses/BRAIN_DETAILED_PROVENANCE.md). Eksport: `scripts/export-detailed-atlas.py`; słownik nazw: `scripts/atlas-names.json`. Model wymaga WebGL2; awaria GPU lub pobrania pliku udostępnia 2D, bez blokowania kart i lekcji. Przykład bezpośredniego wyboru: `/#/atlas?warstwa=brodmann&obszar=lh_Brodmann.4`.

### Schematy 2D

Gotowe pliki JSON w `src/geometry/generated/` powstały z przypiętej rewizji ggseg.formats. Manifest zapisuje źródło, rewizję i sumy SHA-256. Anatomia oraz nakładki funkcjonalne są odrębnymi warstwami. Schematy brakujących struktur mają wyraźne oznaczenia ograniczeń.

Odtworzenie eksportu (Python 3.11+ i Node 24):

```sh
python3 -m venv /tmp/atlas-geometry-env
/tmp/atlas-geometry-env/bin/pip install -r scripts/requirements-geometry.txt
node scripts/download-atlas.mjs /tmp/atlas-sysdata.rda
/tmp/atlas-geometry-env/bin/python scripts/export-atlas.py /tmp/atlas-sysdata.rda
```

Pobieranie odmawia nadpisania istniejącego pliku; eksport odmawia użycia danych o innej sumie kontrolnej. Przy zwykłej budowie aplikacji te narzędzia nie są potrzebne.

Zobacz [pochodzenie, cytowania i zawiadomienia licencyjne](public/licenses/THIRD_PARTY_NOTICES.md). Pełne teksty licencji są dołączone w `public/licenses/` i do artefaktu publikacji.

## Treść

Źródła przypisano do kroków, kart oraz powiązań. Podsumowania psychiatryczne dotyczą rozumienia mechanizmów, bez zaleceń dla konkretnego pacjenta. Połączenia funkcjonalne nie oznaczają bezpośredniego szlaku anatomicznego. Granice funkcjonalne są przybliżone. Nie przypisano fikcyjnej daty ani autora zewnętrznej recenzji klinicznej.

Haines, wydanie 9 (2015), jest źródłem anatomii; nowsze badania uzupełniają interpretacje psychiatryczne i funkcje kory. W artykułach wskazano strony drukowane atlasu i bibliografię. Nie dołączono książki, skanów ani ilustracji autora. Katalog 34 układów nie jest twierdzeniem o kompletności wszystkich włókien mózgu. Małe jądra bez segmentacji pozostają węzłami schematu, nie fikcyjnymi obiektami 3D.

Kod: MIT. Autorskie materiały edukacyjne: CC BY 4.0. Materiały importowane zachowują własne licencje — zobacz CONTENT-LICENSE.md.

## Materiał tkanki i naczynia (2026-10-13)

Three.js 0.186.1 pozostaje silnikiem przeglądarkowym (MIT). Materiał fizyczny ma mikroteksturę tkanki, mikrowypukłości, zmienną szorstkość i delikatną wilgotną powłokę. Projekcja trójpłaszczyznowa we współrzędnych źródłowych zachowuje ciągłość między parcelami i podczas rozsuwania półkul. HQ dodaje GTAO, odszumianie, wielopróbkowe wygładzanie krawędzi oraz mapowanie tonów ACES. Oba tryby używają oświetlenia środowiskowego i cieni. Renderowanie zatrzymuje się w spoczynku.

Przycisk **Naczynia** włącza osobne, zwężające się tętnice i żyły. Warstwa odpowiada widoczności i rozsunięciu półkul; ukrywa się w trybie wnętrza i izolacji. To **ilustracja proceduralna**, nie segmentacja angiografii ani mapa obszarów unaczynienia. Geometria kory i granice atlasu pozostają źródłowe. `three-mesh-bvh` przyspiesza wybór parcel i dopasowanie naczyń do powierzchni. Standard pomija kosztowny etap GTAO.

Tekstura: `public/textures/cortex-tissue-albedo.png` (1254 × 1254 px, wbudowany ImageGen). Pochodzenie, pełny prompt i SHA-256: `public/textures/cortex-tissue-provenance.json`. Licencje silnika i biblioteki BVH znajdują się w `public/licenses/`.
