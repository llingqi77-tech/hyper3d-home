import * as T from 'three';
export const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
function texture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=8;return t;}
let seed=314;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
export function makeFloor(){return texture(512,(ctx,n)=>{
  ctx.fillStyle='#b4a28c';ctx.fillRect(0,0,n,n);
  const g=ctx.createLinearGradient(0,0,n,n);g.addColorStop(0,'#ad7655');g.addColorStop(.5,'#a96c49');g.addColorStop(1,'#bb835d');ctx.fillStyle=g;ctx.fillRect(3,3,n-6,n-6);
  for(let i=0;i<14000;i++){ctx.fillStyle=random()>.5?'rgba(249,211,163,.035)':'rgba(79,40,22,.025)';ctx.fillRect(random()*n,random()*n,random()*6+1,random()*5+1);}
  ctx.lineWidth=2;ctx.strokeStyle='#c9956d';ctx.strokeRect(6,6,n-12,n-12);
  for(const x of [0,n])for(const y of [0,n]){ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#ddc8a4';ctx.fillRect(-38,-38,76,76);ctx.fillStyle='#584338';ctx.fillRect(-29,-29,58,58);ctx.strokeStyle='#cbb393';ctx.lineWidth=2;ctx.strokeRect(-24,-24,48,48);ctx.fillStyle='#ba9e7c';for(let i=0;i<4;i++){ctx.save();ctx.rotate(i*Math.PI/2);ctx.beginPath();ctx.ellipse(0,10,4,9,0,0,Math.PI*2);ctx.fill();ctx.restore();}ctx.restore();}
});}
export function makeWood(){return texture(512,(ctx,n)=>{ctx.fillStyle='#ae794c';ctx.fillRect(0,0,n,n);for(let row=0;row<6;row++){ctx.fillStyle=['#ae794c','#a87143','#bb8755'][row%3];ctx.fillRect(0,row*n/6,n,n/6-2);}for(let i=0;i<1500;i++){ctx.strokeStyle=i%3?'rgba(65,29,8,.035)':'rgba(250,208,139,.05)';ctx.beginPath();let y=random()*n;ctx.moveTo(0,y);for(let x=0;x<n;x+=10)ctx.lineTo(x,y+Math.sin(x*.03+i)*1.5);ctx.stroke();}});}
export function makePlaster(){return texture(256,(ctx,n)=>{ctx.fillStyle='#fff';ctx.fillRect(0,0,n,n);for(let i=0;i<6500;i++){const v=200+Math.floor(random()*50);ctx.fillStyle=`rgb(${v},${v},${v})`;ctx.fillRect(random()*n,random()*n,1,1);}});}
