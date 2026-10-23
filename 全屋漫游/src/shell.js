import * as T from 'three';
import {ROOM_DEFS,HEIGHT,DOORS,OUTLINE,roomAt,contains} from './layout.js';
import {floralWallpaper,woodFloor} from '../../主卧漫游/src/textures.js';
import {guestFloor} from '../../儿童房漫游/src/materials.js';

const mat=(color,roughness=.85)=>new T.MeshStandardMaterial({color,roughness});
function pattern(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const m=new T.CanvasTexture(c);m.colorSpace=T.SRGBColorSpace;m.wrapS=m.wrapT=T.RepeatWrapping;m.anisotropy=4;return m;}
function tile(base,line,diagonal=false,ornament=false){return pattern((c,n)=>{c.fillStyle=base;c.fillRect(0,0,n,n);c.strokeStyle=line;c.lineWidth=3;if(diagonal){c.beginPath();for(let k=-n;k<=n*2;k+=n/2){c.moveTo(k,0);c.lineTo(k+n,n);c.moveTo(k,n);c.lineTo(k+n,0);}c.stroke();}else for(const v of [0,n/2,n]){c.strokeRect(v,0,n/2,n);c.strokeRect(0,v,n,n/2);}if(ornament)for(const x of [0,n/2,n])for(const y of [0,n/2,n]){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle='#d9bf94';c.fillRect(-17,-17,34,34);c.strokeStyle='#7b623f';c.lineWidth=3;c.strokeRect(-13,-13,26,26);c.restore();}});}
export function makeShell(scene){
 const root=new T.Group();root.name='全屋统一墙体';scene.add(root);const floors=[],walls=[],segments=[],ceilings=new T.Group(),windows=new T.Group(),doors=new T.Group();root.add(ceilings,windows,doors);ceilings.name='全屋顶面';windows.name='外窗';doors.name='共享门洞与木门';
 const baseShape=new T.Shape();OUTLINE.forEach(([x,z],i)=>i?baseShape.lineTo(x,-z):baseShape.moveTo(x,-z));baseShape.closePath();const foundation=new T.Mesh(new T.ExtrudeGeometry(baseShape,{depth:.14,bevelEnabled:false}),mat('#bdb29c'));foundation.rotation.x=-Math.PI/2;foundation.position.y=-.14;foundation.name='沿完整户型轮廓的一体楼板';foundation.receiveShadow=true;root.add(foundation);
 const cutPlane=new T.Plane(new T.Vector3(0,-1,0),.72),edge=mat('#eee8db'),trim=mat('#ede3ce');edge.clippingPlanes=[cutPlane];trim.clippingPlanes=[cutPlane];
 edge.clipShadows=trim.clipShadows=true;
 const floorMaps={public:tile('#ad673c','#d4b48c',true,true),bathroom1:tile('#31556b','#e6e8de'),bathroom2:tile('#b67e5b','#d1bba6'),kitchen:tile('#888d7d','#e3dfca',true),junction:tile('#d5c5a6','#eee7d7')};
 const floral=floralWallpaper(),planks=woodFloor();
 function floorMaterial(id){if(id==='master'){const map=planks.clone();map.repeat.set(3.4,2.2);return new T.MeshStandardMaterial({map,roughness:.76});}if(id==='children'||id==='guest')return guestFloor();const map=(floorMaps[id]||floorMaps.public).clone();map.repeat.set(1,1);return new T.MeshStandardMaterial({map,roughness:.8});}
 function surface(poly,material,y=0){const shape=new T.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();const geo=new T.ShapeGeometry(shape),p=geo.attributes.position,u=geo.attributes.uv;for(let i=0;i<p.count;i++)u.setXY(i,p.getX(i)/1.2,-p.getY(i)/1.2);const mesh=new T.Mesh(geo,material);mesh.rotation.x=-Math.PI/2;mesh.position.y=y;mesh.receiveShadow=true;return mesh;}
 for(const r of ROOM_DEFS){if(r.id==='balcony')continue;const f=surface(r.poly,floorMaterial(r.id),.006);f.name=r.name+'地面';f.userData.room=r.id;root.add(f);floors.push(f);const roof=surface(r.poly,mat('#f0ebe0'),HEIGHT);roof.material.side=T.DoubleSide;roof.name=r.name+'顶面';ceilings.add(roof);}
 // One shared base follows the house, not ten separate floating room boxes.
 for(const r of ROOM_DEFS){if(r.id==='balcony')continue;const base=surface(r.poly,mat('#9f927b'),-.12);root.add(base);}
 const wallTexture=tile('#f4f1e8','#d4cfbf',true),bathBlue=tile('#31556b','#e6e8de');
 const cache=new Map();
 function wallMaterial(room,w,h,bottom){const id=room?.id||'outside',key=[id,w.toFixed(2),h.toFixed(2),bottom].join(':');if(cache.has(key))return cache.get(key);let m;
   if(id==='master'){const map=floral.clone();map.repeat.set(w/1.45,h/1.65);m=new T.MeshStandardMaterial({map,roughness:1});}
   else if(id==='bathroom1'||id==='bathroom2'||id==='kitchen'){const source=id==='bathroom1'?(bottom<.87?bathBlue:wallTexture):id==='bathroom2'?floorMaps.bathroom2:wallTexture;const map=source.clone();map.repeat.set(w/.60,h/.60);m=new T.MeshStandardMaterial({map,roughness:.85});}
   else m=mat(({children:'#efcbd4',guest:'#c4d5da',junction:'#e3e5cb',outside:'#eee9df'})[id]||'#ede3cb');
   m.clippingPlanes=[cutPlane];m.clipShadows=true;cache.set(key,m);return m;
 }
 function box(name,w,h,d,x,y,z,m,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;}
 function segment(a,b,{bottom=0,top=HEIGHT,thickness=.13,collision=true}={}){
   const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);if(len<.004||top<=bottom)return;const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2,n=[-dz/len,dx/len];const front=roomAt(x+n[0]*.11,z+n[1]*.11),back=roomAt(x-n[0]*.11,z-n[1]*.11);
   // Split wainscot at the same height on both sides, preserving each room's finish.
   const levels=[bottom,...(bottom<.86&&top>.86?[.86]:[]),top];for(let i=0;i<levels.length-1;i++){const lo=levels[i],hi=levels[i+1],mats=[edge,edge,edge,edge,wallMaterial(front,len,hi-lo,lo),wallMaterial(back,len,hi-lo,lo)];const w=box('共享墙体',len,hi-lo,thickness,x,(hi+lo)/2,z,mats);w.rotation.y=-Math.atan2(dz,dx);walls.push(w);}
   if(bottom===0){const sk=box('连续踢脚线',len,.075,thickness+.018,x,.04,z,trim);sk.rotation.y=-Math.atan2(dz,dx);walls.push(sk);}
   if(collision&&bottom<1.65&&top>.2)segments.push({a,b,thickness});
 }
 function opening(a,b,start,width,{sill=0,head=2.20}={}){const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const p=t=>[a[0]+(b[0]-a[0])*t/len,a[1]+(b[1]-a[1])*t/len];segment(a,p(start));segment(p(start+width),b);segment(p(start),p(start+width),{bottom:head});if(sill>0)segment(p(start),p(start+width),{top:sill});return [p(start),p(start+width)];}
 function chain(points){for(let i=0;i<points.length-1;i++)segment(points[i],points[i+1]);}
 // Outer contour from the confirmed plan, with bay windows and real wall recesses.
 opening([-1.65,1.625],[1.65,1.625],2.40,.90,{head:2.30});segment([1.65,1.625],[4.65,1.625]);
 opening([4.65,1.625],[4.65,-.355],.25,1.30,{sill:.95,head:2.25});segment([4.65,-.355],[3.90,-.355]);opening([3.90,-.355],[3.90,-1.625],.077,.652,{sill:1.62,head:2.12});segment([3.90,-1.625],[5.15,-1.625]);
 opening([5.15,-1.625],[5.15,-5.225],1.555,1.42,{sill:.9,head:2.44});segment([5.15,-5.225],[4.59,-5.225]);opening([4.59,-5.225],[4.59,-6.925],.11,.84,{sill:1.66,head:2.16});
 chain([[4.59,-6.925],[4.59,-10.555],[3.8,-10.555]]);segment([3.8,-10.555],[3.8,-11.255]);opening([3.8,-11.255],[2.2,-11.255],.04,1.52,{sill:.70,head:2.35});segment([2.2,-11.255],[2.2,-10.555]);chain([[2.2,-10.555],[.93,-10.555],[-.25,-10.555],[-.25,-10.755]]);
 opening([-.25,-10.755],[-3.10,-10.755],.075,2.70,{head:2.35});chain([[-3.10,-10.755],[-3.10,-10.21],[-3.45,-10.21],[-3.45,-9.45],[-3.10,-9.45],[-3.10,-6.075]]);
 opening([-3.10,-6.075],[-3.55,-4.00],.12,1.35,{sill:.65,head:2.4});opening([-3.55,-4],[-3.10,-3.08],.06,.89,{sill:.65,head:2.4});chain([[-3.10,-3.08],[-3.10,-1.865],[-2.89,-1.865],[-2.89,-1.625],[-1.65,-1.625],[-1.65,1.625]]);
 // Shared interior partitions. No two adjoining rooms own duplicate walls.
 segment([-3.10,-6.075],[-.25,-6.075]);opening([-.25,-6.075],[-.25,-7.75],.10,.90);chain([[-.25,-7.75],[.34,-7.75],[.34,-10.555]]);opening([.34,-7.75],[1.65,-7.75],.21,.90);segment([-.25,-6.075],[-.25,-5.675]);segment([1.65,-7.75],[1.65,-6.925]);segment([1.65,-6.925],[4.59,-6.925]);
 opening([1.65,-6.925],[1.65,-5.675],.60,.64);segment([1.65,-5.675],[1.65,-5.225]);segment([1.65,-5.225],[4.59,-5.225]);opening([2.00,-5.225],[2.00,-1.625],.25,.80);segment([1.65,-1.625],[3.90,-1.625]);segment([1.65,-1.625],[1.65,-.355]);opening([1.65,-.355],[3.90,-.355],.02,.60);
 // Doors are open against their destination wall so all rooms can be visited continuously.
 const wood=mat('#986e47'),inset=mat('#ad825a'),brass=mat('#a28543');
 for(const d of DOORS){if(d.openPlan||d.slider)continue;const dx=d.b[0]-d.a[0],dz=d.b[1]-d.a[1],len=Math.hypot(dx,dz),g=new T.Group();g.position.set(...[d.a[0],0,d.a[1]]);g.rotation.y=-Math.atan2(dz,dx);g.name=d.id;doors.add(g);
   const leaf=new T.Group();leaf.rotation.y=d.id==='bath2-door'?-Math.PI*.49:Math.PI*.49;g.add(leaf);box('木质门扇',len-.05,2.12,.035,(len-.05)/2,1.06,0,wood,leaf);for(const y of [.60,1.55])box('木门饰板',len-.18,.65,.016,(len-.05)/2,y,.025,inset,leaf);box('黄铜门把',.075,.035,.065,len-.13,1.04,.05,brass,leaf);
   for(const x of [-.025,len+.025])box('木门框',.06,2.23,.17,x,1.115,0,wood,g);box('门楣',len+.11,.07,.17,len/2,2.23,0,wood,g);box('门槛',len,.018,.18,len/2,.014,0,trim,g);
 }
 function window(a,b,sill,head){const dx=b[0]-a[0],dz=b[1]-a[1],w=Math.hypot(dx,dz),g=new T.Group();g.position.set((a[0]+b[0])/2,0,(a[1]+b[1])/2);g.rotation.y=-Math.atan2(dz,dx);windows.add(g);const frame=mat('#e3ddce'),glass=new T.MeshStandardMaterial({color:'#c2dce1',transparent:true,opacity:.17,roughness:.24,side:T.DoubleSide,depthWrite:false});for(const x of [-w/2,0,w/2])box('窗框',.035,head-sill,.07,x,(sill+head)/2,0,frame,g);for(const y of [sill,head])box('窗横框',w,.035,.07,0,y,0,frame,g);box('窗玻璃',w,head-sill,.007,0,(head+sill)/2,0,glass,g);}
 window([4.65,1.375],[4.65,.075],.95,2.25);window([2.24,-11.255],[3.76,-11.255],.70,2.35);
 // Children bay side glazing, attached to the same outline.
 window([2.2,-10.555],[2.2,-11.255],.70,2.35);window([3.8,-11.255],[3.8,-10.555],.70,2.35);
 const baySill=surface([[2.2,-10.555],[3.8,-10.555],[3.8,-11.255],[2.2,-11.255]],mat('#f3ece1'),.70);root.add(baySill);
 const labelMeshes=[];
 function blocked(x,z,r=.13){if(!contains(x,z))return true;return segments.some(s=>{const [ax,az]=s.a,[bx,bz]=s.b,dx=bx-ax,dz=bz-az,t=T.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-ax-t*dx,z-az-t*dz)<r+s.thickness/2;});}
 return {root,floors,walls,segments,ceilings,windows,doors,cutPlane,blocked,
   setPresentation({walking=false,fullWalls=false,plan=false}){cutPlane.constant=walking||fullWalls?HEIGHT+.12:.72;ceilings.visible=walking;windows.visible=walking||fullWalls;doors.traverse(o=>{if(o.isMesh){if(!o.userData.originalMaterial)o.userData.originalMaterial=o.material;const materials=Array.isArray(o.material)?o.material:[o.material];for(const m of materials)m.clippingPlanes=walking||fullWalls?null:[cutPlane];}});},
   surface,box
 };
}
