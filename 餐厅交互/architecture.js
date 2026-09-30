import * as T from 'three';

// Coordinates are metres. The supplied plan is south-up; entrance is at positive Z.
// Explicit plan dimensions drive the main spans; unlabelled offsets remain estimates.
export function buildArchitecture({scene,wall,trim,tile,box,mat,canvasTexture,LEFT,RIGHT,ENTRY,FRONT}){
  const root=new T.Group();root.name='Open-top apartment structure';scene.add(root);
  const segments=[],areas=[];
  const terracotta=mat('#ffffff',{map:tile,roughness:.74});
  const neutral=mat('#dfdcd2',{roughness:.96});
  const outsideMat=mat('#b1ada1',{roughness:.95});
  const rect=(x1,z1,x2,z2)=>[[x1,z1],[x2,z1],[x2,z2],[x1,z2]];
  function floor(poly,material,name){
    const shape=new T.Shape();poly.forEach(([x,z],i)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
    const g=new T.ShapeGeometry(shape);const p=g.attributes.position,uv=g.attributes.uv;
    for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);uv.setXY(i,(x-y)*Math.SQRT1_2/.6,(x+y)*Math.SQRT1_2/.6)}
    const m=new T.Mesh(g,material);m.rotation.x=-Math.PI/2;m.receiveShadow=true;m.name=name;root.add(m);areas.push(poly);return m;
  }
  // Dining and living use one material and the same world-aligned UVs, including the hall.
  floor(rect(LEFT,FRONT,RIGHT,ENTRY),terracotta,'Dining');
  const living=[[-1.65,-1.625],[-2.89,-1.625],[-2.89,-1.865],[-3.10,-1.865],[-3.10,-3.08],[-3.55,-4.00],[-3.10,-5.375],[1.65,-5.375],[1.65,-1.625]];
  floor(living,terracotta,'Living room with bay');
  floor([[.15,-5.375],[1.65,-5.375],[1.65,-6.625],[.93,-6.625],[.93,-10.255],[.15,-10.255]],terracotta,'Connected hall');
  floor([[1.65,ENTRY],[4.65,ENTRY],[4.65,-.355],[3,-.355],[3,.145],[1.65,.145]],neutral,'Kitchen');
  floor([[1.65,-1.625],[3.90,-1.625],[3.90,-.355],[3,-.355],[3,.145],[1.65,.145]],neutral,'Bathroom 2');
  floor(rect(1.65,-4.925,4.59,-1.625),neutral,'Guest room');
  floor(rect(1.65,-6.625,4.59,-4.925),neutral,'Bathroom 1');
  floor([[.93,-6.625],[4.59,-6.625],[4.59,-10.255],[3.8,-10.255],[3.8,-10.955],[2.2,-10.955],[2.2,-10.255],[.93,-10.255]],neutral,'Child room with bay');
  floor([[-3.1,-5.375],[.15,-5.375],[.15,-10.455],[-3.1,-10.455],[-3.1,-9.91],[-3.45,-9.91],[-3.45,-9.15],[-3.1,-9.15]],neutral,'Main bedroom');
  floor(rect(RIGHT-1.7,ENTRY,RIGHT+.7,ENTRY+2.6),outsideMat,'Entry landing');

  function segment(a,b,{bottom=0,top=2.9,thickness=.14,material=wall,collision=true}={}){
    const dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);if(length<.001||top<=bottom)return;
    const m=box(length,top-bottom,thickness,material,(a[0]+b[0])/2,(top+bottom)/2,(a[1]+b[1])/2,root);m.rotation.y=-Math.atan2(dz,dx);
    if(collision&&bottom<1.65&&top>.2)segments.push({a,b,thickness});
    if(bottom===0){const sk=box(length,.08,thickness+.024,trim,(a[0]+b[0])/2,.04,(a[1]+b[1])/2,root);sk.rotation.y=m.rotation.y;}
    return m;
  }
  function opening(a,b,start,width,{sill=0,head=2.22}={}){
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]);const at=d=>[a[0]+(b[0]-a[0])*d/len,a[1]+(b[1]-a[1])*d/len];
    segment(a,at(start));segment(at(start+width),b);segment(at(start),at(start+width),{bottom:head});
    if(sill>0)segment(at(start),at(start+width),{top:sill});
  }
  function chain(points,options){for(let i=0;i<points.length-1;i++)segment(points[i],points[i+1],options)}

  // External envelope and the entry. There is deliberately no ceiling mesh.
  segment([LEFT,ENTRY],[RIGHT-.9,ENTRY],{thickness:.18});
  segment([RIGHT-.9,ENTRY],[RIGHT,ENTRY],{bottom:2.32,thickness:.18});
  segment([RIGHT,ENTRY],[4.65,ENTRY],{thickness:.18});
  opening([4.65,ENTRY],[4.65,-.355],.28,1.30,{sill:.95,head:2.25});
  segment([4.65,-.355],[3.90,-.355]);segment([3.90,-.355],[3.90,-1.625]);segment([3.90,-1.625],[4.59,-1.625]);
  opening([4.59,-1.625],[4.59,-4.925],1.18,1.10,{sill:.9,head:2.3});
  opening([4.59,-4.925],[4.59,-6.625],.4,.70,{sill:1.35,head:2.3});
  segment([4.59,-6.625],[4.59,-10.255]);segment([4.59,-10.255],[3.8,-10.255]);segment([3.8,-10.255],[3.8,-10.955]);
  opening([3.8,-10.955],[2.2,-10.955],.08,1.44,{sill:.70,head:2.4});
  segment([2.2,-10.955],[2.2,-10.255]);segment([2.2,-10.255],[.93,-10.255]);segment([.93,-10.255],[.15,-10.255]);segment([.15,-10.255],[.15,-10.455]);
  opening([.15,-10.455],[-3.1,-10.455],.9,1.5,{sill:.85,head:2.3});
  chain([[-3.1,-10.455],[-3.1,-9.91],[-3.45,-9.91],[-3.45,-9.15],[-3.1,-9.15],[-3.1,-5.375]]);
  opening([-3.1,-5.375],[-3.55,-4],.18,1.05,{sill:.65,head:2.4});
  opening([-3.55,-4],[-3.1,-3.08],.1,.78,{sill:.65,head:2.4});
  chain([[-3.1,-3.08],[-3.1,-1.865],[-2.89,-1.865],[-2.89,-1.625],[LEFT,-1.625],[LEFT,ENTRY]]);

  // Interior walls with actual gaps for doors. Open-plan dining/living/hall stays connected.
  segment([-3.1,-5.375],[.15,-5.375]);
  opening([.15,-5.375],[.15,-10.255],.20,.90);
  segment([.93,-10.255],[.93,-6.625]);
  opening([.93,-6.625],[4.59,-6.625],0,.72);
  opening([1.65,-6.625],[1.65,-4.925],.90,.64);
  segment([1.65,-4.925],[4.59,-4.925]);
  opening([1.65,-4.925],[1.65,-1.625],.25,.80);
  segment([1.65,-1.625],[4.59,-1.625]);
  opening([1.65,-1.625],[1.65,.145],1.08,.64);
  chain([[1.65,.145],[3,.145],[3,-.355],[3.90,-.355]]);
  // Short pilaster from the photo; no cross-wall closes the route to the living room.
  segment([LEFT,FRONT+.02],[LEFT+.24,FRONT+.02],{thickness:.24});

  // A six-panel aged oak door, with raised mouldings, strap hinges and brass hardware.
  const grain=canvasTexture(512,(c,n)=>{c.fillStyle='#775234';c.fillRect(0,0,n,n);for(let i=0;i<600;i++){const x=(i*97.37)%n;c.strokeStyle=i%3?'rgba(47,26,12,.12)':'rgba(227,181,111,.18)';c.lineWidth=i%4===0?2:1;c.beginPath();c.moveTo(x,0);for(let y=0;y<=n;y+=12)c.lineTo(x+Math.sin(y*.027+i)*2.6+Math.sin(y*.007+i)*4,y);c.stroke()}for(let i=0;i<30;i++){c.strokeStyle='rgba(244,211,150,.08)';c.strokeRect((i*67)%n,(i*173)%n,9,70)}});
  const oak=mat('#bb9874',{map:grain,roughness:.82});const inset=mat('#8b6544',{map:grain,roughness:.89});const brass=mat('#8f713c',{metalness:.75,roughness:.42});const iron=mat('#322f26',{metalness:.65,roughness:.65});
  const hinge=new T.Group();hinge.position.set(RIGHT-.02,0,ENTRY);root.add(hinge);
  const doorWidth=.86,doorHeight=2.25;
  box(doorWidth,doorHeight,.06,oak,-doorWidth/2,doorHeight/2,0,hinge);
  // Raised panels on both sides make the exterior entry view as complete as the interior.
  for(const side of [-1,1])for(const x of [-.235,-.625])for(const [y,h]of [[.45,.57],[1.18,.62],[1.89,.43]]){
    box(.305,h,.016,inset,x,y,side*.036,hinge);
    for(const xx of [x-.163,x+.163])box(.026,h+.052,.028,oak,xx,y,side*.046,hinge);
    for(const yy of [y-h/2-.013,y+h/2+.013])box(.352,.026,.028,oak,x,yy,side*.046,hinge);
    box(.245,h-.075,.014,oak,x,y,side*.051,hinge);
  }
  for(const y of [.32,1.14,1.96]){
    const pin=new T.Mesh(new T.CylinderGeometry(.013,.013,.13,10),iron);pin.position.set(.014,y,0);hinge.add(pin);
    for(const side of [-1,1])box(.17,.024,.012,iron,-.06,y,side*.037,hinge);
  }
  for(const side of [-1,1]){
    box(.054,.23,.014,brass,-.74,1.06,side*.045,hinge);
    const knob=new T.Mesh(new T.SphereGeometry(.035,16,12),brass);knob.scale.z=.7;knob.position.set(-.74,1.11,side*.086);hinge.add(knob);
    const keyhole=new T.Mesh(new T.CircleGeometry(.009,12),iron);keyhole.position.set(-.74,1.00,side*.054);if(side<0)keyhole.rotation.y=Math.PI;hinge.add(keyhole);
  }
  for(const x of [RIGHT-.93,RIGHT+.015])box(.075,2.36,.20,oak,x,1.18,ENTRY,root);
  box(1.025,.12,.21,oak,RIGHT-.457,2.36,ENTRY,root);box(1.075,.055,.235,oak,RIGHT-.457,2.445,ENTRY,root);
  box(.9,.018,.20,mat('#8e806c'),RIGHT-.45,.009,ENTRY,root);
  let targetAngle=0;
  const door={
    open(){targetAngle=-Math.PI*.49},close(){targetAngle=0},
    get isOpen(){return targetAngle<-.5},get angle(){return hinge.rotation.y},
    update(dt){hinge.rotation.y=T.MathUtils.damp(hinge.rotation.y,targetAngle,5,dt)},
    segment(){const a=[hinge.position.x,hinge.position.z];return {a,b:[a[0]-doorWidth*Math.cos(hinge.rotation.y),a[1]+doorWidth*Math.sin(hinge.rotation.y)],thickness:.07}},
    hinge:[RIGHT-.02,ENTRY],
  };
  function contains(x,z){return areas.some(poly=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,zi]=poly[i],[xj,zj]=poly[j];if(((zi>z)!==(zj>z))&&x<(xj-xi)*(z-zi)/(zj-zi)+xi)inside=!inside}return inside})}
  function touches(x,z,s,radius){const [ax,az]=s.a,[bx,bz]=s.b;const dx=bx-ax,dz=bz-az;const t=T.MathUtils.clamp(((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz),0,1);return Math.hypot(x-ax-t*dx,z-az-t*dz)<radius+s.thickness/2}
  function blocked(x,z,radius=.16){if(!contains(x,z))return true;return segments.some(s=>touches(x,z,s,radius))||touches(x,z,door.segment(),radius)}
  return {door,blocked,areas,bounds:{minX:-3.7,maxX:4.85,minZ:-11.15,maxZ:ENTRY+2.7},root};
}
