export const ASCII_RAMP="@%#*+=-:. ";

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function luminanceToGlyph(red,green,blue,alpha=255,ramp=ASCII_RAMP){
  const glyphs=typeof ramp==="string"&&ramp.length>1?ramp:ASCII_RAMP;
  if(clamp(Number(alpha)||0,0,255)<8) return " ";
  const r=clamp(Number(red)||0,0,255);
  const g=clamp(Number(green)||0,0,255);
  const b=clamp(Number(blue)||0,0,255);
  const luminance=(r*0.2126)+(g*0.7152)+(b*0.0722);
  const index=Math.round((luminance/255)*(glyphs.length-1));
  return glyphs[index];
}

export function imageDataToAscii(imageData,width,height,options={}){
  const sourceWidth=Math.max(1,Math.floor(Number(width)||1));
  const sourceHeight=Math.max(1,Math.floor(Number(height)||1));
  const columns=Math.max(1,Math.min(sourceWidth,Math.floor(Number(options.columns)||sourceWidth)));
  const rows=Math.max(1,Math.min(sourceHeight,Math.floor(Number(options.rows)||sourceHeight)));
  const ramp=options.ramp||ASCII_RAMP;
  const aspectCorrection=options.aspectCorrection!==false;
  const horizontalScale=aspectCorrection?2:1;
  const lines=[];

  for(let row=0;row<rows;row+=1){
    const sourceY=Math.min(sourceHeight-1,Math.floor(((row+0.5)/rows)*sourceHeight));
    let line="";
    for(let column=0;column<columns;column+=1){
      const sourceX=Math.min(sourceWidth-1,Math.floor(((column+0.5)/columns)*sourceWidth));
      const index=((sourceY*sourceWidth)+sourceX)*4;
      const glyph=luminanceToGlyph(
        imageData[index],imageData[index+1],imageData[index+2],imageData[index+3],ramp,
      );
      line+=glyph.repeat(horizontalScale);
    }
    lines.push(line);
  }
  return lines.join("\n");
}

export function buildTrainingSignal({goalProgress=0,latestVolume=0,streak=0,rows=6,columns=22}={}){
  const rowCount=clamp(Math.floor(Number(rows)||6),2,12);
  const columnCount=clamp(Math.floor(Number(columns)||22),8,48);
  const progress=clamp(Number(goalProgress)||0,0,100);
  const volume=Math.max(0,Math.floor(Number(latestVolume)||0));
  const streakValue=Math.max(0,Math.floor(Number(streak)||0));
  const activityStrength=volume>0||streakValue>0
    ?clamp(Math.round((Math.log10(volume+1)*7)+(streakValue*1.5)),8,78)
    :0;
  const signalStrength=progress>0?progress:activityStrength;
  const loadColumns=Math.round((signalStrength/100)*columnCount);
  const seed=(volume+(streakValue*97)+(Math.round(progress)*31))||17;
  const glyphs=".:+=#";
  const output=[];

  for(let row=0;row<rowCount;row+=1){
    let line="";
    for(let column=0;column<columnCount;column+=1){
      if(column>=loadColumns){
        line+=" ";
        continue;
      }
      const value=(seed+(row*17)+(column*13)+((row+1)*(column+3)))%glyphs.length;
      line+=glyphs[value];
    }
    output.push(line);
  }
  return output.join("\n");
}
