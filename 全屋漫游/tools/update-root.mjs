import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Mechanical rewrite of built URLs only; original regional navigation is retained separately.
let html=fs.readFileSync(path.join(project,'dist/index.html'),'utf8');
html=html.replace('name="repo-root" content="../../"','name="repo-root" content="./"').replaceAll('./assets/','./全屋漫游/dist/assets/');
fs.writeFileSync(path.join(project,'../index.html'),html);
console.log('Root index now serves the single full-home 3D application.');
