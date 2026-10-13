"""Check labels, triangle connectivity and bidirectional vertex error in Blender.
Run with blender --background --factory-startup --python-exit-code 1 --python this_file.
Coincident source vertices are canonicalized: glTF can split vertices at normal seams,
and a nearest-coordinate check cannot distinguish IDs with identical coordinates.
"""
import bpy
import gzip
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree

ROOT = Path(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else Path(__file__).resolve().parents[1]
report = {'toleranceMm': 0.02, 'models': []}
report_path = ROOT/'output/blender-studio/geometry-verification.json'
report_path.unlink(missing_ok=True)
for quality, source in [('standard', 'brain-detailed.json.gz'), ('high', 'brain-high-resolution.json.gz')]:
    source_path = ROOT / 'public/models' / source
    asset = ROOT / 'public/models' / ('brain-studio-' + quality + '.glb')
    original = json.loads(gzip.decompress(source_path.read_bytes()))
    by_id = {m['id']: m for m in original['meshes']}
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    bpy.ops.import_scene.gltf(filepath=str(asset), import_shading='NORMALS')
    maximum, triangle_count, coincident_count = 0.0, 0, 0
    seen = set()
    for obj in bpy.context.scene.objects:
        if obj.type != 'MESH':
            continue
        identifier = obj.get('atlasId')
        assert identifier in by_id and identifier not in seen, ('identity', identifier)
        seen.add(identifier)
        src = by_id[identifier]
        assert obj.get('hemisphere') == src['hemisphere']
        assert obj.get('atlas') == src.get('atlas')
        assert list(obj.get('structureIds', [])) == src['structureIds']
        surface = original.get('surfaces', {}).get(src.get('surfaceId'), src)
        positions = surface['positions']
        used = sorted(set(src['indices']))
        source_points = [Vector(positions[i*3:i*3+3]) for i in used]
        target_points = [(obj.matrix_world @ v.co)*1000 for v in obj.data.vertices]
        for a,b in [(source_points,target_points),(target_points,source_points)]:
            tree = KDTree(len(a))
            for i,p in enumerate(a):
                tree.insert(p,i)
            tree.balance()
            error = max(tree.find(p)[2] for p in b)
            maximum = max(maximum,error)
            assert error < report['toleranceMm'], ('coordinates', identifier, error)
        triangles = sum(len(p.vertices)-2 for p in obj.data.polygons)
        assert triangles == len(src['indices'])//3, ('triangles', identifier, triangles)
        tree = KDTree(len(source_points))
        coordinate_ids = {}
        canonical = {}
        for index, point in zip(used, source_points):
            canonical[index] = coordinate_ids.setdefault(tuple(point), index)
            tree.insert(point, canonical[index])
        coincident_count += len(source_points) - len(coordinate_ids)
        tree.balance()
        mapping = [tree.find(point)[1] for point in target_points]
        original_faces = Counter(tuple(sorted(canonical[j] for j in src['indices'][i:i+3])) for i in range(0,len(src['indices']),3))
        decoded_faces = Counter(tuple(sorted(mapping[i] for i in face.vertices)) for face in obj.data.polygons)
        assert original_faces == decoded_faces, ('topology', identifier)
        triangle_count += triangles
    assert seen == set(by_id), ('missing regions',set(by_id)-seen)
    report['models'].append({'quality':quality,'triangleConnectivityPreservedAfterCoincidentVertexWeld':True,'coincidentSourceVertices':coincident_count,'meshCount':len(seen),'triangles':triangle_count,'maxRoundTripErrorMm':maximum,'bytes':asset.stat().st_size,'sha256':hashlib.sha256(asset.read_bytes()).hexdigest(),'sourceSha256':hashlib.sha256(source_path.read_bytes()).hexdigest()})
report_path.write_text(json.dumps(report,indent=2)+'\n')
print('VERIFIED',json.dumps(report))
