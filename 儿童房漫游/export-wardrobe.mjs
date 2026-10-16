import * as T from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {writeFile} from 'node:fs/promises';
import {deflateSync} from 'node:zlib';
globalThis.FileReader=class{readAsArrayBuffer(b){b.arrayBuffer().then(r=>{this.result=r;this.onloadend?.();});}readAsDataURL(b){b.arrayBuffer().then(r=>{this.result='data:'+b.type+';base64,'+Buffer.from(r).toString('base64');this.onloadend?.();});}};
const g=new T.Group();g.name='eight-door-natural-wood-wardrobe';
const wood=new T.MeshStandardMaterial({name:'natural-brown-wood',color:'#ffffff',roughness:.64});
const dark=new T.MeshStandardMaterial({color:'#4f301d',roughness:.75});
function box(w,h,d,x,y,z,m=wood,name='wood'){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);g.add(o);return o;}
const W=3.24,H=2.38,D=.55;
box(W,.10,D,0,.05,0);box(W,.06,D,0,H-.03,0);box(.04,H-.1,D,-W/2+.02,H/2,0);box(.04,H-.1,D,W/2-.02,H/2,0);box(W-.08,H-.15,.035,0,H/2,-D/2+.0175);box(W-.07,.035,D,0,1.82,0);
for(let col=0;col<8;col++){
 const x=-W/2+.045+(col+.5)*(W-.09)/8,w=(W-.09)/8-.012;
 for(const [row,bottom,top] of [['full',.12,2.30]]){
  const h=top-bottom,y=(bottom+top)/2;box(w,h,.035,x,y,.258,wood,`${row}-door-${col+1}`);
  box(w-.11,h-.10,.012,x,y,.282,wood,'inset-panel');
  for(const dx of [-w/2+.025,w/2-.025])box(.035,h-.02,.025,x+dx,y,.291);
  for(const yy of [bottom+.025,top-.025])box(w-.02,.035,.025,x,yy,.291);
  const hx=x+(col%2===0?1:-1)*(w/2-.085),hy=1.04;
  box(.022,.13,.028,hx,hy,.322,dark,'wood-handle');
 }
}
// Add a procedurally drawn wood-grain PNG directly to the exported GLB.
const raw=Buffer.from(await new GLTFExporter().parseAsync(g,{binary:true}));
const jsonLength=raw.readUInt32LE(12),j=JSON.parse(raw.subarray(20,20+jsonLength).toString()),start=20+jsonLength,bin=raw.subarray(start+8,start+8+raw.readUInt32LE(start));
const w=256,h=512,pixels=Buffer.alloc((w*4+1)*h);let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(let y=0;y<h;y++){for(let x=0;x<w;x++){const warp=x+3*Math.sin(y*.012)+2*Math.sin(y*.037+x*.021),grain=Math.sin(warp*.70)+.5*Math.sin(warp*2.2)+.3*Math.sin(warp*4.7);const n=grain*5+(rand()-.5)*5;const i=y*(w*4+1)+1+x*4;pixels[i]=151+n;pixels[i+1]=99+n*.78;pixels[i+2]=54+n*.55;pixels[i+3]=255;}}
function crc(b){let c=0xffffffff;for(const v of b){c^=v;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(type,b){const t=Buffer.from(type),out=Buffer.alloc(b.length+12);out.writeUInt32BE(b.length);t.copy(out,4);b.copy(out,8);out.writeUInt32BE(crc(Buffer.concat([t,b])),8+b.length);return out;}
const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(w);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(pixels)),chunk('IEND',Buffer.alloc(0))]);
const padded=Buffer.concat([bin,Buffer.alloc((4-bin.length%4)%4)]);j.bufferViews.push({buffer:0,byteOffset:padded.length,byteLength:png.length});j.images=[{bufferView:j.bufferViews.length-1,mimeType:'image/png'}];j.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];j.textures=[{source:0,sampler:0}];for(const m of j.materials)if(m.name==='natural-brown-wood')m.pbrMetallicRoughness.baseColorTexture={index:0};
const b=Buffer.concat([padded,png,Buffer.alloc((4-png.length%4)%4)]);j.buffers[0].byteLength=b.length;let jt=Buffer.from(JSON.stringify(j));jt=Buffer.concat([jt,Buffer.alloc((4-jt.length%4)%4,32)]);const head=Buffer.alloc(20);head.writeUInt32LE(0x46546c67);head.writeUInt32LE(2,4);head.writeUInt32LE(28+jt.length+b.length,8);head.writeUInt32LE(jt.length,12);head.writeUInt32LE(0x4e4f534a,16);const bh=Buffer.alloc(8);bh.writeUInt32LE(b.length);bh.writeUInt32LE(0x004e4942,4);await writeFile(new URL('./public/models/wardrobe.glb',import.meta.url),Buffer.concat([head,jt,bh,b]));
console.log('Exported exact eight-door wardrobe, eight full-height doors');

