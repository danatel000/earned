import { useState } from "react";
import { buildReferralShare } from "../../monetization/referrals.js";

export default function InviteTrainingPartner({username}) {
  const [status,setStatus]=useState("");

  const copyInvite=async payload=>{
    if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(payload.url);
      setStatus("Invite link copied");
      return;
    }
    window.prompt("Copy this invite link",payload.url);
    setStatus("Invite link ready");
  };

  const handleInvite=async()=>{
    const payload=buildReferralShare({origin:window.location.origin,username});
    if(navigator.share){
      try{
        await navigator.share(payload);
        setStatus("Invite shared");
        return;
      }catch(error){
        if(error?.name==="AbortError") return;
      }
    }
    try{ await copyInvite(payload); }
    catch{ window.prompt("Copy this invite link",payload.url); }
  };

  return(
    <section style={{display:"grid",gridTemplateColumns:"1fr auto",gap:10,alignItems:"center",
      background:"#0a0a1e",border:"1px solid #24304f",borderRadius:8,
      padding:"12px 13px",marginBottom:14}}>
      <div style={{minWidth:0}}>
        <div style={{fontSize:8,color:"#2DD4A0",fontWeight:950,textTransform:"uppercase",
          letterSpacing:"0.1em",marginBottom:3}}>Train together</div>
        <div style={{fontSize:12,color:"#fff",fontWeight:950}}>Invite a training partner</div>
        <div style={{fontSize:9,color:"#5c6868",lineHeight:1.4,marginTop:3}}>
          Share your profile link and build a more useful accountability feed.
        </div>
        {status&&<div role="status" style={{fontSize:8,color:"#2DD4A0",fontWeight:900,marginTop:5}}>{status}</div>}
      </div>
      <button type="button" onClick={handleInvite} style={{border:"1px solid #2DD4A055",
        borderRadius:7,padding:"9px 10px",background:"#061811",color:"#2DD4A0",
        fontSize:9,fontWeight:950,cursor:"pointer",whiteSpace:"nowrap"}}>
        Invite
      </button>
    </section>
  );
}
