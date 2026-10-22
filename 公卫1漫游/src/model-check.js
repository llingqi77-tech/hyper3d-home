import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const file=new URLSearchParams(location.search).get('asset')||'cabinet-isolated-v3.glb';
if(!/^[a-z0-9-]+\.glb$/.test(file))throw Error('Invalid asset');
const scene=new THREE.Scene(); scene.background=new THREE.Color('#e4e9ec');
const camera=new THREE.PerspectiveCamera(38,innerWidth/innerHeight,.01,100);
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;document.querySelector('#view').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x777788,2));
for(const [x,y,z,p] of [[3,4,5,2],[-3,2,0,1]]){const light=new THREE.DirectionalLight(0xffffff,p);light.position.set(x,y,z);scene.add(light)}
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;
new GLTFLoader().load(import.meta.env.BASE_URL+'assets/'+file,gltf=>{const model=gltf.scene;model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());model.position.sub(center);const root=new THREE.Group();root.add(model);root.scale.setScalar(2/Math.max(size.x,size.y,size.z));scene.add(root);camera.position.set(2.5,1.8,3.1);controls.target.set(0,0,0);controls.update();document.querySelector('#label').textContent=(file.includes('cabinet')?'黄色格栅浴室柜':file.includes('basin')?'蓝白花纹台盆':file.includes('shower-black')?'黑色顶喷与手持花洒':file)+' · 拖动旋转 / 滚轮缩放';window.modelReady=true;},undefined,e=>{document.querySelector('#label').textContent='模型加载失败';console.error(e)});
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,camera)}frame();

