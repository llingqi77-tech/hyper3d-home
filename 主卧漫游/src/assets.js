// Standalone furniture factories. The same geometry is exported to GLB and used in the page.
export function furniture(T) {
  const material = (color, roughness=.72, metalness=0) => new T.MeshStandardMaterial({ color, roughness, metalness });
  const wood = material('#825638');
  const woodLight = material('#a8764f');
  const woodEdge = material('#563924');
  const brass = material('#ba995d', .3, .68);
  const linen = material('#d9dfc6', .95);
  const sheet = material('#75936d', .91);
  const duvet = material('#648463', .97);
  const pillow = material('#a8bda0', .96);
  const glass = new T.MeshPhysicalMaterial({ color:'#b9d5d5', metalness:.12, roughness:.14, transparent:true, opacity:.32, depthWrite:false, side:T.DoubleSide });
  const metal = material('#776a58', .4, .65);

  function box(parent, name, size, pos, mat) {
    const mesh = new T.Mesh(new T.BoxGeometry(...size), mat);
    mesh.name=name;mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(parent,name,rTop,rBottom,height,pos,mat,segments=24) {
    const mesh=new T.Mesh(new T.CylinderGeometry(rTop,rBottom,height,segments),mat);
    mesh.name=name;mesh.position.set(...pos);mesh.castShadow=true;parent.add(mesh);return mesh;
  }

  function wardrobe() {
    const g=new T.Group();g.name='主卧四门木质衣柜';
    box(g,'柜体',[.52,2.06,1.68],[0,1.03,0],wood);
    box(g,'柜顶线条',[.59,.075,1.77],[0,2.095,0],woodEdge);
    box(g,'柜底座',[.58,.105,1.74],[0,.07,0],woodEdge);
    for(let i=0;i<4;i++){
      const z=-.60+i*.40;
      box(g,`柜门${i+1}`,[.026,1.75,.38],[.278,1.12,z],woodLight);
      box(g,`柜门内框${i+1}`,[.032,1.57,.30],[.298,1.12,z],wood);
      box(g,`柜门饰板${i+1}`,[.037,1.43,.23],[.32,1.11,z],woodLight);
      const handleZ=z+(i%2===0?.13:-.13);
      cylinder(g,`柜门黄铜拉手${i+1}`,.017,.017,.088,[.354,1.13,handleZ],brass).rotation.z=Math.PI/2;
    }
    box(g,'侧面立柱',[.58,1.98,.055],[0,1.04,-.85],woodEdge);
    box(g,'另一侧立柱',[.58,1.98,.055],[0,1.04,.85],woodEdge);
    return g;
  }

  function bed() {
    const g=new T.Group();g.name='木床与绿色床品';
    // Headboard faces the west wall; bed length runs east-west.
    box(g,'实木床框',[2.20,.19,1.66],[0,.32,0],wood);
    box(g,'床垫',[2.04,.20,1.55],[0,.49,0],linen);
    for(const x of [-.94,.94])for(const z of [-.72,.72])box(g,'床脚',[.105,.35,.105],[x,.175,z],woodEdge);
    box(g,'木质床头板',[.14,.95,1.80],[-1.13,.66,0],woodLight);
    for(const z of [-.72,.72])box(g,'床头板立柱',[.12,1.05,.115],[-1.13,.64,z],woodEdge);
    for(let z=-.55;z<.6;z+=.27)box(g,'床头木格条',[.035,.73,.056],[-1.05,.69,z],wood);
    box(g,'绿色床单',[1.98,.025,1.50],[0,.61,0],sheet);
    box(g,'绿色被褥',[1.32,.075,1.51],[.30,.67,0],duvet);
    box(g,'被褥折边',[.12,.016,1.51],[-.40,.716,0],pillow);
    for(const z of [-.40,.40]){
      box(g,'浅绿色枕头',[.34,.095,.58],[-.71,.69,z],pillow);
      box(g,'枕头织边',[.015,.01,.54],[-.86,.745,z],sheet);
    }
    return g;
  }

  function nightstand() {
    const g=new T.Group();g.name='木质床头柜';
    box(g,'床头柜柜体',[.46,.43,.48],[0,.29,0],wood);
    box(g,'床头柜台面',[.50,.052,.51],[0,.53,0],woodLight);
    for(const y of [.22,.40]){
      box(g,'抽屉面板',[.025,.145,.43],[.244,y,0],woodLight);
      cylinder(g,'黄铜抽屉拉手',.017,.017,.09,[.265,y,0],brass).rotation.z=Math.PI/2;
    }
    for(const x of [-.17,.17])for(const z of [-.17,.17])box(g,'床头柜腿',[.055,.085,.055],[x,.045,z],woodEdge);
    return g;
  }

  function desk() {
    const g=new T.Group();g.name='木质书桌';
    // Compact writing desk with its usable side facing into the room.
    box(g,'书桌桌面',[1.10,.085,.58],[0,.77,0],woodLight);
    box(g,'桌面木沿',[1.13,.045,.61],[0,.715,0],woodEdge);
    for(const x of [-.48,.48])for(const z of [-.22,.22])
      box(g,'书桌桌腿',[.075,.70,.075],[x,.35,z],wood);
    box(g,'桌下抽屉柜',[.43,.23,.48],[-.27,.60,-.015],wood);
    for(const y of [.56,.65]){
      box(g,'书桌抽屉面板',[.018,.075,.43],[-.045,y,-.025],woodLight);
      cylinder(g,'书桌抽屉拉手',.014,.014,.065,[-.031,y,-.025],brass).rotation.z=Math.PI/2;
    }
    box(g,'桌后横撑',[.94,.065,.055],[0,.34,.22],woodEdge);
    return g;
  }

  function mainDoor() {
    const g=new T.Group();g.name='木质入户大门';
    const doorWood=material('#70472f'),doorInset=material('#926341'),doorTrim=material('#553722');
    // Origin is the left hinge; the leaf swings inward into the bedroom.
    box(g,'实木门扇',[.75,2.20,.065],[.375,1.10,0],doorWood);
    box(g,'门板内框',[.60,1.92,.018],[.375,1.11,-.041],doorTrim);
    for(const y of [.63,1.57])box(g,'门板装饰芯',[.48,.70,.022],[.375,y,-.054],doorInset);
    box(g,'门扇上横档',[.75,.075,.085],[.375,2.13,0],doorTrim);
    box(g,'门扇下横档',[.75,.075,.085],[.375,.10,0],doorTrim);
    for(const y of [.28,1.92])box(g,'黄铜门合页',[.035,.13,.018],[.018,y,-.053],brass);
    cylinder(g,'黄铜门把手底座',.052,.052,.018,[.65,1.02,-.055],brass);
    cylinder(g,'黄铜门把手',.028,.028,.085,[.65,1.02,-.105],brass,20).rotation.x=Math.PI/2;
    return g;
  }

  function slidingDoor() {
    const g=new T.Group();g.name='四扇玻璃推拉门';
    const width=.77,h=2.25;
    box(g,'上滑轨',[3.17,.045,.105],[0,2.27,0],metal);
    box(g,'下滑轨',[3.17,.038,.105],[0,.018,0],metal);
    for(let i=0;i<4;i++){
      const panel=new T.Group();panel.name=`slider-${i}`;panel.position.x=(i-1.5)*width;
      const z=i%2===0?-.018:.018;
      box(panel,'玻璃',[width-.062,h-.105,.009],[0,1.145,z],glass);
      for(const x of [-width/2+.025,width/2-.025])box(panel,'竖框',[.042,h,.068],[x,h/2,z],metal);
      for(const y of [.035,h-.035])box(panel,'横框',[width,.042,.068],[0,y,z],metal);
      box(panel,'中腰框',[width,.022,.07],[0,1.00,z],metal);
      box(panel,'拉手',[.018,.15,.025],[i<2?width/2-.09:-width/2+.09,1.08,z+.058],brass);
      g.add(panel);
    }
    return g;
  }


  return { wardrobe, bed, nightstand, slidingDoor, desk, mainDoor };
}
