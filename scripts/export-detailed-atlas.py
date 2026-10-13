"""Export fsaverage6 surfaces, Destrieux, PALS-B12 Brodmann and ASEG.

python scripts/export-detailed-atlas.py --source-dir /tmp/atlas-sources
Inputs are checksum pinned. The browser receives shared hemisphere surfaces,
separate triangle partitions for both atlases, and actual sulcal-depth relief.
"""
import argparse
import importlib.util
import json
import gzip
from pathlib import Path
import re
from concurrent.futures import ThreadPoolExecutor

import nibabel as nib
from nibabel.freesurfer.io import read_annot, read_geometry, read_morph_data
import numpy as np
from scipy.ndimage import gaussian_filter
from scipy.spatial import cKDTree
from skimage.measure import marching_cubes

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('base', ROOT / 'scripts/export-brain-3d.py')
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
URL = 'https://www.freesurfer.net/pub/dist/freesurfer/tutorial_versions_centos6/freesurfer'
PINS = {
 'subjects/fsaverage6/surf/lh.pial': 'e31e4b615abcad1bc5c6b69401bbfcbc1cc00a484257ae9e7c3df080cc68654c',
 'subjects/fsaverage6/surf/lh.sphere.reg': '9d1b6805f9e4831f903f358d7677d7c3378b6fca9b70300e3e72aeff503b001f',
 'subjects/fsaverage6/surf/lh.sulc': '8e684b1405e86b6d3fa05e4f26628cb6c2b1080b95982faf24caa7345cfdf7a5',
 'subjects/fsaverage6/label/lh.aparc.a2009s.annot': '33edfcdd9ccf3d12472ab461856a4783111185f8c8c55408dabfb2b2b8b4a28d',
 'subjects/fsaverage6/label/lh.aparc.annot': '2c90df9c87304e1cc60e955de54598c859718824b0c544e79b1980ccfd2c1175',
 'subjects/fsaverage6/surf/rh.pial': '3d64a3fa1be6f93353d535688fbc89990e2a29d2e7e6f5db81467c09e186b36e',
 'subjects/fsaverage6/surf/rh.sphere.reg': '9d1b6805f9e4831f903f358d7677d7c3378b6fca9b70300e3e72aeff503b001f',
 'subjects/fsaverage6/surf/rh.sulc': '5965fc43400b0079bd1495cf64da5ce1a7235fbb91897df80edb71e9ca416e7c',
 'subjects/fsaverage6/label/rh.aparc.a2009s.annot': 'b65564e4f1bea1cd47d6b2e2bdca8635bed49265998dab7f68f8933b57c56494',
 'subjects/fsaverage6/label/rh.aparc.annot': '7ecc52d5b2ffd5a2d9e6fa29ab2a94c4b29bcca5334261f7c8fa2c99733990e7',
 'subjects/fsaverage/surf/lh.sphere.reg': 'fddcf0eeecc6e0f62142164f7c0ac24fda1f0be8cb653d3f037970184c5ba98f',
 'subjects/fsaverage/surf/rh.sphere.reg': 'fddcf0eeecc6e0f62142164f7c0ac24fda1f0be8cb653d3f037970184c5ba98f',
 'subjects/fsaverage/label/lh.PALS_B12.labels.gii': '7c4e21c8e74fefb32d1043f77d2473a3e54977a38512ece466b08abc7cab534e',
 'subjects/fsaverage/label/rh.PALS_B12.labels.gii': '5a24633bfcfec84c7905596734146849035b33b44f46a6d392466a07e316ce41',
 'subjects/fsaverage5/mri/aseg.mgz': 'f69a16aad073471cef634db1002f6cae1ef7cd9548ab1b028ca7963861f136f3',
 'FreeSurferColorLUT.txt': 'b040ad6c0c4e26dd0f27ea84317fd25ae871a78e2e33bf463e2636473ee14052',
}
HIGH_PINS = {
 'subjects/fsaverage/surf/lh.pial': '9cb004f61a2eeb977b1b595ad6de6656afdfc1f37ade0c00a8dde91e990a0f29',
 'subjects/fsaverage/surf/rh.pial': '4f752701f74c1626ee3b6239046b9aa793ca4e87c6ae9a6b74a233c04e651212',
 'subjects/fsaverage/surf/lh.sulc': '6ebd903d42cd17b51d84229d641fe10a3b32d839c0a69266b089811df5874d91',
 'subjects/fsaverage/surf/rh.sulc': '11db597df4edff92b1aa8e6d99bfb4728da4f8178a9984951df2e0572f040f4c',
 'subjects/fsaverage/label/lh.aparc.a2009s.annot': '8ce931d3c87d9dfd369ac739fa32c04ab9b8335afab0e6d77f569b43d8c0b70e',
 'subjects/fsaverage/label/rh.aparc.a2009s.annot': 'f0de8093fc336ddea7fdefde91449f552accdb198dd51a559718262adf317aac',
 'subjects/fsaverage/label/lh.aparc.annot': '39b1acde9a32b4227631eb51cbcd8dff84e2138c57bf9f96d74026f2c17f1480',
 'subjects/fsaverage/label/rh.aparc.annot': '6a326aed325d313e6e0d10f67630efcd8d3b8343c50d3e108e005f626614badb',
}
# fsaverage6 uses precisely a subset of the fsaverage spherical vertices.
# We verify this rather than assuming identical numbering across resolutions.
def majority(values):
    a, b, c = values.T
    return np.where(b == c, b, a)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    parser.add_argument('--resolution', choices=['standard', 'high'], default='standard')
    args = parser.parse_args()
    high_resolution = args.resolution == 'high'
    subject = 'fsaverage' if high_resolution else 'fsaverage6'
    pins = ({key: value for key,value in PINS.items() if 'fsaverage6/' not in key} | HIGH_PINS) if high_resolution else PINS
    folder = args.source_dir
    folder.mkdir(parents=True, exist_ok=True)
    def path(relative): return folder / relative.replace('/', '__')
    def fetch(relative):
        target = path(relative)
        content = target.read_bytes() if target.exists() else base.download(f'{URL}/{relative}')
        assert base.sha256(content) == pins[relative], f'Unpinned input: {relative}'
        if not target.exists(): target.write_bytes(content)
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(fetch, pins))
    dictionary = json.loads((ROOT / 'scripts/atlas-names.json').read_text())
    surfaces, meshes, catalog, statistics = {}, [], [], []
    def names_for(region):
        values = dictionary[region]
        return dict(zip(['pl', 'en', 'lat'], values))
    def add_catalog(mesh, names, source, number=None):
        if mesh.get('selectable', True):
            catalog.append({key: mesh[key] for key in ['id', 'hemisphere', 'kind', 'atlas', 'color']} |
                           {'names': names, 'sourceRegion': source, 'number': number,
                            'source': 'PALS-B12' if mesh['atlas'] == 'brodmann' else 'Destrieux' if mesh['kind'] == 'cortex' else 'ASEG'})
    for hemi, side in [('lh', 'left'), ('rh', 'right')]:
        surfacepath = lambda name: path(f'subjects/{subject}/surf/{hemi}.{name}')
        vertices, faces = read_geometry(surfacepath('pial'))
        assert vertices.shape == (163842 if high_resolution else 40962, 3) and faces.shape == (327680 if high_resolution else 81920, 3)
        sulc = read_morph_data(surfacepath('sulc'))
        # Positive FreeSurfer sulc values are sulcal (darker), negative gyral.
        relief = np.clip((sulc + 2.0) / 5.0, 0, 1)
        surfaces[hemi] = {'positions': np.round(vertices, 3).ravel().tolist(),
                          'normals': np.round(base.normals(vertices, faces), 4).ravel().tolist(),
                          'relief': np.round(relief, 3).tolist()}
        dk, _, dk_names = read_annot(path(f'subjects/{subject}/label/{hemi}.aparc.annot'))
        dk_faces = majority(dk[faces])
        labels, colors, raw_names = read_annot(path(f'subjects/{subject}/label/{hemi}.aparc.a2009s.annot'))
        destrieux_names = [name.decode() for name in raw_names]
        gifti = nib.load(path(f'subjects/fsaverage/label/{hemi}.PALS_B12.labels.gii'))
        column = next(array for array in gifti.darrays if array.meta.get('Name', '').startswith('Brodmann -'))
        sphere, _ = read_geometry(path(f'subjects/fsaverage/surf/{hemi}.sphere.reg'))
        reduced, _ = read_geometry(surfacepath('sphere.reg'))
        distance, mapping = cKDTree(sphere).query(reduced)
        assert distance.max() < 1e-6 and len(np.unique(mapping)) == len(vertices)
        label_lookup = gifti.labeltable.get_labels_as_dict()
        label_colors = {label.key: [round(x * 255) for x in [label.red, label.green, label.blue]] for label in gifti.labeltable.labels}
        for atlas, vertex_labels in [('anatomy', labels), ('brodmann', column.data[mapping])]:
            face_labels = majority(vertex_labels[faces])
            named = 0
            for value in sorted(np.unique(face_labels)):
                region = destrieux_names[value] if atlas == 'anatomy' and value >= 0 else label_lookup.get(int(value), '???') if atlas == 'brodmann' else 'Unknown'
                match = re.fullmatch(r'Brodmann\.(\d+)', region)
                selectable = region not in ['Unknown', 'Medial_wall', 'MEDIAL.WALL', '???']
                chosen = faces[face_labels == value]
                color = colors[value, :3].tolist() if atlas == 'anatomy' and value >= 0 else label_colors.get(int(value), [100,100,100])
                ids = set()
                for dk_value, count in zip(*np.unique(dk_faces[face_labels == value], return_counts=True)):
                    if dk_value >= 0 and count / len(chosen) >= 0.2:
                        dk_name = dk_names[dk_value].decode()
                        ids.update(base.ANATOMICAL.get(dk_name, base.FUNCTIONAL.get(dk_name, [])))
                mesh = {'id': f'{hemi}_{region}', 'label': region, 'hemisphere': side,
                        'kind': 'cortex', 'atlas': atlas, 'surfaceId': hemi,
                        'structureIds': sorted(ids), 'approximate': bool(ids),
                        'color': '#' + ''.join(f'{int(c):02x}' for c in color),
                        'selectable': selectable, 'indices': chosen.ravel().tolist()}
                meshes.append(mesh)
                if selectable:
                    named += 1
                    number = int(match[1]) if match else None
                    names = {'pl': f'Pole Brodmanna {number}', 'en': f'Brodmann area {number}', 'lat': f'Area Brodmann {number}'} if match else names_for(region)
                    add_catalog(mesh, names, region, number)
            statistics.append({'hemisphere': side, 'atlas': atlas, 'namedRegions': named,
                               'vertices': len(vertices), 'triangles': len(faces), 'sphereMaxDistance': float(distance.max())})
    lut = {}
    for line in path('FreeSurferColorLUT.txt').read_text().splitlines():
        fields = line.split()
        if fields and fields[0].isdigit(): lut[int(fields[0])] = (fields[1], [int(v) for v in fields[2:5]])
    image = nib.load(path('subjects/fsaverage5/mri/aseg.mgz'))
    volume = np.asarray(image.dataobj)
    affine = image.header.get_vox2ras_tkr()
    deep_ids = {value: ids for value, _, ids in base.DEEP}
    # Include every non-pathological anatomical label present, apart from
    # duplicate cerebral cortex and tiny disconnected vascular label fragments.
    codes = [2,4,5,7,8,10,11,12,13,14,15,16,17,18,24,26,28,31,
             41,43,44,46,47,49,50,51,52,53,54,58,60,63,85,251,252,253,254,255]
    for code in codes:
        label, rgb = lut[code]
        region = re.sub(r'^(Left|Right)-', '', label)
        if region == 'Thalamus-Proper': region = 'Thalamus'
        assert region in dictionary, region
        points = np.argwhere(volume == code)
        low, high = np.maximum(points.min(axis=0)-3,0), np.minimum(points.max(axis=0)+4,volume.shape)
        slices = tuple(slice(int(a),int(b)) for a,b in zip(low,high))
        mask = gaussian_filter((volume[slices] == code).astype(np.float32), sigma=0.5)
        step = 2 if 'White-Matter' in label else 1
        vertices, faces, _, _ = marching_cubes(mask, level=0.5, step_size=step, allow_degenerate=False)
        vertices = nib.affines.apply_affine(affine, vertices + low)
        signed = np.einsum('ij,ij->i',vertices[faces[:,0]],np.cross(vertices[faces[:,1]],vertices[faces[:,2]])).sum()
        if signed < 0: faces = faces[:,[0,2,1]]
        side = 'left' if label.startswith('Left-') else 'right' if label.startswith('Right-') else 'midline'
        kind = 'white-matter' if ('White-Matter' in label or label.startswith('CC_')) else 'cerebellum' if 'Cerebellum' in label else 'ventricle' if (('Vent' in label and not label.endswith('VentralDC')) or label == 'CSF') else 'subcortex'
        mesh = base.compact_mesh(label, side, kind, vertices, faces, base.normals(vertices,faces), deep_ids.get(code,[]),False)
        mesh.update({'atlas': 'both', 'color': '#' + ''.join(f'{c:02x}' for c in rgb), 'selectable': True})
        meshes.append(mesh)
        add_catalog(mesh, names_for(region), label)
    payload = {'version': 2, 'coordinateSystem': 'surface-RAS', 'template': f'{subject} / fsaverage5 ASEG', 'surfaces': surfaces, 'meshes': meshes}
    out = ROOT / f'public/models/brain-{"high-resolution" if high_resolution else "detailed"}.json'
    serialized = (json.dumps(payload,separators=(',',':'),allow_nan=False)+'\n').encode()
    if not high_resolution: out.write_bytes(serialized)
    compressed = out.with_suffix('.json.gz')
    compressed.write_bytes(gzip.compress(serialized, compresslevel=9, mtime=0))
    if not high_resolution:
        (ROOT / 'src/data/atlasRegions.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    else:
        previous = json.loads((ROOT / 'src/data/atlasRegions.json').read_text())
        assert {item['id'] for item in previous} == {item['id'] for item in catalog}, 'High resolution catalog mismatch'
    provenance = {'asset': compressed.name if high_resolution else out.name, 'outputSha256': base.sha256(serialized),
                  'template': subject, 'resolution': args.resolution, 'uncompressedBytes': len(serialized),
                  'compressedAsset': compressed.name, 'compressedSha256': base.sha256(compressed.read_bytes()),
                  'sources': [{'url': f'{URL}/{relative}', 'sha256': digest} for relative,digest in pins.items()],
                  'cortex': statistics, 'deepRegions': len(codes), 'catalogRegions': len(catalog),
                  'triangleCountPerLayer': sum(len(m['indices'])//3 for m in meshes if m['atlas'] in ['anatomy','both']),
                  'voxelToSurfaceRAS': affine.tolist(), 'unavailableStructureIds': base.UNAVAILABLE,
                  'processing': [f'Original {subject} pial triangles; shared full-hemisphere normals.',
                                 'Destrieux and original PALS-B12 Brodmann GIFTI label keys (not merged annotation RGB codes).',
                                 f'fsaverage spherical registration matched to {subject}; exact vertex correspondence verified.',
                                 'Triangle label: majority vertex, first vertex in a three-way tie.',
                                 'Relief from actual FreeSurfer sulc, clipped (sulc + 2) / 5; not photographic tissue texture.',
                                 'ASEG Gaussian sigma 0.5, marching cubes step 1 (white matter 2), level 0.5, vox2ras_tkr.',
                                 'Teaching-card associations via DK overlap >=20 percent are approximate; not Brodmann boundaries.'],
                  'license': '../licenses/FreeSurfer-LICENSE.txt', 'modified': True,
                  'exporter': 'scripts/export-detailed-atlas.py'}
    (ROOT / f'public/models/brain-{"high-resolution" if high_resolution else "detailed"}-provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    print(json.dumps({key: provenance[key] for key in ['cortex','deepRegions','catalogRegions','triangleCountPerLayer','outputSha256']}))
    print(f'{len(serialized)} bytes uncompressed; {compressed.stat().st_size} bytes gzip')

if __name__ == '__main__': main()
