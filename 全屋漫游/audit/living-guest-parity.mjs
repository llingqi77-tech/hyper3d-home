// Re-run from any directory: node <repo>/全屋漫游/audit/living-guest-parity.mjs
// Read-only CPU parity harness; no browser or original-page rebuild.
// Canvas commands recorded; GLB image bytes hashed, not decoded or rasterized.
// Original source builders run with actual Three r170 and the GLTF parser.
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import * as THREE from '../../厨房漫游/node_modules/three/build/three.module.js';
import {RoundedBoxGeometry} from '../../厨房漫游/node_modules/three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFLoader as ActualGLTFLoader} from '../../厨房漫游/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from '../../厨房漫游/node_modules/three/examples/jsm/loaders/DRACOLoader.js';
const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=p=>fs.readFile(path.join(base,p),'utf8');
const strip=s=>s.replace(/^import .*;\r?\n/gm,'').replaceAll('export function ','function ').replaceAll('export async function ','async function ');
const AF=Object.getPrototypeOf(async function(){}).constructor;
const sources={guest:await read('客房漫游/dist/app.js'),room:await read('客厅漫游/src/room.js'),materials:await read('客厅漫游/src/materials.js'),main:await read('客厅漫游/src/main.js')};
let canvases=[];
function canvas(){
 const operations=[];
 const context=new Proxy({},{
  get(target,key){
   if(key==='createRadialGradient'||key==='createLinearGradient')return(...args)=>{operations.push([key,...args]);return{addColorStop(...args){operations.push(['addColorStop',...args]);}};};
   return target[key]??((...args)=>operations.push([key,...args]));
  },
  set(target,key,value){operations.push(['set',key,typeof value==='object'?'gradient':value]);target[key]=value;return true;}
 });
 const c={width:0,height:0,getContext:()=>context,operations};
 canvases.push(c);return c;
}
globalThis.document={createElement:tag=>{assert.equal(tag,'canvas');return canvas();}};
globalThis.self=globalThis;
globalThis.createImageBitmap=async blob=>({width:1,height:1,contentHash:hash(Buffer.from(await blob.arrayBuffer())),close(){}});
const nativeFetch=globalThis.fetch;
globalThis.fetch=async (url,options)=>{
 if(String(url).startsWith('file:')){try{return new Response(await fs.readFile(fileURLToPath(url)),{status:200});}catch{return new Response('',{status:404});}}
 return nativeFetch(url,options);
};
class GLTFLoader extends ActualGLTFLoader{
 async loadAsync(url){
  const file=String(url).startsWith('file:')?fileURLToPath(url):path.join(base,'客房漫游/dist',url);
  const b=await fs.readFile(file);
  return this.parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),pathToFileURL(path.dirname(file)+'/').href);
 }
}
const image={width:726,height:982,contentHash:hash(await fs.readFile(path.join(base,'客厅漫游/public/references/desk.jpg')))};
THREE.TextureLoader.prototype.load=function(url,done){const t=new THREE.Texture(image);t.needsUpdate=true;done?.(t);return t;};
THREE.TextureLoader.prototype.loadAsync=async function(url){assert.ok(String(url).endsWith('desk.jpg'));return this.load(url);};
const renderer={capabilities:{getMaxAnisotropy:()=>16},shadowMap:{needsUpdate:false}};
const assetPaths=[];
const assetUrl=p=>{assetPaths.push(p);return pathToFileURL(path.join(base,p)).href;};
function snapshot(scene){
 scene.updateMatrixWorld(true);
 const texture=t=>{
  if(!t)return null;
  let image=t.image,content=null;
  if(image?.operations)content=image.operationHash??(image.operationHash=hash(JSON.stringify(image.operations)));
  else content=image?.contentHash??null;
  return {content,wrapS:t.wrapS,wrapT:t.wrapT,repeat:t.repeat.toArray(),offset:t.offset.toArray(),colorSpace:t.colorSpace,anisotropy:t.anisotropy,flipY:t.flipY,channel:t.channel};
 };
 const material=m=>{
  if(!m)return null;
  const out={type:m.type};
  for(const k of ['color','emissive','roughness','metalness','opacity','transparent','side','depthWrite','bumpScale','normalScale','emissiveIntensity','alphaTest','aoMapIntensity'])if(m[k]!==undefined)out[k]=m[k]?.toArray?.()??m[k];
  for(const k of ['map','bumpMap','normalMap','roughnessMap','metalnessMap','emissiveMap'])out[k]=texture(m[k]);
  return out;
 };
 const walk=o=>{
  const out={type:o.type,matrix:o.matrix.toArray(),visible:o.visible,castShadow:o.castShadow,receiveShadow:o.receiveShadow};
  if(o.geometry){
   out.geometry={type:o.geometry.type,attributes:{}};
   for(const k of Object.keys(o.geometry.attributes).sort()){
    const a=o.geometry.attributes[k];out.geometry.attributes[k]={itemSize:a.itemSize,normalized:a.normalized,bytes:hash(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))};
   }
   if(o.geometry.index)out.geometry.index=hash(Buffer.from(o.geometry.index.array.buffer,o.geometry.index.array.byteOffset,o.geometry.index.array.byteLength));
   out.geometry.groups=o.geometry.groups;
   out.material=Array.isArray(o.material)?o.material.map(material):material(o.material);
  }
  if(o.isLight){
   out.light={color:o.color.toArray(),groundColor:o.groundColor?.toArray(),intensity:o.intensity,distance:o.distance,decay:o.decay};
   if(o.shadow)out.light.shadow={mapSize:o.shadow.mapSize.toArray(),bias:o.shadow.bias,normalBias:o.shadow.normalBias,radius:o.shadow.radius,camera:o.shadow.camera.toJSON().object};
  }
  const children=o.isScene?[...o.children.filter(n=>!n.userData.item),...o.children.filter(n=>n.userData.item).sort((a,b)=>a.userData.item.localeCompare(b.userData.item))]:o.children;
  out.children=children.filter(n=>!(n.type==='Object3D'&&!n.children.length&&!n.geometry)).map(walk);return out;
 };
 // Light shadow camera UUIDs are allocation IDs, not appearance.
 const json=JSON.stringify({background:scene.background?.toArray(),environment:scene.environment,environmentIntensity:scene.environmentIntensity,tree:walk(scene)},(key,value)=>key==='uuid'?undefined:value);
 return JSON.parse(json);
}

