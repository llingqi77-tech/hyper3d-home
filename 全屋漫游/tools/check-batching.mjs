import assert from 'node:assert/strict';
import * as T from '../../厨房漫游/node_modules/three/build/three.module.js';
import {batchFurniture} from '../src/batch.js';
// Node cannot resolve the Vite alias used by batch.js; run via the local bundler
// wrapper check-batching-runner.mjs, which resolves exactly the production alias.
const root=new T.Group();root.rotation.y=.43;root.position.set(2,0,-3);
const a=new T.MeshStandardMaterial({color:'#876441'}),b=new T.MeshStandardMaterial({color:'#ddd7c6'});
for(let i=0;i<12;i++){const mesh=new T.Mesh(new T.BoxGeometry(.5,.8,.3),i%3?[a,b,a,b,a,b]:a);mesh.position.set(i*.13,.4,i*.09);if(i%2)mesh.scale.x=-1;root.add(mesh);}
root.updateWorldMatrix(true,true);
function visible(o){for(let p=o;p;p=p.parent)if(!p.visible)return false;return true;}
function snapshot(){let triangles=0;const bounds=new T.Box3(),palette=new Map();root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||!visible(o))return;bounds.union(new T.Box3().setFromObject(o,true));const geo=o.geometry;triangles+=(geo.index?.count||geo.attributes.position.count)/3;const groups=geo.groups.length?geo.groups:[{start:0,count:geo.index?.count||geo.attributes.position.count,materialIndex:0}];for(const g of groups){const m=Array.isArray(o.material)?o.material[g.materialIndex]:o.material;palette.set(m.color.getHex(),(palette.get(m.color.getHex())||0)+g.count/3);}});return {triangles,bounds,palette};}
const before=snapshot(),result=batchFurniture(new Map([['test',{root,name:'test'}]])),after=snapshot();assert.equal(after.triangles,before.triangles);assert.deepEqual(after.palette,before.palette);assert(before.bounds.min.distanceTo(after.bounds.min)<1e-5);assert(before.bounds.max.distanceTo(after.bounds.max)<1e-5);assert(result.reducedBy>0);root.traverse(o=>{if(!o.isMesh||!visible(o))return;const p=o.geometry.attributes.position;for(const n of p.array)assert(Number.isFinite(n));});
console.log('PASS: multi-material/negative-scale batching preserves triangles, material colours and world bounds.');
