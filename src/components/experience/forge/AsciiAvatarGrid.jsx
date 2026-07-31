import {buildHelmetFrame,buildPowerGrid} from "./forgeAscii.js";
import useAsciiViewport from "./useAsciiViewport.js";

const AVATAR_STYLES=[
  {id:"spartan",label:"Spartan"},
  {id:"power",label:"Power"},
  {id:"iron",label:"Iron"},
];

export default function AsciiAvatarGrid({username="lifter",style="spartan",stats={},onStyleChange}){
  const {tier}=useAsciiViewport();
  const safeStyle=AVATAR_STYLES.some(item=>item.id===style)?style:"spartan";
  return(
    <section className="forge-avatar" data-forge-avatar={safeStyle} aria-labelledby="forge-avatar-title">
      <header>
        <span>IDENTITY NODE</span>
        <strong id="forge-avatar-title">@{username}</strong>
      </header>
      <div className="forge-avatar__signal" aria-label={`${safeStyle} helmet and training power grid`}>
        <pre className="forge-avatar__helmet" aria-hidden="true">{buildHelmetFrame(safeStyle,tier)}</pre>
        <pre className="forge-avatar__grid" aria-hidden="true">{buildPowerGrid(stats,tier)}</pre>
      </div>
      <div className="forge-avatar__styles" aria-label="ASCII avatar style">
        {AVATAR_STYLES.map(item=>(
          <button key={item.id} type="button" aria-pressed={safeStyle===item.id}
            onClick={()=>onStyleChange?.(item.id)}>{item.label}</button>
        ))}
      </div>
    </section>
  );
}
