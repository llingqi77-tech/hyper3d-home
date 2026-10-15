import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Reflector } from "three/addons/objects/Reflector.js";

const $ = (s) => document.querySelector(s);
const host = $("#canvas-host");
const scene = new THREE.Scene();
// The room uses +X for east and +Z for north. From the south entrance, Three.js
// projects +X to screen-left, opposite the user's plan. Mirror the rendered room
// across its center so west reads left, east reads right, and the SE door reads right.
scene.scale.x = -1;
scene.position.x = 1.42;
scene.background = new THREE.Color("#d9d6cb");
const camera = new THREE.PerspectiveCamera(45, 1, 0.03, 30);
camera.position.set(.71, 2.45, -3.1);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
host.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.minDistance = 1.3;
controls.maxDistance = 5.4;
controls.maxPolarAngle = Math.PI * 0.49;
controls.target.set(0.71, 1, 0.91);

const hemi = new THREE.HemisphereLight("#ffffff", "#697174", 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight("#ffffff", 2.2);
sun.position.set(3.5, 5.5, -2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0004;
scene.add(sun);
const fill = new THREE.DirectionalLight("#d6e4ea", 0.55);
fill.position.set(-3, 2.4, 3);
scene.add(fill);
const vanityGlow = new THREE.PointLight("#ffe1a6", 0.15, 3.5);
vanityGlow.position.set(0.3, 2.02, 0.46);
scene.add(vanityGlow);

function tileTexture(base, line, diagonal = false) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const ctx = c.getContext("2d"); ctx.fillStyle = base; ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = line; ctx.lineWidth = 5;
  if (diagonal) {
    ctx.beginPath(); ctx.moveTo(-128, 256); ctx.lineTo(128, 0); ctx.lineTo(384, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 128); ctx.lineTo(128, 0); ctx.lineTo(256, 128); ctx.lineTo(128, 256); ctx.closePath(); ctx.stroke();
  } else {
    for (const n of [0, 128, 256]) { ctx.beginPath(); ctx.moveTo(n, 0); ctx.lineTo(n, 256); ctx.moveTo(0, n); ctx.lineTo(256, n); ctx.stroke(); }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t;
}
const floorMat = new THREE.MeshStandardMaterial({ map: tileTexture("#244a63", "#f1f2ed"), roughness: 0.83 });
const upperMat = new THREE.MeshStandardMaterial({ map: tileTexture("#fafafa", "#d4d8da", true), roughness: 0.86 });
// Lower walls use the exact same blue tile and white grout as the floor.
const lowerMat = floorMat;
const grout = new THREE.MeshStandardMaterial({ color: "#f1f2ed", roughness: 0.9 });
const trimMat = new THREE.MeshStandardMaterial({ color: "#f4f5f4", roughness: 0.86 });
function tiledMaterial(material,width,height){
  const result=material.clone();result.map=material.map.clone();
  // Texture contains two tiles per axis: each tile is 30 cm on every surface.
  result.map.repeat.set(width/.60,height/.60);return result;
}
const metal = new THREE.MeshStandardMaterial({ color: "#342d24", metalness: 0.62, roughness: 0.33 });
const porcelain = new THREE.MeshStandardMaterial({ color: "#f5f2e9", roughness: 0.22, metalness: 0.02 });
const brass = new THREE.MeshStandardMaterial({ color: "#9b7040", metalness: 0.72, roughness: 0.3 });

function box(parent, name, size, position, material, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  m.name = name; m.position.set(...position); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m;
}
function plane(name, w, h, position, rotation, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material.map?tiledMaterial(material,w,h):material);
  m.name = name; m.position.set(...position); m.rotation.set(...rotation); m.receiveShadow = true; scene.add(m); return m;
}

// Floor and tiled room shell. The south wall stays open so the full layout remains visible.
plane("dark tiled floor", 1.42, 1.70, [0.71, 0.015, 0.85], [-Math.PI / 2, 0, 0], floorMat);
box(scene, "floor plinth", [1.48, 0.08, 1.76], [0.71, -0.04, 0.85], grout, false);
const roomH = 2.45;
// Local +X reads as screen-right from the entrance after the room reflection.
const windowOpening={x:.98,y:1.91,width:.70,height:.50};
const windowLeft=windowOpening.x-windowOpening.width/2;
const windowRight=windowOpening.x+windowOpening.width/2;
const windowBottom=windowOpening.y-windowOpening.height/2;
const windowTop=windowOpening.y+windowOpening.height/2;
function tiledWallWest() {
  box(scene, "west wall structure", [0.08, roomH, 1.70], [-0.04, roomH/2, 0.85], trimMat, false);
  plane("west beige diamond tile", 1.70, roomH-0.86, [0.006, (roomH+0.86)/2, 0.85], [0, Math.PI/2, 0], upperMat);
  plane("west blue tile wainscot", 1.70, 0.82, [0.006, 0.45, 0.85], [0, Math.PI/2, 0], lowerMat);
}
function tiledWallNorth() {
  // Four solid wall sections leave a real opening through the entire wall depth.
  for(const [label,x0,x1,y0,y1] of [
    ["below",0,1.42,0,windowBottom],
    ["above",0,1.42,windowTop,roomH],
    ["left",0,windowLeft,windowBottom,windowTop],
    ["right",windowRight,1.42,windowBottom,windowTop],
  ]) box(scene,`north wall structure ${label}`,[x1-x0,y1-y0,.08],[(x0+x1)/2,(y0+y1)/2,1.74],trimMat,false);
  const surface=new THREE.Shape();
  surface.moveTo(0,.86);surface.lineTo(1.42,.86);surface.lineTo(1.42,roomH);surface.lineTo(0,roomH);surface.closePath();
  const opening=new THREE.Path();
  opening.moveTo(windowLeft,windowBottom);opening.lineTo(windowLeft,windowTop);opening.lineTo(windowRight,windowTop);opening.lineTo(windowRight,windowBottom);opening.closePath();
  surface.holes.push(opening);
  const geometry=new THREE.ShapeGeometry(surface);
  const uv=geometry.attributes.uv,positions=geometry.attributes.position;
  for(let i=0;i<uv.count;i++) uv.setXY(i,1-positions.getX(i)/1.42,(positions.getY(i)-.86)/(roomH-.86));
  const northTile=new THREE.Mesh(geometry,tiledMaterial(upperMat,1.42,roomH-.86));
  northTile.material.side=THREE.DoubleSide;northTile.position.z=1.696;northTile.name="north beige diamond tile";northTile.receiveShadow=true;scene.add(northTile);
  plane("north blue tile wainscot", 1.42, 0.82, [0.71, 0.45, 1.696], [0, Math.PI, 0], lowerMat);
}
function tiledWallEast() {
  box(scene, "east wall structure", [.08, roomH, 1.70], [1.46, roomH/2, .85], trimMat, false);
  plane("east blue tile wainscot", 1.70, .82, [1.414, .45, .85], [0, -Math.PI/2, 0], lowerMat);
  plane("east beige diamond tile", 1.70, roomH-.86, [1.414, (roomH+.86)/2, .85], [0, -Math.PI/2, 0], upperMat);
}
tiledWallWest(); tiledWallNorth(); tiledWallEast();
box(scene, "tile transition west", [.018,.035,1.66], [.018,.86,.85], grout, false);
box(scene, "tile transition north", [1.38,.035,.018], [.71,.86,1.66], grout, false);
box(scene, "tile transition east", [.018,.035,1.62], [1.40,.86,.85], grout, false);

// Recessed operable louvres: open gaps, no opaque panel behind the window.
const northWindow=new THREE.Group();northWindow.name="north wall recessed window";scene.add(northWindow);
const frameMat=new THREE.MeshStandardMaterial({color:"#899599",metalness:.72,roughness:.29});
for(const x of [windowLeft+.013,windowRight-.013]) box(northWindow,"recessed window jamb",[.026,.50,.078],[x,windowOpening.y,1.742],frameMat,false);
for(const y of [windowBottom+.013,windowTop-.013]) box(northWindow,"recessed window sill",[.70,.026,.078],[windowOpening.x,y,1.742],frameMat,false);
const glassMat=new THREE.MeshStandardMaterial({color:"#c0dde3",transparent:true,opacity:.20,metalness:.05,roughness:.12,depthWrite:false,side:THREE.DoubleSide});
for(let i=0;i<5;i++){
  const y=windowBottom+.065+i*.092;
  const blade=box(northWindow,"open glass louvre",[.648,.007,.077],[windowOpening.x,y,1.744],glassMat,false);blade.rotation.x=-.48;
  box(northWindow,"louvre front edge",[.648,.007,.008],[windowOpening.x,y+.018,1.710],frameMat,false);
}
// A simple outdoor sky sits beyond the wall, visible through the open louvres.
const skyCanvas=document.createElement("canvas");skyCanvas.width=64;skyCanvas.height=128;
const skyContext=skyCanvas.getContext("2d"),skyGradient=skyContext.createLinearGradient(0,0,0,128);
skyGradient.addColorStop(0,"#72b8e4");skyGradient.addColorStop(1,"#e9f5fa");skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,64,128);
const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;
const outdoorSky=new THREE.Mesh(new THREE.PlaneGeometry(1.05,.82),new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.DoubleSide}));
outdoorSky.name="outdoor sky beyond window";outdoorSky.position.set(windowOpening.x,windowOpening.y,2.08);northWindow.add(outdoorSky);

