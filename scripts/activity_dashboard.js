/* Private metadata-only polling. No dependencies or external assets. */
(() => {
'use strict';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const colors={Claude:'#175e52',Codex:'#345ba5',Grok:'#8b4788',GitHub:'#875019',Other:'#53645e',success:'#175e52',failure:'#a33139','unknown/interrupted':'#875019',ongoing:'#345ba5'};
let page=1,pages=1,busy=false,pending=false,runRequest=0;
const relative=t=>{if(t==null)return 'Never';let s=Math.max(0,Date.now()/1000-t);return s<60?`${Math.floor(s)}s ago`:s<3600?`${Math.floor(s/60)}m ago`:s<86400?`${Math.floor(s/3600)}h ago`:`${Math.floor(s/86400)}d ago`;};
const absolute=t=>t==null?'Never':new Date(t*1000).toISOString();
const duration=s=>s==null?'No data':s<60?`${Math.round(s)}s`:s<3600?`${Math.round(s/60)}m`:`${(s/3600).toFixed(1)}h`;
const time=t=>`<time title="${esc(absolute(t))}">${relative(t)}</time>`;
const card=(title,body)=>`<article class="insight-card"><h3>${esc(title)}</h3>${body}</article>`;
const empty='<p>No stored evidence in this range.</p>';
function svg(title,body,height=180){return `<svg viewBox="0 0 420 ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>`;}
function stacked(title,data){
 const entries=Object.entries(data).sort(([a],[b])=>a.localeCompare(b));if(!entries.length)return card(title,empty);
 const max=Math.max(1,...entries.map(([,v])=>Object.values(v).reduce((a,b)=>a+b,0)));let body='',keys=new Set(),w=360/entries.length;
 entries.forEach(([day,vals],i)=>{let y=140;Object.entries(vals).forEach(([key,n])=>{keys.add(key);let h=n/max*110;body+=`<rect x="${40+i*w}" y="${y-h}" width="${Math.max(1,w-3)}" height="${h}" fill="${colors[key]||colors.Other}"><title>${esc(day+' · '+key+': '+n)}</title></rect>`;y-=h;});if(i===0||i===entries.length-1||entries.length<=7)body+=`<text x="${40+i*w}" y="160" font-size="10" fill="#203d35">${esc(day.slice(5))}</text>`;});
 body+=`<text x="2" y="30" font-size="11" fill="#203d35">${max}</text><line x1="38" y1="140" x2="405" y2="140" stroke="#789689"/>`;
 return card(title,svg(title,body)+`<div class="chart-key">${[...keys].map(k=>`<span><i style="background:${colors[k]||colors.Other}"></i>${esc(k)}</span>`).join('')}</div>`);
}
function render(data){const m=data.metrics;
 $('insight-status').textContent=`Updated ${absolute(data.generatedAt)} · polling every 15 seconds while visible${data.truncated?' · Record cap reached; aggregates are partial':''}`;
 const liveGroups=new Map();data.live.forEach(r=>{const key=r.agent+' · '+r.machine;liveGroups.set(key,[...(liveGroups.get(key)||[]),r]);});
 $('insight-live').innerHTML=liveGroups.size?[...liveGroups.entries()].map(([key,runs])=>card(key,`<p>${runs.length} fresh active report${runs.length===1?'':'s'}</p>${runs.map(r=>`<p>${esc(r.task)}<br>${esc(r.state)}${r.snapshot?' · read-only snapshot':''} · observed ${duration(r.duration)}<br>Last event ${time(r.last)}</p>`).join('')}`)).join(''):'<p>No fresh active reports. Quiet sources do not prove completion.</p>';

 const sources=new Map();data.sources.forEach(s=>{let old=sources.get(s.name);if(!old)sources.set(s.name,{...s,count:1,states:{[s.state]:1}});else{old.count++;old.states[s.state]=(old.states[s.state]||0)+1;old.last=Math.max(old.last||0,s.last||0)||null;}});
 $('insight-sources').innerHTML=[...sources.values()].map(s=>`<span class="source-chip ${esc(s.state)}" title="${esc(absolute(s.last))}">${esc(s.name)} · ${esc(Object.entries(s.states).map(([state,n])=>state+(s.count>1?' ('+n+')':'')).join(', '))}</span>`).join('')||'<p>No registered sources.</p>';
 const rate=k=>m.rates[k]==null?'No data':`${(100*m.rates[k]).toFixed(1)}% (${m.outcomes[k]||0})`;
 $('insight-metrics').innerHTML=[['Native runs',m.runs],['Snapshot runs',m.snapshotRuns],['Observed active hours',m.activeHours.toFixed(2)],['Success',rate('success')],['Failure',rate('failure')],['Unknown / interrupted',rate('unknown/interrupted')],['Median duration',duration(m.medianSeconds)],['P90 duration',duration(m.p90Seconds)],['Events/hour',`${m.eventsPerHour.toFixed(1)} (${m.events} events)`]].map(([k,v])=>card(k,`<strong class="metric-value">${esc(v)}</strong>`)).join('');
 let heat='';const max=Math.max(1,...data.heatmap.flat());data.heatmap.forEach((row,d)=>{heat+=`<text x="0" y="${28+d*20}" font-size="11" fill="#203d35">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]}</text>`;row.forEach((n,h)=>{heat+=`<rect x="${36+h*15}" y="${15+d*20}" width="13" height="17" fill="${n?'#175e52':'#e5ede8'}" fill-opacity="${n ? 0.8+0.2*n/max : 1}"><title>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]} ${h}:00 UTC: ${n} runs</title></rect>`;});});[0,6,12,18,23].forEach(h=>heat+=`<text x="${36+h*15}" y="170" font-size="10" fill="#203d35">${h}</text>`);
 const hist=data.histogram;let hb='',hm=Math.max(1,...hist.counts);hist.counts.forEach((n,i)=>{let h=n/hm*105;hb+=`<rect x="${20+i*66}" y="${135-h}" width="48" height="${h}" fill="#345ba5"><title>${esc(hist.labels[i])}: ${n} runs</title></rect><text x="${20+i*66}" y="${125-h}" font-size="11" fill="#203d35">${n}</text><text x="${20+i*66}" y="158" font-size="10" fill="#203d35">${esc(hist.labels[i])}</text>`;});
 $('insight-charts').innerHTML=card('Activity by weekday / hour (UTC)',m.runs?svg('Native run start counts by weekday and hour',heat):empty)+stacked('Runs per day by agent',data.days)+card('Completed / failed duration distribution',hist.counts.some(Boolean)?svg('Duration distribution',hb):empty)+stacked('Observed outcomes by run start day',data.outcomesTrend);
 $('insight-callouts').innerHTML=data.insights.length?data.insights.map(s=>`<li>${esc(s)}</li>`).join(''):'<li>No callouts supported by the stored evidence.</li>';
 $('insight-breakdowns').innerHTML=Object.entries(data.breakdown).map(([key,items])=>card(`Runs by ${key}`,items.length?`<ul>${items.map(x=>`<li>${esc(x.name)}: ${x.runs}</li>`).join('')}</ul>`:empty)).join('');
 let repoBars='';const repos=data.repositories.slice().sort((a,b)=>b.observations-a.observations), repoMax=Math.max(1,...repos.map(r=>Math.max(r.commits,r.prs,r.checks)));
 repos.slice(0,10).forEach((r,i)=>{let y=22+i*65;repoBars+=`<text x="10" y="${y}" font-size="11" fill="#203d35">${esc(r.repo)}</text>`;[['commits',colors.Claude],['prs',colors.Codex],['checks',colors.Grok]].forEach(([key,color],j)=>{repoBars+=`<rect x="10" y="${y+5+j*12}" width="${r[key]/repoMax*340}" height="9" fill="${color}"><title>${esc(r.repo)}: ${r[key]} ${key}</title></rect><text x="${20+r[key]/repoMax*340}" y="${y+13+j*12}" font-size="10" fill="#203d35">${r[key]}</text>`;});});
 $('insight-repos').innerHTML=(repos.length?card('Repository activity · top 10 by observations',svg('Observed commits, PRs and terminal CI results',repoBars,Math.min(10,repos.length)*65+15)+'<p class="chart-key">Green: commits · Blue: observed PRs · Purple: CI results</p>'):'')+(repos.length?repos.map(r=>card(r.repo,`<p>${r.commits} commits · ${r.prs} observed PRs</p><p>CI: ${r.passRate==null?'No terminal results':`${(r.passRate*100).toFixed(1)}% passing (${r.passed}/${r.checks})`}</p><p>${r.observations} stored observations</p>`)).join(''):empty);

 for(const key of ['repo','agent','machine','source','state']){const el=$('insight-filters').elements[key],old=el.value;const vals=data.filters[key];el.innerHTML='<option value="">All</option>'+vals.map(v=>`<option value="${esc(v)}">${esc(key==='source'?(data.sourceLabels?.[v]||data.sources.find(s=>s.id===v)?.name||'Unregistered source'):v)}</option>`).join('');el.value=old;}
}
async function fetchJSON(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw Error(`HTTP ${r.status}`);return r.json();}
async function renderRuns(){
 const request=++runRequest;
 const p=new URLSearchParams(new FormData($('insight-filters')));p.set('page',page);p.set('range',$('insight-range').value);
 const data=await fetchJSON('/api/runs?'+p);if(request!==runRequest||p.get('range')!==$('insight-range').value)return;pages=data.pages;
 if(pages&&page>pages){page=pages;return renderRuns();}
const opened=new Set([...$('insight-rows').querySelectorAll('details[open]')].map(e=>e.dataset.run));let group=null;
 $('insight-rows').innerHTML=data.runs.map(r=>{const g=p.get('group');let header='';if(g&&group!==r[g]){group=r[g];header=`<tr class="insight-group"><td colspan="5">${esc(group)}</td></tr>`;}
 const key=r.source+'/'+r.id;return header+`<tr><td data-label="Run / repository">${esc(r.repo)}<small title="${esc(r.id)}">${esc(r.id.slice(0,10))}${r.snapshot?' · snapshot':''}</small></td><td data-label="Agent / machine">${esc(r.agent)}<small>${esc(r.machine)}</small></td><td data-label="State">${esc(r.state)}<small>${duration(r.duration)} observed</small></td><td data-label="Last event">${time(r.last)}</td><td data-label="Evidence"><details data-run="${esc(key)}" ${opened.has(key)?'open':''}><summary>${r.eventCount} events${r.gaps?` · ${r.gaps} gaps`:''}</summary><p>${esc(r.sourceName)}${r.branch?` · ${esc(r.branch)}`:''}${r.commit?` · ${esc(r.commit.slice(0,8))}`:''}${r.pr?` · PR #${r.pr}`:''}</p><p>Independent GitHub association (repository + PR/branch/commit; not authorship)</p>${r.github.length?`<ul>${r.github.map(e=>`<li>${esc(e.kind)} · ${esc(e.state)} · ${time(e.at)}${e.url?` · <a href="${esc(e.url)}" rel="noreferrer">GitHub evidence</a>`:''}</li>`).join('')}</ul>`:'<p>No matching GitHub observation in this range.</p>'}<p>Latest 30 accepted lifecycle events</p><ul>${r.evidence.map(e=>`<li>${esc(e.kind)} #${e.sequence} · ${esc(e.sourceName)} · ${time(e.at)}</li>`).join('')}</ul></details></td></tr>`;}).join('')||'<tr><td colspan="5">No runs match. Include snapshots or stale runs to inspect collected history.</td></tr>';
 $('insight-page').textContent=`Page ${data.total?page:0} of ${pages} · ${data.total} matching runs`;$('insight-prev').disabled=page<=1;$('insight-next').disabled=page>=pages;
}
async function poll(){if(document.hidden)return;if(busy){pending=true;return;}busy=true;const range=$('insight-range').value;try{const d=await fetchJSON('/api/insights?range='+range);if(range!==$('insight-range').value){pending=true;return;}render(d);await renderRuns();}catch(e){$('insight-status').textContent='Refresh unavailable; showing last collected view. '+e.message;}finally{busy=false;if(pending){pending=false;poll();}}}

$('insight-range').addEventListener('change',()=>{page=1;poll();});$('insight-filters').addEventListener('submit',e=>e.preventDefault());let debounce;
$('insight-filters').addEventListener('input',()=>{page=1;clearTimeout(debounce);debounce=setTimeout(()=>renderRuns().catch(()=>{$('insight-status').textContent='Run refresh unavailable.';}),250);});
$('insight-prev').onclick=()=>{if(page>1){page--;renderRuns().catch(()=>{$('insight-status').textContent='Run refresh unavailable.';});}};$('insight-next').onclick=()=>{if(page<pages){page++;renderRuns().catch(()=>{$('insight-status').textContent='Run refresh unavailable.';});}};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll();});poll();setInterval(poll,15000);
})();
