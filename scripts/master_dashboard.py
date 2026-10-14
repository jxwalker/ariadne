"""Read-only master portfolio on the existing private activity listener.
All writes go through the canonical ariadne command API and local peer authentication.
"""
import html, json, os, pathlib, subprocess
from functools import lru_cache
from datetime import datetime, timezone
from urllib.parse import urlencode

PSQL='/usr/lib/postgresql/17/bin/psql'
def snapshot():
    p=subprocess.run([PSQL,'-XqAt','-v','ON_ERROR_STOP=1','-h',str(pathlib.Path.home()/'.local/state/ariadne-master-pg/socket'),'-p','55432','-U','ariadne_master','-d','ariadne_master'],input='SELECT master.snapshot();',text=True,capture_output=True,timeout=15,env={'PATH':os.defpath,'HOME':str(pathlib.Path.home()),'PGPASSFILE':'/dev/null'})
    if p.returncode:raise RuntimeError('ledger unavailable')
    return json.loads(p.stdout)
def sequence(value):return value if isinstance(value,list) else []
def criterion_ids(body):return {c['id'] for c in sequence(body.get('criteria')) if isinstance(c,dict) and isinstance(c.get('id'),str)}
def esc(value):return html.escape(str(value if value is not None else 'Unknown'),quote=True)
def link(route,**args):return esc(route+'?'+urlencode(args))
def age(value):
    if not value:return 'No recorded blocker'
    if not isinstance(value,str):return 'Unknown blocker age'
    try:
        days=(datetime.now(timezone.utc)-datetime.fromisoformat(value.replace('Z','+00:00'))).total_seconds()/86400
        return f'{max(days,0):.1f} days; original '+esc(value)
    except (ValueError,TypeError):return 'Unknown blocker age'
def safe_ref(value):
    if isinstance(value,dict):value=value.get('uri',value.get('url'))
    if isinstance(value,str) and value.startswith('https://'):
        return '<a href="'+esc(value)+'" rel="noreferrer">'+esc(value)+'</a>'
    return esc(value)

def unbound_activity(store, bindings):
    bound={(b.get('execution_source'),b.get('repository'),b.get('native_kind'),b.get('native_id')) for b in bindings}
    with store.connect() as db:
        rows=db.execute("SELECT source,run,task,last,json_extract(envelope,'$.repository') AS repository FROM runs ORDER BY last DESC LIMIT 100").fetchall()
    return [dict(r) for r in rows if (r['source'],r['repository'],'run',r['run']) not in bound and (r['source'],r['repository'],'task',r['task']) not in bound]

