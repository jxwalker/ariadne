import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';
import fs from 'node:fs/promises';
import path from 'node:path';
const output=path.resolve(process.argv[2] || 'master-browser-evidence');
await fs.mkdir(output,{recursive:true});
const fixture=spawn('python3',['scripts/master_browser_fixture.py'],{stdio:['pipe','pipe','inherit']});
let browser;
try {
  const lines=createInterface({input:fixture.stdout});
  const config=await Promise.race([new Promise((resolve,reject)=>{lines.once('line',line=>{try{resolve(JSON.parse(line));}catch(e){reject(e);}});fixture.once('exit',code=>reject(new Error('fixture exited '+code)));}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('fixture timeout')),60000).unref())]);
  browser=await chromium.launch({headless:true});
  for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const page=await browser.newPage({viewport});
    async function shot(name){if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw new Error('horizontal overflow '+name);await page.screenshot({path:path.join(output,name+'-'+size+'.png'),fullPage:true});}
    const response=await page.goto(config.url+'/roadmaps');
    if(!response.headers()['content-security-policy']?.includes("default-src 'none'"))throw new Error('missing CSP');
    await shot('portfolio');
    for(const name of ['Patent Studio','Imported sourced draft v1','Gate 0','Frozen Gate 0 release/restore readiness']) {
      await page.getByRole('link',{name,exact:true}).last().click();await shot(name.replaceAll(' ','-'));
    }
    await page.locator('article h3 a[href^="/work?"]').first().click();
    await page.getByRole('heading',{name:'Immutable command history'}).waitFor();await shot('work-details');
    await page.getByRole('link',{name:'Work',exact:true}).click();await shot('work-queues');
    await page.getByText('Holder: agent:synthetic-browser', {exact:false}).first().waitFor();
    await page.getByText('Source synthetic-unbound', {exact:false}).waitFor();
    await shot('synthetic-adapter-ownership-and-unbound');
    const api=await page.request.get(config.url+'/api/master?limit=2');const data=await api.json();
    if(data.items.length!==2 || !data.nextOffset)throw new Error('pagination failed');
    // Transport-only fixture: session discovery fails once, then recovers.
    // No operator response is submitted and the real authorization is tested in Python.
    let sessionAttempts=0;
    await page.route('**/api/operator-session',async route=>{
      sessionAttempts++;
      await route.fulfill({status:sessionAttempts===1?503:200,json:sessionAttempts===1?{error:'temporary ledger restart'}:{canRespond:true,csrfToken:'isolated-browser-fixture',expiresAt:Date.now()/1000+600}});
    });
    await page.route('**/api/operating?*',async route=>{
      const original=await route.fetch(),data=await original.json();
      data.needsYou=[{id:'isolated-browser-decision',kind:'explicit-decision',repo:'jxwalker/ariadne',owner:'james',source:'Isolated test agent',sourceId:'isolated',title:'Session recovery regression',reason:'Choose the next test step',recommendation:'Continue the isolated test',options:['Continue the isolated test'],requestRevision:'fixture-revision'}];
      await route.fulfill({response:original,json:data});
    });
    await page.goto(config.url+'/');await page.getByRole('button',{name:'Confirm suggested response',exact:true}).waitFor();
    if(sessionAttempts<2)throw new Error('operator session recovery was not exercised');
    await page.getByRole('button',{name:'Choose or edit response',exact:true}).click();
    await page.getByRole('dialog').waitFor();await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.getByRole('heading',{name:'Needs you',exact:true,level:2}).waitFor();await shot('operations-overview');await page.getByRole('heading',{name:'What’s stuck',exact:true,level:2}).waitFor();await shot('operations-blockers');
    for(const view of ['delivery','machines','evidence']){await page.locator(`[data-view="${view}"]`).click();await shot('operations-'+view);}
    await page.close();
  }
  await fs.writeFile(path.join(output,'manifest.json'),JSON.stringify({source:'real loopback activity_server route, isolated PG; desktop/mobile click-through and operations',transportFixtures:'Operator-session first-503 recovery and an explicit test question are simulated in browser transport; no response is submitted.',status:'passed'},null,2));
}finally{
  if(browser)await browser.close();fixture.stdin.end('\n');
  await new Promise(resolve=>{if(fixture.exitCode!==null)resolve();else fixture.once('exit',resolve);});
}
