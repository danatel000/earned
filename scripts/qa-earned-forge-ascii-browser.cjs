const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");

const baseUrl=process.argv[2]||"http://127.0.0.1:4204/";
const visualUrl=new URL("?visualQA=1",baseUrl).href;
const root=path.resolve(__dirname,"..");
const chromePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function observePage(page){
  const errors=[];
  page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
  page.on("pageerror",error=>errors.push(error.message));
  return errors;
}

async function openVisualQa(context){
  const page=await context.newPage();
  const errors=observePage(page);
  await page.addInitScript(()=>sessionStorage.setItem("earned:intro-seen-v1","1"));
  await page.goto(visualUrl,{waitUntil:"domcontentloaded",timeout:30000});
  await page.waitForSelector(".earned-app-shell",{timeout:30000});
  return {page,errors};
}

async function openView(page,label,id){
  await page.locator(".earned-app-nav__item").filter({hasText:label}).first().click();
  await page.waitForSelector(`main[data-view="${id}"]`,{timeout:12000});
  await page.waitForTimeout(520);
}

async function assertNoOverflow(page,label){
  const layout=await page.evaluate(()=>(
    {scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}
  ));
  assert.ok(layout.scrollWidth<=layout.clientWidth+1,
    `${label} must not overflow (${layout.scrollWidth}px > ${layout.clientWidth}px)`);
}

