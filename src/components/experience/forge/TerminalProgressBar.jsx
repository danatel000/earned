import {buildTerminalProgress} from "./forgeAscii.js";

export default function TerminalProgressBar({current=0,total=0,width=20,label="Progress",accent="lime"}){
  const maximum=Math.max(0,Number(total)||0);
  const value=Math.max(0,Number(current)||0);
  const percent=maximum>0?Math.min(100,Math.round((value/maximum)*100)):0;
  return(
    <div className={`forge-progress forge-progress--${accent}`} role="progressbar"
      aria-label={label} aria-valuemin="0" aria-valuemax={maximum} aria-valuenow={Math.min(value,maximum)}>
      <code aria-hidden="true">[{buildTerminalProgress(value,maximum,width)}]</code>
      <span>{percent}%</span>
    </div>
  );
}
