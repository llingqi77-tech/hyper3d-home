import {writeFile} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {makeCurtains} from './src/curtain.js';
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(r=>{this.result='data:'+blob.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
const binary=await new GLTFExporter().parseAsync(makeCurtains(),{binary:true});
await writeFile(new URL('./public/models/curtains.glb',import.meta.url),Buffer.from(binary));
console.log('Exported separate blue-white gradient curtain model');
