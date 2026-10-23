import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'../..');
const rooms={kitchen:'厨房漫游/dist/',children:'儿童房漫游/dist/',master:'主卧漫游/dist/',junction:'三门交汇区漫游/dist/',bathroom1:'公卫1漫游/dist/',bathroom2:'公卫2漫游/dist/',guest:'客房漫游/dist/',living:'客厅漫游/dist/',balcony:'主卧阳台漫游/dist/',dining:'餐厅交互/'};
await fs.mkdir(path.join(root,'全屋漫游/audit/baselines'),{recursive:true});
for(const [id,dir]of Object.entries(rooms)){
 const original=await fs.readFile(path.join(root,dir,'index.html'),'utf8');
 const inject=`<base href="/${dir}"><script src="/全屋漫游/audit/scene-audit.js"></script>`;
 await fs.writeFile(path.join(root,'全屋漫游/audit/baselines',id+'.html'),original.replace('<head>','<head>'+inject));
 if(id==='master')await fs.writeFile(path.join(root,dir,'audit-parity.html'),original.replace('<head>','<head><script src="/全屋漫游/audit/scene-audit.js"></script>'));
}
console.log('Generated 10 original-page audit wrappers; standalone sources unchanged.');
