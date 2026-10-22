import './style.css';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBalcony,MODEL_FILES,BALCONY } from './balcony.js';
const $=s=>document.querySelector(s),host=$('#scene');
const scene=new T.Scene();scene.background=new T.Color('#e8e1d6');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.03;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;host.append(renderer.domElement);
const camera=new T.PerspectiveCamera(44,1,.035,40),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=.65;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.49;
scene.add(new T.HemisphereLight('#fff5dc','#89725f',1.85));const sun=new T.DirectionalLight('#fff0d1',2.45);sun.position.set(-.5,5,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.normalBias=.016;scene.add(sun);
const fill=new T.DirectionalLight('#eef3ed',.7);fill.position.set(0,3,-3);scene.add(fill);
const views={
  overview:{pos:[3.7,3.6,-3.4],target:[0,.65,.80],title:'日光里的洗衣角',description:'右侧收纳与左侧洗衣台，在同一个阳台里。'},
  right:{pos:[1.22,1.80,-.62],target:[-1.12,.68,.85],title:'出门向右，照片里的角落',description:'紫花布洗衣机、紫色水桶，以及摆着绿萝的三层木花架。'},
  sink:{pos:[-.35,1.75,.10],target:[1.19,.83,.65],title:'左侧的日常洗衣台',description:'水龙头、肥皂盒和木质搓衣板，依照补充描述布置。'},
  top:{pos:[0,5.1,.9],target:[0,.05,BALCONY.depth/2],title:'阳台的左右分区',description:'左侧洗衣台，右侧洗衣机与花架，中央留出通行空间。'}
};
let transition=null,balcony=null;
function setView(key,animate=true){const v=views[key];if(animate)transition={pos:new T.Vector3(...v.pos),target:new T.Vector3(...v.target)};else{camera.position.set(...v.pos);controls.target.set(...v.target);controls.update();}$('#view-title').textContent=v.title;$('#view-description').textContent=v.description;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===key);b.setAttribute('aria-pressed',String(b.dataset.view===key));});}
setView('overview',false);document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));controls.addEventListener('start',()=>transition=null);
let loaded=0;const assetBase=`${import.meta.env.BASE_URL}assets/`;
createBalcony({assetBase,withDoorFrame:true,onProgress(){loaded++;host.dataset.loaded=String(loaded);$('#progress').textContent=`${loaded} / ${MODEL_FILES.length}`;}}).then(result=>{balcony=result;scene.add(balcony.root);host.dataset.ready='true';$('#loading').hidden=true;}).catch(error=>{host.dataset.ready='error';$('#progress').textContent='加载失败';$('#loading span').textContent='请刷新阳台页面';console.error(error);});
$('#cover').addEventListener('click',()=>{if(!balcony)return;balcony.setCovered(!balcony.covered);$('#cover').textContent=balcony.covered?'掀开花布罩':'还原花布罩';$('#cover').setAttribute('aria-pressed',String(!balcony.covered));});
$('#water').addEventListener('click',()=>{if(!balcony)return;balcony.setWaterRunning(!balcony.waterRunning);$('#water').textContent=balcony.waterRunning?'关上水龙头':'打开水龙头';$('#water').setAttribute('aria-pressed',String(balcony.waterRunning));});
$('#reference-photo').src=`${assetBase}reference.jpg`;$('#reference').addEventListener('click',()=>$('#photo-dialog').showModal());$('#close-photo').addEventListener('click',()=>$('#photo-dialog').close());
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;const blend=1-Math.exp(-dt*7);if(transition){camera.position.lerp(transition.pos,blend);controls.target.lerp(transition.target,blend);if(camera.position.distanceTo(transition.pos)<.004)transition=null;}controls.update();balcony?.update(dt,camera.position);renderer.render(scene,camera);}requestAnimationFrame(frame);
window.__balcony={scene,camera,views,setView,get models(){return balcony?.objects;},get covered(){return balcony?.covered;},get waterRunning(){return balcony?.waterRunning;}};
