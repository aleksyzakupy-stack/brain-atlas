"""Export the bundled 3D atlas from checksum-pinned FreeSurfer fsaverage5 files.

Install scripts/export-brain-3d.requirements.txt, then run:
  python scripts/export-brain-3d.py --source-dir /tmp/brain-atlas-fsaverage5

Missing input files are downloaded from the FreeSurfer project's server. All
inputs are checked before parsing. Runtime clients need only the exported JSON.
"""

import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import shutil
import ssl
import subprocess
import urllib.error
import urllib.request

import nibabel as nib
from nibabel.freesurfer.io import read_annot, read_geometry
import numpy as np
from scipy.ndimage import gaussian_filter
from skimage.measure import marching_cubes


ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://www.freesurfer.net/pub/dist/freesurfer/tutorial_versions_centos6/freesurfer/subjects/fsaverage5'
SOURCES = [
    ('surf/lh.pial', 'd3e772b74f39ed7a979d78dab5b98d1fe5916f1354b52d05c23b85a8080b72bd'),
    ('surf/rh.pial', '64440462e8d1cec650d100c0fb16cb4704937e19e0bc42f58997a6a09e5e536b'),
    ('label/lh.aparc.annot', '74d1c2fd5e6b7ca193f06fee45a86f5638f347e38cea5ba27fce9fd69c0056be'),
    ('label/rh.aparc.annot', 'ca86b3b0bd5b74e367519dd94157154ae7c61ad128680fcc7b52e1a799e34e9f'),
    ('mri/aseg.mgz', 'f69a16aad073471cef634db1002f6cae1ef7cd9548ab1b028ca7963861f136f3'),
]

# These are teaching associations, not a claim that DK gyral boundaries define
# functional regions. Source parcel names remain independent in every mesh.
FUNCTIONAL = {
    'rostralmiddlefrontal': ['dlpfc', 'prefrontal-cortex'],
    'caudalmiddlefrontal': ['dlpfc', 'prefrontal-cortex'],
    'frontalpole': ['vmpfc', 'prefrontal-cortex'],
    'medialorbitofrontal': ['ofc', 'vmpfc', 'prefrontal-cortex'],
    'lateralorbitofrontal': ['ofc', 'prefrontal-cortex'],
    'parsorbitalis': ['prefrontal-cortex'],
    'parstriangularis': ['prefrontal-cortex'],
    'precentral': ['motor-cortex'],
    'postcentral': ['somatosensory-cortex'],
    'pericalcarine': ['visual-cortex'],
    'cuneus': ['visual-cortex'],
    'lingual': ['visual-cortex'],
    'lateraloccipital': ['visual-cortex'],
    'transversetemporal': ['auditory-cortex'],
}
ANATOMICAL = {
    'caudalanteriorcingulate': ['acc'],
    'rostralanteriorcingulate': ['acc'],
    'posteriorcingulate': ['pcc'],
    'insula': ['insula'],
    'precuneus': ['precuneus'],
    'parahippocampal': ['parahippocampal-gyrus'],
}
DEEP = [
    (8, 'Left-Cerebellum-Cortex', ['cerebellum']),
    (10, 'Left-Thalamus', ['thalamus']),
    (11, 'Left-Caudate', ['caudate', 'striatum']),
    (12, 'Left-Putamen', ['putamen', 'striatum']),
    (13, 'Left-Pallidum', ['globus-pallidus']),
    (16, 'Brain-Stem', []),
    (17, 'Left-Hippocampus', ['hippocampus']),
    (18, 'Left-Amygdala', ['amygdala']),
    (26, 'Left-Accumbens-area', ['nucleus-accumbens', 'striatum']),
    (47, 'Right-Cerebellum-Cortex', ['cerebellum']),
    (49, 'Right-Thalamus', ['thalamus']),
    (50, 'Right-Caudate', ['caudate', 'striatum']),
    (51, 'Right-Putamen', ['putamen', 'striatum']),
    (52, 'Right-Pallidum', ['globus-pallidus']),
    (53, 'Right-Hippocampus', ['hippocampus']),
    (54, 'Right-Amygdala', ['amygdala']),
    (58, 'Right-Accumbens-area', ['nucleus-accumbens', 'striatum']),
]
UNAVAILABLE = [
    'hypothalamus', 'vta', 'substantia-nigra', 'locus-coeruleus',
    'raphe-nuclei', 'pag',
]


def sha256(contents):
    return hashlib.sha256(contents).hexdigest()


