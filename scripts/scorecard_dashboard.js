const config = await fetch('../config/scorecard-allowlist.json').then(r=>r.json());
const data = await fetch('scorecard-data.json').then(r=>r.json());
const repos = Object.keys(config.repositories);
const select = document.querySelector('#repo');
for (const repo of repos) select.add(new Option(repo,repo));
function render() {
 const table=document.querySelector('#matrix');table.replaceChildren();
 const header=table.insertRow();
 for(const text of ['Bot × repo',...repos.filter(r=>!select.value||r===select.value)]){const th=document.createElement('th');th.textContent=text;header.append(th);}
 for(const bot of [...config.sources,'unattributed']) {
  const tr=table.insertRow();tr.insertCell().textContent=bot;
  for(const repo of repos.filter(r=>!select.value||r===select.value)) {
   const cell=tr.insertCell();const rows=data.metrics.filter(r=>r.repo===repo&&r.bot===bot&&(!document.querySelector('#quality').value||r.binding_quality===document.querySelector('#quality').value));
   cell.className=rows.some(r=>r.binding_quality==='source-only')?'source-only':'unbound';
   cell.title='GitHub facts. Merge rate: merged / (merged + closed-unmerged). CI: required checks on final head commit; first completed suite/attempt; unknown policy excluded. Review rounds: changes requested, split by bot and human; push counts unavailable. source-only: explicit hint, no signed join. unbound: no attributable source.';
   const sum=k=>rows.reduce((s,r)=>s+(r[k]||0),0);const rate=(n,d)=>sum(d)?`${Math.round(100*sum(n)/sum(d))}%`:'unknown';
   cell.textContent=rows.length?`${sum('opened')} opened · ${sum('merged')} merged · ${sum('closed_unmerged')} closed unmerged · merge rate ${sum('merged')+sum('closed_unmerged')?Math.round(100*sum('merged')/(sum('merged')+sum('closed_unmerged')))+'%':'unknown'} · first CI ${rate('first_ci_pass','first_ci_known')} · merge CI ${rate('merge_ci_pass','merge_ci_known')} · ${sum('reverts')} reverts · ${sum('bot_review_rounds')} bot review rounds · ${sum('human_review_rounds')} human review rounds · ${sum('suspected_fixups')} suspected fix-ups (estimate) · ${cell.className} · GitHub-only`:'No verified activity · GitHub-only';
  }
 }
 document.querySelector('#status').textContent='Local evidence loaded';
}
select.onchange=render;document.querySelector('#quality').onchange=render;render();
