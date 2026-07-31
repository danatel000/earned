import {useCallback,useRef} from "react";

function joinClasses(...classes){
  return classes.filter(Boolean).join(" ");
}

export function EarnedSignalCard({
  as:Tag="article",
  className="",
  tone="lime",
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}){
  const ref=useRef(null);

  const handlePointerMove=useCallback(event=>{
    const element=ref.current;
    if(element&&window.matchMedia("(pointer: fine)").matches&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      const rect=element.getBoundingClientRect();
      element.style.setProperty("--earned-pointer-x",`${event.clientX-rect.left}px`);
      element.style.setProperty("--earned-pointer-y",`${event.clientY-rect.top}px`);
    }
    onPointerMove?.(event);
  },[onPointerMove]);

  const handlePointerLeave=useCallback(event=>{
    const element=ref.current;
    element?.style.setProperty("--earned-pointer-x","50%");
    element?.style.setProperty("--earned-pointer-y","50%");
    onPointerLeave?.(event);
  },[onPointerLeave]);

  return(
    <Tag
      ref={ref}
      className={joinClasses("earned-signal-card",className)}
      data-tone={tone}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      <span className="earned-signal-card__beam" aria-hidden="true"/>
      <div className="earned-signal-card__content">{children}</div>
    </Tag>
  );
}

export function EarnedKineticButton({
  as:Tag="button",
  className="",
  variant="primary",
  arrow="\u2192",
  children,
  ...props
}){
  const tagProps=Tag==="button"&&props.type===undefined?{type:"button"}:{};

  return(
    <Tag
      className={joinClasses("earned-kinetic-button",`earned-kinetic-button--${variant}`,className)}
      {...tagProps}
      {...props}
    >
      <span className="earned-kinetic-button__label">{children}</span>
      {arrow!==null&&<span className="earned-kinetic-button__arrow" aria-hidden="true">{arrow}</span>}
    </Tag>
  );
}

export function EarnedMetricBars({
  values=[26,42,38,58,52,74,67,88],
  label="Training volume trend",
  accent="lime",
  className="",
}){
  const max=Math.max(...values,1);

  return(
    <div
      className={joinClasses("earned-metric-bars",className)}
      data-accent={accent}
      role="img"
      aria-label={`${label}: ${values.join(", ")}`}
    >
      {values.map((value,index)=>(
        <i key={`${value}-${index}`} style={{"--earned-bar":`${Math.max(8,(value/max)*100)}%`}}/>
      ))}
    </div>
  );
}

export function EarnedSignalText({as:Tag="span",className="",children,...props}){
  return(
    <Tag className={joinClasses("earned-signal-text",className)} {...props}>
      <span>{children}</span>
    </Tag>
  );
}

