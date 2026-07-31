import {useEffect,useRef,useState} from "react";
import {imageDataToAscii} from "./asciiMath.js";
import {createGlyphComposer,resolveGlyphForgeBudget} from "./glyphForgeShaders.js";
import {createStrengthSculpture} from "./createStrengthSculpture.js";

const BRIGHT_RAMP=" .,:;i1tfLCG08@#$%&";
const PHASES=["LOAD","DRIVE","LOCKOUT","EARN"];
const STATIC_SIGNAL=[
  "                         .,:;ii;:,.                         ",
  "                 .;1tLCG08@@80GCLt1;.                 ",
  "          .,:itCG8@#$%&&&&&&%$#@8GCti:,.          ",
  "   .;tG8@#$%&@8GCLft111111tfLCG8@&%$#@8Gt;.   ",
  "==G@&%$#@8GCLfti;::::::::::;itfLCG8@#$%&@G==",
  "   ':tG8@#$%&@8GCLft111111tfLCG8@&%$#@8Gt:'   ",
  "          ',:itCG8@#$%&&&&&&%$#@8GCti:,'          ",
  "                 ':;1tLCG08@@80GCLt1;:'                 ",
  "                         ',:;ii;:,'                         ",
].join("\n");

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export default function EarnedAsciiScene(){
  const hostRef=useRef(null);
  const canvasRef=useRef(null);
  const asciiRef=useRef(null);
  const phaseRef=useRef(null);
  const phaseTrackRef=useRef(null);
  const [renderState,setRenderState]=useState("booting");
  const [renderTier,setRenderTier]=useState("booting");
  const [floatingDumbbellCount,setFloatingDumbbellCount]=useState(0);

  useEffect(()=>{
    const host=hostRef.current;
    const canvas=canvasRef.current;
    if(!host||!canvas) return undefined;

    const reducedQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    const compactQuery=window.matchMedia("(max-width: 640px)");
    const pointerQuery=window.matchMedia("(hover: hover) and (pointer: fine)");
    const saveData=Boolean(navigator.connection?.saveData);
    if(saveData){
      setRenderTier("static");
      setRenderState("static");
      return undefined;
    }

    let disposed=false;
    let renderer=null;
    let camera=null;
    let scene=null;
    let composer=null;
    let sculptureBundle=null;
    let sculpture=null;
    let handles=null;
    let frameId=0;
    let resizeObserver=null;
    let viewportObserver=null;
    let visible=true;
    let documentVisible=!document.hidden;
    let reduced=reducedQuery.matches;
    let compact=compactQuery.matches;
    let budget=resolveGlyphForgeBudget({compact,reducedMotion:reduced});
    let lastFrame=0;
    let lastAsciiFrame=0;
    let pointerX=0;
    let pointerY=0;
    let targetPointerX=0;
    let targetPointerY=0;
    let scrollProgress=0;
    let lastPhase=-1;
    const sampleCanvas=document.createElement("canvas");
    const sampleContext=sampleCanvas.getContext("2d",{willReadFrequently:true});

    const canAnimate=()=>!disposed&&!reduced&&visible&&documentVisible&&budget.targetFps>0;
    const placeSculpture=()=>{
      if(!sculpture) return;
      sculpture.position.set(compact?0.08:1.72,compact?0.98:0.46,0);
      sculpture.scale.setScalar(compact?0.51:0.94);
    };
    const updateBudget=()=>{
      compact=compactQuery.matches;
      budget=resolveGlyphForgeBudget({compact,reducedMotion:reduced});
      composer?.setBudget(budget);
      placeSculpture();
      if(!disposed) setRenderTier(budget.tier);
    };

    const resize=()=>{
      if(!renderer||!camera||!composer) return;
      updateBudget();
      const rect=host.getBoundingClientRect();
      const width=Math.max(1,Math.round(rect.width));
      const height=Math.max(1,Math.round(rect.height));
      renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,budget.dpr));
      renderer.setSize(width,height,false);
      composer.resize(width,height);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    };

    const writeAsciiFrame=()=>{
      if(!sampleContext||!asciiRef.current) return;
      const columns=compact?52:94;
      const rows=compact?28:44;
      sampleCanvas.width=columns;
      sampleCanvas.height=rows;
      try{
        sampleContext.clearRect(0,0,columns,rows);
        sampleContext.drawImage(canvas,0,0,columns,rows);
        const pixels=sampleContext.getImageData(0,0,columns,rows).data;
        asciiRef.current.textContent=imageDataToAscii(pixels,columns,rows,{
          columns,
          rows,
          aspectCorrection:false,
          ramp:BRIGHT_RAMP,
        });
      }catch{
        asciiRef.current.textContent=STATIC_SIGNAL;
      }
    };

    const updateTelemetry=elapsed=>{
      const phaseProgress=(elapsed%4)/4;
      const phaseIndex=Math.floor(phaseProgress*PHASES.length)%PHASES.length;
      if(phaseIndex!==lastPhase&&phaseRef.current){
        phaseRef.current.textContent=PHASES[phaseIndex];
        phaseRef.current.dataset.phase=PHASES[phaseIndex].toLowerCase();
        lastPhase=phaseIndex;
      }
      if(phaseTrackRef.current) phaseTrackRef.current.style.transform=`scaleX(${phaseProgress.toFixed(3)})`;
      return phaseProgress;
    };

    const animateSculpture=elapsed=>{
      if(!sculpture||!handles||!camera) return 0;
      const mechanicalPulse=(Math.sin(elapsed*Math.PI)+1)/2;
      pointerX+=(targetPointerX-pointerX)*0.052;
      pointerY+=(targetPointerY-pointerY)*0.052;
      sculpture.rotation.x=(-0.075+(pointerY*0.16))+(reduced?0:Math.sin(elapsed*0.31)*0.024);
      sculpture.rotation.y=-0.12+(scrollProgress*0.66)+(pointerX*0.27)+(reduced?0:Math.sin(elapsed*0.19)*0.07);
      sculpture.rotation.z=reduced?0:Math.sin(elapsed*0.15)*0.014;
      camera.position.x=pointerX*(compact?0:0.18);
      camera.position.y=pointerY*(compact?0:0.1);

      handles.plateStacks.forEach(({group,side,baseX,index})=>{
        const expansion=(scrollProgress*0.34)+(mechanicalPulse*0.018*(index+1));
        group.position.x=baseX+(side*expansion);
        group.rotation.x=side*elapsed*(0.035+(index*0.012));
      });
      handles.plateRims.forEach((rim,index)=>{
        rim.rotation.x=(elapsed*(0.08+(index%3)*0.018))*(index%2===0?1:-1);
      });
      handles.progressRings.forEach((ring,index)=>{
        ring.rotation.z=(elapsed*(0.07+(index*0.026)))*(index%2===0?1:-1);
        ring.rotation.y=(index*0.24)+(scrollProgress*(0.16+(index*0.04)));
      });
      handles.floatingDumbbells.forEach(({group,basePosition,baseRotation,phase,speed,index})=>{
        const drift=(elapsed*speed)+phase;
        const driftX=reduced?0:Math.sin(drift)*(0.14+(index*0.025));
        const driftY=reduced?0:Math.cos(drift*0.83)*(0.11+(index*0.018));
        const driftZ=reduced?0:Math.sin(drift*0.57)*(0.12+(index*0.02));
        group.position.set(basePosition.x+driftX,basePosition.y+driftY,basePosition.z+driftZ);
        group.rotation.set(
          baseRotation.x+(reduced?0:elapsed*speed*0.32),
          baseRotation.y+(reduced?0:Math.sin(drift*0.71)*0.4),
          baseRotation.z+(reduced?0:Math.cos(drift*0.92)*0.18),
        );
      });
      handles.forcePulses.forEach(({mesh,curve,offset,speed},index)=>{
        const position=curve.getPointAt((elapsed*speed+offset)%1);
        mesh.position.copy(position);
        const pulseScale=0.7+(Math.pow(mechanicalPulse,2)*(1.2+(index*0.18)));
        mesh.scale.setScalar(pulseScale);
      });
      handles.loadPaths.forEach(({material,index})=>{
        material.opacity=0.32+(mechanicalPulse*(0.28+(index*0.05)));
      });
      handles.ghosts.forEach(({group,material,index})=>{
        group.position.x=Math.sin((elapsed*0.22)+(index*0.8))*0.12;
        group.position.y=((index-1)*0.12)+(Math.cos((elapsed*0.18)+(index*0.6))*0.045);
        group.rotation.y=-sculpture.rotation.y*(0.16+(index*0.04));
        material.opacity=0.055+(mechanicalPulse*(0.055+(index*0.012)));
      });
      handles.particles.forEach((cloud,index)=>{
        cloud.rotation.z=(reduced?0:elapsed*0.014)*(index%2===0?1:-1);
        cloud.rotation.y=reduced?0:elapsed*0.01;
      });
      handles.core.rotation.x=elapsed*0.22;
      handles.core.rotation.y=elapsed*0.31;
      const phase=updateTelemetry(elapsed);
      return phase;
    };

    const renderFrame=timestamp=>{
      frameId=0;
      if(disposed||!renderer||!scene||!camera||!composer||!sculpture) return;
      const minimumFrameTime=budget.targetFps>0?1000/budget.targetFps:Infinity;
      if(!reduced&&timestamp-lastFrame<minimumFrameTime){
        frameId=requestAnimationFrame(renderFrame);
        return;
      }
      const elapsed=reduced?2.4:timestamp*0.001;
      lastFrame=timestamp;
      const phase=animateSculpture(elapsed);
      composer.render(scene,camera,elapsed,phase);
      if(timestamp-lastAsciiFrame>96||reduced){
        writeAsciiFrame();
        lastAsciiFrame=timestamp;
      }
      if(canAnimate()) frameId=requestAnimationFrame(renderFrame);
    };

    const requestRender=()=>{
      if(frameId||disposed||!renderer) return;
      frameId=requestAnimationFrame(renderFrame);
    };
    const handlePointer=event=>{
      if(!pointerQuery.matches||reduced) return;
      targetPointerX=((event.clientX/window.innerWidth)-0.5)*2;
      targetPointerY=((event.clientY/window.innerHeight)-0.5)*2;
    };
    const handleScroll=()=>{
      if(reduced) return;
      scrollProgress=clamp(window.scrollY/Math.max(1,window.innerHeight),0,1);
    };
    const handleVisibility=()=>{
      documentVisible=!document.hidden;
      if(documentVisible) requestRender();
      else if(frameId){cancelAnimationFrame(frameId);frameId=0;}
    };
    const handleMotionChange=event=>{
      reduced=event.matches;
      targetPointerX=0;
      targetPointerY=0;
      scrollProgress=reduced?0:scrollProgress;
      if(frameId){cancelAnimationFrame(frameId);frameId=0;}
      resize();
      requestRender();
    };
    const handleCompactChange=()=>{resize();requestRender();};
    const handleContextLost=event=>{
      event.preventDefault();
      if(frameId){cancelAnimationFrame(frameId);frameId=0;}
      if(!disposed){setRenderTier("static");setRenderState("static");}
      if(asciiRef.current) asciiRef.current.textContent=STATIC_SIGNAL;
    };

    const setup=async()=>{
      try{
        const THREE=await import("three");
        if(disposed) return;
        renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!compact,powerPreference:"high-performance"});
        renderer.setClearColor(0x050505,0);
        renderer.autoClear=false;
        if(THREE.SRGBColorSpace) renderer.outputColorSpace=THREE.SRGBColorSpace;
        scene=new THREE.Scene();
        camera=new THREE.PerspectiveCamera(38,1,0.1,100);
        camera.position.set(0,0,10.5);
        sculptureBundle=createStrengthSculpture(THREE,budget);
        sculpture=sculptureBundle.root;
        handles=sculptureBundle.handles;
        setFloatingDumbbellCount(handles.floatingDumbbells.length);
        placeSculpture();
        scene.add(sculpture);
        composer=createGlyphComposer(THREE,renderer,budget);

        resize();
        handleScroll();
        resizeObserver=new ResizeObserver(()=>{resize();requestRender();});
        resizeObserver.observe(host);
        viewportObserver=new IntersectionObserver(entries=>{
          visible=entries.some(entry=>entry.isIntersecting);
          if(visible) requestRender();
          else if(frameId){cancelAnimationFrame(frameId);frameId=0;}
        },{rootMargin:"160px 0px",threshold:0.01});
        viewportObserver.observe(host);

        window.addEventListener("pointermove",handlePointer,{passive:true});
        window.addEventListener("scroll",handleScroll,{passive:true});
        document.addEventListener("visibilitychange",handleVisibility);
        canvas.addEventListener("webglcontextlost",handleContextLost);
        reducedQuery.addEventListener?.("change",handleMotionChange);
        compactQuery.addEventListener?.("change",handleCompactChange);

        const initialTime=reduced?2400:performance.now();
        renderFrame(initialTime);
        setRenderTier(budget.tier);
        setRenderState("live");
        requestRender();
      }catch{
        if(!disposed){
          setRenderTier("static");
          setRenderState("static");
          if(asciiRef.current) asciiRef.current.textContent=STATIC_SIGNAL;
        }
      }
    };

    setup();
    return()=>{
      disposed=true;
      if(frameId) cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      window.removeEventListener("pointermove",handlePointer);
      window.removeEventListener("scroll",handleScroll);
      document.removeEventListener("visibilitychange",handleVisibility);
      canvas.removeEventListener("webglcontextlost",handleContextLost);
      reducedQuery.removeEventListener?.("change",handleMotionChange);
      compactQuery.removeEventListener?.("change",handleCompactChange);
      if(composer){
        composer.dispose();
        composer=null;
      }
      sculptureBundle?.geometries.forEach(geometry=>geometry.dispose());
      sculptureBundle?.materials.forEach(material=>material.dispose());
      if(renderer){
        renderer.dispose();
        renderer.forceContextLoss?.();
      }
      handles=null;
      sculpture=null;
    };
  },[]);

  return(
    <div ref={hostRef} className={`earned-ascii-scene earned-ascii-scene--${renderState}`}
      data-scene-state={renderState} data-render-tier={renderTier}
      data-floating-dumbbells={floatingDumbbellCount} aria-hidden="true">
      <canvas ref={canvasRef} className="earned-ascii-scene__canvas"/>
      <pre ref={asciiRef} className="earned-ascii-scene__output">{STATIC_SIGNAL}</pre>
      <div className="earned-ascii-scene__legend">
        <span>GLYPH FORGE / 02</span>
        <strong>{renderState==="live"?"REALTIME COMPOSITE":"STATIC SIGNAL"}</strong>
      </div>
      <div className="earned-ascii-scene__telemetry earned-ascii-scene__telemetry--vector">
        <span>FORCE VECTOR</span><strong>+X / LOCKED</strong><i/><i/><i/>
      </div>
      <div className="earned-ascii-scene__telemetry earned-ascii-scene__telemetry--phase">
        <span>REP PHASE</span><strong ref={phaseRef}>LOAD</strong>
        <i><b ref={phaseTrackRef}/></i>
      </div>
      <div className="earned-ascii-scene__axis">
        <span>Y +1.35</span><span>LOAD PATH / 03</span><span>X +3.85</span>
      </div>
      <div className="earned-ascii-scene__stages">
        <span>LOAD</span><span>DRIVE</span><span>LOCKOUT</span><strong>EARN</strong>
      </div>
    </div>
  );
}