// Confirmed layout: 64 cm entrance at the southeast end of the south wall.
box(scene,"southeast entrance jamb",[.06,2.1,.08],[.78,1.05,.035],trimMat,false);
box(scene,"southeast entrance header",[.68,.06,.08],[1.10,2.10,.035],trimMat,false);
box(scene,"southeast entrance threshold",[.64,.025,.12],[1.10,.03,.02],grout,false);
const door = new THREE.Group(); door.position.set(1.395,.02,.025); scene.add(door);
box(door,"warm wood entrance door",[.64,2.02,.045],[-.32,1.01,.02],new THREE.MeshStandardMaterial({color:"#84613b",roughness:.65}));
box(door,"door panel inset",[.50,1.73,.012],[-.32,1.0,.05],new THREE.MeshStandardMaterial({color:"#a77c4e",roughness:.68}),false);
box(door,"door handle",[.025,.11,.045],[-.56,1.0,-.035],brass,false);
door.rotation.y = Math.PI/2;

// Reusable placeholders keep the room complete while the independent GLB assets stream in.
const fallback = new Map();
function placeholder(id, group) { group.name = `fallback-${id}`; scene.add(group); fallback.set(id,group); return group; }
const cabinetGroup = placeholder("cabinet", new THREE.Group());
const ochre = new THREE.MeshStandardMaterial({color:"#9a8a13",roughness:.63});
box(cabinetGroup,"cabinet body",[.48,.78,.68],[.30,.43,.54],ochre);
for(let j=0;j<2;j++){
  box(cabinetGroup,"lattice door",[.025,.69,.31],[.55,.43,.37+j*.34],new THREE.MeshStandardMaterial({color:"#b7a11e",roughness:.55}));
  for(let k=0;k<5;k++) box(cabinetGroup,"cabinet grille",[.018,.55,.012],[.57,.43,.25+k*.055],brass,false);
}
box(cabinetGroup,"mosaic counter",[.56,.065,.76],[.30,.85,.54],new THREE.MeshStandardMaterial({color:"#28474a",roughness:.42}));
const basinGroup=placeholder("basin",new THREE.Group());
const bowl=new THREE.Mesh(new THREE.SphereGeometry(1,32,20,0,Math.PI*2,0,Math.PI*.47),porcelain); bowl.scale.set(.23,.12,.18); bowl.position.set(.31,.91,.53); bowl.castShadow=true; basinGroup.add(bowl);
const faucetGroup=placeholder("faucet",new THREE.Group());
const chrome=new THREE.MeshStandardMaterial({color:"#d8e1e5",metalness:.72,roughness:.22});
const faucetStem=new THREE.Mesh(new THREE.CylinderGeometry(.023,.025,.29,24),chrome); faucetStem.position.set(.065,.995,.54); faucetGroup.add(faucetStem);
box(faucetGroup,"chrome faucet spout",[.19,.035,.043],[.155,1.125,.54],chrome);
box(faucetGroup,"chrome faucet lever",[.085,.012,.030],[.09,1.169,.54],chrome);
const toiletGroup=placeholder("toilet",new THREE.Group());
box(toiletGroup,"toilet pedestal",[.26,.43,.36],[.20,.24,1.24],porcelain);
const bowlShape=new THREE.Mesh(new THREE.SphereGeometry(1,32,22,0,Math.PI*2,0,Math.PI*.48),porcelain); bowlShape.scale.set(.28,.14,.17); bowlShape.rotation.y=Math.PI/2; bowlShape.position.set(.30,.55,1.24); toiletGroup.add(bowlShape);
const seat=new THREE.Mesh(new THREE.TorusGeometry(.14,.018,8,36),new THREE.MeshStandardMaterial({color:"#f8f6ef",roughness:.26})); seat.rotation.x=Math.PI/2; seat.rotation.z=Math.PI/2; seat.scale.set(.9,1.2,1); seat.position.set(.37,.65,1.24); toiletGroup.add(seat);
box(toiletGroup,"toilet tank",[.18,.38,.34],[.10,.70,1.24],porcelain);
const showerGroup=placeholder("showerhead",new THREE.Group());
const showerBlack=new THREE.MeshStandardMaterial({color:"#191c1e",metalness:.55,roughness:.42});
box(showerGroup,"black shower riser",[.023,1.15,.023],[1.37,1.55,1.24],showerBlack);
box(showerGroup,"black overhead arm",[.36,.023,.023],[1.20,2.125,1.24],showerBlack);
const showerDisc=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.016,32),showerBlack);showerDisc.position.set(1.025,2.10,1.24);showerGroup.add(showerDisc);
box(showerGroup,"black mixer bar",[.075,.06,.28],[1.35,.98,1.24],showerBlack);
const handShower=new THREE.Mesh(new THREE.CylinderGeometry(.047,.047,.026,24),showerBlack);handShower.rotation.z=Math.PI/2;handShower.position.set(1.32,1.76,1.32);showerGroup.add(handShower);
box(showerGroup,"hand shower handle",[.024,.16,.024],[1.33,1.64,1.32],showerBlack);
const hoseCurve=new THREE.CatmullRomCurve3([[1.33,1.57,1.32],[1.30,1.02,1.37],[1.28,.59,1.35],[1.31,.57,1.18],[1.35,.95,1.19]].map(p=>new THREE.Vector3(...p)));
showerGroup.add(new THREE.Mesh(new THREE.TubeGeometry(hoseCurve,48,.009,8,false),showerBlack));
const mirrorGroup=placeholder("mirror",new THREE.Group());
box(mirrorGroup,"iron mirror frame",[.035,.68,.46],[.05,1.66,.54],metal);
const mirrorSurface=new Reflector(new THREE.PlaneGeometry(.40,.62),{color:0xe4edf0,textureWidth:512,textureHeight:512,clipBias:.003});
mirrorSurface.name="vanity mirror surface"; mirrorSurface.rotation.y=Math.PI/2; mirrorSurface.position.set(.072,1.66,.54); mirrorGroup.add(mirrorSurface);
const lampGroup=placeholder("lamp",new THREE.Group());
box(lampGroup,"lamp backplate",[.035,.13,.50],[.05,2.15,.54],metal);
for(const z of [.39,.69]){
  box(lampGroup,"lamp stem",[.14,.025,.025],[.13,2.13,z],brass);
  const shade=new THREE.Mesh(new THREE.SphereGeometry(.105,20,16,0,Math.PI*2,0,Math.PI*.72),new THREE.MeshStandardMaterial({color:"#ead5a8",roughness:.38,emissive:"#8b6237",emissiveIntensity:.24})); shade.scale.set(1,.9,1); shade.rotation.z=Math.PI; shade.position.set(.20,2.05,z); lampGroup.add(shade);
}

