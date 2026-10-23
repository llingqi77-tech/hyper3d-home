import fs from 'node:fs/promises';
import path from 'node:path';
const directory=path.resolve(import.meta.dirname,'../audit');
const id=process.argv[2]||'kitchen';
const [a,b]=await Promise.all(['original','canonical'].map(s=>fs.readFile(path.join(directory,`${id}-${s}.json`),'utf8').then(JSON.parse)));
function meshKey(m){return JSON.stringify({name:m.name,matrix:m.matrix,geometry:m.geometry});}
const matches=new Map();for(const m of b.meshes){const k=meshKey(m);if(!matches.has(k))matches.set(k,[]);matches.get(k).push(m);}
const mismatches=[],missing=[];
function differences(a,b,p=''){const result=[];if(JSON.stringify(a)===JSON.stringify(b))return result;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))result.push(...differences(a[k],b[k],p+'.'+k));}else result.push({path:p,original:a,canonical:b});return result;}
for(const m of a.meshes){const entries=matches.get(meshKey(m));if(!entries?.length){missing.push({name:m.name,matrix:m.matrix,geometry:m.geometry.type});continue;}const n=entries.shift();const diff=differences(m,n);if(diff.length)mismatches.push({name:m.name,diff});}
const extra=[...matches.values()].flat().map(m=>({name:m.name,matrix:m.matrix}));
const result={room:id,counts:[a.meshes.length,b.meshes.length],missing,extra,mismatches,lights:differences(a.lights,b.lights),renderer:differences(a.renderer,b.renderer)};
await fs.writeFile(path.join(directory,id+'-parity.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,mismatches:mismatches.slice(0,5)},null,2));
process.exitCode=missing.length||extra.length||mismatches.length||result.lights.length||result.renderer.length?1:0;
