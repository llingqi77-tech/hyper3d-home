import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { assets } from '../../../公卫2漫游/src/assets.js';

// Copied verbatim from the native pure helper; its BASE_URL loader is deliberately
// excluded. Each factory owns a URL-resolved cache and never mutates the source.
function prepareModel(source,asset){
 const model=source.clone(true);
 if(asset.sourceRotation)model.rotation.set(...asset.sourceRotation);
 model.updateMatrixWorld(true);
 if(asset.trim){
  const full=new THREE.Box3().setFromObject(model),extent=full.getSize(new THREE.Vector3()),point=new THREE.Vector3();
  model.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone(),p=g.attributes.position,index=g.index,kept=[];for(let i=0;i<(index?index.count:p.count);i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);let keep=true;for(const v of ids){point.fromBufferAttribute(p,v).applyMatrix4(o.matrixWorld).sub(full.min).divide(extent);const values=[point.x,point.y,point.z];if(values.some((n,k)=>n<asset.trim.min[k]-.001||n>asset.trim.max[k]+.001)){keep=false;break;}}if(keep)kept.push(...ids);}g.setIndex(kept);g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;});
  // Bounds must use only referenced vertices after removing unwanted generated mounting hardware.
  model.traverse(o=>{if(o.isMesh&&o.geometry.index){const g=o.geometry.toNonIndexed();g.computeBoundingBox();g.computeBoundingSphere();o.geometry=g;}});model.updateMatrixWorld(true);
 }
 const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
 model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
 const scale=new THREE.Group();scale.add(model);scale.scale.set(...asset.size.map((n,i)=>n/Math.max([size.x,size.y,size.z][i],.00001)));
 const placed=new THREE.Group();placed.add(scale);placed.position.set(...(asset.pos||[0,0,0]));placed.rotation.y=asset.yaw||0;placed.name=asset.id;placed.userData.assetId=asset.id;
 placed.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.userData.assetId=asset.id;const materials=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const copy=m.clone();copy.side=THREE.DoubleSide;copy.envMapIntensity=.5;if(asset.tint){copy.map=null;copy.color.set(asset.tint);}if(asset.id==='window'){copy.transparent=true;copy.depthWrite=false;copy.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif(diffuseColor.b > diffuseColor.r * 1.08 && diffuseColor.g > diffuseColor.r * 1.06){diffuseColor.rgb=vec3(0.55,0.72,0.75);diffuseColor.a=0.24;}');};copy.customProgramCacheKey=()=> 'glass-louvre-v1';}return copy;});o.material=Array.isArray(o.material)?materials:materials[0];}});
 return placed;
}

