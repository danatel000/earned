import {buildAnatomyFrame} from "./forgeAscii.js";
import useAsciiViewport from "./useAsciiViewport.js";

export default function AsciiAnatomyMap({group="",label="Target muscles",accent="#9dff00"}){
  const {tier}=useAsciiViewport();
  return(
    <figure className="forge-anatomy" data-forge-muscle={group} style={{"--forge-accent":accent}}
      aria-label={`${label}: ${group||"general"}`}>
      <figcaption><span>TARGET MAP</span><strong>{label}</strong></figcaption>
      <pre aria-hidden="true">{buildAnatomyFrame(group,tier)}</pre>
      <p><b>{String(group||"general").toUpperCase()}</b> signal highlighted</p>
    </figure>
  );
}
