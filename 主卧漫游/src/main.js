import './style.css';
import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { floralWallpaper, woodFloor } from './textures.js';
import { createBalcony, MODEL_FILES } from '../../主卧阳台漫游/src/balcony.js';

const W=5.08,D=3.25,H=2.72;
const bedX=-.05,nightstandXs=[-1.21,1.11];
const TOTAL_MODELS=9+MODEL_FILES.length;let balconyScene=null;
const $=s=>document.querySelector(s),host=$('#scene'),loading=$('#loading');
const scene=new T.Scene();scene.background=new T.Color('#e8e5dc');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
host.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','可拖动旋转的主卧三维空间');
const camera=new T.PerspectiveCamera(42,1,.04,45);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;
controls.minDistance=1.1;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.495;

const ambient=new T.HemisphereLight('#fff9f0','#aa8e77',2.1);scene.add(ambient);
const sun=new T.DirectionalLight('#fff4e5',2.7);sun.position.set(2,6,-2);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:16});sun.shadow.normalBias=.02;scene.add(sun);
const bedsideLights=nightstandXs.map(x=>{const light=new T.PointLight('#ffd59a',.45,2.6,2);light.position.set(x,1.86,-1.385);scene.add(light);return light;});
const material=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const trim=material('#f5eedf'),plaster=material('#efe8df');
const floral=floralWallpaper(),floorMap=woodFloor();

function box(name,w,h,d,x,y,z,mat,parent=scene){
  const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.name=name;mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function wall(name,w,h,x,y,z,rotation=0){
  const map=floral.clone();map.repeat.set(w/1.45,h/1.65);map.needsUpdate=true;
  const mesh=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide}));
  mesh.name=name;mesh.position.set(x,y,z);mesh.rotation.y=rotation;mesh.receiveShadow=true;scene.add(mesh);return mesh;
}

const floorTexture=floorMap.clone();floorTexture.repeat.set(3.6,2.3);floorTexture.needsUpdate=true;
const floor=new T.Mesh(new T.PlaneGeometry(W,D),new T.MeshStandardMaterial({map:floorTexture,roughness:.76,side:T.DoubleSide}));
floor.name='主卧木地板';floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
box('地面基层',W,.10,D,0,-.064,0,material('#66503e'));
const west=wall('西侧花纹墙',D,H,-W/2,H/2,0,Math.PI/2);
const south=new T.Group();south.name='南侧入口花纹墙';scene.add(south);
// Entry opening is at the lower-left corner of the plan.
function southSection(name,start,end,y=H/2,height=H){
  const map=floral.clone();map.repeat.set((end-start)/1.45,height/1.65);map.needsUpdate=true;
  const m=new T.Mesh(new T.PlaneGeometry(end-start,height),new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide}));
  m.name=name;m.position.set((start+end)/2,y,D/2);m.rotation.y=Math.PI;m.receiveShadow=true;south.add(m);
}
const entryStart=-2.45,entryEnd=-1.55,entryCenter=(entryStart+entryEnd)/2;
southSection('入口左侧墙',-W/2,entryStart);
southSection('入口右侧墙',entryEnd,W/2);
southSection('入口门楣',entryStart,entryEnd,2.53,.38);
for(const x of [entryStart,entryEnd])box('入户门框立柱',.07,2.32,.085,x,1.16,D/2,trim,south);
box('入户门框上沿',.87,.07,.09,entryCenter,2.31,D/2,trim,south);
box('入户门槛',.84,.025,.20,entryCenter,.012,D/2,material('#aa805f'),south);
const east=new T.Group();east.name='阳台一侧花纹墙';scene.add(east);
// The east wall retains the full-width balcony slider; there is no entry opening here.
function eastSection(name,start,end,y=H/2,height=H){
  const map=floral.clone();map.repeat.set((end-start)/1.45,height/1.65);map.needsUpdate=true;
  const m=new T.Mesh(new T.PlaneGeometry(end-start,height),new T.MeshStandardMaterial({map,roughness:1,side:T.DoubleSide}));
  m.name=name;m.position.set(W/2,y,(start+end)/2);m.rotation.y=-Math.PI/2;m.receiveShadow=true;east.add(m);
}
// The east wall is reserved for the four-panel balcony slider.
const sliderStart=-1.55,sliderEnd=1.55,sliderCenter=(sliderStart+sliderEnd)/2;
eastSection('阳台门北侧墙',-D/2,sliderStart);
eastSection('阳台门南侧墙',sliderEnd,D/2);
eastSection('阳台推拉门上方墙',sliderStart,sliderEnd,2.53,.38);
box('阳台推拉门立柱',.085,2.32,.07,W/2,1.16,sliderStart,trim,east);
box('阳台推拉门立柱',.085,2.32,.07,W/2,1.16,sliderEnd,trim,east);
box('阳台推拉门上沿',.09,.07,sliderEnd-sliderStart,W/2,2.31,sliderCenter,trim,east);
box('阳台推拉门下轨',.20,.025,sliderEnd-sliderStart,W/2,.012,sliderCenter,material('#aa805f'),east);
const northWall=wall('北侧花纹墙',W,H,0,H/2,-D/2,0);
const ceiling=box('主卧顶面',W,.055,D,0,H+.028,0,plaster);
box('北侧踢脚线',W,.095,.07,0,.055,-D/2+.05,trim);
box('入口左侧踢脚线',entryStart+W/2,.095,.07,(-W/2+entryStart)/2,.055,D/2-.05,trim);
box('入口右侧踢脚线',W/2-entryEnd,.095,.07,(entryEnd+W/2)/2,.055,D/2-.05,trim);
box('西侧踢脚线',.07,.095,D,-W/2+.04,.055,0,trim);
box('顶角线',.07,.07,D,-W/2+.025,H-.05,0,trim);
box('入口侧顶角线',W,.07,.07,0,H-.05,D/2-.025,trim);

