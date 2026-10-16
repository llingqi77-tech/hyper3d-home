import * as T from 'three';
import {mat,guestFloor} from './materials.js';
export const R={w:3.66,d:3.63,h:2.72,windowX:.24,windowW:1.60,bayD:.70};
export function room(scene){
 const root=new T.Group();root.name='children-room-shell';scene.add(root);const walls={};
 const pink=mat('#f0cbd6',.94),white=mat('#f5f1e8',.75),wood=mat('#825238'),glass=new T.MeshPhysicalMaterial({color:'#d5eaf1',transparent:true,opacity:.20,roughness:.12,side:T.DoubleSide,depthWrite:false});
 function box(w,h,d,x,y,z,m=white,parent=root){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const floor=guestFloor();box(R.w+.14,.13,R.d+.14,0,-.08,0,mat('#cfbba4'));box(R.w,.025,R.d,0,-.004,0,floor);
 for(const name of ['left','right','front','back','ceiling']){walls[name]=new T.Group();root.add(walls[name]);}
 for(const [name,x] of [['left',-R.w/2],['right',R.w/2]]){box(.12,R.h,R.d,x,R.h/2,0,pink,walls[name]);box(.025,.09,R.d,x+(x>0?-.072:.072),.045,0,wood,walls[name]);box(.06,.065,R.d,x+(x>0?-.07:.07),R.h-.035,0,white,walls[name]);}
 const z=-R.d/2,wl=R.windowX-R.windowW/2,wr=R.windowX+R.windowW/2;
 box(wl+R.w/2,R.h,.12,(-R.w/2+wl)/2,R.h/2,z,pink,walls.back);box(R.w/2-wr,R.h,.12,(wr+R.w/2)/2,R.h/2,z,pink,walls.back);
 box(R.windowW,.72,.12,R.windowX,.36,z,pink,walls.back);box(R.windowW,R.h-2.35,.12,R.windowX,(R.h+2.35)/2,z,pink,walls.back);
 // Bay is a true outward recess with a sill, three glazed faces and an opening to the room.
 box(R.windowW+.12,.10,R.bayD+.13,R.windowX,.70,z-R.bayD/2+.015,white,walls.back);
 box(R.windowW+.12,.10,R.bayD+.13,R.windowX,2.35,z-R.bayD/2+.015,white,walls.back);
 for(const x of [wl,wr]){box(.065,1.60,.065,x,1.55,z-.69,white,walls.back);box(.04,1.60,R.bayD,x,1.55,z-.35,glass,walls.back);}
 box(R.windowW,1.60,.018,R.windowX,1.55,z-.69,glass,walls.back);
 for(let i=0;i<=3;i++)box(.034,1.60,.045,wl+i*R.windowW/3,1.55,z-.70,white,walls.back);
 for(const y of [.77,1.55,2.33])box(R.windowW,.034,.045,R.windowX,y,z-.70,white,walls.back);
 // Exterior sky visible through the actual bay window.
 const sky=mat('#b5d8e6');sky.emissive.set('#91b7c9');sky.emissiveIntensity=.24;box(R.windowW+.06,1.55,.015,R.windowX,1.55,z-.76,sky,walls.back);
 const doorX=-.83,doorW=.85,left=doorX-doorW/2,right=doorX+doorW/2,fz=R.d/2;
 box(left+R.w/2,R.h,.12,(-R.w/2+left)/2,R.h/2,fz,pink,walls.front);box(R.w/2-right,R.h,.12,(right+R.w/2)/2,R.h/2,fz,pink,walls.front);box(doorW,R.h-2.14,.12,doorX,(2.14+R.h)/2,fz,pink,walls.front);
 for(const x of [left-.035,right+.035])box(.075,2.18,.18,x,1.09,fz,white,walls.front);box(doorW+.15,.08,.18,doorX,2.18,fz,white,walls.front);
 box(doorW,.025,.23,doorX,.008,fz,wood,walls.front);
 const door=new T.Group();door.position.set(left,0,fz+.08);door.rotation.y=-Math.PI*.48;walls.front.add(door);box(.81,2.10,.04,.405,1.05,0,white,door);for(const y of [.55,1.55])box(.64,.76,.013,.405,y,-.027,mat('#e5ded0'),door);
 box(R.w,.06,R.d,0,R.h+.03,0,white,walls.ceiling);
 return {root,walls};
}