def render(data,route,filters):
    nodes={n['id']:n for n in data['nodes']};progress={p['baseline_id']:p for p in data['progress']}
    accepted={a['criterion_id'] for a in data.get('accepted',[]) if a.get('evidence_id')}
    waived_rows=[a for a in data.get('accepted',[]) if not a.get('evidence_id')]
    inactive_waived={a['criterion_id'] for a in waived_rows if nodes.get(a.get('waiver_owner_id') or a['work_id'],{}).get('waiverInactive',True)}
    current_waived={a['criterion_id'] for a in waived_rows}-inactive_waived
    def title(n):return esc(n['body'].get('title',n['id']))
    def source(n):
        s=n['body'].get('source',{})
        if not isinstance(s,dict):return 'Unstructured source, unverified: '+esc(json.dumps(s))
        return esc(s.get('repository','Assignment'))+' · '+esc(s.get('path','No source path'))+' · observed '+esc(s.get('observed_at'))
    children_by_parent={}
    for n in nodes.values():children_by_parent.setdefault(n.get('parent'),[]).append(n['id'])
    @lru_cache(None)
    def descendant_ids(id):
        result={id}
        for child in children_by_parent.get(id,[]):result.update(descendant_ids(child))
        return result
    def denominator(n):
        descendants=descendant_ids(n['id']);counts=[]
        for baseline,p in progress.items():
            entries=[s for s in data.get('scope',[]) if s['baseline_id']==baseline and s['work_id'] in descendants]
            if entries:
                ids={s['criterion_id'] for s in entries}
                counts.append(str(len(ids&accepted))+' evidence accepted · '+str(len(ids&current_waived))+' current waived · '+str(len(ids&inactive_waived))+' inactive (expired/invalid) waivers / '+str(len(ids))+' '+esc(p['baseline_state'])+' criteria · '+esc(baseline))
        return ''.join('<p class="count">'+c+'</p>' for c in counts) or '<p>No scoped criterion denominator recorded</p>'
    agent_states={a['work_id']:a for a in data.get('agentState',[]) if isinstance(a,dict)}
    def agent_state(n):
        a=agent_states.get(n['id'])
        if not a:return '<p>Agent activity: unbound / unattributed; no command lease recorded</p>'
        hand=a.get('handover') or {}; pending=not a.get('resumed') or bool(hand) and bool(a.get('released_at'))
        return ('<p>Holder: '+esc(a.get('agent_identity'))+' · harness '+esc(a.get('harness'))+' · source '+esc(a.get('execution_source'))+'</p>'
          +'<p>Generation: '+esc(a.get('generation'))+' · lease '+('current' if a.get('current') else 'stale / released')+' · expiry '+esc(a.get('expires_at'))+'</p>'
          +'<p>Last meaningful progress: '+esc(a.get('last_progress'))+' · separate from lifecycle presence</p>'
          +'<p>Last command receipt: '+esc(json.dumps(a.get('last_receipt')))+' (transport/effect receipt; not acceptance)</p>'
          +'<p>Handover: '+('pending environment verification' if pending else 'none pending')+'</p>'
          +('<details><summary>Preserved handover</summary><pre>'+esc(json.dumps(hand,indent=2))+'</pre></details>' if hand else '')
          +'<p>Evidence links: '+(' · '.join(safe_ref(e.get('evidence',e) if isinstance(e,dict) else e) for e in sequence(a.get('evidence_refs'))) or 'none recorded')+'</p>')
    def card(n):
        href=link('/work',id=n['id']) if n['kind']=='work' else link('/roadmaps',node=n['id'])
        b=n['body'];refs=[r for r in sequence(b.get('refs')) if isinstance(r,dict)];parts=[f'<article><h3><a href="{href}">{title(n)}</a></h3><p>{esc(n["kind"])} · revision {n["revision"]} · {esc(b.get("state","sourced draft"))}</p>']
        if n['kind']=='baseline':
            p=progress.get(n['id'],{'accepted_criteria':0,'denominator':0})
            scope_ids={s['criterion_id'] for s in data.get('scope',[]) if s['baseline_id']==n['id']}
            inactive=len(scope_ids&inactive_waived) if scope_ids else p.get('expired_waived_criteria',0)
            current=max(0,p.get('waived_criteria',0)-inactive)
            parts.append(f'<p class="count">{p["accepted_criteria"]} evidence accepted · {current} current waived ({inactive} inactive/expired) mandatory criteria / {p["denominator"]} {"approved" if b.get("state")=="approved" else "proposed"} criteria</p>')
            parts.append('<p>Approved denominator: '+(str(p['denominator']) if b.get('state')=='approved' else 'none — awaiting James')+'</p><details><summary>Scope diff</summary><pre>'+esc(json.dumps(b.get('scopeDiff',{}),indent=2))+'</pre></details>')
        if n['kind'] in ('product','phase','milestone'):parts.append(denominator(n))
        if n['kind']=='work':
            parts.append(agent_state(n))
            parts.append('<p>Blocker: '+esc(b.get('blocker'))+'</p>')
            parts.append(f'<p>Owner: {esc(b.get("owner"))} · {source(n)}</p><p>Source claim: {esc(b.get("sourceStatus"))}</p><p>Next: {esc(b.get("nextAction"))}</p>')
            parts.append('<p>PR attribution: '+('explicit reference' if any(r.get('kind')=='github_pr' and r.get('url') and not r.get('classification') for r in refs) else 'mentioned in source text, unverified' if refs else 'pre-PR / unattributed')+'</p>')
            if b.get('scopeExclusion'):parts.append('<p>Excluded from baseline commitments: '+esc(b['scopeExclusion'])+'</p>')
            if isinstance(b.get('waiver'),dict):parts.append('<p class="blocked">WAIVER '+('inactive (expired or invalid)' if n.get('waiverInactive') else 'recorded')+' · expiry '+esc(b['waiver'].get('expiresAt'))+'</p><pre>'+esc(json.dumps(b['waiver']))+'</pre>')
            if b.get('dependencyProvenance'):parts.append('<p>Dependencies: '+esc(json.dumps(b['dependencyProvenance']))+'</p>')
            if n.get('blockers'):parts.append('<p class="blocked">Dependencies: '+esc(json.dumps(n['blockers']))+'</p>')
            if b.get('blockerSince'):parts.append('<p>Blocker age: '+age(b['blockerSince'])+'</p>')
        parts.append('</article>');return ''.join(parts)
    body='<header><a class="brand" href="/">Ariadne</a><span>Master development portfolio</span></header><nav><a href="/">Operations</a><a href="/roadmaps">Roadmaps</a><a href="/work">Work</a></nav>'
    if route=='/work' and filters.get('id'):
        n=nodes.get(filters['id'][0])
        if not n or n['kind']!='work':return page(body+'<h1>Work item unavailable</h1>')
        b=n['body'];body+='<h1>'+title(n)+'</h1><p>'+esc(n['id'])+' · revision '+str(n['revision'])+'</p>'+card(n)
        body+='<h2>Goal and requirements</h2><p>'+esc(b.get('goal'))+'</p><pre>'+esc(json.dumps(b.get('requirements',[]),indent=2))+'</pre>'
        policy=nodes.get(b.get('policy'),{}).get('body',{})
        body+='<h2>Acceptance policy and mandatory criteria</h2><pre>'+esc(json.dumps({'policy':b.get('policy'),'rules':policy,'criteria':b.get('criteria',[])},indent=2))+'</pre>'
        body+='<h2>Dependency chain</h2>'
        visited=set()
        def chain(id):
            if id in visited:return '<p>Already shown: '+esc(id)+'</p>'
            visited.add(id);edges=[d for d in data['dependencies'] if d['work_id']==id]
            return ''.join('<article>'+esc(d['dependency_id'])+' · '+esc(nodes.get(d['dependency_id'],{}).get('body',{}).get('state','unresolved'))+chain(d['dependency_id'])+'</article>' for d in edges)
        body+=chain(n['id']) or '<p>No recorded dependencies</p>'
        lineage={n['id']};ancestor=b.get('splitFrom')
        while isinstance(ancestor,str) and ancestor and ancestor not in lineage:
            lineage.add(ancestor);ancestor=nodes.get(ancestor,{}).get('body',{}).get('splitFrom')
        criteria=criterion_ids(b)
        refs=[e for e in data['evidence'] if e['work_id']==n['id'] or e['work_id'] in lineage and e['body'].get('criterionId') in criteria]
        associations=[e for e in data.get('acceptanceEvidence',[]) if e['criterion_id'] in criteria and e['work_id'] in lineage]
        if isinstance(b.get('splitFrom'),str) and b['splitFrom']:body+='<p>Inherited criterion evidence and acceptance from '+esc(b['splitFrom'])+'; original immutable records retained.</p>'
        body+='<h2>Run / PR / CI / merge / deploy / Eval Factory references</h2><pre>'+esc(json.dumps({'references':refs+sequence(b.get('refs')),'selectedAcceptanceEvidence':associations},indent=2))+'</pre>'
        body+='<p>Missing references remain unverified. Agent completion alone cannot accept this work.</p><h2>Immutable command history</h2>'
        for j in data['history']:
            if j['target'] in lineage:body+='<article><p>'+esc(j['at'])+' · '+esc(j['actor'])+' · '+esc(j['command_id'])+'</p><pre>'+esc(json.dumps(j,indent=2))+'</pre></article>'
    elif route=='/work':
        body+='<h1>Work queues</h1><p>Authoritative state, source claims and unattributed observations stay visible. Draft scope cannot be ready.</p>'
        offset=max(0,int(filters.get('offset',['0'])[0]));limit=min(100,max(1,int(filters.get('limit',['50'])[0])))
        eligible=[n for n in nodes.values() if n['kind']=='work' and (not filters.get('state') or n['body'].get('state')==filters['state'][0])]
        visible={n['id'] for n in eligible[offset:offset+limit]}
        body+='<p>'+str(len(eligible))+' items · <a href="'+link('/work',offset=max(0,offset-limit),limit=limit,**({'state':filters['state'][0]} if filters.get('state') else {}))+'">Previous</a> · <a href="'+link('/work',offset=offset+limit,limit=limit,**({'state':filters['state'][0]} if filters.get('state') else {}))+'">Next</a></p>'
        for state in ['ready','active','verification','blocked','waiting','parked','proposed','accepted','cancelled','superseded']:
            work=[n for n in nodes.values() if n['id'] in visible and n['body'].get('state')==state]
            body+=f'<details {"open" if state in ["active","blocked","proposed"] else ""}><summary>{esc(state.title())} · {len(work)}</summary><div class="grid">'+''.join(card(n) for n in work)+'</div></details>'
    else:
        selected=nodes.get(filters.get('node',[''])[0]);body+='<h1>Roadmaps</h1>'
        if selected:
            ancestors=[];n=selected
            while n:
                ancestors.append(n);n=nodes.get(n.get('parent'))
            body+='<p><a href="/roadmaps">Portfolio</a> / '+' / '.join(f'<a href="{link("/roadmaps",node=n["id"])}">{title(n)}</a>' for n in reversed(ancestors))+'</p>'+card(selected)
            children=[n for n in nodes.values() if n.get('parent')==selected['id']]
        else:
            body+='<p>Three pilot products. Imported roadmaps are proposed; source Done claims have no accepted scope without required evidence and James approval.</p>'
            children=[n for n in nodes.values() if n['kind']=='product']
        body+='<div class="grid">'+''.join(card(n) for n in children)+'</div>'
    body+='<h2>Binding coverage</h2><p>Only explicit operator-approved native identities bind work. Unattributed observations are not progress. Correct or approve mappings through the operator binding path.</p><p>Recorded bindings: '+str(len(data.get('workBindings',[])))+'</p>'
    body+='<h2>Unbound activity</h2><p>Latest 100 observed runs checked against exact bindings. No title-based mapping or ownership is inferred.</p>'
    if data.get('unboundActivity') is None:body+='<p>Observation coverage unavailable</p>'
    elif not data['unboundActivity']:body+='<p>No unbound runs in this bounded observation window</p>'
    for activity in data.get('unboundActivity') or []:
        body+='<article><p>Source '+esc(activity.get('source'))+' · repository '+esc(activity.get('repository'))+' · run '+esc(activity.get('run'))+' · native task '+esc(activity.get('task'))+'</p><p>Unattributed activity; proposed mapping: none. Operator action: select an exact canonical work ID, review repository/source/run binding, then approve through master.bind_work. Observation does not grant command authority.</p></article>'
    body+='<h2>Decisions</h2><div class="grid">'
    for n in nodes.values():
        if n['kind']=='decision':
            b=n['body'];body+='<article><h3>'+esc(n['id'])+' · '+title(n)+'</h3><p>'+esc(b.get('state'))+' · selected '+esc(b.get('resolution'))+'</p><ul>'+''.join('<li>'+esc(o)+'</li>' for o in sequence(b.get('options',[])))+'</ul><p>'+esc(b.get('source'))+'</p></article>'
    body+='</div><h2>External dependencies and gaps</h2>'+''.join(card(n) for n in nodes.values() if n['kind']=='external')
    return page(body)
