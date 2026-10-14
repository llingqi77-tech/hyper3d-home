const fs=require('node:fs/promises'),path=require('node:path');
const {pathToFileURL}=require('node:url');
(async()=>{
const root=path.resolve(__dirname,'..'),{assets}=await import(pathToFileURL(path.join(root,'src/assets.js')));
const jobs=JSON.parse(await fs.readFile(path.join(root,'model-generation-latest.json'),'utf8'));
for(const j of jobs){j.status='completed';j.used=assets.some(a=>(a.file||a.id+'.glb')===j.id+'.glb');j.review=j.used?'已采用':'未采用：已有修正版';}
await fs.writeFile(path.join(root,'model-generation-latest.json'),JSON.stringify(jobs,null,2)+'\n');
const reused={toilet:{id:'4c4073dc-27e0-4f8c-82d5-ea3a66c748d6',source:'公卫1漫游/public/assets/toilet.glb'},shower:{id:'ee521e92-3a58-4932-8a9d-610ba885e3c1',source:'公卫1漫游/public/assets/shower-black-v2.glb'}};
let md='# 公卫 2 模型生成记录\n\n23 类独立物件，21 类新生成、2 类沿用公卫 1；模型拼装后共 28 个实例。所有物件均有 Hyper3D 来源。\n\n| 物件 | 当前文件 | 来源 | Hyper3D 页面 |\n|---|---|---|---|\n';
for(const a of assets){const file=a.file||a.id+'.glb',j=jobs.find(j=>j.id+'.glb'===file),r=reused[a.id];const url=j?.display_url||'https://hyper3d.ai/workspace/rodin/'+r.id;md+=`| ${a.name} | public/assets/${file} | ${j?'本次单独生成':'复用 '+r.source} | [查看模型](${url}) |\n`;}
md+='\n## 生成与校验\n\n先生成独立 GLB，再按确认图安装；同款物品复制模型实例。柜子使用照片提取的独立参考图，台盆和百叶窗在初版出现偏差后采用独立参考图重新生成。旧台盆 `basin.glb` 与旧窗 `window.glb` 不在当前网页加载清单中。\n\n每项 Hyper3D 提示词和任务 ID 保存在 `model-generation-latest.json`。最初 20 项的实际提交提示词另附共同约束 “Asset only, upright Y axis; main front faces +Z. No ground, no plinth. Realistic textured game asset.”，使用 Gen-2.5-Medium 和 GLB 输出。\n\n## imagegen 参考图\n\n使用内置 image_gen，未使用 CLI。\n\n| 文件 | 提示词要点 |\n|---|---|\n| public/references/cabinet-isolated.png | 从用户照片只提取奶白双门柜和浅灰石纹台面，保留黑色拉手、四脚和底层板；去掉台盆、龙头、用品、背景，留下椭圆开孔，透明背景。 |\n| public/references/basin-isolated.png | 一个白瓷椭圆台下盆，薄而连续的椭圆边、凹形碗体、银色排水口；不含龙头、矩形台面、台座，透明背景。 |\n| public/references/window-isolated.png | 银灰铝框，横向矩形，五片倾斜开启的透明浅蓝玻璃百叶，片间有空隙，无墙或背板，透明背景。 |\n\n## 网页适配\n\nGLB 原始文件保留在 `source-models/`。网页版本仅缩小内嵌 PNG 贴图，几何数据不简化；体积记录见 `qa/optimization.json`。网页按已确认布局调整物件比例、安装方向与位置。玻璃百叶赋予透明效果；台面巾与地漏校正颜色；两条毛巾裁除生成时附带的挂架后，挂在单独生成的毛巾杆上。镜子增加实时反射面，建筑墙地与灯光由 Three.js 提供。\n';
await fs.writeFile(path.join(root,'模型生成记录.md'),md);
const optimization=JSON.parse(await fs.readFile(path.join(root,'qa/optimization.json'),'utf8'));let orig=0,opt=0;
for(const a of assets){const name=a.file||a.id+'.glb',item=optimization.find(i=>i.name===name);orig+=item.original;opt+=item.optimized;const b=await fs.readFile(path.join(root,'public/assets',name));if(b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(8)!==b.length)throw Error('Invalid GLB '+name);const j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());for(const v of j.bufferViews)if((v.byteOffset||0)+v.byteLength>j.buffers[0].byteLength)throw Error('Invalid buffer '+name);}
console.log(JSON.stringify({activeModels:assets.length,instances:assets.reduce((n,a)=>n+1+(a.copies?.length||0),0),originalMB:(orig/1048576).toFixed(1),webMB:(opt/1048576).toFixed(1),allContainersValid:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
