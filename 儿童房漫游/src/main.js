import './style.css';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {room,R} from './room.js';
const host=document.querySelector('#scene'),loading=document.querySelector('#loading');
const scene=new T.Scene();scene.background=new T.Color('#eee9e4');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;host.append(renderer.domElement);
const camera=new T.PerspectiveCamera(43,1,.04,40);camera.position.set(3.6,4.8,6.2);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.05,-.25);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.3;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.49;
const pmrem=new T.PMREMGenerator(renderer),env=new RoomEnvironment();scene.environment=pmrem.fromScene(env).texture;scene.environmentIntensity=.22;env.dispose();pmrem.dispose();
scene.add(new T.HemisphereLight('#fff9f5','#8b6654',1.6));const sun=new T.DirectionalLight('#fff4e6',2.3);sun.position.set(-2,6,-4);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.normalBias=.025;scene.add(sun);const fill=new T.DirectionalLight('#f5f5ff',.8);fill.position.set(1,3,5);scene.add(fill);
const light=new T.PointLight('#fff1cd',1.2,7,2);light.position.set(0,2.47,0);scene.add(light);
const architecture=room(scene);
const specs=[
 {id:'wardrobe',size:[3.24,2.38,.55],position:[-1.485,0,-.05],yaw:Math.PI/2},
 {id:'desk',size:[.98,.75,.55],position:[1.49,0,-1.25],yaw:-Math.PI/2},
 {id:'bunk-bed',size:[2.10,1.82,1.40],position:[1.08,0,.48],yaw:-Math.PI/2},
 {id:'ceiling-light',size:[.46,.20,.46],position:[0,2.52,0],yaw:0},
 {id:'curtains',native:true,position:[R.windowX,.70,-1.73],yaw:0}
];
const loader=new GLTFLoader();let completed=0;
async function load(s){const source=(await loader.loadAsync(import.meta.env.BASE_URL+'models/'+s.id+'.glb')).scene;
 const model=new T.Group();if(s.id==='ceiling-light')source.rotation.x=Math.PI/2;model.add(source);
 if(s.id==='bunk-bed'||s.id==='desk')source.traverse(o=>{if(o.isMesh){const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)m.color.multiply(new T.Color('#bd946e'));}});
 if(!s.native){model.updateMatrixWorld(true);const b=new T.Box3().setFromObject(model),size=b.getSize(new T.Vector3()),center=b.getCenter(new T.Vector3());const scale=new T.Vector3(...s.size).divide(size);model.scale.multiply(scale);model.position.set(-center.x*scale.x,-b.min.y*scale.y,-center.z*scale.z);}
 const g=new T.Group();g.name=s.id;g.position.set(...s.position);g.rotation.y=s.yaw;g.add(model);g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});scene.add(g);completed++;host.dataset.loaded=String(completed);loading.textContent=`正在布置儿童房 ${completed}/${specs.length}`;}
async function assemble(){const errors=[];for(const s of specs){try{await load(s);}catch(e){errors.push(s.id);console.error(s.id,e);}}host.dataset.ready=errors.length?'error':'true';if(errors.length)loading.textContent='未能载入 '+errors.join('、');else loading.hidden=true;}
assemble();
function resize(){renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
let dirty=true;controls.addEventListener('change',()=>{dirty=true;});new ResizeObserver(()=>{dirty=true;}).observe(host);new MutationObserver(()=>{dirty=true;}).observe(host,{attributes:true});
function frame(){requestAnimationFrame(frame);controls.update();if(!dirty||document.hidden)return;const w=architecture.walls;w.ceiling.visible=camera.position.y<R.h-.03;w.front.visible=camera.position.z<R.d/2-.03;w.back.visible=camera.position.z>-R.d/2;w.left.visible=camera.position.x>-R.w/2;w.right.visible=camera.position.x<R.w/2;renderer.render(scene,camera);dirty=false;}document.addEventListener('visibilitychange',()=>{dirty=true;});frame();

