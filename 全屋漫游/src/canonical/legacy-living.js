import * as THREE from 'three';
import {buildArchitecture} from '../../../餐厅交互/architecture.js';
import {buildLiving} from '../../../餐厅交互/living.js';

// The original living room is part of the dining-page design. Rebuild that
// source scene separately so its sofas, TV, desk and shared tile UVs survive.
export async function createLiving({assetUrl, renderer, onProgress=()=>{}}){
 const scene=new THREE.Scene();
 scene.add(new THREE.HemisphereLight(0xfff8e9,0xc4aa8b,2.15));
 const daylight=new THREE.DirectionalLight(0xfff4dc,1.5);
 daylight.position.set(-4,10,5);daylight.castShadow=true;daylight.shadow.mapSize.set(2048,2048);
 Object.assign(daylight.shadow.camera,{left:-9,right:9,top:12,bottom:-8,near:.1,far:30});
 daylight.shadow.bias=-.0005;daylight.shadow.normalBias=.025;scene.add(daylight);
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.83,...extra});
 const trim=mat('#ebdec0'),wall=mat('#efe4bf'),S=Math.SQRT2;
 function box(w,h,d,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function canvasTexture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=renderer.capabilities.getMaxAnisotropy();return t;}
 let seed=89;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const tile=canvasTexture(1024,(c,n)=>{c.fillStyle='#b99a72';c.fillRect(0,0,n,n);const g=c.createLinearGradient(0,0,n,n);g.addColorStop(0,'#b56635');g.addColorStop(.55,'#a45229');g.addColorStop(1,'#c47a43');c.fillStyle=g;c.fillRect(5,5,n-10,n-10);for(let i=0;i<42000;i++){c.fillStyle=random()>.5?'rgba(255,223,153,.035)':'rgba(56,20,4,.025)';c.fillRect(random()*n,random()*n,random()*9+1,random()*8+1)}c.strokeStyle='#d28d52';c.lineWidth=3;c.strokeRect(10,10,n-20,n-20);for(const x of [0,n])for(const y of [0,n]){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#e0c39a';c.fillRect(-62,-62,124,124);c.strokeStyle='#755735';c.lineWidth=6;c.strokeRect(-51,-51,102,102);c.lineWidth=3;c.strokeRect(-39,-39,78,78);c.fillStyle='#876744';for(let a=0;a<8;a++){c.save();c.rotate(a*Math.PI/4);c.beginPath();c.ellipse(0,19,6,13,0,0,Math.PI*2);c.fill();c.restore()}c.restore()}});
 tile.wrapS=tile.wrapT=THREE.RepeatWrapping;
 const architecture=buildArchitecture({scene,wall,trim,tile,box,mat,canvasTexture,LEFT:-1.65,RIGHT:1.65,ENTRY:1.625,FRONT:-1.625});
 architecture.root.scale.set(S,1,S);
 for(const floor of architecture.root.children.filter(o=>o.isMesh&&o.geometry?.attributes?.uv&&['Dining','Living room with bay','Connected hall','Kitchen','Bathroom 2','Guest room','Bathroom 1','Child room with bay','Main bedroom','Entry landing'].includes(o.name))){const uv=floor.geometry.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*S,uv.getY(i)*S);uv.needsUpdate=true;}
 const obstacles=[];
 const living=buildLiving({scene,box,obstacles,assetUrl:p=>assetUrl(p)});
 for(const o of living.root.children){o.position.x*=S;o.position.z*=S;}
 living.objects.get('餐客厅拱门').scale.x=S;
 living.objects.get('西侧窗与阳台').scale.z=S;
 living.ceiling.scale.set(S,1,S);
 // Keep every source mesh for provenance, but render only living-side walls.
 const externalContext=[];
 for(const o of architecture.root.children){
  if(o.name==='Living room with bay')continue;
  const b=new THREE.Box3().setFromObject(o);
  if(o.name||b.max.x>1.74*S||b.min.x< -3.62*S||b.min.z< -5.52*S||b.max.z> -1.50*S){o.userData.externalContext=true;externalContext.push(o);}
 }
 const shell=architecture.root.children.filter(o=>!o.userData.externalContext&&o.isMesh&&o.geometry?.parameters?.height>.5);
 onProgress('旧版客厅 · 碎花沙发、电视、绿色书桌');
 return {scene,native:{width:5.2*S,depth:3.75*S,height:2.9},objects:living.objects,architecture,shell,externalContext,ceiling:living.ceiling,renderSettings:{exposure:1.15,environmentIntensity:1,environment:false,fov:66},views:{overview:{position:[1.5,5,1],target:[-.7,.8,-3.5*S]}},setPresentation({walking=false,fullWalls=false}={}){for(const o of externalContext)o.visible=false;for(const o of shell)o.visible=walking||fullWalls;living.ceiling.visible=walking||fullWalls;}};
}
