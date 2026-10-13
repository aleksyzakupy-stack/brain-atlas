# Integracja z Neuroatlasem

Baza jest podłączona lokalnie do aplikacji. Wszystkie 238 artykułów są dostępne pod `/#/kompendium`, a przewodnik pod `/#/przewodnik`. Artykuł ma trwały adres `/#/kompendium/<identyfikator>`; identyfikatory nie są wyświetlane jako nazwy użytkowe.

## Źródło treści

`parts/*.json`, `spatial-index.json` i `sources.json` pozostają materiałem redakcyjnym. `build_reference.py` tworzy kompendium i sprawdza aktualny katalog projektu. `scripts/build-neuroanatomy.mjs` generuje niewielki indeks, osobny pakiet pełnych tekstów i przewodnik. Komponenty pobierają tekst z wygenerowanego pakietu; opisów medycznych nie przepisano ręcznie.

Eksport aplikacyjny zachowuje wszystkie pola opisowe, lokalizatory cytowań, uwagi dowodowe, powiązania oraz zakresy weryfikacji źródeł. Nie eksportuje lokalnych ścieżek, rozmiarów i sum plików książek. Bibliografia odziedziczona z projektu jest dostępna osobno, z oznaczeniem braku ponownej weryfikacji w kompendium.

## Scenariusze użytkowe

- Wybór regionu modelu: nazwa wybranej parceli, jej strona i odpowiedni wspólny artykuł; lateralizacja pozostaje częścią pełnego opisu.
- Karty funkcjonalne i BA: te same artykuły przez istniejące adresy.
- Szlaki: pełna karta obwodu, opis przebiegu, skrzyżowań i mediatorów; dotknięcie węzła korzysta z mapowania przestrzennego i zachowuje zastrzeżenie dotyczące kontekstu lokalizacji.
- Dodatkowe drogi: katalog, globalne wyszukiwanie i powiązania; pełne karty tekstowe bez deklaracji geometrii 3D.
- Czytanie: nawigacja po sekcjach, rozwijane szczegóły, źródła pod ikoną książki i odsyłacz do szerokiego widoku artykułu. Na telefonie obszar tekstu przewija się niezależnie od stałego ekranu modelu.

## Geometria i nazewnictwo

Nie zmieniono plików geometrii, współrzędnych ani granic parcel. Skorygowano metadane VentralDC jako złożonego obszaru podkorowego oraz pięciu segmentów CC jako segmentów istoty białej ASEG. Te segmenty nie są utożsamione z pięcioma ścisłymi częściami anatomicznymi. Małe jądra zachowują istniejące punkty orientacyjne, bez nowych masek.

## Uruchomienie i kontrola

```sh
npm run reference:check
npm run lint
npm test
npm run build
npm run dev -- --host 127.0.0.1 --port 5184
```

`predev` i `prebuild` odtwarzają eksport aplikacyjny. Po zmianie źródeł redakcyjnych należy wcześniej wykonać `python3 docs/neuroanatomy/build_reference.py`. Tryb `--check` obu generatorów jest tylko do odczytu.

Walidacja obejmuje aktualność danych, dokładnie jedno przypisanie główne każdego ID, kompletność pól i źródeł, zachowanie pełnego tekstu, wyszukiwanie, adresy, lateralizację, katalog dodatkowych dróg i przewodnik. Nie stanowi niezależnej recenzji klinicznej materiału. Zastrzeżenia dostarczone z bazą pozostają w artykułach i rejestrze źródeł.

Pełny pakiet tekstów i przewodnik są ładowane osobno przy otwarciu materiału. Strona główna i katalog nie pobierają całego kompendium. PDF/EPUB pozostają lokalne i nie są częścią buildu. Integracja nie uruchamia publikacji.
