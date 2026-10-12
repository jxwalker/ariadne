import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { expect, it } from 'vitest';
import { importGithubSnapshot } from '../src/githubAdapter.js';
import { generateConsoleHtml } from '../src/consoleHtml.js';
it('renders current PR provenance, check state and safe links without reference tasks', async () => {
  const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ariadne-activity-'));
  try {
    const input = path.join(vaultRoot, 'input.json');
    await fs.writeFile(input, JSON.stringify([{number: 42, title: '<real work>', state:'OPEN', author:{login:'developer'}, headRefName:'claude/work', updatedAt:'2026-10-11T15:00:00Z', url:'https://github.com/test/repo/pull/42', statusCheckRollup:[{name:'build',status:'IN_PROGRESS',detailsUrl:'javascript:alert(1)'}]}]));
    await importGithubSnapshot({project:'live',vaultRoot,sourcePath:input,repository:'test/repo'});
    const result = await generateConsoleHtml({project:'live',vaultRoot,refreshData:true});
    const html = await fs.readFile(result.htmlPath,'utf8');
    expect(html).toContain('#42 &lt;real work&gt;');
    expect(html).toContain('developer');
    expect(html).toContain('claude/work');
    expect(html).toContain('1 pending / 0 failing');
    expect(html).toContain('href="https://github.com/test/repo/pull/42"');
    expect(html).not.toContain('href="javascript:');
    expect(result.data.tasks).toHaveLength(0);
  } finally { await fs.rm(vaultRoot,{recursive:true,force:true}); }
});
