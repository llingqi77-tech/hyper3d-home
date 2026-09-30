import * as T from 'three';

export function createNavigation({camera,renderer,architecture,obstacles,RIGHT,ENTRY}){
  const $=s=>document.querySelector(s),canvas=renderer.domElement;
  const top=new T.OrthographicCamera(-8,8,8,-8,.1,100);top.up.set(0,0,-1);
  const bounds=architecture.bounds,center=new T.Vector2((bounds.minX+bounds.maxX)/2,(bounds.minZ+bounds.maxZ)/2);
  let mode='walk',active=false,enabled=false,yaw=0,pitch=0,drag=null,journey=null,savedWalk=null,topSpan=16;
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
    $('#guide').textContent=mode==='plan'?'拖动平移 · 滚轮缩放 · 点击「室内」返回漫游':'拖动环顾 · W A S D 行走 · E 开关门 · Esc 暂停';
    $('#door').textContent=door.isOpen?'关门':'开门';
  }
  function showScene(){active=true;$('#welcome').classList.add('exiting');canvas.focus();chrome()}
  function outside(show=true){mode='walk';journey=null;savedWalk=null;clear();camera.position.set(RIGHT-.45,1.6,ENTRY+1.75);face(new T.Vector3(RIGHT-.45,1.2,ENTRY-.1));door.close();if(show)showScene();else chrome()}
  outside(false);
  function enter(){if(!enabled)return;outside(false);door.open();active=true;journey={from:camera.position.clone(),to:new T.Vector3(RIGHT-.45,1.6,ENTRY-.32),elapsed:0,startYaw:yaw,startPitch:pitch};$('#welcome').classList.add('exiting');canvas.focus();chrome()}
  function overview(){savedWalk=mode==='walk'?{position:camera.position.clone(),yaw,pitch}:savedWalk;journey=null;clear();mode='plan';center.set((bounds.minX+bounds.maxX)/2,(bounds.minZ+bounds.maxZ)/2);top.zoom=1;updateTop();showScene()}
  function walk(){if(!enabled)return;if(mode==='plan'&&savedWalk){mode='walk';camera.position.copy(savedWalk.position);yaw=savedWalk.yaw;pitch=savedWalk.pitch;showScene()}else if(camera.position.z>ENTRY+.1)enter();else{mode='walk';showScene()}}
  function pause(){active=false;journey=null;clear();$('#welcome').classList.remove('exiting');$('#crosshair').hidden=true;$('#enter').innerHTML='继续参观 <span>→</span>';$('#guide').textContent='参观已暂停 · 点击继续参观'}
  function toggleDoor(){if(door.isOpen){if(Math.hypot(camera.position.x-door.hinge[0],camera.position.z-door.hinge[1])<1.06&&mode==='walk'){$('#guide').textContent='请先离开门扇范围，再关门';return}door.close()}else door.open();chrome()}
  $('#enter').onclick=()=>{if(camera.position.z>ENTRY+.1&&mode==='walk')enter();else showScene()};
  $('#home').onclick=()=>outside();$('#walk').onclick=walk;$('#overhead').onclick=overview;$('#door').onclick=toggleDoor;
  $('#help').onclick=()=>{active=false;clear();$('#instructions').showModal()};
  function closeHelp(){$('#instructions').close();if(enabled)showScene()}
  $('#closeHelp').onclick=closeHelp;$('#resume').onclick=closeHelp;$('#instructions').addEventListener('cancel',()=>{if(enabled)showScene()});
  canvas.addEventListener('pointerdown',e=>{if(!active||e.button!==0)return;journey=null;drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag||!active)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(mode==='plan'){const units=topSpan/top.zoom/innerHeight;center.x-=dx*units;center.y-=dy*units;updateTop()}else{yaw-=dx*.003;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.15,1.15)}drag.x=e.clientX;drag.y=e.clientY});
  for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>drag=null);
  canvas.addEventListener('wheel',e=>{if(mode!=='plan')return;e.preventDefault();top.zoom=T.MathUtils.clamp(top.zoom*Math.exp(-e.deltaY*.001),.65,5);top.updateProjectionMatrix()},{passive:false});
  const moveCodes=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
  addEventListener('keydown',e=>{if(e.code==='Escape'){if(!$('#instructions').open)pause();return}if(!active)return;if(e.code==='KeyR'){outside();return}if(e.code==='KeyE'&&!e.repeat){toggleDoor();return}if(mode==='walk'&&enabled&&moveCodes.includes(e.code)){e.preventDefault();journey=null;keys.add(e.code)}});
  addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
  document.querySelectorAll('[data-move]').forEach(button=>{button.addEventListener('pointerdown',e=>{if(!active||!enabled||mode!=='walk')return;e.preventDefault();journey=null;button.setPointerCapture(e.pointerId);moves.add(button.dataset.move)});for(const event of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(event,()=>moves.delete(button.dataset.move))});
  function blocked(x,z){const r=.16;return architecture.blocked(x,z,r)||obstacles.some(b=>x>b.minX-r&&x<b.maxX+r&&z>b.minZ-r&&z<b.maxZ+r)}
  function update(dt){
    door.update(dt);
    if(active&&enabled&&mode==='walk'){
      if(journey){
        if(door.angle<-1.35){journey.elapsed+=dt;const t=Math.min(journey.elapsed/2.1,1),ease=t*t*(3-2*t);camera.position.lerpVectors(journey.from,journey.to,ease);const endYaw=Math.atan2(journey.to.x+.4,journey.to.z+.6);yaw=T.MathUtils.lerp(journey.startYaw,endYaw,ease);pitch=T.MathUtils.lerp(journey.startPitch,-.18,ease);if(t===1)journey=null}
      }else{
        let f=Number(keys.has('KeyW')||keys.has('ArrowUp')||moves.has('forward'))-Number(keys.has('KeyS')||keys.has('ArrowDown')||moves.has('back'));
        let r=Number(keys.has('KeyD')||keys.has('ArrowRight')||moves.has('right'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')||moves.has('left'));
        const norm=Math.hypot(f,r)||1;f/=norm;r/=norm;const speed=1.12*dt;
        const dx=(-Math.sin(yaw)*f+Math.cos(yaw)*r)*speed,dz=(-Math.cos(yaw)*f-Math.sin(yaw)*r)*speed;
        if(!blocked(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(!blocked(camera.position.x,camera.position.z+dz))camera.position.z+=dz;
      }
    }
    camera.rotation.set(pitch,yaw,0,'YXZ');
  }
  addEventListener('resize',()=>{resize();renderer.setSize(innerWidth,innerHeight)});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('#status').textContent='图形连接中断，请刷新页面'});
  return {update,ready(){enabled=true},get camera(){return mode==='plan'?top:camera},overview};
}
