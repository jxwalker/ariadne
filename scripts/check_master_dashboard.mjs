import {chromium} from '@playwright/test';
import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const output=path.resolve(process.argv[2] || 'master-browser-evidence');
const fixture=spawnSync('python3',['scripts/master_browser_fixture.py','--output',output],{encoding:'utf8'});
if(fixture.status!==0)throw new Error(fixture.stderr || 'fixture failed');
await fs.mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
  for(const [size,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]) {
    const page=await browser.newPage({viewport});
    for(const view of ['portfolio','product','baseline','phase','milestone','work-details','work-queues']) {
      await page.goto(pathToFileURL(path.join(output,view+'.html')).href);
      if(await page.locator('h1').count()!==1)throw new Error('missing main heading');
      if(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth))throw new Error('horizontal overflow: '+view+' '+size);
      if(view==='portfolio')for(const product of ['Patent Studio','OpenScorpion','Ariadne'])await page.getByRole('heading',{name:product,exact:true}).waitFor();
      if(view==='work-details')await page.getByRole('heading',{name:'Immutable command history'}).waitFor();
      await page.screenshot({path:path.join(output,view+'-'+size+'.png'),fullPage:true});
    }
    await page.close();
  }
  console.log(JSON.stringify({output,views:7,screenshots:14,source:'real imported draft sources rendered from isolated PostgreSQL'}));
}finally{await browser.close();}
