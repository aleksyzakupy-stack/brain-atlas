/** Read the project's actual data without starting or changing the application. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
function dataModule(name) {
  const code = ts.transpileModule(read(name), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const sandbox = {exports:{}};
  vm.runInNewContext(code,sandbox,{filename:name,timeout:2000});
  return sandbox.exports;
}
const sourceFiles = ['src/data/atlasRegions.json','src/data/structures.ts','src/data/brodmann.ts','src/data/circuits.ts','src/data/anatomyHierarchy.ts','src/data/pathwaySpatial.ts'];
const result = {
  atlasRegions: JSON.parse(read(sourceFiles[0])),
  structureIds: [...read(sourceFiles[1]).matchAll(/^ {4}id: '([^']+)'/gm)].map(m=>m[1]),
  brodmannNumbers: dataModule(sourceFiles[2]).brodmannDescriptions.map(x=>x.number),
  circuits: dataModule(sourceFiles[3]).brainCircuits.map(x=>({id:x.id,names:x.names,kind:x.kind})),
  hierarchy: dataModule(sourceFiles[4]).anatomyHierarchy,
  spatialAnchors: dataModule(sourceFiles[5]).spatialAnchors,
  sourceHashes: Object.fromEntries(sourceFiles.map(name=>[name,crypto.createHash('sha256').update(read(name)).digest('hex')]))
};
process.stdout.write(JSON.stringify(result,null,2)+'\n');
