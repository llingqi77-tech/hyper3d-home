import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// All furnishings are static in the whole-home page. Bake equal-material pieces
// per room to reduce thousands of draw calls without changing their appearance.
// Keep original named nodes for provenance; collision grid is built beforehand.
export function batchFurniture(rooms){
 let original=0,batches=0;const materials=new Map();
 function skipped(o,root){for(let p=o;p&&p!==root;p=p.parent)if(!p.visible||['客厅吊顶','餐客厅拱门','全屋顶面','外窗','共享门洞与木门'].includes(p.name))return true;return false;}
 function splitMaterials(root,allowClipped){const sources=[];root.traverse(o=>{if(o.isMesh&&!o.isSkinnedMesh&&Array.isArray(o.material)&&!skipped(o,root)&&o.material.every(m=>m.isMeshStandardMaterial&&!m.transparent&&(allowClipped||!m.clippingPlanes?.length)))sources.push(o);});
   for(const o of sources){const g=o.geometry;if(!g.groups.length)continue;for(const group of g.groups){const raw=g.index?Array.from(g.index.array.slice(group.start,group.start+group.count)):Array.from({length:group.count},(_,i)=>group.start+i),unique=[...new Set(raw)],lookup=new Map(unique.map((n,i)=>[n,i])),part=new T.BufferGeometry();for(const [name,a]of Object.entries(g.attributes)){const array=new Float32Array(unique.length*a.itemSize);for(let i=0;i<unique.length;i++)for(let k=0;k<a.itemSize;k++)array[i*a.itemSize+k]=a.getComponent(unique[i],k);part.setAttribute(name,new T.BufferAttribute(array,a.itemSize));}part.setIndex(raw.map(n=>lookup.get(n)));const mesh=new T.Mesh(part,o.material[group.materialIndex]);mesh.name=o.name+' · 材质分片';mesh.position.copy(o.position);mesh.quaternion.copy(o.quaternion);mesh.scale.copy(o.scale);mesh.castShadow=o.castShadow;mesh.receiveShadow=o.receiveShadow;o.parent.add(mesh);}o.visible=false;o.userData.materialSplit=true;}
 }
 function signature(m){return JSON.stringify([m.type,m.color?.getHex(),m.emissive?.getHex(),m.emissiveIntensity,m.roughness,m.metalness,m.side,m.vertexColors,m.flatShading,m.alphaTest,m.map?.uuid,m.normalMap?.uuid,m.normalScale?.toArray(),m.roughnessMap?.uuid,m.metalnessMap?.uuid,m.aoMap?.uuid,m.emissiveMap?.uuid,m.lightMap?.uuid,m.envMap?.uuid,m.clearcoat,m.transmission,m.ior,m.sheen,m.reflectivity,m.clippingPlanes?.length||0,m.clipShadows]);}
 for(const [id,room]of rooms){if(id==='balcony'||id==='kitchen')continue;const root=room.root,allowClipped=id==='architecture';splitMaterials(root,allowClipped);root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),groups=new Map();
   root.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||o.isReflector||Array.isArray(o.material)||o.material?.transparent||!allowClipped&&o.material?.clippingPlanes?.length||!o.material?.isMeshStandardMaterial||Object.keys(o.geometry.morphAttributes).length||skipped(o,root))return;
     const m=o.material,key=signature(m)+'|'+Object.entries(o.geometry.attributes).map(([n,a])=>n+':'+a.itemSize+':'+a.normalized).sort().join(',')+'|'+!!o.geometry.index;
     if(!materials.has(signature(m)))materials.set(signature(m),m);if(!groups.has(key))groups.set(key,{material:materials.get(signature(m)),meshes:[]});groups.get(key).meshes.push(o);
   });
   const output=new T.Group();output.name='合批后的静态陈设';
   for(const {material,meshes}of groups.values()){if(meshes.length<2)continue;const geos=[];
     for(const mesh of meshes){const transform=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),g=mesh.geometry.clone();g.applyMatrix4(transform);
       if(transform.determinant()<0){if(g.index){const a=g.index.array;for(let i=0;i<a.length;i+=3)[a[i+1],a[i+2]]=[a[i+2],a[i+1]];}else for(const a of Object.values(g.attributes)){const array=a.array,n=a.itemSize;for(let i=0;i<a.count;i+=3)for(let j=0;j<n;j++)[array[(i+1)*n+j],array[(i+2)*n+j]]=[array[(i+2)*n+j],array[(i+1)*n+j]];}if(g.attributes.tangent){const a=g.attributes.tangent;for(let i=0;i<a.count;i++)a.setW(i,-a.getW(i));}}
       geos.push(g);
     }
     const merged=mergeGeometries(geos,false);geos.forEach(g=>g.dispose());if(!merged)continue;merged.computeBoundingBox();merged.computeBoundingSphere();const mesh=new T.Mesh(merged,material);mesh.name=room.name+' · 原始模型静态合批';mesh.castShadow=mesh.receiveShadow=true;output.add(mesh);for(const o of meshes){o.visible=false;o.userData.batched=true;}original+=meshes.length;batches++;
   }
   root.add(output);
 }
 return {original,batches,reducedBy:original-batches};
}
