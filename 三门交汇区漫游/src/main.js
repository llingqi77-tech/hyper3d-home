import './style.css';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {buildArchitecture,ROOM} from './architecture.js';

const host=document.querySelector('#scene'),loading=document.querySelector('#loading');
const scene=new T.Scene();scene.background=new T.Color('#e6e2d9');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);
const camera=new T.PerspectiveCamera(43,1,.035,40);camera.position.set(-3.2,2.20,4.15);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.30,-.05);controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=2.2;controls.maxDistance=7;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI*.49;
const pmrem=new T.PMREMGenerator(renderer),environment=new RoomEnvironment();scene.environment=pmrem.fromScene(environment).texture;scene.environmentIntensity=.25;environment.dispose();pmrem.dispose();
scene.add(new T.HemisphereLight('#fffaf1','#8f8069',1.65));
const sun=new T.DirectionalLight('#fff7e5',2);sun.position.set(-2.5,4,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-3,right:3,top:4,bottom:-2,near:.1,far:12});sun.shadow.normalBias=.025;scene.add(sun);
const fill=new T.DirectionalLight('#e9f0ff',.6);fill.position.set(3,2.4,0);scene.add(fill);
const bulb=new T.PointLight('#ffd99a',.8,4,2);bulb.position.set(0,2.18,-.10);scene.add(bulb);
const architecture=buildArchitecture(scene);
const specs=[
 {id:'junction-cabinet',name:'绿色双抽屉百叶柜',size:[.96,1.09,.38],position:[1.025,0,-.40],yaw:-Math.PI/2},
 {id:'junction-pendant',name:'彩色玻璃卵形吊灯',size:[.34,.65,.34],position:[0,2.05,-.10],yaw:0},
 {id:'junction-painting-left',name:'儿童房门左侧田野画',size:[.40,.45,.035],position:[-.98,1.54,-.969],yaw:0,flat:true},
 {id:'junction-painting-right',name:'柜子上方村庄花田画',size:[.43,.57,.035],position:[1.195,1.50,-.40],yaw:-Math.PI/2,flat:true},
];
const loader=new GLTFLoader();let loaded=0;const models=new Map();
async function load(spec){
 const gltf=await loader.loadAsync(import.meta.env.BASE_URL+'assets/'+spec.id+'.glb'),model=gltf.scene;
 model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
 const uniform=Math.min(...spec.size.map((v,i)=>v/Math.max(s.getComponent(i),.0001)));
 const fit=spec.flat||spec.id==='junction-cabinet'?new T.Vector3(...spec.size).divide(s):new T.Vector3(uniform,uniform,uniform);
 model.scale.multiply(fit);model.position.set(-c.x*fit.x,-b.min.y*fit.y,-c.z*fit.z);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const placement=new T.Group();placement.name=spec.id;placement.position.set(...spec.position);placement.rotation.y=spec.yaw;placement.add(model);scene.add(placement);models.set(spec.id,placement);
 loaded++;host.dataset.loaded=String(loaded);loading.textContent=`正在布置三门交汇区 ${loaded} / 4`;
}
async function assemble(){const failures=[];for(const spec of specs){try{await load(spec);}catch(e){failures.push(spec.name);console.error(spec.name,e);}}if(failures.length){loading.textContent='未能载入：'+failures.join('、')+'，请刷新重试';host.dataset.ready='error';}else{loading.hidden=true;host.dataset.ready='true';}}
assemble();
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
function cutaway(){
 architecture.groups.ceiling.visible=camera.position.y<ROOM.height-.02;
 architecture.groups.east.visible=camera.position.x<ROOM.width/2+.02;
 architecture.groups.west.visible=camera.position.x>-ROOM.width/2-.02;
 architecture.groups.rear.visible=camera.position.z>-ROOM.depth/2-.02;
}
function frame(){requestAnimationFrame(frame);controls.update();cutaway();renderer.render(scene,camera);}frame();
