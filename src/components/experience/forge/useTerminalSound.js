import {useCallback,useEffect,useRef,useState} from "react";

const SOUND_KEY="earned:terminal-sound-v1";
const MAX_GAIN=0.035;

const readEnabled=()=>{
  if(typeof window==="undefined") return false;
  try{return localStorage.getItem(SOUND_KEY)==="1";}catch{return false;}
};

export default function useTerminalSound(){
  const [enabledState,setEnabledState]=useState(readEnabled);
  const enabledRef=useRef(enabledState);
  const contextRef=useRef(null);
  const activeRef=useRef(new Set());
  const timersRef=useRef(new Set());

  const ensureContext=useCallback(()=>{
    if(contextRef.current) return contextRef.current;
    const AudioContext=window.AudioContext||window.webkitAudioContext;
    if(!AudioContext) return null;
    contextRef.current=new AudioContext();
    return contextRef.current;
  },[]);

  const setEnabled=useCallback(value=>{
    const next=Boolean(value);
    enabledRef.current=next;
    setEnabledState(next);
    try{localStorage.setItem(SOUND_KEY,next?"1":"0");}catch{ /* Device preference is optional. */ }
    if(next){
      const context=ensureContext();
      context?.resume?.();
    }
  },[ensureContext]);

  const play=useCallback((frequency,duration=0.045,wave="square")=>{
    if(!enabledRef.current) return;
    const context=ensureContext();
    if(!context) return;
    const oscillator=context.createOscillator();
    const gain=context.createGain();
    const now=context.currentTime;
    oscillator.type=wave;
    oscillator.frequency.setValueAtTime(frequency,now);
    gain.gain.setValueAtTime(0.0001,now);
    gain.gain.exponentialRampToValueAtTime(MAX_GAIN,now+0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001,now+duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    const node={oscillator,gain};
    activeRef.current.add(node);
    oscillator.onended=()=>{
      oscillator.disconnect();
      gain.disconnect();
      activeRef.current.delete(node);
    };
    oscillator.start(now);
    oscillator.stop(now+duration+0.01);
  },[ensureContext]);

  const type=useCallback(()=>play(520,0.025,"square"),[play]);
  const tick=useCallback(()=>play(310,0.055,"sine"),[play]);
  const success=useCallback(()=>{
    play(620,0.07,"triangle");
    const timer=window.setTimeout(()=>{
      timersRef.current.delete(timer);
      play(880,0.09,"triangle");
    },75);
    timersRef.current.add(timer);
  },[play]);

  useEffect(()=>{
    enabledRef.current=enabledState;
  },[enabledState]);

  useEffect(()=>()=>{
    timersRef.current.forEach(timer=>window.clearTimeout(timer));
    timersRef.current.clear();
    activeRef.current.forEach(({oscillator,gain})=>{
      try{oscillator.stop();}catch{ /* Already stopped. */ }
      oscillator.disconnect();
      gain.disconnect();
    });
    activeRef.current.clear();
    const context=contextRef.current;
    if(context&&context.state!=="closed") context.close();
    contextRef.current=null;
  },[]);

  return {enabled:enabledState,setEnabled,type,tick,success};
}
