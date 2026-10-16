import * as T from 'three';
export function makeCurtains(){
 const group=new T.Group();group.name='green-lace-white-square-curtains';
 const fabric=new T.MeshStandardMaterial({roughness:.95,vertexColors:true,side:T.DoubleSide});
 for(const sign of [-1,1]){
  const geo=new T.PlaneGeometry(.47,1.72,96,192),p=geo.attributes.position,colors=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setZ(i,Math.sin((x+.235)/.47*Math.PI*12)*.036);const ix=i%97,iy=Math.floor(i/97);const line=ix%24===0||iy%16===0;const color=new T.Color(line?'#c9d0c7':'#fffef8');colors.push(color.r,color.g,color.b);}
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();const mesh=new T.Mesh(geo,fabric);mesh.position.set(sign*.70,.86,0);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
 }
 // Continuous green floral scalloped valance above the white square fabric.
 const lace=new T.Shape();lace.moveTo(-.96,1.75);lace.lineTo(.96,1.75);lace.lineTo(.96,1.48);
 for(let x=.96;x>-.959;x-=.16)lace.quadraticCurveTo(x-.08,1.39,x-.16,1.48);
 lace.closePath();const valance=new T.Mesh(new T.ShapeGeometry(lace),new T.MeshStandardMaterial({color:'#8ba064',roughness:1,side:T.DoubleSide}));valance.position.z=.052;group.add(valance);
 const leafMat=new T.MeshStandardMaterial({color:'#506d3c',roughness:1,side:T.DoubleSide});
 for(let x=-.86;x<.9;x+=.19){for(const side of [-1,1]){const leaf=new T.Mesh(new T.CircleGeometry(.035,16),leafMat);leaf.scale.set(.55,1,1);leaf.rotation.z=side*.65;leaf.position.set(x+side*.022,1.59,.058);group.add(leaf);}const flower=new T.Mesh(new T.CircleGeometry(.019,12),new T.MeshStandardMaterial({color:'#e4e4c2',roughness:1,side:T.DoubleSide}));flower.position.set(x,1.64,.06);group.add(flower);}
 const rod=new T.Mesh(new T.CylinderGeometry(.014,.014,1.98,16),new T.MeshStandardMaterial({color:'#a59481',metalness:.5,roughness:.4}));rod.rotation.z=Math.PI/2;rod.position.y=1.76;group.add(rod);
 return group;
}
