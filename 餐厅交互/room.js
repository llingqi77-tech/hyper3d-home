import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildArchitecture} from './architecture.js?v=8';
import {createNavigation} from './navigation.js?v=9';
import {buildLiving} from './living.js?v=3';
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
// Doubling floor area means scaling both plan axes by sqrt(2), while furniture stays life-size.
const SPACE=Math.SQRT2;
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
architecture.root.scale.set(SPACE,1,SPACE);
for(const floor of architecture.root.children.filter(child=>child.isMesh&&child.geometry?.attributes?.uv&&['Dining','Living room with bay','Connected hall','Kitchen','Bathroom 2','Guest room','Bathroom 1','Child room with bay','Main bedroom','Entry landing'].includes(child.name))){
  const uv=floor.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*SPACE,uv.getY(i)*SPACE);uv.needsUpdate=true;
}

const loader=new GLTFLoader(),cache=new Map(),obstacles=[],placed=new Map(),solidFurniture=[];
const living=buildLiving({scene,box,obstacles});
for(const object of living.root.children){object.position.x*=SPACE;object.position.z*=SPACE}
living.objects.get('餐客厅拱门').scale.x=SPACE;
living.objects.get('西侧窗与阳台').scale.z=SPACE;
living.ceiling.scale.set(SPACE,1,SPACE);
for(const obstacle of obstacles){const cx=(obstacle.minX+obstacle.maxX)/2*SPACE,cz=(obstacle.minZ+obstacle.maxZ)/2*SPACE,hx=(obstacle.maxX-obstacle.minX)/2,hz=(obstacle.maxZ-obstacle.minZ)/2;Object.assign(obstacle,{minX:cx-hx,maxX:cx+hx,minZ:cz-hz,maxZ:cz+hz})}
const tableW=1.55,tableD=.90,tableH=.77;
const tableCenter={x:LEFT+(tableW+.018)/2,z:-.15};
function getAsset(file){if(!cache.has(file))cache.set(file,loader.loadAsync('assets/'+encodeURIComponent(file)).then(g=>g.scene));return cache.get(file)}
function prepare(root){root.traverse(m=>{if(m.isMesh){m.castShadow=true;m.receiveShadow=true}})}
function place(root,{key,height,width,pos,yaw=0,collide=false,wallSide}){const group=new THREE.Group();group.add(root);const b=new THREE.Box3().setFromObject(root),s=b.getSize(new THREE.Vector3());root.scale.setScalar(height?height/s.y:width/s.x);b.setFromObject(root);const c=b.getCenter(new THREE.Vector3());root.position.sub(new THREE.Vector3(c.x,b.min.y,c.z));group.rotation.y=yaw;group.position.set(...pos);prepare(root);scene.add(group);group.updateMatrixWorld(true);b.setFromObject(group);if(wallSide==='entry')group.position.z+=ENTRY-b.max.z;if(wallSide==='back')group.position.z+=FRONT-b.min.z;if(wallSide==='left')group.position.x+=LEFT-b.min.x;if(wallSide==='right')group.position.x+=RIGHT-b.max.x;group.position.x*=SPACE;group.position.z*=SPACE;group.updateMatrixWorld(true);if(key)placed.set(key,group);if(collide)solidFurniture.push(group);return group;}
const assets=[
{key:'cabinet',file:'餐边柜_已核对.glb',width:1.50,pos:[LEFT+.75,0,ENTRY-.3],yaw:Math.PI,wallSide:'entry',collide:true},
{key:'bench',file:'鞋柜凳.glb',width:.90,pos:[.3,0,ENTRY-.25],yaw:Math.PI,wallSide:'entry',collide:true},
{key:'diningWindow',file:'餐厅窗户.glb',height:.864,pos:[LEFT+.16,1.588,tableCenter.z],yaw:Math.PI/2,wallSide:'left'},
{key:'clock',file:'餐厅挂钟.glb',height:.57,pos:[LEFT+.23,1.75,FRONT+.35],yaw:0},
{key:'frame',file:'餐厅相框.glb',height:.4,pos:[.3,1.73,ENTRY-.08],yaw:Math.PI,wallSide:'entry'},
{file:'餐厅吊扇.glb',width:1.18,pos:[-.45,2.32,tableCenter.z]},
...[
[-.40,-.66,0],[.40,-.66,0],[-.40,.66,Math.PI],[.40,.66,Math.PI],[tableW/2+.45,0,-Math.PI/2]
].map(([x,z,yaw],i)=>({key:'chair'+i,file:'温莎椅_单体.glb',height:1.0,pos:[tableCenter.x+x,0,tableCenter.z+z],yaw,collide:true}))
];
// The original flower-painting GLB has fragmented geometry. Use the supplied complete photograph.
const diningArt=new THREE.Group();diningArt.name='完整的餐厅油画';diningArt.position.set((RIGHT-.08)*SPACE,1.55,-.98*SPACE);diningArt.rotation.y=-Math.PI/2;scene.add(diningArt);
box(.51,.63,.035,wood,0,0,0,diningArt);
const oilMap=new THREE.TextureLoader().load('../餐厅旁边的一幅画（在公卫2的外墙上）.jpg');
oilMap.colorSpace=THREE.SRGBColorSpace;oilMap.repeat.set(.315,.524);oilMap.offset.set(.10,.361);
const oilCanvas=new THREE.Mesh(new THREE.PlaneGeometry(.48,.60),new THREE.MeshStandardMaterial({map:oilMap,roughness:1,side:THREE.DoubleSide}));oilCanvas.position.z=.022;diningArt.add(oilCanvas);
// Build a separate table, excluding the fused chairs in the generated assets.
const tableGroup=new THREE.Group();tableGroup.position.set(tableCenter.x*SPACE,0,tableCenter.z*SPACE);scene.add(tableGroup);
box(tableW,.055,tableD,wood,0,tableH-.035,0,tableGroup);box(tableW-.10,.13,tableD-.10,wood,0,tableH-.12,0,tableGroup);
for(const x of [-(tableW/2-.13),tableW/2-.13])for(const z of [-(tableD/2-.11),tableD/2-.11])box(.065,.71,.065,wood,x,.355,z,tableGroup);
const plaid=canvasTexture(512,(c,n)=>{c.fillStyle='#d6bc84';c.fillRect(0,0,n,n);const palette=['#364557','#c7a36b','#994331','#e2d3aa'];for(let i=0;i<8;i++){c.fillStyle=palette[i%4];c.globalAlpha=.78;c.fillRect(i*64,0,37,n);c.fillRect(0,i*64,n,37)}c.globalAlpha=.22;c.strokeStyle='#f6e8c5';for(let i=0;i<n;i+=3){c.beginPath();c.moveTo(i,0);c.lineTo(i,n);c.moveTo(0,i);c.lineTo(n,i);c.stroke()}c.globalAlpha=1});
plaid.wrapS=plaid.wrapT=THREE.RepeatWrapping;plaid.repeat.set(2.5,1.7);const cloth=new THREE.MeshStandardMaterial({map:plaid,roughness:1,side:THREE.DoubleSide});
box(tableW+.018,.012,tableD+.018,cloth,0,tableH,0,tableGroup);
const navy=mat('#424654',{side:THREE.DoubleSide});
function drape(length,edge,axis){const seg=100;for(const band of [0,1]){const vertices=[],uv=[],indices=[];for(let row=0;row<2;row++)for(let i=0;i<=seg;i++){const t=i/seg,along=(t-.5)*length;const y=band===0?(row?tableH-.20:tableH):(row?tableH-.31:tableH-.20);const fold=(Math.sin(t*Math.PI*32)*.014+Math.sin(t*Math.PI*64)*.003)*(row+1)/2;const outward=axis==='z'&&edge<0?Math.max(edge-fold,-tableW/2-.009):edge+Math.sign(edge)*fold;vertices.push(axis==='x'?along:outward,y-(row?.01*Math.cos(t*55):0),axis==='x'?outward:along);uv.push(t,band===0?row*.35:row)}for(let i=0;i<seg;i++){const a=i,b=i+seg+1;indices.push(a,b,a+1,b,b+1,a+1)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();const m=new THREE.Mesh(g,band===0?cloth:navy);m.castShadow=m.receiveShadow=true;tableGroup.add(m)}}
drape(tableW,tableD/2,'x');drape(tableW,-tableD/2,'x');drape(tableD,tableW/2,'z');drape(tableD,-tableW/2,'z');obstacles.push({minX:tableCenter.x*SPACE-tableW/2,maxX:tableCenter.x*SPACE+tableW/2,minZ:tableCenter.z*SPACE-tableD/2,maxZ:tableCenter.z*SPACE+tableD/2});
// Crop the interior tabletop props from a textured asset; omit all chair geometry.
async function tabletopProps(){const source=await getAsset('餐桌_独立彩色.glb');const group=new THREE.Group();source.traverse(m=>{if(!m.isMesh)return;const original=m.geometry,geo=original.index?original.toNonIndexed():original.clone();const pos=geo.attributes.position;const keep=[];for(let i=0;i<pos.count;i+=3){let ok=true;for(let j=0;j<3;j++){const n=i+j;if(pos.getY(n)<-.08||Math.abs(pos.getX(n))>.51||Math.abs(pos.getZ(n))>.54){ok=false;break}}if(ok)keep.push(i,i+1,i+2)}const filtered=new THREE.BufferGeometry();for(const [name,a]of Object.entries(geo.attributes)){const out=new Float32Array(keep.length*a.itemSize);keep.forEach((n,i)=>{for(let k=0;k<a.itemSize;k++)out[i*a.itemSize+k]=a.array[n*a.itemSize+k]});filtered.setAttribute(name,new THREE.BufferAttribute(out,a.itemSize))}filtered.computeBoundingSphere();const mesh=new THREE.Mesh(filtered,m.material);mesh.position.y=.08;group.add(mesh);geo.dispose()});group.scale.setScalar(.86);group.position.set(tableCenter.x*SPACE,tableH+.006,tableCenter.z*SPACE);prepare(group);scene.add(group)}

let loaded=0;const total=assets.length+1,failed=[];
function progress(){loaded++;$('#percent').textContent=Math.round(loaded/total*100)+'%';$('#progress').style.width=loaded/total*100+'%';$('#status').textContent='布置家具 '+loaded+' / '+total;}
const ready=Promise.all(assets.map(async def=>{try{place((await getAsset(def.file)).clone(true),def)}catch(e){failed.push(def.file);console.error(def.file,e)}finally{progress()}}).concat(tabletopProps().catch(e=>{failed.push('桌面摆件');console.error(e)}).finally(progress)));
const navigation=createNavigation({camera,renderer,architecture,obstacles,RIGHT,ENTRY,SPACE});
const renderClock=new THREE.Clock();renderer.setAnimationLoop(()=>{const dt=Math.min(renderClock.getDelta(),.045);navigation.update(dt);living.ceiling.visible=navigation.mode!=='plan';renderer.render(scene,navigation.camera)});
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),cornerMarkers=[];
let press=null;
const corners=[
  {name:'餐厅靠窗角',x:-1.29,z:-1.25,target:[tableCenter.x,.95,tableCenter.z]},
  {name:'餐厅玄关角',x:1.08,z:1.09,target:[tableCenter.x,.95,tableCenter.z]},
  {name:'客厅阳台角',x:-2.84,z:-4.75,target:[-.68,.95,-3.58]},
  {name:'客厅电视角',x:1.15,z:-4.92,target:[-.68,.95,-3.58]},
];
const markerRing=new THREE.RingGeometry(.10,.15,32),markerDot=new THREE.CircleGeometry(.04,24);
for(const corner of corners){
  const g=new THREE.Group();g.name=corner.name;g.position.set(corner.x*SPACE,.026,corner.z*SPACE);g.userData.corner=corner;
  for(const [geometry,opacity] of [[markerRing,.95],[markerDot,.75]]){
    const m=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({color:'#f3dfa9',transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));
    m.rotation.x=-Math.PI/2;g.add(m);
  }
  scene.add(g);cornerMarkers.push(g);
}
function jumpCorner(corner){navigation.focus([corner.x,1.6,corner.z],corner.target)}
renderer.domElement.addEventListener('pointerdown',e=>{press={x:e.clientX,y:e.clientY}});
renderer.domElement.addEventListener('pointerup',e=>{
  if(!press||Math.hypot(e.clientX-press.x,e.clientY-press.y)>6){press=null;return}
  press=null;
  pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);
  raycaster.setFromCamera(pointer,navigation.camera);
  const marker=raycaster.intersectObjects(cornerMarkers,true)[0];
  if(marker){let node=marker.object;while(node&&!node.userData.corner)node=node.parent;if(node?.userData.corner){jumpCorner(node.userData.corner);return}}
  const floor=raycaster.intersectObjects(architecture.root.children.filter(child=>child.name==='Dining'||child.name==='Living room with bay'))[0];
  if(floor){
    const nearest=corners.reduce((best,corner)=>{const distance=Math.hypot(floor.point.x-corner.x*SPACE,floor.point.z-corner.z*SPACE);return distance<best.distance?{corner,distance}:best},{corner:null,distance:Infinity});
    if(nearest.distance<.70*SPACE||navigation.mode==='plan')jumpCorner(nearest.corner);
    else navigation.goTo(floor.point.x,floor.point.z);
  }
});