// Native source: 公卫2漫游/src/main.js. Keep its hierarchy, fitting, and materials.
export async function createBathroom2({assetUrl,onProgress=()=>{},renderer}={}){
if(typeof assetUrl!=="function") throw new TypeError("createBathroom2 requires assetUrl(repoRelativePath)");
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e2d7');
const ambient=new THREE.HemisphereLight('#ffffff','#bca087',2.0);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff5e4',2.6);sun.position.set(1,6,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-3;sun.shadow.camera.right=3;sun.shadow.camera.top=3;sun.shadow.camera.bottom=-3;sun.shadow.normalBias=.025;sun.shadow.bias=-.00015;scene.add(sun);
const fill=new THREE.DirectionalLight('#e0eeff',.8);fill.position.set(-4,3,2);scene.add(fill);
const pendantLights=[-1.36,-.68].map(x=>{const light=new THREE.PointLight('#ffd18b',.3,3.5,2);light.position.set(x,2.07,-.54);scene.add(light);return light;});

// The architectural shell uses one shared tile pattern on all wall and floor surfaces.
function tileMap(){const c=document.createElement('canvas');c.width=c.height=512;const ctx=c.getContext('2d');const colors=['#af7856','#b77f5c','#b27a57','#bb8562'];for(let y=0;y<2;y++)for(let x=0;x<2;x++){ctx.fillStyle=colors[y*2+x];ctx.fillRect(x*256,y*256,256,256);ctx.strokeStyle='#d1bba6';ctx.lineWidth=5;ctx.strokeRect(x*256+1,y*256+1,254,254);ctx.strokeStyle='#9c6a4e';ctx.lineWidth=1;ctx.strokeRect(x*256+5,y*256+5,246,246);}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;return tex;}
const tiles=tileMap();
function tileMaterial(w,h){const map=tiles.clone();map.repeat.set(w/.4,h/.4);return new THREE.MeshStandardMaterial({map,roughness:.73,metalness:0});}
function box(w,h,d,x,y,z,mat,parent=scene){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
function panel(w,h,x,y,z,ry,parent=scene){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),tileMaterial(w,h));m.position.set(x,y,z);m.rotation.y=ry;m.receiveShadow=true;parent.add(m);return m;}
const edgeMat=new THREE.MeshStandardMaterial({color:'#b0957b',roughness:.9});
box(3.52,.12,2.02,0,-.064,0,edgeMat);
const floor=panel(3.4,1.9,0,.003,0,0);floor.rotation.x=-Math.PI/2;
const walls={north:new THREE.Group(),west:new THREE.Group(),east:new THREE.Group()};Object.values(walls).forEach(g=>scene.add(g));
panel(3.4,2.65,0,1.325,-.95,0,walls.north);box(3.52,.055,.10,0,2.66,-.985,edgeMat,walls.north);
panel(1.9,2.65,-1.70,1.325,0,Math.PI/2,walls.west);box(.10,.055,2,-1.745,2.66,0,edgeMat,walls.west);
// Four sections keep a real opening through the east wall for the louvre window.
const winZ=-.02,winW=.70,winB=1.62,winH=.50;
panel(1.9,winB,1.70,winB/2,0,-Math.PI/2,walls.east);
panel(1.9,2.65-winB-winH,1.70,(2.65+winB+winH)/2,0,-Math.PI/2,walls.east);
for(const [a,b] of [[-.95,winZ-winW/2],[winZ+winW/2,.95]])panel(b-a,winH,1.70,winB+winH/2,(a+b)/2,-Math.PI/2,walls.east);
box(.10,.055,2,1.745,2.66,0,edgeMat,walls.east);
// South edge stays cut away; a gap identifies the southwest entrance.
box(.15,.06,.085,-1.625,.035,.95,edgeMat);box(2.48,.06,.085,.46,.035,.95,edgeMat);
const threshold=new THREE.MeshStandardMaterial({color:'#d2bfa6',roughness:.85});box(.78,.018,.14,-1.16,.008,1.01,threshold);
const mirrorSurface=new Reflector(new THREE.PlaneGeometry(.65,.77),{color:0xd7d9d3,textureWidth:512,textureHeight:512,clipBias:.004});mirrorSurface.position.set(-1.03,1.56,-.796);scene.add(mirrorSurface);


const views={overview:{pos:[3.8,3.3,5.7],target:[0,.98,0]},vanity:{pos:[-.72,1.78,3.05],target:[-1.02,1.26,-.54]},shower:{pos:[.65,1.95,3.72],target:[1.06,1.12,-.10]},top:{pos:[0,5.7,0],target:[0,0,0]}};

