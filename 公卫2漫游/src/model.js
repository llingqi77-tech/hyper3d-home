import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader=new GLTFLoader();
const cache=new Map();
export function getModel(file){if(!cache.has(file))cache.set(file,loader.loadAsync(`${import.meta.env.BASE_URL}assets/${file}`));return cache.get(file);}
export function prepareModel(source,asset){
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