// Small scene details from the reference image.
// User-marked corner between the towel wall and the north/window wall.
const toiletriesCorner=[.15,1.60,1.585];
const shelf=box(scene,"corner toiletries shelf",[.28,.025,.20],toiletriesCorner,metal);
for(let i=0;i<4;i++) box(scene,"toiletry bottle",[.045,.14,.045],[toiletriesCorner[0]-.09+i*.06,toiletriesCorner[1]+.0825,toiletriesCorner[2]],new THREE.MeshStandardMaterial({color:["#e9ede4","#86a2a3","#d7c5a7","#f1efdf"][i],roughness:.5}));
box(scene,"towel bar",[.55,.035,.035],[.075,2.03,1.20],metal);
const towel=box(scene,"hanging towel",[.27,.46,.035],[.20,1.77,1.20],new THREE.MeshStandardMaterial({color:"#ead6a8",roughness:.88}));
for(let i=0;i<4;i++) box(scene,"towel stripe",[.27,.018,.008],[.20,1.63+i*.055,1.18],new THREE.MeshStandardMaterial({color:i%2?"#aebbc0":"#dcc686",roughness:.75}),false);
box(scene,"toilet paper roll",[.12,.10,.10],[.18,.68,.97],porcelain);
const rollHole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.102,16),metal); rollHole.rotation.z=Math.PI/2; rollHole.position.set(.18,.68,.97); scene.add(rollHole);
const soapWall = new THREE.Group(); soapWall.name="wall-mounted-soap-dispenser"; scene.add(soapWall);
box(soapWall,"soap dispenser wall bracket",[.035,.14,.12],[.055,1.06,1.02],metal,false);
box(soapWall,"soap dispenser bottle",[.10,.17,.105],[.12,1.09,1.02],new THREE.MeshStandardMaterial({color:"#dce5d4",roughness:.28,metalness:.08}));
box(soapWall,"soap dispenser pump neck",[.035,.045,.035],[.12,1.20,1.02],porcelain,false);
box(soapWall,"soap dispenser pump head",[.11,.022,.035],[.155,1.225,1.02],porcelain,false);
const drain=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.008,28),metal); drain.position.set(1.24,.024,.25); scene.add(drain);

