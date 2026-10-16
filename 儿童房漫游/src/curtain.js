import * as T from 'three';
export function makeCurtains(){
 const group=new T.Group();group.name='blue-white-gradient-curtains';
 const fabric=new T.MeshStandardMaterial({roughness:.95,vertexColors:true,side:T.DoubleSide});
 for(const sign of [-1,1]){
  const geo=new T.PlaneGeometry(.47,1.72,48,32),p=geo.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin((x+.235)/.47*Math.PI*12)*.036);const u=(y+.86)/1.72;const color=new T.Color('#4289be').lerp(new T.Color('#f6f8f6'),Math.min(1,u*1.35));colors.push(color.r,color.g,color.b);}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,fabric);mesh.position.set(sign*.70,.86,0);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 const rod=new T.Mesh(new T.CylinderGeometry(.014,.014,1.98,16),new T.MeshStandardMaterial({color:'#a59481',metalness:.5,roughness:.4}));rod.rotation.z=Math.PI/2;rod.position.y=1.76;group.add(rod);
 return group;
}