ready.then(()=>{
navigation.ready();
// Align the shoe bench directly against the cabinet after both asynchronous assets exist.
const cabinet=placed.get('cabinet'),bench=placed.get('bench');
if(cabinet&&bench){let cabinetBox=new THREE.Box3().setFromObject(cabinet);cabinet.position.x+=LEFT*SPACE-cabinetBox.min.x;cabinet.updateMatrixWorld(true);cabinetBox.setFromObject(cabinet);const benchBox=new THREE.Box3().setFromObject(bench);bench.position.x+=cabinetBox.max.x-benchBox.min.x;bench.updateMatrixWorld(true);const frame=placed.get('frame');if(frame)frame.position.x=bench.position.x}
// The dial's local +Z normal faces the cabinet, instead of pointing across the room.
const wallClock=placed.get('clock');
if(wallClock&&cabinet){const target=new THREE.Box3().setFromObject(cabinet).getCenter(new THREE.Vector3());wallClock.rotation.y=Math.atan2(target.x-wallClock.position.x,target.z-wallClock.position.z);wallClock.updateMatrixWorld(true)}
for(const group of solidFurniture){const b=new THREE.Box3().setFromObject(group);obstacles.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z})}
$('#status').textContent=failed.length?'部分模型未载入':'空间已就绪';$('#enter').disabled=false;$('#enter').innerHTML='从门外进入 <span>→</span>';if(failed.length){$('#error').hidden=false;$('#error').textContent='未载入：'+[...new Set(failed)].join('、')+'。请刷新重试。'}});
