// Metres; the supplied plan is SOUTH-UP. +X is drawing-right, +Z drawing-down.
export const HEIGHT=2.72;
export const rect=(x1,z1,x2,z2)=>[[x1,z1],[x2,z1],[x2,z2],[x1,z2]];
export const ROOM_DEFS=[
 {id:'master',name:'主卧',color:'#c3ccaa',poly:[[-3.10,-6.075],[-.25,-6.075],[-.25,-7.75],[.34,-7.75],[.34,-10.555],[-.25,-10.555],[-.25,-10.755],[-3.10,-10.755],[-3.10,-10.21],[-3.45,-10.21],[-3.45,-9.45],[-3.10,-9.45]],center:[-1.675,-8.415],native:[5.08,3.25],yaw:Math.PI/2,scale:[4.68/5.08,1,2.85/3.25],label:[-1.50,-7.60],walk:[-.78,-7.25],look:[-2,-8.7]},
 {id:'children',name:'儿童房',color:'#e4c3ca',poly:[[1.65,-6.925],[4.59,-6.925],[4.59,-10.555],[3.8,-10.555],[3.8,-11.255],[2.2,-11.255],[2.2,-10.555],[.34,-10.555],[.34,-7.75],[1.65,-7.75]],center:[2.76,-8.74],native:[3.66,3.63],label:[2.8,-8.75],walk:[1.88,-7.38],look:[3,-9.0]},
 {id:'bathroom1',name:'公卫 1',color:'#a3b8bc',poly:rect(1.65,-6.925,4.59,-5.225),center:[3.12,-6.075],native:[1.42,1.70],yaw:Math.PI/2,scale:[1.70/1.42,1,2.94/1.70],label:[3.15,-6.12],walk:[2.25,-5.80],look:[3.7,-6.40]},
 {id:'guest',name:'客房',color:'#b9ced5',poly:rect(2.00,-5.225,5.15,-1.625),center:[3.575,-3.425],native:[3.80,3.20],yaw:-Math.PI/2,scale:[3.60/3.80,1,3.15/3.20],label:[3.57,-3.35],walk:[2.55,-4.55],look:[4.0,-2.8]},
 {id:'bathroom2',name:'公卫 2',color:'#d5c8b1',poly:rect(1.65,-1.625,3.90,-.355),center:[2.775,-.99],native:[3.4,1.9],scale:[2.25/3.4,1,1.27/1.9],label:[2.68,-1.05],walk:[2.28,-1.15],look:[3.3,-1.1]},
 {id:'kitchen',name:'厨房',color:'#c6cab4',poly:rect(1.65,-.355,4.65,1.625),center:[3.15,.635],native:[2.06,3.08],yaw:-Math.PI/2,scale:[1.98/2.06,1,3/3.08],label:[3.75,.75],walk:[3.05,1.10],look:[4.25,.05]},
 {id:'dining',name:'餐厅',color:'#d9b78f',poly:rect(-1.65,-1.625,1.65,1.625),center:[0,0],native:[3.3,3.25],label:[-.15,.75],walk:[1.05,.82],look:[-.85,-.15]},
 {id:'living',name:'客厅',color:'#d2aa82',poly:[[-1.65,-1.625],[-2.89,-1.625],[-2.89,-1.865],[-3.10,-1.865],[-3.10,-3.08],[-3.55,-4.00],[-3.10,-6.075],[-.25,-6.075],[-.25,-5.675],[1.65,-5.675],[1.65,-5.225],[2.00,-5.225],[2.00,-1.625]],center:[0,0],native:[4.75,3.75],label:[-.68,-3.53],walk:[.90,-3.0],look:[-1.7,-4.1]},
 {id:'junction',name:'三门交汇区',color:'#cfbca0',poly:rect(-.25,-7.75,1.65,-5.675),center:[.70,-6.25],native:[2.55,2.1],scale:[1.90/2.55,1,1.25/2.1],label:[.70,-6.30],walk:[.70,-5.90],look:[1.25,-6.92]},
 {id:'balcony',name:'主卧阳台',color:'#c4b78e',poly:rect(-3.025,-12.405,-.25,-10.755),center:[-1.6375,-10.755],native:[3.10,1.65],yaw:Math.PI,scale:[2.775/3.10,1,1],label:[-1.55,-11.4],walk:[-1.2,-11.2],look:[-2.7,-11.5]}
];
export const BY_ID=new Map(ROOM_DEFS.map(r=>[r.id,r]));
export const OUTLINE=[[-1.65,1.625],[4.65,1.625],[4.65,-.355],[3.9,-.355],[3.9,-1.625],[5.15,-1.625],[5.15,-5.225],[4.59,-5.225],[4.59,-10.555],[3.8,-10.555],[3.8,-11.255],[2.2,-11.255],[2.2,-10.555],[.93,-10.555],[-.25,-10.555],[-.25,-10.755],[-.25,-12.405],[-3.025,-12.405],[-3.025,-10.755],[-3.1,-10.755],[-3.1,-10.21],[-3.45,-10.21],[-3.45,-9.45],[-3.1,-9.45],[-3.1,-6.075],[-3.55,-4],[-3.1,-3.08],[-3.1,-1.865],[-2.89,-1.865],[-2.89,-1.625],[-1.65,-1.625]];
// Every door is a real aperture in a shared wall, not a teleport or duplicate wall.
export const DOORS=[
 {id:'entry',a:[.75,1.625],b:[1.65,1.625],rooms:['outside','dining']},
 {id:'master-door',a:[-.25,-7.075],b:[-.25,-6.175],rooms:['master','junction']},
 {id:'child-door',a:[1.65,-7.70],b:[1.65,-6.98],rooms:['children','junction']},
 {id:'bath1-door',a:[1.65,-6.325],b:[1.65,-5.685],rooms:['bathroom1','junction']},
 {id:'guest-door',a:[2.00,-4.975],b:[2.00,-4.175],rooms:['guest','living']},
 {id:'bath2-door',a:[1.67,-.355],b:[2.27,-.355],rooms:['bathroom2','kitchen']},
 {id:'kitchen-door',a:[1.65,-.355],b:[1.65,1.625],rooms:['kitchen','dining'],openPlan:true},
 {id:'living-arch',a:[-1.37,-1.625],b:[1.37,-1.625],rooms:['living','dining'],openPlan:true},
 {id:'balcony-door',a:[-3.025,-10.755],b:[-.25,-10.755],rooms:['master','balcony'],slider:true}
];
export function inPoly(x,z,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside;}return inside;}
export function roomAt(x,z){return ROOM_DEFS.find(r=>inPoly(x,z,r.poly));}
export function contains(x,z){return !!roomAt(x,z);}
export const ROUTE=[[1.12,1.08],[.95,-.80],[.94,-2.90],[.90,-4.6],[.90,-5.45],[.90,-6.10],[1.29,-6.9],[1.8,-7.2],[1.29,-6.9],[.90,-6.10],[-.30,-5.9],[-.35,-7.4],[-.35,-9.8],[-1.30,-10.7],[-1.30,-11.0],[-.35,-9.8],[-.35,-7.4],[-.30,-5.9],[.90,-6.10],[.90,-5.4],[2.1,-5.4],[3.0,-5.8],[2.1,-5.4],[.90,-5.4],[.95,-4.3],[2.0,-4.3],[2.65,-3.6],[2.0,-4.3],[.95,-4.3],[.95,-2.9],[.95,-.2],[2.05,-.20],[2.8,-.8],[2.05,-.20],[.95,-.2],[1.12,1.08],[2.2,1.08],[3.1,1.08]];
