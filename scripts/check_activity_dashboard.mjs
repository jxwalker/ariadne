/** Read-only browser checks against an operator-selected loopback data copy. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.argv[2]||'http://127.0.0.1:18099';
const address=new URL(base);
assert.equal(address.hostname,'127.0.0.1','render checks must use a loopback copy');
const directory=new URL('../.insights-check/',import.meta.url);
await fs.mkdir(directory,{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for(const width of [1440,375]){
  const page=await browser.newPage({viewport:{width,height:1000}});const errors=[];let polls=0,navigations=0;
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(r.url().includes('/api/insights'))polls++;if(r.isNavigationRequest())navigations++;});
  await page.goto(base,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#insight-status').textContent.startsWith('Updated'));
  assert.equal(await page.locator('meta[http-equiv="refresh"]').count(),0);
  assert.equal(await page.locator('#durable-activity .charts svg').count(),4);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false,`page overflow at ${width}px`);
  const liveTop=await page.locator('#insight-live').evaluate(e=>e.getBoundingClientRect().top);
  assert(liveTop<450,'live summary near top');
  assert.equal(await page.locator('img').evaluateAll(imgs=>imgs.filter(img=>!img.complete||!img.naturalWidth).length),0);
  assert.equal(await page.locator('#insight-runs').evaluate(e=>e.open),false,'activity log starts collapsed');
  await page.locator('#insight-run-summary').click();
  await page.waitForFunction(()=>document.querySelector('#controls-status').textContent.startsWith('Updated'));
  assert(await page.locator('#control-rows tr').count()>0,'control evidence is visible');
  await page.locator('#control-rows details').first().evaluate(e=>e.open=true);
  await page.locator('[name=snapshots]').check();await page.locator('[name=stale]').check();
  await page.waitForTimeout(2000);
  assert((await page.locator('#insight-page').innerText()).includes('matching runs'));
  if(!(await page.locator('#insight-next').isDisabled())){
   await page.locator('#insight-next').click();await page.waitForFunction(()=>document.querySelector('#insight-page').textContent.startsWith('Page 2'));
   await page.locator('#insight-prev').click();await page.waitForFunction(()=>document.querySelector('#insight-page').textContent.startsWith('Page 1'));
  }
  await page.locator('[name=group]').selectOption('machine');await page.waitForSelector('.insight-group');
  assert(await page.locator('.insight-group').count()>0);
  await page.locator('#insight-rows details').first().evaluate(e=>e.open=true);
  await page.locator('[name=text]').fill('ariadne');await page.waitForTimeout(2000);
  await page.locator('#insight-rows details').first().evaluate(e=>e.open=true);
  await page.locator('#insight-range').selectOption('7d');await page.waitForTimeout(3000);
  assert.equal(await page.locator('[name=text]').inputValue(),'ariadne');
  await page.locator('#insight-rows details').first().evaluate(e=>e.open=true);
  await page.locator('#insight-rows').scrollIntoViewIfNeeded();
  const y=await page.evaluate(()=>scrollY),before=polls;
  await page.waitForTimeout(16000);
  assert(polls>before,'in-place poll ran');
  assert.equal(navigations,1,'polling must not navigate');
  assert.equal(await page.locator('[name=text]').inputValue(),'ariadne');
  assert.equal(await page.locator('[name=group]').inputValue(),'machine');
  assert(Math.abs(await page.evaluate(()=>scrollY)-y)<5,'poll preserves scroll');
  assert(await page.locator('#insight-rows details[open]').count()>0,'poll preserves evidence drawers');
  assert(await page.locator('#control-rows details[open]').count()>0,'poll preserves control drawers');
  // Simulate Page Visibility API state without freezing browser timers.
  await page.evaluate(()=>Object.defineProperty(document,'hidden',{configurable:true,get:()=>true}));
  const hiddenBefore=polls;await page.waitForTimeout(16000);assert.equal(polls,hiddenBefore,'hidden tab stops polling');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForTimeout(3000);assert(polls>hiddenBefore,'visible tab refreshes');
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:new URL(`dashboard-${width}.png`,directory).pathname,fullPage:true});
  assert.deepEqual(errors,[],'no browser/CSP errors');
  results.push({width,status:'passed',polls,navigations,overflow,visibility:'simulated Page Visibility API state'});
  await page.close();
 }
 console.log(JSON.stringify(results,null,2));
 await fs.writeFile(new URL('browser-results.json',directory),JSON.stringify(results,null,2));
} finally {await browser.close();}