const loader=new GLTFLoader(),models=new Map();let loaded=0;
async function put(file,name,x,y,z,yaw=0){
  const group=(await loader.loadAsync(`${import.meta.env.BASE_URL}assets/${file}.glb`)).scene;
  if(file==='children-curtains'){
    const cloths=[];
    group.traverse(o=>{if(o.isMesh&&o.geometry.getAttribute('color'))cloths.push(o);});
    for(const cloth of cloths){
      const panel=new T.Group(),offset=cloth.position.x;
      panel.name=offset<0?'curtain-left':'curtain-right';panel.position.x=offset;
      cloth.parent.add(panel);panel.add(cloth);cloth.position.x=0;
    }
  }
  group.name=name;group.position.set(x,y,z);group.rotation.y=yaw;
  group.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  scene.add(group);models.set(name,group);loaded++;host.dataset.loaded=String(loaded);
  loading.textContent=`正在布置主卧 ${loaded}/${TOTAL_MODELS}`;
  return group;
}
let curtainOpen=false,doorOpen=false,entryDoorOpen=false,warm=false;
async function assemble(){
  const errors=[];
  const tasks=[
    // Door panels face local +X, toward the bed on the right.
    ['wardrobe','后墙左侧四门衣柜',0,0,0,0],
    ['bed','木床与绿色床品',bedX,0,-.425,-Math.PI/2],
    ['nightstand','床头柜一',nightstandXs[0],0,-1.385],
    ['nightstand','床头柜二',nightstandXs[1],0,-1.385],
    ['slidingDoor','四扇玻璃推拉门',W/2-.035,0,sliderCenter,Math.PI/2],
    ['children-curtains','儿童房同款窗帘',W/2-.24,.04,sliderCenter,-Math.PI/2],
    ['desk','右下角木质书桌',1.65,0,1.28],
    ['mainDoor','木质入户大门',entryStart,0,D/2-.035],
  ];
  for(const [file,name,x,y,z,yaw=0] of tasks){try{
    const group=await put(file,name,x,y,z,yaw);
    if(file==='wardrobe'){
      const bounds=new T.Box3().setFromObject(group);
      group.position.x+=-W/2-bounds.min.x;
      group.position.z+=-D/2-bounds.min.z;
      group.updateMatrixWorld(true);
    }
    if(file==='children-curtains')group.scale.set((sliderEnd-sliderStart)/1.98,2.25/1.76,1);
  }catch(e){errors.push(name);console.error(name,e);}}
  const wardrobe=models.get('后墙左侧四门衣柜'),bed=models.get('木床与绿色床品');
  const leftStand=models.get('床头柜一'),rightStand=models.get('床头柜二');
  if(wardrobe&&bed&&leftStand&&rightStand){
    for(const group of [wardrobe,bed,leftStand,rightStand])group.updateWorldMatrix(true,true);
    const bedBounds=new T.Box3().setFromObject(bed),oldBounds=new T.Box3().setFromObject(wardrobe);
    wardrobe.scale.z*=(bedBounds.max.z-bedBounds.min.z)/(oldBounds.max.z-oldBounds.min.z);
    wardrobe.updateMatrixWorld(true);
    const resizedBounds=new T.Box3().setFromObject(wardrobe);
    wardrobe.position.z+=bedBounds.min.z-resizedBounds.min.z;
    wardrobe.updateMatrixWorld(true);
    // Touch the solid door face at tabletop height; handles sit above the nightstand.
    const faceBounds=new T.Box3().setFromObject(wardrobe.getObjectByName('柜门饰板1'));
    const topBounds=new T.Box3().setFromObject(leftStand.getObjectByName('床头柜台面'));
    const shiftX=faceBounds.max.x-topBounds.min.x;
    for(const group of [bed,leftStand,rightStand]){group.position.x+=shiftX;group.updateMatrixWorld(true);}
    nightstandXs.splice(0,2,leftStand.position.x,rightStand.position.x);
    bedsideLights.forEach((light,i)=>light.position.x=nightstandXs[i]);
    views.bedside.pos[0]+=shiftX;views.bedside.target[0]+=shiftX;
  }
  try{
    const source=(await loader.loadAsync(`${import.meta.env.BASE_URL}assets/pendant.glb`)).scene;
    const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const fit=new T.Group();fit.add(source);source.scale.set(.21/size.x,.63/size.y,.21/size.z);
    source.position.set(-center.x*source.scale.x,-bounds.min.y*source.scale.y,-center.z*source.scale.z);
    for(const [i,x] of nightstandXs.entries()){
      const lamp=fit.clone(true);lamp.name=`公卫2同款床头吊灯${i+1}`;lamp.position.set(x,1.86,-1.385);scene.add(lamp);models.set(lamp.name,lamp);
    }
    loaded++;host.dataset.loaded=String(loaded);loading.textContent=`正在布置主卧 ${loaded}/${TOTAL_MODELS}`;
  }catch(e){errors.push('床头灯');console.error('床头灯',e);}
  try{
    balconyScene=await createBalcony({assetBase:new URL('../../主卧阳台漫游/dist/assets/',window.location.href).href,onProgress(){
      loaded++;host.dataset.loaded=String(loaded);loading.textContent=`正在布置主卧 ${loaded}/${TOTAL_MODELS}`;
    }});
    balconyScene.root.position.set(W/2,0,sliderCenter);balconyScene.root.rotation.y=Math.PI/2;scene.add(balconyScene.root);
  }catch(e){errors.push('主卧阳台');console.error('主卧阳台',e);}
  host.dataset.ready=errors.length?'error':'true';
  loading.textContent=errors.length?'未能载入：'+errors.join('、'):'';
  loading.hidden=!errors.length;
  applyCurtain(1);applyDoor(1);
}
assemble();

