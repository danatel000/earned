const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");

const baseUrl=process.argv[2]||"http://127.0.0.1:4204/";
const url=new URL("?visualQA=1",baseUrl).href;
const root=path.resolve(__dirname,"..");
const chromePath="C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const views=[
  ["Today","total"],["Train","log"],["Progress","lifts"],["Records","prs"],
  ["History","history"],["Goals","goals"],["Library","library"],["Feed","community"],
];

async function openView(page,label,id){
  console.log(`Opening ${label}...`);
  await page.locator(".earned-app-nav__item").filter({hasText:label}).first().click();
  await page.waitForSelector(`main[data-view="${id}"]`,{timeout:12000});
  const identity=page.locator(".earned-view-identity");
  await identity.waitFor({state:"visible",timeout:12000});
  assert.equal(await identity.locator(".earned-view-identity__title").textContent(),label);
  assert.ok((await identity.locator(".earned-view-identity__status").textContent()).includes("SYSTEM LIVE"));
  await page.waitForTimeout(900);
  await page.waitForFunction(()=>document.getAnimations()
    .filter(animation=>String(animation.effect?.pseudoElement||"").includes("view-transition"))
    .every(animation=>animation.playState==="finished"),null,{timeout:3000}).catch(()=>{});
  assert.equal(await page.evaluate(()=>window.scrollY),0,`${label} should open at the top of its workspace`);
}

async function assertMobileViewportFit(page,label){
  const offenders=await page.evaluate(()=>{
    const selectors=[
      ".earned-app-header__top",
      ".earned-app-header__mode",
      ".earned-view-identity",
      ".earned-command",
      ".earned-command__content",
      ".earned-command__actions",
      ".earned-command__metrics",
      ".earned-page button",
      ".earned-page input",
      ".earned-page select",
      ".earned-page textarea",
    ].join(",");
    return [...document.querySelectorAll(selectors)]
      .filter(element=>!element.closest(".earned-app-nav"))
      .filter(element=>{
        const style=getComputedStyle(element);
        const box=element.getBoundingClientRect();
        return style.display!=="none"&&style.visibility!=="hidden"&&box.width>0&&box.height>0
          &&box.bottom>0&&box.top<window.innerHeight;
      })
      .filter(element=>{
        const box=element.getBoundingClientRect();
        return box.left<-1||box.right>window.innerWidth+1;
      })
      .map(element=>{
        const box=element.getBoundingClientRect();
        return {
          tag:element.tagName.toLowerCase(),
          className:element.className?.toString?.()||"",
          text:(element.textContent||"").trim().replace(/\s+/g," ").slice(0,64),
          left:Math.round(box.left),
          right:Math.round(box.right),
          viewport:window.innerWidth,
        };
      });
  });
  assert.deepEqual(offenders,[],`${label} contains clipped mobile controls: ${JSON.stringify(offenders)}`);
}

(async()=>{
  console.log("Launching visual QA...");
  const browser=await chromium.launch({headless:true,executablePath:chromePath,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
  const context=await browser.newContext({viewport:{width:1440,height:960},deviceScaleFactor:1,serviceWorkers:"block"});
  const page=await context.newPage();
  const errors=[];
  page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
  page.on("pageerror",error=>errors.push(error.message));
  await page.addInitScript(()=>sessionStorage.setItem("earned:intro-seen-v1","1"));

  try{
    console.log("Loading Earned...");
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    const shell=page.locator(".earned-app-shell");
    await shell.waitFor({state:"visible",timeout:45000});
    console.log("Authenticated product loaded.");

    const desktopShell=await shell.evaluate(element=>element.getBoundingClientRect().width);
    assert.ok(desktopShell>=1160&&desktopShell<=1182,`Desktop shell should be about 1180px; found ${desktopShell}px`);

    for(const [label,id] of views){
      await openView(page,label,id);
      if(["total","log","lifts","goals","library","community"].includes(id)){
        await page.screenshot({path:path.join(root,`earned-premium-${id}-desktop.png`),fullPage:false});
      }
    }

    const panelRadii=await page.locator('.earned-page div[style*="background"][style*="border"]').evaluateAll(elements=>elements
      .filter(element=>{
        const box=element.getBoundingClientRect();
        return box.width>120&&box.height>34;
      })
      .map(element=>parseFloat(getComputedStyle(element).borderTopLeftRadius)||0));
    assert.equal(panelRadii.every(radius=>radius<=8),true,`Operational panel radii must stay at or below 8px: ${panelRadii.filter(radius=>radius>8).join(", ")}`);

    const textControlHeights=await page.locator('.earned-page input:not([type="checkbox"]):not([type="radio"]):not([type="range"]),.earned-page select,.earned-page textarea')
      .evaluateAll(elements=>elements.filter(element=>element.getBoundingClientRect().width>0).map(element=>element.getBoundingClientRect().height));
    assert.equal(textControlHeights.every(height=>height>=38),true,"Visible text-entry controls must remain gym-friendly");

    console.log("Checking mobile composition...");
    await page.setViewportSize({width:390,height:844});
    await openView(page,"Today","total");
    const dimensions=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth}));
    assert.equal(dimensions.scrollWidth,dimensions.clientWidth,"Mobile product must not overflow horizontally");
    const mobileIdentity=await page.locator(".earned-view-identity").boundingBox();
    assert.ok(mobileIdentity&&mobileIdentity.width<=390,"Mobile view identity must stay within the viewport");
    await assertMobileViewportFit(page,"Today");
    await page.screenshot({path:path.join(root,"earned-premium-total-mobile.png"),fullPage:false});
    await openView(page,"Train","log");
    await assertMobileViewportFit(page,"Train");
    await page.screenshot({path:path.join(root,"earned-premium-log-mobile.png"),fullPage:false});

    assert.equal(errors.length,0,`Browser errors: ${errors.join(" | ")}`);
    console.log("Earned premium product UI browser QA passed across all eight views and mobile.");
  }finally{
    await context.close();
    await browser.close();
  }
})().catch(error=>{
  console.error(error);
  process.exit(1);
});
