const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");
const {PNG}=require("pngjs");

const url=process.argv[2]||"http://127.0.0.1:4204/";
const root=path.resolve(__dirname,"..");
const chromePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const username=process.env.EARNED_QA_USERNAME;
const password=process.env.EARNED_QA_PASSWORD;
const targetUrl=new URL(url);
const useLocalVisualQa=!username&&!password&&["127.0.0.1","localhost"].includes(targetUrl.hostname);
if(useLocalVisualQa) targetUrl.searchParams.set("visualQA","1");

function decodeCanvas(dataUrl){
  return Buffer.from(String(dataUrl).split(",")[1]||"","base64");
}

function inspectTransparentPng(buffer){
  const {data,width,height}=PNG.sync.read(buffer);
  let visible=0;
  let bright=0;
  let maxAlpha=0;
  const bands=new Set();
  const tiles=Array(9).fill(0);
  for(let index=0;index<data.length;index+=4){
    const alpha=data[index+3];
    maxAlpha=Math.max(maxAlpha,alpha);
    if(alpha>3){
      visible+=1;
      const pixel=Math.floor(index/4);
      const x=pixel%width;
      const y=Math.floor(pixel/width);
      const column=Math.min(2,Math.floor(x/(width/3)));
      const row=Math.min(2,Math.floor(y/(height/3)));
      tiles[(row*3)+column]+=1;
      const luminance=(data[index]*0.2126)+(data[index+1]*0.7152)+(data[index+2]*0.0722);
      if(luminance>18) bright+=1;
      bands.add(`${data[index]>>5}-${data[index+1]>>5}-${data[index+2]>>5}`);
    }
  }
  return {width,height,visible,bright,maxAlpha,colorBands:bands.size,activeTiles:tiles.filter(count=>count>=24).length};
}

function changedBytes(first,second){
  const length=Math.min(first.length,second.length);
  let changed=Math.abs(first.length-second.length);
  for(let index=0;index<length;index+=1) if(first[index]!==second[index]) changed+=1;
  return changed;
}

async function createPage(context){
  const page=await context.newPage();
  const errors=[];
  page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem("earned:intro-seen-v1","1"));
  return {page,errors};
}

async function signIn(page){
  await page.goto(targetUrl.href,{waitUntil:"domcontentloaded",timeout:30000});
  if(!useLocalVisualQa){
    assert.ok(username&&password,"Remote authenticated QA requires EARNED_QA_USERNAME and EARNED_QA_PASSWORD");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button",{name:"Enter Earned"}).click();
  }
  await page.waitForSelector(".earned-app-shell",{timeout:30000});
  await page.waitForSelector('[data-ascii-state="live"]',{timeout:10000});
}

async function canvasBuffer(page){
  const dataUrl=await page.locator(".earned-app-ascii__canvas").evaluate(canvas=>canvas.toDataURL("image/png"));
  return decodeCanvas(dataUrl);
}

async function openView(page,label,id){
  const item=page.locator(".earned-app-nav__item").filter({hasText:label}).first();
  await item.click();
  await page.waitForSelector(`main[data-view="${id}"]`,{timeout:10000});
  await page.waitForFunction(expected=>document.querySelector(".earned-app-ascii")?.dataset.asciiView===expected,id);
  await page.waitForTimeout(220);
  assert.equal(await page.locator(`.earned-app-ascii[data-ascii-view="${id}"]`).count(),1,
    `${label} must own exactly one matching atmosphere`);
}

