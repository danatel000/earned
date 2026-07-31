const exerciseVolume=lift=>{
  if(Number(lift?.volume)>0) return Number(lift.volume);
  return Math.max(0,Number(lift?.w)||0)*Math.max(0,Number(lift?.r)||0)*Math.max(0,Number(lift?.s)||0);
};

const entryVolume=entry=>{
  const exercises=entry&&entry.exercises?entry.exercises:{};
  return Object.values(exercises).reduce((sum,lift)=>sum+exerciseVolume(lift),0);
};

export default function AsciiSystemLog({history=[]}){
  const entries=Array.isArray(history)?history:[];
  const totals=entries.map(entryVolume);
  const rows=entries.map((entry,index)=>{
    const total=totals[index];
    const priorBest=index?Math.max(...totals.slice(0,index)):0;
    const status=index===0?"FIRST":total>priorBest?"PEAK":"STORED";
    const block=String(entry?.periodType==="day"?(entry?.dayKey||"day"):"week").toUpperCase();
    return {
      id:entry?.periodId||`${entry?.date||"entry"}-${index}`,
      date:entry?.date||"---- -- --",
      block,
      total,
      status,
    };
  }).slice(-6).reverse();

  return(
    <section className="forge-system-log" data-forge-log-count={rows.length} aria-labelledby="forge-log-title">
      <header><span>SYSTEM LOGS</span><strong id="forge-log-title">TRAINING LEDGER</strong></header>
      {rows.length?(
        <ol>
          {rows.map(row=>(
            <li key={row.id} data-status={row.status.toLowerCase()}>
              <time>[{row.date}]</time>
              <span>BLOCK: {row.block}</span>
              <b>VOLUME: {Math.round(row.total).toLocaleString()}</b>
              <em>STATUS: {row.status}</em>
            </li>
          ))}
        </ol>
      ):(
        <p>[NO TRAINING BLOCKS] Start your first workout to initialize the ledger.</p>
      )}
    </section>
  );
}
