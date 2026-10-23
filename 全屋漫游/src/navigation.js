import * as T from 'three';
import {ROOM_DEFS,roomAt,contains} from './layout.js';

// A single walkable grid spans all room floors and the actual connecting apertures.
export function createWalking({camera,canvas,shell,onChange}){
 const step=.12,minX=-3.70,maxX=5.30,minZ=-12.54,maxZ=1.72,cols=Math.ceil((maxX-minX)/step)+1,rows=Math.ceil((maxZ-minZ)/step)+1;
 let grid=null,colliders=[],active=false,drag=null,path=[],tour=[],tourIndex=0,running=false;const keys=new Set();let yaw=0,pitch=0;
 const coord=i=>[minX+(i%cols)*step,minZ+Math.floor(i/cols)*step],index=(x,z)=>Math.round((z-minZ)/step)*cols+Math.round((x-minX)/step);
 function blocked(x,z){return shell.blocked(x,z,.125)||colliders.some(b=>x>b.minX-.12&&x<b.maxX+.12&&z>b.minZ-.12&&z<b.maxZ+.12);}
 function build(roots){colliders=[];for(const root of roots){root.updateWorldMatrix(true,true);root.traverse(o=>{if(!o.isMesh||!o.visible||!o.geometry)return;let visible=true;for(let p=o.parent;p;p=p.parent)if(!p.visible||p.name==='餐客厅拱门')visible=false;if(!visible)return;const b=new T.Box3().setFromObject(o),s=b.getSize(new T.Vector3());if(b.min.y<1.04&&b.max.y>.22&&s.x>.055&&s.z>.055&&s.x<3.3&&s.z<3.5)colliders.push({minX:b.min.x,maxX:b.max.x,minZ:b.min.z,maxZ:b.max.z});});}
   grid=new Uint8Array(cols*rows);for(let i=0;i<grid.length;i++){const [x,z]=coord(i);grid[i]=blocked(x,z)?0:1;}return {cells:grid.reduce((a,b)=>a+b,0),colliders:colliders.length};
 }
 function nearest(x,z,roomId){let best=-1,dist=Infinity;if(!grid)return null;for(let i=0;i<grid.length;i++){if(!grid[i])continue;const [px,pz]=coord(i);if(roomId&&roomAt(px,pz)?.id!==roomId)continue;const d=(px-x)**2+(pz-z)**2;if(d<dist){best=i;dist=d;}}return best<0?null:coord(best);}
 function find(start,end){if(!grid)return null;const a=nearest(...start),b=nearest(...end);if(!a||!b)return null;const from=index(...a),to=index(...b),cost=new Float32Array(grid.length).fill(Infinity),prev=new Int32Array(grid.length).fill(-1),closed=new Uint8Array(grid.length),heap=[];cost[from]=0;
   function push(n,p){heap.push({n,p});let i=heap.length-1;while(i>0){const k=(i-1)>>1;if(heap[k].p<=p)break;heap[i]=heap[k];i=k;}heap[i]={n,p};}
   function pop(){const out=heap[0],end=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let k=i*2+1;if(k+1<heap.length&&heap[k+1].p<heap[k].p)k++;if(heap[k].p>=end.p)break;heap[i]=heap[k];i=k;}heap[i]=end;}return out.n;}
   const tx=to%cols,tz=Math.floor(to/cols),heur=i=>Math.hypot(i%cols-tx,Math.floor(i/cols)-tz);push(from,heur(from));let found=false;
   while(heap.length){const i=pop();if(closed[i])continue;if(i===to){found=true;break;}closed[i]=1;const cx=i%cols,cz=Math.floor(i/cols);for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=cx+dx,nz=cz+dz;if(nx<0||nx>=cols||nz<0||nz>=rows)continue;const n=nz*cols+nx;if(!grid[n]||closed[n])continue;if(dx&&dz&&(!grid[cz*cols+nx]||!grid[nz*cols+cx]||blocked(minX+(cx+dx*.5)*step,minZ+(cz+dz*.5)*step)))continue;const next=cost[i]+(dx&&dz?Math.SQRT2:1);if(next<cost[n]){cost[n]=next;prev[n]=i;push(n,next+heur(n));}}}
   if(!found)return null;const points=[];for(let i=to;i!==from;i=prev[i])points.push(coord(i));points.reverse();return points;
 }
 function look(target){camera.lookAt(target[0],1.30,target[1]);camera.rotation.order='YXZ';yaw=camera.rotation.y;pitch=camera.rotation.x;}
 function enter(point=[1.12,1.08],target=[.2,-1]){active=true;path=[];running=false;const p=nearest(...point)||point;camera.position.set(p[0],1.60,p[1]);look(target);onChange();}
 function stop(){path=[];running=false;tour=[];onChange();}
 function go(point){const next=find([camera.position.x,camera.position.z],point);if(!next?.length)return false;path=next;return true;}
 function startTour(){const destinations=['dining','living','junction','children','master','balcony','bathroom1','guest','bathroom2','kitchen'];tour=destinations.map(id=>{const r=ROOM_DEFS.find(x=>x.id===id);return nearest(...r.walk,id);}).filter(Boolean);tourIndex=0;running=true;path=[];return advance();}
 function advance(){if(tourIndex>=tour.length){running=false;onChange();return false;}while(tourIndex<tour.length){const destination=tour[tourIndex++];if(go(destination)){onChange();return true;}}running=false;onChange();return false;}
 function move(dx,dz){const n=Math.ceil(Math.hypot(dx,dz)/.035);for(let i=0;i<n;i++){const x=camera.position.x+dx/n,z=camera.position.z+dz/n;if(!blocked(x,camera.position.z))camera.position.x=x;if(!blocked(camera.position.x,z))camera.position.z=z;}}
 function update(dt){if(!active)return false;let changed=false;
   if(path.length){const [x,z]=path[0],dx=x-camera.position.x,dz=z-camera.position.z,dist=Math.hypot(dx,dz);if(dist<.065)path.shift();else{const speed=Math.min(1.15*dt,dist);move(dx/dist*speed,dz/dist*speed);const desired=Math.atan2(-dx,-dz);yaw+=(T.MathUtils.euclideanModulo(desired-yaw+Math.PI,Math.PI*2)-Math.PI)*(1-Math.exp(-dt*8));pitch=T.MathUtils.damp(pitch,-.035,3,dt);changed=true;}if(!path.length&&running)advance();}
   let f=(keys.has('w')||keys.has('ArrowUp')?1:0)-(keys.has('s')||keys.has('ArrowDown')?1:0),r=(keys.has('d')||keys.has('ArrowRight')?1:0)-(keys.has('a')||keys.has('ArrowLeft')?1:0);if(f||r){path=[];running=false;const len=Math.hypot(f,r);f/=len;r/=len;move((-Math.sin(yaw)*f+Math.cos(yaw)*r)*dt*1.35,(-Math.cos(yaw)*f-Math.sin(yaw)*r)*dt*1.35);changed=true;}
   camera.rotation.set(pitch,yaw,0,'YXZ');return changed;
 }
 canvas.addEventListener('pointerdown',e=>{if(!active)return;drag={x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!active||!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>1)drag.moved=true;yaw-=dx*.004;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.10,1.10);drag.x=e.clientX;drag.y=e.clientY;onChange();});
 let wasDrag=false;canvas.addEventListener('pointerup',()=>{wasDrag=!!drag?.moved;drag=null;});
 document.addEventListener('keydown',e=>{if(!active||e.target.matches('button,select,input,textarea'))return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(k)){e.preventDefault();keys.add(k);stop();}if(k==='Escape')stop();});document.addEventListener('keyup',e=>keys.delete(e.key.length===1?e.key.toLowerCase():e.key));window.addEventListener('blur',()=>keys.clear());
 return {build,nearest,find,enter,go,look,stop,startTour,update,get active(){return active;},set active(v){active=v;if(!v){stop();keys.clear();}},get running(){return running;},get path(){return path;},get wasDrag(){return wasDrag;},key(k,value){value?keys.add(k):keys.delete(k);},validate(){const start=nearest(1.12,1.08);return ROOM_DEFS.map(r=>{const p=nearest(...r.walk,r.id),route=start&&p&&find(start,p);let previous=start,continuous=!!route;for(const next of route||[]){for(let t=.2;t<=1;t+=.2)if(blocked(previous[0]+(next[0]-previous[0])*t,previous[1]+(next[1]-previous[1])*t))continuous=false;previous=next;}return {id:r.id,reachable:!!route,continuous,steps:route?.length||0,point:p};});}};
}
