"""Open the studio .blend in background Blender and add editable vessel curves.
Input/output directory is passed after --. Source brain surfaces stay untouched.
"""
import bpy
import json
import sys
from pathlib import Path

root = Path(sys.argv[sys.argv.index('--') + 1])
payload = json.loads((root/'vessel-centerlines.json').read_text())
scene = bpy.context.scene
for collection in list(bpy.data.collections):
    if collection.name == 'Vascular_Anatomy':
        for obj in list(collection.objects):
            bpy.data.objects.remove(obj, do_unlink=True)
        bpy.data.collections.remove(collection)
collection = bpy.data.collections.new('Vascular_Anatomy')
scene.collection.children.link(collection)
materials = {}
for name, color in [('arteries', (.31, .029, .035, 1)), ('veins', (.04, .079, .21, 1))]:
    material = bpy.data.materials.new('Vessels | ' + name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = .43
    bsdf.inputs['Coat Weight'].default_value = .18
    materials[name] = material
batches = {}
for line in payload['centerlines']:
    # Keep named basal vessels individually editable; batch fine surface trees.
    name = line['hemisphere'] + ' | ' + (line['name'] if line['scope'] == 'major' else line['scope'] + ' ' + line['type'])
    if name not in batches:
        curve = bpy.data.curves.new(name, 'CURVE')
        curve.dimensions = '3D'
        curve.resolution_u = 1
        curve.bevel_depth = .001
        curve.bevel_resolution = 2 if line['scope'] == 'micro' else 3
        curve.use_fill_caps = True
        obj = bpy.data.objects.new(name, curve)
        collection.objects.link(obj)
        curve.materials.append(materials[line['type']])
        obj['scope'] = line['scope']
        obj['hemisphere'] = line['hemisphere']
        obj['vascularType'] = line['type']
        obj['precision'] = 'Authored teaching centerline; not angiographic segmentation'
        batches[name] = curve
    curve = batches[name]
    spline = curve.splines.new('POLY')
    spline.points.add(len(line['points']) - 1)
    for i, (point, xyz) in enumerate(zip(spline.points, line['points'])):
        point.co = (*[v / 1000 for v in xyz], 1)
        point.radius = line['radius'] + (line['endRadius'] - line['radius']) * (i / (len(line['points']) - 1)) ** .8
scene['vascularSource'] = payload['description']
atlas_name = 'Neuroatlas_Color_Atlas'
if atlas_name in bpy.data.scenes:
    bpy.data.scenes.remove(bpy.data.scenes[atlas_name])
atlas_scene = bpy.data.scenes.new(atlas_name)
atlas_scene.world = scene.world
atlas_scene.render.engine = 'CYCLES'
atlas_scene.cycles.samples = 32
atlas_scene.cycles.use_denoising = True
atlas_scene.view_settings.view_transform = 'AgX'
atlas_scene.render.resolution_x = 1400
atlas_scene.render.resolution_y = 1100
atlas_scene.render.resolution_percentage = 100
atlas_scene.render.filepath = str(root/'brain-studio-atlas.png')
atlas_scene['description'] = 'Source anatomical parcel colours; original brain geometry shared with the tissue scene.'
colour_materials = {}
for obj in list(scene.objects):
    if obj.get('vascularType') or obj.hide_render:
        continue
    clone = obj.copy()
    atlas_scene.collection.objects.link(clone)
    if obj == scene.camera:
        atlas_scene.camera = clone
    colour = obj.get('color')
    if obj.type == 'MESH' and obj.get('atlasId') and isinstance(colour, str) and colour.startswith('#'):
        if colour not in colour_materials:
            material = bpy.data.materials.new('Atlas | ' + colour)
            material.use_nodes = True
            rgb = [int(colour[i:i+2], 16) / 255 for i in (1,3,5)]
            rgb = [v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb]
            material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*rgb, 1)
            material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .62
            colour_materials[colour] = material
        clone.material_slots[0].link = 'OBJECT'
        clone.material_slots[0].material = colour_materials[colour]
scene.render.resolution_x = 1400
scene.render.resolution_y = 1100
scene.cycles.samples = 32
scene.render.filepath = str(root/'brain-studio-vessels.png')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'neuroatlas-studio.blend'), compress=True)
bpy.ops.render.render(scene=scene.name, write_still=True)
bpy.ops.render.render(scene=atlas_scene.name, write_still=True)
print('VASCULAR_SCENE', len(payload['centerlines']), 'centerlines', len(batches), 'editable objects')
