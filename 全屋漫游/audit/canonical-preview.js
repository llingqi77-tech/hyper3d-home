import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
const id=new URLSearchParams(location.search).get('room')||'kitchen';
const factories=id==='kitchen' ? await import('../src/canonical/kitchen.js?v=20261023d') : id==='dining' ? await import('../src/canonical/dining.js?v=20261023f') : await import('../src/canonical/index.js');
const names={kitchen:'Kitchen',dining:'Dining',children:'Children',master:'Master',junction:'Junction',bathroom1:'Bathroom1',bathroom2:'Bathroom2',guest:'Guest',living:'Living',balcony:'Balcony'};
const state=document.querySelector('#native-state');
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;document.querySelector('#scene').append(renderer.domElement);
try{
 const room=await factories['create'+names[id]]({assetUrl:p=>new URL('/'+p,location.origin).href,renderer,onProgress:p=>{state.textContent=p;}});
 const scene=room.scene;scene.background??=new T.Color('#d9d6cb');const settings=room.renderSettings||{};renderer.toneMappingExposure=settings.exposure??1;
 if(!scene.environment&&settings.environment!==false&&(settings.environmentIntensity||settings.environment===true)){const p=new T.PMREMGenerator(renderer),e=new RoomEnvironment();scene.environment=p.fromScene(e).texture;e.dispose();p.dispose();}scene.environmentIntensity=settings.environmentIntensity??scene.environmentIntensity;
 const view=room.views.overview,position=view.pos||view.position||view.camera;
 const camera=new T.PerspectiveCamera(settings.camera?.fov||room.cameraSettings?.fov||settings.fov||44,innerWidth/innerHeight,.03,100);camera.position.set(...position);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(...view.target);controls.update();
 function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
 // Audit must observe the returned room, not temporary PMREM helper scenes.
 document.querySelector('#capture-audit').onclick=async()=>{const result=await window.homeAudit.capture(scene);result.renderer=[{toneMapping:renderer.toneMapping,exposure:renderer.toneMappingExposure,colorSpace:renderer.outputColorSpace}];const out=document.querySelector('#audit-report');out.textContent=JSON.stringify(result);out.dataset.ready='true';document.querySelector('#audit-status').textContent=`完成：${result.meshes.length} meshes / ${result.lights.length} lights`;};
 room.update?.(0,camera.position);state.dataset.shell=String(room.shell?.length??-1);state.dataset.visibleShell=String(room.shell?.filter(o=>o.visible).length??-1);state.dataset.updateSource=String(room.update).slice(0,180);
 let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;room.update?.(dt,camera.position);renderer.render(scene,camera);}requestAnimationFrame(frame);state.textContent=id+' 原尺寸 · 已载入';state.dataset.ready='true';
}catch(e){state.textContent=e.stack;console.error(e);}
