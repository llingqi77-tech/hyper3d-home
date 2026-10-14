import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { assets } from './assets.js';
import { getModel,prepareModel } from './model.js';
const host=document.querySelector('#host'),select=document.querySelector('#asset'),status=document.querySelector('#status');
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#eee8dd');scene.add(new THREE.HemisphereLight('#ffffff','#a4988a',2.5));const key=new THREE.DirectionalLight('#fff4e8',3);key.position.set(2,4,5);scene.add(key);const fill=new THREE.DirectionalLight('#d3e6ff',1.3);fill.position.set(-3,2,-1);scene.add(fill);
const camera=new THREE.PerspectiveCamera(38,1,.01,50),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;let group=null,version=0;
assets.forEach(a=>{const o=document.createElement('option');o.value=a.id;o.textContent=a.name;select.append(o);});
async function show(id){const turn=++version,a=assets.find(a=>a.id===id)||assets[0];select.value=a.id;document.body.dataset.ready='false';status.textContent='载入中';try{const gltf=await getModel(a.file||`${a.id}.glb`);if(turn!==version)return;if(group)scene.remove(group);group=prepareModel(gltf.scene,{...a,pos:[0,0,0],yaw:0});scene.add(group);const d=Math.max(...a.size);controls.target.set(0,a.size[1]/2,0);camera.position.set(d*1.4,a.size[1]/2+d*.85,d*2.2);controls.update();status.textContent='已载入';document.body.dataset.ready='true';window.__gallery={group,scene,camera,controls,asset:a};}catch(e){status.textContent='加载失败';document.body.dataset.ready='error';console.error(e);}}
select.addEventListener('change',()=>{history.replaceState(null,'',`?asset=${select.value}`);show(select.value);});
function resize(){renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();}new ResizeObserver(resize).observe(host);resize();show(new URLSearchParams(location.search).get('asset')||'cabinet');window.showModel=show;
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera);}frame();
