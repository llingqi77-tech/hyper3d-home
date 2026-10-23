import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROOM_DEFS,DOORS,roomAt,contains} from '../src/layout.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
assert.equal(ROOM_DEFS.length,10);assert.equal(new Set(ROOM_DEFS.map(r=>r.id)).size,10);
for(const r of ROOM_DEFS){assert(r.poly.length>=4);assert(r.poly.every(p=>p.every(Number.isFinite)));assert(contains(...r.label),r.name+' label outside house');assert.equal(roomAt(...r.label).id,r.id,r.name+' label in wrong room');}
const graph=new Map(ROOM_DEFS.map(r=>[r.id,new Set()]));
for(const door of DOORS){const [x,z]=[(door.a[0]+door.b[0])/2,(door.a[1]+door.b[1])/2],dx=door.b[0]-door.a[0],dz=door.b[1]-door.a[1],len=Math.hypot(dx,dz);assert(len>=.59,door.id+' too narrow');if(door.id==='entry')continue;const neighbours=[roomAt(x-dz/len*.16,z+dx/len*.16)?.id,roomAt(x+dz/len*.16,z-dx/len*.16)?.id];assert.deepEqual([...neighbours].sort(),[...door.rooms].sort(),door.id+' does not join its actual rooms');const [a,b]=door.rooms;graph.get(a).add(b);graph.get(b).add(a);}
// The junction follows the confirmed L-shaped wall: across the children's south edge,
// then down its west edge to bathroom 1, with the child door in that vertical run.
assert.equal(roomAt(1.30,-7.30)?.id,'junction');
assert.equal(roomAt(1.80,-7.30)?.id,'children');
assert.equal(roomAt(1.30,-7.90)?.id,'children');
assert.deepEqual(DOORS.find(d=>d.id==='child-door')?.a,[1.65,-7.70]);
assert.deepEqual(DOORS.find(d=>d.id==='child-door')?.b,[1.65,-6.98]);
// Living flows directly into the open hall; there is no wall across this edge.
graph.get('living').add('junction');graph.get('junction').add('living');
const seen=new Set(),queue=['dining'];while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);queue.push(...graph.get(id));}assert.equal(seen.size,10,'all ten rooms must connect to the entrance');
for(const file of ['主卧漫游/public/assets/bed.glb','儿童房漫游/public/models/bunk-bed-v2.glb','公卫1漫游/public/assets/cabinet-isolated-v3.glb','公卫2漫游/public/assets/cabinet.glb','客房漫游/dist/models/manifest.json','主卧阳台漫游/public/assets/washingMachine.glb','references/floorplans/户型图-门位确认-2026-10-15.png'])assert(fs.existsSync(path.join(root,file)),file+' missing');
console.log('PASS: 10 regions; 9 apertures; all rooms connected; source assets present.');
