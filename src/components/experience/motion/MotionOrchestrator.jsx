import { useEffect, useRef } from "react";

export default function MotionOrchestrator({scopeRef,showProgress=true}){
  const progressRef=useRef(null);

  useEffect(()=>{
    const scope=scopeRef?.current||document.body;
    if(!scope) return undefined;

    const reducedQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointerQuery=window.matchMedia("(hover: hover) and (pointer: fine)");
    const revealNodes=Array.from(scope.querySelectorAll("[data-reveal]"));
    const pendingReveals=new Set(revealNodes);
    scope.classList.add("earned-motion-ready");

    let observer={disconnect(){},unobserve(){}};
    const revealNode=node=>{
      node.classList.add("is-visible");
      pendingReveals.delete(node);
      observer.unobserve?.(node);
    };
    const revealEverything=()=>Array.from(pendingReveals).forEach(revealNode);
    const revealInViewport=()=>{
      pendingReveals.forEach(node=>{
        const rect=node.getBoundingClientRect();
        if(rect.top<=window.innerHeight*0.94&&rect.bottom>=0) revealNode(node);
      });
    };
    if(reducedQuery.matches||!("IntersectionObserver" in window)){
      revealEverything();
    }else{
      observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;
          revealNode(entry.target);
        });
      },{threshold:0.16,rootMargin:"0px 0px -8%"});
      revealNodes.forEach(node=>observer.observe(node));
    }
    const safetyTimer=window.setTimeout(revealEverything,8000);

    let scrollFrame=0;
    const updateScroll=()=>{
      revealInViewport();
      if(scrollFrame) return;
      scrollFrame=requestAnimationFrame(()=>{
        const page=document.documentElement;
        const available=Math.max(1,page.scrollHeight-window.innerHeight);
        const progress=Math.min(1,Math.max(0,window.scrollY/available));
        scope.style.setProperty("--earned-scroll-progress",String(progress));
        if(progressRef.current){
          progressRef.current.style.transform=`scaleX(${progress})`;
        }
        scrollFrame=0;
      });
    };

    let pointerFrame=0;
    let pointerX=0;
    let pointerY=0;
    const updatePointer=event=>{
      if(!pointerQuery.matches||reducedQuery.matches) return;
      pointerX=(event.clientX/window.innerWidth)-0.5;
      pointerY=(event.clientY/window.innerHeight)-0.5;
      if(pointerFrame) return;
      pointerFrame=requestAnimationFrame(()=>{
        scope.style.setProperty("--earned-pointer-x",pointerX.toFixed(3));
        scope.style.setProperty("--earned-pointer-y",pointerY.toFixed(3));
        scope.style.setProperty("--earned-pointer-shift-x",`${(pointerX*-18).toFixed(1)}px`);
        scope.style.setProperty("--earned-pointer-shift-y",`${(pointerY*-12).toFixed(1)}px`);
        pointerFrame=0;
      });
    };

    const handleMotionPreference=()=>{
      scope.classList.toggle("earned-reduced-motion",reducedQuery.matches);
      if(reducedQuery.matches) revealEverything();
    };

    updateScroll();
    handleMotionPreference();
    window.addEventListener("scroll",updateScroll,{passive:true});
    window.addEventListener("resize",updateScroll,{passive:true});
    window.addEventListener("pointermove",updatePointer,{passive:true});
    reducedQuery.addEventListener?.("change",handleMotionPreference);

    return()=>{
      observer.disconnect();
      window.removeEventListener("scroll",updateScroll);
      window.removeEventListener("resize",updateScroll);
      window.removeEventListener("pointermove",updatePointer);
      reducedQuery.removeEventListener?.("change",handleMotionPreference);
      if(scrollFrame) cancelAnimationFrame(scrollFrame);
      if(pointerFrame) cancelAnimationFrame(pointerFrame);
      window.clearTimeout(safetyTimer);
      scope.classList.remove("earned-motion-ready","earned-reduced-motion");
      scope.style.removeProperty("--earned-scroll-progress");
      scope.style.removeProperty("--earned-pointer-x");
      scope.style.removeProperty("--earned-pointer-y");
      scope.style.removeProperty("--earned-pointer-shift-x");
      scope.style.removeProperty("--earned-pointer-shift-y");
    };
  },[scopeRef]);

  if(!showProgress) return null;
  return(
    <div className="earned-scroll-progress" aria-hidden="true">
      <span ref={progressRef}/>
    </div>
  );
}
