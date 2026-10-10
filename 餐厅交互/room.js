import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildArchitecture} from './architecture.js?v=8';
import {createNavigation} from './navigation.js?v=8';
import {buildLiving} from './living.js';
const $=s=>document.querySelector(s);
const scene=new THREE.Scene();scene.background=new THREE.Color('#e6e2d8');
const camera=new THREE.PerspectiveCamera(66,innerWidth/innerHeight,.04,45);camera.rotation.order='YXZ';
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$('#scene').append(renderer.domElement);renderer.domElement.tabIndex=0;
// Fixed illumination only. No object labels or lighting controls.
scene.add(new THREE.HemisphereLight(0xfff8e9,0xc4aa8b,2.15));
const daylight=new THREE.DirectionalLight(0xfff4dc,1.5);daylight.position.set(-4,10,5);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);Object.assign(daylight.shadow.camera,{left:-9,right:9,top:12,bottom:-8,near:.1,far:30});daylight.shadow.bias=-.0005;daylight.shadow.normalBias=.025;scene.add(daylight);
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
const wood=mat('#60351d'),trim=mat('#ebdec0'),wall=mat('#efe4bf');
// Floor plan: dining depth 325 cm; 240 cm wall beside the entrance plus ~90 cm entry lane.
const ROOM={width:3.30,depth:3.25,height:2.9,livingDepth:3.75};
const LEFT=-ROOM.width/2,RIGHT=ROOM.width/2,ENTRY=ROOM.depth/2,FRONT=-ROOM.depth/2;
const LIVING_END=FRONT-ROOM.livingDepth,PORTAL_LEFT=LEFT+.30;
function box(w,h,d,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
let seed=89;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
// Terracotta tile with corner ornaments from the room photograph.
const tile=canvasTexture(1024,(c,n)=>{c.fillStyle='#b99a72';c.fillRect(0,0,n,n);const g=c.createLinearGradient(0,0,n,n);g.addColorStop(0,'#b56635');g.addColorStop(.55,'#a45229');g.addColorStop(1,'#c47a43');c.fillStyle=g;c.fillRect(5,5,n-10,n-10);for(let i=0;i<42000;i++){c.fillStyle=random()>.5?'rgba(255,223,153,.035)':'rgba(56,20,4,.025)';c.fillRect(random()*n,random()*n,random()*9+1,random()*8+1)}c.strokeStyle='#d28d52';c.lineWidth=3;c.strokeRect(10,10,n-20,n-20);for(const x of [0,n])for(const y of [0,n]){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#e0c39a';c.fillRect(-62,-62,124,124);c.strokeStyle='#755735';c.lineWidth=6;c.strokeRect(-51,-51,102,102);c.lineWidth=3;c.strokeRect(-39,-39,78,78);c.fillStyle='#876744';for(let a=0;a<8;a++){c.save();c.rotate(a*Math.PI/4);c.beginPath();c.ellipse(0,19,6,13,0,0,Math.PI*2);c.fill();c.restore()}c.restore()}});
tile.wrapS=tile.wrapT=THREE.RepeatWrapping;
const architecture=buildArchitecture({scene,wall,trim,tile,box,mat,canvasTexture,LEFT,RIGHT,ENTRY,FRONT});

const loader=new GLTFLoader(),cache=new Map(),obstacles=[],placed=new Map(),solidFurniture=[];
const living=buildLiving({scene,box,obstacles});
const tableW=1.55,tableD=.90,tableH=.77;
const tableCenter={x:LEFT+(tableW+.018)/2,z:-.15};
function getAsset(file){if(!cache.has(file))cache.set(file,loader.loadAsync('assets/'+encodeURIComponent(file)).then(g=>g.scene));return cache.get(file)}
function prepare(root){root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}
function place(root,{key,height,width,pos,yaw=0,collide=false,wallSide}){const group=new THREE.Group();group.add(root);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3());root.scale.setScalar(height?height/s.y:width/s.x);b.setFromObject(root);const c=b.getCenter(new THREE.Vector3());root.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));group.rotation.y=yaw;group.position.set(...pos);prepare(root);scene.add(group);group.updateMatrixWorld(true);b.setFromObject(group);if(wallSide==='entry')group.position.z+=ENTRY-b.max.z;if(wallSide==='back')group.position.z+=FRONT-b.min.z;if(wallSide==='left')group.position.x+=LEFT-b.min.x;if(wallSide==='right')group.position.x+=RIGHT-b.max.x;group.updateMatrixWorld(true);if(key)placed.set(key,group);if(collide)solidFurniture.push(group);return group;}
const assets=[
{key:'cabinet',file:'餐边柜_已核对.glb',width:1.50,pos:[LEFT+.75,0,ENTRY-.3],yaw:Math.PI,wallSide:'entry',collide:true},
{key:'bench',file:'鞋柜凳.glb',width:.90,pos:[.3,0,ENTRY-.25],yaw:Math.PI,wallSide:'entry',collide:true},
{key:'diningWindow',file:'餐厅窗户.glb',height:.864,pos:[LEFT+.16,1.588,tableCenter.z],yaw:Math.PI/2,wallSide:'left'},
{key:'diningArt',file:'花卉油画.glb',height:.62,pos:[RIGHT-.08,1.55,-.98],yaw:-Math.PI/2,wallSide:'right'},
{key:'clock',file:'餐厅挂钟.glb',height:.57,pos:[LEFT+.23,1.75,FRONT+.35],yaw:0},
{key:'frame',file:'餐厅相框.glb',height:.4,pos:[.3,1.73,ENTRY-.08],yaw:Math.PI,wallSide:'entry'},
{file:'餐厅吊扇.glb',width:1.18,pos:[-.45,2.32,tableCenter.z]},
...[
[-.40,-.66,0],[.40,-.66,0],[-.40,.66,Math.PI],[.40,.66,Math.PI],[tableW/2+.45,0,-Math.PI/2]
].map(([x,z,yaw],i)=>({key:'chair'+i,file:'温莎椅_单体.glb',height:1.0,pos:[tableCenter.x+x,0,tableCenter.z+z],yaw,collide:true}))
];
// Build a separate table, excluding the fused chairs in the generated assets.
const tableGroup=new THREE.Group();tableGroup.position.set(tableCenter.x,0,tableCenter.z);scene.add(tableGroup);
box(tableW,.055,tableD,wood,0,tableH-.035,0,tableGroup);box(tableW-.10,.13,tableD-.10,wood,0,tableH-.12,0,tableGroup);
for(const x of [-(tableW/2-.13),tableW/2-.13])for(const z of [-(tableD/2-.11),tableD/2-.11])box(.065,.71,.065,wood,x,.355,z,tableGroup);
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
const navigation=createNavigation({camera,renderer,architecture,obstacles,RIGHT,ENTRY});
const renderClock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(renderClock.getDelta(),.045);navigation.update(dt);living.ceiling.visible=navigation.mode!=='plan';renderer.render(scene,navigation.camera)});
const pickRoots=[],tour=[],raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
let tourIndex=-1,press=null;
function addFeature(id,root,name,photo,description,eye,target){
  if(!root)return;
  root.userData.feature=id;pickRoots.push(root);tour.push({id,name,photo,description,eye,target});
}
function showFeature(item){
  const detail=$('#detail'),img=$('#detailImage');
  img.src='../'+encodeURIComponent(item.photo);img.alt=item.name+'的实景参考';
  $('#detailName').textContent=item.name;$('#detailCopy').textContent=item.description;
  detail.hidden=false;
  navigation.focus(item.eye,item.target);
}
function setupTour(){
  addFeature('table',tableGroup,'餐桌','餐桌.jpg','餐厅原有的实木餐桌、格纹桌布和 GLB 桌面物件保持原位。',[.65,1.75,.25],[tableCenter.x,.78,tableCenter.z]);
  addFeature('cabinet',placed.get('cabinet'),'餐边柜','餐边柜.jpg','保留已经核对的餐边柜 GLB 模型。',[.24,1.62,.35],[-.9,1.28,1.30]);
  addFeature('chair',placed.get('chair0'),'餐椅','椅子.jpg','餐桌旁保留原有的温莎椅单体模型。',[.53,1.45,-.36],[tableCenter.x-.4,.62,-.81]);
  addFeature('clock',placed.get('clock'),'餐厅挂钟','餐厅的时钟.jpg','餐厅与客厅过渡处的双面复古时钟。',[-.25,1.68,-.65],[-1.42,1.75,-1.26]);
  const livingStops=[
    ['餐客厅拱门','进门视角（看餐厅和客厅）.jpg','拱门连接南侧餐厅与北侧客厅，门洞可以步行穿过。',[.58,1.6,-.45],[0,1.75,-1.625]],
    ['西侧碎花沙发','沙发.jpg','木框与碎花布艺沙发按照布局图放在客厅西侧。',[-.75,1.48,-3.05],[-2.34,.77,-3.75]],
    ['南侧碎花沙发','沙发.jpg','第二组沙发位于客厅南侧，与茶几形成会客区。',[.62,1.48,-3.35],[-.58,.79,-2.31]],
    ['客厅茶几','客厅的另一个视角.jpg','深红棕木茶几保留日常杯具和书册细节。',[.54,1.49,-3.48],[-.68,.58,-3.58]],
    ['电视墙','进门视角（看餐厅和客厅）.jpg','电视按照布局图移至客厅北端。',[.52,1.58,-3.82],[-.46,1.43,-5.16]],
    ['绿色书桌与拱形壁龛','客厅沙发边的桌子.jpg','浅绿书桌与拱形书架取自客厅实景照片。',[-.72,1.52,-2.82],[-2.42,1.35,-2.22]],
    ['西侧窗与阳台','客厅的另一个视角.jpg','客厅西侧保持面向阳台的窗与帘。',[-1.77,1.6,-4.04],[-3.36,1.53,-4.04]],
    ['客厅的画','客厅的画.jpg','墙面画作直接使用实景照片作贴图。',[.18,1.66,-3.92],[1.48,1.72,-3.95]],
    ['客厅吊扇','客厅风扇.jpg','客厅吊扇依据单独提供的实物照片建模。',[-.68,1.56,-3.35],[-.70,2.65,-3.50]]
  ];
  for(const [name,photo,description,eye,target] of livingStops)
    addFeature(name,living.objects.get(name),name,photo,description,eye,target);
}
renderer.domElement.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>6){press=null;return}
  press=null;
  pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
  raycaster.setFromCamera(pointer,navigation.camera);
  const hit=raycaster.intersectObjects(pickRoots,true)[0];
  if(hit){let node=hit.object;while(node&&!node.userData.feature)node=node.parent;
    const item=tour.find(entry=>entry.id===node?.userData.feature);
    if(item){showFeature(item);return}
  }
  const floor=raycaster.intersectObjects(architecture.root.children.filter(child=>child.name==='Dining'||child.name==='Living room with bay'))[0];
  if(floor){
    if(navigation.mode==='plan'){
      const dining=floor.object.name==='Dining';
      navigation.focus(dining?[.65,1.6,.42]:[.60,1.6,-2.58],dining?[tableCenter.x,.85,-.15]:[-.6,1.2,-4.0]);
    }else navigation.goTo(floor.point.x,floor.point.z);
  }
});
$('#nextObject').onclick=()=>{if(!tour.length)return;tourIndex=(tourIndex+1)%tour.length;showFeature(tour[tourIndex])};
$('#closeDetail').onclick=()=>{$('#detail').hidden=true};

