export const GLYPH_FORGE_RAMP=" .,:;i1tfLCG08@#$%&";

export function resolveGlyphForgeBudget({compact=false,reducedMotion=false}={}){
  if(reducedMotion){
    return {
      tier:"still",
      dpr:1,
      cellSize:6,
      particles:320,
      spokeCount:24,
      ghostCount:4,
      targetFps:0,
    };
  }
  if(compact){
    return {
      tier:"compact",
      dpr:1,
      cellSize:6,
      particles:180,
      spokeCount:12,
      ghostCount:1,
      targetFps:30,
    };
  }
  return {
    tier:"cinematic",
    dpr:1.5,
    cellSize:5,
    particles:520,
    spokeCount:24,
    ghostCount:4,
    targetFps:60,
  };
}

export const GLYPH_VERTEX_SHADER=`
  varying vec2 vUv;

  void main(){
    vUv=uv;
    gl_Position=vec4(position,1.0);
  }
`;

export const GLYPH_FRAGMENT_SHADER=`
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uSceneTexture;
  uniform sampler2D uGlyphAtlas;
  uniform vec2 uResolution;
  uniform float uCellSize;
  uniform float uGlyphCount;
  uniform float uTime;
  uniform float uPulse;
  uniform float uSourceMix;

  float glyphLuma(vec3 color){
    return dot(color,vec3(0.2126,0.7152,0.0722));
  }

  float hash21(vec2 point){
    point=fract(point*vec2(123.34,456.21));
    point+=dot(point,point+45.32);
    return fract(point.x*point.y);
  }

  float glyphSample(vec2 cellUv,float glyphIndex){
    vec2 glyphUv=vec2((cellUv.x+glyphIndex)/uGlyphCount,1.0-cellUv.y);
    vec4 atlasSample=texture2D(uGlyphAtlas,glyphUv);
    return max(atlasSample.r,atlasSample.a-0.999);
  }

  void main(){
    vec2 safeResolution=max(uResolution,vec2(1.0));
    vec2 grid=max(vec2(1.0),floor(safeResolution/max(4.0,uCellSize)));
    vec2 gridPosition=vUv*grid;
    vec2 cell=floor(gridPosition);
    vec2 cellUv=fract(gridPosition);
    vec2 sampleUv=(cell+0.5)/grid;
    vec2 texel=1.0/safeResolution;
    vec2 sampleStep=texel*uCellSize*0.62;

    vec4 source=texture2D(uSceneTexture,sampleUv);
    float center=glyphLuma(source.rgb);
    vec4 leftSource=texture2D(uSceneTexture,sampleUv-vec2(sampleStep.x,0.0));
    vec4 rightSource=texture2D(uSceneTexture,sampleUv+vec2(sampleStep.x,0.0));
    vec4 aboveSource=texture2D(uSceneTexture,sampleUv+vec2(0.0,sampleStep.y));
    vec4 belowSource=texture2D(uSceneTexture,sampleUv-vec2(0.0,sampleStep.y));
    float left=glyphLuma(leftSource.rgb);
    float right=glyphLuma(rightSource.rgb);
    float above=glyphLuma(aboveSource.rgb);
    float below=glyphLuma(belowSource.rgb);
    vec2 gradient=vec2(right-left,above-below);
    float edge=clamp(length(gradient)*2.2,0.0,1.0);
    float presence=max(source.a,max(max(leftSource.a,rightSource.a),max(aboveSource.a,belowSource.a)));

    float dither=(hash21(cell)-0.5)*0.13;
    float orientation=abs(gradient.x)>abs(gradient.y)?0.06:0.12;
    float density=clamp((center*0.74)+(edge*1.7)+(source.a*0.12)+orientation+dither,0.0,1.0);
    float glyphIndex=floor(density*(uGlyphCount-1.0)+0.5);
    float glyph=glyphSample(cellUv,glyphIndex);
    float glyphMask=smoothstep(0.055,0.62,glyph);

    vec2 macroGrid=max(vec2(1.0),floor(safeResolution/(uCellSize*2.8)));
    vec2 macroPosition=vUv*macroGrid;
    vec2 macroCell=floor(macroPosition);
    vec2 macroUv=fract(macroPosition);
    float macroWave=0.5+(0.5*sin((macroCell.x*0.31)+(macroCell.y*0.17)-(uTime*1.35)));
    float macroIndex=floor(clamp((density*0.7)+(macroWave*0.3),0.0,1.0)*(uGlyphCount-1.0));
    float macroGlyph=smoothstep(0.16,0.76,glyphSample(macroUv,macroIndex));

    vec2 cellDistance=abs(cellUv-0.5)*2.0;
    float cellContour=smoothstep(0.82,0.97,max(cellDistance.x,cellDistance.y));
    float contourTrace=cellContour*edge*presence*0.24;

    float scan=0.88+(0.12*sin((gl_FragCoord.y*1.5707963)+(uTime*1.7)));
    float pulseBand=0.82+(0.18*sin((cell.x*0.19)-(uTime*2.4)+(uPulse*6.2831853)));
    vec3 cyan=vec3(0.329,0.847,1.0);
    vec3 lime=vec3(0.616,1.0,0.0);
    vec3 coral=vec3(1.0,0.353,0.373);
    float direction=0.5+(0.5*dot(normalize(gradient+vec2(0.0001)),normalize(vec2(0.78,0.62))));
    vec3 edgeTint=mix(cyan,lime,clamp((center*1.18)+(direction*0.18),0.0,1.0));
    edgeTint=mix(edgeTint,coral,smoothstep(0.62,1.0,edge)*(0.34+(uPulse*0.28)));
    vec3 glyphColor=mix(max(source.rgb,edgeTint*0.42),edgeTint,clamp(edge*0.94,0.0,1.0));
    float microGrid=step(0.72,fract((cell.x+cell.y)*0.25))*0.13;
    float composedMask=clamp(glyphMask+(macroGlyph*0.28)+(edge*microGrid)+contourTrace,0.0,1.0);
    vec3 finalColor=(glyphColor*composedMask*(1.38+(edge*1.32))*scan*pulseBand)
      +(edgeTint*contourTrace*0.72)+(source.rgb*uSourceMix*glyphMask);
    float alpha=presence*clamp((glyphMask*1.08)+(macroGlyph*0.21)+(edge*0.27)+(contourTrace*0.34),0.0,1.0);

    if(alpha<0.012) discard;
    gl_FragColor=vec4(finalColor,clamp(alpha,0.0,1.0));
  }
`;