function compare(actual,expected,label){
 function first(a,b,p='root'){
  if(Object.is(a,b))return null;
  if(typeof a!==typeof b||a===null||b===null||typeof a!=='object')return {path:p,actual:a,expected:b};
  const ak=Object.keys(a),bk=Object.keys(b);
  if(JSON.stringify(ak)!==JSON.stringify(bk))return {path:p+'.keys',actual:ak,expected:bk};
  for(const k of ak){const d=first(a[k],b[k],p+'.'+k);if(d)return d;}
  return null;
 }
 const difference=first(actual,expected);
 if(difference)throw new Error(label+': '+JSON.stringify(difference));
}

const deps=['THREE','RoundedBoxGeometry','GLTFLoader','DRACOLoader','renderer'];
const guestPrefix=sources.guest.slice(sources.guest.indexOf('const ambient='),sources.guest.indexOf('let doorOpen='));
const defs=sources.guest.slice(sources.guest.indexOf('const assetDefinitions='),sources.guest.indexOf('const gltfLoader='));
const load=sources.guest.slice(sources.guest.indexOf('const gltfLoader='),sources.guest.indexOf('function renderInventory('));
const nativeGuest=await new AF(...deps,[
 "const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e6de');let dirty=false;const $=()=>({textContent:''});",
 guestPrefix,defs,load,
 "const manifest=await (await fetch("+JSON.stringify(pathToFileURL(path.join(base,'客房漫游/dist/models/manifest.json')).href)+")).json();let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<assetDefinitions.length)await loadAsset(assetDefinitions[next++],manifest);}));draco.dispose();return {scene,objects};"
].join('\n'))(THREE,RoundedBoxGeometry,GLTFLoader,DRACOLoader,renderer);
const nativeGuestSnapshot=snapshot(nativeGuest.scene);
const guestModule=await new AF(...deps,strip(await read('全屋漫游/src/canonical/guest.js'))+'\nreturn createGuest;')(THREE,RoundedBoxGeometry,GLTFLoader,DRACOLoader,renderer);
const guest=await guestModule({assetUrl,renderer});
compare(snapshot(guest.scene),nativeGuestSnapshot,'guest scene, geometry, materials, lights, textures');
assert.equal(guest.loaded,11);assert.equal(guest.models.size,11);
assert.equal(guest.objects.size,nativeGuest.objects.size);
assert.equal(guest.ground.userData.externalContext,true);
assert.equal(guest.renderSettings.environment,null);
assert.deepEqual(guest.dimensions,{width:3.8,depth:3.2,height:2.72});
const bedBounds=new THREE.Box3().setFromObject(guest.objects.get('bed').group.children[0]);assert.ok(Math.abs(bedBounds.getSize(new THREE.Vector3()).x-1.61)<1e-6);
guest.setPresentation({mode:'plan',fullWalls:false});assert.ok(guest.wallParts.every(w=>!w.visible));
guest.setPresentation({mode:'walk',fullWalls:false});compare(snapshot(guest.scene),nativeGuestSnapshot);
guest.setDoorOpen(false);assert.ok(guest.update(.05));assert.ok(guest.doorGroup.rotation.y<Math.PI/2);
guest.setNight(true);assert.equal(guest.renderSettings.exposure,1.1);guest.setNight(false);
const mainLights=sources.main.slice(sources.main.indexOf('const ambient ='),sources.main.indexOf('const keys ='));
const nativeLivingCode=[
 strip(sources.materials),strip(sources.room).replace('import.meta.env.BASE_URL + "references/desk.jpg"',JSON.stringify('native/references/desk.jpg')),
 'const scene=new THREE.Scene();scene.background=new THREE.Color("#c9d0b9");',
 mainLights,'return {scene,room};'
].join('\n');
const nativeLiving=await new AF('THREE','RoundedBoxGeometry',nativeLivingCode)(THREE,RoundedBoxGeometry);
const nativeLivingSnapshot=snapshot(nativeLiving.scene);
const livingModule=await new AF('THREE','RoundedBoxGeometry',strip(await read('全屋漫游/src/canonical/living.js'))+'\nreturn createLiving;')(THREE,RoundedBoxGeometry);
const living=await livingModule({assetUrl,renderer});
compare(snapshot(living.scene),nativeLivingSnapshot,'living scene, geometry, materials, lights, textures');
assert.equal(living.entry.nativeWallNoAperture,true);
assert.equal(living.objects.dining.children.length,nativeLiving.room.root.children.find(o=>o.position.x===-1.17&&o.position.z===3.17).children.length);
assert.equal(living.ceilingParts.length,2);
assert.ok(living.lamps.every(l=>l.intensity===3.3));
living.setPresentation({mode:'plan',fullWalls:false});assert.ok(living.ceilingParts.every(o=>!o.visible));
living.setPresentation({mode:'walk',fullWalls:false});compare(snapshot(living.scene),nativeLivingSnapshot);
living.setNight(true);assert.equal(living.renderSettings.exposure,1.05);living.setNight(false);compare(snapshot(living.scene),nativeLivingSnapshot);
const livingAgain=await livingModule({assetUrl,renderer});
compare(snapshot(livingAgain.scene),nativeLivingSnapshot,'living per-instance RNG isolation');
let guestMeshes=0,livingMeshes=0;guest.scene.traverse(o=>guestMeshes+=Number(Boolean(o.isMesh)));living.scene.traverse(o=>livingMeshes+=Number(Boolean(o.isMesh)));