async function verifyDesktop(browser){
  const context=await browser.newContext({viewport:{width:1280,height:900},deviceScaleFactor:1,serviceWorkers:"block"});
  const {page,errors}=await createPage(context);
  await signIn(page);
  assert.equal(await page.locator('[data-ascii-tier="cinematic"]').count(),1,"Desktop must use the cinematic atmosphere tier");
  assert.equal(Number(await page.locator(".earned-app-ascii").getAttribute("data-ascii-rate")),1.18,
    "Desktop atmosphere must expose the faster motion rate");
  const first=await canvasBuffer(page);
  const stats=inspectTransparentPng(first);
  assert.ok(stats.visible>8000,`Desktop atmosphere must draw a larger detailed field; found ${stats.visible} pixels`);
  assert.ok(stats.bright>300,"Desktop atmosphere must contain visible colored glyphs");
  assert.ok(stats.colorBands>=3,"Desktop atmosphere must preserve the Earned signal palette");
  assert.ok(stats.activeTiles>=8,`Desktop atmosphere must fill the page; found ${stats.activeTiles} active regions`);
  await page.mouse.move(1160,160);
  await page.waitForTimeout(360);
  const second=await canvasBuffer(page);
  assert.ok(changedBytes(first,second)>500,"Desktop atmosphere must respond to time and pointer motion");

  const views=[
    ["Today","total"],["Train","log"],["Progress","lifts"],["Records","prs"],
    ["History","history"],["Goals","goals"],["Library","library"],["Feed","community"],
  ];
  for(const [label,id] of views) await openView(page,label,id);

  await openView(page,"Train","log");
  const reactor=page.locator(".earned-workout-reactor");
  await reactor.waitFor({state:"visible"});
  const reactorSignal=await reactor.locator("pre").textContent();
  const reactorRows=reactorSignal.split("\n");
  assert.equal(reactorRows.length,7,"Train reactor must retain seven stable rows");
  assert.equal(reactorRows.every(row=>row.length===54),true,"Train reactor must retain stable row width");
  assert.match(reactorSignal,/[=@#|\[\]]/,"Train reactor must render a recognizable strength signal");
  await page.screenshot({path:path.join(root,"earned-app-ascii-train-desktop.png"),fullPage:false});
  assert.equal(errors.length,0,`Desktop app ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
  return stats;
}

async function verifyMobile(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:"block"});
  const {page,errors}=await createPage(context);
  await signIn(page);
  assert.equal(await page.locator('[data-ascii-tier="compact"]').count(),1,"Mobile must use the compact atmosphere tier");
  const dimensions=await page.evaluate(()=>({
    scrollWidth:document.documentElement.scrollWidth,
    clientWidth:document.documentElement.clientWidth,
    canvasWidth:document.querySelector(".earned-app-ascii__canvas")?.width||0,
    canvasCssWidth:document.querySelector(".earned-app-ascii__canvas")?.getBoundingClientRect().width||0,
  }));
  assert.equal(dimensions.scrollWidth,dimensions.clientWidth,"App-wide ASCII must not introduce mobile overflow");
  assert.ok(dimensions.canvasWidth<=Math.ceil(dimensions.canvasCssWidth)+2,"Mobile atmosphere must cap device pixel ratio at one");
  const mobileStats=inspectTransparentPng(await canvasBuffer(page));
  assert.ok(mobileStats.activeTiles>=7,
    `Mobile atmosphere must retain broad page coverage; found ${mobileStats.activeTiles} active regions`);
  await openView(page,"Train","log");
  const reactorBox=await page.locator(".earned-workout-reactor").boundingBox();
  assert.ok(reactorBox&&reactorBox.width<=390,"Mobile workout reactor must remain within the viewport");
  await page.screenshot({path:path.join(root,"earned-app-ascii-train-mobile.png"),fullPage:false});
  assert.equal(errors.length,0,`Mobile app ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
}

async function verifyReducedMotion(browser){
  const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:1,reducedMotion:"reduce",serviceWorkers:"block"});
  const {page,errors}=await createPage(context);
  await signIn(page);
  assert.equal(await page.locator('[data-ascii-tier="still"]').count(),1,"Reduced motion must use the still atmosphere tier");
  const first=await canvasBuffer(page);
  await page.waitForTimeout(520);
  const second=await canvasBuffer(page);
  assert.equal(changedBytes(first,second),0,"Reduced-motion atmosphere must remain on one stable frame");
  assert.equal(errors.length,0,`Reduced-motion app ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
}

(async()=>{
  const browser=await chromium.launch({
    headless:true,
    executablePath:chromePath,
    args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"],
  });
  try{
    const stats=await verifyDesktop(browser);
    await verifyMobile(browser);
    await verifyReducedMotion(browser);
    console.log(`Earned app-wide ASCII browser QA passed (${stats.visible} visible glyph pixels, ${stats.colorBands} color bands).`);
  }finally{
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