export function createGlyphAtlas(THREE,documentRef=globalThis.document){
  if(!documentRef?.createElement) throw new Error("Glyph atlas requires a document canvas.");
  const cellSize=48;
  const canvas=documentRef.createElement("canvas");
  canvas.width=cellSize*GLYPH_FORGE_RAMP.length;
  canvas.height=cellSize;
  const context=canvas.getContext("2d");
  if(!context) throw new Error("Glyph atlas canvas is unavailable.");
  context.fillStyle="#000000";
  context.fillRect(0,0,canvas.width,canvas.height);
  context.fillStyle="#ffffff";
  context.textAlign="center";
  context.textBaseline="middle";
  context.font=`700 ${Math.round(cellSize*0.8)}px "Cascadia Mono","Courier New",monospace`;
  for(let index=0;index<GLYPH_FORGE_RAMP.length;index+=1){
    context.fillText(GLYPH_FORGE_RAMP[index],(index*cellSize)+(cellSize/2),(cellSize/2)+1);
  }
  const glyphTexture=new THREE.CanvasTexture(canvas);
  glyphTexture.minFilter=THREE.NearestFilter;
  glyphTexture.magFilter=THREE.NearestFilter;
  glyphTexture.generateMipmaps=false;
  if(THREE.SRGBColorSpace) glyphTexture.colorSpace=THREE.SRGBColorSpace;
  glyphTexture.needsUpdate=true;
  return {glyphTexture,glyphCount:GLYPH_FORGE_RAMP.length};
}

export function createGlyphComposer(THREE,renderer,initialBudget){
  let budget=initialBudget;
  const {glyphTexture,glyphCount}=createGlyphAtlas(THREE);
  const renderTarget=new THREE.WebGLRenderTarget(1,1,{
    minFilter:THREE.LinearFilter,
    magFilter:THREE.LinearFilter,
    format:THREE.RGBAFormat,
    type:THREE.UnsignedByteType,
    depthBuffer:true,
    stencilBuffer:false,
  });
  renderTarget.texture.generateMipmaps=false;

  const quadGeometry=new THREE.PlaneGeometry(2,2);
  const quadMaterial=new THREE.ShaderMaterial({
    vertexShader:GLYPH_VERTEX_SHADER,
    fragmentShader:GLYPH_FRAGMENT_SHADER,
    transparent:true,
    depthTest:false,
    depthWrite:false,
    uniforms:{
      uSceneTexture:{value:renderTarget.texture},
      uGlyphAtlas:{value:glyphTexture},
      uResolution:{value:new THREE.Vector2(1,1)},
      uCellSize:{value:budget.cellSize},
      uGlyphCount:{value:glyphCount},
      uTime:{value:0},
      uPulse:{value:0},
      uSourceMix:{value:0.025},
    },
  });
  const compositeScene=new THREE.Scene();
  const compositeCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  compositeScene.add(new THREE.Mesh(quadGeometry,quadMaterial));

  const setBudget=nextBudget=>{
    budget=nextBudget;
    quadMaterial.uniforms.uCellSize.value=budget.cellSize*budget.dpr;
    quadMaterial.uniforms.uSourceMix.value=budget.tier==="compact"?0.045:budget.tier==="still"?0.035:0.02;
  };
  const resize=(width,height)=>{
    const pixelWidth=Math.max(1,Math.round(width*budget.dpr));
    const pixelHeight=Math.max(1,Math.round(height*budget.dpr));
    renderTarget.setSize(pixelWidth,pixelHeight);
    quadMaterial.uniforms.uResolution.value.set(pixelWidth,pixelHeight);
    quadMaterial.uniforms.uCellSize.value=budget.cellSize*budget.dpr;
  };
  const render=(sourceScene,sourceCamera,time,pulse=0)=>{
    quadMaterial.uniforms.uTime.value=time;
    quadMaterial.uniforms.uPulse.value=pulse;
    renderer.setRenderTarget(renderTarget);
    renderer.setClearColor(0x050505,0);
    renderer.clear(true,true,true);
    renderer.render(sourceScene,sourceCamera);
    renderer.setRenderTarget(null);
    renderer.setClearColor(0x050505,0);
    renderer.clear(true,true,true);
    renderer.render(compositeScene,compositeCamera);
  };
  const dispose=()=>{
    renderTarget.dispose();
    glyphTexture.dispose();
    quadGeometry.dispose();
    quadMaterial.dispose();
  };

  setBudget(budget);
  return {render,resize,setBudget,dispose,renderTarget,glyphTexture};
}