for(const result of [guest,living]){
 const wrapper=new THREE.Group();wrapper.position.set(12,0,-7);wrapper.rotation.y=.61;
 const directional=Object.values(result.lights).filter(l=>l.isDirectionalLight);
 for(const l of directional)assert.equal(l.target.parent,result.scene,'directional light target belongs to rigid scene');
 const directions=directional.map(l=>l.target.getWorldPosition(new THREE.Vector3()).sub(l.getWorldPosition(new THREE.Vector3())).normalize());
 wrapper.add(result.scene);wrapper.updateMatrixWorld(true);
 directional.forEach((l,i)=>{
  const actual=l.target.getWorldPosition(new THREE.Vector3()).sub(l.getWorldPosition(new THREE.Vector3())).normalize();
  assert.ok(actual.distanceTo(directions[i].clone().applyQuaternion(wrapper.quaternion))<1e-12,'rigid transform preserves native light direction');
 });
 wrapper.remove(result.scene);result.scene.updateMatrixWorld(true);
}
const {build}=await import('../../厨房漫游/node_modules/esbuild/lib/main.js');
const bundled=await build({
 entryPoints:['全屋漫游/src/canonical/guest.js','全屋漫游/src/canonical/living.js'].map(p=>path.join(base,p)),
 outdir:path.join(base,'unused-in-memory-only'),bundle:true,write:false,format:'esm',platform:'browser',
 alias:{'three/addons':path.join(base,'厨房漫游/node_modules/three/examples/jsm'),'three':path.join(base,'厨房漫游/node_modules/three/build/three.module.js')},logLevel:'silent'
});
assert.equal(bundled.outputFiles.length,2);
for(const p of assetPaths)await fs.access(path.join(base,p));
for(const p of ['客房漫游/dist/vendor/draco/draco_wasm_wrapper.js','客房漫游/dist/vendor/draco/draco_decoder.wasm'])await fs.access(path.join(base,p));
const sourceHashes={};
for(const p of ['客房漫游/dist/app.js','客厅漫游/src/room.js','客厅漫游/src/materials.js','客厅漫游/src/main.js','客厅漫游/src/navigation.js','全屋漫游/src/canonical/guest.js','全屋漫游/src/canonical/living.js'])sourceHashes[p]=hash(await fs.readFile(path.join(base,p)));

console.log(JSON.stringify({pass:true,generatedAt:new Date().toISOString(),command:'node 全屋漫游/audit/living-guest-parity.mjs',threeRevision:THREE.REVISION,sourceHashes,bundleInMemory:true,assetPathsExist:true,nativeDimensions:{guest:guest.dimensions,living:living.dimensions},guestMeshes,livingMeshes,guestGLBs:guest.loaded,guestObjects:guest.objects.size,livingColliders:living.colliders.length,assetPaths:[...new Set(assetPaths)],checks:['all geometry attribute/index buffers','all local transforms','material scalar/color/map parameters','GLB geometry parsed from original files','GLB image byte hashes','procedural canvas drawing command hashes','native light and shadow parameters','presentation toggles and native day/night','repeat living instance seed','directional targets follow entire-room rigid transforms','browser module resolution without writing output'],ignoredNonVisualDifferences:['UUID allocation','GLB completion order aligned by userData.item','native-origin light target ownership added for rigid transforms'],conflicts:living.renderSettings.conflicts,limitation:'CPU comparison only: canvas drawing recorded, image bytes hashed; no pixels decoded or GPU/browser render compared.'},null,2));

