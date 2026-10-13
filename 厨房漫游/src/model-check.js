import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const options = { 'white-hood-v2.glb': '白色侧吸油烟机', 'sink-upper-cabinet-v2.glb': '水槽上柜', 'two-burner-hob-v2.glb': '双头燃气灶', 'nonstick-pan-v2.glb': '不粘锅', 'pressure-cooker-v2.glb': '高压锅' };
const file = new URLSearchParams(location.search).get('asset') || Object.keys(options)[0];
if (!options[file]) throw Error('Unknown model');
const select = document.querySelector('select');
for (const [value, label] of Object.entries(options)) select.add(new Option(label, value, false, value === file));
select.onchange = () => { location.search = '?asset=' + select.value; };
const scene = new THREE.Scene(); scene.background = new THREE.Color('#e4e9ec');
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, .01, 100);
const renderer = new THREE.WebGLRenderer({antialias:true}); renderer.setSize(innerWidth, innerHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.querySelector('#view').append(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff, 0x777788, 2));
const pmrem = new THREE.PMREMGenerator(renderer); const room = new RoomEnvironment(); scene.environment = pmrem.fromScene(room).texture; room.dispose(); pmrem.dispose();
for (const [x,y,z,p] of [[3,4,5,2],[-3,2,0,1]]) { const light = new THREE.DirectionalLight(0xffffff,p); light.position.set(x,y,z); scene.add(light); }
const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
new GLTFLoader().load('/assets/' + file, gltf => {
  const model = gltf.scene; model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  console.log('MODEL_BOUNDS', file, JSON.stringify(size));
  model.position.sub(center); const root = new THREE.Group(); root.add(model); root.scale.setScalar(2 / Math.max(size.x,size.y,size.z)); scene.add(root);
  camera.position.set(2.5,1.8,3.1); controls.update(); document.querySelector('#label').textContent = options[file] + ' · 拖动旋转 / 滚轮缩放'; window.modelReady = true;
}, undefined, e => { document.querySelector('#label').textContent = '模型加载失败'; console.error(e); });
addEventListener('resize', () => { camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });
function frame() { requestAnimationFrame(frame); controls.update(); renderer.render(scene,camera); } frame();
