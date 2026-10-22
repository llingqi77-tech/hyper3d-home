import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const here=dirname(fileURLToPath(import.meta.url));
export default {
  root:here,base:'./',publicDir:resolve(here,'public'),
  resolve:{alias:[
    {find:/^three$/,replacement:resolve(here,'../厨房漫游/node_modules/three/build/three.module.js')},
    {find:/^three\/addons/,replacement:resolve(here,'../厨房漫游/node_modules/three/examples/jsm')}
  ]},
  server:{host:'127.0.0.1',port:5190,strictPort:true}
};
