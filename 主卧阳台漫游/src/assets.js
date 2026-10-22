// Eight independent, ground-origin GLB models; fronts face local +Z.
export function balconyAssets(T){
  const mat=(name,color,roughness=.72,metalness=0)=>{const m=new T.MeshStandardMaterial({color,roughness,metalness});m.name=name;return m;};
  const bamboo=mat('bamboo','#ffffff'),darkWood=mat('bamboo-edge','#704321');
  const ivory=mat('glazed-ivory','#eee9da',.27),chrome=mat('chrome','#bfc5c4',.21,.85);
  const purple=mat('bucket-purple','#823ac0',.38),lavender=mat('bucket-lavender','#d1bce8',.43);
  const floral=mat('floral-cover','#ffffff',.98);floral.side=T.DoubleSide;
  function box(g,name,w,h,d,x,y,z,m){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.name=name;o.position.set(x,y,z);g.add(o);return o;}
  function cyl(g,name,rt,rb,h,x,y,z,m,n=28){const o=new T.Mesh(new T.CylinderGeometry(rt,rb,h,n),m);o.name=name;o.position.set(x,y,z);g.add(o);return o;}
  function sphere(g,name,x,y,z,sx,sy,sz,m){const o=new T.Mesh(new T.SphereGeometry(1,16,10),m);o.name=name;o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;}
  function rod(g,name,a,b,r,m){const delta=new T.Vector3(...b).sub(new T.Vector3(...a));const o=cyl(g,name,r,r,delta.length(),...(new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5).toArray()),m,12);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
  function pot(g,x,y,z,r,h){
    const stone=mat('old-stone-pot','#aaa99b',.92);
    cyl(g,'灰色花盆',r,r*.70,h,x,y+h/2,z,stone);cyl(g,'花盆口沿',r*1.05,r*1.05,.025,x,y+h,z,stone);
    cyl(g,'花盆泥土',r*.86,r*.86,.009,x,y+h+.006,z,mat('soil','#453a28'));
  }

  function washingMachine(){
    const g=new T.Group();g.name='紫花布罩顶开式洗衣机';
    box(g,'洗衣机白色机身',.62,.86,.61,0,.47,0,ivory);
    box(g,'洗衣机底座',.60,.09,.59,0,.065,0,mat('washer-base','#737c79'));
    box(g,'控制台',.60,.075,.12,0,.935,-.23,mat('control','#e2dfd4',.3));
    for(let i=0;i<4;i++)cyl(g,'洗衣机控制按钮',.015,.015,.014,-.17+i*.075,.980,-.23,i===0?mat('power','#aeb985'):chrome,16);
    const lid=new T.Group();lid.name='washer-lid';lid.position.set(0,.92,-.19);
    box(lid,'顶开洗衣机盖',.54,.032,.43,0,.02,.205,mat('lid','#c7d6d4',.24,.15));
    box(lid,'洗衣机盖把手',.17,.022,.035,0,.043,.365,ivory);g.add(lid);
    box(g,'机器品牌铭牌',.13,.035,.006,0,.76,.309,mat('badge','#78918d',.4));
    const cover=new T.Group();cover.name='washer-cover';g.add(cover);
    // Draped front with a softly uneven hem, and cloth over both sides and top.
    const clothGeo=new T.PlaneGeometry(.68,.91,24,32),p=clothGeo.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getX(i)*39)*.009+Math.sin(p.getY(i)*18)*.003);
    clothGeo.computeVertexNormals();const front=new T.Mesh(clothGeo,floral);front.name='紫花洗衣机罩正面';front.position.set(0,.495,.328);cover.add(front);
    for(const x of [-.329,.329]){const side=new T.Mesh(new T.PlaneGeometry(.65,.91,1,1),floral);side.name='紫花布罩侧面';side.rotation.y=Math.PI/2;side.position.set(x,.495,0);cover.add(side);}
    const top=new T.Mesh(new T.PlaneGeometry(.68,.65,18,18),floral);top.name='紫花布罩顶面';top.rotation.x=-Math.PI/2;top.position.set(0,.975,0);cover.add(top);
    const towel=mat('towel','#c7bfb0',1);sphere(cover,'搭在机罩上的毛巾',.10,1.005,-.05,.20,.035,.10,towel);sphere(cover,'叠起的毛巾',.19,1.035,-.10,.12,.045,.09,towel);
    return g;
  }
  function bucket(){
    const g=new T.Group();g.name='紫色水桶与浅紫色滤篮';
    const shape=new T.Shape();shape.moveTo(.18,0);shape.lineTo(.225,.29);shape.lineTo(.208,.30);shape.lineTo(.165,.022);shape.lineTo(.18,0);
    const shell=new T.Mesh(new T.LatheGeometry([new T.Vector2(.15,0),new T.Vector2(.18,.02),new T.Vector2(.22,.28),new T.Vector2(.222,.30),new T.Vector2(.205,.30),new T.Vector2(.165,.025)],48),purple);shell.name='中空紫色桶身';g.add(shell);
    cyl(g,'水桶底板',.165,.15,.025,0,.012,0,purple);
    const rim=new T.Mesh(new T.TorusGeometry(.216,.014,10,48),lavender);rim.rotation.x=Math.PI/2;rim.position.y=.295;g.add(rim);
    const basket=new T.Group();basket.position.set(-.065,.23,-.015);basket.rotation.z=-.08;g.add(basket);
    const ring=new T.Mesh(new T.TorusGeometry(.112,.025,10,40),lavender);ring.rotation.x=Math.PI/2;basket.add(ring);
    for(let i=0;i<28;i++){const a=i*Math.PI*2/28;rod(basket,'滤篮网格',[Math.cos(a)*.08,-.095,Math.sin(a)*.08],[Math.cos(a)*.11,0,Math.sin(a)*.11],.003,lavender);}
    cyl(basket,'滤篮底',.08,.075,.008,0,-.095,0,lavender);
    const points=Array.from({length:25},(_,i)=>new T.Vector3(Math.cos(Math.PI*i/24)*.22,.29+Math.sin(Math.PI*i/24)*.19,0));
    const handle=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.009,8,false),lavender);handle.name='水桶提手';g.add(handle);
    return g;
  }
  function plantRack(){
    const g=new T.Group();g.name='三层竹木花架与绿萝灰花盆';
    for(const x of [-.365,.365]){
      rod(g,'后立柱',[x,.02,-.22],[x,1.20,-.22],.021,bamboo);
      rod(g,'前支腿',[x,.02,.24],[x,.35,.24],.023,bamboo);
      rod(g,'斜支撑',[x,.10,.23],[x,1.12,-.22],.016,bamboo);
    }
    const shelves=[[.31,.15,.31],[.71,-.015,.27],[1.10,-.17,.22]];
    shelves.forEach(([y,z,d],tier)=>{
      for(const x of [-.365,.365])box(g,'层架侧横撑',.042,.055,d+.07,x,y-.027,z,darkWood);
      for(let i=0;i<4;i++)box(g,`第${tier+1}层竹木板`,.81,.025,d/4-.008,0,y,z-d/2+(i+.5)*d/4,bamboo);
      box(g,'层架前沿',.83,.045,.024,0,y-.01,z+d/2,bamboo);
    });
    rod(g,'背面交叉撑',[-.36,.12,-.23],[.36,1.10,-.23],.012,darkWood);rod(g,'背面交叉撑',[.36,.12,-.23],[-.36,1.10,-.23],.012,darkWood);
    pot(g,-.20,1.12,-.15,.105,.16);pot(g,.105,1.12,-.16,.075,.23);pot(g,.28,1.12,-.13,.06,.15);
    const green=[mat('leaf','#486a25',.83),mat('leaf-light','#72923b',.83),mat('leaf-gold','#8d9f40',.83)];
    const leafShape=new T.Shape();leafShape.moveTo(0,-.09);leafShape.bezierCurveTo(-.13,0,-.08,.13,0,.065);leafShape.bezierCurveTo(.08,.13,.13,0,0,-.09);
    const leafGeo=new T.ShapeGeometry(leafShape);green.forEach(m=>m.side=T.DoubleSide);
    for(let vine=0;vine<6;vine++){
      const points=[];
      for(let i=0;i<8;i++){
        const t=i/7,x=-.20+Math.cos(vine*1.8)*t*.20,y=1.39-t*t*.42,z=-.15+Math.sin(vine*1.8)*t*.22;
        points.push(new T.Vector3(x,y,z));
        const leaf=new T.Mesh(leafGeo,green[(i+vine)%3]);leaf.name='绿萝心形叶片';leaf.position.set(x+(i%2?-.035:.035),y,z);leaf.rotation.set(-.45+vine*.12,vine*1.37,i%2?.65:-.65);leaf.scale.setScalar(.65+(i%3)*.16);g.add(leaf);
      }
      const stem=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),18,.004,5,false),green[0]);stem.name='垂落绿萝藤蔓';g.add(stem);
    }
    return g;
  }
  function washStand(){
    const g=new T.Group();g.name='左侧瓷面洗衣台';
    const stone=mat('sink-stone','#d4d3c5',.65);
    box(g,'洗衣台左支脚',.08,.80,.56,-.39,.40,0,stone);box(g,'洗衣台右支脚',.08,.80,.56,.39,.40,0,stone);
    box(g,'洗衣台底层隔板',.73,.05,.49,0,.16,0,stone);
    // Build the rim around an actual open bowl instead of using a solid box.
    box(g,'后挡水沿',.90,.10,.065,0,.89,-.29,ivory);box(g,'前侧台沿',.90,.07,.09,0,.85,.27,ivory);
    box(g,'左侧台沿',.09,.07,.51,-.405,.85,-.01,ivory);box(g,'搓衣板置物台',.25,.07,.51,.325,.85,-.01,ivory);
    box(g,'水槽底',.54,.035,.37,-.09,.61,0,ivory);
    for(const x of [-.37,.19])box(g,'水槽内侧壁',.035,.22,.43,x,.73,0,ivory);
    for(const z of [-.22,.22])box(g,'水槽前后壁',.56,.22,.035,-.09,.73,z,ivory);
    cyl(g,'水槽金属下水口',.037,.037,.008,-.09,.633,.07,chrome);
    cyl(g,'水槽下水管',.027,.027,.43,-.09,.39,.07,ivory,16);
    box(g,'洗衣台前饰条',.76,.11,.035,0,.77,.30,stone);
    return g;
  }
  function faucet(){
    const g=new T.Group();g.name='洗衣台鹅颈水龙头';
    cyl(g,'龙头底座',.037,.043,.025,0,.012,0,chrome);
    const points=[new T.Vector3(0,.02,0),new T.Vector3(0,.20,0),new T.Vector3(0,.28,.04),new T.Vector3(0,.26,.13),new T.Vector3(0,.20,.14)];
    const tube=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),32,.014,12,false),chrome);tube.name='弯曲金属出水管';g.add(tube);
    cyl(g,'出水口',.019,.017,.025,0,.195,.14,chrome,20);
    rod(g,'龙头开关杆',[.025,.08,0],[.095,.12,0],.011,chrome);
    return g;
  }
  function soapDish(){
    const g=new T.Group();g.name='肥皂盒与黄色肥皂';
    box(g,'肥皂盒底',.14,.014,.09,0,.012,0,mat('soap-dish','#c9ded0',.35));
    for(const x of [-.066,.066])box(g,'肥皂盒边',.009,.025,.09,x,.021,0,ivory);
    for(const z of [-.041,.041])box(g,'肥皂盒边',.14,.025,.009,0,.021,z,ivory);
    sphere(g,'淡黄色肥皂',0,.040,0,.056,.022,.034,mat('soap','#eadb85',.47));
    return g;
  }
  function washboard(){
    const g=new T.Group();g.name='木质搓衣板';
    box(g,'搓衣板底板',.25,.025,.47,0,.016,0,bamboo);
    for(const x of [-.12,.12])box(g,'搓衣板木边',.022,.04,.49,x,.026,0,darkWood);
    for(let i=0;i<15;i++)box(g,'搓衣凸棱',.21,.019,.012,0,.039,-.18+i*.026,bamboo);
    box(g,'搓衣板提手',.20,.028,.032,0,.025,-.23,darkWood);
    return g;
  }
  function broom(){
    const g=new T.Group();g.name='桃红色扫帚';
    const pink=mat('broom-pink','#ac3d68',.64);
    rod(g,'扫帚长杆',[0,.11,0],[.045,1.22,-.03],.010,pink);
    box(g,'扫帚头横梁',.22,.045,.035,0,.15,0,pink);
    for(let i=0;i<24;i++)box(g,'扫帚刷毛',.007,.13,.035,-.105+i*.009,.067,0,mat('bristles','#b4933e'));
    return g;
  }
  return {washingMachine,bucket,plantRack,washStand,faucet,soapDish,washboard,broom};
}
