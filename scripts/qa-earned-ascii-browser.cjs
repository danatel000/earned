const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
const {PNG}=require("pngjs");

const url=process.argv[2]||"http://127.0.0.1:4204/";
const root=path.resolve(__dirname,"..");
const chromePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function inspectPixels(buffer){
  const {data,width,height}=PNG.sync.read(buffer);
  let lit=0;
  let opaque=0;
  let min=255;
  let max=0;
  const colorBands=new Set();
  for(let index=0;index<data.length;index+=4){
    const alpha=data[index+3];
    const luminance=Math.round((data[index]*0.2126)+(data[index+1]*0.7152)+(data[index+2]*0.0722));
    if(alpha>8) opaque+=1;
    if(alpha>8&&luminance>18) lit+=1;
    if(alpha>8&&luminance>18){
      colorBands.add(`${data[index]>>5}-${data[index+1]>>5}-${data[index+2]>>5}`);
    }
    min=Math.min(min,luminance);
    max=Math.max(max,luminance);
  }
  let edgeTransitions=0;
  for(let y=1;y<height;y+=1){
    for(let x=1;x<width;x+=1){
      const index=((y*width)+x)*4;
      const left=index-4;
      const above=index-(width*4);
      const value=(data[index]*0.2126)+(data[index+1]*0.7152)+(data[index+2]*0.0722);
      const leftValue=(data[left]*0.2126)+(data[left+1]*0.7152)+(data[left+2]*0.0722);
      const aboveValue=(data[above]*0.2126)+(data[above+1]*0.7152)+(data[above+2]*0.0722);
      if(Math.abs(value-leftValue)>24) edgeTransitions+=1;
      if(Math.abs(value-aboveValue)>24) edgeTransitions+=1;
    }
  }
  return {width,height,opaque,lit,range:max-min,colorBands:colorBands.size,edgeTransitions};
}

function differentBytes(first,second){
  const length=Math.min(first.length,second.length);
  let changed=Math.abs(first.length-second.length);
  for(let index=0;index<length;index+=1){
    if(first[index]!==second[index]) changed+=1;
  }
  return changed;
}

async function preparePage(context){
  const page=await context.newPage();
  const errors=[];
  page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem("earned:intro-seen-v1","1"));
  return {page,errors};
}

async function waitForLiveScene(page,errors){
  await page.waitForSelector("[data-scene-state]",{state:"attached",timeout:10000});
  await page.waitForFunction(()=>document.querySelector("[data-scene-state]")?.dataset.sceneState!=="booting",null,{timeout:15000});
  const state=await page.locator("[data-scene-state]").getAttribute("data-scene-state");
  assert.equal(state,"live",`Scene entered ${state}; browser errors: ${errors.join(" | ")||"none"}`);
  const dumbbellCount=Number(await page.locator("[data-scene-state]").getAttribute("data-floating-dumbbells"));
  assert.equal(dumbbellCount,3,"Launch scene must render three floating ASCII dumbbells");
}

async function revealPageByScrolling(page){
  await page.evaluate(()=>{document.documentElement.style.scrollBehavior="auto";});
  const height=await page.evaluate(()=>document.documentElement.scrollHeight);
  for(let top=0;top<=height;top+=Math.max(420,Math.floor((await page.viewportSize()).height*0.72))){
    await page.evaluate(value=>window.scrollTo(0,value),top);
    await page.waitForTimeout(110);
  }
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForTimeout(160);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(180);
  const hiddenDetails=await page.locator('[data-reveal]:not(.is-visible)').evaluateAll(nodes=>nodes
    .filter(node=>{
      const style=getComputedStyle(node);
      return style.display!=="none"&&style.visibility!=="hidden";
    })
    .map(node=>({
      tag:node.tagName,
      className:node.className,
      reveal:node.dataset.reveal,
      text:(node.textContent||"").trim().slice(0,80),
    })));
  assert.equal(hiddenDetails.length,0,`Every reveal must become visible during a normal page scroll: ${JSON.stringify(hiddenDetails)}`);
}

