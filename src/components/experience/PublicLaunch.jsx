import { useCallback, useRef, useState } from "react";
import EarnedAsciiScene from "./ascii/EarnedAsciiScene.jsx";
import FirstVisitIntro from "./motion/FirstVisitIntro.jsx";
import LaunchMenu from "./motion/LaunchMenu.jsx";
import MotionOrchestrator from "./motion/MotionOrchestrator.jsx";
import LaunchFeatureMatrix from "./LaunchFeatureMatrix.jsx";
import LaunchProductGallery from "./LaunchProductGallery.jsx";
import LaunchProofCarousel from "./LaunchProofCarousel.jsx";

const proofItems=[
  ["01","Daily or weekly","Progress on your schedule"],
  ["02","Offline ready","Drafts survive weak gym Wi-Fi"],
  ["03","Private accounts","Your training stays yours"],
  ["04","Progress intelligence","See the work turn into proof"],
];

const systemSections=[
  {
    number:"01",
    eyebrow:"TRAIN WITHOUT FRICTION",
    title:"The set comes first.",
    body:"Previous lifts, fast adjustments, rest timing, deliberate skips, and one-tap workout starts keep the phone out of your way.",
    points:["Daily or weekly progression","Resume unfinished sessions","Skip without losing prior values"],
  },
  {
    number:"02",
    eyebrow:"PROOF OVER PROMISES",
    title:"Every session leaves a signal.",
    body:"Volume, PRs, goals, streaks, muscle balance, achievements, and history turn effort into evidence you can actually use.",
    points:["Clear progress trends","Goals tied to real exercises","Milestones worth returning for"],
  },
  {
    number:"03",
    eyebrow:"GO DEEPER WHEN READY",
    title:"Clarity has another level.",
    body:"Premium Preview organizes fatigue, recovery, training quality, and adaptive planning around the workouts you already log.",
    points:["No payment is live yet","Free logging stays useful","Premium value stays transparent"],
  },
];

function scrollToAccount(){
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById("account")?.scrollIntoView({behavior:reduced?"auto":"smooth",block:"start"});
}

