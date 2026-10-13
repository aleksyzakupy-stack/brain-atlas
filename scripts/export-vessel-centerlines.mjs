// Use the same measured cortical projection in Blender and the browser.
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { log } from 'node:console'
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { createCorticalVessels } = await server.ssrLoadModule('/src/components/brain/three/corticalVessels.ts')
  const { validateBrainModel } = await server.ssrLoadModule('/src/components/brain/three/modelTypes.ts')
  const model = JSON.parse(gunzipSync(await readFile('public/models/brain-high-resolution.json.gz')))
  validateBrainModel(model)
  const centerlines = []
  const vessels = createCorticalVessels(model, line => centerlines.push(line))
  const triangles = vessels.root.children.reduce((sum, child) => sum + child.geometry.index.count / 3, 0)
  await writeFile('output/blender-studio/vessel-centerlines.json', JSON.stringify({ version: 1, coordinateSystem: 'surface-RAS mm', description: 'Authored teaching reconstruction; enhanced fine pial vessels, not angiographic segmentation.', centerlines, triangles, meshBatches: vessels.root.children.length }))
  log(JSON.stringify({ centerlines: centerlines.length, triangles, meshBatches: vessels.root.children.length }))
  vessels.dispose()
} finally { await server.close() }
