# Detailed 3D anatomy: sources and processing

All or portions of this licensed product (such portions are the "Software") have been obtained under license from The General Hospital Corporation "MGH" and are subject to the following terms and conditions:

[FreeSurfer Software License Agreement](./FreeSurfer-LICENSE.txt). These are modified derivatives, not an original FreeSurfer release. Application-code and educational-text licenses do not replace the source-data license.

## Bundled sources

The active model is `models/brain-detailed.json`, served precompressed as `brain-detailed.json.gz` where supported. The hemisphere surfaces are the original **fsaverage6 pial** template: 40,962 vertices and 81,920 triangles per hemisphere. This is an average MRI-derived surface, not a patient-specific brain or a photographic specimen.

- **Destrieux / aparc.a2009s:** 74 named gyral and sulcal regions in each hemisphere, 148 selectable cortical regions total.
- **PALS-B12 Brodmann:** 41 numbered areas in each hemisphere. The original GIFTI column beginning `Brodmann -` is used; unrelated columns for lobes, disorders and other atlases are not included. In particular, BA3 and BA33 are kept as distinct label keys even where source colors coincide. This surface-based transfer is not an individual's histological map.
- **ASEG:** 38 segmented anatomical labels present in fsaverage5: bilateral cerebral/cerebellar white matter, cerebellar cortex, lateral ventricles and inferior horns, thalamus, caudate, putamen, pallidum, hippocampus, amygdala, accumbens, ventral diencephalon, choroid plexus; midline third/fourth ventricles, brainstem, CSF, optic chiasm and five corpus-callosum segments. Duplicate cerebral-cortex labels, tiny vascular fragments and white-matter hypointensity labels are not rendered as separate anatomical structures.

The Brodmann areas supplied are 1–11, 17–33 and 35–47. No geometry is invented for omitted numbers. Small nuclei such as VTA, locus coeruleus, raphe nuclei, substantia nigra and PAG are not separately segmented in these inputs. **VentralDC is a composite ventral-diencephalon label, not a dedicated hypothalamus segmentation.** Corpus-callosum parts use the source segmentation's five subdivisions, not a claim of five individually traced fiber bundles.

PL/EN/LAT display terms are editorial translations of the retained source identifiers. They do not modify atlas boundaries. Abbreviated side markers L/P refer to anatomical left/right, not screen position.

## Coordinates, geometry, texture

All geometry shares FreeSurfer **surface-RAS**, in millimeters: X right, Y anterior, Z superior. ASEG uses its header's `vox2ras_tkr`; no individual part is independently recentered. Hemisphere separation is an exploration control and changes the natural spatial relationship.

The fsaverage registration sphere is matched to fsaverage6 with a nearest-neighbor query. The exporter requires an exact spherical-vertex subset (maximum distance below 0.000001, observed 0) and unique vertex correspondence. Original Brodmann label keys are transferred through this verified correspondence. Both atlas layers partition every original pial triangle once: majority vertex label, first vertex for a three-way tie. Unknown and medial-wall geometry remains neutral and is not offered as a named region.

Normals are computed across the whole hemisphere before region partitioning, avoiding false lighting seams. Cortical positions are shared between layers. ASEG masks use Gaussian sigma 0.5 voxel, marching cubes level 0.5, step 1 (white matter step 2). Positions are rounded to 0.001 mm; normals to 0.0001. The full model contains 537,540 triangles per atlas layer; hidden internal structures are not rendered by default.

**Texture** is a vertex-shaded relief layer derived from real `lh.sulc` / `rh.sulc` scalar data, using clipped `(sulc + 2) / 5`. Sulci are darker than gyri. It is not a tissue photograph or an AI-generated texture. **Atlas colors** use the original Destrieux/PALS/ASEG label color tables. Geometry is not changed when toggling either layer. Source colors can repeat; picking uses region IDs, not colors. Captions retain complete names; optional surface labels are limited to visible, unoccluded, non-overlapping regions.

Teaching-card associations use overlap with the separate DK parcellation (at least 20% of a region's faces), and are approximate. They are not used to construct Destrieux or Brodmann boundaries.

## Reproduction

```sh
python3 -m venv /tmp/brain-atlas-export-env
/tmp/brain-atlas-export-env/bin/pip install -r scripts/export-brain-3d.requirements.txt
/tmp/brain-atlas-export-env/bin/python scripts/export-detailed-atlas.py --source-dir /tmp/detailed-atlas-sources
```

Every download is checked against a pinned SHA-256 before parsing. [The manifest](../models/brain-detailed-provenance.json) records all source URLs/checksums, processing, verified correspondence, geometry counts and checksums for plain and compressed assets. The browser only loads assets from this application's origin, never from the atlas source servers. Gzip export uses mtime zero for reproducibility.

## References

- Destrieux C. et al. (2010). Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature. NeuroImage. [doi:10.1016/j.neuroimage.2010.06.010](https://doi.org/10.1016/j.neuroimage.2010.06.010).
- [FreeSurfer PALS-B12 atlas documentation](https://surfer.nmr.mgh.harvard.edu/fswiki/PALS_B12).
- Van Essen D.C. (2005). A Population-Average, Landmark- and Surface-based (PALS) atlas of human cerebral cortex. NeuroImage. [doi:10.1016/j.neuroimage.2005.06.058](https://doi.org/10.1016/j.neuroimage.2005.06.058).
- Van Essen D.C. et al. (2012). Cortical cartography and Caret software. NeuroImage. [Full text](https://pmc.ncbi.nlm.nih.gov/articles/PMC3288593/).
- Fischl B. et al. (2002). Whole brain segmentation: automated labeling of neuroanatomical structures in the human brain. Neuron. [doi:10.1016/S0896-6273(02)00569-X](https://doi.org/10.1016/S0896-6273(02)00569-X).

The previous lower-resolution DK model remains bundled for reproducibility; its separate manifest is `brain-provenance.json`. It is no longer the active 3D viewer asset.
