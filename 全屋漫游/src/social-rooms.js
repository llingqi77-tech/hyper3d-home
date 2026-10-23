import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {buildLiving} from '../../餐厅交互/living.js';

export async function populateSocialRooms({rooms,assetUrl,onProgress}){
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.8,...extra});
 const wood=material('#60351d');
 const box=(w,h,d,m,x,y,z,parent)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;parent.add(o);return o;};
 const living=buildLiving({scene:rooms.get('living').root,box,obstacles:[],assetUrl});
 living.objects.get('客厅的画').position.x=-3.035;
 // The shared shell owns the bay opening; move the original window frame into that opening.
 living.objects.get('西侧窗与阳台').position.set(-3.30,0,-4.04);
 living.root.traverse(o=>{if(o.isLight){o.intensity=.4;o.castShadow=false;}});
 rooms.get('living').root.userData.assetCount=living.objects.size;
 onProgress('客厅原有家具与拱门');
 const root=rooms.get('dining').root,loader=new GLTFLoader(),cache=new Map(),placed=new Map();
 const load=file=>{if(!cache.has(file))cache.set(file,loader.loadAsync(assetUrl('餐厅交互/assets/'+file)).then(g=>g.scene));return cache.get(file);};
 const prepare=g=>g.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
 const LEFT=-1.65,RIGHT=1.65,FRONT=-1.625,ENTRY=1.625,tableW=1.55,tableD=.90,tableH=.77,cx=LEFT+(tableW+.018)/2,cz=-.15;
 const specs=[
  {key:'cabinet',file:'餐边柜_已核对.glb',width:1.50,pos:[LEFT+.75,0,ENTRY-.3],yaw:Math.PI,wall:'entry'},
  {key:'bench',file:'鞋柜凳.glb',width:.90,pos:[.3,0,ENTRY-.25],yaw:Math.PI,wall:'entry'},
  {key:'diningWindow',file:'餐厅窗户.glb',height:.864,pos:[LEFT+.16,1.588,cz],yaw:Math.PI/2,wall:'left'},
  {key:'clock',file:'餐厅挂钟.glb',height:.57,pos:[LEFT+.23,1.75,FRONT+.35]},
  {key:'frame',file:'餐厅相框.glb',height:.4,pos:[.3,1.73,ENTRY-.08],yaw:Math.PI,wall:'entry'},
  {key:'dining-fan',file:'餐厅吊扇.glb',width:1.18,pos:[-.45,2.32,cz]},
  ...[[-.4,-.66,0],[.4,-.66,0],[-.4,.66,Math.PI],[.4,.66,Math.PI],[tableW/2+.45,0,-Math.PI/2]].map(([x,z,yaw],i)=>({key:'chair'+i,file:'温莎椅_单体.glb',height:1,pos:[cx+x,0,cz+z],yaw}))
 ];
 for(const s of specs){const source=(await load(s.file)).clone(true),bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3());source.scale.setScalar(s.height?s.height/size.y:s.width/size.x);bounds.setFromObject(source);const center=bounds.getCenter(new T.Vector3());source.position.sub(new T.Vector3(center.x,bounds.min.y,center.z));const g=new T.Group();g.name=s.key;g.add(source);g.position.set(...s.pos);g.rotation.y=s.yaw||0;root.add(g);g.updateMatrixWorld(true);bounds.setFromObject(g);if(s.wall==='entry')g.position.z+=ENTRY-bounds.max.z;if(s.wall==='left')g.position.x+=LEFT-bounds.min.x;prepare(g);placed.set(s.key,g);onProgress('餐厅 · '+s.key);}
 const cabinet=placed.get('cabinet'),bench=placed.get('bench');let bounds=new T.Box3().setFromObject(cabinet);cabinet.position.x+=LEFT-bounds.min.x;cabinet.updateMatrixWorld(true);bounds.setFromObject(cabinet);bench.position.x+=bounds.max.x-new T.Box3().setFromObject(bench).min.x;placed.get('frame').position.x=bench.position.x;
 const clock=placed.get('clock');clock.rotation.y=Math.atan2(cabinet.position.x-clock.position.x,cabinet.position.z-clock.position.z);
 const art=new T.Group();art.name='完整餐厅油画';art.position.set(RIGHT-.08,1.55,-.98);art.rotation.y=-Math.PI/2;root.add(art);box(.51,.63,.035,wood,0,0,0,art);
 const oilMap=new T.TextureLoader().load(assetUrl('餐厅旁边的一幅画（在公卫2的外墙上）.jpg'));oilMap.colorSpace=T.SRGBColorSpace;oilMap.repeat.set(.315,.524);oilMap.offset.set(.10,.361);const canvas=new T.Mesh(new T.PlaneGeometry(.48,.60),material('#fff',{map:oilMap,side:T.DoubleSide}));canvas.position.z=.022;art.add(canvas);
 const table=new T.Group();table.name='餐桌与原款格纹桌布';table.position.set(cx,0,cz);root.add(table);box(tableW,.055,tableD,wood,0,tableH-.035,0,table);box(tableW-.10,.13,tableD-.10,wood,0,tableH-.12,0,table);for(const x of [-(tableW/2-.13),tableW/2-.13])for(const z of [-(tableD/2-.11),tableD/2-.11])box(.065,.71,.065,wood,x,.355,z,table);
 const clothCanvas=document.createElement('canvas');clothCanvas.width=clothCanvas.height=512;const c=clothCanvas.getContext('2d');c.fillStyle='#d6bc84';c.fillRect(0,0,512,512);const palette=['#364557','#c7a36b','#994331','#e2d3aa'];for(let i=0;i<8;i++){c.fillStyle=palette[i%4];c.globalAlpha=.78;c.fillRect(i*64,0,37,512);c.fillRect(0,i*64,512,37);}c.globalAlpha=1;const tex=new T.CanvasTexture(clothCanvas);tex.colorSpace=T.SRGBColorSpace;tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(2.5,1.7);const cloth=material('#fff',{map:tex,roughness:1,side:T.DoubleSide}),navy=material('#424654',{side:T.DoubleSide});box(tableW+.018,.012,tableD+.018,cloth,0,tableH,0,table);
 function drape(len,edge,axis){for(const band of [0,1]){const v=[],uv=[],ind=[],steps=64;for(let row=0;row<2;row++)for(let i=0;i<=steps;i++){const t=i/steps,along=(t-.5)*len,y=band===0?(row?tableH-.20:tableH):(row?tableH-.31:tableH-.20),fold=Math.sin(t*Math.PI*32)*.012*(row+1)/2,out=edge+Math.sign(edge)*fold;v.push(axis==='x'?along:out,y,axis==='x'?out:along);uv.push(t,row);}for(let i=0;i<steps;i++){const a=i,b=i+steps+1;ind.push(a,b,a+1,b,b+1,a+1);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(v,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(ind);geo.computeVertexNormals();const m=new T.Mesh(geo,band?navy:cloth);m.castShadow=m.receiveShadow=true;table.add(m);}}
 drape(tableW,tableD/2,'x');drape(tableW,-tableD/2,'x');drape(tableD,tableW/2,'z');drape(tableD,-tableW/2,'z');
 // Keep only the original tabletop objects, excluding the asset's fused chairs.
 const props=new T.Group();props.name='原餐桌摆件';const source=await load('餐桌_独立彩色.glb');source.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),p=g.attributes.position,keep=[];for(let i=0;i<p.count;i+=3){let ok=true;for(let j=0;j<3;j++){const k=i+j;if(p.getY(k)<-.08||Math.abs(p.getX(k))>.51||Math.abs(p.getZ(k))>.54)ok=false;}if(ok)keep.push(i,i+1,i+2);}if(keep.length){const geo=new T.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const out=new Float32Array(keep.length*a.itemSize);keep.forEach((k,i)=>{for(let j=0;j<a.itemSize;j++)out[i*a.itemSize+j]=a.array[k*a.itemSize+j];});geo.setAttribute(name,new T.BufferAttribute(out,a.itemSize));}geo.computeBoundingSphere();const m=new T.Mesh(geo,o.material);m.position.y=.08;props.add(m);}g.dispose();});props.scale.setScalar(.86);props.position.set(cx,tableH+.006,cz);prepare(props);root.add(props);onProgress('餐厅桌面摆件');
 root.userData.assetCount=specs.length+3;
 return {livingCeiling:living.ceiling,arch:living.objects.get('餐客厅拱门')};
}
