# Model mózgu 3D — pochodzenie i ograniczenia

Ten dokument opisuje poprzedni model DK o niższej rozdzielczości. Aktualny model: [fsaverage6, Destrieux, PALS-B12 i ASEG](./BRAIN_DETAILED_PROVENANCE.md).

All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation "MGH" and are subject to the following terms and conditions:

Pełne warunki: [FreeSurfer Software License Agreement](./FreeSurfer-LICENSE.txt).
Model jest zmodyfikowaną pochodną danych FreeSurfer, a nie oryginalnym wydaniem FreeSurfer. Licencja MIT kodu aplikacji oraz CC BY 4.0 autorskich treści nie zastępują warunków FreeSurfer dla geometrii.

## Źródło

Model używa referencyjnego mózgu **fsaverage5** z oficjalnej dystrybucji projektu FreeSurfer. Powierzchnie `lh.pial` i `rh.pial` zawierają rzeczywiste zakręty i bruzdy rekonstruowane ze skanów MR. Nie są bryłami narysowanymi ręcznie ani modelem konkretnego pacjenta. Każda półkula ma 10 242 wierzchołki i 20 480 trójkątów.

- Powierzchnie: https://www.freesurfer.net/pub/dist/freesurfer/tutorial_versions_centos6/freesurfer/subjects/fsaverage5/surf/
- Parcellacja Desikana–Killiany'ego: https://www.freesurfer.net/pub/dist/freesurfer/tutorial_versions_centos6/freesurfer/subjects/fsaverage5/label/
- Segmentacja struktur głębokich `aseg.mgz`: https://www.freesurfer.net/pub/dist/freesurfer/tutorial_versions_centos6/freesurfer/subjects/fsaverage5/mri/
- Objaśnienie parcellacji: https://surfer.nmr.mgh.harvard.edu/fswiki/CorticalParcellation

Dokładne adresy plików, sumy SHA-256, parametry eksportu oraz suma pliku wynikowego są zapisane w `models/brain-provenance.json`. Przeglądarka ładuje wyłącznie lokalny `models/brain-atlas.json` z tej aplikacji. Podczas używania atlasu nie kontaktuje się z serwerem źródłowym.

## Układ współrzędnych i przetwarzanie

Współrzędne są w milimetrach, w układzie FreeSurfer **surface-RAS**: dodatnie X wskazuje prawą stronę, Y przód, Z górę. Powierzchni kory nie przesuwano i nie obracano. Segmentację objętościową przeliczono macierzą `vox2ras_tkr` z jej nagłówka do tego samego układu. Nie przesuwano osobno struktur głębokich ani półkul.

Zachowano wszystkie oryginalne trójkąty powierzchni pial. Do wyboru parceli przypisano trójkąt do etykiety większości jego wierzchołków; przy trzech różnych etykietach rozstrzyga pierwszy wierzchołek. Daje to dyskretną granicę o rozdzielczości siatki, nie nową granicę anatomiczną. Wierzchołki przy granicach współdzielą normalne obliczone na całej półkuli, co zapobiega sztucznym szwom oświetlenia. Współrzędne zaokrąglono do 0,001 mm.

Struktury głębokie i móżdżek zrekonstruowano z etykiet ASEG: wygładzenie maski Gaussa (sigma 0,65 woksela), izopowierzchnia 0,5, marching cubes z krokiem 2. Jest to uproszczona powierzchnia atlasowa; nie zachowuje rozdzielczości ani wszystkich szczegółów segmentacji źródłowej. Nie służy pomiarom klinicznym. Mapowane są: ciało migdałowate, hipokamp, wzgórze, jądro ogoniaste, skorupa, gałka blada, obszar jądra półleżącego i kora móżdżku. Pień mózgu stanowi dodatkowy kontekst przestrzenny.

## Parcele anatomiczne a obszary funkcjonalne

Oryginalne nazwy DK pozostają w polach `label` i `sourceRegion`. `structureIds` są odrębnymi odsyłaczami do kart edukacyjnych. Połączenia DK z PFC, dlPFC, vmPFC, OFC oraz korą ruchową, somatosensoryczną, wzrokową i słuchową są **orientacyjnymi skojarzeniami dydaktycznymi**, oznaczonymi `approximate: true`. Nie oznaczają równoważności parceli DK z granicami funkcjonalnymi lub cytoarchitektonicznymi. Na przykład cała parcela czołowego bieguna nie jest precyzyjną segmentacją vmPFC, a zakręt przedśrodkowy nie wyznacza dokładnej granicy pola BA4. Model zachowuje nazwę źródłowej parceli także przy takim wyborze.

Dane nie wyodrębniają podwzgórza, VTA, istoty czarnej, miejsca sinawego, jąder szwu ani PAG. Te struktury nie otrzymują pozorowanych brył 3D. `unavailableStructureIds` podaje je jawnie. Model nie zastępuje szczegółowego atlasu neuroanatomicznego; nie przedstawia indywidualnej zmienności budowy mózgu.

## Odtworzenie

```sh
python3 -m venv /tmp/brain-atlas-export-env
/tmp/brain-atlas-export-env/bin/pip install -r scripts/export-brain-3d.requirements.txt
/tmp/brain-atlas-export-env/bin/python scripts/export-brain-3d.py --source-dir /tmp/brain-atlas-fsaverage5
```

Skrypt pobiera wyłącznie pięć wymienionych plików publicznego szablonu i odrzuca źródło o innej sumie SHA-256. Nie wymaga instalacji FreeSurfer, R ani dostępu do danych pacjentów. Wynik zawiera indeksy trójkątów od zera, pozycje, normalne, oryginalne nazwy parceli i jawne przypisania do kart. Przypięte wersje zależności opisano w `scripts/export-brain-3d.requirements.txt`.

## Cytowania

- Fischl B., Sereno M.I., Dale A.M. (1999). Cortical Surface-Based Analysis: II. Inflation, Flattening, and a Surface-Based Coordinate System. NeuroImage. https://doi.org/10.1006/nimg.1998.0396
- Desikan R.S. i wsp. (2006). An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest. NeuroImage. https://doi.org/10.1016/j.neuroimage.2006.01.021
- Fischl B. i wsp. (2002). Whole brain segmentation: automated labeling of neuroanatomical structures in the human brain. Neuron. https://doi.org/10.1016/S0896-6273(02)00569-X
