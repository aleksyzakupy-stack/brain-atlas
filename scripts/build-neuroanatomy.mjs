import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const root = fileURLToPath(new URL('../', import.meta.url))
const read = name => readFileSync(resolve(root, name), 'utf8')
const reference = JSON.parse(read('docs/neuroanatomy/neuroanatomia-kompendium.json'))
const publicSourceFields = ['id', 'title', 'authors', 'year', 'edition', 'url', 'status', 'scope', 'limitations', 'verificationStatus', 'doi', 'type', 'accessed']
const sources = reference.sources.map(source => Object.fromEntries(publicSourceFields.filter(key => key in source).map(key => [key, source[key]])))
const mappings = ['projectRegionIds', 'projectStructureIds', 'projectCircuitIds', 'projectHierarchyIds', 'projectSpatialAnchorIds']
const entries = reference.entries.map(entry => ({ ...entry, ...Object.fromEntries(mappings.map(key => [key, entry[key] ?? []])), relatedStructureIds: entry.relatedStructureIds ?? [], relatedCircuitIds: entry.relatedCircuitIds ?? [], supplementary: !!entry.supplementary }))
for (const key of mappings) {
  const seen = new Set()
  for (const entry of entries) for (const id of entry[key]) {
    if (seen.has(id)) throw new Error('Niejednoznaczne przypisanie: ' + key + ' / ' + id)
    seen.add(id)
  }
}
const index = entries.map(entry => ({ id: entry.id, names: entry.names, category: entry.category, ...Object.fromEntries(mappings.map(key => [key, entry[key]])), number: entry.number, supplementary: !!entry.supplementary, relatedStructureIds: entry.relatedStructureIds ?? [], relatedCircuitIds: entry.relatedCircuitIds ?? [] }))
const files = {
  'neuroanatomy-index.json': index,
  'neuroanatomy-content.json': { entries, sources, spatialIndexNotes: reference.spatialIndexNotes, counts: reference.counts },
  'neuroanatomy-guide.json': read('docs/neuroanatomy/PRZEWODNIK.md'),
}
mkdirSync(resolve(root, 'src/data/generated'), { recursive: true })
for (const [name, content] of Object.entries(files)) {
  const serialized = JSON.stringify(content) + '\n'
  const destination = resolve(root, 'src/data/generated', name)
  if (process.argv.includes('--check')) {
    if (readFileSync(destination, 'utf8') !== serialized) throw new Error('Nieaktualny eksport: ' + name)
  } else if (!existsSync(destination) || readFileSync(destination, 'utf8') !== serialized) writeFileSync(destination, serialized)
}
console.log('Neuroanatomia: ' + entries.length + ' artykułów, ' + sources.length + ' źródeł; eksport ' + (process.argv.includes('--check') ? 'aktualny' : 'zapisany'))