function applyCurtain(t){
  const g=models.get('儿童房同款窗帘');if(!g)return;
  for(const [name,side] of [['curtain-left',-1],['curtain-right',1]]){
    const panel=g.getObjectByName(name);if(!panel)continue;
    const targetX=side*(curtainOpen?1.00:.70),targetScale=curtainOpen?.5:1;
    panel.position.x+=(targetX-panel.position.x)*t;
    panel.scale.x+=(targetScale-panel.scale.x)*t;
  }
}
function applyDoor(t){
  const g=models.get('四扇玻璃推拉门');if(!g)return;
  for(const [i,target] of [[1,doorOpen?-.78:-.385],[2,doorOpen?.78:.385]]){
    const panel=g.getObjectByName(`slider-${i}`);if(panel)panel.position.x+=(target-panel.position.x)*t;
  }
}
function applyEntryDoor(t){
  const g=models.get('木质入户大门');if(!g)return;
  const target=entryDoorOpen?Math.PI*.46:0;
  g.rotation.y+=(target-g.rotation.y)*t;
}

const views={
  overview:{pos:[0,7.50,2.10],target:[0,.10,0]},
  entry:{pos:[-.60,1.72,2.85],target:[.35,1.00,-.35]},
  bedside:{pos:[1.25,2.02,-.20],target:[-.30,.75,-.85]},
  wardrobe:{pos:[1.00,2.25,2.40],target:[-2.05,1.10,-.50]},
  balcony:{pos:[W/2+.14,1.80,sliderCenter-1.25],target:[W/2+.85,.68,sliderCenter+1.12]},
};
let viewName='overview',transition=null;
function setView(key,animate=true){
  if(key==='balcony'){
    curtainOpen=true;doorOpen=true;
    $('#curtain').textContent='合上窗帘';$('#curtain').setAttribute('aria-pressed','false');
    $('#door').textContent='合上玻璃门';$('#door').setAttribute('aria-pressed','true');
  }
  viewName=key;const v=views[key],pos=new T.Vector3(...v.pos),target=new T.Vector3(...v.target);
  if(animate)transition={pos,target};else{camera.position.copy(pos);controls.target.copy(target);controls.update();}
  document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===key);b.setAttribute('aria-pressed',b.dataset.view===key?'true':'false');});
  $('#view-label').textContent={overview:'主卧全景',entry:'从门口看',bedside:'床侧细节',wardrobe:'柜门朝床',balcony:'阳台方向'}[key];
}
setView('overview',false);
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#curtain').addEventListener('click',()=>{curtainOpen=!curtainOpen;$('#curtain').textContent=curtainOpen?'合上窗帘':'拉开窗帘';$('#curtain').setAttribute('aria-pressed',String(!curtainOpen));});
$('#door').addEventListener('click',()=>{doorOpen=!doorOpen;$('#door').textContent=doorOpen?'合上玻璃门':'推开玻璃门';$('#door').setAttribute('aria-pressed',String(doorOpen));});
$('#entry-door').addEventListener('click',()=>{entryDoorOpen=!entryDoorOpen;$('#entry-door').textContent=entryDoorOpen?'关上木门':'打开木门';$('#entry-door').setAttribute('aria-pressed',String(entryDoorOpen));});
$('#light').addEventListener('click',()=>{
  warm=!warm;$('#light').textContent=warm?'切换自然光':'点亮床头灯';$('#light').setAttribute('aria-pressed',String(warm));
  sun.intensity=warm?.35:2.7;ambient.intensity=warm?.85:2.1;
  bedsideLights.forEach(l=>l.intensity=warm?5:.45);scene.background.set(warm?'#52473e':'#e8e5dc');
  document.body.classList.toggle('warm',warm);
});
controls.addEventListener('start',()=>transition=null);
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(host);resize();
let last=performance.now();
function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;const blend=1-Math.exp(-dt*7);
  if(transition){camera.position.lerp(transition.pos,blend);controls.target.lerp(transition.target,blend);if(camera.position.distanceTo(transition.pos)<.004&&controls.target.distanceTo(transition.target)<.004)transition=null;}
  applyCurtain(blend);applyDoor(blend);applyEntryDoor(blend);controls.update();
  balconyScene?.update(dt,camera.position);
  south.visible=camera.position.z<D/2-.06;
  east.visible=camera.position.x<W/2-.08;west.visible=camera.position.x>-W/2+.08;
  ceiling.visible=camera.position.y<H-.04;northWall.visible=camera.position.z>-D/2-.20;
  renderer.render(scene,camera);
}
requestAnimationFrame(frame);
window.__bedroom={scene,models,views,setView,get curtainOpen(){return curtainOpen;},get doorOpen(){return doorOpen;},get entryDoorOpen(){return entryDoorOpen;},get warm(){return warm;}};
