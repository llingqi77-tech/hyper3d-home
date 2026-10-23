// Re-run from any directory:
// node 全屋漫游/audit/master-children-junction-parity.mjs
// Headless structural comparison against the EXISTING served dist JS. No browser,
// WebGL, standalone rebuilds, original-file writes, or source-based mock baseline.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import * as esbuild from '../../厨房漫游/node_modules/esbuild/lib/main.js';
import * as T from '../../厨房漫游/node_modules/three/build/three.module.js';
import {GLTFLoader} from '../../厨房漫游/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const resultPath=path.join(repo,'全屋漫游/audit/master-children-junction-parity-result.json');
const sha=data=>createHash('sha256').update(data).digest('hex');
const assets=new Map(),images=[];
const originalBlobURL=URL.createObjectURL.bind(URL),blobs=new Map();
URL.createObjectURL=blob=>{const url=originalBlobURL(blob);blobs.set(url,blob);return url;};
globalThis.self=globalThis;

// A recorder preserves every canvas operation and property assignment. It is
// NOT a canvas rasterizer; the result compares commands, not rendered pixels.
function canvas(){
  const hash=createHash('sha256');let gradientId=0;
  const normalize=value=>value?.auditGradient===undefined?value:{gradient:value.auditGradient};
  const record=(...args)=>hash.update(JSON.stringify(args.map(normalize))+'\n');
  const context=new Proxy({}, {
    set(target,key,value){record('set',key,value);target[key]=value;return true;},
    get(target,key){
      if(key in target)return target[key];
      if(key==='createLinearGradient')return (...args)=>{
        const id=gradientId++;record(key,id,...args);
        return {auditGradient:id,addColorStop(...stops){record('addColorStop',id,...stops);}};
      };
      return (...args)=>record(key,...args);
    },
  });
  return {width:0,height:0,getContext:()=>context,auditDrawHash:()=>hash.copy().digest('hex')};
}
let elements,frames;
function element(){return {dataset:{},style:{},clientWidth:1280,clientHeight:800,hidden:false,
  classList:{toggle(){}},append(){},setAttribute(){},addEventListener(){},relList:{supports:()=>true}};}
