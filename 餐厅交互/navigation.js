import * as T from 'three';

export function createNavigation({camera,renderer,architecture,obstacles,RIGHT,ENTRY,SPACE=1}){
  const $=s=>document.querySelector(s),canvas=renderer.domElement;
  const U=value=>value*SPACE;
  const top=new T.OrthographicCamera(-8,8,8,-8,.1,100);top.up.set(0,0,-1);
  const bounds={minX:U(-3.7),maxX:U(1.8),minZ:U(-5.55),maxZ:U(ENTRY+0.2)};
  const center=new T.Vector2((bounds.minX+bounds.maxX)/2,(bounds.minZ+bounds.maxZ)/2);
  let mode='walk',active=false,enabled=false,yaw=0,pitch=0,drag=null,journey=null,inspection=null,route=null,savedWalk=null,topSpan=8;
  const keys=new Set(),moves=new Set();const door=architecture.door;
  function clear(){keys.clear();moves.clear();drag=null}
  function face(target){camera.lookAt(target);yaw=camera.rotation.y;pitch=camera.rotation.x}
  function updateTop(){top.position.set(center.x,24,center.y);top.lookAt(center.x,0,center.y);top.updateProjectionMatrix()}
  function resize(){const aspect=innerWidth/innerHeight;camera.aspect=aspect;camera.updateProjectionMatrix();topSpan=Math.max(bounds.maxZ-bounds.minZ,(bounds.maxX-bounds.minX)/aspect)*1.10;top.left=-topSpan*aspect/2;top.right=topSpan*aspect/2;top.top=topSpan/2;top.bottom=-topSpan/2;updateTop()}
  resize();
  function chrome(){
    $('#overhead').setAttribute('aria-pressed',String(mode==='plan'));
    $('#walk').setAttribute('aria-pressed',String(mode==='walk'));
    $('#move').hidden=mode==='plan';$('#crosshair').hidden=mode==='plan'||!active;
    $('.position').textContent=mode==='plan'?'俯瞰 · 无天花板':'第一人称 · 视高 1.6 m';
    $('#guide').textContent=mode==='plan'?'拖动平移 · 滚轮缩放 · 点击角落速达':'拖动环顾 · 点击地面行走 · 点击金色圆点速达角落';
    $('#door').textContent=door.isOpen?'关门':'开门';
  }
  function showScene(){active=true;$('#welcome').classList.add('exiting');canvas.focus();chrome()}
  function outside(show=true){mode='walk';journey=null;inspection=null;route=null;savedWalk=null;clear();camera.position.set(U(RIGHT-.45),1.6,U(ENTRY+1.75));face(new T.Vector3(U(RIGHT-.45),1.2,U(ENTRY-.1)));door.close();if(show)showScene();else chrome()}
  outside(false);
  function enter(){if(!enabled)return;outside(false);door.open();active=true;
    journey={points:[camera.position.clone(),new T.Vector3(U(RIGHT-.45),1.6,U(ENTRY-.32)),new T.Vector3(U(.98),1.6,U(.15)),new T.Vector3(U(.84),1.6,U(-1.79)),new T.Vector3(U(.86),1.6,U(-2.58))],elapsed:0,duration:5.8};
    $('#welcome').classList.add('exiting');canvas.focus();chrome()}
  function overview(){savedWalk=mode==='walk'?{position:camera.position.clone(),yaw,pitch}:savedWalk;journey=null;inspection=null;route=null;clear();mode='plan';center.set((bounds.minX+bounds.maxX)/2,(bounds.minZ+bounds.maxZ)/2);top.zoom=1;updateTop();showScene()}
  function focus(eye,target){if(!enabled)return;if(mode==='plan'){camera.position.copy(top.position);camera.lookAt(center.x,0,center.y);yaw=camera.rotation.y;pitch=camera.rotation.x}
    const to=new T.Vector3(U(eye[0]),eye[1],U(eye[2])),look=new T.Vector3(U(target[0]),target[1],U(target[2])),delta=look.clone().sub(to);
    inspection={from:camera.position.clone(),to,startYaw:yaw,startPitch:pitch,endYaw:Math.atan2(-delta.x,-delta.z),endPitch:Math.atan2(delta.y,Math.hypot(delta.x,delta.z)),elapsed:0,duration:mode==='plan'?1.1:.72};
    journey=null;route=null;mode='walk';showScene();clear()}
  function walk(){if(!enabled)return;if(mode==='plan'&&savedWalk){mode='walk';camera.position.copy(savedWalk.position);yaw=savedWalk.yaw;pitch=savedWalk.pitch;showScene()}else if(camera.position.z>U(ENTRY+.1))enter();else{mode='walk';showScene()}}
  function pause(){active=false;journey=null;route=null;clear();$('#welcome').classList.remove('exiting');$('#crosshair').hidden=true;$('#enter').innerHTML='继续参观 <span>→</span>';$('#guide').textContent='参观已暂停 · 点击继续参观'}
  function toggleDoor(){if(door.isOpen){if(Math.hypot(camera.position.x-U(door.hinge[0]),camera.position.z-U(door.hinge[1]))<U(1.06)&&mode==='walk'){$('#guide').textContent='请先离开门扇范围，再关门';return}door.close()}else door.open();chrome()}
  $('#enter').onclick=()=>{if(camera.position.z>U(ENTRY+.1)&&mode==='walk')enter();else showScene()};
  $('#home').onclick=()=>outside();$('#walk').onclick=walk;$('#overhead').onclick=overview;$('#door').onclick=toggleDoor;
  $('#help').onclick=()=>{active=false;clear();$('#instructions').showModal()};
  function closeHelp(){$('#instructions').close();if(enabled)showScene()}
  $('#closeHelp').onclick=closeHelp;$('#resume').onclick=closeHelp;$('#instructions').addEventListener('cancel',()=>{if(enabled)showScene()});
  canvas.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;journey=null;route=null;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag||!active)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(mode==='plan'){const units=topSpan/top.zoom/innerHeight;center.x-=dx*units;center.y-=dy*units;updateTop()}else{yaw-=dx*.003;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.15,1.15)}drag.x=e.clientX;drag.y=e.clientY});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  canvas.addEventListener('wheel',e=>{if(mode!=='plan')return;e.preventDefault();top.zoom=T.MathUtils.clamp(top.zoom*Math.exp(-e.deltaY*.001),.65,5);top.updateProjectionMatrix()},{passive:false});
  const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  addEventListener('keydown',e=>{if(e.code==='Escape'){if(!$('#instructions').open)pause();return}if(!active)return;if(e.code==='KeyR'){outside();return}if(e.code==='KeyE'&&!e.repeat){toggleDoor();return}if(mode==='walk'&&enabled&&moveCodes.includes(e.code)){e.preventDefault();journey=null;route=null;keys.add(e.code)}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
  document.querySelectorAll('[data-move]').forEach(button=>{button.addEventListener('pointerdown',e=>{if(!active||!enabled||mode!=='walk')return;e.preventDefault();journey=null;route=null;button.setPointerCapture(e.pointerId);moves.add(button.dataset.move)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>moves.delete(button.dataset.move))});
  function blocked(x,z){const r=.16,lx=x/SPACE,lz=z/SPACE;const main=(lx>-3.55&&lx<1.65&&lz>-5.375&&lz<-1.625)||(lx>-1.65&&lx<1.65&&lz>=-1.625&&lz<ENTRY);
    return !main||architecture.blocked(lx,lz,r/SPACE)||obstacles.some(b=>x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r)}
  function goTo(x,z){
    if(!active||!enabled||mode!=='walk'||blocked(camera.position.x,camera.position.z))return false;
    const step=U(.18),minX=U(-3.48),minZ=U(-5.28),nx=29,nz=38;
    const toCell=(px,pz)=>[Math.round((px-minX)/step),Math.round((pz-minZ)/step)];
    const key=(i,j)=>j*nx+i,point=(i,j)=>[minX+i*step,minZ+j*step];
    const valid=(i,j)=>{if(i<0||j<0||i>=nx||j>=nz)return false;const [px,pz]=point(i,j);return !blocked(px,pz)};
    const [si,sj]=toCell(camera.position.x,camera.position.z),[ti,tj]=toCell(x,z);
    let goal=null;
    for(let radius=0;radius<7&&!goal;radius++)for(let j=tj-radius;j<=tj+radius;j++)for(let i=ti-radius;i<=ti+radius;i++)if(valid(i,j)&&(!goal||Math.hypot(i-ti,j-tj)<goal.distance))goal={i,j,distance:Math.hypot(i-ti,j-tj)};
    if(!goal)return false;
    const start=key(si,sj),finish=key(goal.i,goal.j),open=[start],cost=new Map([[start,0]]),parent=new Map(),visited=new Set();
    while(open.length){
      let best=0,bestScore=Infinity;
      for(let n=0;n<open.length;n++){const node=open[n],i=node%nx,j=Math.floor(node/nx),score=cost.get(node)+Math.hypot(goal.i-i,goal.j-j);if(score<bestScore){best=n;bestScore=score}}
      const current=open.splice(best,1)[0];if(current===finish)break;visited.add(current);
      const ci=current%nx,cj=Math.floor(current/nx);
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
        const ni=ci+di,nj=cj+dj;if(!valid(ni,nj)||di&&dj&&(!valid(ci+di,cj)||!valid(ci,cj+dj)))continue;
        const next=key(ni,nj),tentative=cost.get(current)+Math.hypot(di,dj);
        if(visited.has(next)||tentative>=(cost.get(next)??Infinity))continue;
        cost.set(next,tentative);parent.set(next,current);if(!open.includes(next))open.push(next);
      }
    }
    if(start!==finish&&!parent.has(finish))return false;
    const cells=[];for(let node=finish;node!==start;node=parent.get(node))cells.push(point(node%nx,Math.floor(node/nx)));
    cells.reverse();if(!blocked(x,z))cells.push([x,z]);
    const clearLine=(a,b)=>{const length=Math.hypot(b[0]-a[0],b[1]-a[1]);for(let d=.06;d<length;d+=.06)if(blocked(a[0]+(b[0]-a[0])*d/length,a[1]+(b[1]-a[1])*d/length))return false;return true};
    const smooth=[],all=[[camera.position.x,camera.position.z],...cells];
    for(let i=0;i<all.length-1;){let next=i+1;for(let j=all.length-1;j>next;j--)if(clearLine(all[i],all[j])){next=j;break}smooth.push(all[next]);i=next}
    route=smooth;journey=null;inspection=null;return true;
  }
  function update(dt){
    door.update(dt);
    if(active&&enabled&&mode==='walk'){
      if(inspection){inspection.elapsed+=dt;const t=Math.min(inspection.elapsed/inspection.duration,1),ease=t*t*(3-2*t);
        camera.position.lerpVectors(inspection.from,inspection.to,ease);yaw=T.MathUtils.lerp(inspection.startYaw,inspection.endYaw,ease);pitch=T.MathUtils.lerp(inspection.startPitch,inspection.endPitch,ease);if(t===1)inspection=null
      }else if(journey){
        if(door.angle<-1.35){journey.elapsed+=dt;const p=journey.points,t=Math.min(journey.elapsed/journey.duration,1),segment=Math.min(p.length-2,Math.floor(t*(p.length-1))),local=t*(p.length-1)-segment,ease=local*local*(3-2*local);
          camera.position.lerpVectors(p[segment],p[segment+1],ease);const delta=p[segment+1].clone().sub(p[segment]);
          const forwardYaw=Math.atan2(-delta.x,-delta.z),turn=segment===p.length-2?T.MathUtils.smoothstep(local,.45,1):0;
          yaw=T.MathUtils.lerp(forwardYaw,1.02,turn);pitch=T.MathUtils.lerp(-.07,-.10,turn);if(t===1)journey=null}
      }else if(route?.length){
        const [x,z]=route[0],dx=x-camera.position.x,dz=z-camera.position.z,distance=Math.hypot(dx,dz);
        if(distance<.04)route.shift();else{const travel=Math.min(distance,1.65*dt),nextX=camera.position.x+dx/distance*travel,nextZ=camera.position.z+dz/distance*travel;
          if(blocked(nextX,nextZ))route=null;else{camera.position.x=nextX;camera.position.z=nextZ;yaw=Math.atan2(-dx,-dz);pitch=T.MathUtils.lerp(pitch,-.06,Math.min(1,dt*5))}}
      }else{
        let f=Number(keys.has('KeyW')||keys.has('ArrowUp')||moves.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||moves.has('back'));
        let r=Number(keys.has('KeyD')||keys.has('ArrowRight')||moves.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||moves.has('left'));
        const norm=Math.hypot(f,r)||1;f/=norm;r/=norm;const speed=1.55*dt;
        const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;
        if(!blocked(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(!blocked(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
      }
    }
    camera.rotation.set(pitch,yaw,0,'YXZ');
  }
  addEventListener('resize',()=>{resize();renderer.setSize(innerWidth,innerHeight)});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('#status').textContent='图形连接中断，请刷新页面'});
  return {update,ready(){enabled=true},focus,goTo,get mode(){return mode},get camera(){return mode==='plan'?top:camera},overview};
}
