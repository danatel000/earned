const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export const AMBIENT_MOTION_RATE=1.18;

export const ASCII_VIEW_PROFILES={
  total:{label:"TODAY",mode:"rise",glyphs:".:/+",accent:"#9dff00",index:1},
  log:{label:"TRAIN",mode:"bar",glyphs:".=+|#",accent:"#9dff00",index:2},
  lifts:{label:"PROGRESS",mode:"trace",glyphs:"._/+#",accent:"#54d8ff",index:3},
  prs:{label:"RECORDS",mode:"burst",glyphs:".*+#@",accent:"#ffca58",index:4},
  history:{label:"HISTORY",mode:"timeline",glyphs:".:|+",accent:"#54d8ff",index:5},
  goals:{label:"GOALS",mode:"target",glyphs:".oO0@",accent:"#9dff00",index:6},
  library:{label:"LIBRARY",mode:"grid",glyphs:".:[]#",accent:"#54d8ff",index:7},
  community:{label:"FEED",mode:"nodes",glyphs:".:o+*",accent:"#ff5a5f",index:8},
};

export function resolveAmbientAsciiBudget({view="total",compact=false,reducedMotion=false}={}){
  if(reducedMotion) return {tier:"still",particles:180,targetFps:0,dpr:1};
  if(view==="log"&&compact) return {tier:"focused-compact",particles:96,targetFps:18,dpr:1};
  if(view==="log") return {tier:"focused",particles:132,targetFps:22,dpr:1.1};
  if(compact) return {tier:"compact",particles:150,targetFps:20,dpr:1};
  return {tier:"cinematic",particles:360,targetFps:30,dpr:1.25};
}

function seededRandom(seed){
  let value=(Math.floor(finite(seed,17))>>>0)||17;
  return()=>{
    value=(value+0x6d2b79f5)|0;
    let result=Math.imul(value^(value>>>15),1|value);
    result^=result+Math.imul(result^(result>>>7),61|result);
    return ((result^(result>>>14))>>>0)/4294967296;
  };
}

function motifPoint(mode,t,width,height,random,index){
  const jitterX=(random()-0.5)*width*0.06;
  const jitterY=(random()-0.5)*height*0.08;
  if(mode==="bar"){
    const side=index%2===0?-1:1;
    return {x:width*(0.08+(t*0.84))+jitterX,y:height*(0.5+(side*0.07*Math.sin(t*Math.PI*6)))+jitterY};
  }
  if(mode==="trace") return {x:width*(0.08+(t*0.86))+jitterX,y:height*(0.84-(Math.pow(t,0.78)*0.62))+jitterY};
  if(mode==="burst"){
    const angle=t*Math.PI*10;
    const radius=(0.04+(t*0.39))*Math.min(width,height);
    return {x:(width*0.72)+(Math.cos(angle)*radius)+jitterX,y:(height*0.3)+(Math.sin(angle)*radius)+jitterY};
  }
  if(mode==="timeline") return {x:width*(0.18+(0.05*Math.sin(t*Math.PI*8)))+jitterX,y:height*(0.08+(t*0.84))+jitterY};
  if(mode==="target"){
    const ring=1+(index%4);
    const angle=t*Math.PI*14;
    const radius=ring*Math.min(width,height)*0.055;
    return {x:(width*0.77)+(Math.cos(angle)*radius)+jitterX,y:(height*0.28)+(Math.sin(angle)*radius)+jitterY};
  }
  if(mode==="grid"){
    const columns=13;
    return {x:width*(0.08+((index%columns)/(columns-1))*0.84)+jitterX,y:height*(0.12+((Math.floor(index/columns)%9)/8)*0.76)+jitterY};
  }
  if(mode==="nodes"){
    const angle=t*Math.PI*12;
    const radius=(0.12+(0.2*Math.sin(t*Math.PI*5)**2))*Math.min(width,height);
    return {x:(width*0.7)+(Math.cos(angle)*radius)+jitterX,y:(height*0.42)+(Math.sin(angle)*radius)+jitterY};
  }
  return {x:width*(0.07+(t*0.86))+jitterX,y:height*(0.79-(t*0.52)+(Math.sin(t*Math.PI*5)*0.05))+jitterY};
}

function fieldPoint(width,height,random,index){
  const columns=6;
  const rows=5;
  const marginX=width*0.025;
  const marginY=height*0.04;
  const cellWidth=(width-(marginX*2))/columns;
  const cellHeight=(height-(marginY*2))/rows;
  const column=index%columns;
  const row=Math.floor(index/columns)%rows;
  return {
    x:marginX+((column+0.14+(random()*0.72))*cellWidth),
    y:marginY+((row+0.14+(random()*0.72))*cellHeight),
  };
}

