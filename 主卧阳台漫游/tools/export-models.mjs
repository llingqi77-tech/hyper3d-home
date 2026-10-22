import * as T from '../../厨房漫游/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../厨房漫游/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { mkdir,writeFile,copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname,resolve } from 'node:path';
import { deflateSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { balconyAssets } from '../src/assets.js';
import { floralPixels,bambooPixels } from '../src/patterns.js';

globalThis.FileReader=class{
  async readAsArrayBuffer(blob){this.result=await blob.arrayBuffer();this.onloadend?.();}
  async readAsDataURL(blob){this.result=`data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;this.onloadend?.();}
};
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),target=resolve(root,'public/assets');
await mkdir(target,{recursive:true});
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);t.copy(b,4);data.copy(b,8);b.writeUInt32BE(crc32(Buffer.concat([t,data])),b.length-4);return b;}
function png({data,width,height}){
  const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(rows,y*(width*4+1)+1);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
}
const textures={'floral-cover':png(floralPixels()),bamboo:png(bambooPixels())};
await writeFile(resolve(target,'washer-floral.png'),textures['floral-cover']);
await writeFile(resolve(target,'bamboo-grain.png'),textures.bamboo);
function embedTextures(input){
  const b=Buffer.from(input),jsonLength=b.readUInt32LE(12),j=JSON.parse(b.toString('utf8',20,20+jsonLength).trim());
  const used=j.buffers[0].byteLength,oldBin=b.subarray(28+jsonLength,28+jsonLength+used);
  const pieces=[oldBin,Buffer.alloc((4-used%4)%4)];let byteLength=used+(4-used%4)%4;
  const cache=new Map();
  for(const m of j.materials||[]){
    const image=textures[m.name];if(!image)continue;
    if(!cache.has(m.name)){
      j.bufferViews??=[];j.images??=[];j.samplers??=[];j.textures??=[];
      const view=j.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:image.length})-1;
      const imageIndex=j.images.push({bufferView:view,mimeType:'image/png'})-1;
      const sampler=j.samplers.push({magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497})-1;
      cache.set(m.name,j.textures.push({sampler,source:imageIndex})-1);
      pieces.push(image,Buffer.alloc((4-image.length%4)%4));byteLength+=image.length+(4-image.length%4)%4;
    }
    m.pbrMetallicRoughness.baseColorTexture={index:cache.get(m.name)};
  }
  if(!cache.size)return b;
  j.buffers[0].byteLength=byteLength;
  const raw=Buffer.from(JSON.stringify(j)),json=Buffer.concat([raw,Buffer.alloc((4-raw.length%4)%4,32)]),bin=Buffer.concat(pieces);
  const out=Buffer.alloc(28+json.length+bin.length);out.writeUInt32LE(0x46546c67);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);
  out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);
  out.writeUInt32LE(bin.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);bin.copy(out,28+json.length);return out;
}
const exporter=new GLTFExporter(),manifest=[];
for(const [name,make] of Object.entries(balconyAssets(T))){
  const model=make(),data=embedTextures(await exporter.parseAsync(model,{binary:true,onlyVisible:true}));
  await writeFile(resolve(target,`${name}.glb`),data);
  manifest.push({file:`${name}.glb`,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
  console.log(`${name}.glb (${Math.round(data.length/1024)} KiB)`);
}
await copyFile(resolve(root,'../主卧外的阳台.jpg'),resolve(target,'reference.jpg'));
await copyFile(resolve(root,'../主卧的阳台看出去的风景.jpg'),resolve(target,'city-view.jpg'));
await writeFile(resolve(target,'models.json'),JSON.stringify(manifest,null,2));
