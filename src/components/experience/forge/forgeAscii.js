const SCRAMBLE_GLYPHS="<>[]{}=/\\|01#$%+*:.";

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const asNumber=value=>Number.isFinite(Number(value))?Number(value):0;

function centerLine(line,width){
  const clean=String(line??"").slice(0,width);
  const left=Math.max(0,Math.floor((width-clean.length)/2));
  return `${" ".repeat(left)}${clean}`.padEnd(width).slice(0,width);
}

function seededIndex(seed,index,length){
  let value=(Math.imul((seed||1)+(index*97),2654435761)>>>0);
  value=(value^(value>>>16))>>>0;
  return value%length;
}

export function resolveAsciiViewport(width,reducedMotion=false){
  if(reducedMotion) return {tier:"still",columns:72,fps:0};
  const safe=Math.max(0,asNumber(width));
  if(safe<=520) return {tier:"compact",columns:44,fps:8};
  if(safe<=1100) return {tier:"standard",columns:72,fps:10};
  return {tier:"wide",columns:104,fps:12};
}

export function normalizeFrame(rows,width){
  const safeWidth=Math.max(1,Math.floor(asNumber(width)||1));
  const source=Array.isArray(rows)?rows:String(rows??"").split("\n");
  return source.map(row=>String(row??"").slice(0,safeWidth).padEnd(safeWidth)).join("\n");
}

export function resolveScrambleFrame(target,progress,seed=17){
  const value=String(target??"");
  const ratio=clamp(asNumber(progress),0,1);
  if(ratio>=1) return value;
  const resolved=Math.floor(value.length*ratio);
  return Array.from(value,(character,index)=>{
    if(character==="\n"||character===" "||index<resolved) return character;
    return SCRAMBLE_GLYPHS[seededIndex(seed,index,SCRAMBLE_GLYPHS.length)];
  }).join("");
}

export function buildTerminalProgress(current,total,width=20){
  const cells=Math.max(1,Math.floor(asNumber(width)||1));
  const maximum=Math.max(0,asNumber(total));
  const ratio=maximum>0?clamp(asNumber(current)/maximum,0,1):0;
  const exact=ratio*cells;
  const full=Math.floor(exact);
  const fractions=["","▏","▎","▍","▌","▋","▊","▉"];
  const fractional=full<cells?fractions[Math.floor((exact-full)*8)]:"";
  const remainder=Math.max(0,cells-full-(fractional?1:0));
  return `${"█".repeat(full)}${fractional}${"░".repeat(remainder)}`.slice(0,cells).padEnd(cells,"░");
}

export function resolvePlateTier(weight){
  const load=Math.max(0,asNumber(weight));
  if(load<=45) return 0;
  if(load<=135) return 1;
  if(load<=225) return 2;
  if(load<=315) return 3;
  return 4;
}

export function buildAsciiBarbell(weight,columns=44){
  const width=Math.max(28,Math.floor(asNumber(columns)||44));
  const tier=resolvePlateTier(weight);
  const rows=9;
  const center=Math.floor(rows/2);
  const plateWidth=tier+1;
  const shaftWidth=Math.max(10,Math.min(28,width-(plateWidth*2)-8));
  const output=[];
  for(let row=0;row<rows;row+=1){
    const distance=Math.abs(row-center);
    if(row===center){
      const plates=tier?"█".repeat(plateWidth):"";
      output.push(centerLine(`${plates}╫${"═".repeat(shaftWidth)}╪${"═".repeat(shaftWidth)}╫${plates}`,width));
    }else if(tier>0&&distance<=Math.min(4,tier+1)){
      const cap=distance===Math.min(4,tier+1)?"▓":"█";
      const plate=cap.repeat(plateWidth);
      const gap=(shaftWidth*2)+3;
      output.push(centerLine(`${plate}${" ".repeat(gap)}${plate}`,width));
    }else{
      output.push(" ".repeat(width));
    }
  }
  return normalizeFrame(output,width);
}

export function resolveExerciseFamily(name,profile={}){
  const value=String(name||"").toLowerCase();
  const group=String(profile?.group||"").toLowerCase();
  if(/squat|leg press|hack squat|lunge/.test(value)) return "squat";
  if(/deadlift|romanian|rdl|good morning/.test(value)) return "deadlift";
  if(/bench|chest press|push[- ]?up/.test(value)) return "bench";
  if(/curl|chin[- ]?up/.test(value)||group==="biceps") return "curl";
  if(/raise|shoulder press|overhead press|rear delt/.test(value)||group==="shoulders") return "raise";
  if(/row|pull[- ]?up|pulldown/.test(value)||group==="back") return "pull";
  if(/extension|jm press|tricep|dip/.test(value)||group==="arms") return "press";
  return "lift";
}

const anatomyWidth=tier=>tier==="compact"?24:tier==="wide"?36:32;

