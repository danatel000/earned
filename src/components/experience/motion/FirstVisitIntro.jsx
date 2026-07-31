import { useEffect, useState } from "react";
import AsciiBootSequence from "../forge/AsciiBootSequence.jsx";

const INTRO_SESSION_KEY="earned:intro-seen-v1";

function shouldShowIntro(){
  if(typeof window==="undefined") return false;
  try{
    return sessionStorage.getItem(INTRO_SESSION_KEY)!=="1";
  }catch{
    return false;
  }
}

export default function FirstVisitIntro(){
  const [visible,setVisible]=useState(shouldShowIntro);

  useEffect(()=>{
    if(!visible) return undefined;
    try{ sessionStorage.setItem(INTRO_SESSION_KEY,"1"); }catch{ /* Session storage is optional. */ }
    return undefined;
  },[visible]);

  if(!visible) return null;
  return(
    <div className="earned-intro" role="status" aria-live="polite" aria-label="Earned is ready">
      <AsciiBootSequence duration={1250} skipLabel="Skip intro" onDone={()=>setVisible(false)}/>
    </div>
  );
}
