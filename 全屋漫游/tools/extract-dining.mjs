// A reproducible mechanical extraction; furniture builder text is not rewritten.
import fs from 'node:fs/promises';
import path from 'node:path';
const repo=path.resolve(import.meta.dirname,'../..');
const original=await fs.readFile(path.join(repo,'餐厅交互/room.js'),'utf8');
const take=(a,b)=>original.slice(original.indexOf(a),original.indexOf(b));
let body=take('const mat=', 'const loader=new GLTFLoader()');
body+=take('const loader=new GLTFLoader()', 'let loaded=0;');
body=body.replace(/const living=buildLiving[\s\S]*?const tableW=/,'const tableW=');
body=body.replace("loader.loadAsync('assets/'+encodeURIComponent(file))","loader.loadAsync(assetUrl('餐厅交互/assets/'+file))");
body=body.replace("new THREE.TextureLoader().load('../餐厅旁边的一幅画（在公卫2的外墙上）.jpg')","new THREE.TextureLoader().load(assetUrl('餐厅旁边的一幅画（在公卫2的外墙上）.jpg'))");
const alignment=take('// Align the shoe bench',"$('#status').textContent=failed.length?");
const head=`import * as THREE from 'three';\nimport {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';\nimport {buildArchitecture} from '../../../餐厅交互/architecture.js';\n// Generated from the ORIGINAL dining builder by tools/extract-dining.mjs.\nexport async function createDining({assetUrl,onProgress=()=>{},renderer}){\nconst scene=new THREE.Scene();\nscene.add(new THREE.HemisphereLight(0xfff8e9,0xc4aa8b,2.15));\nconst daylight=new THREE.DirectionalLight(0xfff4dc,1.5);daylight.position.set(-4,10,5);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);Object.assign(daylight.shadow.camera,{left:-9,right:9,top:12,bottom:-8,near:.1,far:30});daylight.shadow.bias=-.0005;daylight.shadow.normalBias=.025;scene.add(daylight);\n`;
const tail=`\nawait Promise.all(assets.map(async def=>{place((await getAsset(def.file)).clone(true),def);onProgress('餐厅 · '+def.file)}).concat(tabletopProps()));\n${alignment}\n// The old dining page includes empty architectural placeholders for the other rooms.\n// Keep the source nodes for audit; only their external context is omitted in assembly.\nconst externalContext=[];for(const o of architecture.root.children){const b=new THREE.Box3().setFromObject(o);if(o.name&&o.name!=='Dining'||b.max.x<LEFT-.15||b.min.x>RIGHT+.15||b.max.z<FRONT-.15||b.min.z>ENTRY+.25){o.userData.externalContext=true;externalContext.push(o);}}\nconst shell=architecture.root.children.filter(o=>!o.userData.externalContext&&o.geometry?.parameters?.height>.5);\nreturn {scene,native:{width:ROOM.width*SPACE,depth:ROOM.depth*SPACE,height:2.9},models:placed,shell,externalContext,entry:[(RIGHT-.45)*SPACE,0,ENTRY*SPACE],architecture,renderSettings:{exposure:1.15,environmentIntensity:0,fov:66},views:{overview:{position:[4.5,6,6],target:[0,.7,0]}},setPresentation({walking=false,fullWalls=false}={}){for(const o of externalContext)o.visible=false;for(const o of shell)o.visible=walking||fullWalls;},update(dt){architecture.door.update(dt)}};\n}\n`;
await fs.writeFile(path.join(repo,'全屋漫游/src/canonical/dining.js'),head+body+tail);
console.log('Extracted exact original dining geometry, UVs, cloth and model placements.');