export default function PublicLaunch({
  mode,
  username,
  password,
  error,
  busy,
  onModeChange,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}){
  const launchRef=useRef(null);
  const menuTriggerRef=useRef(null);
  const [menuOpen,setMenuOpen]=useState(false);
  const closeMenu=useCallback(()=>setMenuOpen(false),[]);

  return(
    <main className="earned-launch" ref={launchRef}>
      <FirstVisitIntro/>
      <MotionOrchestrator scopeRef={launchRef}/>
      <LaunchMenu open={menuOpen} onClose={closeMenu} triggerRef={menuTriggerRef}/>

      <header className="earned-launch__header" data-reveal="header">
        <a className="earned-brand" href="#top" aria-label="Earned home">
          <img src="/lift-icon-192.png" alt="" className="earned-brand__mark"/>
          <span>EARNED</span>
        </a>
        <nav className="earned-launch__links" aria-label="Launch navigation">
          <a href="#system">System</a>
          <a href="#premium">Premium</a>
          <button type="button" onClick={scrollToAccount}>Sign in</button>
          <button ref={menuTriggerRef} className="earned-launch__menu-trigger" type="button"
            aria-expanded={menuOpen} aria-controls="earned-launch-menu"
            onClick={()=>setMenuOpen(true)}>
            Menu <span aria-hidden="true">+</span>
          </button>
        </nav>
      </header>

      <section className="earned-launch__hero" id="top" aria-labelledby="launch-title" data-motion-section="hero">
        <EarnedAsciiScene/>
        <div className="earned-launch__hero-copy">
          <p className="earned-kicker" data-reveal="label" style={{"--reveal-delay":"120ms"}}>
            THE TRAINING RECORD YOU BUILD REP BY REP
          </p>
          <h1 id="launch-title" data-reveal="title" style={{"--reveal-delay":"170ms"}}><span>EARNED</span></h1>
          <p className="earned-launch__statement" data-reveal="copy" style={{"--reveal-delay":"240ms"}}>
            Progress is not promised. It is logged, measured, and earned.
          </p>
          <div className="earned-launch__actions" data-reveal="actions" style={{"--reveal-delay":"310ms"}}>
            <button className="earned-button earned-button--primary" data-magnetic type="button" onClick={scrollToAccount}>
              Start training <span aria-hidden="true">+</span>
            </button>
            <a className="earned-button earned-button--quiet" href="#system">
              Explore the system <span aria-hidden="true">{"\u2193"}</span>
            </a>
          </div>
        </div>
        <div className="earned-launch__hero-index" aria-hidden="true" data-reveal="label"
          style={{"--reveal-delay":"360ms"}}>
          <span>EST.</span><strong>2026</strong>
        </div>
        <a className="earned-launch__scroll-cue" href="#system" data-reveal="label"
          style={{"--reveal-delay":"420ms"}}>SCROLL TO READ <span aria-hidden="true">{"\u2193"}</span></a>
      </section>

      <section className="earned-proof" aria-label="Earned product strengths" data-motion-section="proof">
        {proofItems.map(([number,title,detail],index)=>(
          <div className="earned-proof__item" key={number} data-reveal="rise"
            style={{"--reveal-delay":`${index*55}ms`}}>
            <span>{number}</span>
            <strong>{title}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </section>

      <LaunchFeatureMatrix/>

      <section className="earned-launch__preview" aria-labelledby="preview-title" data-motion-section="preview">
        <div className="earned-launch__preview-grid" aria-hidden="true"/>
        <div className="earned-launch__preview-copy" data-reveal="from-left">
          <span>01 / TRAIN. 02 / PROGRESS. 03 / PROOF.</span>
          <h2 id="preview-title">A record that gets stronger with you.</h2>
          <p>Fast logging in the gym. Clear evidence after. Earned turns the lifts you complete into a training history worth keeping.</p>
          <a className="earned-button earned-button--quiet" href="#account">Build your record <span aria-hidden="true">{"\u2192"}</span></a>
        </div>
        <div className="earned-launch__preview-frame" data-reveal="from-right" aria-label="Earned workout record preview">
          <div className="earned-launch__preview-topline"><span>SESSION / 024</span><strong>COMPLETE</strong></div>
          <div className="earned-launch__preview-bars" aria-hidden="true">
            <i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/>
          </div>
          <div className="earned-launch__preview-readout">
            <span><small>TRAINING VOLUME</small><b>12,480 <em>LBS</em></b></span>
            <span><small>NEW PERSONAL RECORD</small><b>BENCH +5</b></span>
          </div>
          <pre aria-hidden="true">{`[  O  ]=====|===== [  O  ]
     \\  EARNED  /`}</pre>
        </div>
      </section>

      <LaunchProductGallery/>
      <LaunchProofCarousel/>

      <section className="earned-system" id="system" aria-labelledby="system-title" data-motion-section="system">
        <div className="earned-system__field" aria-hidden="true"/>
        <div className="earned-section-heading" data-reveal="title">
          <span>THE SYSTEM</span>
          <h2 id="system-title">Built for the work between intention and result.</h2>
        </div>
        <div className="earned-system__rows">
          {systemSections.map((section,index)=>(
            <article className="earned-system__row" id={section.number==="03"?"premium":undefined} key={section.number}
              data-reveal={index%2===0?"from-right":"from-left"}>
              <div className="earned-system__number">{section.number}</div>
              <div>
                <p>{section.eyebrow}</p>
                <h3>{section.title}</h3>
              </div>
              <div className="earned-system__detail">
                <p>{section.body}</p>
                <ul>
                  {section.points.map(point=><li key={point}>{point}</li>)}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="earned-account" id="account" aria-labelledby="account-title" data-motion-section="account">
        <div className="earned-account__field" aria-hidden="true"/>
        <div className="earned-account__intro" data-reveal="title">
          <span className="earned-account__index">04 / ACCOUNT</span>
          <h2 id="account-title">Your work deserves its own record.</h2>
          <p>Sign in to continue, or start fresh. Every account keeps its own history, goals, routines, and progression.</p>
          <div className="earned-account__trust">
            <span>PRIVATE BY DEFAULT</span>
            <span>CLOUD SYNC</span>
            <span>OFFLINE DRAFTS</span>
          </div>
        </div>

        <form className="earned-auth" data-reveal="from-right"
          onSubmit={event=>{event.preventDefault();onSubmit?.();}}>
          <div className="earned-auth__modes" aria-label="Account action">
            {[{id:"login",label:"Sign in"},{id:"signup",label:"Create account"}].map(option=>(
              <button key={option.id} type="button" aria-pressed={mode===option.id}
                onClick={()=>onModeChange?.(option.id)}>{option.label}</button>
            ))}
          </div>
          <label className="earned-auth__field">
            <span>Username</span>
            <input aria-label="Username" value={username} onChange={event=>onUsernameChange?.(event.target.value)}
              autoCapitalize="none" autoComplete="username" placeholder="your_username"/>
          </label>
          <label className="earned-auth__field">
            <span>Password</span>
            <input aria-label="Password" value={password} onChange={event=>onPasswordChange?.(event.target.value)}
              type="password" autoComplete={mode==="signup"?"new-password":"current-password"}
              placeholder="Enter your password"/>
          </label>
          {error&&<div className="earned-auth__error" role="alert">{error}</div>}
          {!error&&<p className="earned-auth__hint">Letters, numbers, underscores, and dashes are supported.</p>}
          <button className="earned-button earned-button--primary earned-auth__submit" type="submit" disabled={busy}>
            {busy?"Working...":mode==="signup"?"Create my account":"Enter Earned"}
            <span aria-hidden="true">{"\u2192"}</span>
          </button>
          <p className="earned-auth__fineprint">
            New accounts begin at zero. No payment is requested for Premium Preview.
          </p>
        </form>
      </section>

      <footer className="earned-launch__footer" data-reveal="rise">
        <div className="earned-brand">
          <img src="/lift-icon-192.png" alt="" className="earned-brand__mark"/>
          <span>EARNED</span>
        </div>
        <p>LOG THE WORK. KEEP THE PROOF.</p>
        <span>{"\u00A9"} 2026 EARNED</span>
      </footer>
    </main>
  );
}
