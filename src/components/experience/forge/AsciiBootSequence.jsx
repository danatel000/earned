import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {buildAsciiBarbell} from "./forgeAscii.js";
import TerminalProgressBar from "./TerminalProgressBar.jsx";
import useAsciiViewport from "./useAsciiViewport.js";

const MAX_BOOT_MS=1450;

function inspectClient(){
  let storage=false;
  let glyphCore=false;
  try{
    const probe="earned:forge-boot-probe";
    sessionStorage.setItem(probe,"1");
    sessionStorage.removeItem(probe);
    storage=true;
  }catch{storage=false;}
  try{
    glyphCore=Boolean(document.createElement("canvas").getContext("2d"));
  }catch{glyphCore=false;}
  return {storage,glyphCore,online:navigator.onLine!==false};
}

export default function AsciiBootSequence({onDone,duration=1250,skipLabel="Skip boot"}){
  const {tier}=useAsciiViewport();
  const checks=useMemo(inspectClient,[]);
  const lines=useMemo(()=>[
    `[OK] AUTH CLIENT  / BUNDLE LINKED`,
    `[${checks.storage?"OK":"--"}] LOCAL CACHE / ${checks.storage?"AVAILABLE":"UNAVAILABLE"}`,
    `[${checks.glyphCore?"OK":"--"}] GLYPH CORE  / ${checks.glyphCore?"CANVAS READY":"TEXT FALLBACK"}`,
    `[${checks.online?"OK":"--"}] NETWORK LINK / ${checks.online?"ONLINE":"OFFLINE MODE"}`,
    `STATUS: READY [OK]`,
  ],[checks]);
  const fullText=lines.join("\n");
  const [characters,setCharacters]=useState(0);
  const frameRef=useRef(0);
  const finishedRef=useRef(false);
  const onDoneRef=useRef(onDone);
  onDoneRef.current=onDone;
  const progress=Math.min(1,characters/Math.max(1,fullText.length));

  const finish=useCallback(()=>{
    if(finishedRef.current) return;
    finishedRef.current=true;
    onDoneRef.current?.();
  },[]);

  useEffect(()=>{
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const safeDuration=Math.min(MAX_BOOT_MS,Math.max(320,Number(duration)||1250));
    if(reduced){
      setCharacters(fullText.length);
      const reducedTimer=window.setTimeout(finish,320);
      return()=>window.clearTimeout(reducedTimer);
    }
    const start=performance.now();
    const draw=timestamp=>{
      const ratio=Math.min(1,(timestamp-start)/(safeDuration-120));
      setCharacters(Math.ceil(fullText.length*ratio));
      if(ratio<1) frameRef.current=requestAnimationFrame(draw);
    };
    frameRef.current=requestAnimationFrame(draw);
    const completionTimer=window.setTimeout(finish,safeDuration);
    return()=>{
      if(frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current=0;
      window.clearTimeout(completionTimer);
    };
  },[duration,finish,fullText]);

  const display=fullText.slice(0,characters);
  const columns=tier==="compact"?44:tier==="wide"?72:58;
  const load=45+(progress*360);
  return(
    <section className="forge-boot" data-forge-boot={progress>=1?"ready":"loading"}
      role="status" aria-live="polite" aria-label="Earned system startup">
      <header><span>FORGE_ASCII / BOOT</span><strong>{Math.round(progress*100).toString().padStart(3,"0")}%</strong></header>
      <pre className="forge-boot__readout" aria-hidden="true">{display}<i>_</i></pre>
      <pre className="forge-boot__barbell" aria-hidden="true">{buildAsciiBarbell(load,columns)}</pre>
      <TerminalProgressBar current={progress*100} total={100} width={tier==="compact"?20:32} label="Earned startup progress"/>
      <button type="button" onClick={finish}>{skipLabel}</button>
    </section>
  );
}
