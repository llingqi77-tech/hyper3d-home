import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export const BALCONY={width:3.10,depth:1.65,height:2.72};
export const MODEL_FILES=['washingMachine','bucket','plantRack','washStand','faucet','soapDish','washboard','broom'];
const material=(color,roughness=.75,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function canvasTexture(draw,size=512){const canvas=document.createElement('canvas');canvas.width=canvas.height=size;draw(canvas.getContext('2d'),size);const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.wrapS=map.wrapT=T.RepeatWrapping;map.anisotropy=4;return map;}
function mosaicTexture(){return canvasTexture((ctx,s)=>{
  ctx.fillStyle='#d4b878';ctx.fillRect(0,0,s,s);const step=s/8;
  for(let y=0;y<8;y++)for(let x=0;x<8;x++){const shift=Math.sin(x*5+y*17)*9;ctx.fillStyle=`rgb(${188+shift},${158+shift},${101+shift})`;ctx.fillRect(x*step+1.1,y*step+1.1,step-2.2,step-2.2);ctx.strokeStyle='#efdba8';ctx.lineWidth=1;ctx.strokeRect(x*step+1.4,y*step+1.4,step-2.8,step-2.8);}
});}
function tileTexture(){return canvasTexture((ctx,s)=>{
  const step=s/4;ctx.fillStyle='#b99872';ctx.fillRect(0,0,s,s);
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=Math.sin(x*19+y*9)*8;ctx.fillStyle=`rgb(${145+v},${78+v},${49+v})`;ctx.fillRect(x*step+2,y*step+2,step-4,step-4);
    const grad=ctx.createLinearGradient(x*step,y*step,(x+1)*step,(y+1)*step);grad.addColorStop(0,'#e2ab6b1b');grad.addColorStop(1,'#29160c1b');ctx.fillStyle=grad;ctx.fillRect(x*step+2,y*step+2,step-4,step-4);}
});}

