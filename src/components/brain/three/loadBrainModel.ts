import { validateBrainModel } from './modelTypes'
import type { BrainModelData } from './modelTypes'

export async function decodeBrainModel(response: Response, compressed: boolean): Promise<BrainModelData> {
  if (!response.ok) throw new Error('Model unavailable')
  // Fetch already decodes Content-Encoding; a plain .gz asset needs decoding.
  const alreadyDecoded = response.headers.get('content-encoding')?.includes('gzip')
  const decoded = compressed && !alreadyDecoded && response.body ? new Response(response.body.pipeThrough(new DecompressionStream('gzip'))) : response
  const value: unknown = await decoded.json()
  validateBrainModel(value)
  for (const mesh of value.meshes) {
    if (mesh.id.endsWith('VentralDC')) mesh.kind = 'subcortex'
    if (mesh.id.startsWith('CC_')) mesh.kind = 'white-matter'
  }
  return value
}
