import {build} from '../../厨房漫游/node_modules/esbuild/lib/main.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url)),three=path.resolve(here,'../../厨房漫游/node_modules/three');
const {outputFiles}=await build({entryPoints:[path.join(here,'check-batching.mjs')],bundle:true,write:false,platform:'node',format:'esm',alias:{'three/addons':path.join(three,'examples/jsm'),'three':path.join(three,'build/three.module.js')}});
try{await import('data:text/javascript;base64,'+Buffer.from(outputFiles[0].text).toString('base64'));}catch(error){console.error(error.message);process.exitCode=1;}
