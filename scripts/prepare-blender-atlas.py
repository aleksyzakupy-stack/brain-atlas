"""Lossless FreeSurfer → glTF handoff for Blender (stdlib only).

Run before author-brain-studio.py. Coordinates convert surface-RAS mm to
right-handed glTF Y-up metres. Original labels and shared normals are retained.
"""
import array
import gzip
import json
from pathlib import Path
import struct

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/blender-studio'
OUT.mkdir(parents=True, exist_ok=True)


def export(quality, source):
    model = json.load(gzip.open(ROOT / 'public/models' / source, 'rt'))
    binary = bytearray()
    views, accessors, meshes, nodes = [], [], [], []

    def attribute(values, width, integer=False, bounds=False):
        while len(binary) % 4:
            binary.append(0)
        data = array.array('I' if integer else 'f', values).tobytes()
        view = len(views)
        views.append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': len(data)})
        binary.extend(data)
        accessor = {'bufferView': view, 'componentType': 5125 if integer else 5126,
                    'count': len(values) // width, 'type': {1: 'SCALAR', 3: 'VEC3', 4: 'VEC4'}[width]}
        if bounds:
            accessor['min'] = [min(values[i::width]) for i in range(width)]
            accessor['max'] = [max(values[i::width]) for i in range(width)]
        accessors.append(accessor)
        return len(accessors) - 1

    for item in model['meshes']:
        surface = model['surfaces'].get(item.get('surfaceId'), item)
        used = sorted(set(item['indices']))
        remap = {old: new for new, old in enumerate(used)}
        p, n = surface['positions'], surface.get('normals')
        positions = [v for index in used for v in (p[index*3]/1000, p[index*3+2]/1000, -p[index*3+1]/1000)]
        attrs = {'POSITION': attribute(positions, 3, bounds=True)}
        if n:
            attrs['NORMAL'] = attribute([v for index in used for v in (n[index*3], n[index*3+2], -n[index*3+1])], 3)
        relief = surface.get('relief', [0.2] * (len(p)//3))
        attrs['COLOR_0'] = attribute([v for index in used for v in (1-relief[index]*.38, 1-relief[index]*.38, 1-relief[index]*.38, 1)], 4)
        mesh = {'name': item['id'], 'primitives': [{'attributes': attrs, 'indices': attribute([remap[i] for i in item['indices']], 1, integer=True), 'material': 0}]}
        meshes.append(mesh)
        metadata = {k:v for k,v in item.items() if k not in ('positions','normals','indices','relief','surfaceId')}
        if metadata['id'].endswith('VentralDC'):
            metadata['kind'] = 'subcortex'
        if metadata['id'].startswith('CC_'):
            metadata['kind'] = 'white-matter'
        metadata['atlasId'] = metadata.pop('id')
        nodes.append({'name': item['id'], 'mesh': len(meshes)-1, 'extras': metadata})
    gltf = {'asset': {'version':'2.0','generator':'Neuroatlas FreeSurfer-to-Blender handoff'},
            'scene': 0, 'scenes':[{'name':'Neuroatlas '+quality,'nodes':list(range(len(nodes))),'extras':{'quality':quality,'source':source}}],
            'nodes':nodes,'meshes':meshes,'buffers':[{'byteLength':len(binary)}], 'bufferViews':views,'accessors':accessors,
            'materials':[{'name':'Source tissue','pbrMetallicRoughness':{'baseColorFactor':[0.56,0.36,0.29,1],'roughnessFactor':0.65,'metallicFactor':0}}]}
    encoded=json.dumps(gltf,separators=(',',':')).encode()
    encoded += b' ' * (-len(encoded)%4)
    binary += b'\0' * (-len(binary)%4)
    result=struct.pack('<III',0x46546c67,2,12+8+len(encoded)+8+len(binary))+struct.pack('<II',len(encoded),0x4e4f534a)+encoded+struct.pack('<II',len(binary),0x004e4942)+binary
    path=OUT/f'import-{quality}.glb'
    path.write_bytes(result)
    print(path.name, len(nodes), 'meshes,', round(len(result)/1e6,2), 'MB')

if __name__ == '__main__':
    export('standard', 'brain-detailed.json.gz')
    export('high', 'brain-high-resolution.json.gz')