export function buildAmbientGlyphs({view="total",width=1,height=1,count=0,seed=17}={}){
  const safeWidth=Math.max(1,finite(width,1));
  const safeHeight=Math.max(1,finite(height,1));
  const safeCount=clamp(Math.floor(finite(count,0)),0,1000);
  const profile=ASCII_VIEW_PROFILES[view]||ASCII_VIEW_PROFILES.total;
  const random=seededRandom(finite(seed,17)+(profile.index*7919));
  const points=[];
  for(let index=0;index<safeCount;index+=1){
    const t=safeCount<=1?0.5:index/(safeCount-1);
    const fillsField=index%3===0;
    const motif=fillsField
      ?fieldPoint(safeWidth,safeHeight,random,Math.floor(index/3))
      :motifPoint(profile.mode,t,safeWidth,safeHeight,random,index);
    points.push({
      x:Number(clamp(motif.x,0,safeWidth).toFixed(2)),
      y:Number(clamp(motif.y,0,safeHeight).toFixed(2)),
      glyph:profile.glyphs[Math.floor(random()*profile.glyphs.length)]||".",
      alpha:Number(((fillsField?0.08:0.12)+(random()*(fillsField?0.28:0.42))).toFixed(3)),
      size:Number(((fillsField?8.5:9)+(random()*(fillsField?9.5:9))).toFixed(2)),
      phase:Number((random()*Math.PI*2).toFixed(4)),
      speed:Number((0.22+(random()*0.58)).toFixed(3)),
      field:fillsField,
    });
  }
  return points;
}

function emptyGrid(columns,rows){
  return Array.from({length:rows},()=>Array(columns).fill(" "));
}

function setCell(grid,x,y,glyph){
  if(y<0||y>=grid.length||x<0||x>=grid[0].length) return;
  grid[y][x]=glyph;
}

export function buildWorkoutAsciiFrame({volume=0,setCount=0,loggedCount=0,restRemaining=0,readiness=0,frame=0,columns=48,rows=7}={}){
  const width=clamp(Math.floor(finite(columns,48)),24,80);
  const height=clamp(Math.floor(finite(rows,7)),5,14);
  const grid=emptyGrid(width,height);
  const centerY=Math.floor(height/2);
  const safeVolume=Math.max(0,finite(volume));
  const safeSets=Math.max(0,Math.floor(finite(setCount)));
  const safeLogged=Math.max(0,Math.floor(finite(loggedCount)));
  const rest=Math.max(0,Math.floor(finite(restRemaining)));
  const ready=clamp(finite(readiness),0,100);
  const phase=Math.floor(finite(frame))%32;
  const strength=clamp((Math.log10(safeVolume+1)/5)*0.52+(safeSets/24)*0.3+(safeLogged/8)*0.18,0,1);
  const span=Math.max(12,Math.floor((width-6)*(0.42+(strength*0.58))));
  const start=Math.floor((width-span)/2);
  const end=start+span-1;
  const activeGlyph=rest>0?":":ready>=75?"#":ready>=45?"+":"=";

  for(let x=start;x<=end;x+=1) setCell(grid,x,centerY,x===start||x===end?"|":"=");
  const plateLayers=clamp(1+Math.floor(safeSets/5),1,3);
  for(let layer=0;layer<plateLayers;layer+=1){
    for(const x of [start+2+(layer*2),end-2-(layer*2)]){
      setCell(grid,x,centerY-1,"[");
      setCell(grid,x,centerY,activeGlyph);
      setCell(grid,x,centerY+1,"]");
    }
  }
  for(let x=start+1;x<end;x+=2){
    const wave=Math.round(Math.sin((x+phase)*0.52)*(1+Math.floor(strength*1.6)));
    setCell(grid,x,clamp(centerY+wave,0,height-1),rest>0?(x+phase)%3===0?"o":":":activeGlyph);
  }
  const pulseX=start+((phase+safeSets)%Math.max(1,span));
  setCell(grid,pulseX,centerY,"@");
  if(rest>0){
    const restWidth=Math.min(width-4,6+String(rest).length*3);
    for(let x=Math.floor((width-restWidth)/2);x<Math.floor((width+restWidth)/2);x+=1){
      if((x+phase)%2===0) setCell(grid,x,0,".");
    }
  }
  return grid.map(row=>row.join("")).join("\n");
}

export function buildMilestoneAsciiFrame({volume=0,streak=0,isPR=false,frame=0,columns=52,rows=8}={}){
  const width=clamp(Math.floor(finite(columns,52)),28,84);
  const height=clamp(Math.floor(finite(rows,8)),6,16);
  const grid=emptyGrid(width,height);
  const centerX=Math.floor(width/2);
  const centerY=Math.floor(height/2);
  const safeVolume=Math.max(0,finite(volume));
  const safeStreak=Math.max(0,Math.floor(finite(streak)));
  const phase=Math.floor(finite(frame))%24;
  const radius=clamp(2+Math.floor(Math.log10(safeVolume+1))+(isPR?1:0),2,Math.floor(height/2));
  const glyphs=isPR?".+#@":".:+*";
  for(let x=1;x<width-1;x+=1){
    const distance=Math.abs(x-centerX);
    const wave=Math.round(Math.sin((x+phase)*0.36)*(radius-1));
    if(distance<=Math.floor(width*(0.24+Math.min(0.14,safeStreak*0.006)))){
      const glyph=glyphs[(distance+phase+safeStreak)%glyphs.length];
      setCell(grid,x,clamp(centerY+wave,0,height-1),glyph);
      if((x+phase)%3===0) setCell(grid,x,clamp(centerY-wave,0,height-1),glyph);
    }
  }
  setCell(grid,centerX-1,centerY,isPR?"P":"+");
  setCell(grid,centerX,centerY,isPR?"R":"@");
  setCell(grid,centerX+1,centerY,isPR?"!":"+");
  return grid.map(row=>row.join("")).join("\n");
}
