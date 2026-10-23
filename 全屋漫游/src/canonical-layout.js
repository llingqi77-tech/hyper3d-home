// Original independent room dimensions take priority. Every placement is rigid.
// Only the connecting hall changes size. +Z is drawing-down, +X drawing-right.
export const HEIGHT=2.72;
export const rect=(a,b,c,d)=>[[a,b],[c,b],[c,d],[a,d]];
const S=Math.SQRT2;
export const ROOM_DEFS=[
 {id:'master',name:'主卧',native:[5.08,3.25],center:[-.125,-13.70],yaw:Math.PI/2,color:'#c3ccaa',walk:[.90,-13.70]},
 {id:'children',name:'儿童房',native:[3.66,3.63],center:[3.355,-14.915],yaw:0,color:'#e4c3ca',walk:[3.35,-13.95]},
 {id:'bathroom1',name:'公卫 1',native:[1.42,1.70],center:[4.03,-11.13],origin:[0,0],yaw:Math.PI/2,color:'#a3b8bc',walk:[4.80,-11.85],walkLook:[5.55,-11.85]},
 {id:'guest',name:'客房',native:[3.8,3.2],center:[4.6,-7.9],yaw:-Math.PI/2,color:'#b9ced5',walk:[3.35,-9.14]},
 {id:'bathroom2',name:'公卫 2',native:[3.4,1.9],center:[3.95,-3.9],yaw:-Math.PI/2,color:'#d5c8b1',walk:[3.3,-5.06]},
 {id:'kitchen',name:'厨房',native:[2.06,3.08],center:[4.54,.03],yaw:-Math.PI/2,color:'#c6cab4',walk:[3.25,.03]},
 {id:'dining',name:'餐厅',native:[3.3*S,3.25*S],center:[1.5-3.3*S/2,1.3],yaw:0,color:'#d9b78f',walk:[.45,2.35]},
 {id:'living',name:'客厅',native:[5.2*S,3.75*S],center:[1.5-3.3*S/2,1.3],origin:[-3.55*S,-5.375*S],yaw:0,color:'#d2aa82',walk:[-.95,-4.4]},
 {id:'junction',name:'三门交汇区',native:[2.55,2.10],center:[2.775,-12.05],yaw:0,color:'#cfbca0',walk:[2.75,-11.55]},
 {id:'balcony',name:'主卧阳台',native:[3.1,1.65],center:[-.125,-16.24],origin:[-1.55,0],yaw:Math.PI,color:'#c4b78e',walk:[-.125,-16.9],walkLook:[.45,-17.70]}
];
export function localToPlan(r,x,z){const c=Math.cos(r.yaw),s=Math.sin(r.yaw);return [r.center[0]+c*x+s*z,r.center[1]-s*x+c*z];}
for(const r of ROOM_DEFS){const [w,d]=r.native,[x,z]=r.origin||[-w/2,-d/2];r.poly=rect(x,z,x+w,z+d).map(p=>localToPlan(r,...p));r.label=r.poly.reduce((a,p)=>[a[0]+p[0]/4,a[1]+p[1]/4],[0,0]);r.look=r.label;}
// Original child's north window bay extends the room, not a replacement box.
const child=ROOM_DEFS.find(r=>r.id==='children');child.poly=[[-1.83,1.815],[1.83,1.815],[1.83,-1.815],[1.04,-1.815],[1.04,-2.515],[-.56,-2.515],[-.56,-1.815],[-1.83,-1.815]].map(p=>localToPlan(child,...p));
const living=ROOM_DEFS.find(r=>r.id==='living');living.poly=[[-1.65,-1.625],[-2.89,-1.625],[-2.89,-1.865],[-3.10,-1.865],[-3.10,-3.08],[-3.55,-4.00],[-3.10,-5.375],[1.65,-5.375],[1.65,-1.625]].map(([x,z])=>localToPlan(living,x*S,z*S));living.label=localToPlan(living,-.7*S,-3.5*S);living.look=living.label;
export const CORRIDORS=[rect(1.5,-11,3,3.60),rect(3,-11,4.05,-9.8),rect(3,-6,6.2,-5.6),rect(3,-2.2,6.08,-1),rect(1.5,-13.1,4.05,-11)];
export const BY_ID=new Map(ROOM_DEFS.map(r=>[r.id,r]));
export const BOUNDS={minX:-5.7,maxX:6.4,minZ:-18.1,maxZ:3.9};
export function inPoly(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)inside=!inside;}return inside;}
export function roomAt(x,z){return ROOM_DEFS.find(r=>inPoly(x,z,r.poly));}
export function contains(x,z){return !!roomAt(x,z)||CORRIDORS.some(p=>inPoly(x,z,p));}
