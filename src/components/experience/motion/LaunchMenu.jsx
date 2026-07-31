import { useEffect, useRef } from "react";

const menuLinks=[
  {index:"01",label:"Home",href:"#top"},
  {index:"02",label:"System",href:"#system"},
  {index:"03",label:"Premium",href:"#premium"},
  {index:"04",label:"Account",href:"#account"},
];

export default function LaunchMenu({open,onClose,triggerRef}){
  const panelRef=useRef(null);
  const closeRef=useRef(null);

  useEffect(()=>{
    if(!open) return undefined;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    closeRef.current?.focus();

    const handleKeyDown=event=>{
      if(event.key==="Escape"){
        event.preventDefault();
        onClose?.();
        return;
      }
      if(event.key!=="Tab") return;
      const focusable=Array.from(panelRef.current?.querySelectorAll(
        'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )||[]);
      if(!focusable.length) return;
      const first=focusable[0];
      const last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();
        last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown",handleKeyDown);
    return()=>{
      window.removeEventListener("keydown",handleKeyDown);
      document.body.style.overflow=previousOverflow;
      triggerRef?.current?.focus();
    };
  },[open,onClose,triggerRef]);

  if(!open) return null;
  const navigate=()=>onClose?.();
  return(
    <div className="earned-launch-menu" id="earned-launch-menu" role="dialog" aria-modal="true" aria-labelledby="earned-menu-title"
      onMouseDown={event=>{ if(event.target===event.currentTarget) onClose?.(); }}>
      <div className="earned-launch-menu__panel" ref={panelRef}>
        <div className="earned-launch-menu__topline">
          <div className="earned-brand">
            <img src="/lift-icon-192.png" alt="" className="earned-brand__mark"/>
            <span>EARNED</span>
          </div>
          <span id="earned-menu-title">NAVIGATION / 04</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close menu">X</button>
        </div>
        <nav className="earned-launch-menu__nav" aria-label="Launch menu">
          {menuLinks.map((link,index)=>(
            <a key={link.href} href={link.href} onClick={navigate}
              aria-current={link.href==="#top"?"page":undefined}
              style={{"--menu-index":index}}>
              <span>{link.index}</span><strong>{link.label}</strong><i aria-hidden="true">+</i>
            </a>
          ))}
        </nav>
        <div className="earned-launch-menu__footer">
          <div><span>MODE</span><strong>DAILY / WEEKLY</strong></div>
          <div><span>DATA</span><strong>PRIVATE + SYNCED</strong></div>
          <a href="#account" onClick={navigate}>START TRAINING <span aria-hidden="true">+</span></a>
        </div>
      </div>
    </div>
  );
}
