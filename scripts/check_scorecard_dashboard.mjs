import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const server=spawn('python3',['-m','http.server','18179','--bind','127.0.0.1']);
let browser;
try {
 browser=await chromium.launch({headless:true});
 for(let attempt=0;attempt<30;attempt++){try{await fetch('http://127.0.0.1:18179/');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 for(const width of [1440,375]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:18179/scripts/scorecard_dashboard.html');
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='Local evidence loaded');
  assert.equal(await page.locator('#repo option').count(),5);
  assert((await page.locator('body').innerText()).includes('GitHub token not approved (D2)'));
  assert(await page.locator('.source-only').count()>0);
  await page.selectOption('#repo','jxwalker/tech-demos');
  assert.equal(await page.locator('th').count(),2);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Scorecard browser checks passed (desktop/mobile)');
}finally{if(browser)await browser.close();server.kill();}