async function verifyDesktop(browser){
  const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,serviceWorkers:"block"});
  const {page,errors}=await openVisualQa(context);

  const deck=page.locator('[data-forge-command-deck="ready"]');
  await deck.waitFor({state:"visible"});
  assert.equal(await page.locator('[data-forge-avatar="spartan"]').count(),1,"Command Deck must load the default synced avatar");
  const powerButton=page.getByRole("button",{name:"Power",exact:true});
  await powerButton.click();
  assert.equal(await page.locator('[data-forge-avatar="power"]').count(),1,"Avatar style switch must update immediately");
  assert.ok(Number(await page.locator(".forge-system-log").getAttribute("data-forge-log-count"))>0,
    "Visual QA history must populate the real training ledger");
  await page.screenshot({path:path.join(root,"earned-forge-command-deck-desktop.png"),fullPage:false});

  await openView(page,"Train","log");
  const consolePanel=page.locator("[data-forge-console]");
  await consolePanel.waitFor({state:"visible"});
  assert.match(await consolePanel.textContent(),/> ENTER WEIGHT:.*> ENTER REPS:.*> ENTER SETS:/s,
    "Forge console must echo all active lift prompts");
  assert.ok(Number(await consolePanel.getAttribute("data-forge-weight"))>=0,"Forge console must expose a numeric working load");
  assert.equal(await consolePanel.getByRole("button",{name:/Sound (Off|On)/}).count(),1,
    "Terminal sound must remain an explicit control");
  const consoleBox=await consolePanel.boundingBox();
  assert.ok(consoleBox&&(consoleBox.x+consoleBox.width)<=1441,"Desktop Forge console must stay inside the viewport");
  await consolePanel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(root,"earned-forge-train-desktop.png"),fullPage:false});

  await openView(page,"Library","library");
  const firstRow=page.locator('[data-armory-index="0"]');
  await firstRow.click();
  await page.waitForSelector('[data-armory-row] [data-forge-exercise]',{timeout:10000});
  assert.equal(await page.locator('[data-armory-row] [data-forge-muscle]').count(),1,
    "Expanded Armory row must include one targeted anatomy signal");
  await firstRow.focus();
  await page.keyboard.press("ArrowDown");
  await page.waitForFunction(()=>document.activeElement?.getAttribute("data-armory-index")==="1",null,{timeout:2000});
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute("data-armory-index")),"1",
    "ArrowDown must move focus to the next Armory row");
  assert.equal(await page.locator('[data-armory-index="1"]').getAttribute("aria-expanded"),"true",
    "Keyboard navigation must inspect the newly focused Armory row");
  await page.locator('[data-armory-index="1"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(root,"earned-forge-armory-desktop.png"),fullPage:false});

  assert.equal(errors.length,0,`Desktop FORGE_ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
}

async function verifyMobile(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true,serviceWorkers:"block"});
  const {page,errors}=await openVisualQa(context);
  await page.waitForSelector("[data-forge-command-deck]");
  await assertNoOverflow(page,"Mobile Command Deck");

  await openView(page,"Train","log");
  await page.waitForSelector("[data-forge-console]");
  await assertNoOverflow(page,"Mobile Forge console");
  const liveBox=await page.locator("[data-forge-console]").boundingBox();
  assert.ok(liveBox&&liveBox.width<=370,"Mobile Forge console must fit the app workspace");
  await page.locator("[data-forge-console]").scrollIntoViewIfNeeded();
  await page.waitForTimeout(180);
  await page.screenshot({path:path.join(root,"earned-forge-train-mobile.png"),fullPage:false});

  await openView(page,"Library","library");
  await page.locator('[data-armory-index="0"]').click();
  await page.waitForSelector('[data-armory-row] [data-forge-exercise]');
  await assertNoOverflow(page,"Mobile Armory");
  const inspection=await page.locator(".forge-armory-inspection").boundingBox();
  assert.ok(inspection&&inspection.width<=370,"Mobile Armory inspection must remain within the workspace");

  assert.equal(errors.length,0,`Mobile FORGE_ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
}

async function verifyReducedMotion(browser){
  const context=await browser.newContext({viewport:{width:1200,height:800},deviceScaleFactor:1,reducedMotion:"reduce",serviceWorkers:"block"});
  const {page,errors}=await openVisualQa(context);
  await openView(page,"Train","log");
  await page.waitForSelector("[data-forge-console]");
  const animated=await page.locator("[data-forge-console]").evaluate(element=>
    element.getAnimations({subtree:true}).filter(animation=>animation.playState==="running").length
  );
  assert.equal(animated,0,"Reduced-motion Forge console must not retain running CSS animations");
  assert.equal(errors.length,0,`Reduced-motion FORGE_ASCII browser errors: ${errors.join(" | ")}`);
  await context.close();
}

async function verifyBoot(browser){
  const context=await browser.newContext({viewport:{width:1280,height:860},deviceScaleFactor:1,serviceWorkers:"block"});
  const page=await context.newPage();
  const errors=observePage(page);
  await page.addInitScript(()=>{
    const nativeSetTimeout=window.setTimeout.bind(window);
    window.setTimeout=(handler,delay,...args)=>nativeSetTimeout(handler,delay===1250?5000:delay,...args);
  });
  await page.goto(baseUrl,{waitUntil:"domcontentloaded",timeout:30000});
  const boot=page.locator(".forge-boot");
  await boot.waitFor({state:"visible",timeout:30000});
  assert.match(await boot.textContent(),/FORGE_ASCII \/ BOOT/);
  assert.equal(await boot.getByRole("button",{name:"Skip intro"}).count(),1,"Boot sequence must remain skippable");
  await page.screenshot({path:path.join(root,"earned-forge-boot-desktop.png"),fullPage:false});
  await page.evaluate(()=>document.querySelector(".forge-boot button")?.click());
  await boot.waitFor({state:"detached",timeout:5000});
  assert.equal(errors.length,0,`Boot browser errors: ${errors.join(" | ")}`);
  await context.close();
}

(async()=>{
  const browser=await chromium.launch({
    headless:true,
    executablePath:chromePath,
    args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"],
  });
  try{
    await verifyDesktop(browser);
    await verifyMobile(browser);
    await verifyReducedMotion(browser);
    await verifyBoot(browser);
    console.log("Earned FORGE_ASCII browser QA passed across Command Deck, Forge, Armory, mobile, reduced motion, and boot.");
  }finally{
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
