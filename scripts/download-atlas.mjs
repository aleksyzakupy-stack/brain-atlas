/* global fetch, Buffer, process, console */
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
const revision = 'ae4fc09d9b6b527b04cd9d78412945c36f09ca1d'
const expected = '1cf6517c49141709134cd62ccaa5b3329dbfe6e6921344c76e6ee437582c68bb'
const response = await fetch(`https://raw.githubusercontent.com/ggsegverse/ggseg.formats/${revision}/R/sysdata.rda`)
if (!response.ok) throw new Error(`Download failed: ${response.status}`)
const bytes = Buffer.from(await response.arrayBuffer())
if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error('Unexpected source digest')
const destination = process.argv[2]
if (!destination) throw new Error('Usage: node scripts/download-atlas.mjs /path/to/sysdata.rda')
await writeFile(destination, bytes, { flag: 'wx' })
console.log('Downloaded and verified pinned atlas source.')
