import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {writeFile} from 'node:fs/promises';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result='data:'+b.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
const mat=(c,r=.6,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const wood=mat('#a66c35'),edge=mat('#b57b43'),cloth=mat('#e6d6b4',.95),black=mat('#242726',.9),metal=mat('#a1a8aa',.3,.8),frame=mat('#355a49',.45,.4);
function box(g,w,h,d,x,y,z,m=wood){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o;}
function bar(g,a,b,r,m){a=new T.Vector3(...a);b=new T.Vector3(...b);const o=new T.Mesh(new T.CylinderGeometry(r,r,a.distanceTo(b),12),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());g.add(o);return o;}
function beam(g,a,b,w,d,m=wood){a=new T.Vector3(...a);b=new T.Vector3(...b);const o=new T.Mesh(new T.BoxGeometry(w,a.distanceTo(b),d),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.sub(a).normalize());g.add(o);return o;}
const bed=new T.Group();bed.name='bunk-bed-side-inclined-ladder';
for(const x of [-1,1])for(const z of [-.65,.23])box(bed,.09,1.82,.09,x,.91,z);
for(const x of [-1,1])box(bed,.09,.75,.09,x,.375,.65);
for(const [y,front] of [[.32,.65],[1.31,.23]]){
 const depth=front+.65;box(bed,2.02,.07,depth,0,y,(front-.65)/2);
 for(const z of [-.65,front])box(bed,2.10,.16,.055,0,y+.015,z);
 for(const x of [-1,1])box(bed,.055,.17,depth,x,y+.025,(front-.65)/2);
 box(bed,1.92,.10,depth-.075,0,y+.105,(front-.65)/2,cloth);
}
for(const y of [1.55,1.76]){
 box(bed,2.0,.065,.05,0,y,-.65);
 // Leave an access opening beside the inclined ladder at the foot end.
 box(bed,1.48,.065,.05,-.23,y,.23);
 for(const x of [-1,1])box(bed,.05,.065,.88,x,y,-.21);
}
for(const x of [-1,1])for(const y of [.58,.72])box(bed,.05,.055,1.30,x,y,0);
// Ladder front faces the wardrobe: foot projects outward, roughly 58 degrees above floor.
for(const x of [.48,.90])beam(bed,[x,.04,1.23],[x,1.58,.24],.055,.065,edge);
for(let i=1;i<=6;i++){const t=i/7;box(bed,.43,.045,.11,.69,.04+1.54*t,1.23-.99*t,edge);}
const chair=new T.Group();chair.name='solid-wood-desk-chair';
box(chair,.43,.045,.43,0,.44,0);for(const x of [-.17,.17])for(const z of [-.17,.17])box(chair,.042,z<0?.89:.44,.042,x,z<0?.445:.22,z);
for(const y of [.64,.76,.86])box(chair,.38,.055,.035,0,y,-.17,edge);
for(const x of [-.17,.17])box(chair,.025,.025,.34,x,.19,0);
const bike=new T.Group();bike.name='mountain-bicycle';
// Wheel planes XY, bicycle length X, front wheel +X.
for(const x of [-.55,.55]){
 const tire=new T.Mesh(new T.TorusGeometry(.325,.030,10,48),black);tire.position.set(x,.355,0);bike.add(tire);
 const rim=new T.Mesh(new T.TorusGeometry(.298,.008,8,48),metal);rim.position.set(x,.355,0);bike.add(rim);
 for(let i=0;i<24;i++){const a=i*Math.PI/12;bar(bike,[x,.355,0],[x+.296*Math.cos(a),.355+.296*Math.sin(a),0],.0018,metal);}
 for(let i=0;i<40;i++){const a=i*Math.PI/20;const tread=box(bike,.033,.012,.064,x+.352*Math.cos(a),.355+.352*Math.sin(a),0,black);tread.rotation.z=a-Math.PI/2;}
 bar(bike,[x,.355,-.05],[x,.355,.05],.022,metal);
 const disc=new T.Mesh(new T.TorusGeometry(.105,.007,6,32),metal);disc.position.set(x,.355,.037);bike.add(disc);
}
const rear=[-.55,.355,0],crank=[-.08,.32,0],seat=[-.22,.78,0],head=[.36,.82,0],low=[.30,.61,0],front=[.55,.355,0];
for(const [a,b] of [[rear,crank],[rear,seat],[crank,seat],[seat,head],[crank,low],[head,low]])bar(bike,a,b,.022,frame);
for(const z of [-.045,.045]){bar(bike,[.36,.82,z],[.55,.355,z],.015,metal);bar(bike,[.43,.62,z],[.55,.355,z],.022,black);}
bar(bike,seat,[-.24,.89,0],.014,metal);const saddle=box(bike,.23,.045,.12,-.27,.90,0,black);saddle.rotation.z=-.08;
bar(bike,head,[.40,1.01,0],.016,metal);bar(bike,[.40,1.01,-.29],[.40,1.01,.29],.013,metal);
for(const sign of [-1,1])bar(bike,[.40,1.01,sign*.18],[.40,1.01,sign*.30],.022,black);
const gear=new T.Mesh(new T.TorusGeometry(.075,.009,8,32),metal);gear.position.set(-.08,.32,.06);bike.add(gear);
bar(bike,[-.08,.32,-.07],[-.08,.32,.07],.015,metal);for(const sign of [-1,1]){bar(bike,[-.08,.32,sign*.07],[-.08+sign*.11,.32+sign*.08,sign*.07],.01,metal);box(bike,.09,.02,.09,-.08+sign*.11,.32+sign*.08,sign*.11,black);}
for(const y of [.27,.37])bar(bike,[-.55,.355,.065],[-.08,y,.065],.004,black);
bar(bike,[-.10,.32,-.035],[-.25,.02,-.18],.008,metal);
for(const [id,obj] of [['bunk-bed-v2',bed],['wood-chair',chair],['mountain-bike',bike]]){obj.updateMatrixWorld(true);const out=await new GLTFExporter().parseAsync(obj,{binary:true});await writeFile(new URL('./public/models/'+id+'.glb',import.meta.url),Buffer.from(out));console.log('Exported '+id);}
