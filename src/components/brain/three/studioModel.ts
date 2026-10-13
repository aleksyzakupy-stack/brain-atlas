import { Matrix3, Mesh, Vector3 } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { validateBrainModel } from './modelTypes'
import type { BrainMeshData, BrainModelData } from './modelTypes'

/** Blender/glTF metres, Y up → the atlas's original surface-RAS millimetres. */
export async function decodeStudioModel(response: Response, compressed: boolean): Promise<BrainModelData> {
  if (!response.ok) throw new Error('Studio model unavailable')
  const decoded = compressed && !response.headers.get('content-encoding')?.includes('gzip') && response.body
    ? new Response(response.body.pipeThrough(new DecompressionStream('gzip'))) : response
  const draco = new DRACOLoader().setDecoderPath(`${import.meta.env.BASE_URL}decoders/draco/`).setWorkerLimit(2)
  let gltf
  try {
    gltf = await new GLTFLoader().setDRACOLoader(draco).parseAsync(await decoded.arrayBuffer(), '')
  } finally { draco.dispose() }
  const model: BrainModelData = { version: 3, coordinateSystem: 'surface-RAS', meshes: [] }
  const point = new Vector3()
  gltf.scene.updateMatrixWorld(true)
  try {
    gltf.scene.traverse(object => {
      if (!(object instanceof Mesh)) return
      const metadata = object.userData
      if (typeof metadata.atlasId !== 'string') throw new Error('Missing atlas identity')
      const geometry = object.geometry
      const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal'), color = geometry.getAttribute('color')
      const normalMatrix = new Matrix3().getNormalMatrix(object.matrixWorld)
      const positions: number[] = [], normals: number[] = [], relief: number[] = []
      for (let i = 0; i < position.count; i++) {
        point.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld)
        positions.push(point.x * 1000, -point.z * 1000, point.y * 1000)
        if (normal) {
          point.fromBufferAttribute(normal, i).applyNormalMatrix(normalMatrix)
          normals.push(point.x, -point.z, point.y)
        }
        relief.push(color ? Math.max(0, Math.min(1, (1 - color.getX(i)) / .38)) : .2)
      }
      const item: BrainMeshData = {
        id: metadata.atlasId, label: metadata.label, kind: metadata.kind, hemisphere: metadata.hemisphere,
        structureIds: metadata.structureIds ?? [], approximate: !!metadata.approximate,
        atlas: metadata.atlas, color: metadata.color, selectable: metadata.selectable,
        positions, normals: normal ? normals : undefined, relief,
        indices: geometry.index ? Array.from(geometry.index.array) : Array.from({ length: position.count }, (_, i) => i),
      }
      model.meshes.push(item)
      model.quality = metadata.quality === 'high' ? 'high' : 'standard'
    })
    validateBrainModel(model)
    return model
  } finally {
    gltf.scene.traverse(object => {
      if (!(object instanceof Mesh)) return
      object.geometry.dispose()
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose()
    })
  }
}
