import * as T from 'three';

export function floralWallpaper() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');
  c.fillStyle='#f4f1e8';c.fillRect(0,0,1024,1024);
  let seed=417;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  // Small climbing sprigs in soft green and pink, repeated seamlessly.
  for(let y=-35;y<1060;y+=122)for(let x=-25;x<1060;x+=133){
    const ox=x+(rnd()-.5)*45,oy=y+(rnd()-.5)*35;
    c.strokeStyle='#b3bfa0';c.lineWidth=3;c.beginPath();c.moveTo(ox,oy+43);c.bezierCurveTo(ox-22,oy+8,ox+25,oy-4,ox+4,oy-45);c.stroke();
    for(const [dx,dy,turn] of [[-12,16,-.8],[13,-3,.7],[-8,-24,-.4]]){
      c.save();c.translate(ox+dx,oy+dy);c.rotate(turn);c.fillStyle=rnd()>.45?'#b4c6a2':'#cbd7b6';
      c.beginPath();c.ellipse(0,0,8,19,0,0,Math.PI*2);c.fill();c.restore();
    }
    for(const [dx,dy,r] of [[3,-43,1],[-5,8,.7]]){
      c.save();c.translate(ox+dx,oy+dy);c.rotate(rnd()*Math.PI);
      for(let p=0;p<5;p++){c.rotate(Math.PI*2/5);c.fillStyle=p%2?'#e2b5b3':'#e8c5bd';c.beginPath();c.ellipse(0,-7,4.5,8,0,0,Math.PI*2);c.fill();}
      c.fillStyle='#c8ab78';c.beginPath();c.arc(0,0,2.5,0,Math.PI*2);c.fill();c.restore();
    }
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;
  return texture;
}

export function woodFloor() {
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
  const c=canvas.getContext('2d');let seed=95;
  const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  c.fillStyle='#714a32';c.fillRect(0,0,1024,1024);
  for(let y=0;y<1024;y+=128){
    const offset=(y/128%2)*255;
    for(let x=-offset;x<1024;x+=510){
      const tone=rnd()*20;
      c.fillStyle=`rgb(${144+tone},${98+tone*.75},${62+tone*.5})`;c.fillRect(x+2,y+2,506,124);
      for(let line=0;line<75;line++){
        const py=y+rnd()*128;c.strokeStyle=`rgba(86,49,29,${rnd()*.13})`;c.lineWidth=.4+rnd()*1.3;
        c.beginPath();c.moveTo(x,py);c.bezierCurveTo(x+120,py-2,x+360,py+3,x+510,py);c.stroke();
      }
      c.strokeStyle='#64422e';c.lineWidth=2;c.strokeRect(x,y,510,128);
    }
  }
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=8;
  return texture;
}
