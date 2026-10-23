import {defineConfig} from '../厨房漫游/node_modules/vite/dist/node/index.js';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({base:'./',resolve:{alias:[{find:/^three\/addons\/(.*)/,replacement:path.resolve(here,'../厨房漫游/node_modules/three/examples/jsm/$1')},{find:'three',replacement:path.resolve(here,'../厨房漫游/node_modules/three/build/three.module.js')}]},build:{chunkSizeWarningLimit:1200}});
