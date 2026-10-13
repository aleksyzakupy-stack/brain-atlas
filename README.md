# Neuroatlas — mózg w psychiatrii

Statyczny, polskojęzyczny atlas edukacyjny w React, TypeScript, Vite, Three.js i SVG.

- Nauka: trzy kompletne trasy — Pamięć i kontekst, Emocje i regulacja, Kontrola poznawcza. Każda ma sześć kroków, schemat, objaśnienie, szczegóły i źródła.
- Atlas: 148 obszarów korowych Destrieux, 38 struktur ASEG i 82 regiony pól Brodmanna (41 w każdej półkuli), wybierane bezpośrednio na modelu i z listy; nazwy PL / EN / LAT. Osobny indeks Funkcje zachowuje 28 kart edukacyjnych.
- Model 3D: fsaverage6, czterokrotnie więcej trójkątów kory niż poprzednio; płynne tłumienie obrotu i przejścia kamery, tekstura z rzeczywistych danych o głębokości bruzd, oryginalne kolory atlasów i podpisy z kontrolą widoczności. Przezroczystość kory odsłania wnętrze; można ukryć półkulę lub rozsunąć obie. Preferencja ograniczenia ruchu wyłącza bezwładność i animowane przejścia.
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

Aktywny `public/models/brain-detailed.json` zawiera współdzielone powierzchnie fsaverage6 (40 962 wierzchołki i 81 920 trójkątów na półkulę), oddzielne partycje Destrieux i PALS-B12 oraz 38 etykiet ASEG. Całość pozostaje w surface-RAS. Klient pobiera skompresowany plik (~6,9 MB, ~24 MB po rozpakowaniu), z obsługą kompresji transportowej i pliku gzip; starsze przeglądarki mogą pobrać zwykły JSON. Three.js ładuje się osobno. Poprzedni model DK pozostaje jako archiwalny, odtwarzalny eksport, nie aktywna siatka.

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

Dalszy rozwój: kolejne trasy, zadania sprawdzające i bardziej szczegółowe sieci. Te elementy nie są prezentowane jako dostępne funkcje.

Kod: MIT. Autorskie materiały edukacyjne: CC BY 4.0. Materiały importowane zachowują własne licencje — zobacz CONTENT-LICENSE.md.