const assets = [
  {id:"cabinet",num:2,name:"黄色格栅浴室柜",area:"西侧 / 入门左边",file:"cabinet-isolated-v3.glb",focus:[.30,.45,.54],size:[.68,.80,.49],yaw:Math.PI/2},
  {id:"basin",num:3,name:"蓝白渐变台上盆",area:"浴室柜台面",file:"basin-isolated-v3.glb",focus:[.31,.95,.54],size:[.46,.20,.46],yaw:0},
  {id:"lamp",num:6,name:"双头彩色玻璃壁灯",area:"镜框上方",file:"double-lamp.glb",focus:[.10,2.12,.54],size:[.56,.34,.24],yaw:Math.PI/2},
  {id:"toilet",num:7,name:"白色坐便器",area:"西侧深处 · 朝东",file:"toilet.glb",focus:[.26,.54,1.24],size:[.70,.76,.46],yaw:Math.PI/2},
  {id:"showerhead",num:15,name:"黑色顶喷与手持花洒",area:"东墙 · 含混水阀与软管",file:"shower-black-v2.glb",focus:[1.15,1.375,1.24],size:[.30,1.65,.50],yaw:-Math.PI/2},
];
const statusText={ready:"已就位",loading:"模型载入中",planned:"场景细节"};
function renderList(){
  const list=$("#object-list");
  const rows=[
    ...assets.map(a=>({...a,state:"loading"})),
    {id:"faucet",num:4,name:"镀铬高身水龙头",area:"台盆后缘",focus:[.16,1.08,.54],state:"ready"},
    {id:"mirror",num:5,name:"黑框镜子",area:"洗手台上方 · 原白色壁柜位置",focus:[.072,1.66,.54],state:"ready"},
    {id:"tile",num:1,name:"蓝色白缝砖与白色菱形砖",area:"下半墙同地砖 · 上半墙白砖",state:"ready"},
    {id:"towel",num:8,name:"毛巾架与挂巾",area:"西墙上部",state:"planned"},
    {id:"rack",num:9,name:"转角置物架与洗漱用品",area:"毛巾旁 · 西北墙角",state:"planned"},
    {id:"toilet-paper",num:10,name:"卫生纸架",area:"马桶水箱附近",state:"planned"},
    {id:"window",num:11,name:"嵌墙百叶窗",area:"北墙右侧 · 窗洞可见室外",state:"planned"},
    {id:"drain",num:12,name:"地漏",area:"东南侧地面",state:"planned"},
    {id:"soap",num:13,name:"墙装按压式洗手液瓶",area:"马桶旁西墙",state:"planned"},
    {id:"door",num:14,name:"东南入口与门扇",area:"南墙东端 · 约 64 cm 门洞",state:"planned"},
  ].sort((a,b)=>a.num-b.num);
  list.replaceChildren();
  for(const item of rows){
    const b=document.createElement("button"); b.className="object-row"; b.dataset.object=item.id;
    b.innerHTML=`<span class="object-number">${String(item.num).padStart(2,"0")}</span><span class="object-copy"><strong>${item.name}</strong><small>${item.area}</small></span><span class="asset-state ${item.state}">${statusText[item.state]}</span>`;
    b.addEventListener("click",()=>focusItem(item)); list.append(b);
  }
}
function focusItem(item){
  document.querySelectorAll(".object-row").forEach(b=>b.classList.toggle("active",b.dataset.object===item.id));
  const localTarget=item.focus||({tile:[.71,.32,.85],rack:[toiletriesCorner[0],toiletriesCorner[1]+.08,toiletriesCorner[2]],window:[windowOpening.x,windowOpening.y,1.74],towel:[.20,1.8,1.2],door:[1.18,.8,.12],"toilet-paper":[.18,.68,.97],soap:[.12,1.09,1.02],drain:[1.24,.2,.25]}[item.id]||[.71,1,.85]);
  const target=new THREE.Vector3(1.42-localTarget[0],localTarget[1],localTarget[2]);
  controls.target.copy(target);
  const offset=camera.position.clone().sub(controls.target).normalize().multiplyScalar(1.85);
  camera.position.copy(target).add(offset);
}
renderList();