def download(url):
    try:
        with urllib.request.urlopen(url, timeout=90) as response:
            return response.read()
    except urllib.error.URLError as error:
        # Some macOS Python distributions do not inherit system-trusted CAs.
        # curl uses the system store; keep TLS verification enabled and still
        # require the pinned SHA-256. Never retry with an unverified context.
        if not isinstance(error.reason, ssl.SSLCertVerificationError) or not shutil.which('curl'):
            raise
        return subprocess.run(
            ['curl', '--fail', '--silent', '--show-error', '--location',
             '--max-time', '90', url], check=True, capture_output=True,
        ).stdout


def load_sources(folder):
    folder.mkdir(parents=True, exist_ok=True)
    for relative, expected in SOURCES:
        path = folder / Path(relative).name
        if path.exists():
            data = path.read_bytes()
        else:
            data = download(f'{BASE}/{relative}')
            if sha256(data) != expected:
                raise ValueError(f'Unpinned source download rejected: {relative}')
            path.write_bytes(data)
        if sha256(data) != expected:
            raise ValueError(f'Source checksum mismatch: {path}')


def normals(vertices, faces):
    """Area-weighted normals, computed before splitting cortical boundaries."""
    a, b, c = vertices[faces[:, 0]], vertices[faces[:, 1]], vertices[faces[:, 2]]
    face_normals = np.cross(b - a, c - a)
    result = np.zeros_like(vertices, dtype=np.float64)
    for column in range(3):
        np.add.at(result, faces[:, column], face_normals)
    lengths = np.linalg.norm(result, axis=1)
    result /= np.where(lengths > 0, lengths, 1)[:, None]
    return result


def compact_mesh(label, hemisphere, kind, vertices, faces, vertex_normals,
                 structure_ids, approximate, source_region=None):
    used, remapped = np.unique(faces, return_inverse=True)
    positions = vertices[used]
    assert np.isfinite(positions).all() and np.isfinite(vertex_normals[used]).all()
    assert len(used) > 2 and len(faces) > 0
    indices = remapped.reshape(-1, 3)
    assert indices.max() < len(positions)
    return {
        'id': label,
        'label': label,
        'sourceRegion': source_region or label,
        'hemisphere': hemisphere,
        'kind': kind,
        'structureIds': structure_ids,
        'approximate': approximate,
        'positions': np.round(positions, 3).reshape(-1).tolist(),
        'normals': np.round(vertex_normals[used], 4).reshape(-1).tolist(),
        'indices': indices.reshape(-1).tolist(),
    }


def cortical_meshes(folder):
    meshes = []
    stats = []
    for prefix, hemisphere in [('lh', 'left'), ('rh', 'right')]:
        vertices, faces = read_geometry(folder / f'{prefix}.pial')
        labels, _, raw_names = read_annot(folder / f'{prefix}.aparc.annot')
        names = [name.decode('ascii') for name in raw_names]
        assert vertices.shape == (10242, 3) and faces.shape == (20480, 3)
        assert labels.shape == (len(vertices),)
        full_normals = normals(vertices, faces)
        # Assign each original triangle once. Majority wins; on a three-way
        # boundary use its first vertex. This retains the complete pial surface
        # without gaps, duplicated triangles or generated cortical geometry.
        a, b, c = labels[faces].T
        face_labels = np.where(b == c, b, a)
        for value in sorted(np.unique(face_labels)):
            region = names[value] if value >= 0 else 'unknown'
            mapped = ANATOMICAL.get(region, FUNCTIONAL.get(region, []))
            mesh = compact_mesh(
                f'{prefix}_{region}', hemisphere, 'cortex', vertices,
                faces[face_labels == value], full_normals, mapped,
                region in FUNCTIONAL, source_region=region,
            )
            meshes.append(mesh)
        stats.append({'hemisphere': hemisphere, 'vertices': len(vertices),
                      'triangles': len(faces), 'parcels': len(np.unique(face_labels))})
    return meshes, stats


