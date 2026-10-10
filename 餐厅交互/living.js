import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// World coordinates are shared with the original dining scene.
// The living room sits north of z=-1.625. Dimensions without plan labels are estimates.
export function buildLiving({scene,box,obstacles}){
  const root=new THREE.Group();root.name='客厅陈设';scene.add(root);
  const ceiling=new THREE.Group();ceiling.name='客厅吊顶';scene.add(ceiling);
  const objects=new Map();
  const material=(color,roughness=.85,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const m={
    wood:material('#693b28',.62),woodLight:material('#926542',.72),
    cream:material('#eee4d3'),arch:material('#eadcc5'),
    sage:material('#929d69'),green:material('#516b43'),
    black:material('#231f1d',.38),brass:material('#a17a43',.38,.58),
    curtain:material('#b8a789',.94),cane:material('#b5a276'),
    porcelain:material('#f2eee4',.25),red:material('#9a3b2c',.76)
  };
  function mesh(geo,mat,x=0,y=0,z=0,parent=root){
    const obj=new THREE.Mesh(geo,mat);obj.position.set(x,y,z);obj.castShadow=true;obj.receiveShadow=true;parent.add(obj);return obj;
  }
  const cube=(w,h,d,mat,x,y,z,parent=root)=>mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);
  const rounded=(w,h,d,r,mat,x,y,z,parent=root)=>mesh(new RoundedBoxGeometry(w,h,d,3,r),mat,x,y,z,parent);
  const cylinder=(r1,r2,h,mat,x,y,z,parent=root)=>mesh(new THREE.CylinderGeometry(r1,r2,h,20),mat,x,y,z,parent);
  const ball=(r,mat,x,y,z,parent=root)=>mesh(new THREE.SphereGeometry(r,16,12),mat,x,y,z,parent);
  function group(name,x=0,y=0,z=0,rotation=0){
    const g=new THREE.Group();g.name=name;g.position.set(x,y,z);g.rotation.y=rotation;root.add(g);objects.set(name,g);return g;
  }
  function block(x,z,w,d){obstacles.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2})}
  function rod(a,b,r,mat,parent=root){
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
    const o=mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),mat,0,0,0,parent);
    o.position.copy(start.add(end).multiplyScalar(.5));
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;
  }
  // Floral cloth uses a locally generated pattern, based on the supplied sofa photographs.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#e9e4d8';ctx.fillRect(0,0,512,512);
  let seed=17;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let i=0;i<25;i++){
    const x=random()*512,y=random()*512,r=15+random()*16;
    ctx.strokeStyle='#78866b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+18,y+25,x+30,y+42);ctx.stroke();
    for(const side of[-1,1]){
      ctx.fillStyle=side<0?'#829879':'#6e8a71';ctx.beginPath();ctx.ellipse(x+16+side*10,y+27,7,13,side*.7,0,Math.PI*2);ctx.fill();
    }
    for(let petal=0;petal<7;petal++){
      const a=petal*Math.PI*2/7+random()*.18;
      ctx.fillStyle=['#b76c70','#c88786','#9f5662','#d3a2a0'][petal%4];
      ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.43,r*.70,a,0,Math.PI*2);ctx.fill();
    }
    ctx.fillStyle='#d4b592';ctx.beginPath();ctx.arc(x,y,r*.25,0,Math.PI*2);ctx.fill();
  }
  const floralTexture=new THREE.CanvasTexture(canvas);
  floralTexture.wrapS=floralTexture.wrapT=THREE.RepeatWrapping;floralTexture.repeat.set(1,1);
  floralTexture.colorSpace=THREE.SRGBColorSpace;
  const fabric=new THREE.MeshStandardMaterial({map:floralTexture,roughness:1});
  function sofa(name,x,z,width,angle){
    const g=group(name,x,0,z,angle);
    cube(width,.18,.78,m.wood,0,.36,0,g);
    cube(width,.16,.13,m.wood,0,.85,.35,g);
    for(const sx of[-1,1]){
      cube(.14,.65,.85,m.wood,sx*(width/2-.03),.53,0,g);
      rounded(.19,.08,.87,.025,m.wood,sx*(width/2-.03),.87,0,g);
    }
    const count=width>1.9?3:2;
    for(let i=0;i<count;i++){
      const px=(i-(count-1)/2)*(width-.25)/count;
      rounded((width-.3)/count-.02,.2,.67,.06,fabric,px,.57,0,g);
      const back=rounded((width-.3)/count-.01,.53,.19,.06,fabric,px,.91,.27,g);
      back.rotation.x=-.10;
    }
    rounded(width-.3,.02,.59,.015,m.cane,0,.68,-.02,g);
    for(const sx of[-1,1])for(const sz of[-1,1])cube(.09,.30,.09,m.wood,sx*(width/2-.12),.15,sz*.30,g);
    block(x,z,Math.abs(angle)>.1?.9:width,Math.abs(angle)>.1?width:.9);
    return g;
  }
  // Plan: one sofa along the west wall, one across the south side.
  sofa('西侧碎花沙发',-2.34,-3.75,1.85,Math.PI/2);
  sofa('南侧碎花沙发',-.58,-2.31,2.02,0);
  const tea=group('客厅茶几',-.68,0,-3.58);
  rounded(1.10,.09,.67,.025,m.wood,0,.56,0,tea);
  cube(1.00,.05,.58,m.wood,0,.18,0,tea);
  for(const x of[-.44,.44])for(const z of[-.25,.25])cube(.075,.5,.075,m.wood,x,.27,z,tea);
  for(let i=0;i<3;i++)cube(.26,.025,.31,material(i%2?'#657668':'#cfb894'),-.22,.63,-.13+i*.04,tea);
  cylinder(.055,.045,.1,m.porcelain,.25,.63,.14,tea);
  block(-.68,-3.58,1.1,.67);
  const television=group('电视墙',-.46,0,-5.16);
  cube(2.15,.63,.38,m.wood,0,.34,0,television);
  cube(1.83,.74,.045,m.black,0,1.48,-.12,television);
  cube(1.91,.82,.025,m.brass,0,1.48,-.15,television);
  cube(1.83,.74,.026,m.black,0,1.48,-.17,television);
  block(-.46,-5.16,2.15,.53);
  const desk=group('绿色书桌与拱形壁龛',-2.42,0,-2.22);
  cube(.96,.075,.43,m.sage,0,.78,0,desk);
  cube(.88,.18,.34,m.sage,0,.61,.03,desk);
  for(const x of[-.40,.40])cube(.06,.52,.06,m.sage,x,.28,.08,desk);
  for(const y of[1.15,1.60,2.05])cube(.91,.045,.34,m.cream,0,y,-.26,desk);
  for(let i=0;i<9;i++)cube(.045,.29,.19,material(i%3?'#9e8c6d':'#657c70'),-.38+i*.09,1.33,-.25,desk);
  const deskArch=new THREE.Shape();deskArch.moveTo(-.55,2.12);deskArch.lineTo(.55,2.12);
  deskArch.absarc(0,2.12,.55,0,Math.PI,false);deskArch.lineTo(-.55,2.12);
  const archTrim=mesh(new THREE.ShapeGeometry(deskArch),m.arch,0,0,-.46,desk);
  archTrim.castShadow=false;
  block(-2.42,-2.22,1.0,.54);
  const chair=group('书桌木椅',-1.73,0,-2.15);
  cube(.35,.06,.36,m.wood,0,.46,0,chair);cube(.35,.45,.06,m.wood,0,.77,.17,chair);
  for(const x of[-.14,.14])for(const z of[-.14,.14])cube(.05,.44,.05,m.wood,x,.22,z,chair);
  block(-1.73,-2.15,.39,.39);
  // True open spandrel at the shared dining/living threshold.
  const portal=group('餐客厅拱门',0,0,-1.625);
  const openingHalf=1.37;
  const shape=new THREE.Shape();
  shape.moveTo(-1.65,2.9);shape.lineTo(1.65,2.9);shape.lineTo(1.65,0);
  shape.lineTo(openingHalf,0);shape.lineTo(openingHalf,2.20);
  shape.bezierCurveTo(openingHalf,2.52,.65,2.68,0,2.69);
  shape.bezierCurveTo(-.65,2.68,-openingHalf,2.52,-openingHalf,2.20);
  shape.lineTo(-openingHalf,0);shape.lineTo(-1.65,0);shape.closePath();
  mesh(new THREE.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:false,curveSegments:30}),m.arch,0,0,-.10,portal);
  // Dark wood skirting and layered plaster ceiling follow the photos.
  for(let i=0;i<3;i++){
    const w=4.65-i*.16,d=3.58-i*.16;
    for(const zz of[-5.29,-1.71])cube(w,.05,.09,m.cream,-.70,2.83-i*.045,zz,ceiling);
    for(const xx of[-3.02,1.62])cube(.09,.05,d,m.cream,xx,2.83-i*.045,-3.50,ceiling);
  }
  const roof=cube(4.68,.06,3.75,m.cream,-.72,2.91,-3.50,ceiling);roof.castShadow=false;
  ceiling.traverse(o=>{if(o.isMesh)o.castShadow=false});
  // Dark five-blade ceiling fan is documented by 客厅风扇.jpg.
  const fan=group('客厅吊扇',-.70,2.65,-3.50);
  cylinder(.12,.12,.14,m.brass,0,.08,0,fan);
  for(let i=0;i<5;i++){
    const a=i*Math.PI*2/5;
    const blade=cube(.75,.026,.16,m.wood,Math.cos(a)*.35,0,Math.sin(a)*.35,fan);
    blade.rotation.y=-a;
  }
  const lamp=new THREE.PointLight(0xffe4b4,2.4,5,2);lamp.position.set(-.7,2.48,-3.5);root.add(lamp);
  // A real window opening exists in the original architecture's western bay.
  const windowGroup=group('西侧窗与阳台',-3.36,0,-4.04);
  const glass=new THREE.MeshPhysicalMaterial({color:'#bdd1c5',roughness:.18,transmission:.55,transparent:true,opacity:.42});
  cube(.025,1.65,.98,glass,0,1.56,0,windowGroup);
  for(const z of[-.50,.50])cube(.06,1.74,.06,m.wood,.04,1.56,z,windowGroup);
  cube(.06,.06,1.06,m.wood,.04,.69,0,windowGroup);
  cube(.06,.06,1.06,m.wood,.04,2.43,0,windowGroup);
  for(let i=0;i<7;i++)cube(.07,1.65,.10,m.curtain,.14,1.56,-.55+i*.035,windowGroup);
  const painting=group('客厅的画',1.48,1.72,-3.95,-Math.PI/2);
  cube(.82,.91,.055,m.wood,0,0,0,painting);
  const paintingMap=new THREE.TextureLoader().load('../客厅的画.jpg');
  paintingMap.colorSpace=THREE.SRGBColorSpace;
  // The source photo includes the surrounding wall; crop its UVs to the canvas itself.
  paintingMap.repeat.set(.794,.517);paintingMap.offset.set(.102,.226);
  cube(.74,.83,.065,new THREE.MeshStandardMaterial({map:paintingMap,roughness:.95}),0,0,.045,painting);
  const plant=group('客厅绿植',1.15,0,-2.48);
  cylinder(.15,.11,.26,m.red,0,.13,0,plant);
  cylinder(.02,.025,.9,m.wood,0,.70,0,plant);
  for(let i=0;i<9;i++){
    const a=i*2.4;const leaf=ball(.14,m.green,Math.cos(a)*.21,.87+(i%3)*.10,Math.sin(a)*.21,plant);
    leaf.scale.set(1,.55,1.1);
  }
  return {root,ceiling,objects,lamp};
}
