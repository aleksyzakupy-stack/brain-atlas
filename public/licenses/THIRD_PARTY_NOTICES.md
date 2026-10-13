# Pochodzenie ilustracji i biblioteki

## Active 3D model: fsaverage HQ and fsaverage6 Standard / Destrieux / PALS-B12 / ASEG

The active model uses checksum-pinned FreeSurfer fsaverage (HQ) or fsaverage6 (Standard) pial surfaces and sulcal-depth values, Destrieux parcellation, original PALS-B12 GIFTI Brodmann labels, and fsaverage5 ASEG segmentations. It is a modified derivative under the [FreeSurfer license](./FreeSurfer-LICENSE.txt). HQ: [checksum manifest](../models/brain-high-resolution-provenance.json).

[Sources, citations, coverage, translations and processing](./BRAIN_DETAILED_PROVENANCE.md). [Source and output checksum manifest](../models/brain-detailed-provenance.json). Brodmann boundary data are separate from approximate teaching-card associations. Texture is source-derived sulcal shading, not a specimen photograph.

## Previous 3D model: FreeSurfer fsaverage5

Interaktywny model 3D używa oryginalnych powierzchni pial obu półkul, parcellacji DK oraz struktur odtworzonych z segmentacji ASEG, pobranych z oficjalnego serwera FreeSurfer. Jest zmodyfikowaną pochodną danych FreeSurfer na warunkach [FreeSurfer Software License Agreement](./FreeSurfer-LICENSE.txt).

[Pochodzenie, przekształcenia, odtwarzanie eksportu i ograniczenia modelu 3D](./BRAIN_3D_PROVENANCE.md). Sumy SHA-256 pięciu plików źródłowych i eksportu: [manifest modelu](../models/brain-provenance.json). Powierzchnie i struktury głębokie zachowują wspólny układ surface-RAS. Granice funkcjonalne są przybliżone i oddzielone od nazw oryginalnych parceli. Struktury, których źródło nie wyodrębnia, nie otrzymują sztucznych brył 3D.

## ggseg.formats / DK / aseg

Repozytorium: https://github.com/ggsegverse/ggseg.formats
Rewizja źródłowa: ae4fc09d9b6b527b04cd9d78412945c36f09ca1d
Plik: R/sysdata.rda
SHA-256 źródła: 1cf6517c49141709134cd62ccaa5b3329dbfe6e6921344c76e6ee437582c68bb
Licencja pakietu: MIT — pełny tekst w ggseg.formats-MIT.txt.

Kontury DK (Desikan–Killiany) i aseg pochodzą z danych FreeSurfer zawartych w ggseg.formats. Zachowano nazwy źródłowych parceli. Eksport wybrał lewą powierzchnię boczną i przyśrodkową DK oraz projekcje coronal_1 i sagittal aseg. Współrzędne przeskalowano do 800 × 600, odwrócono oś Y i zaokrąglono do 0,1. Są to zmodyfikowane ilustracje atlasowe, nie obrazy MR konkretnej osoby. Podział korowy nie definiuje granic obszarów funkcjonalnych.

Skrypt odtwarzający eksport: scripts/export-atlas.py (rdata 1.1.0). Manifest i suma kontrolna wyniku: src/geometry/generated/provenance.json. Materiał wygenerowany jest dołączony do aplikacji; przeglądarka nie pobiera danych z GitHub ani nie uruchamia R/Pythona.

### FreeSurfer / MGH

All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation "MGH" and are subject to the following terms and conditions:

Pełne warunki, w tym wymagane oświadczenia i zastrzeżenia, znajdują się w dołączonym pliku FreeSurfer-LICENSE.txt. Dotyczą odpowiednich materiałów źródłowych; nie zastępuje ich licencja autorskich treści atlasu.

Źródło zawiadomienia: https://github.com/freesurfer/freesurfer/blob/dev/LICENSE.txt
Parcellacja: https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation

Cytowania naukowe:
- Desikan R.S. i wsp. (2006). An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest. NeuroImage. https://doi.org/10.1016/j.neuroimage.2006.01.021
- Fischl B. i wsp. (2002). Whole brain segmentation: automated labeling of neuroanatomical structures in the human brain. Neuron. https://doi.org/10.1016/S0896-6273(02)00569-X

## Warstwy dydaktyczne

Nakładki PFC, dlPFC, vmPFC, OFC i obszarów czuciowo-ruchowych narysowano osobno. Ich przerywane granice są orientacyjne i nie wynikają z przemianowania parceli DK. Bibliografię przypisano do identyfikatorów w src/geometry/atlasGeometry.ts i pokazano w kartach struktur. Kontur zakrętu nie jest równoważny mapie cytoarchitektonicznej ani funkcjonalnej.

Struktury niedostępne w użytej geometrii (jądro półleżące, podwzgórze, istota czarna, VTA, miejsce sinawe, jądra szwu, PAG) przedstawiono na wyraźnie opisanych schematach dydaktycznych. Ich układ, kształt i wielkość nie są danymi anatomicznymi. Schematy powiązań mają umowne położenie węzłów. Ciągła linia oznacza relację anatomiczną, przerywana funkcjonalną; strzałka pojawia się tylko przy udokumentowanym kierunku.

## react-zoom-pan-pinch


Local fonts: Manrope and Source Serif 4, distributed under the SIL Open Font License 1.1. Full licenses: [Manrope](./fonts/Manrope-OFL.txt), [Source Serif 4](./fonts/Source-Serif-4-OFL.txt). Sources: Google Fonts, fonts.gstatic.com; no runtime third-party font requests.

Wersja npm: 4.2.0, zapisana dokładnie w package.json i package-lock.json.
Repozytorium: https://github.com/BetterTyped/react-zoom-pan-pinch
Wydanie: https://github.com/BetterTyped/react-zoom-pan-pinch/releases/tag/v4.2.0
Licencja: MIT — pełny tekst w react-zoom-pan-pinch-MIT.txt.

## Renderowanie tkanki i naczyń

Three.js 0.186.1 (MIT): https://github.com/mrdoob/three.js — pełna licencja w `three-MIT.txt`.
three-mesh-bvh 0.9.16 (MIT): https://github.com/gkjohnson/three-mesh-bvh — pełna licencja w `three-mesh-bvh-MIT.txt`.
Mikrotekstura `textures/cortex-tissue-albedo.png` powstała przez wbudowany ImageGen; nie jest fotografią preparatu ani danymi medycznymi. Prompt i pochodzenie: `textures/cortex-tissue-provenance.json`.
Naczynia są autorską ilustracją proceduralną dopasowaną do powierzchni fsaverage, a nie segmentacją angiografii. Nie opisują indywidualnej anatomii, pełnego drzewa naczyniowego, koła Willisa ani granic unaczynienia. Czerwień i niebieskofioletowy są umownym oznaczeniem tętnic i żył.


## Blender studio / Draco

Modele `brain-studio-standard.glb` i `brain-studio-high.glb` są pochodnymi istniejących danych FreeSurfer; zachowują ich licencję. Import, materiały i eksport przygotowano w Blender 5.2.2 LTS. [Manifest konwersji i kontroli geometrii](../models/brain-studio-provenance.json).

Draco (Google) jest dystrybuowany na licencji Apache 2.0. Pliki w `decoders/draco/` skopiowano bez zmian z `three@0.186.1/examples/jsm/libs/draco/gltf/`. [Pełna licencja](../decoders/draco/LICENSE), [projekt źródłowy](https://github.com/google/draco). Dekodowanie odbywa się lokalnie w przeglądarce.