const architecture=scene.children.filter(o=>!o.isLight&&o!==mirrorSurface);
const modelGroups=new Map(),instances=[],states=new Map(assets.map(a=>[a.id,"loading"])),errors=new Map();
const loader=new GLTFLoader(),cache=new Map();
function getModel(file){
  const url=assetUrl("公卫2漫游/public/assets/"+file);
  if(!cache.has(url)) cache.set(url,loader.loadAsync(url));
  return cache.get(url);
}
async function loadAsset(a){
  try{
    const gltf=await getModel(a.file||a.id+".glb");
    const main=prepareModel(gltf.scene,a);scene.add(main);instances.push(main);modelGroups.set(a.id,main);
    for(const copy of a.copies||[]){const group=prepareModel(gltf.scene,{...a,...copy,id:a.id});scene.add(group);instances.push(group);}
    states.set(a.id,"ready");
  }catch(error){states.set(a.id,"error");errors.set(a.id,error);}
  onProgress(a.name);
}
// All native fitting (including towel triangle cropping) finishes while detached.
for(let i=0;i<assets.length;i+=3) await Promise.all(assets.slice(i,i+3).map(loadAsset));
let mode="overview",viewKey="overview",fullWalls=false,night=false;
let curtainClosed=false,curtainAmount=.16,curtainTarget=.16;
let cameraPosition=new THREE.Vector3(...views.overview.pos);
function applyPresentation(){
  const complete=fullWalls||mode==="walk";
  walls.east.visible=complete||cameraPosition.x<1.6&&viewKey!=="top";
  walls.west.visible=complete||cameraPosition.x>-1.6&&viewKey!=="top";
  walls.north.visible=complete||cameraPosition.z>-.9&&viewKey!=="top";
  mirrorSurface.visible=viewKey!=="top";
}
function setView(key){
  if(!views[key]) throw new RangeError("Unknown bathroom2 view: "+key);
  viewKey=key;cameraPosition.set(...views[key].pos);applyPresentation();
}
function setLight(value){
  night=Boolean(value);scene.background.set(night?"#302e2a":"#e9e2d7");
  ambient.intensity=night?.65:2;sun.intensity=night?.18:2.6;fill.intensity=night?.20:.8;
  pendantLights.forEach(l=>l.intensity=night?7:.3);
  for(const group of instances){if(group.userData.assetId==="pendant")group.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.emissive.set("#d5a34f");m.emissiveIntensity=night?.12:0;}}});}
}
function setCurtainClosed(value){curtainClosed=Boolean(value);curtainTarget=curtainClosed?1:.16;}
function setPresentation(options={}){
  if(options.mode!==undefined){mode=options.mode;viewKey=mode==="plan"?"top":views[mode]?mode:"overview";}
  if(options.fullWalls!==undefined) fullWalls=options.fullWalls;
  if(options.view!==undefined) setView(options.view);
  if(options.localCameraPosition) cameraPosition.copy(options.localCameraPosition);
  else if(options.mode!==undefined) cameraPosition.set(...views[viewKey].pos);
  if(options.night!==undefined) setLight(options.night);
  if(options.curtainClosed!==undefined) setCurtainClosed(options.curtainClosed);
  applyPresentation();
}
function update(dt=0,localCameraPosition){
  if(localCameraPosition) cameraPosition.copy(localCameraPosition);
  const blend=1-Math.exp(-Math.min(dt,.5)*9);
  if(Math.abs(curtainTarget-curtainAmount)>.0001) curtainAmount+=(curtainTarget-curtainAmount)*blend;
  else curtainAmount=curtainTarget;
  applyPresentation();
  const curtain=modelGroups.get("curtain");
  if(curtain){curtain.scale.x=curtainAmount;curtain.position.z=-.89+.89*curtainAmount;}
}
// Match the settled independent page, whose animate() applies the open curtain.
update(0);
return {
  scene,dimensions:{width:3.4,depth:1.9,height:2.65,minX:-1.7,maxX:1.7,minZ:-.95,maxZ:.95},
  walls,architecture,models:modelGroups,modelGroups,assets,instances,states,errors,views,floor,reflectors:[mirrorSurface],
  renderSettings:{exposure:1.12,environmentIntensity:scene.environmentIntensity,environment:scene.environment,background:scene.background,
    toneMapping:THREE.ACESFilmicToneMapping,outputColorSpace:THREE.SRGBColorSpace,
    shadows:true,shadowMapType:THREE.PCFSoftShadowMap,pixelRatioCap:1.5},
  cameraSettings:{fov:40,near:.03,far:40,up:[0,1,0],planUp:[0,0,-1],
    planBounds:{left:-2,right:2,top:1.5,bottom:-1.5},planMinHeight:2.95,planFitWidth:4},
  entry:{wall:"south",width:.78,position:[-1.16,0,1.01],inside:[-1.16,1.6,.70],
    outside:[-1.16,1.6,1.30],direction:[0,0,-1],target:[-1.16,1.6,0]},
  setPresentation,update,setView,setLight,setCurtainClosed,
  get curtainClosed(){return curtainClosed;},get night(){return night;},
};
}

