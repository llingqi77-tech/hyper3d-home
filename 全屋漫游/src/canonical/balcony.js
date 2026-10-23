import * as T from 'three';
import {createBalcony as original,BALCONY} from '../../../主卧阳台漫游/src/balcony.js';
export async function createBalcony({assetUrl,onProgress=()=>{}}={}){
 const scene=new T.Scene();scene.background=new T.Color('#e8e1d6');
 scene.add(new T.HemisphereLight('#fff5dc','#89725f',1.85));const sun=new T.DirectionalLight('#fff0d1',2.45);sun.position.set(-.5,5,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-4,right:4,top:4,bottom:-4,near:.1,far:15});sun.shadow.normalBias=.016;scene.add(sun);const fill=new T.DirectionalLight('#eef3ed',.7);fill.position.set(0,3,-3);scene.add(fill);
 const balcony=await original({assetBase:assetUrl('主卧阳台漫游/public/assets/'),onProgress,withDoorFrame:true});scene.add(balcony.root);
 let complete=false;
 return {...balcony,scene,dimensions:{...BALCONY},models:balcony.objects,entry:{position:[0,0,0],normal:[0,0,-1],width:3.1},views:{overview:{pos:[3.7,3.6,-3.4],target:[0,.65,.8]}},renderSettings:{exposure:1.03,fov:44,environmentIntensity:1,environment:false},setPresentation({mode,fullWalls}={}){complete=mode==='walk'||fullWalls;},update(dt,p){scene.updateWorldMatrix(true,false);balcony.update(dt,scene.localToWorld(p.clone()));if(complete){const ceiling=balcony.root.getObjectByName('阳台顶棚');if(ceiling)ceiling.visible=true;}}};
}
