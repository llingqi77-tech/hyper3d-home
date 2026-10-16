import * as T from 'three';
export const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
// Identical seeded planks, tint and roughness to 客房漫游/dist/app.js lines 25–32.
export function guestFloor(){
 const c=document.createElement('canvas');c.width=c.height=1024;const a=c.getContext('2d');let seed=42;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 a.fillStyle='#825135';a.fillRect(0,0,1024,1024);for(let y=0;y<1024;y+=128){for(let x=-((y/128)%2)*256;x<1024;x+=512){let tone=rand()*18;a.fillStyle='rgb('+(117+tone)+','+(65+tone/2)+','+(39+tone/3)+')';a.fillRect(x+1,y+1,510,126);for(let k=0;k<130;k++){a.strokeStyle='rgba('+(rand()>.5?'34,12,6':'240,167,105')+','+(rand()*.09)+')';a.lineWidth=rand()*1.8+.2;const yy=y+rand()*128;a.beginPath();a.moveTo(x,yy);a.bezierCurveTo(x+100,yy-2,x+350,yy+3,x+512,yy);a.stroke();}a.strokeStyle='#543624';a.lineWidth=2;a.strokeRect(x,y,512,128);}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,2);t.anisotropy=8;return new T.MeshStandardMaterial({map:t,roughness:.62,color:'#b89a8d'});
}