ready.then(()=>{
navigation.ready();
// Align the shoe bench directly against the cabinet after both asynchronous assets exist.
const cabinet=placed.get('cabinet'),bench=placed.get('bench');
if(cabinet&&bench){let cabinetBox=new THREE.Box3().setFromObject(cabinet);cabinet.position.x+=LEFT-cabinetBox.min.x;cabinet.updateMatrixWorld(true);cabinetBox.setFromObject(cabinet);const benchBox=new THREE.Box3().setFromObject(bench);bench.position.x+=cabinetBox.max.x-benchBox.min.x;bench.updateMatrixWorld(true);const frame=placed.get('frame');if(frame)frame.position.x=bench.position.x}
// The dial's local +Z normal faces the cabinet, instead of pointing across the room.
const wallClock=placed.get('clock');
if(wallClock&&cabinet){const target=new THREE.Box3().setFromObject(cabinet).getCenter(new THREE.Vector3());wallClock.rotation.y=Math.atan2(target.x-wallClock.position.x,target.z-wallClock.position.z);wallClock.updateMatrixWorld(true)}
for(const group of solidFurniture){const b=new THREE.Box3().setFromObject(group);obstacles.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z})}
setupTour();
$('#status').textContent=failed.length?'部分模型未载入':'空间已就绪';$('#enter').disabled=false;$('#enter').innerHTML='从门外进入 <span>→</span>';if(failed.length){$('#error').hidden=false;$('#error').textContent='未载入：'+[...new Set(failed)].join('、')+'。请刷新重试。'}});
