const {chromium}=require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await browser.newPage({viewport:{width:1280,height:900},deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5182/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__bathroomReady,null,{timeout:90000});
 const report=await page.evaluate(()=>({loaded:Number(document.body.dataset.loaded),errors:Number(document.body.dataset.errors),total:window.__bathroom.assets.length,states:[...window.__bathroom.states]}));assert.equal(report.errors,0);assert.equal(report.loaded,report.total);console.log('All '+report.total+' models loaded');
 for(const key of ['overview','vanity','shower','top']){await page.locator(`[data-view="${key}"]`).click();await page.waitForTimeout(1600);await page.evaluate(key=>window.__bathroom.setView(key,false),key);await page.waitForTimeout(300);await page.screenshot({path:path.resolve(__dirname,`../qa/final-${key}.png`)});console.log(key+' captured');}
 await page.evaluate(()=>window.__bathroom.setView('overview',false));await page.locator('#warm').click();assert.equal(await page.locator('#warm').getAttribute('aria-pressed'),'true');await page.waitForTimeout(600);await page.screenshot({path:path.resolve(__dirname,'../qa/final-night.png')});
 await page.locator('#curtain-toggle').click();await page.waitForFunction(()=>window.__bathroom.modelGroups.get('curtain').scale.x>.99,null,{timeout:15000});report.curtainClosed=await page.evaluate(()=>window.__bathroom.curtainClosed);assert.equal(report.curtainClosed,true);await page.screenshot({path:path.resolve(__dirname,'../qa/final-curtain.png')});await page.locator('#curtain-toggle').click();
 await page.locator('#references').click();assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').evaluate(e=>e.open),false);
 await page.locator('[data-filter="daily"]').click();report.daily=await page.locator('.object').count();assert.equal(report.daily,9);await page.locator('[data-id="soap"]').click();assert.equal(await page.locator('#selected-label').textContent(),'洗手液');
 await page.locator('#day').click();await page.locator('#reset').click();await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);await page.evaluate(()=>window.__bathroom.setView('overview',false));await page.waitForTimeout(500);await page.screenshot({path:path.resolve(__dirname,'../qa/final-mobile.png')});report.mobileOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(report.mobileOverflow,false);report.pageErrors=errors;assert.equal(errors.length,0);
 await fs.writeFile(path.resolve(__dirname,'../qa/final-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
