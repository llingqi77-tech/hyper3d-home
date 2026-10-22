import * as T from '../../厨房漫游/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../厨房漫游/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { furniture } from '../src/assets.js';

// GLTFExporter uses the browser FileReader API to assemble binary chunks.
globalThis.FileReader=class {
  async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}
  async readAsDataURL(blob){this.result=`data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;this.onloadend?.();}
};

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(root,'public/assets');
await mkdir(target,{recursive:true});
const exporter=new GLTFExporter();
for(const [name,make] of Object.entries(furniture(T))){
  const model=make();
  const data=await exporter.parseAsync(model,{binary:true,onlyVisible:true});
  await writeFile(resolve(target,`${name}.glb`),Buffer.from(data));
  console.log(`${name}.glb (${Math.round(data.byteLength/1024)} KiB)`);
}
// Keep the same geometry, colors and double-sided trim as the children's room.
await copyFile(resolve(root,'../儿童房漫游/public/models/curtains.glb'),resolve(target,'children-curtains.glb'));
console.log('children-curtains.glb (exact copy of the children\'s room asset)');