// Local +Z is outdoors. When stepping out, the photographed right end is local -X.
export async function createBalcony({assetBase,onProgress=()=>{},withDoorFrame=false}={}){
  const {width:W,depth:D,height:H}=BALCONY;
  const root=new T.Group();root.name='主卧阳台完整场景';const objects=new Map();
  const dark=material('#373b32',.44,.55),stone=material('#aa8d72'),trim=material('#d9c9a7');
  function box(name,w,h,d,x,y,z,m,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
  function cylinder(name,r,h,x,y,z,m,parent=root){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,18),m);o.name=name;o.position.set(x,y,z);o.castShadow=true;parent.add(o);return o;}
  const floorMap=tileTexture();floorMap.repeat.set(W/1.8,D/1.8);floorMap.rotation=Math.PI/4;
  const floor=new T.Mesh(new T.PlaneGeometry(W,D),new T.MeshStandardMaterial({map:floorMap,roughness:.68,side:T.DoubleSide}));floor.name='斜缝红棕地砖';floor.rotation.x=-Math.PI/2;floor.position.set(0,.005,D/2);floor.receiveShadow=true;root.add(floor);
  box('阳台楼板',W,.10,D,0,-.05,D/2,stone);
  const walls={right:new T.Group(),left:new T.Group()};
  function endWall(group,x,rotation){
    const map=mosaicTexture();map.repeat.set(D/.72,H/.72);
    const plane=new T.Mesh(new T.PlaneGeometry(D,H),new T.MeshStandardMaterial({map,roughness:.86,side:T.DoubleSide}));plane.position.set(x,H/2,D/2);plane.rotation.y=rotation;plane.receiveShadow=true;group.add(plane);root.add(group);
    box('黄色砖墙脚线',.04,.12,D,x+(x>0?-.02:.02),.06,D/2,trim,group);
  }
  endWall(walls.right,-W/2,Math.PI/2);endWall(walls.left,W/2,-Math.PI/2);
  const ceiling=box('阳台顶棚',W,.055,D,0,H,D/2,material('#ece4cf'));
  box('外侧窗台',W,.07,.18,0,.10,D,stone);
  for(let x=-W/2+.08;x<W/2;x+=.16)box('防护栏竖杆',.025,1.09,.025,x,.64,D-.025,dark);
  for(const y of [.18,1.16,2.48])box('深色窗框横梁',W,.055,.065,0,y,D,dark);
  for(const x of [-W/2,0,W/2])box('外窗框立柱',.055,2.50,.07,x,1.25,D,dark);
  const glass=new T.MeshPhysicalMaterial({color:'#c8d8cf',roughness:.08,transparent:true,opacity:.10,side:T.DoubleSide,depthWrite:false});
  box('阳台外窗玻璃',W-.10,2.32,.008,0,1.31,D+.012,glass);
  if(withDoorFrame){
    for(const x of [-W/2,W/2])box('通往主卧的门框',.065,2.35,.075,x,1.175,0,dark);
    box('主卧推拉门上轨',W,.055,.075,0,2.35,0,dark);
    box('主卧门槛',W,.025,.10,0,.015,0,trim);
  }
  const city=new T.TextureLoader().load(`${assetBase}city-view.jpg`);city.colorSpace=T.SRGBColorSpace;city.repeat.set(.93,.85);city.offset.set(.035,.10);
  const cityPlane=new T.Mesh(new T.PlaneGeometry(5.1,3.45),new T.MeshBasicMaterial({map:city,side:T.DoubleSide}));cityPlane.name='阳台实际外景';cityPlane.position.set(0,1.80,D+.55);root.add(cityPlane);
  // Two visible floor drains and the exposed utility pipe from the reference.
  for(const [x,z] of [[-.68,.55],[.95,1.10]]){
    box('地漏边框',.13,.009,.13,x,.012,z,material('#b79859',.42,.55));
    for(let i=0;i<5;i++)box('地漏格栅',.093,.010,.008,x,.018,z-.04+i*.02,dark);
  }
  cylinder('墙角上水管',.013,H-.10,-W/2+.035,H/2,.16,material('#888980',.5,.45));
  const washZone=new T.Group();washZone.name='左侧洗衣台区域';washZone.position.set(1.21,0,.66);washZone.rotation.y=-Math.PI/2;root.add(washZone);
  const specs=[
    ['washingMachine',root,[-1.20,0,.38],Math.PI/2],
    ['bucket',root,[-.59,0,1.07],0],
    ['plantRack',root,[-1.265,0,1.18],Math.PI/2],
    ['washStand',washZone,[0,0,0],0],
    ['faucet',washZone,[-.10,.90,-.24],0],
    ['soapDish',washZone,[.31,.90,-.17],0],
    ['washboard',washZone,[.31,.925,.07],0],
    ['broom',root,[-.81,0,.745],Math.PI/2]
  ];
  const loader=new GLTFLoader();
  for(const [file,parent,position,yaw] of specs){
    const model=(await loader.loadAsync(`${assetBase}${file}.glb`)).scene;model.name=file;model.position.set(...position);model.rotation.y=yaw;
    if(file==='washboard')model.rotation.x=-.28;
    model.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});parent.add(model);objects.set(file,model);onProgress(file);
  }
  const streamMat=new T.MeshPhysicalMaterial({color:'#b4e3e6',transparent:true,opacity:.68,roughness:.14,metalness:.12});
  const stream=cylinder('水龙头水流',.007,.45,-.10,.86,-.10,streamMat,washZone);stream.visible=false;
  const ripple=new T.Mesh(new T.RingGeometry(.025,.033,32),new T.MeshBasicMaterial({color:'#c4e5e5',transparent:true,opacity:.6,side:T.DoubleSide}));ripple.rotation.x=-Math.PI/2;ripple.position.set(-.10,.636,-.10);ripple.visible=false;washZone.add(ripple);
  let covered=true,waterRunning=false,time=0;
  return {
    root,objects,
    setCovered(value){covered=value;const cover=objects.get('washingMachine').getObjectByName('washer-cover');if(cover)cover.visible=covered;},
    setWaterRunning(value){waterRunning=value;stream.visible=ripple.visible=value;},
    update(dt,cameraPosition){
      time+=dt;if(waterRunning){stream.scale.x=1+Math.sin(time*22)*.11;const scale=1+(time%1)*1.6;ripple.scale.setScalar(scale);ripple.material.opacity=.65*(1-time%1);}
      root.updateWorldMatrix(true,false);const p=root.worldToLocal(cameraPosition.clone());
      walls.right.visible=p.x>-W/2+.03;walls.left.visible=p.x<W/2-.03;ceiling.visible=p.y<H-.03;
    },
    get covered(){return covered;},get waterRunning(){return waterRunning;}
  };
}
