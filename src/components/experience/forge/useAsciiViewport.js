import {useEffect,useState} from "react";
import {resolveAsciiViewport} from "./forgeAscii.js";

const readViewport=()=>{
  if(typeof window==="undefined") return resolveAsciiViewport(1024,false);
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return resolveAsciiViewport(window.innerWidth,reduced);
};

export default function useAsciiViewport(){
  const [viewport,setViewport]=useState(readViewport);

  useEffect(()=>{
    const motionQuery=window.matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>setViewport(resolveAsciiViewport(window.innerWidth,motionQuery.matches));
    window.addEventListener("resize",update,{passive:true});
    motionQuery.addEventListener?.("change",update);
    update();
    return()=>{
      window.removeEventListener("resize",update);
      motionQuery.removeEventListener?.("change",update);
    };
  },[]);

  return viewport;
}
