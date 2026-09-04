"""Export pinned ggseg polygon data. Requires rdata==1.1.0; no R runtime.

Usage: python scripts/export-atlas.py /path/to/sysdata.rda
Download URL and expected digest are recorded in the generated manifest.
"""
from pathlib import Path
import hashlib
import json
import sys
import warnings
import rdata

REVISION = 'ae4fc09d9b6b527b04cd9d78412945c36f09ca1d'
DIGEST = '1cf6517c49141709134cd62ccaa5b3329dbfe6e6921344c76e6ee437582c68bb'
source = Path(sys.argv[1]).read_bytes()
if hashlib.sha256(source).hexdigest() != DIGEST:
    raise ValueError('Unexpected source digest: refusing to export unpinned geometry')
with warnings.catch_warnings():
    warnings.simplefilter('ignore', UserWarning)
    atlases = rdata.conversion.convert(rdata.parser.parse_data(source))

output = {}
for view, atlas_name, projection in [('lateral', '.dk_atlas', 'lateral'), ('medial', '.dk_atlas', 'medial'), ('deep', '.aseg_atlas', 'coronal_1'), ('deepSide', '.aseg_atlas', 'sagittal')]:
    rows = []
    atlas = atlases[atlas_name]
    for item in atlas['data']['geom'].itertuples():
        if atlas_name == '.dk_atlas' and not str(item.label).startswith('lh_'):
            continue
        points = item.geometry[item.geometry.view == projection]
        if not points.empty:
            rows.append((str(item.label), points))
    xmin = min(p.x.min() for _, p in rows)
    xmax = max(p.x.max() for _, p in rows)
    ymin = min(p.y.min() for _, p in rows)
    ymax = max(p.y.max() for _, p in rows)
    scale = min(700 / (xmax-xmin), 470 / (ymax-ymin))
    dx = (800-(xmax-xmin)*scale)/2
    dy = (600-(ymax-ymin)*scale)/2
    regions = []
    for label, points in rows:
        paths = []
        for _, ring in points.groupby(['group', 'subgroup'], sort=False):
            coordinates = [((float(p.x)-xmin)*scale+dx, (ymax-float(p.y))*scale+dy) for p in ring.itertuples()]
            if len(coordinates) >= 3:
                paths.append('M'+' L'.join(f'{x:.1f},{y:.1f}' for x,y in coordinates)+' Z')
        regions.append({'label': label, 'path': ' '.join(paths), 'anchor': {'x': round((float(points.x.mean())-xmin)*scale+dx,1), 'y': round((ymax-float(points.y.mean()))*scale+dy,1)}})
    output[view] = {'projection': projection, 'regions': regions}

dest = Path(__file__).resolve().parents[1] / 'src/geometry/generated'
dest.mkdir(parents=True, exist_ok=True)
(dest/'atlas.json').write_text(json.dumps(output, separators=(',',':'))+'\n')
manifest = {
    'repository': 'https://github.com/ggsegverse/ggseg.formats', 'revision': REVISION,
    'sourceUrl': f'https://raw.githubusercontent.com/ggsegverse/ggseg.formats/{REVISION}/R/sysdata.rda',
    'sourceSha256': DIGEST, 'outputSha256': hashlib.sha256((dest/'atlas.json').read_bytes()).hexdigest(),
    'atlases': ['Desikan-Killiany / fsaverage5 aparc', 'FreeSurfer aseg / fsaverage5'],
    'changes': 'Selected left cortical views and coronal_1 and sagittal deep projections; affine fit to 800x600; inverted display Y; rounded coordinates to 0.1; no functional relabeling.',
    'licenseNotices': ['ggseg.formats-MIT.txt', 'FreeSurfer-LICENSE.txt'],
    'exporter': 'scripts/export-atlas.py; rdata==1.1.0',
}
(dest/'provenance.json').write_text(json.dumps(manifest, indent=2)+'\n')
print(f'Exported {sum(len(v["regions"]) for v in output.values())} regions; {(dest/"atlas.json").stat().st_size} bytes')
