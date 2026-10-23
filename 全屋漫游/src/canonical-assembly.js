import * as T from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import * as factories from './canonical/index.js';
import {ROOM_DEFS,CORRIDORS,inPoly} from './canonical-layout.js';
const factoryNames={master:'Master',children:'Children',bathroom1:'Bathroom1',guest:'Guest',bathroom2:'Bathroom2',kitchen:'Kitchen',dining:'Dining',living:'Living',junction:'Junction',balcony:'Balcony'};

function structuralSnapshot(scene,basis=new T.Matrix4()){
 scene.updateWorldMatrix(true,true);const items=[];
 scene.traverse(o=>{if(!o.isMesh)return;const matrix=basis.clone().multiply(o.matrixWorld);items.push({object:o,matrix:matrix.elements.map(x=>Math.round(x*1e8)/1e8),geometry:o.geometry,material:o.material});});return items;
}
function assertRigidPreservation(before,scene,placement){
 const after=structuralSnapshot(scene,placement.matrixWorld.clone().invert());
 if(before.length!==after.length)throw Error('房间接入时网格数量改变');
 for(let i=0;i<before.length;i++){const a=before[i],b=after[i];if(a.object!==b.object||a.geometry!==b.geometry||a.material!==b.material||a.matrix.some((n,k)=>Math.abs(n-b.matrix[k])>1e-7))throw Error('房间接入时几何、材质或相对位置改变：'+a.object.name);}
 return {meshes:after.length,geometry:'same references',materials:'same references',nativeMatrices:'unchanged',roomScale:[1,1,1]};
}
export async function assembleCanonical({renderer,assetUrl,onProgress=()=>{}}){
 const rooms=new Map();
 // Two complete rooms at a time limits decoding memory without trimming assets.
 const queue=[...ROOM_DEFS];async function worker(){while(queue.length){const def=queue.shift();const room=await factories['create'+factoryNames[def.id]]({renderer,assetUrl,onProgress});
  if(room.errors?.size||room.errors?.length)throw Error(def.name+'有模型载入失败');
  const native=structuralSnapshot(room.scene);const placement=new T.Group();placement.name=def.name+' · 原尺寸整体定位';placement.position.set(def.center[0],0,def.center[1]);placement.rotation.y=def.yaw;placement.add(room.scene);placement.updateMatrixWorld(true);
  const proof=assertRigidPreservation(native,room.scene,placement);
  // Native directional targets are at native origin; transform their ownership,
  // never their native coordinates, so a room rotation also rotates its light.
  room.scene.traverse(o=>{if(o.isDirectionalLight&&!o.target.parent)room.scene.add(o.target);});
  if(!room.scene.environment&&(room.renderSettings.environmentIntensity>0)&&room.renderSettings.environment!==false){const p=new T.PMREMGenerator(renderer),e=new RoomEnvironment();room.scene.environment=p.fromScene(e).texture;e.dispose();p.dispose();}
  room.scene.environmentIntensity=room.renderSettings.environmentIntensity??room.scene.environmentIntensity;
  const originalBackground=room.scene.background;room.scene.background=null;
  room.scene.environmentRotation.y=def.yaw;
  rooms.set(def.id,{...def,...room,placement,root:room.scene,originalBackground,proof});onProgress(def.name+'完整接入');
 }}await Promise.all([worker(),worker()]);
 // The master source already includes its neighbour. Render that neighbour once,
 // using the independent balcony's lighting and its complete native door frame.
 const attached=rooms.get('master').balcony.root;attached.userData.sharedInstanceOf='balcony';
 const shell=createCorridors(rooms);
 return {rooms,shell,proof:Object.fromEntries([...rooms].map(([id,r])=>[id,r.proof]))};
}
function createCorridors(rooms){
 const scene=new T.Scene(),root=new T.Group();scene.add(root);const floors=[],walls=[];
 scene.add(new T.HemisphereLight('#fff8e9','#c4aa8b',2.15));
 const floorMaterial=rooms.get('dining').scene.getObjectByName('Dining').material;
 const wallMaterial=new T.MeshStandardMaterial({color:'#efe4bf',roughness:.83});
 const xs=[...new Set(CORRIDORS.flatMap(p=>p.map(v=>v[0])).concat(ROOM_DEFS.flatMap(r=>r.poly.map(v=>v[0]))))].sort((a,b)=>a-b);
 const zs=[...new Set(CORRIDORS.flatMap(p=>p.map(v=>v[1])).concat(ROOM_DEFS.flatMap(r=>r.poly.map(v=>v[1]))))].sort((a,b)=>a-b);
 const house=(x,z)=>ROOM_DEFS.some(r=>inPoly(x,z,r.poly))||CORRIDORS.some(p=>inPoly(x,z,p));
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){
  const x1=xs[i],x2=xs[i+1],z1=zs[j],z2=zs[j+1],x=(x1+x2)/2,z=(z1+z2)/2;
  if(!CORRIDORS.some(p=>inPoly(x,z,p))||ROOM_DEFS.some(r=>inPoly(x,z,r.poly)))continue;
  const floor=new T.Mesh(new T.PlaneGeometry(x2-x1,z2-z1),floorMaterial);floor.rotation.x=-Math.PI/2;floor.position.set(x,-.004,z);floor.receiveShadow=true;floor.name='仅新增连接走廊地面';root.add(floor);floors.push(floor);
  for(const [a,b,px,pz]of [[[x1,z1],[x2,z1],x,z1-.02],[[x2,z1],[x2,z2],x2+.02,z],[[x2,z2],[x1,z2],x,z2+.02],[[x1,z2],[x1,z1],x1-.02,z]]){
   if(house(px,pz))continue;const len=Math.hypot(b[0]-a[0],b[1]-a[1]),wall=new T.Mesh(new T.BoxGeometry(len,2.72,.12),wallMaterial);wall.position.set((a[0]+b[0])/2,1.36,(a[1]+b[1])/2);wall.rotation.y=-Math.atan2(b[1]-a[1],b[0]-a[0]);wall.castShadow=wall.receiveShadow=true;wall.name='连接走廊外墙';root.add(wall);walls.push(wall);
  }
 }
 return {scene,root,floors,walls,setPresentation({walking,fullWalls}){for(const o of walls)o.visible=walking||fullWalls;},blocked(x,z,radius){return !house(x,z);}};
}
