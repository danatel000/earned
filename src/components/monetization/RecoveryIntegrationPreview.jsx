const signals=[
  {label:"Sleep",detail:"Duration and consistency"},
  {label:"HRV",detail:"Recovery trend"},
  {label:"Readiness",detail:"Training-day context"},
];

export default function RecoveryIntegrationPreview({onUpgrade}) {
  return(
    <section style={{background:"#0a0a1e",border:"1px solid #24304f",borderRadius:8,
      padding:"13px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10,
        marginBottom:10}}>
        <div>
          <div style={{fontSize:8,color:"#38BFFF",fontWeight:950,textTransform:"uppercase",
            letterSpacing:"0.1em",marginBottom:4}}>Recovery signals</div>
          <div style={{fontSize:13,color:"#fff",fontWeight:950}}>Health data, when you choose</div>
          <div style={{fontSize:9,color:"#566",lineHeight:1.45,marginTop:4}}>
            Future recommendations can consider recovery data only after you connect a supported provider.
          </div>
        </div>
        <span style={{border:"1px solid #30304d",borderRadius:999,padding:"4px 7px",
          color:"#777",fontSize:8,fontWeight:950,whiteSpace:"nowrap"}}>Not connected</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:6}}>
        {signals.map(signal=>(
          <div key={signal.label} style={{minWidth:0,borderTop:"1px solid #20203d",paddingTop:8}}>
            <div style={{fontSize:9,color:"#ddd",fontWeight:950}}>{signal.label}</div>
            <div style={{fontSize:8,color:"#555",lineHeight:1.35,marginTop:3}}>{signal.detail}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,
        borderTop:"1px solid #171733",marginTop:11,paddingTop:10}}>
        <div style={{fontSize:8,color:"#555",lineHeight:1.35}}>
          No health data is collected by this preview.
        </div>
        <button type="button" onClick={onUpgrade} style={{border:"1px solid #7C6FFF55",
          borderRadius:7,padding:"7px 8px",background:"#0d0c2b",color:"#8f84ff",
          fontSize:8,fontWeight:950,cursor:"pointer",whiteSpace:"nowrap"}}>
          View Premium roadmap
        </button>
      </div>
    </section>
  );
}