def deep_meshes(folder):
    image = nib.load(folder / 'aseg.mgz')
    volume = np.asarray(image.dataobj)
    # Pial files are in FreeSurfer surface-RAS, not scanner-RAS. This is the
    # exact matching voxel -> surface-RAS transform; never recenter per part.
    affine = image.header.get_vox2ras_tkr()
    meshes = []
    for value, label, structure_ids in DEEP:
        points = np.argwhere(volume == value)
        assert len(points), f'Missing aseg label {value}'
        low = np.maximum(points.min(axis=0) - 3, 0)
        high = np.minimum(points.max(axis=0) + 4, volume.shape)
        slices = tuple(slice(int(a), int(b)) for a, b in zip(low, high))
        mask = (volume[slices] == value).astype(np.float32)
        mask = gaussian_filter(mask, sigma=0.65)
        vertices, faces, _, _ = marching_cubes(
            mask, level=0.5, step_size=2, allow_degenerate=False,
        )
        vertices = nib.affines.apply_affine(affine, vertices + low)
        # Ensure consistently outward-facing triangles after the coordinate
        # transform; signed volume is reliable for these closed label meshes.
        signed = np.einsum('ij,ij->i', vertices[faces[:, 0]],
                           np.cross(vertices[faces[:, 1]], vertices[faces[:, 2]])).sum()
        if signed < 0:
            faces = faces[:, [0, 2, 1]]
        hemisphere = 'left' if label.startswith('Left-') else (
            'right' if label.startswith('Right-') else 'midline')
        meshes.append(compact_mesh(
            label, hemisphere, 'cerebellum' if 'Cerebellum' in label else 'subcortex',
            vertices, faces, normals(vertices, faces), structure_ids, False,
        ))
    return meshes, affine.tolist()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', required=True, type=Path)
    parser.add_argument('--output-dir', type=Path, default=ROOT / 'public/models')
    args = parser.parse_args()
    load_sources(args.source_dir)
    meshes, cortex_stats = cortical_meshes(args.source_dir)
    deep, affine = deep_meshes(args.source_dir)
    meshes.extend(deep)
    positions = np.concatenate([np.asarray(mesh['positions']).reshape(-1, 3) for mesh in meshes])
    payload = {
        'version': 1,
        'template': 'FreeSurfer fsaverage5',
        'coordinateSystem': 'surface-RAS',
        'units': 'mm',
        'axes': {'x': 'right', 'y': 'anterior', 'z': 'superior'},
        'bounds': {'min': positions.min(axis=0).tolist(), 'max': positions.max(axis=0).tolist()},
        'unavailableStructureIds': UNAVAILABLE,
        'meshes': meshes,
    }
    args.output_dir.mkdir(parents=True, exist_ok=True)
    output = args.output_dir / 'brain-atlas.json'
    output.write_text(json.dumps(payload, separators=(',', ':'), allow_nan=False) + '\n')
    provenance = {
        'asset': 'brain-atlas.json',
        'outputSha256': sha256(output.read_bytes()),
        'sourceProject': 'FreeSurfer / The General Hospital Corporation',
        'sourceTemplate': 'fsaverage5, official tutorial distribution',
        'sources': [{'url': f'{BASE}/{relative}', 'sha256': digest} for relative, digest in SOURCES],
        'license': '../licenses/FreeSurfer-LICENSE.txt',
        'notice': '../licenses/BRAIN_3D_PROVENANCE.md',
        'modified': True,
        'coordinateSystem': payload['coordinateSystem'],
        'voxelToSurfaceRAS': affine,
        'processing': [
            'Original pial vertices and triangles retained; no synthetic cortical geometry.',
            'DK faces assigned by majority vertex annotation; three-way ties use the first vertex.',
            'Whole-hemisphere area-weighted normals computed before splitting parcels.',
            'ASEG binary masks Gaussian-smoothed (sigma 0.65 voxel) and tessellated at 0.5 with marching cubes step_size 2.',
            'ASEG voxel coordinates transformed with MGH vox2ras_tkr into pial surface-RAS, without per-part centering.',
            'Positions rounded to 0.001 mm and normals to 0.0001; faces use zero-based indices.',
        ],
        'functionalMappings': FUNCTIONAL,
        'anatomicalMappings': ANATOMICAL,
        'unavailableStructureIds': UNAVAILABLE,
        'cortex': cortex_stats,
        'meshCount': len(meshes),
        'triangleCount': sum(len(mesh['indices']) // 3 for mesh in meshes),
        'exporter': 'scripts/export-brain-3d.py',
        'dependencies': {package: importlib.metadata.version(package) for package in
                         ['numpy', 'nibabel', 'scipy', 'scikit-image']},
    }
    (args.output_dir / 'brain-provenance.json').write_text(json.dumps(provenance, indent=2) + '\n')
    print(f'Exported {len(meshes)} meshes; {provenance["triangleCount"]} triangles; {output.stat().st_size} bytes.')
    print(f'SHA-256: {provenance["outputSha256"]}')


if __name__ == '__main__':
    main()
