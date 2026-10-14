import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { assets } from './assets.js';
import { getModel,prepareModel } from './model.js';

const $=s=>document.querySelector(s),host=$('#canvas-host');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e2d7');
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
renderer.domElement.setAttribute('aria-label','可拖动旋转的公卫2三维空间');
const perspectiveCamera=new THREE.PerspectiveCamera(40,1,.03,40);
const planCamera=new THREE.OrthographicCamera(-2,2,1.5,-1.5,.03,40);planCamera.up.set(0,0,-1);
let camera=perspectiveCamera;
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.35;controls.maxDistance=11;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,.9,0);
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

const modelGroups=new Map(),instances=[],states=new Map(assets.map(a=>[a.id,'loading']));let activeFilter='all',selected=null,curtainClosed=false,curtainAmount=.16,curtainTarget=.16,night=false,renderRequested=true;
const views={overview:{pos:[3.8,3.3,5.7],target:[0,.98,0]},vanity:{pos:[-.72,1.78,3.05],target:[-1.02,1.26,-.54]},shower:{pos:[.65,1.95,3.72],target:[1.06,1.12,-.10]},top:{pos:[0,5.7,0],target:[0,0,0]}};
let viewKey='overview',transition=null;
function setView(key,animate=true){viewKey=key;selected=null;$('#selected-label').hidden=true;document.body.classList.toggle('detail-view',key!=='overview');const nextCamera=key==='top'?planCamera:perspectiveCamera;if(nextCamera!==camera){camera=nextCamera;controls.object=camera;animate=false;}controls.enableRotate=key!=='top';controls.maxPolarAngle=key==='top'?Math.PI:Math.PI*.49;resize();const v=views[key];const p=new THREE.Vector3(...v.pos),t=new THREE.Vector3(...v.target);if(key!=='top'&&host.clientWidth<650)p.sub(t).multiplyScalar(key==='overview'?1.25:1.45).add(t);if(animate)transition={p,t};else{transition=null;camera.position.copy(p);controls.target.copy(t);controls.update();}document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===key);b.setAttribute('aria-pressed',b.dataset.view===key);});renderList();}
function renderList(){const list=$('#object-list');list.replaceChildren();assets.forEach((a,i)=>{if(activeFilter!=='all'&&a.type!==activeFilter)return;const b=document.createElement('button');b.className='object'+(selected===a.id?' active':'');b.dataset.id=a.id;b.dataset.status=states.get(a.id);b.setAttribute('aria-label',`${a.name}，${a.area}${states.get(a.id)==='error'?'，模型加载失败，点击重试':''}`);b.innerHTML=`<span class="number">${String(i+1).padStart(2,'0')}</span><span><strong>${a.name}</strong><small>${states.get(a.id)==='error'?'加载失败 · 点击重试':a.area}</small></span><span class="asset-dot" aria-hidden="true"></span>`;b.addEventListener('click',()=>{if(states.get(a.id)==='error')location.reload();else focusAsset(a);});list.append(b);});}
function focusAsset(a){if(camera.isOrthographicCamera)setView('overview',false);selected=a.id;viewKey='detail';document.body.classList.add('detail-view');const target=new THREE.Vector3(a.pos[0],a.pos[1]+a.size[1]*.52,a.pos[2]);let distance=Math.max(.75,Math.max(...a.size)*2.0);let offset=new THREE.Vector3(.45,.35,1).normalize().multiplyScalar(distance);if(a.id==='window')offset=new THREE.Vector3(-1.3,.25,.5);if(a.id==='socket')offset=new THREE.Vector3(.65,.10,.25);if(a.id==='drain')offset=new THREE.Vector3(-.2,.65,.35);transition={p:target.clone().add(offset),t:target};$('#selected-label').textContent=a.name;$('#selected-label').hidden=false;document.querySelectorAll('[data-view]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});renderList();}
function updateCount(){renderRequested=true;const ready=[...states.values()].filter(s=>s==='ready').length,errors=[...states.values()].filter(s=>s==='error').length;$('#asset-count').textContent=`${ready} / ${assets.length} 类独立物件已载入`;$('#load-state').textContent=errors?`${errors} 件模型未载入，可在清单中重试`:`正在载入物件 ${ready} / ${assets.length}`;$('#load-state').hidden=ready===assets.length;document.body.dataset.loaded=String(ready);document.body.dataset.errors=String(errors);}
async function loadAsset(a){try{const gltf=await getModel(a.file||`${a.id}.glb`);const main=prepareModel(gltf.scene,a);scene.add(main);instances.push(main);modelGroups.set(a.id,main);for(const copy of a.copies||[]){const group=prepareModel(gltf.scene,{...a,...copy,id:a.id});scene.add(group);instances.push(group);}states.set(a.id,'ready');}catch(error){states.set(a.id,'error');console.error('Model load failed',a.id,error);}renderList();updateCount();}
async function loadAll(){for(let i=0;i<assets.length;i+=3)await Promise.all(assets.slice(i,i+3).map(loadAsset));window.__bathroomReady=true;}
renderList();updateCount();loadAll();setView('overview',false);

document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));$('#reset').addEventListener('click',()=>setView('overview'));
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(e=>e.classList.toggle('active',e===b));renderList();}));
function setLight(value){renderRequested=true;night=value;document.body.classList.toggle('night',night);scene.background.set(night?'#302e2a':'#e9e2d7');ambient.intensity=night?.65:2;sun.intensity=night?.18:2.6;fill.intensity=night?.20:.8;pendantLights.forEach(l=>l.intensity=night?7:.3);for(const group of instances){if(group.userData.assetId==='pendant')group.traverse(o=>{if(o.isMesh){for(const m of Array.isArray(o.material)?o.material:[o.material]){m.emissive.set('#d5a34f');m.emissiveIntensity=night?.12:0;}}});}$('#day').classList.toggle('active',!night);$('#warm').classList.toggle('active',night);$('#day').setAttribute('aria-pressed',!night);$('#warm').setAttribute('aria-pressed',night);}
$('#day').addEventListener('click',()=>setLight(false));$('#warm').addEventListener('click',()=>setLight(true));
$('#curtain-toggle').addEventListener('click',()=>{curtainClosed=!curtainClosed;curtainTarget=curtainClosed?1:.16;$('#curtain-toggle').textContent=curtainClosed?'拉开分隔帘':'拉上分隔帘';$('#curtain-toggle').setAttribute('aria-pressed',curtainClosed);});
const dialog=$('#reference-dialog');$('#references').addEventListener('click',()=>dialog.showModal());$('#close-reference').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
controls.addEventListener('start',()=>transition=null);
controls.addEventListener('change',()=>renderRequested=true);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart;
renderer.domElement.addEventListener('pointerdown',e=>pointerStart=[e.clientX,e.clientY]);renderer.domElement.addEventListener('pointerup',e=>{if(!pointerStart||Math.hypot(e.clientX-pointerStart[0],e.clientY-pointerStart[1])>5)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(instances,true);if(hits.length){const a=assets.find(a=>a.id===hits[0].object.userData.assetId);if(a)focusAsset(a);}});
function resize(){renderRequested=true;const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);if(camera.isOrthographicCamera){const height=Math.max(2.95,4.0/(w/h));camera.left=-height*w/h/2;camera.right=height*w/h/2;camera.top=height/2;camera.bottom=-height/2;}else camera.aspect=w/h;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();
let lastFrame=performance.now();
function animate(now=performance.now()){requestAnimationFrame(animate);const dt=Math.min((now-lastFrame)/1000,.5);lastFrame=now;const blend=1-Math.exp(-dt*9);if(transition){renderRequested=true;camera.position.lerp(transition.p,blend);controls.target.lerp(transition.t,blend);if(camera.position.distanceTo(transition.p)<.004&&controls.target.distanceTo(transition.t)<.004){camera.position.copy(transition.p);controls.target.copy(transition.t);transition=null;}}controls.update();if(Math.abs(curtainTarget-curtainAmount)>.0001){curtainAmount+=(curtainTarget-curtainAmount)*blend;renderRequested=true;}else curtainAmount=curtainTarget;if(!renderRequested)return;walls.east.visible=camera.position.x<1.6&&viewKey!=='top';walls.west.visible=camera.position.x>-1.6&&viewKey!=='top';walls.north.visible=camera.position.z>-.9&&viewKey!=='top';mirrorSurface.visible=viewKey!=='top';const curtain=modelGroups.get('curtain');if(curtain){curtain.scale.x=curtainAmount;curtain.position.z=-.89+.89*curtainAmount;}renderer.render(scene,camera);renderRequested=false;}animate();
window.__bathroom={scene,get camera(){return camera;},controls,assets,modelGroups,states,setView,focusAsset,setLight,get curtainClosed(){return curtainClosed;},get night(){return night;}};
