# Neuroatlas — mózg w psychiatrii

Statyczny, polskojęzyczny atlas edukacyjny w React, TypeScript, Vite, Three.js i SVG.

- Nauka: trzy kompletne trasy — Pamięć i kontekst, Emocje i regulacja, Kontrola poznawcza. Każda ma sześć kroków, schemat, objaśnienie, szczegóły i źródła.
- Atlas: 28 kart z sekcjami W skrócie / Powiązania / W psychiatrii / Źródła.
- Domyślny model 3D: obie półkule z zakrętami i bruzdami, obrót, powiększanie, wybór struktur i otwieranie kart. Przezroczystość kory odsłania wnętrze; można ukryć półkulę lub rozsunąć obie.
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

Lokalny `public/models/brain-atlas.json` zawiera 89 siatek: powierzchnie pial fsaverage5 podzielone na parcele DK, struktury głębokie i móżdżek z aseg. Wszystkie są w tym samym układzie surface-RAS. Model ładuje się z aplikacji, bez zewnętrznego API; Three.js jest ładowany w osobnym module dopiero dla widoku 3D. Plik JSON ma ok. 2,9 MB przed kompresją.

22 z 28 kart mają przypisane siatki. Podwzgórze, VTA, istota czarna, miejsce sinawe, jądra szwu i PAG nie mają osobnej geometrii w źródle; aplikacja jawnie wskazuje brak zamiast tworzyć fikcyjne bryły. Przypisania obszarów funkcjonalnych do parcel DK są przybliżeniami dydaktycznymi. Rozsuwanie półkul zmienia naturalne relacje przestrzenne i służy wyłącznie eksploracji.

Reprodukowalny eksporter, sumy SHA-256, współrzędne i ograniczenia: [pochodzenie 3D](public/licenses/BRAIN_3D_PROVENANCE.md). Model wymaga WebGL2; awaria GPU lub pobrania pliku udostępnia przejście do 2D, bez blokowania kart i lekcji.

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
