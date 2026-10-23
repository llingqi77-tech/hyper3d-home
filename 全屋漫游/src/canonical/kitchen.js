import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createKitchen as buildOriginal} from '../../../厨房漫游/src/kitchen.js?v=stable-counter';
import {UPPER_CABINET_BOTTOM,UPPER_CABINET_HEIGHT} from '../../../厨房漫游/src/dimensions.js';

// Reuse the original constructor, including its shell, floor UVs, thresholds,
// every small countertop object, native axis conversion, textures and lights.
export async function createKitchen({assetUrl,onProgress=()=>{},bathroomDoor=false}={}){
 const scene=new T.Scene(),original=buildOriginal(scene);
 if(bathroomDoor){
  // Reserve a clear 60 cm doorway before the U-shaped counter begins. The
  // independent kitchen page is untouched; only this integrated instance is cut.
  const base=original.groups.get('01');
  if(!base)throw new Error('Kitchen base cabinetry missing');
  for(const piece of base.children){
   if(!piece.isMesh)continue;
   const box=piece.geometry?.parameters;
   if(box?.depth>=1.2&&Math.abs(piece.position.x+1.19)<.025&&Math.abs(piece.position.z+.03)<.025){
    piece.geometry=new T.BoxGeometry(box.width,box.height,box.depth-.10);
    piece.position.z-=.05;
   }else if(piece.position.x<-.65&&piece.position.z>.30){piece.position.z-=.15;}
  }
  let wall;scene.traverse(o=>{if(o.isMesh&&o.userData.cutaway==='west')wall=o;});
  if(!wall)throw new Error('Kitchen north tiled wall missing');
  const parent=wall.parent,material=wall.material;
  parent.remove(wall);
  const parts=[[-.99,.605,0,2.42],[.605,.99,2.20,2.42]];
  for(const [from,to,bottom,top] of parts){const panel=new T.Mesh(new T.BoxGeometry(.1,top-bottom,to-from),material);panel.name='厨房北墙 · 公卫2门洞边';panel.position.set(-1.5,(bottom+top)/2,(from+to)/2);panel.castShadow=panel.receiveShadow=true;panel.userData.cutaway='west';parent.add(panel);}
 }
 const specs=[
  {id:'16',file:'entry-lantern.glb',size:[.55,.62,.55],position:[0,1.8,1.675]},
  {id:'03',file:'white-hood-v2.glb',size:[.80,.43,.36],position:[-.26,1.36,-1.24]},
  {id:'04',file:'two-burner-hob-v2.glb',size:[.80,.11,.48],position:[-.26,.868,-1.02]},
  {id:'08',file:'nonstick-pan-v2.glb',size:[.28,.09,.45],position:[-.49,.978,-.92],yaw:Math.PI},
  {id:'18',file:'pressure-cooker-v2.glb',size:[.28,.29,.40],position:[-.03,.978,-.95],yaw:Math.PI},
  {id:'17',file:'sink-upper-cabinet-v2.glb',size:[.80,UPPER_CABINET_HEIGHT,.28],position:[.83,UPPER_CABINET_BOTTOM,.42],yaw:-Math.PI/2,exactSize:true}
 ];
 const loader=new GLTFLoader();await Promise.all(specs.map(async spec=>{
  const model=(await loader.loadAsync(assetUrl('厨房漫游/public/assets/'+spec.file))).scene;
  model.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  const scale=Math.min(...spec.size.map((n,i)=>n/Math.max(size.getComponent(i),.001))),fit=spec.exactSize?new T.Vector3(...spec.size).divide(size):new T.Vector3(scale,scale,scale);
  model.scale.multiply(fit);model.position.set(-center.x*fit.x,-bounds.min.y*fit.y,-center.z*fit.z);model.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
  const placement=new T.Group();placement.name='hyper3d-'+spec.id;placement.position.set(...spec.position);placement.rotation.y=spec.yaw||0;placement.add(model);scene.add(placement);original.models.set(spec.id,placement);
  original.groups.get(spec.id)?.traverse(o=>{if(o.isMesh)o.visible=false;});onProgress('厨房 · '+spec.file);
 }));
 const view={position:[-3.25*(2.06/3.08),2.8,3.8*(3.08/2.06)],target:[0,1.05,-.1*(3.08/2.06)]};
 const shell=[];scene.traverse(o=>{if(o.userData.cutaway)shell.push(o);});
 let presentation={walking:false,fullWalls:false};
 function setPresentation(options={}){presentation={...presentation,...options};const {walking,fullWalls,camera}=presentation;for(const o of shell){const p=o.userData.cutaway;o.visible=p==='roof'?walking:walking||fullWalls||(p==='east'?camera?.x<.5:p==='west'?camera?.x>-.5:false);}}
 return {scene,native:{width:2.06,depth:3.08,height:2.5},models:original.models,original,shell,entry:[0,0,1.54],views:{overview:view},renderSettings:{exposure:.92,environmentIntensity:.25,fov:48},setPresentation,update(dt,camera){setPresentation({camera});}};
}
