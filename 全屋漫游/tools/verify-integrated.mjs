import fs from 'node:fs/promises';
import path from 'node:path';

const directory = path.resolve(import.meta.dirname, '../audit');
const integrated = JSON.parse(await fs.readFile(path.join(directory, 'integrated.json'), 'utf8'));
const ids = ['master', 'children', 'bathroom1', 'guest', 'kitchen', 'dining', 'living', 'bathroom2', 'balcony', 'junction'];

function meshGroups(meshes) {
  // Cutaway and shared-context dedup change only visibility during presentation.
  // Geometry buffers, local transforms and the original material/texture payloads
  // must still match the standalone page exactly.
  const groups = new Map();
  for (const {visible, matrix:sourceMatrix, ...mesh} of meshes) {
    const signature = JSON.stringify(mesh);
    if (!groups.has(signature)) groups.set(signature, []);
    groups.get(signature).push(sourceMatrix);
  }
  return groups;
}

const result = {};
let failed = false;
for (const id of ids) {
  // The confirmed previous living room is the living-side subset of the
  // original dining page, not the later standalone dining/living hybrid.
  const sourceId = id === 'living' ? 'dining' : id;
  const original = JSON.parse(await fs.readFile(path.join(directory, `${sourceId}-original.json`), 'utf8'));
  const assembled = integrated.rooms[id];
  if (!assembled) throw new Error(`Integrated room missing: ${id}`);
  // The audit capture already removes the room placement matrix.
  const a = meshGroups(id === 'living' ? assembled.meshes : original.meshes);
  const b = meshGroups(id === 'living' ? original.meshes : assembled.meshes);
  let different = 0;
  for (const [signature, nativeMatrices] of a) {
    const assembledMatrices = b.get(signature) ?? [];
    for (const nativeMatrix of nativeMatrices) {
      const found = assembledMatrices.findIndex(matrix => matrix.every((n, i) => Math.abs(n - nativeMatrix[i]) < 1e-6));
      if (found < 0) different++;
      else assembledMatrices.splice(found, 1);
    }
    b.delete(signature);
    different += assembledMatrices.length;
  }
  if (id !== 'living') for (const matrices of b.values()) different += matrices.length;
  const normalizedLights = assembled.lights.map(light => ({...light,matrix:light.matrix.map(n => Math.round(n * 1e6) / 1e6)}));
  const sourceLights = original.lights.map(light => ({...light,matrix:light.matrix.map(n => Math.round(n * 1e6) / 1e6)}));
  const lights = JSON.stringify(sourceLights) === JSON.stringify(normalizedLights);
  const environment = original.environmentIntensity === assembled.environmentIntensity;
  const rigid = integrated.proof[id]?.roomScale?.every(n => n === 1) && integrated.proof[id]?.nativeMatrices === 'unchanged';
  result[id] = {source:sourceId,sourceSubset:id==='living',originalMeshes:original.meshes.length, assembledMeshes:assembled.meshes.length, materialGeometryTransformDifferences:different, lightsMatch:lights, environmentMatch:environment, rigidPlacement:!!rigid};
  if (different || !lights || !environment || !rigid) failed = true;
}
await fs.writeFile(path.join(directory, 'integrated-parity.json'), JSON.stringify(result, null, 2));
for (const [id, r] of Object.entries(result)) console.log(`${r.materialGeometryTransformDifferences || !r.lightsMatch || !r.environmentMatch || !r.rigidPlacement ? 'FAIL' : 'PASS'} ${id}: ${r.assembledMeshes}/${r.originalMeshes} meshes, original materials/geometry/positions/lights`);
if (failed) process.exitCode = 1;
