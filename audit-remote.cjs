const {execFileSync}=require('child_process');const fs=require('fs');
const git=(args,encoding='utf8')=>execFileSync('git',['-c','safe.directory=D:/3d家园',...args],{encoding,maxBuffer:100*1024*1024});
const files=git(['ls-tree','-r','--name-only','origin/main','-z']).split('\0').filter(Boolean),all=new Set(files);
const read=p=>git(['show','origin/main:'+p]);
const rooms=['厨房漫游','公卫1漫游','公卫2漫游','餐厅交互','客厅漫游','客房漫游'];
const refs={};
refs[rooms[0]]=[...read(rooms[0]+'/src/generated-models.js').matchAll(/file:\s*'([^']+\.glb)'/g)].map(m=>'public/assets/'+m[1]);
refs[rooms[1]]=[...read(rooms[1]+'/src/main.js').matchAll(/file:\s*"([^"]+\.glb)"/g)].map(m=>'public/assets/'+m[1]);
refs[rooms[2]]=read(rooms[2]+'/src/assets.js').split('\n').filter(l=>l.startsWith('{id:')).map(l=>'public/assets/'+(l.match(/file:'([^']+)'/)?.[1]||l.match(/id:'([^']+)'/)[1]+'.glb'));
refs[rooms[3]]=[...new Set([...read(rooms[3]+'/room.js').matchAll(/['"]([^'"\n]+\.glb)['"]/g)].map(m=>'assets/'+m[1]))];
refs[rooms[4]]=[];
refs[rooms[5]]=JSON.parse(read(rooms[5]+'/dist/models/manifest.json')).map(x=>'dist/models/'+x.file);
const result={commit:git(['rev-parse','origin/main']).trim(),scope:'Remote source and active GLB structural audit; not a visual completeness certification',rooms:[]};
for(const room of rooms){const models=[];for(const relative of refs[room]){const file=room+'/'+relative;const entry={file,exists:all.has(file)};if(entry.exists){try{const b=git(['show','origin/main:'+file],null);entry.bytes=b.length;entry.validHeader=b.toString('ascii',0,4)==='glTF'&&b.readUInt32LE(4)===2&&b.readUInt32LE(8)===b.length;const json=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));entry.meshes=json.meshes?.length||0;entry.primitives=(json.meshes||[]).reduce((n,m)=>n+m.primitives.length,0);entry.externalResources=[...(json.buffers||[]),...(json.images||[])].filter(x=>x.uri&&!x.uri.startsWith('data:')).map(x=>x.uri);entry.externalMissing=entry.externalResources.filter(uri=>!all.has(require('path').posix.join(require('path').posix.dirname(file),uri)));}catch(e){entry.error=e.message;}}models.push(entry);}result.rooms.push({room,entry:all.has(room+'/index.html')?'index.html':all.has(room+'/dist/index.html')?'dist/index.html':null,storedGlbs:files.filter(p=>p.startsWith(room+'/')&&p.endsWith('.glb')).length,activeGlbs:models.length,models});}
fs.mkdirSync('audit',{recursive:true});fs.writeFileSync('audit/remote-room-inventory-2026-10-15.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({commit:result.commit,rooms:result.rooms.map(r=>({room:r.room,entry:r.entry,storedGlbs:r.storedGlbs,activeGlbs:r.activeGlbs,issues:r.models.filter(m=>!m.exists||!m.validHeader||!m.meshes||m.error||m.externalMissing?.length)}))},null,2));
