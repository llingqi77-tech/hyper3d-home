import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildArchitecture,ROOM} from '../../../三门交汇区漫游/src/architecture.js';

export const provenance={
  '三门交汇区漫游/src/main.js':'03D8323C15C4702DCBAA6BE9BC2E587C018DF8F421314678C1C52F11F23C17DB',
  '三门交汇区漫游/src/architecture.js':'2ADCC0ABE0432D158F62F5DF1D193E8628BF3298686224711E2A5F9319CDA1E6',
  '三门交汇区漫游/src/materials.js':'500B810A658B2D21936518899A9330E5C4EA17EBE69B67A5C7DDA239BFE33303',
};

export async function createJunction({assetUrl,onProgress=()=>{},renderer}={}){
  const scene=new T.Scene();scene.background=new T.Color('#e6e2d9');
  if(renderer){
    const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment).texture;environment.dispose();pmrem.dispose();
  }
  scene.environmentIntensity=.25;
  scene.add(new T.HemisphereLight('#fffaf1','#8f8069',1.65));
  const sun=new T.DirectionalLight('#fff7e5',2);sun.position.set(-2.5,4,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-3,right:3,top:4,bottom:-2,near:.1,far:12});sun.shadow.normalBias=.025;scene.add(sun);
  const fill=new T.DirectionalLight('#e9f0ff',.6);fill.position.set(3,2.4,0);scene.add(fill);
  const bulb=new T.PointLight('#ffd99a',.8,4,2);bulb.position.set(0,2.18,-.10);scene.add(bulb);
  // Original pure helper, including all doorway-context meshes. Their later
  // ownership at connecting corridors must be resolved explicitly by the parent.
  const architecture=buildArchitecture(scene);
  const specs=[
    {id:'junction-cabinet',name:'绿色双抽屉百叶柜',size:[.96,1.09,.38],position:[1.025,0,-.40],yaw:-Math.PI/2},
    {id:'junction-pendant',name:'彩色玻璃卵形吊灯',size:[.34,.65,.34],position:[0,2.05,-.10],yaw:0},
    {id:'junction-painting-left',name:'儿童房门左侧田野画',size:[.40,.45,.035],position:[-.98,1.54,-.969],yaw:0,flat:true},
    {id:'junction-painting-right',name:'柜子上方村庄花田画',size:[.43,.57,.035],position:[1.195,1.50,-.40],yaw:-Math.PI/2,flat:true},
  ];
  const loader=new GLTFLoader(),models=new Map();
  async function load(spec){
    const gltf=await loader.loadAsync(assetUrl('三门交汇区漫游/dist/assets/'+spec.id+'.glb')),model=gltf.scene;
    model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
    const uniform=Math.min(...spec.size.map((v,i)=>v/Math.max(s.getComponent(i),.0001)));
    const fit=spec.flat||spec.id==='junction-cabinet'?new T.Vector3(...spec.size).divide(s):new T.Vector3(uniform,uniform,uniform);
    model.scale.multiply(fit);model.position.set(-c.x*fit.x,-b.min.y*fit.y,-c.z*fit.z);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const placement=new T.Group();placement.name=spec.id;placement.position.set(...spec.position);placement.rotation.y=spec.yaw;placement.add(model);scene.add(placement);models.set(spec.id,placement);onProgress(spec.id);
  }
  const failures=[];
  for(const spec of specs){try{await load(spec);}catch(error){failures.push(new Error(spec.name,{cause:error}));}}
  if(failures.length)throw new AggregateError(failures,'三门交汇区原始模型未全部载入');

  const walls=architecture.groups,ceiling=walls.ceiling;
  const views={overview:{pos:[-3.2,2.20,4.15],target:[0,1.30,-.05]}};
  let presentation={mode:'standalone',fullWalls:false},cameraPosition=new T.Vector3(...views.overview.pos);
  function present(){
    const all=presentation.fullWalls||presentation.mode==='walk',p=cameraPosition;
    walls.ceiling.visible=all||p.y<ROOM.height-.02;
    walls.east.visible=all||p.x<ROOM.width/2+.02;
    walls.west.visible=all||p.x>-ROOM.width/2-.02;
    walls.rear.visible=all||p.z>-ROOM.depth/2-.02;
  }
  function setPresentation({mode=presentation.mode,fullWalls=presentation.fullWalls,localCameraPosition}={}){
    presentation={mode,fullWalls};if(localCameraPosition)cameraPosition.copy(localCameraPosition);present();
  }
  function update(dt,localCameraPosition){if(localCameraPosition)cameraPosition.copy(localCameraPosition);present();}
  const doors={children:scene.getObjectByName('children-door'),bathroom:scene.getObjectByName('bathroom-one-door'),master:scene.getObjectByName('master-door')};
  function setDoorOpen(key,value=true){const door=doors[key];if(!door)throw new Error('Unknown junction door: '+key);door.rotation.y=value?Math.PI*.49:0;}
  const portals={
    children:{position:[-.25,0,-ROOM.depth/2],center:[-.25,0,-ROOM.depth/2],normal:[0,0,-1],...architecture.doors.child,door:doors.children,setOpen:value=>setDoorOpen('children',value)},
    bathroom:{position:[ROOM.width/2,0,.60],center:[ROOM.width/2,0,.60],normal:[1,0,0],...architecture.doors.bathroom,door:doors.bathroom,setOpen:value=>setDoorOpen('bathroom',value)},
    master:{position:[-ROOM.width/2,0,.35],center:[-ROOM.width/2,0,.35],normal:[-1,0,0],...architecture.doors.master,door:doors.master,setOpen:value=>setDoorOpen('master',value)},
  };
  // Keep scalar wall-local centers from buildArchitecture() under a distinct key.
  for(const portal of Object.values(portals)){portal.wallCenter=portal.center;portal.center=portal.position;portal.height=portal.head;}
  const entry={position:[0,0,ROOM.depth/2],center:[0,0,ROOM.depth/2],width:ROOM.width,height:ROOM.height,normal:[0,0,1],portals};
  present();
  return {scene,ready:true,architecture,walls,ceiling,models,dimensions:{...ROOM},views,
    renderSettings:{exposure:1,environmentIntensity:.25,environment:true},entry,portals,doors,update,setPresentation,setDoorOpen,
    provenance};
}
