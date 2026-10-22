// Deterministic, code-drawn fabric and bamboo textures shared by the model exporter.
export function floralPixels(size=512){
  const data=new Uint8Array(size*size*4);let seed=693;
  const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,grain=Math.sin(x*2.1)*1.8+Math.cos(y*2.4)*1.4;
    data[i]=246+grain;data[i+1]=242+grain;data[i+2]=226+grain;data[i+3]=255;
  }
  function ellipse(cx,cy,rx,ry,a,color){
    const radius=Math.ceil(Math.max(rx,ry)+1),c=Math.cos(a),s=Math.sin(a);
    for(let y=Math.floor(cy-radius);y<=cy+radius;y++)for(let x=Math.floor(cx-radius);x<=cx+radius;x++){
      const dx=x-cx,dy=y-cy,u=(dx*c+dy*s)/rx,v=(-dx*s+dy*c)/ry;
      const alpha=Math.min(1,Math.max(0,(1.07-u*u-v*v)*12));if(!alpha)continue;
      const xx=(x%size+size)%size,yy=(y%size+size)%size,i=(yy*size+xx)*4;
      for(let k=0;k<3;k++)data[i+k]=data[i+k]*(1-alpha)+color[k]*alpha;
    }
  }
  function stem(x,y,angle,length){
    for(let t=0;t<length;t+=2)ellipse(x+Math.cos(angle)*t,y+Math.sin(angle)*t,1.2,2.1,angle,[108,116,57]);
  }
  function flower(x,y,r){
    for(let layer=0;layer<2;layer++)for(let j=0;j<7;j++){
      const a=j*Math.PI*2/7+layer*.4,reach=r*(layer?.23:.58);
      ellipse(x+Math.cos(a)*reach,y+Math.sin(a)*reach,r*(layer?.38:.58),r*.30,a,[layer?124:96,layer?77:56,layer?150:124]);
      ellipse(x+Math.cos(a)*reach,y+Math.sin(a)*reach,r*.29,r*.09,a,[176,146,190]);
    }
    ellipse(x,y,r*.15,r*.16,0,[227,198,110]);
    ellipse(x-1,y+1,r*.06,r*.08,0,[83,62,56]);
  }
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
    const x=(col+.47)*size/4+(random()-.5)*22,y=(row+.45)*size/4+(random()-.5)*23;
    for(let j=0;j<5;j++){
      const a=random()*Math.PI*2,length=27+random()*24;stem(x,y,a,length);
      for(let k=0;k<2;k++){
        const t=length*(.45+k*.32),lx=x+Math.cos(a)*t,ly=y+Math.sin(a)*t;
        ellipse(lx,ly,13,4.5,a+(k?-.5:.5),[116+random()*25,124+random()*16,65]);
        ellipse(lx-1,ly-1,8,1,a+(k?-.5:.5),[175,174,106]);
      }
    }
    flower(x,y,19+random()*6);flower(x+24,y-20,13);flower(x-21,y+22,12);
  }
  return {data,width:size,height:size};
}

export function bambooPixels(size=256){
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const grain=Math.sin(x*.42+Math.sin(y*.025)*1.3)*8+Math.sin(x*1.7+y*.012)*4;
    const band=(x%64<3?-19:0)+(y%117<3?-13:0),i=(y*size+x)*4;
    data[i]=176+grain+band;data[i+1]=111+grain*.8+band;data[i+2]=51+grain*.5+band;data[i+3]=255;
  }
  return {data,width:size,height:size};
}
