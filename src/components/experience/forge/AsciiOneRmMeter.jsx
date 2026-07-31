import {buildOneRmMeter} from "./forgeAscii.js";

export default function AsciiOneRmMeter({current=0,previous=0,candidate=false}){
  const safeCurrent=Math.max(0,Number(current)||0);
  const safePrevious=Math.max(0,Number(previous)||0);
  return(
    <div className="forge-one-rm" data-forge-overload={candidate?"candidate":"building"}
      aria-label={`Estimated one rep max ${safeCurrent} pounds, previous best ${safePrevious} pounds`}>
      <div><span>1RM SIGNAL</span><strong>{candidate?"VITALS: OVERLOAD CANDIDATE":"VITALS: BUILDING"}</strong></div>
      <pre aria-hidden="true">{buildOneRmMeter(safeCurrent,safePrevious||safeCurrent||1,9)}</pre>
      <p><b>{safeCurrent}</b> current / {safePrevious||"--"} previous</p>
    </div>
  );
}
