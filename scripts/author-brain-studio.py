"""Run through MCP for Blender execute_blender_code after prepare-blender-atlas.
Only Blender operators and its data API are used. Existing scenes stay intact.
"""
import bpy
import math
from mathutils import Vector

root = bpy.context.scene.get('neuroatlasProjectRoot', '/Users/aleksy/Documents/ChatGPT/brain-atlas')
scene = bpy.data.scenes.new('Neuroatlas_Anatomical_Studio')
if bpy.context.window:
    bpy.context.window.scene = scene
scene.unit_settings.system = 'METRIC'
scene.unit_settings.length_unit = 'MILLIMETERS'
scene.render.engine = 'CYCLES'
scene.cycles.samples = 48
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
scene.view_settings.view_transform = 'AgX'
scene.world = bpy.data.worlds.new('Neuroatlas studio atmosphere')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.16, 0.18, 0.20, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

material = bpy.data.materials.new('Neuroatlas | warm grey matter')
material.use_nodes = True
nodes = material.node_tree.nodes
links = material.node_tree.links
bsdf = nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value = (0.46, 0.285, 0.235, 1)
bsdf.inputs['Roughness'].default_value = 0.62
bsdf.inputs['Specular IOR Level'].default_value = 0.28
bsdf.inputs['Subsurface Weight'].default_value = 0.10
bsdf.inputs['Subsurface Radius'].default_value = (0.001, 0.00045, 0.0003)
bsdf.inputs['Coat Weight'].default_value = 0.06
bsdf.inputs['Coat Roughness'].default_value = 0.48
vertex = nodes.new('ShaderNodeVertexColor')
vertex.layer_name = 'Color'
noise = nodes.new('ShaderNodeTexNoise')
noise.inputs['Scale'].default_value = 650
noise.inputs['Detail'].default_value = 2
coords = nodes.new('ShaderNodeTexCoord')
links.new(coords.outputs['Position'] if 'Position' in coords.outputs else coords.outputs['Object'], noise.inputs['Vector'])
bump = nodes.new('ShaderNodeBump')
bump.inputs['Strength'].default_value = 0.14
bump.inputs['Distance'].default_value = 0.000035
links.new(noise.outputs['Fac'], bump.inputs['Height'])
links.new(bump.outputs['Normal'], bsdf.inputs['Normal'])
# Vertex colour is source sulcal shading, not painted anatomy.
multiply = nodes.new('ShaderNodeMixRGB')
multiply.blend_type = 'MULTIPLY'
multiply.inputs[0].default_value = 1
multiply.inputs[2].default_value = (0.46, 0.285, 0.235, 1)
links.new(vertex.outputs['Color'], multiply.inputs[1])
links.new(multiply.outputs[0], bsdf.inputs['Base Color'])

for quality in ['standard', 'high']:
    bpy.ops.object.select_all(action='DESELECT')
    bpy.ops.import_scene.gltf(filepath=root + '/output/blender-studio/import-' + quality + '.glb', import_shading='NORMALS')
    imported = list(bpy.context.selected_objects)
    collection = bpy.data.collections.new('Anatomy_' + quality)
    scene.collection.children.link(collection)
    for obj in imported:
        for old in list(obj.users_collection):
            old.objects.unlink(obj)
        collection.objects.link(obj)
        if obj.type == 'MESH':
            obj.data.materials.clear()
            obj.data.materials.append(material)
            if obj.data.color_attributes:
                obj.data.color_attributes[0].name = 'Color'
            for face in obj.data.polygons:
                face.use_smooth = True
            obj['quality'] = quality
            obj['source'] = 'FreeSurfer fsaverage; Destrieux / PALS-B12 / ASEG'
    bpy.ops.export_scene.gltf(filepath=root + '/public/models/brain-studio-' + quality + '.glb', export_format='GLB', use_selection=True, use_active_scene=True, collection=collection.name, export_extras=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=7, export_draco_position_quantization=16, export_draco_normal_quantization=12, export_draco_color_quantization=10, export_vertex_color='NAME', export_vertex_color_name='Color', export_all_vertex_colors=False, export_normals=True, export_yup=True, export_materials='EXPORT', export_cameras=False, export_lights=False)
    for obj in imported:
        obj.hide_render = quality == 'standard' or (obj.get('atlas') == 'brodmann') or (obj.type == 'MESH' and obj.get('kind') not in ['cortex', 'cerebellum'] and obj.get('atlasId') != 'Brain-Stem')
        obj.hide_set(obj.hide_render)
    print('Exported', quality, len(imported), 'objects')

# The scene is a studio exhibit. The anatomical coordinates remain untouched.
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.09))
ground = bpy.context.object
ground.name = 'Studio | matte ground'
ground_material = bpy.data.materials.new('Studio | graphite')
ground_material.diffuse_color = (0.045, 0.05, 0.058, 1)
ground_material.use_nodes = True
ground_material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.045, 0.05, 0.058, 1)
ground_material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.88
ground.data.materials.append(ground_material)

def area(name, position, energy, size, color):
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = energy
    light.shape = 'DISK'
    light.size = size
    light.color = color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj

area('Studio | large soft key', (-0.28, -0.18, 0.35), 9, 0.28, (1.0, 0.87, 0.76))
area('Studio | cool fill', (0.22, -0.22, 0.10), 3, 0.25, (0.75, 0.86, 1.0))
area('Studio | rim', (0.10, 0.22, 0.20), 7, 0.20, (1.0, 0.91, 0.83))
camera_data = bpy.data.cameras.new('Neuroatlas | portrait camera')
camera = bpy.data.objects.new(camera_data.name, camera_data)
scene.collection.objects.link(camera)
camera.location = (-0.34, 0.20, 0.13)
camera.rotation_euler = (Vector((0, -0.008, 0)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 0.255
camera_data.clip_start = 0.001
scene.camera = camera
for area_item in (bpy.context.screen.areas if bpy.context.screen else []):
    if area_item.type == 'VIEW_3D':
        area_item.spaces.active.region_3d.view_perspective = 'CAMERA'
scene.render.filepath = root + '/output/blender-studio/brain-studio-render.png'
bpy.ops.wm.save_as_mainfile(filepath=root + '/output/blender-studio/neuroatlas-studio.blend', copy=True, compress=True)
print('Saved Neuroatlas Blender scene; existing scenes preserved')
