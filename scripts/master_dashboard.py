"""Read-only master portfolio on the existing private activity listener.
All writes go through the canonical ariadne command API and local peer authentication.
"""
import html, json, os, pathlib, subprocess
from datetime import datetime, timezone
from urllib.parse import urlencode

PSQL='/usr/lib/postgresql/17/bin/psql'
def snapshot():
    p=subprocess.run([PSQL,'-XqAt','-v','ON_ERROR_STOP=1','-h',str(pathlib.Path.home()/'.local/state/ariadne-master-pg/socket'),'-p','55432','-U','ariadne_master','-d','ariadne_master'],input='SELECT master.snapshot();',text=True,capture_output=True,timeout=15,env={'PATH':os.defpath,'HOME':str(pathlib.Path.home()),'PGPASSFILE':'/dev/null'})
    if p.returncode:raise RuntimeError('ledger unavailable')
    return json.loads(p.stdout)
def esc(value):return html.escape(str(value if value is not None else 'Unknown'),quote=True)
def link(route,**args):return esc(route+'?'+urlencode(args))
def age(value):
    if not value:return 'No recorded blocker'
    try:
        days=(datetime.now(timezone.utc)-datetime.fromisoformat(value.replace('Z','+00:00'))).total_seconds()/86400
        return f'{max(days,0):.1f} days; original '+esc(value)
    except (ValueError,TypeError):return 'Unknown blocker age'
def render(data,route,filters):
    nodes={n['id']:n for n in data['nodes']};progress={p['baseline_id']:p for p in data['progress']}
    def title(n):return esc(n['body'].get('title',n['id']))
    def source(n):
        s=n['body'].get('source',{})
        return esc(s.get('repository','Assignment'))+' · '+esc(s.get('path','No source path'))+' · observed '+esc(s.get('observed_at'))
    def descendant_ids(id):
        result={id}
        for child in nodes.values():
            if child.get('parent')==id:result|=descendant_ids(child['id'])
        return result
    def denominator(n):
        descendants=descendant_ids(n['id']);counts=[]
        accepted={a['criterion_id'] for a in data.get('accepted',[])}
        for baseline,p in progress.items():
            entries=[s for s in data.get('scope',[]) if s['baseline_id']==baseline and s['work_id'] in descendants]
            if entries:
                ids={s['criterion_id'] for s in entries}
                counts.append(str(len(ids&accepted))+' accepted / '+str(len(ids))+' '+esc(p['baseline_state'])+' criteria · '+esc(baseline))
        return ''.join('<p class="count">'+c+'</p>' for c in counts) or '<p>No scoped criterion denominator recorded</p>'
    def card(n):
        href=link('/work',id=n['id']) if n['kind']=='work' else link('/roadmaps',node=n['id'])
        b=n['body'];parts=[f'<article><h3><a href="{href}">{title(n)}</a></h3><p>{esc(n["kind"])} · revision {n["revision"]} · {esc(b.get("state","sourced draft"))}</p>']
        if n['kind']=='baseline':
            p=progress.get(n['id'],{'accepted_criteria':0,'denominator':0})
            parts.append(f'<p class="count">{p["accepted_criteria"]} accepted mandatory criteria / {p["denominator"]} {"approved" if b.get("state")=="approved" else "proposed"} criteria</p>')
            parts.append('<p>Approved denominator: '+(str(p['denominator']) if b.get('state')=='approved' else 'none — awaiting James')+'</p><details><summary>Scope diff</summary><pre>'+esc(json.dumps(b.get('scopeDiff',{}),indent=2))+'</pre></details>')
        if n['kind'] in ('product','phase','milestone'):parts.append(denominator(n))
        if n['kind']=='work':
            parts.append(f'<p>Owner: {esc(b.get("owner"))} · {source(n)}</p><p>Source claim: {esc(b.get("sourceStatus"))}</p><p>Next: {esc(b.get("nextAction"))}</p>')
            parts.append('<p>PR attribution: '+('linked' if b.get('refs') else 'pre-PR / unattributed')+'</p>')
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
        body+='<h2>Run / PR / CI / merge / deploy / Eval Factory references</h2><pre>'+esc(json.dumps([e for e in data['evidence'] if e['work_id']==n['id']]+b.get('refs',[]),indent=2))+'</pre>'
        body+='<p>Missing references remain unverified. Agent completion alone cannot accept this work.</p><h2>Immutable command history</h2>'
        for j in data['history']:
            if j['target']==n['id']:body+='<article><p>'+esc(j['at'])+' · '+esc(j['actor'])+' · '+esc(j['command_id'])+'</p><pre>'+esc(json.dumps(j,indent=2))+'</pre></article>'
    elif route=='/work':
        body+='<h1>Work queues</h1><p>Authoritative state, source claims and unattributed observations stay visible. Draft scope cannot be ready.</p>'
        for state in ['ready','active','verification','blocked','waiting','parked','proposed','accepted','cancelled','superseded']:
            work=[n for n in nodes.values() if n['kind']=='work' and n['body'].get('state')==state]
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
    body+='<h2>Decisions</h2><div class="grid">'
    for n in nodes.values():
        if n['kind']=='decision':
            b=n['body'];body+='<article><h3>'+esc(n['id'])+' · '+title(n)+'</h3><p>'+esc(b.get('state'))+' · selected '+esc(b.get('resolution'))+'</p><ul>'+''.join('<li>'+esc(o)+'</li>' for o in b.get('options',[]))+'</ul><p>'+esc(b.get('source'))+'</p></article>'
    body+='</div><h2>External dependencies and gaps</h2>'+''.join(card(n) for n in nodes.values() if n['kind']=='external')
    return page(body)
def page(body):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ariadne · Master portfolio</title><style>body{font:16px system-ui;background:#f5f7fa;color:#172b38;max-width:1240px;margin:auto;padding:24px}header,nav{display:flex;gap:24px;align-items:center;margin-bottom:24px}.brand{font-size:28px;font-weight:bold}a{color:#155973}h1{font-size:30px}h2{margin-top:32px}h3{margin-top:0;font-size:18px}article{background:white;border:1px solid #cdd8df;border-radius:10px;padding:18px;margin-bottom:14px;overflow-wrap:anywhere;min-width:0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.count{font-size:20px;font-weight:600}pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:13px;background:#edf2f6;padding:14px}summary{cursor:pointer;padding:16px;font-weight:600}.blocked{color:#913b25}@media(max-width:700px){body{padding:14px}.grid{grid-template-columns:1fr}header{align-items:flex-start;flex-direction:column;gap:4px}nav{gap:18px}h1{font-size:24px}}</style></head><body>'+body+'</body></html>'