async function verifyDesktop(browser){
  const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,serviceWorkers:"block"});
  const {page,errors}=await preparePage(context);
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await waitForLiveScene(page,errors);
  const canvas=page.locator(".earned-ascii-scene__canvas");
  const box=await canvas.boundingBox();
  assert.ok(box&&box.width>900&&box.height>500,"Desktop scene must be full-bleed within the hero");
  const first=await canvas.screenshot({path:path.join(root,"earned-ascii-canvas-desktop.png")});
  const firstStats=await inspectPixels(first);
  console.log(`Glyph Forge desktop stats: ${JSON.stringify(firstStats)}`);
  assert.ok(firstStats.lit>500,"Desktop WebGL canvas must contain visible rendered pixels");
  assert.ok(firstStats.range>24,"Desktop WebGL canvas must not be a flat frame");
  assert.ok(firstStats.colorBands>=18,`Glyph Forge must preserve rich color separation; found ${firstStats.colorBands} bands`);
  assert.ok(firstStats.edgeTransitions>=60000,
    `Glyph Forge must create high-detail ASCII edge structure; found ${firstStats.edgeTransitions} transitions. Browser errors: ${errors.join(" | ")||"none"}`);
  await page.mouse.move(1280,120);
  await page.evaluate(()=>window.scrollTo(0,Math.round(window.innerHeight*0.42)));
  await page.waitForTimeout(420);
  const second=await canvas.screenshot();
  assert.ok(differentBytes(first,second)>1000,"Desktop scene must respond to motion or scroll");
  const ascii=await page.locator(".earned-ascii-scene__output").textContent();
  assert.ok(ascii.includes("@")||ascii.includes("#"),"ASCII readback must contain rendered glyph detail");
  assert.equal(await page.locator('[data-render-tier="cinematic"]').count(),1,"Desktop must use the cinematic tier");
  await revealPageByScrolling(page);
  await page.screenshot({path:path.join(root,"earned-ascii-launch-desktop.png")});
  const menuButton=page.getByRole("button",{name:/menu/i});
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await page.waitForSelector('#earned-launch-menu[role="dialog"]');
  await page.keyboard.press("Escape");
  assert.equal(await menuButton.evaluate(node=>node===document.activeElement),true,
    "Closing the launch menu must restore trigger focus");
  assert.equal(errors.length,0,`Desktop browser errors: ${errors.join(" | ")}`);
  await context.close();
  return firstStats;
}

async function verifyMobile(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:"block"});
  const {page,errors}=await preparePage(context);
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await waitForLiveScene(page,errors);
  const layout=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    canvasWidth:document.querySelector(".earned-ascii-scene__canvas")?.width||0,
    canvasCssWidth:document.querySelector(".earned-ascii-scene__canvas")?.getBoundingClientRect().width||0,
    ctaVisible:Boolean(document.querySelector(".earned-launch__actions")?.getBoundingClientRect().height),
  }));
  assert.equal(layout.scrollWidth,layout.clientWidth,"Mobile launch must not overflow horizontally");
  assert.ok(layout.canvasWidth<=Math.ceil(layout.canvasCssWidth)+2,"Mobile scene must cap device pixel ratio at 1");
  assert.equal(layout.ctaVisible,true,"Mobile primary actions must remain visible");
  assert.equal(await page.locator('[data-render-tier="compact"]').count(),1,"Mobile must use the compact tier");
  const canvasBuffer=await page.locator(".earned-ascii-scene__canvas").screenshot();
  const stats=await inspectPixels(canvasBuffer);
  assert.ok(stats.lit>100,"Mobile WebGL canvas must contain visible rendered pixels");
  await revealPageByScrolling(page);
  await page.screenshot({path:path.join(root,"earned-ascii-launch-mobile.png")});
  assert.equal(errors.length,0,`Mobile browser errors: ${errors.join(" | ")}`);
  await context.close();
  return stats;
}

async function verifyReducedMotion(browser){
  const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:1,reducedMotion:"reduce",serviceWorkers:"block"});
  const {page,errors}=await preparePage(context);
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await waitForLiveScene(page,errors);
  const canvas=page.locator(".earned-ascii-scene__canvas");
  const first=await canvas.screenshot();
  await page.waitForTimeout(500);
  const second=await canvas.screenshot();
  assert.equal(differentBytes(first,second),0,"Reduced-motion scene must remain on one stable frame");
  const hiddenContent=await page.locator('[data-reveal]:not(.is-visible)').count();
  assert.equal(hiddenContent,0,"Reduced motion must leave all reveal content visible");
  assert.equal(errors.length,0,`Reduced-motion browser errors: ${errors.join(" | ")}`);
  await context.close();
}

async function verifyAuthenticated(browser){
  const username=process.env.EARNED_QA_USERNAME;
  const password=process.env.EARNED_QA_PASSWORD;
  if(!username||!password) return "skipped";
  const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,serviceWorkers:"block"});
  const {page,errors}=await preparePage(context);
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button",{name:"Enter Earned"}).click();
  await page.waitForSelector(".earned-app-shell",{timeout:30000});
  await page.waitForSelector(".earned-training-signal",{state:"visible",timeout:10000});
  const signal=await page.locator(".earned-training-signal pre").textContent();
  const rows=signal.split("\n");
  assert.equal(rows.length,6,"Authenticated training signal must keep six stable rows");
  assert.equal(rows.every(row=>row.length===24),true,"Authenticated training signal must keep stable row width");
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  assert.ok(overflow<=1,"Authenticated Today view must not overflow horizontally");
  await page.screenshot({path:path.join(root,"earned-ascii-app-today.png")});
  assert.equal(errors.length,0,`Authenticated browser errors: ${errors.join(" | ")}`);
  await context.close();
  return "passed";
}

(async()=>{
  const browser=await chromium.launch({
    headless:true,
    executablePath:chromePath,
    args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"],
  });
  try{
    const desktop=await verifyDesktop(browser);
    const mobile=await verifyMobile(browser);
    await verifyReducedMotion(browser);
    const authenticated=await verifyAuthenticated(browser);
    console.log(`Earned ASCII browser QA passed (desktop ${desktop.width}x${desktop.height}, mobile ${mobile.width}x${mobile.height}, authenticated ${authenticated}).`);
  }finally{
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
