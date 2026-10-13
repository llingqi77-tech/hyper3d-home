import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// All dimensions and placements below are world metres, independent of room scaling.
const specs = [
  { id:'16', file:'entry-lantern.glb', size:[.55,.62,.55], position:[0,1.8,1.675] },
  { id:'03', file:'white-hood-v2.glb', size:[.80,.66,.36], position:[-.26,1.43,-1.24] },
  { id:'04', file:'two-burner-hob-v2.glb', size:[.80,.11,.48], position:[-.26,.868,-1.02] },
  { id:'08', file:'nonstick-pan-v2.glb', size:[.28,.09,.45], position:[-.49,.978,-.92], yaw:Math.PI },
  { id:'18', file:'pressure-cooker-v2.glb', size:[.28,.29,.40], position:[-.03,.978,-.95], yaw:Math.PI },
  { id:'17', file:'sink-upper-cabinet-v2.glb', size:[1.0,.69,.28], position:[.83,1.66,.42], yaw:-Math.PI/2 },
];
export async function loadGeneratedModels(scene, kitchen, onProgress) {
  const loader = new GLTFLoader(); let completed = 0;
  const failures = [];
  // Two at a time bounds texture decoding and avoids replacing the room in a burst.
  const queue = [...specs];
  async function worker() {
    while(queue.length) {
      const spec=queue.shift();
      try {
        const gltf=await loader.loadAsync('/assets/'+spec.file), model=gltf.scene;
        model.updateMatrixWorld(true);
        const bounds=new THREE.Box3().setFromObject(model), size=bounds.getSize(new THREE.Vector3()), center=bounds.getCenter(new THREE.Vector3());
        const scale=Math.min(...spec.size.map((n,i)=>n/Math.max(size.getComponent(i),.001)));
        model.scale.multiplyScalar(scale);
        model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
        model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
        const placement=new THREE.Group(); placement.name='hyper3d-'+spec.id;
        placement.position.set(...spec.position); placement.rotation.y=spec.yaw||0; placement.add(model); scene.add(placement);
        kitchen.models.set(spec.id,placement);
        const fallback=kitchen.groups.get(spec.id);
        if(fallback) fallback.traverse(o=>{if(o.isMesh)o.visible=false;});
        const label=document.querySelector(`[data-object="${spec.id}"] .asset-state`);
        if(label) label.textContent='独立模型已接入';
        completed++;
      } catch(error) { failures.push(spec.id); console.error('Model load failed',spec.file,error); }
      onProgress(completed,specs.length,failures);
    }
  }
  await Promise.all([worker(),worker()]);
  window.kitchenModelsReady=failures.length===0;
}