function resetDOM(room){
  elements=new Map();frames=[];
  globalThis.document={hidden:false,body:element(),createElement:tag=>tag==='canvas'?canvas():element(),
    querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector);},
    querySelectorAll:()=>[],addEventListener(){}};
  globalThis.window={location:{href:'https://audit.invalid/'+encodeURIComponent(room)+'/dist/index.html'}};
  globalThis.devicePixelRatio=1;
  globalThis.requestAnimationFrame=callback=>{frames.push(callback);return frames.length;};
  globalThis.ResizeObserver=class{observe(){}};
  globalThis.MutationObserver=class{observe(){}};
}
class AuditRenderer{
  constructor(){this.domElement=element();this.shadowMap={};}
  setPixelRatio(){}setSize(){}render(){}
}
class AuditControls{
  constructor(){this.target=new T.Vector3();}
  update(){}addEventListener(){}
}
class AuditPMREM{
  fromScene(){return {texture:new T.Texture()};}dispose(){}
}
globalThis.AuditRenderer=AuditRenderer;globalThis.AuditControls=AuditControls;globalThis.AuditPMREM=AuditPMREM;
function localPath(url){
  const parsed=new URL(url,'https://audit.invalid/');
  return path.join(repo,decodeURIComponent(parsed.pathname).replace(/^\//,''));
}
// Actual GLBs are parsed with the original loader. Only image decoding is
// replaced: encoded bytes are hashed, and a placeholder image allows materials
// to load in Node. Texture pixel fidelity and GPU lighting remain unverified.
const imageLoad=function(url,onLoad,onProgress,onError){
  const texture=new T.Texture();
  const work=(async()=>{
    const bytes=blobs.has(url)?Buffer.from(await blobs.get(url).arrayBuffer()):await fs.readFile(localPath(url));
    texture.image={width:1,height:1,auditEncodedImageHash:sha(bytes)};
    texture.needsUpdate=true;onLoad?.(texture);
  })().catch(error=>{if(onError)onError(error);else throw error;});
  images.push(work);return texture;
};
T.TextureLoader.prototype.load=imageLoad;
class AuditTextureLoader{load(...args){return imageLoad(...args);}}
globalThis.AuditTextureLoader=AuditTextureLoader;
GLTFLoader.prototype.loadAsync=async function(url){
  const file=localPath(url),bytes=await fs.readFile(file);
  assets.set(path.relative(repo,file).replaceAll('\\','/'),sha(bytes));
  return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
};
globalThis.AuditGLTFLoader=GLTFLoader;

function textureManifest(texture){
  const image=texture.image;
  return {type:texture.isCanvasTexture?'CanvasTexture':'Texture',mapping:texture.mapping,
    wrapS:texture.wrapS,wrapT:texture.wrapT,magFilter:texture.magFilter,minFilter:texture.minFilter,
    anisotropy:texture.anisotropy,format:texture.format,typeCode:texture.type,colorSpace:texture.colorSpace,
    offset:texture.offset.toArray(),repeat:texture.repeat.toArray(),center:texture.center.toArray(),rotation:texture.rotation,
    flipY:texture.flipY,generateMipmaps:texture.generateMipmaps,premultiplyAlpha:texture.premultiplyAlpha,unpackAlignment:texture.unpackAlignment,
    image:image?.auditDrawHash?{width:image.width,height:image.height,canvasCommandsSHA256:image.auditDrawHash()}:
      {encodedImageSHA256:image?.auditEncodedImageHash??null}};
}
function materialManifest(material){
  const result={};
  for(const key of Object.keys(material).sort()){
    if(['uuid','id','version','_listeners','userData'].includes(key))continue;
    const value=material[key];
    if(value===null||['string','number','boolean'].includes(typeof value))result[key]=value;
    else if(value?.isTexture)result[key]=textureManifest(value);
    else if(value?.isColor||value?.isVector2||value?.isVector3||value?.isVector4)result[key]=value.toArray();
    else if(Array.isArray(value)||key==='defines')result[key]=value;
  }
  return result;
}
function geometryManifest(g){
  const attribute=a=>({itemSize:a.itemSize,normalized:a.normalized,count:a.count,
    arrayType:a.array.constructor.name,sha256:sha(Buffer.from(a.array.buffer,a.array.byteOffset,a.array.byteLength))});
  return {type:g.type,parameters:g.parameters,groups:g.groups,drawRange:{start:g.drawRange.start,count:String(g.drawRange.count)},
    index:g.index?attribute(g.index):null,
    attributes:Object.fromEntries(Object.keys(g.attributes).sort().map(key=>[key,attribute(g.attributes[key])])),
    morphAttributes:Object.fromEntries(Object.entries(g.morphAttributes).map(([key,value])=>[key,value.map(attribute)]))};
}
function manifest(scene){
  const objects=[];
  function visit(object,indexPath){
    const item={path:indexPath,name:object.name,type:object.type,position:object.position.toArray(),
      quaternion:object.quaternion.toArray(),scale:object.scale.toArray(),visible:object.visible,
      castShadow:object.castShadow,receiveShadow:object.receiveShadow,renderOrder:object.renderOrder};
    if(object.isMesh){item.geometry=geometryManifest(object.geometry);item.material=Array.isArray(object.material)?object.material.map(materialManifest):materialManifest(object.material);}
    if(object.isLight){
      item.light={color:object.color.toArray(),intensity:object.intensity};
      for(const key of ['distance','decay','angle','penumbra'])if(key in object)item.light[key]=object[key];
      if(object.groundColor)item.light.groundColor=object.groundColor.toArray();
      if(object.target)item.light.target={position:object.target.position.toArray()};
      if(object.shadow){const s=object.shadow,c=s.camera;item.light.shadow={bias:s.bias,normalBias:s.normalBias,radius:s.radius,mapSize:s.mapSize.toArray(),camera:{type:c.type,near:c.near,far:c.far}};
        for(const key of ['left','right','top','bottom','fov','aspect'])if(key in c)item.light.shadow.camera[key]=c[key];}
    }
    objects.push(item);object.children.forEach((child,index)=>visit(child,indexPath+'/'+index));
  }
  scene.children.forEach((child,index)=>visit(child,String(index)));
  return {background:scene.background?.toArray(),environmentIntensity:scene.environmentIntensity,objects};
}
function compare(a,b,location='',differences=[]){
  if(typeof a==='number'&&typeof b==='number'&&Math.abs(a-b)<1e-12)return differences;
  if(a===b)return differences;
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
    for(const key of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[key],b[key],location+'/'+key,differences);
  }else if(differences.length<100)differences.push({path:location,standalone:a,canonical:b});
  return differences;
}

const cases=[
  {id:'master',room:'主卧漫游',create:'createMaster',scene:'Ut',replacements:{renderer:'Xg',controls:'D_',loader:'fh',texture:'lh'}},
  {id:'children',room:'儿童房漫游',create:'createChildren',scene:'un',replacements:{renderer:'hg',controls:'Jg',loader:'u_',pmrem:'Fa'}},
  {id:'junction',room:'三门交汇区漫游',create:'createJunction',scene:'hn',replacements:{renderer:'dg',controls:'e_',loader:'f_',pmrem:'Ba'}},
];
async function original(test){
  resetDOM(test.room);
  const html=await fs.readFile(path.join(repo,test.room,'dist/index.html'),'utf8');
  const script=html.match(/<script[^>]+src="([^"]+\.js)"/)[1];
  const file=path.join(repo,test.room,'dist',script),bytes=await fs.readFile(file);
  let code=bytes.toString();
  const names={renderer:'AuditRenderer',controls:'AuditControls',loader:'AuditGLTFLoader',texture:'AuditTextureLoader',pmrem:'AuditPMREM'};
  for(const [kind,name] of Object.entries(test.replacements)){
    const matcher=new RegExp('new '+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'(?=[(;])','g');
    if(!matcher.test(code))throw new Error('Existing dist symbol changed: '+test.id+'/'+kind+'/'+name+'; review the replacement map');
    code=code.replace(matcher,'new globalThis.'+names[kind]);
  }
  // Keep all native geometry/material/placement functions in the existing build.
  code+='\nexport function auditScene(){return '+test.scene+';}';
  const module=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
  const host=document.querySelector('#scene'),deadline=Date.now()+60000;
  while(!host.dataset.ready){if(Date.now()>deadline)throw new Error('Standalone loading timeout: '+test.id);await new Promise(resolve=>setImmediate(resolve));}
  if(host.dataset.ready!=='true')throw new Error('Standalone load failed: '+test.id+' '+document.querySelector('#loading').textContent);
  await Promise.all(images);frames.at(-1)?.(performance.now());
  return {scene:module.auditScene(),path:path.relative(repo,file).replaceAll('\\','/'),sha256:sha(bytes)};
}
async function canonical(test){
  resetDOM(test.room);
  const file=path.join(repo,'全屋漫游/src/canonical',test.id+'.js');
  const build=await esbuild.build({entryPoints:[file],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent',plugins:[{
    name:'native-three',setup(build){build.onResolve({filter:/^three(?:\/addons\/.*)?$/},args=>({external:true,path:pathToFileURL(path.join(repo,
      args.path==='three'?'厨房漫游/node_modules/three/build/three.module.js':'厨房漫游/node_modules/three/examples/jsm/'+args.path.slice('three/addons/'.length))).href}));}
  }]});
  const module=await import('data:text/javascript;base64,'+Buffer.from(build.outputFiles[0].contents).toString('base64'));
  const progress=[];
  const result=await module[test.create]({assetUrl:p=>'https://audit.invalid/'+p,onProgress:label=>progress.push(label)});
  await Promise.all(images);
  return {result,progress,path:path.relative(repo,file).replaceAll('\\','/'),sha256:sha(await fs.readFile(file))};
}

