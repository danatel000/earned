import {useMemo} from "react";
import {buildCountdownFrame} from "./forgeAscii.js";
import useAsciiTextScramble from "./useAsciiTextScramble.js";
import useAsciiViewport from "./useAsciiViewport.js";

export default function AsciiRestCountdown({seconds=0,active=false}){
  const {tier}=useAsciiViewport();
  const safe=Math.max(0,Math.floor(Number(seconds)||0));
  const target=useMemo(()=>buildCountdownFrame(safe,tier),[safe,tier]);
  const frame=useAsciiTextScramble(target,{duration:active?150:0,seed:safe+31});
  const alert=active&&safe>0&&safe<=3;
  return(
    <div className="forge-countdown" data-forge-rest={active?"active":"idle"}
      data-forge-alert={alert?"final-three":"none"} aria-label={`Rest timer ${safe} seconds remaining`}>
      <pre aria-hidden="true">{frame}</pre>
      <span>{active?"REST CYCLE ACTIVE":"REST CYCLE READY"}</span>
    </div>
  );
}
