const {chromium}=require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox','--disable-gpu-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 page.on('pageerror',e=>console.log('PAGE_ERROR',e.message));
 await page.goto(process.argv[2]||'http://127.0.0.1:5181/',{waitUntil:'networkidle',timeout:90000});
 await page.waitForTimeout(4000);
 if(process.argv[4]) await page.locator(process.argv[4]).click();
 await page.waitForTimeout(1000);
 await page.screenshot({path:path.resolve(process.argv[3]||'preview.png'),fullPage:true});
 console.log(await page.locator('body').innerText());
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