const loader=new GLTFLoader(); let loaded=0;
function loadAsset(asset){
  return new Promise(resolve=>loader.load(`/assets/${asset.file}`,gltf=>{
    const model=gltf.scene; model.updateMatrixWorld(true);
    let bounds=new THREE.Box3().setFromObject(model); const source=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    // Normalize in detached local space before any room reflection or placement.
    model.position.sub(new THREE.Vector3(center.x,bounds.min.y,center.z));
    const normalized=new THREE.Group(); normalized.add(model);
    normalized.scale.set(asset.size[0]/Math.max(source.x,.001),asset.size[1]/Math.max(source.y,.001),asset.size[2]/Math.max(source.z,.001));
    const target=new THREE.Group(); target.name=`hyper3d-${asset.id}`; target.rotation.y=asset.yaw;
    target.add(normalized);
    target.position.set(asset.focus[0],asset.focus[1]-asset.size[1]/2,asset.focus[2]);
    scene.add(target);
    target.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true; if(o.material){o.material.side=THREE.DoubleSide;}}});
    fallback.get(asset.id)?.traverse(o=>{o.visible=false;});
    const row=document.querySelector(`[data-object="${asset.id}"] .asset-state`); if(row){row.textContent="Hyper3D 已加载";row.className="asset-state ready";}
    loaded++; resolve(true);
  },undefined,()=>{const row=document.querySelector(`[data-object="${asset.id}"] .asset-state`); if(row){row.textContent="使用场景模型";row.className="asset-state planned";} resolve(false);}));
}
async function loadQueue(){
  for(let i=0;i<assets.length;i+=2) await Promise.all(assets.slice(i,i+2).map(loadAsset));
  $("#loading").classList.add("hidden");
  $("#asset-summary").textContent=`${loaded} 个 Hyper3D 独立模型已加载`;
}
loadQueue().then(()=>{
});

