import {useEffect,useRef,useState} from "react";
import {
  AMBIENT_MOTION_RATE,
  ASCII_VIEW_PROFILES,
  buildAmbientGlyphs,
  resolveAmbientAsciiBudget,
} from "./ambientAscii.js";

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export default function AppAsciiAtmosphere({view="total",trackingMode="weekly",activity=0}){
  const canvasRef=useRef(null);
  const [state,setState]=useState("booting");
  const [tier,setTier]=useState("booting");
  const profile=ASCII_VIEW_PROFILES[view]||ASCII_VIEW_PROFILES.total;

  useEffect(()=>{
    const canvas=canvasRef.current;
    const context=canvas?.getContext("2d",{alpha:true});
    if(!canvas||!context){
      setState("static");
      setTier("still");
      return undefined;
    }

    const reducedQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery=window.matchMedia("(max-width: 640px)");
    const pointerQuery=window.matchMedia("(hover: hover) and (pointer: fine)");
    let reduced=reducedQuery.matches;
    let compact=compactQuery.matches;
    let budget=resolveAmbientAsciiBudget({view,compact,reducedMotion:reduced});
    let points=[];
    let width=1;
    let height=1;
    let frameId=0;
    let lastFrame=0;
    let hidden=document.hidden;
    let disposed=false;
    let pointerX=0;
    let pointerY=0;
    let targetPointerX=0;
    let targetPointerY=0;

    const seed=(profile.index*1009)+(String(trackingMode).length*97)+(Math.floor(Number(activity)||0)*13);
    const setCanvasSize=()=>{
      compact=compactQuery.matches;
      budget=resolveAmbientAsciiBudget({view,compact,reducedMotion:reduced});
      const dpr=Math.min(window.devicePixelRatio||1,budget.dpr);
      width=Math.max(1,window.innerWidth);
      height=Math.max(1,window.innerHeight);
      canvas.width=Math.max(1,Math.round(width*dpr));
      canvas.height=Math.max(1,Math.round(height*dpr));
      canvas.style.width=`${width}px`;
      canvas.style.height=`${height}px`;
      context.setTransform(dpr,0,0,dpr,0,0);
      points=buildAmbientGlyphs({view,width,height,count:budget.particles,seed});
      setTier(budget.tier);
    };

    const drawRails=(time)=>{
      context.save();
      context.lineWidth=1;
      context.setLineDash([2,9]);
      context.strokeStyle="rgba(84,216,255,0.09)";
      const railWidth=Math.min(width-28,1180);
      const contentLeft=Math.max(14,(width-railWidth)/2);
      const contentRight=Math.min(width-14,contentLeft+railWidth);
      context.beginPath();
      context.moveTo(contentLeft,86);
      context.lineTo(contentLeft,height-26);
      context.moveTo(contentRight,86);
      context.lineTo(contentRight,height-26);
      context.moveTo(contentLeft,height-31);
      context.lineTo(contentRight,height-31);
      context.stroke();

      const scanX=contentLeft+(((time*0.018)%(Math.max(1,contentRight-contentLeft))));
      context.setLineDash([]);
      context.strokeStyle="rgba(157,255,0,0.12)";
      context.beginPath();
      context.moveTo(scanX,height-35);
      context.lineTo(scanX+28,height-35);
      context.stroke();

      context.fillStyle="rgba(130,145,138,0.28)";
      context.font='700 8px "Cascadia Mono","Courier New",monospace';
      context.textAlign="right";
      context.fillText(`${profile.label} / 0${profile.index}`,contentRight-6,height-42);
      context.textAlign="left";
      context.fillStyle="rgba(84,216,255,0.22)";
      context.fillText(`${String(trackingMode).toUpperCase()} SIGNAL`,contentLeft+6,height-42);
      context.restore();
    };

    const drawConnections=(time)=>{
      if(points.length<8) return;
      context.save();
      context.lineWidth=0.7;
      context.strokeStyle=view==="community"?"rgba(255,90,95,0.075)":"rgba(84,216,255,0.055)";
      context.beginPath();
      for(let index=0;index<points.length-7;index+=7){
        const first=points[index];
        const second=points[index+7];
        const drift=Math.sin((time*0.00025)+first.phase)*5;
        context.moveTo(first.x,first.y+drift);
        context.lineTo(second.x,second.y-drift);
      }
      context.stroke();
      context.restore();
    };

    const drawFrame=(timestamp)=>{
      const time=reduced?1640:timestamp*AMBIENT_MOTION_RATE;
      context.clearRect(0,0,width,height);
      pointerX+=(targetPointerX-pointerX)*0.055;
      pointerY+=(targetPointerY-pointerY)*0.055;
      drawRails(time);
      drawConnections(time);

      context.save();
      context.textAlign="center";
      context.textBaseline="middle";
      const pointerShiftX=reduced?0:pointerX*8;
      const pointerShiftY=reduced?0:pointerY*5;
      points.forEach((point,index)=>{
        const driftX=reduced?0:Math.cos((time*0.00018*point.speed)+point.phase)*10*point.speed;
        const driftY=reduced?0:Math.sin((time*0.00024*point.speed)+point.phase)*9*point.speed;
        const pulse=reduced?0.48:0.34+(Math.sin((time*0.0014)+(point.phase*2)+(index*0.07))*0.14);
        const coral=index%31===0&&view!=="total";
        const cyan=index%5===0;
        context.fillStyle=coral
          ?`rgba(255,90,95,${clamp(point.alpha*pulse,0.035,0.18)})`
          :cyan
            ?`rgba(84,216,255,${clamp(point.alpha*pulse,0.03,0.16)})`
            :`${profile.accent}${Math.round(clamp(point.alpha*pulse,0.025,0.17)*255).toString(16).padStart(2,"0")}`;
        context.font=`700 ${point.size}px "Cascadia Mono","Courier New",monospace`;
        context.fillText(point.glyph,point.x+driftX+pointerShiftX,point.y+driftY+pointerShiftY);
      });
      context.restore();
    };

    const animate=timestamp=>{
      frameId=0;
      if(disposed||hidden) return;
      const minimumFrameTime=budget.targetFps>0?1000/budget.targetFps:Infinity;
      if(timestamp-lastFrame>=minimumFrameTime){
        drawFrame(timestamp);
        lastFrame=timestamp;
      }
      if(!reduced) frameId=requestAnimationFrame(animate);
    };
    const requestRender=()=>{
      if(frameId||disposed||hidden) return;
      if(reduced) drawFrame(1640);
      else frameId=requestAnimationFrame(animate);
    };
    const handlePointer=event=>{
      if(reduced||!pointerQuery.matches) return;
      targetPointerX=((event.clientX/window.innerWidth)-0.5)*2;
      targetPointerY=((event.clientY/window.innerHeight)-0.5)*2;
    };
    const handleResize=()=>{setCanvasSize();requestRender();};
    const handleVisibility=()=>{
      hidden=document.hidden;
      if(hidden&&frameId){cancelAnimationFrame(frameId);frameId=0;}
      if(!hidden) requestRender();
    };
    const handleMotionChange=event=>{
      reduced=event.matches;
      if(frameId){cancelAnimationFrame(frameId);frameId=0;}
      setCanvasSize();
      requestRender();
    };

    setCanvasSize();
    drawFrame(reduced?1640:performance.now());
    setState("live");
    requestRender();
    window.addEventListener("resize",handleResize,{passive:true});
    window.addEventListener("pointermove",handlePointer,{passive:true});
    document.addEventListener("visibilitychange",handleVisibility);
    reducedQuery.addEventListener?.("change",handleMotionChange);
    compactQuery.addEventListener?.("change",handleResize);

    return()=>{
      disposed=true;
      if(frameId) cancelAnimationFrame(frameId);
      window.removeEventListener("resize",handleResize);
      window.removeEventListener("pointermove",handlePointer);
      document.removeEventListener("visibilitychange",handleVisibility);
      reducedQuery.removeEventListener?.("change",handleMotionChange);
      compactQuery.removeEventListener?.("change",handleResize);
      context.clearRect(0,0,width,height);
    };
  },[activity,profile,trackingMode,view]);

  return(
    <div className="earned-app-ascii" data-ascii-view={view} data-ascii-tier={tier}
      data-ascii-state={state} data-ascii-rate={AMBIENT_MOTION_RATE} aria-hidden="true">
      <canvas ref={canvasRef} className="earned-app-ascii__canvas"/>
    </div>
  );
}
