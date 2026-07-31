import { flushSync } from "react-dom";

export default function transitionView(update){
  const reduced=typeof window!=="undefined"
    &&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(typeof document==="undefined"||typeof document.startViewTransition!=="function"||reduced){
    update();
    return null;
  }
  try{
    return document.startViewTransition(()=>flushSync(update));
  }catch{
    update();
    return null;
  }
}