export function buildAnatomyFrame(group,tier="standard"){
  const width=anatomyWidth(tier);
  const target=String(group||"").toLowerCase();
  const mark=(id,text)=>target===id?text:text.replace(/[A-Z]/g,"·");
  const lines=[
    "       .----.       ",
    "      /      \\      ",
    "      |  ()  |      ",
    "       \\____/       ",
    `     ${mark("shoulders","SS")} /||\\ ${mark("shoulders","SS")}     `,
    `    ${mark("biceps","AA")} |${mark("chest","CC CC")}| ${mark("biceps","AA")}    `,
    `    ${mark("arms","TT")} |${mark("back","BB BB")}| ${mark("arms","TT")}    `,
    "       | || |       ",
    "       |/  \\|       ",
    `      /${mark("legs","LL")}  ${mark("legs","LL")}\\      `,
    `     / ${mark("legs","LL")}  ${mark("legs","LL")} \\     `,
    `     | ${mark("legs","LL")}  ${mark("legs","LL")} |     `,
    `     | ${mark("legs","LL")}  ${mark("legs","LL")} |     `,
    "     /__\\  /__\\     ",
  ];
  return normalizeFrame(lines.map(line=>centerLine(line.trimEnd(),width)),width);
}

const HELMETS={
  spartan:[
    "        /\\        ",
    "     __/##\\__     ",
    "   _/########\\_   ",
    "  /####/  \\####\\  ",
    " |####| /\\ |####| ",
    " |####|/  \\|####| ",
    "  \\###  ||  ###/  ",
    "   \\##  ||  ##/   ",
    "    \\___||___/    ",
  ],
  power:[
    "      .======.      ",
    "   .==| POWER|==.   ",
    "  /###|------|###\\  ",
    " |####| [][ ]|####| ",
    " |####|  /\\  |####| ",
    "  \\###\\ || /###/  ",
    "   '##\\||/##'   ",
    "      \\||/      ",
    "       \\//       ",
  ],
  iron:[
    "      __________      ",
    "    /|########|\\    ",
    "   /_|########|_\\   ",
    "  |##|  ____  |##|  ",
    "  |##| / __ \\ |##|  ",
    "  |##| |/  \\| |##|  ",
    "   \\#|  ||  |#/   ",
    "    \\|__||__|/    ",
    "       /__\\       ",
  ],
};

export function buildHelmetFrame(style="spartan",tier="standard"){
  const width=tier==="compact"?24:tier==="wide"?36:32;
  const key=Object.hasOwn(HELMETS,style)?style:"spartan";
  return normalizeFrame(HELMETS[key].map(line=>centerLine(line.trimEnd(),width)),width);
}

export function buildPowerGrid(stats={},tier="standard"){
  const width=tier==="compact"?28:tier==="wide"?40:34;
  const sessions=Math.max(0,asNumber(stats.sessions));
  const streak=Math.max(0,asNumber(stats.streak));
  const volume=Math.max(0,asNumber(stats.volume));
  const goal=Math.max(0,asNumber(stats.goalProgress));
  const charge=clamp((sessions/20)*0.25+(streak/10)*0.25+(volume/60000)*0.25+(goal/100)*0.25,0,1);
  const gridColumns=tier==="compact"?10:tier==="wide"?16:13;
  const gridRows=6;
  const active=Math.round(gridColumns*gridRows*charge);
  const output=[centerLine(`POWER GRID ${Math.round(charge*100).toString().padStart(3,"0")}%`,width)];
  for(let row=0;row<gridRows;row+=1){
    let cells="";
    for(let column=0;column<gridColumns;column+=1){
      const index=(row*gridColumns)+column;
      cells+=index<active?(index%4===0?"█":"▓"):"·";
    }
    output.push(centerLine(`[${cells}]`,width));
  }
  return normalizeFrame(output,width);
}

const DIGITS={
  "0":["███","█ █","█ █","█ █","███"],
  "1":[" ██","  █","  █","  █","███"],
  "2":["███","  █","███","█  ","███"],
  "3":["███","  █"," ██","  █","███"],
  "4":["█ █","█ █","███","  █","  █"],
  "5":["███","█  ","███","  █","███"],
  "6":["███","█  ","███","█ █","███"],
  "7":["███","  █","  █","  █","  █"],
  "8":["███","█ █","███","█ █","███"],
  "9":["███","█ █","███","  █","███"],
  ":":[" ","█"," ","█"," "],
};

export function buildCountdownFrame(seconds,tier="standard"){
  const width=tier==="compact"?24:tier==="wide"?40:32;
  const safe=Math.max(0,Math.floor(asNumber(seconds)));
  const time=`${String(Math.floor(safe/60)).padStart(2,"0")}:${String(safe%60).padStart(2,"0")}`;
  const glyphRows=Array.from({length:5},(_,row)=>Array.from(time,char=>DIGITS[char][row]).join(" "));
  return normalizeFrame([
    ...glyphRows.map(line=>centerLine(line,width)),
    centerLine("[ REST CYCLE ]",width),
    centerLine(time,width),
  ],width);
}

export function buildOneRmMeter(current,previous,height=10){
  const rows=Math.max(3,Math.floor(asNumber(height)||10));
  const baseline=Math.max(1,asNumber(previous));
  const ratio=clamp(asNumber(current)/baseline,0,1);
  const filled=Math.round(ratio*rows);
  return Array.from({length:rows},(_,index)=>{
    const lit=index>=rows-filled;
    const marker=index===0?`${Math.round((asNumber(current)/baseline)*100)}%`:"";
    return `│${lit?"█":"░"}│ ${marker}`.trimEnd();
  }).join("\n");
}
