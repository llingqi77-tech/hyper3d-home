import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {room,R} from '../../../儿童房漫游/src/room.js';

// SHA256 of the unmodified sources at extraction; this is provenance, not a
// verification against the served standalone page.
export const provenance={
  '儿童房漫游/src/main.js':'00ED6854121ED3DA6033C61F6E488C1CB4BF2A826A77C0232EA790D2C3D00736',
  '儿童房漫游/src/room.js':'149246B2BD9FB1CD5A3DD1202027B046876CA4A60D2AD865E30950B3994E75D1',
  '儿童房漫游/src/materials.js':'DE3017AD2B62DB0080A8CA327CFB1204809510745B273D2E92588ACC3D2008CE',
};

export async function createChildren({assetUrl,onProgress=()=>{},renderer}={}){
  const scene=new T.Scene();scene.background=new T.Color('#eee9e4');
  if(renderer){
    const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env).texture;env.dispose();pmrem.dispose();
  }
  scene.environmentIntensity=.22;
  scene.add(new T.HemisphereLight('#fff9f5','#8b6654',1.6));const sun=new T.DirectionalLight('#fff4e6',2.3);sun.position.set(-2,6,-4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.normalBias=.025;scene.add(sun);const fill=new T.DirectionalLight('#f5f5ff',.8);fill.position.set(1,3,5);scene.add(fill);
  const light=new T.PointLight('#fff1cd',1.2,7,2);light.position.set(0,2.47,0);scene.add(light);
  // room() and its canvas materials are imported unchanged, including the bay,
  // door, threshold, ceiling, trim, exterior sky and all original grouping.
  const architecture=room(scene);
  const specs=[
    {id:'wardrobe',size:[3.24,2.38,.55],position:[-1.485,0,-.05],yaw:Math.PI/2},
    {id:'desk',size:[.98,.75,.55],position:[1.49,0,-1.25],yaw:-Math.PI/2},
    {id:'bunk-bed-v2',native:true,position:[1.08,0,.48],yaw:-Math.PI/2},
    {id:'wood-chair',native:true,position:[.82,0,-1.25],yaw:Math.PI/2},
    {id:'mountain-bike',native:true,position:[-.63,0,-.70],yaw:Math.PI/2},
    {id:'ceiling-light',size:[.46,.20,.46],position:[0,2.52,0],yaw:0},
    {id:'curtains',native:true,position:[R.windowX,.70,-1.73],yaw:0}
  ];
  const loader=new GLTFLoader(),models=new Map();
  async function load(s){const source=(await loader.loadAsync(assetUrl('儿童房漫游/dist/models/'+s.id+'.glb'))).scene;
    const model=new T.Group();if(s.id==='ceiling-light')source.rotation.x=Math.PI/2;model.add(source);
    if(s.id==='bunk-bed'||s.id==='desk')source.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)m.color.multiply(new T.Color('#bd946e'));}});
    if(!s.native){model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());const scale=new T.Vector3(...s.size).divide(size);model.scale.multiply(scale);model.position.set(-center.x*scale.x,-b.min.y*scale.y,-center.z*scale.z);}
    const g=new T.Group();g.name=s.id;g.position.set(...s.position);g.rotation.y=s.yaw;g.add(model);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);models.set(s.id,g);onProgress(s.id);
  }
  const failures=[];
  for(const s of specs){try{await load(s);}catch(error){failures.push(new Error('儿童房/'+s.id,{cause:error}));}}
  if(failures.length)throw new AggregateError(failures,'儿童房原始模型未全部载入');

  const walls=architecture.walls,ceiling=walls.ceiling;
  const door=walls.front.children.find(o=>o.isGroup);
  const views={overview:{pos:[3.6,4.8,6.2],target:[0,1.05,-.25]}};
  let presentation={mode:'standalone',fullWalls:false},cameraPosition=new T.Vector3(...views.overview.pos);
  function present(){
    const all=presentation.fullWalls||presentation.mode==='walk',p=cameraPosition,w=walls;
    w.ceiling.visible=all||p.y<R.h-.03;w.front.visible=all||p.z<R.d/2-.03;w.back.visible=all||p.z>-R.d/2;w.left.visible=all||p.x>-R.w/2;w.right.visible=all||p.x<R.w/2;
  }
  function setPresentation({mode=presentation.mode,fullWalls=presentation.fullWalls,localCameraPosition}={}){
    presentation={mode,fullWalls};if(localCameraPosition)cameraPosition.copy(localCameraPosition);present();
  }
  function update(dt,localCameraPosition){if(localCameraPosition)cameraPosition.copy(localCameraPosition);present();}
  // The original door starts open; no curtain or furniture state is changed.
  const setDoorOpen=value=>{door.rotation.y=value?-Math.PI*.48:0;};
  const entry={position:[-.83,0,R.d/2],center:[-.83,0,R.d/2],width:.85,height:2.14,normal:[0,0,1],door,setOpen:setDoorOpen};
  present();
  return {scene,ready:true,architecture,walls,ceiling,models,dimensions:{width:R.w,depth:R.d,height:R.h},views,
    renderSettings:{exposure:1.02,environmentIntensity:.22,environment:true},entry,update,setPresentation,setDoorOpen,
    provenance};
}
