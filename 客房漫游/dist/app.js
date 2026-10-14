import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const $=s=>document.querySelector(s);
const viewport=$('#viewport'), scene=new THREE.Scene();scene.background=new THREE.Color('#e8e6de');
const camera=new THREE.PerspectiveCamera(38,1,.05,70);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});}
catch(error){$('#fatal').hidden=false;$('#fatal').textContent='当前浏览器无法启动 3D 显示，请启用硬件加速后重新打开。';$('#loading').hidden=true;throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;viewport.appendChild(renderer.domElement);let dirty=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;document.addEventListener('click',()=>{dirty=true;renderer.shadowMap.needsUpdate=true;});
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.45;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.485;controls.target.set(0,.6,0);controls.addEventListener('change',()=>{dirty=true;});
const ambient=new THREE.HemisphereLight('#f8f5ff','#7b5c49',1.6);scene.add(ambient);
const sun=new THREE.DirectionalLight('#fff0d4',2.6);sun.position.set(-3,6,-1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-5;sun.shadow.camera.right=5;sun.shadow.camera.top=5;sun.shadow.camera.bottom=-5;sun.shadow.normalBias=.025;scene.add(sun);
const fill=new THREE.DirectionalLight('#e2e9ff',1.1);fill.position.set(3,3,4);scene.add(fill);
const lampLight=new THREE.PointLight('#ffdaa0',0,9,2);lampLight.position.set(-.2,2.12,-.1);scene.add(lampLight);
const objects=new Map(), pickables=[], wallParts=[], W=3.8,D=3.2,H=2.72;
const mat=(color,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const ivory=mat('#e9dfc7'), edge=mat('#f5eedc'), brass=mat('#98825c',.3,.65), dark=mat('#282d28'), glass=new THREE.MeshPhysicalMaterial({color:'#cee3e5',transparent:true,opacity:.21,roughness:.08,metalness:.08,side:THREE.DoubleSide});
function box(w,h,d,x,y,z,material=ivory,parent=scene,r=.005){let mesh=new THREE.Mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/4,h/4,d/4)):new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function cylinder(r,h,x,y,z,m,parent=scene){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,20),m);o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
function record(id,name,desc,tags,group,source){const entry={id,name,desc,tags,group,source};objects.set(id,entry);group.userData.item=id;group.traverse(n=>{if(n.isMesh){n.userData.item=id;pickables.push(n);}});return entry;}
function knob(x,y,z,parent){let o=new THREE.Mesh(new THREE.SphereGeometry(.014,12,8),brass);o.position.set(x,y,z);parent.add(o);}
function texture(type){const c=document.createElement('canvas');c.width=c.height=1024;const a=c.getContext('2d');let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
if(type==='floor'){a.fillStyle='#825135';a.fillRect(0,0,1024,1024);for(let y=0;y<1024;y+=128){for(let x=-((y/128)%2)*256;x<1024;x+=512){let tone=rand()*18;a.fillStyle='rgb('+(117+tone)+','+(65+tone/2)+','+(39+tone/3)+')';a.fillRect(x+1,y+1,510,126);for(let k=0;k<130;k++){a.strokeStyle='rgba('+(rand()>.5?'34,12,6':'240,167,105')+','+(rand()*.09)+')';a.lineWidth=rand()*1.8+.2;const yy=y+rand()*128;a.beginPath();a.moveTo(x,yy);a.bezierCurveTo(x+100,yy-2,x+350,yy+3,x+512,yy);a.stroke();}a.strokeStyle='#543624';a.lineWidth=2;a.strokeRect(x,y,512,128);}}}
if(type==='bamboo'){a.fillStyle='#b78b47';a.fillRect(0,0,1024,1024);for(let x=0;x<1024;x+=5){a.fillStyle=rand()>.5?'#c59a53':'#ad7d3e';a.fillRect(x,0,3,1024);a.fillStyle='rgba(64,40,18,.2)';a.fillRect(x+4,0,1,1024);}for(let y=0;y<1024;y+=128){a.fillStyle='#9e793f';a.fillRect(0,y,1024,2);}}
if(type==='curtain'){a.fillStyle='#ded3b5';a.fillRect(0,0,1024,1024);for(let x=0;x<1024;x+=60){a.fillStyle='#a89f84';a.fillRect(x,0,3,1024);a.fillRect(0,x,1024,3);a.fillStyle='#f4ead1';a.fillRect(x+8,0,4,1024);a.fillRect(0,x+8,1024,4);}a.fillStyle='#7f95a1';a.fillRect(0,0,1024,260);a.fillStyle='#b8a16c';a.fillRect(0,250,1024,12);}
if(type==='diatomite'){a.fillStyle='#bfd9e5';a.fillRect(0,0,1024,1024);for(let i=0;i<5200;i++){const x=rand()*1024,y=rand()*1024,r=.35+rand()*1.5;a.fillStyle=rand()>.48?'rgba(83,126,145,.075)':'rgba(255,255,255,.20)';a.beginPath();a.ellipse(x,y,r,r*(.65+rand()*.8),rand()*Math.PI,0,Math.PI*2);a.fill();}for(let i=0;i<210;i++){const x=rand()*1024,y=rand()*1024,r=1.5+rand()*2.1;a.fillStyle='rgba(105,143,159,.065)';a.beginPath();a.arc(x,y,r,0,Math.PI*2);a.fill();}}
const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
const wallTex=texture('diatomite');wallTex.colorSpace=THREE.SRGBColorSpace;const diatomite= new THREE.MeshStandardMaterial({map:wallTex,color:'#ffffff',roughness:.98,metalness:0});
const floorTex=texture('floor');floorTex.repeat.set(2,2);const floorMat=new THREE.MeshStandardMaterial({map:floorTex,roughness:.62,color:'#b89a8d'});
box(W+.18,.14,D+.18,0,-.09,0,mat('#d8d3c8'));box(W,.045,D,0,-.01,0,floorMat);
const ground=box(200,.05,200,0,-.20,0,mat('#e8e6de'),scene,0);ground.castShadow=false;
function wall(w,h,d,x,y,z,cut=false){const o=box(w,h,d,x,y,z,diatomite,scene,0);if(cut)wallParts.push(o);return o;}
// North wall has a real window opening.
wall(.18,H,.12,-1.81,H/2,-1.66);wall(2,H,.12,.9,H/2,-1.66);
wall(1.62,.97,.12,-.91,.485,-1.66);wall(1.62,.3,.12,-.91,2.57,-1.66);
wall(.12,H,D+.12,-1.96,H/2,0,true);wall(.12,H,D+.12,1.96,H/2,0);
wall(.15,H,.12,-1.865,H/2,1.66,true);wall(2.56,H,.12,.62,H/2,1.66,true);
// The south entry is a full-height opening: its door and all four wall heads meet at H.
for(const x of [-1.885,.62]){
 const width=x<0?.15:2.56;
 wall(width,.09,.065,x,2.62,1.60,true);
}
wall(W,.09,.065,0,2.62,-1.60);
for(const x of [-1.89,1.89]){const o=box(.065,.09,D,x,2.62,0,edge);if(x<0)wallParts.push(o);}
box(W,.12,.035,0,.08,-1.59,ivory);box(.035,.12,D,1.89,.08,0,ivory);
const westSkirt=box(.035,.12,D,-1.89,.08,0,ivory);wallParts.push(westSkirt);
box(.15,.12,.035,-1.885,.08,1.59,ivory);box(2.56,.12,.035,.62,.08,1.59,ivory);
// Window and glazing.
const win=new THREE.Group();scene.add(win);
box(1.62,1.46,.06,-.91,1.70,-1.61,glass,win,0);
for(const x of [-1.72,-.91,-.1])box(.035,1.49,.07,x,1.70,-1.58,dark,win);
for(const y of [.96,2.44])box(1.66,.035,.07,-.91,y,-1.58,dark,win);
box(1.75,.055,.19,-.91,.94,-1.52,edge,win);
const sky=mat('#bacdd1');box(1.6,1.43,.012,-.91,1.70,-1.72,sky,win,0);
record('window','灰蓝拼接窗帘','灰蓝上帘拼接米色格纹，金色束带收起。窗下保留整段工作台。',['灰蓝','米色格纹','金色滚边'],win);
const curtainTex=texture('curtain');const curtainMat=new THREE.MeshStandardMaterial({map:curtainTex,roughness:1,side:THREE.DoubleSide});
function curtain(cx){const rows=60,cols=30,v=[],uv=[],inds=[];for(let iy=0;iy<=rows;iy++){const t=iy/rows,y=2.46-t*1.49;const width=.44-.28*Math.exp(-Math.pow((t-.66)/.15,2));for(let ix=0;ix<=cols;ix++){const u=ix/cols;v.push(cx+(u-.5)*width,y,-1.40+Math.cos(u*Math.PI*12)*.035);uv.push(u,1-t);}}for(let iy=0;iy<rows;iy++)for(let ix=0;ix<cols;ix++){const a=iy*(cols+1)+ix,b=a+cols+1;inds.push(a,b,a+1,b,b+1,a+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(inds);g.computeVertexNormals();const m=new THREE.Mesh(g,curtainMat);m.castShadow=true;win.add(m);box(.20,.04,.09,cx,1.48,-1.37,mat('#baa16a'),win);}
curtain(-1.60);curtain(-.22);
const rod=cylinder(.014,1.9,-.91,2.49,-1.42,brass,win);rod.rotation.z=Math.PI/2;
// Desk and its paneled drawers.
const desk=new THREE.Group();scene.add(desk);box(1.99,.055,.66,-.905,.77,-1.24,edge,desk,.012);
for(const x of [-1.84,-.03])box(.065,.72,.58,x,.38,-1.26,ivory,desk);
box(.43,.61,.57,-.145,.43,-1.26,ivory,desk);
for(let i=0;i<3;i++){box(.39,.18,.027,-.145,.25+i*.19,-.96,edge,desk);knob(-.145,.25+i*.19,-.938,desk);}
box(.43,.18,.57,-1.61,.65,-1.26,ivory,desk);box(.39,.15,.027,-1.61,.65,-.96,edge,desk);knob(-1.61,.65,-.938,desk);
box(1.1,.035,.43,-1.0,.62,-.93,edge,desk);box(1.1,.075,.025,-1.0,.60,-.70,ivory,desk);
record('desk','窗下定制书桌','奶油白连体桌面，键盘托盘向前抽出，抽屉带小圆金属拉手。',['奶油白','圆形拉手','窗下工作区'],desk);
// A floor-to-ceiling run fills the west wall from the door's open-swing clearance to the north wall.
const bookcase=new THREE.Group();scene.add(bookcase);
const bcX=-1.70,bcZ=-.55,bcH=2.62,bcL=2.04,bcT=.045,bcDepth=.40,bcY=bcH/2;
// Open cubbies face into the bedroom; only the back and two ends are closed.
box(.025,bcH,bcL,bcX-bcDepth/2+.013,bcY,bcZ,ivory,bookcase);
for(const z of [bcZ-bcL/2+.018,bcZ+bcL/2-.018])box(bcDepth-.025,bcH,.036,bcX,bcY,z,edge,bookcase);
box(bcDepth,.075,bcL+.025,bcX,bcH-.038,bcZ,ivory,bookcase);
box(bcDepth,.075,bcL+.025,bcX,.04,bcZ,ivory,bookcase);
for(let row=1;row<5;row++)box(bcDepth,.045,bcL,bcX,.04+row*(bcH-.08)/5,bcZ,edge,bookcase);
for(let col=1;col<5;col++)box(bcDepth,.04,bcT,bcX,bcY,bcZ-bcL/2+col*bcL/5,edge,bookcase);
const spineMats=['#f3ead7','#ded9cb','#e5e0d5','#c8c2d0','#a7b2a1','#d8c3a3'].map(c=>mat(c,.9));
for(let row=0;row<4;row++)for(let col=0;col<5;col++){
 const y=.12+row*.62,cell=bcL/5;
 for(let n=0;n<6;n++){
  const height=.30+(n%3)*.045,width=.030+(n%2)*.008;
  box(.026,height,width,bcX+bcDepth/2-.012,y+height/2,bcZ-bcL/2+col*cell+.045+n*.053,spineMats[(row+col+n)%spineMats.length],bookcase,.003);
 }
}
record('bookcase','左侧整墙白色书柜','沿书桌左侧墙连续铺设。书柜从入口门扇完全打开后的净空开始，延伸至窗墙；按展示比例，高 2.62 米、长 2.04 米，现场需复尺。',['奶油白','整墙到顶','门扇开启后余墙全铺'],bookcase);
const cabinet=new THREE.Group();scene.add(cabinet);
box(1.79,.72,.64,.995,.38,-1.26,ivory,cabinet);box(1.84,.055,.68,.995,.77,-1.25,edge,cabinet);
for(let i=0;i<3;i++){box(.48,.20,.026,.39,.20+i*.225,-.925,edge,cabinet);knob(.39,.20+i*.225,-.905,cabinet);}
for(const x of [.95,1.56]){box(.58,.66,.028,x,.41,-.925,edge,cabinet);box(.51,.57,.012,x,.41,-.905,ivory,cabinet);knob(x+(x<1.2?.22:-.22),.44,-.885,cabinet);}
record('cabinet','连体收纳低柜','书桌右侧延伸至床头，抽屉与双开门组合。床加宽后，靠床柜门开启空间需现场复核。',['奶油白','抽屉＋双开门','床头收纳'],cabinet);
const shelf=new THREE.Group();scene.add(shelf);
function cubby(x,y){box(.43,.025,.30,x,y,-1.29,edge,shelf);box(.43,.025,.30,x,y+.43,-1.29,edge,shelf);for(const xx of [x-.215,x+.215])box(.025,.43,.30,xx,y+.215,-1.29,edge,shelf);box(.43,.43,.018,x,y+.215,-1.44,ivory,shelf);}
cubby(1.05,.80);cubby(1.50,.80);cubby(1.50,1.25);
record('shelf','阶梯式三格置物架','下层两格、右上方一格，组合成不对称阶梯。',['三格开放收纳','奶油白'],shelf);
const bed=new THREE.Group();scene.add(bed);const bx=1.055,bz=.275,bw=1.61,bl=2.35;
box(bw,.30,bl,bx,.20,bz,ivory,bed,.018);
for(const x of [bx-bw/2+.035,bx+bw/2-.035])box(.07,.40,bl+.03,x,.25,bz,edge,bed,.012);
box(bw+.04,.42,.065,bx,.25,bz+bl/2,edge,bed);box(bw-.12,.29,.015,bx,.23,bz+bl/2+.039,ivory,bed);
box(bw-.14,.055,bl-.10,bx,.393,bz,mat('#e5dbba'),bed,.012);
const bambooTex=texture('bamboo');const bambooMat=new THREE.MeshStandardMaterial({map:bambooTex,roughness:.8});
box(bw-.16,.016,bl-.11,bx,.43,bz,bambooMat,bed,.003);
record('bed','向左加宽的床','床右侧贴墙，左侧延伸至确认图蓝框边线。床架和竹席同步加宽；这里使用展示比例。',['奶油白床架','蜂蜜色竹席','已加宽'],bed);
// Door: opening in SOUTH wall, hinge at left, inward swing towards WEST wall.
const doorGroup=new THREE.Group();doorGroup.position.set(-1.80,0,1.60);scene.add(doorGroup);
box(1.12,H,.045,.56,H/2,0,ivory,doorGroup,.008);
box(.97,H-.20,.018,.56,H/2,.03,edge,doorGroup);
knob(1.02,H/2,.065,doorGroup);
const doorFrames=new THREE.Group();scene.add(doorFrames);
for(const x of [-1.82,-.66])box(.055,H,.12,x,H/2,1.60,edge,doorFrames);
doorGroup.rotation.y=Math.PI/2;
record('door','下侧靠左的全高入口门','门扇顶端与 2.72 米墙顶齐平。向内开启后沿左墙收起，书柜从门扇净空后开始。',['墙门同高 2.72 米','向内开启','奶油白'],doorGroup);
let doorOpen=true,night=false,cutaway=false,currentView='overview';
const assetDefinitions=[
{id:'chair',name:'温莎木椅',desc:'黑色竖条靠背与扶手，搭配棕色木质座面。',tags:['黑色木框','棕色座面'],size:[.60,.94,.59],pos:[-.99,0,-.28],yaw:Math.PI},
{id:'lamp',name:'绿色三头吊灯',desc:'三只鼠尾草绿织物灯罩，深古铜色弯臂。依据第二张吊灯照片。',tags:['鼠尾草绿','古铜色','三头'],size:[.70,.63,.70],pos:[-.20,2.08,-.1]},
{id:'fan',name:'桌面小台扇',desc:'米白网罩与底座，红粉色扇叶，放在低柜左侧。',tags:['米白','粉红扇叶'],size:[.22,.29,.15],pos:[.40,.801,-1.18]},
{id:'bamboo',name:'高挑绿植',desc:'细长绿色枝叶与透明容器，位于书桌和柜体连接附近。',tags:['绿色枝叶','透明玻璃'],size:[.30,.65,.25],pos:[-.02,.801,-1.37]},
{id:'cactus',name:'仙人球盆栽',desc:'黄色花盆上有蓝色装饰纹样，小型仙人球。',tags:['嫩绿','黄色陶盆'],size:[.11,.18,.11],pos:[-.57,.801,-1.14]},
{id:'quilt',name:'粉色花卉被褥',desc:'玫红花卉棉被叠放于床头，保留自然褶皱。',tags:['粉色','花卉棉布'],size:[.68,.24,.48],pos:[.77,.445,-.62]},
{id:'pillow',name:'红粉图案枕头',desc:'粉红底色搭配红色大花纹，平放于床头右侧。',tags:['红粉色','棉织物'],size:[.58,.16,.39],pos:[1.47,.445,-.62]},
{id:'monitor',name:'黑色显示器',desc:'黑色宽边框屏幕与圆形支座，放在窗下桌面。',tags:['黑色','桌面设备'],size:[.46,.37,.18],pos:[-1.22,.801,-1.35]},
{id:'keyboard',name:'黑色键盘',desc:'带数字区的黑色键盘，放在抽出的键盘托盘上。',tags:['黑色','独立按键'],size:[.43,.03,.15],pos:[-1.05,.64,-.93]},
{id:'pencils',name:'绿色笔筒',desc:'绿色镂空笔筒内放置笔和铅笔。',tags:['亮绿','塑料与文具'],size:[.085,.17,.085],pos:[-.80,.801,-1.16]},
{id:'books',name:'桌面书刊',desc:'浅色封面的书刊叠放于桌面右侧。',tags:['米色纸张','书刊叠放'],size:[.25,.085,.17],pos:[-.29,.801,-1.14]}
];
const gltfLoader=new GLTFLoader();const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');gltfLoader.setDRACOLoader(draco);
let loaded=0;const errors=[];
async function loadAsset(a,manifest){const recordData=manifest.find(x=>x.id===a.id);const gltf=await gltfLoader.loadAsync('./models/'+a.id+'.glb');const root=gltf.scene;
root.updateMatrixWorld(true);let bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
const normalized=new THREE.Group();root.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));normalized.add(root);
normalized.scale.set(a.size[0]/Math.max(size.x,.001),a.size[1]/Math.max(size.y,.001),a.size[2]/Math.max(size.z,.001));
const anchor=new THREE.Group();anchor.position.fromArray(a.pos);anchor.rotation.y=a.yaw||0;anchor.add(normalized);scene.add(anchor);
anchor.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;if(n.material){const ms=Array.isArray(n.material)?n.material:[n.material];ms.forEach(m=>{m.side=THREE.DoubleSide;});}}});
record(a.id,a.name,a.desc,a.tags,anchor,recordData?.display_url);loaded++;dirty=true;renderer.shadowMap.needsUpdate=true;$('#load-text').textContent='精细物件 '+loaded+' / '+assetDefinitions.length;
}
function renderInventory(){const ids=['bed','desk','bookcase','cabinet','shelf',...assetDefinitions.map(x=>x.id),'window','door'];$('#items').replaceChildren();ids.forEach((id,i)=>{const a=objects.get(id);if(!a)return;const b=document.createElement('button');b.dataset.item=id;b.innerHTML='<b>'+a.name+'</b><span>'+String(i+1).padStart(2,'0')+' ↗</span>';b.addEventListener('click',()=>select(id,true));$('#items').appendChild(b);});$('#item-count').textContent=ids.length+' 件';}
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down=null,highlight=null,tween=null;
function select(id,focus=false){dirty=true;const a=objects.get(id);if(!a)return;$('#item-name').textContent=a.name;$('#item-description').textContent=a.desc;$('#item-index').textContent=String([...objects.keys()].indexOf(id)+1).padStart(2,'0');$('#item-meta').replaceChildren(...a.tags.map(t=>{let s=document.createElement('span');s.textContent=t;return s;}));$('#model-link').hidden=!a.source;if(a.source)$('#model-link').href=a.source;
document.querySelectorAll('[data-item]').forEach(b=>b.classList.toggle('selected',b.dataset.item===id));
if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();}highlight=new THREE.BoxHelper(a.group,'#91a67a');highlight.material.transparent=true;highlight.material.opacity=.45;scene.add(highlight);
if(focus){const bounds=new THREE.Box3().setFromObject(a.group),c=bounds.getCenter(new THREE.Vector3()),s=bounds.getSize(new THREE.Vector3());const dist=Math.max(s.length()*1.55,.7);fly(c.clone().add(new THREE.Vector3(-.6,.5,1).normalize().multiplyScalar(dist)),c);}
}
function hit(e){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(pickables,false).find(h=>h.object.visible);}
renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];tween=null;});
renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])<5){const h=hit(e);if(h)select(h.object.userData.item);}down=null;});
renderer.domElement.addEventListener('pointermove',e=>{if(e.buttons)return;const h=hit(e);renderer.domElement.style.cursor=h?'pointer':'grab';});
function fly(position,target){tween={from:camera.position.clone(),to:position,fromT:controls.target.clone(),toT:target,time:performance.now()};}
function view(name,immediate=false){currentView=name;setCutaway(false);const p={overview:[5.0,10.5,6.0],plan:[0,10.5,.01],inside:[-1.20,1.52,1.34]}[name];const t={overview:[0,.5,0],plan:[0,.1,0],inside:[.3,1.1,-1.10]}[name];const fit=name==='inside'?1:Math.max(1,1.22/camera.aspect);for(let i=0;i<3;i++)p[i]=t[i]+(p[i]-t[i])*fit;if(immediate){tween=null;camera.position.fromArray(p);controls.target.fromArray(t);}else fly(new THREE.Vector3(...p),new THREE.Vector3(...t));controls.maxPolarAngle=name==='plan'?Math.PI*.47:name==='inside'?Math.PI*.70:Math.PI*.92;controls.minDistance=name==='inside'?.08:.45;document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));}
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>view(b.dataset.view));$('#reset').onclick=()=>view('overview');
$('#door').onclick=()=>{doorOpen=!doorOpen;$('#door').classList.toggle('on',doorOpen);$('#door').setAttribute('aria-checked',String(doorOpen));$('#door-state').textContent=(doorOpen?'已打开':'已关闭')+' · 下侧靠左';};
$('#lighting').onclick=()=>{night=!night;$('.stage').classList.toggle('night',night);$('#lighting').classList.toggle('on',night);$('#lighting').setAttribute('aria-checked',String(night));$('#light-state').textContent=night?'夜间 · 暖色吊灯':'日间 · 窗边自然光';ambient.intensity=night?.65:1.6;sun.intensity=night?.16:2.6;fill.intensity=night?.35:1.1;lampLight.intensity=night?9:0;renderer.toneMappingExposure=night?1.1:1.02;scene.background.set(night?'#373c35':'#e8e6de');ground.material.color.set(night?'#373c35':'#e8e6de');};
function setCutaway(value){cutaway=value;wallParts.forEach(w=>w.visible=!cutaway);$('#walls').classList.toggle('on',cutaway);$('#walls').setAttribute('aria-checked',String(cutaway));}
$('#walls').onclick=()=>setCutaway(!cutaway);
$('#reference').onclick=()=>$('#reference-dialog').showModal();$('.close').onclick=()=>$('#reference-dialog').close();$('#reference-dialog').addEventListener('click',e=>{if(e.target===$('#reference-dialog'))$('#reference-dialog').close();});
$('#capture').onclick=()=>{renderer.render(scene,camera);const a=document.createElement('a');a.download='客房-三维视图.png';a.href=renderer.domElement.toDataURL('image/png');a.click();};
function resize(){dirty=true;const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(window.__room)view(currentView,true);}
new ResizeObserver(resize).observe(viewport);resize();view('overview',true);
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{const dt=Math.min(clock.getDelta(),.05);if(tween){dirty=true;const t=Math.min(1,(performance.now()-tween.time)/700),s=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,s);controls.target.lerpVectors(tween.fromT,tween.toT,s);if(t===1)tween=null;}const angle=doorOpen?Math.PI/2:0;if(Math.abs(doorGroup.rotation.y-angle)>.001){doorGroup.rotation.y=THREE.MathUtils.damp(doorGroup.rotation.y,angle,7,dt);dirty=true;renderer.shadowMap.needsUpdate=true;}if(highlight)highlight.update();controls.update();if(dirty){renderer.render(scene,camera);dirty=false;}});
window.__room={scene,camera,renderer,objects,assetDefinitions,get loaded(){return loaded},errors,view,select};
try{const response=await fetch('./models/manifest.json');if(!response.ok)throw new Error('模型清单未找到');const manifest=await response.json();let next=0;await Promise.all(Array.from({length:3},async()=>{while(next<assetDefinitions.length){const a=assetDefinitions[next++];try{await loadAsset(a,manifest);}catch(e){errors.push(a.id+': '+e.message);console.error('Asset failed',a.id,e);}}}));renderInventory();$('#loading').hidden=true;$('#model-count').textContent=assetDefinitions.length+' 件独立精细模型';if(errors.length){$('#fatal').hidden=false;$('#fatal').textContent='部分模型未载入（'+errors.length+'件）。请刷新页面重试；房间主体仍可查看。';}}catch(e){$('#loading').hidden=true;$('#fatal').hidden=false;$('#fatal').textContent='房间主体已就绪，精细模型暂未就绪。'+e.message;renderInventory();}

