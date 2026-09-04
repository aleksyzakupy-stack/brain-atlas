# Neuroatlas — mózg w psychiatrii

Statyczny, polskojęzyczny atlas edukacyjny w React, TypeScript, Vite i SVG.

- Nauka: trzy kompletne trasy — Pamięć i kontekst, Emocje i regulacja, Kontrola poznawcza. Każda ma sześć kroków, schemat, objaśnienie, szczegóły i źródła.
- Atlas: 28 kart z sekcjami W skrócie / Powiązania / W psychiatrii / Źródła.
- Widoki: boczny, przyśrodkowy i struktury głębokie (projekcje czołowa / strzałkowa).
- Wyszukiwanie struktur, funkcji, lekcji i powiązań z obsługą PL / EN / LAT i tekstu bez polskich znaków.
- Powrót z karty do lekcji, dowolny wybór kroku, lokalny postęp w formacie `brainAtlas.learning.v1`; brak localStorage nie blokuje nauki.
- Obsługa myszy, klawiatury i gestów przez react-zoom-pan-pinch 4.2.0. Wybór nie powiększa automatycznie. Ctrl + kółko, gest szczypania, przyciski + / −, klawisze + / − i strzałki po ustawieniu fokusu na schemacie. Ctrl/Cmd + K otwiera wyszukiwanie.
- Na tablecie wysuwana lista; na telefonie przełącznik Schemat / Opis i stale dostępne sterowanie lekcją.

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