def page(body):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ariadne · Master portfolio</title><style>body{font:16px system-ui;background:#f5f7fa;color:#172b38;max-width:1240px;margin:auto;padding:24px}header,nav{display:flex;gap:24px;align-items:center;margin-bottom:24px}.brand{font-size:28px;font-weight:bold}a{color:#155973}h1{font-size:30px}h2{margin-top:32px}h3{margin-top:0;font-size:18px}article{background:white;border:1px solid #cdd8df;border-radius:10px;padding:18px;margin-bottom:14px;overflow-wrap:anywhere;min-width:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.count{font-size:20px;font-weight:600}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;background:#edf2f6;padding:14px}summary{cursor:pointer;padding:16px;font-weight:600}.blocked{color:#913b25}@media(max-width:700px){body{padding:14px}.grid{grid-template-columns:1fr}header{align-items:flex-start;flex-direction:column;gap:4px}nav{gap:18px}h1{font-size:24px}}</style></head><body>'+body+'</body></html>'


def api_page(data,filters):
    """Bounded collection API; detailed records require explicit collection and target filters."""
    collection=filters.get('collection',['nodes'])[0]
    allowed={'nodes','history','evidence','imports','progress','accepted','acceptanceEvidence','scope','dependencies','aliases','agentState','workBindings'}
    if collection not in allowed:raise ValueError('invalid collection')
    offset=max(0,int(filters.get('offset',['0'])[0]));limit=min(100,max(1,int(filters.get('limit',['50'])[0])))
    records=data.get(collection,[])
    if filters.get('id'):
        target=filters['id'][0]
        lineage={target};criteria=set()
        if collection in {'accepted','acceptanceEvidence','evidence','history'}:
            nodes={n['id']:n for n in data.get('nodes',[])}
            body=nodes.get(target,{}).get('body',{})
            criteria=criterion_ids(body)
            ancestor=body.get('splitFrom')
            while isinstance(ancestor,str) and ancestor and ancestor not in lineage:
                lineage.add(ancestor);ancestor=nodes.get(ancestor,{}).get('body',{}).get('splitFrom')
        def matches(record):
            if target in [record.get('id'),record.get('target'),record.get('work_id'),record.get('baseline_id'),record.get('node_id')]:return True
            if collection=='history':return record.get('target') in lineage
            criterion=record.get('criterion_id',record.get('body',{}).get('criterionId'))
            return collection in {'accepted','acceptanceEvidence','evidence'} and record.get('work_id') in lineage and criterion in criteria
        records=[r for r in records if matches(r)]
    if filters.get('state'):records=[r for r in records if r.get('body',{}).get('state')==filters['state'][0]]
    return {'collection':collection,'items':records[offset:offset+limit],'total':len(records),'offset':offset,'limit':limit,'nextOffset':offset+limit if offset+limit<len(records) else None}
