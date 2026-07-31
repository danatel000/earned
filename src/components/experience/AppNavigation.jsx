import {useEffect,useRef} from "react";

export default function AppNavigation({items,activeView,unreadCount=0,onNavigate}){
  const navRef=useRef(null);
  const tabRefs=useRef([]);
  const activeIndex=Math.max(0,items.findIndex(item=>item.id===activeView));

  useEffect(()=>{
    const frame=window.requestAnimationFrame(()=>{
      const nav=navRef.current;
      const activeTab=tabRefs.current[activeIndex];
      if(!nav||!activeTab||nav.scrollWidth<=nav.clientWidth||typeof nav.scrollTo!=="function") return;
      const navBox=nav.getBoundingClientRect();
      const tabBox=activeTab.getBoundingClientRect();
      const left=Math.max(
        0,
        nav.scrollLeft+tabBox.left-navBox.left-(nav.clientWidth-activeTab.offsetWidth)/2,
      );
      nav.scrollTo({left,behavior:"auto"});
    });
    return()=>window.cancelAnimationFrame(frame);
  },[activeIndex]);

  const handleKeyDown=(event,index)=>{
    let nextIndex=null;
    if(event.key==="ArrowRight") nextIndex=(index+1)%items.length;
    if(event.key==="ArrowLeft") nextIndex=(index-1+items.length)%items.length;
    if(event.key==="Home") nextIndex=0;
    if(event.key==="End") nextIndex=items.length-1;
    if(nextIndex==null) return;
    event.preventDefault();
    tabRefs.current[nextIndex]?.focus();
    onNavigate?.(items[nextIndex].id);
  };

  return(
    <nav ref={navRef} className="earned-app-nav" aria-label="Earned workout sections"
      style={{"--earned-active-tab":activeIndex}}>
      <div className="earned-app-nav__track" role="tablist" aria-label="Workout views">
        {items.map((item,index)=>{
          const active=activeView===item.id;
          const primary=item.id==="log";
          return(
            <button key={item.id} type="button" role="tab"
              ref={node=>{tabRefs.current[index]=node;}}
              id={`earned-tab-${item.id}`}
              aria-controls="earned-workout-view"
              aria-label={item.label}
              aria-current={active?"page":undefined}
              aria-selected={active}
              tabIndex={active?0:-1}
              data-tab-index={String(index+1).padStart(2,"0")}
              data-view-transition={active?"active":item.id}
              className={`earned-app-nav__item${primary?" earned-app-nav__item--train":""}`}
              onKeyDown={event=>handleKeyDown(event,index)}
              onClick={()=>onNavigate?.(item.id)}>
              {primary&&<span className="earned-app-nav__plus" aria-hidden="true">+</span>}
              <span className="earned-app-nav__index" aria-hidden="true">{String(index+1).padStart(2,"0")}</span>
              <span className="earned-app-nav__label">{item.label}</span>
              {item.id==="community"&&unreadCount>0&&(
                <span className="earned-app-nav__badge" aria-label={`${unreadCount} unread notifications`}>
                  {Math.min(unreadCount,9)}
                </span>
              )}
            </button>
          );
        })}
        <span className="earned-app-nav__indicator" aria-hidden="true"/>
      </div>
    </nav>
  );
}