const views={
  overview:{camera:[.71,2.45,-3.1],target:[.71,1,.91],label:"空间全景"},
  vanity:{camera:[-.98,1.65,-.48],target:[1.18,1.26,.53],label:"洗手台与铁艺镜"},
  toilet:{camera:[-1.53,1.78,2.72],target:[.64,1.05,1.24],label:"马桶与东墙淋浴"},
  top:{camera:[.71,4.3,.86],target:[.71,.35,.86],label:"俯视布局"},
};
function setView(key){
  const v=views[key],detail=key==="vanity"||key==="toilet";
  // Cut away the near wall in detail views so the selected fixture stays visible.
  for(const child of scene.children){
    if(/^east (wall|blue|beige)|^tile transition east|^southeast entrance/.test(child.name)) child.visible=!detail;
    if(/^north (wall|blue|beige)|^tile transition north/.test(child.name)) child.visible=key!=="toilet";
  }
  door.visible=!detail;
  camera.up.set(0,key==="top"?0:1,key==="top"?1:0);camera.position.set(...v.camera);controls.target.set(...v.target);controls.update();document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("selected",b.dataset.view===key));
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
$("#reset-view").addEventListener("click",()=>setView("overview"));
let night=false;
$("#day-toggle").addEventListener("click",()=>{night=false;$("#day-toggle").classList.add("active");$("#night-toggle").classList.remove("active");scene.background.set("#d9d6cb");hemi.intensity=1.6;sun.intensity=2.2;vanityGlow.intensity=.15;});
$("#night-toggle").addEventListener("click",()=>{night=true;$("#night-toggle").classList.add("active");$("#day-toggle").classList.remove("active");scene.background.set("#262d32");hemi.intensity=.50;sun.intensity=.28;vanityGlow.intensity=3.3;});
$("#reference-toggle").addEventListener("click",()=>$("#reference-card").hidden=false);
$("#close-reference").addEventListener("click",()=>$("#reference-card").hidden=true);
document.querySelectorAll('#reference-card img').forEach(img=>{
  const showLocalOnly=()=>{img.hidden=true;const caption=img.closest('figure')?.querySelector('figcaption');if(caption)caption.textContent='参考照片仅保存在本地';};
  img.addEventListener('error',showLocalOnly);
  if(img.complete&&!img.naturalWidth)showLocalOnly();
});

function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}
new ResizeObserver(resize).observe(host); resize();
function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera);} animate();
