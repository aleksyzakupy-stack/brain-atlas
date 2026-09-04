# Pochodzenie ilustracji i biblioteki

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

Wersja npm: 4.2.0, zapisana dokładnie w package.json i package-lock.json.
Repozytorium: https://github.com/BetterTyped/react-zoom-pan-pinch
Wydanie: https://github.com/BetterTyped/react-zoom-pan-pinch/releases/tag/v4.2.0
Licencja: MIT — pełny tekst w react-zoom-pan-pinch-MIT.txt.