const report={generatedAt:new Date().toISOString(),method:'Existing dist application modules executed in Node, with rendering/controls/PMREM stubbed; actual GLBs parsed; complete recursive structural manifests compared.',
  limitations:['No browser or WebGL render; PMREM output and visual parity remain unverified.',
    'Canvas draw commands compared, not rasterized canvas pixels. Encoded texture image bytes compared, not decoded pixels.',
    'Dist constructor/scene symbols are intentionally pinned; a changed standalone build requires reviewing the replacement map.',
    'Junction materials retain the original module-scoped RNG; repeated construction in one module instance advances its seed.'],
  ownershipConcerns:[{id:'master-attached-balcony-duplication',status:'PRESERVED',
    detail:'createMaster retains the entire attached original balcony root and all eight balcony GLBs. Adding a standalone balcony also will duplicate it; parent must resolve ownership explicitly. Nothing removed.'},
    {id:'junction-doorway-context',status:'PRESERVED',detail:'All three original doorway-context groups remain, including their backing walls/floors and bathroom tiles. Parent must account for them at external corridor connections.'}],rooms:[],assets:{}};
let exitCode=0;
for(const test of cases){
  try{
    const native=await original(test),extracted=await canonical(test);
    const a=manifest(native.scene),b=manifest(extracted.result.scene),differences=compare(a,b);
    const row={id:test.id,standalone:{path:native.path,sha256:native.sha256},canonical:{path:extracted.path,sha256:extracted.sha256},
      sourceProvenance:extracted.result.provenance,standaloneObjects:a.objects.length,canonicalObjects:b.objects.length,
      standaloneManifestSHA256:sha(JSON.stringify(a)),canonicalManifestSHA256:sha(JSON.stringify(b)),
      differences,structuralParity:differences.length===0,progress:extracted.progress};
    // Exercise original moving parts and confirm scene rigid transforms preserve
    // local input coordinates. This does not alter the baseline manifest above.
    if(test.id==='master'){
      const r=extracted.result;
      if(r.curtainOpen||r.doorOpen||r.entryDoorOpen)throw new Error('Master defaults changed');
      r.setCurtainOpen(true,true);r.setDoorOpen(true,true);r.setEntryDoorOpen(true,true);
      if(r.models.get('儿童房同款窗帘').getObjectByName('curtain-left').position.x!==-1||r.models.get('四扇玻璃推拉门').getObjectByName('slider-1').position.x!==-.78||r.entry.door.rotation.y!==Math.PI*.46)throw new Error('Master opening setters failed');
      const p=new T.Vector3(0,1.6,0);r.update(0,p);const visibility=r.balcony.root.children.map(o=>o.visible);
      r.scene.position.set(12,0,-7);r.scene.rotation.y=.73;r.update(0,p);
      if(JSON.stringify(visibility)!==JSON.stringify(r.balcony.root.children.map(o=>o.visible)))throw new Error('Master balcony local camera conversion failed');
      row.interactionChecks='Default states, immediate opening setters, attached balcony visibility under rigid room transform passed.';
    }else if(test.id==='children'){
      extracted.result.setDoorOpen(false);if(extracted.result.entry.door.rotation.y!==0)throw new Error('Children door close failed');
      extracted.result.setDoorOpen(true);if(extracted.result.entry.door.rotation.y!==-Math.PI*.48)throw new Error('Children door reopen failed');
      row.interactionChecks='Original open state, close and reopen passed.';
    }else{
      for(const key of ['children','bathroom','master']){extracted.result.setDoorOpen(key,false);if(extracted.result.doors[key].rotation.y!==0)throw new Error('Junction door close failed');extracted.result.setDoorOpen(key,true);}
      row.interactionChecks='All three original door close and reopen setters passed.';
    }
    report.rooms.push(row);if(differences.length)exitCode=1;
    console.log(test.id+': '+(differences.length?'DIFFERENT':'structural match')+'; '+a.objects.length+' objects; '+differences.length+' differences');
  }catch(error){exitCode=1;report.rooms.push({id:test.id,error:error.stack});console.error(test.id+': '+error.message);}
}
report.assets=Object.fromEntries([...assets].sort(([a],[b])=>a.localeCompare(b)));
// Use apply_patch for artifacts as required by the task, including reruns.
const resultText=JSON.stringify(report,null,2)+'\n';
const {spawnSync}=await import('node:child_process');
// The script emits JSON to stdout for easy redirection by a human; Codex saves
// the reviewed result through apply_patch, avoiding a second file-write path.
if(process.argv.includes('--json'))console.log(resultText);
else console.log('Use --json to emit the full result; save it as '+resultPath);
process.exitCode=exitCode;
