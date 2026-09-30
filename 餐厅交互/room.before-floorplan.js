import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const $=s=>document.querySelector(s);
const scene=new THREE.Scene();scene.background=new THREE.Color('#ede3ca');
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.04,45);camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('#scene').append(renderer.domElement);renderer.domElement.tabIndex=0;
// Fixed illumination only. No object labels or lighting controls.
scene.add(new THREE.HemisphereLight(0xfff8e9,0xc4aa8b,2.15));
const daylight=new THREE.DirectionalLight(0xfff4dc,1.5);daylight.position.set(-1,5,3);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);Object.assign(daylight.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:12});daylight.shadow.bias=-.0005;daylight.shadow.normalBias=.025;scene.add(daylight);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
const wood=mat('#60351d'),trim=mat('#ebdec0'),wall=mat('#efe4bf');
function box(w,h,d,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
let seed=89;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// Terracotta tile with corner ornaments from the room photograph.
const tile=canvasTexture(1024,(c,n)=>{c.fillStyle='#b99a72';c.fillRect(0,0,n,n);const g=c.createLinearGradient(0,0,n,n);g.addColorStop(0,'#b56635');g.addColorStop(.55,'#a45229');g.addColorStop(1,'#c47a43');c.fillStyle=g;c.fillRect(5,5,n-10,n-10);for(let i=0;i<42000;i++){c.fillStyle=random()>.5?'rgba(255,223,153,.035)':'rgba(56,20,4,.025)';c.fillRect(random()*n,random()*n,random()*9+1,random()*8+1)}c.strokeStyle='#d28d52';c.lineWidth=3;c.strokeRect(10,10,n-20,n-20);for(const x of [0,n])for(const y of [0,n]){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#e0c39a';c.fillRect(-62,-62,124,124);c.strokeStyle='#755735';c.lineWidth=6;c.strokeRect(-51,-51,102,102);c.lineWidth=3;c.strokeRect(-39,-39,78,78);c.fillStyle='#876744';for(let a=0;a<8;a++){c.save();c.rotate(a*Math.PI/4);c.beginPath();c.ellipse(0,19,6,13,0,0,Math.PI*2);c.fill();c.restore()}c.restore()}});
tile.wrapS=tile.wrapT=THREE.RepeatWrapping;
// Rotate in metric floor coordinates, so 45-degree tiles stay square in this rectangular room.
const floorGeometry=new THREE.PlaneGeometry(4.8,7.5);
const floorPositions=floorGeometry.attributes.position,floorUV=floorGeometry.attributes.uv;
for(let i=0;i<floorPositions.count;i++){const x=floorPositions.getX(i),y=floorPositions.getY(i);floorUV.setXY(i,(x-y)*Math.SQRT1_2/.6,(x+y)*Math.SQRT1_2/.6)}
const floor=new THREE.Mesh(floorGeometry,mat('#ffffff',{map:tile,roughness:.7}));floor.rotation.x=-Math.PI/2;floor.position.set(0,0,-.45);floor.receiveShadow=true;scene.add(floor);
const plaster=canvasTexture(256,c=>{c.fillStyle='#f0e5c4';c.fillRect(0,0,256,256);for(let i=0;i<16000;i++){c.fillStyle=random()>.5?'#fff9e109':'#8f774c09';c.fillRect(random()*256,random()*256,1,1)}});plaster.wrapS=plaster.wrapT=THREE.RepeatWrapping;plaster.repeat.set(6,4);wall.map=plaster;
// Left/right are defined by the entrance view, looking toward negative Z.
// The entrance photo shows a broad opening ahead, rather than a closed dining-room wall.
box(1.02,2.9,.22,wall,-1.97,1.45,-4.28);box(.16,2.9,7.5,wall,2.48,1.45,-.45);
box(3.94,.34,.22,wall,.51,2.73,-4.28);
const archCorner=new THREE.Shape();archCorner.moveTo(-1.46,2.56);archCorner.lineTo(-.80,2.56);archCorner.quadraticCurveTo(-1.46,2.56,-1.46,1.93);archCorner.closePath();
const arch=new THREE.Mesh(new THREE.ExtrudeGeometry(archCorner,{depth:.22,bevelEnabled:false,curveSegments:24}),wall);arch.position.z=-4.39;arch.castShadow=arch.receiveShadow=true;scene.add(arch);
// A neutral continuation keeps the opening open; living-room furniture is outside this edit.
const continuationGeometry=new THREE.PlaneGeometry(4.8,3.2);const cp=continuationGeometry.attributes.position,cu=continuationGeometry.attributes.uv;
for(let i=0;i<cp.count;i++){const x=cp.getX(i),y=cp.getY(i)+5.35;cu.setXY(i,(x-y)*Math.SQRT1_2/.6,(x+y)*Math.SQRT1_2/.6)}
const continuation=new THREE.Mesh(continuationGeometry,floor.material);continuation.rotation.x=-Math.PI/2;continuation.position.set(0,0,-5.8);continuation.receiveShadow=true;scene.add(continuation);
box(.16,2.9,3.2,wall,-2.48,1.45,-5.8);box(.16,2.9,3.2,wall,2.48,1.45,-5.8);box(4.96,2.9,.16,wall,0,1.45,-7.48);box(4.96,.12,3.2,mat('#f7efd9'),0,2.96,-5.8);
// User's plan: entrance on the bottom-right edge, cabinet and bench on the bottom-left.
box(.16,2.9,7.5,wall,-2.48,1.45,-.45);
box(3.38,2.9,.16,wall,-.79,1.45,3.38);box(.38,2.9,.16,wall,2.29,1.45,3.38);box(1.2,.6,.16,wall,1.5,2.6,3.38);box(4.96,.12,7.7,mat('#f7efd9'),0,2.96,-.45);
const doorWood=mat('#62432e');box(.075,2.34,.22,doorWood,.88,1.17,3.33);box(.075,2.34,.22,doorWood,2.12,1.17,3.33);box(1.31,.09,.22,doorWood,1.5,2.34,3.33);box(1.16,2.25,.045,doorWood,1.5,1.125,3.42);
for(const y of [.08,2.79]){const h=y<1?.12:.08;box(y<1?.94:4.8,h,.05,trim,y<1?-1.93:0,y,-4.14);box(.05,h,7.5,trim,2.38,y,-.45);box(.05,h,7.5,trim,-2.38,y,-.45)}
const skirting=mat('#8c613e');box(.94,.035,.04,skirting,-1.93,.015,-4.14);box(.04,.035,7.5,skirting,-2.36,.015,-.45);box(.04,.035,7.5,skirting,2.36,.015,-.45);

const loader=new GLTFLoader(),cache=new Map(),obstacles=[],placed=new Map(),solidFurniture=[];
const tableW=1.75,tableD=1.17,tableH=.77;
const tableCenter={x:-2.4+(tableW+.018)/2,z:-.85};
const tableShift=-tableCenter.x-.32,tableShiftZ=tableCenter.z-.12;
function getAsset(file){if(!cache.has(file))cache.set(file,loader.loadAsync('assets/'+encodeURIComponent(file)).then(g=>g.scene));return cache.get(file)}
function prepare(root){root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}
function place(root,{key,height,width,pos,yaw=0,collide=false,wallSide}){const group=new THREE.Group();group.add(root);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3());root.scale.setScalar(height?height/s.y:width/s.x);b.setFromObject(root);const c=b.getCenter(new THREE.Vector3());root.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));group.rotation.y=yaw;group.position.set(...pos);prepare(root);scene.add(group);group.updateMatrixWorld(true);b.setFromObject(group);if(wallSide==='entry')group.position.z+=3.3-b.max.z;if(wallSide==='back')group.position.z+=-4.2-b.min.z;if(wallSide==='left')group.position.x+=-2.4-b.min.x;if(wallSide==='right')group.position.x+=2.4-b.max.x;group.updateMatrixWorld(true);if(key)placed.set(key,group);if(collide)solidFurniture.push(group);return group;}
const assets=[
{key:'cabinet',file:'餐边柜_已核对.glb',height:2.12,pos:[-1.5,0,2.95],yaw:Math.PI,wallSide:'entry',collide:true},
{key:'bench',file:'鞋柜凳.glb',width:1.03,pos:[0,0,3.02],yaw:Math.PI,wallSide:'entry',collide:true},
{file:'餐厅窗户.glb',height:1.08,pos:[-2.24,1.48,tableCenter.z],yaw:Math.PI/2,wallSide:'left'},
{file:'花卉油画.glb',height:.62,pos:[2.32,1.55,tableCenter.z],yaw:-Math.PI/2,wallSide:'right'},
{file:'餐厅挂钟.glb',height:.57,pos:[-2.30,1.75,-3.67],yaw:Math.PI/2,wallSide:'left'},
{key:'frame',file:'餐厅相框.glb',height:.4,pos:[0,1.73,3.22],yaw:Math.PI,wallSide:'entry'},
{file:'餐厅吊扇.glb',width:1.18,pos:[-.65,2.32,-.85]},
...[
[-.20,0,-.91,0],[.73,0,-.91,0],[-.20,0,1.17,Math.PI],[.73,0,1.17,Math.PI],[-1.05,0,.12,Math.PI/2]
].map(([x,y,z,yaw])=>({file:'温莎椅_单体.glb',height:1.06,pos:[-(x+tableShift),y,z+tableShiftZ],yaw:-yaw,collide:true}))
];
// Build a separate table, excluding the fused chairs in the generated assets.
const tableGroup=new THREE.Group();tableGroup.position.set(tableCenter.x,0,tableCenter.z);scene.add(tableGroup);
box(tableW,.055,tableD,wood,0,tableH-.035,0,tableGroup);box(tableW-.10,.13,tableD-.10,wood,0,tableH-.12,0,tableGroup);
for(const x of [-.72,.72])for(const z of [-.44,.44])box(.065,.71,.065,wood,x,.355,z,tableGroup);
const plaid=canvasTexture(512,(c,n)=>{c.fillStyle='#d6bc84';c.fillRect(0,0,n,n);const palette=['#364557','#c7a36b','#994331','#e2d3aa'];for(let i=0;i<8;i++){c.fillStyle=palette[i%4];c.globalAlpha=.78;c.fillRect(i*64,0,37,n);c.fillRect(0,i*64,n,37)}c.globalAlpha=.22;c.strokeStyle='#f6e8c5';for(let i=0;i<n;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i,n);c.moveTo(0,i);c.lineTo(n,i);c.stroke()}c.globalAlpha=1});
plaid.wrapS=plaid.wrapT=THREE.RepeatWrapping;plaid.repeat.set(2.5,1.7);const cloth=new THREE.MeshStandardMaterial({map:plaid,roughness:1,side:THREE.DoubleSide});
box(tableW+.018,.012,tableD+.018,cloth,0,tableH,0,tableGroup);
const navy=mat('#424654',{side:THREE.DoubleSide});
function drape(length,edge,axis){const seg=100;for(const band of [0,1]){const vertices=[],uv=[],indices=[];for(let row=0;row<2;row++)for(let i=0;i<=seg;i++){const t=i/seg,along=(t-.5)*length;const y=band===0?(row?tableH-.20:tableH):(row?tableH-.31:tableH-.20);const fold=(Math.sin(t*Math.PI*32)*.014+Math.sin(t*Math.PI*64)*.003)*(row+1)/2;const outward=axis==='z'&&edge<0?Math.max(edge-fold,-tableW/2-.009):edge+Math.sign(edge)*fold;vertices.push(axis==='x'?along:outward,y-(row?.01*Math.cos(t*55):0),axis==='x'?outward:along);uv.push(t,band===0?row*.35:row)}for(let i=0;i<seg;i++){const a=i,b=i+seg+1;indices.push(a,b,a+1,b,b+1,a+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,band===0?cloth:navy);m.castShadow=m.receiveShadow=true;tableGroup.add(m)}}
drape(tableW,tableD/2,'x');drape(tableW,-tableD/2,'x');drape(tableD,tableW/2,'z');drape(tableD,-tableW/2,'z');obstacles.push({minX:tableCenter.x-tableW/2,maxX:tableCenter.x+tableW/2,minZ:tableCenter.z-tableD/2,maxZ:tableCenter.z+tableD/2});
// Crop the interior tabletop props from a textured asset; omit all chair geometry.
async function tabletopProps(){const source=await getAsset('餐桌_独立彩色.glb');const group=new THREE.Group();source.traverse(m=>{if(!m.isMesh)return;const original=m.geometry,geo=original.index?original.toNonIndexed():original.clone();const pos=geo.attributes.position;const keep=[];for(let i=0;i<pos.count;i+=3){let ok=true;for(let j=0;j<3;j++){const n=i+j;if(pos.getY(n)<-.08||Math.abs(pos.getX(n))>.51||Math.abs(pos.getZ(n))>.54){ok=false;break}}if(ok)keep.push(i,i+1,i+2)}const filtered=new THREE.BufferGeometry();for(const [name,a]of Object.entries(geo.attributes)){const out=new Float32Array(keep.length*a.itemSize);keep.forEach((n,i)=>{for(let k=0;k<a.itemSize;k++)out[i*a.itemSize+k]=a.array[n*a.itemSize+k]});filtered.setAttribute(name,new THREE.BufferAttribute(out,a.itemSize))}filtered.computeBoundingSphere();const mesh=new THREE.Mesh(filtered,m.material);mesh.position.y=.08;group.add(mesh);geo.dispose()});group.scale.setScalar(.86);group.position.set(tableCenter.x,tableH+.006,tableCenter.z);prepare(group);scene.add(group)}

let loaded=0;const total=assets.length+1,failed=[];
function progress(){loaded++;$('#percent').textContent=Math.round(loaded/total*100)+'%';$('#progress').style.width=loaded/total*100+'%';$('#status').textContent='布置家具 '+loaded+' / '+total;}
const ready=Promise.all(assets.map(async def=>{try{place((await getAsset(def.file)).clone(true),def)}catch(e){failed.push(def.file);console.error(def.file,e)}finally{progress()}}).concat(tabletopProps().catch(e=>{failed.push('桌面摆件');console.error(e)}).finally(progress)));
let active=false,yaw=0,pitch=0,drag=null;const keys=new Set(),moves=new Set();
function reset(){camera.position.set(1.5,1.60,2.95);camera.lookAt(new THREE.Vector3(-.35,1.08,-1.65));yaw=camera.rotation.y;pitch=camera.rotation.x;keys.clear();moves.clear()}
reset();
function start(){active=true;$('#welcome').classList.add('exiting');$('#crosshair').hidden=false;renderer.domElement.focus();$('#guide').textContent='拖动环顾 · W A S D / 方向键行走 · Esc 暂停'}
function pause(){active=false;keys.clear();moves.clear();drag=null;$('#crosshair').hidden=true;$('#welcome').classList.remove('exiting');$('#enter').innerHTML='继续参观 <span>→</span>';$('#guide').textContent='参观已暂停 · 点击继续参观'}
$('#enter').onclick=start;$('#home').onclick=()=>{reset();if(!active&&!$('#enter').disabled)start()};
$('#help').onclick=()=>{active=false;keys.clear();moves.clear();$('#instructions').showModal()};function closeHelp(){ $('#instructions').close();if(!$('#enter').disabled)start() }$('#closeHelp').onclick=closeHelp;$('#resume').onclick=closeHelp;$('#instructions').addEventListener('cancel',()=>{if(!$('#enter').disabled)start()});
renderer.domElement.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;drag={x:e.clientX,y:e.clientY,id:e.pointerId};renderer.domElement.setPointerCapture(e.pointerId)});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||!active)return;yaw-=(e.clientX-drag.x)*.003;pitch=THREE.MathUtils.clamp(pitch-(e.clientY-drag.y)*.003,-1.15,1.15);drag.x=e.clientX;drag.y=e.clientY});
for(const event of ['pointerup','pointercancel','lostpointercapture'])renderer.domElement.addEventListener(event,()=>drag=null);
const movementKeys=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
addEventListener('keydown',e=>{if(e.code==='Escape'){if(!$('#instructions').open)pause();return}if(e.code==='KeyR'&&active)reset();if(active&&movementKeys.includes(e.code)){e.preventDefault();keys.add(e.code)}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();moves.clear();drag=null});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();moves.clear();drag=null}});
document.querySelectorAll('[data-move]').forEach(button=>{button.addEventListener('pointerdown',e=>{if(!active)return;e.preventDefault();button.setPointerCapture(e.pointerId);moves.add(button.dataset.move)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>moves.delete(button.dataset.move))});
function blocked(x,z){const radius=.16;if(x< -2.4+radius||x>2.4-radius||z< -7.4+radius||z>3.3-radius)return true;if(z>-4.39-radius&&z<-4.17+radius&&x<-1.46+radius)return true;return obstacles.some(b=>x>b.minX-radius&&x<b.maxX+radius&&z>b.minZ-radius&&z<b.maxZ+radius)}
const clock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.045);if(active){let f=Number(keys.has('KeyW')||keys.has('ArrowUp')||moves.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||moves.has('back'));let r=Number(keys.has('KeyD')||keys.has('ArrowRight')||moves.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||moves.has('left'));const norm=Math.hypot(f,r)||1;f/=norm;r/=norm;const speed=1.15*dt,dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;if(!blocked(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(!blocked(camera.position.x,camera.position.z+dz))camera.position.z+=dz}camera.rotation.set(pitch,yaw,0,'YXZ');renderer.render(scene,camera)});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('#status').textContent='图形连接中断，请刷新页面'});
ready.then(()=>{
// Align the shoe bench directly against the cabinet after both asynchronous assets exist.
const cabinet=placed.get('cabinet'),bench=placed.get('bench');
if(cabinet&&bench){let cabinetBox=new THREE.Box3().setFromObject(cabinet);cabinet.position.x+=-2.4-cabinetBox.min.x;cabinet.updateMatrixWorld(true);cabinetBox.setFromObject(cabinet);const benchBox=new THREE.Box3().setFromObject(bench);bench.position.x+=cabinetBox.max.x-benchBox.min.x;bench.updateMatrixWorld(true);const frame=placed.get('frame');if(frame)frame.position.x=bench.position.x}
for(const group of solidFurniture){const b=new THREE.Box3().setFromObject(group);obstacles.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z})}
$('#status').textContent=failed.length?'部分模型未载入':'空间已就绪';$('#enter').disabled=false;$('#enter').innerHTML='进入参观 <span>→</span>';if(failed.length){$('#error').hidden=false;$('#error').textContent='未载入：'+[...new Set(failed)].join('、')+'。请刷新重试。'}});





