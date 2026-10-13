/** Browser check: enrolled task title/note/blocker visible in Live now and the log; secrets and unenrolled text absent everywhere. */
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.argv[2]; const leaks=JSON.parse(process.argv[3]);
assert.equal(new URL(base).hostname,'127.0.0.1');
const browser=await chromium.launch({headless:true});
try{
 for(const width of [1440,375]){
  const page=await browser.newPage({viewport:{width,height:1000}});
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#insight-live')?.textContent.includes('Fix login form'));
  const live=await page.locator('#insight-live').innerText();
  assert(live.includes('Tests passing; opening PR next'),'live note');assert(live.includes('blocked: Waiting on CI runner'),'live blocker');assert(live.includes('agent-reported'),'claim label');
  await page.locator('#insight-run-summary').click();await page.waitForFunction(()=>document.querySelector('#insight-rows').textContent.includes('Fix login form'));
  const html=await page.content();
  const apis=await Promise.all(['/api/insights?range=24h','/api/runs?range=24h&stale=show&pageSize=100'].map(p=>page.request.get(base+p).then(r=>r.text())));
  for(const blob of [html,...apis]){for(const l of leaks)assert(!blob.includes(l),'secret leaked');assert(!blob.includes('UNENROLLED'),'unenrolled text leaked');}
  assert(apis[0].includes('redacted sensitive material'));
  await page.screenshot({path:`/tmp/enrol-check-${width}.png`,fullPage:false});
  console.log(JSON.stringify({width,status:'passed'}));await page.close();
 }
}finally{await browser.close();}
