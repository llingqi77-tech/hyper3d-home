import * as T from 'three';
import {mat,makeFloor,makeWood,makePlaster} from './materials.js';
export const ROOM={width:2.55,depth:2.10,height:2.72};
export function buildArchitecture(scene){
 const root=new T.Group();root.name='three-door-junction';scene.add(root);
 const groups={};
 const plaster=makePlaster();plaster.repeat.set(5,5);
 const green=new T.MeshStandardMaterial({color:'#b0b08a',map:plaster,roughness:1});
 const trim=mat('#eee8d9',.7),wood=new T.MeshStandardMaterial({map:makeWood(),roughness:.68});
 const dark=mat('#4a4338'),brass=mat('#8d7953',.35,.7);
 const box=(w,h,d,m,x,y,z,p=root)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;};
 const floorTexture=makeFloor();floorTexture.repeat.set(ROOM.width/.60,ROOM.depth/.60);
 const floorMaterial=new T.MeshStandardMaterial({map:floorTexture,roughness:.45});
 box(ROOM.width+.12,.10,ROOM.depth+.12,[mat('#c2ad90'),mat('#c2ad90'),floorMaterial,trim,trim,trim],0,-.05,0);
 const rear=new T.Group(),east=new T.Group(),west=new T.Group(),ceiling=new T.Group();
 root.add(rear,east,west,ceiling);Object.assign(groups,{rear,east,west,ceiling});
 rear.position.z=-ROOM.depth/2;
 east.position.x=ROOM.width/2;east.rotation.y=-Math.PI/2;
 west.position.x=-ROOM.width/2;west.rotation.y=Math.PI/2;
 // Wall-local +Z always faces the hall. Door offsets are measured along each wall.
 function wall(parent,length,doorCenter,width,name){
   const half=length/2,left=doorCenter-width/2,right=doorCenter+width/2,head=2.14;
   if(left>-half)box(left+half,ROOM.height,.10,green,(left-half)/2,ROOM.height/2,0,parent);
   if(right<half)box(half-right,ROOM.height,.10,green,(right+half)/2,ROOM.height/2,0,parent);
   box(width,ROOM.height-head,.10,green,doorCenter,(ROOM.height+head)/2,0,parent);
   for(const x of [left-.035,right+.035]){
     box(.082,head+.055,.19,trim,x,(head+.055)/2,.012,parent);
     box(.015,head+.055,.015,mat('#c6c1b2'),x-.025,(head+.055)/2,.115,parent);
     box(.012,head+.055,.015,trim,x+.025,(head+.055)/2,.12,parent);
   }
   box(width+.15,.095,.19,trim,doorCenter,head+.055,.012,parent);
   box(width,.025,.24,mat('#d4bf98'),doorCenter,.008,0,parent);
   for(const [a,b] of [[-half,left-.075],[right+.075,half]])if(b>a)box(b-a,.10,.018,mat('#9a7862'),(a+b)/2,.05,.059,parent);
   // Three rows of blue/cream mosaic line each real door threshold.
   const colors=['#427c90','#88a4a3','#d9d1b8','#ad9274','#8a966b'];
   for(let r=0;r<3;r++)for(let col=0;col<Math.floor(width/.06);col++)box(.056,.008,.056,mat(colors[(r*3+col)%5],.45),left+.03+col*.06,.025,-.065+r*.06,parent);
   const hinge=new T.Group();hinge.name=name+'-door';hinge.position.set(left,0,-.075);parent.add(hinge);hinge.rotation.y=Math.PI*.49;
   box(width-.035,head-.04,.04,trim,(width-.035)/2,(head-.04)/2,0,hinge);
   for(const y of [.56,1.53]){box(width-.20,.70,.014,mat('#e1dccc'),width/2,y,.027,hinge);for(const x of [.095,width-.095])box(.022,.74,.025,trim,x,y,.037,hinge);for(const yy of [y-.36,y+.36])box(width-.17,.022,.025,trim,width/2,yy,.037,hinge);}
   box(.035,.18,.022,brass,width-.13,1.01,.035,hinge);box(.12,.022,.03,brass,width-.17,1.06,.064,hinge);
   return {left,right,width,head,center:doorCenter};
 }
 const child=wall(rear,ROOM.width,-.25,.88,'children');
 const bathroom=wall(east,ROOM.depth,.60,.64,'bathroom-one');
 const master=wall(west,ROOM.depth,-.35,.84,'master');
 // Short glimpses through the openings; the adjoining rooms are not rebuilt here.
 function glimpse(parent,door,color,floorColor){
   const g=new T.Group();g.name='doorway-context';parent.add(g);
   box(door.width+.25,2.15,.04,mat(color),door.center,1.075,-.58,g);
   box(door.width+.25,.025,.52,mat(floorColor),door.center,-.01,-.32,g);
   for(const s of [-1,1])box(.025,2.15,.55,mat(color),door.center+s*(door.width+.25)/2,1.075,-.30,g);
   return g;
 }
 glimpse(rear,child,'#cfaebc','#8c5c44');
 glimpse(west,master,'#e0d2b9','#8b6450');
 const bathContext=glimpse(east,bathroom,'#c5c9bf','#536c75');
 box(bathroom.width+.23,1.04,.025,mat('#4f6873'),bathroom.center,.52,-.55,bathContext);
 for(let y=.26;y<1.05;y+=.26)box(bathroom.width+.22,.007,.008,trim,bathroom.center,y,-.534,bathContext);
 for(let x=bathroom.center-.32;x<bathroom.center+.4;x+=.26)box(.007,1.04,.008,trim,x,.52,-.534,bathContext);
 // Warm timber inset with light-painted perimeter, as seen in the source photo.
 box(ROOM.width,.07,ROOM.depth,wood,0,ROOM.height-.035,0,ceiling);
 for(const x of [-ROOM.width/2+.09,ROOM.width/2-.09])box(.18,.14,ROOM.depth,trim,x,ROOM.height-.11,0,ceiling);
 for(const z of [-ROOM.depth/2+.09,ROOM.depth/2-.09])box(ROOM.width,.14,.18,trim,0,ROOM.height-.11,z,ceiling);
 for(let z=-.86;z<.9;z+=.15)box(ROOM.width-.36,.009,.006,mat('#815c3b'),0,ROOM.height-.075,z,ceiling);
 // Photo-visible white outlet beside the cabinet.
 box(.014,.09,.075,trim,ROOM.width/2-.061,1.25,-.84);
 for(const z of [-.855,-.825])box(.006,.018,.004,dark,ROOM.width/2-.071,1.255,z);
 return {root,groups,doors:{child,bathroom,master}};
}
