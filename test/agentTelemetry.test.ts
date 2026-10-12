import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {expect,it} from 'vitest';
import {generateConsoleHtml} from '../src/consoleHtml.js';
import {isAgentTelemetry} from '../src/agentTelemetry.js';
it('renders pre-PR sessions and marks stale host evidence conservatively',async()=>{
 const vault=await fs.mkdtemp(path.join(os.tmpdir(),'agent-console-'));
 try {
  const dir=path.join(vault,'projects','live','integrations','agents');await fs.mkdir(dir,{recursive:true});
  const snapshot={schemaVersion:1,host:'M5',collectedAt:new Date().toISOString(),status:'available',sources:[{agent:'Claude',status:'available',method:'session events'}],sessions:[{id:'live-session',host:'M5',agent:'Claude',task:'Wire <upload> flow',repository:'jxwalker/patent-studio',branch:'claude/work',changedFiles:['app/upload.ts'],status:'working',lastEventAt:new Date().toISOString(),event:'tool_use',lastTool:'Edit',source:'live-session.jsonl'}]};
  expect(isAgentTelemetry(snapshot)).toBe(true);
  expect(isAgentTelemetry({...snapshot,sessions:[{...snapshot.sessions[0],status:'pretend-active'}]})).toBe(false);
  await fs.writeFile(path.join(dir,'m5.json'),JSON.stringify(snapshot));
  let result=await generateConsoleHtml({project:'live',vaultRoot:vault,refreshData:true});
  let html=await fs.readFile(result.htmlPath,'utf8');
  expect(html).toContain('Claude · working');expect(html).not.toContain('Wire');expect(html).toContain('Read-only repository session');expect(html).not.toContain('http-equiv="refresh"');expect(html).toContain('No matching PR in collected evidence');expect(html).toContain('app/upload.ts');
  snapshot.collectedAt='2020-01-01T00:00:00Z';await fs.writeFile(path.join(dir,'m5.json'),JSON.stringify(snapshot));
  result=await generateConsoleHtml({project:'live',vaultRoot:vault,refreshData:true});html=await fs.readFile(result.htmlPath,'utf8');
  expect(html).toContain('Claude · stale');expect(html).not.toContain('Claude · working');
 } finally {await fs.rm(vault,{recursive:true,force:true});}
});
