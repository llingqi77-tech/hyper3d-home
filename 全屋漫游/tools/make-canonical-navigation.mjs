import fs from 'node:fs/promises';
const file=new URL('../src/navigation.js',import.meta.url);
let source=await fs.readFile(file,'utf8');
source=source.replace("import {ROOM_DEFS,roomAt,contains} from './layout.js';","import {ROOM_DEFS,roomAt,contains,BOUNDS} from './canonical-layout.js';");
source=source.replace('minX=-3.70,maxX=4.82,minZ=-12.24,maxZ=1.72','minX=BOUNDS.minX,maxX=BOUNDS.maxX,minZ=BOUNDS.minZ,maxZ=BOUNDS.maxZ');
source=source.replace('&&s.x<3.3&&s.z<3.5','&&s.x<30&&s.z<30');
await fs.writeFile(new URL('../src/canonical-navigation.js',import.meta.url),source);
