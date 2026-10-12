"""Bounded, metadata-only private dashboard projections. Never return raw envelopes."""
import json, math, time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from activity_server import safe_link

RANGES = {'24h': 1, '7d': 7, '30d': 30}
MAX_RECORDS = 50000

def product(value):
    v=value.lower()
    return 'Claude' if 'claude' in v else 'Codex' if 'codex' in v else 'Grok' if 'grok' in v else 'GitHub' if 'github' in v else 'Other'

def source_name(ident, registration):
    if registration.get('displayName'): return registration['displayName'][:128]
    if registration.get('correlationHost'): return registration['correlationHost'][:128]
    if 'grok' in ident.lower(): return 'Grok hosted'
    if 'test' in ident.lower(): return 'Controlled test'
    return ident.replace('-',' ').replace('_',' ').title()[:128]

def sources_view(store, registry, at):
    with store.connect() as db:
        latest={r['source']:r['last'] for r in db.execute('SELECT source, MAX(received) AS last FROM events GROUP BY source')}
        for r in db.execute("SELECT name,at FROM health WHERE name LIKE 'snapshot:%'"):
            ident=r['name'][9:];latest[ident]=max(latest.get(ident,0),r['at'])
    return [{'id':ident,'name':source_name(ident,v),'last':latest.get(ident),'state':'revoked' if v.get('revoked') else 'never-connected' if ident not in latest else 'connected' if at-latest[ident]<=90 else 'quiet', 'snapshot':v.get('provenance')=='read-only local snapshot'} for ident,v in registry.items()]

def percentile(values, fraction):
    if not values: return None
    values=sorted(values); index=(len(values)-1)*fraction; lo=math.floor(index);hi=math.ceil(index)
    return values[lo]+(values[hi]-values[lo])*(index-lo)

def project(store, registry, range_key='24h', at=None):
    if range_key not in RANGES: raise ValueError('range must be 24h, 7d or 30d')
    at=time.time() if at is None else at; start=at-RANGES[range_key]*86400
    with store.connect() as db:
        # Select runs overlapping the range, then fetch their complete lifecycle, not just in-range starts.
        records=db.execute('SELECT * FROM runs WHERE last BETWEEN ? AND ? ORDER BY last DESC LIMIT ?', (start,at,10001)).fetchall()
        truncated=len(records)>10000;records=records[:10000]; event_budget=MAX_RECORDS
        runs=[]; counts=Counter(); heat=[[0]*24 for _ in range(7)]
        event_count=db.execute('SELECT count(*) FROM events WHERE received BETWEEN ? AND ?', (start,at)).fetchone()[0]
        for r in records:
            e=json.loads(r['envelope']);reg=registry.get(r['source'],{});agent=product(e['agent']['product'])
            lifecycle=db.execute("SELECT received,json_extract(envelope,'$.kind') AS kind,json_extract(envelope,'$.sequence') AS sequence FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? ORDER BY json_extract(envelope,'$.sequence') LIMIT ?",(r['source'],r['run'],event_budget+1)).fetchall()
            if len(lifecycle)>event_budget: truncated=True
            lifecycle=lifecycle[:event_budget];event_budget-=len(lifecycle)
            if not lifecycle:
                truncated=True;continue
            events=[(x['received'],{'kind':x['kind'],'sequence':x['sequence']}) for x in lifecycle]
            first=min((x[0] for x in events),default=r['last']);last=min(r['last'],at)
            # Receipt span is an observed interval, not inferred CPU time or billed model time.
            terminal=min((t for t,x in events if x['kind'] in {'task.completed','task.failed'}),default=None)
            end=min(last,terminal) if terminal is not None else last
            duration=max(0,end-first);active=max(0,end-max(first,start))
            state=r['state'];state='stale/unknown' if state=='working' and at-r['last']>90 else state
            outcome='success' if state=='agent-reported completion' else 'failure' if state=='agent-reported failure' else 'unknown/interrupted' if state in {'interrupted','unknown','stale/unknown'} else 'ongoing'
            machine=reg.get('correlationHost') or e.get('location',{}).get('name') or 'Unspecified'
            snapshot=reg.get('provenance')=='read-only local snapshot'
            evidence=[{'kind':x['kind'],'sequence':x['sequence'],'at':t,'sourceName':source_name(r['source'],reg)} for t,x in events[-30:]]
            runs.append({'id':r['run'],'source':r['source'],'sourceName':source_name(r['source'],reg),'agent':agent,'machine':machine,'repo':e['repository'],'task':f"{agent} · {e['repository']}",'state':state,'outcome':outcome,'first':first,'last':r['last'],'duration':duration,'activeSeconds':active,'snapshot':snapshot,'gaps':r['gaps'],'branch':e.get('branch'),'commit':e.get('commit'),'pr':e.get('pr'),'eventCount':len(events),'evidence':evidence,'session':e.get('sessionId'),'host':reg.get('correlationHost')})
        # Same approved host/repo/product/session: native reports win over snapshot observations.
        grouped={};other=[]
        for r in runs:
            if not r['host'] or not r['session']: other.append(r);continue
            key=(r['host'],r['repo'],r['agent'],r['session']);old=grouped.get(key)
            if old is None:grouped[key]=r;continue
            winner=r if (old['snapshot'] and not r['snapshot']) or (old['snapshot']==r['snapshot'] and r['last']>old['last']) else old
            combined=old['evidence']+r['evidence']
            winner['evidence']=sorted(combined,key=lambda x:x['at'],reverse=True)[:30]
            winner['eventCount']=old['eventCount']+r['eventCount']
            winner['gaps']=old['gaps']+r['gaps']
            grouped[key]=winner
        runs=sorted(other+list(grouped.values()),key=lambda r:r['last'],reverse=True)
        for r in runs:r.pop('session');r.pop('host')
        native=[r for r in runs if not r['snapshot']]
        days=defaultdict(Counter);outcomes=defaultdict(Counter)
        for r in native:
            d=datetime.fromtimestamp(max(start,r['first']),timezone.utc);day=d.strftime('%Y-%m-%d')
            days[day][r['agent']]+=1;outcomes[day][r['outcome']]+=1
            heat[d.weekday()][d.hour]+=1;counts[r['outcome']]+=1
        durations=[r['duration'] for r in native if r['outcome'] in {'success','failure'}]
        bins=[0]*6
        for v in durations: bins[next((i for i,b in enumerate([60,300,900,3600,14400]) if v<b),5)]+=1
        breakdown={key:[{'name':name,'runs':n} for name,n in Counter(r[key] for r in native).most_common()] for key in ['agent','machine','repo']}
        repositories={}; associations=defaultdict(list)
        # Latest reconciliation snapshots avoid counting repeated polls as new PRs or CI runs.
        observations=db.execute('SELECT repo,observed,body FROM observations WHERE observed BETWEEN ? AND ? ORDER BY observed DESC LIMIT ?', (start,at,MAX_RECORDS+1))
        for index,row in enumerate(observations):
            if index>=MAX_RECORDS:truncated=True;break
            repo=row['repo'];item=repositories.setdefault(repo,{'repo':repo,'commits':set(),'prs':set(),'checks':{},'observations':0})
            item['observations']+=1;obs=json.loads(row['body']);b=obs.get('body',{});kind=obs.get('kind')
            if kind=='push':
                for c in b.get('commits',[]):
                    if c.get('id'):item['commits'].add(c['id'])
            if kind=='pull_request' and b.get('pull_request',{}).get('number'):item['prs'].add(b['pull_request']['number'])
            pr=b.get('pull_request',{});head=pr.get('head',{})
            refs=[('pr',pr.get('number') or b.get('number')),('branch',head.get('ref') or b.get('ref','').removeprefix('refs/heads/')),('commit',head.get('sha') or b.get('after') or b.get('head_sha'))]
            for key in ['check_run','workflow_run','check_suite']:
                if isinstance(b.get(key),dict):refs.append(('commit',b[key].get('head_sha')))
            if kind in {'push','pull_request','pull_request_review','check_run','workflow_run','check_suite'}:
                state=pr.get('state') if kind=='pull_request' else next((b[k].get('conclusion') or b[k].get('status') for k in ['check_run','workflow_run','check_suite'] if isinstance(b.get(k),dict)),None) or b.get('state')
                allowed={'open','closed','success','failure','cancelled','timed_out','queued','in_progress','completed','pending','neutral','skipped','action_required','stale'}
                metadata={'kind':kind,'at':row['observed'],'state':state if state in allowed else 'observed','url':pr.get('html_url') if safe_link(pr.get('html_url')) else None}
                for key,value in refs:
                    if value and len(associations[(repo,key,value)])<10:associations[(repo,key,value)].append(metadata)
            checks=[]
            for k in ['check_run','workflow_run','check_suite']:
                if kind==k and isinstance(b.get(k),dict):checks.append(b[k])
            if kind=='check_run':
                for page in b.get('pages',[]):checks.extend(page if isinstance(page,list) else page.get('check_runs',[]))
            for c in checks:
                if c.get('id') and c.get('conclusion') in {'success','failure','timed_out','cancelled','neutral','skipped','action_required','stale'}:
                    item['checks'].setdefault((kind,str(c['id'])),(row['observed'],c['conclusion']))
    for r in runs:
        matches=[]
        for key in ['pr','branch','commit']:
            if r[key]:matches.extend(associations.get((r['repo'],key,r[key]),[]))
        unique={(x['kind'],x['at'],x['state'],x['url']):x for x in matches}
        r['github']=sorted(unique.values(),key=lambda x:x['at'],reverse=True)[:10]
    repo_stats=[];insights=[]
    for item in repositories.values():
        checks=sorted(item['checks'].values(),reverse=True);passed=sum(c=='success' for _,c in checks);streak=0
        by_time=defaultdict(list)
        for t,c in checks:by_time[t].append(c)
        for t,conclusions in sorted(by_time.items(),reverse=True):
            if any(c not in {'failure','timed_out','action_required'} for c in conclusions):break
            streak+=len(conclusions)
        repo_stats.append({'repo':item['repo'],'commits':len(item['commits']),'prs':len(item['prs']),'checks':len(checks),'passed':passed,'passRate':passed/len(checks) if checks else None,'observations':item['observations']})
        if streak>=2:insights.append(f"{item['repo']}: latest {streak} observed CI results failed (ordered by collection time).")
    for key,items in breakdown.items():
        if items:insights.append(f"Busiest {key}: {items[0]['name']} — {items[0]['runs']} of {len(native)} native runs.")
    stalled=[r for r in native if r['state'] in {'working','blocked','stale/unknown'} and at-r['last']>1800]
    if stalled:insights.append(f"{len(stalled)} unfinished native runs have no event for over 30 minutes.")
    gaps=sum(r['gaps'] for r in runs)
    if gaps:insights.append(f"{gaps} recorded sequence gaps across {sum(r['gaps']>0 for r in runs)} displayed runs; late arrivals may remain recorded as gaps.")
    sources=sources_view(store,registry,at)
    quiet=sum(s['last'] is not None and at-s['last']>7200 and s['state']!='revoked' for s in sources)
    never=sum(s['state']=='never-connected' for s in sources)
    if quiet:insights.append(f"{quiet} registered sources have no accepted event or snapshot collection for over 2 hours.")
    if never:insights.append(f"{never} registered sources have never connected.")
    total=len(native)
    return {'range':range_key,'generatedAt':at,'truncated':truncated,'metrics':{'runs':total,'snapshotRuns':len(runs)-total,'activeHours':sum(r['activeSeconds'] for r in native)/3600,'outcomes':dict(counts),'rates':{k:counts[k]/total if total else None for k in ['success','failure','unknown/interrupted']},'medianSeconds':percentile(durations,.5),'p90Seconds':percentile(durations,.9),'events':event_count,'eventsPerHour':event_count/(RANGES[range_key]*24)},'breakdown':breakdown,'heatmap':heat,'days':dict(days),'outcomesTrend':dict(outcomes),'histogram':{'labels':['<1m','1–5m','5–15m','15–60m','1–4h','≥4h'],'counts':bins},'repositories':repo_stats,'insights':insights,'sources':sources,'live':[r for r in runs if r['state'] in {'working','blocked'} and at-r['last']<=90],'runs':runs}

def page_runs(data, params):
    def arg(key,default=''): return params.get(key,[default])[0][:200]
    try:page=max(1,min(10000,int(arg('page','1'))));size=max(1,min(100,int(arg('pageSize','20'))))
    except ValueError:raise ValueError('invalid pagination')
    runs=data['runs']
    for key in ['repo','agent','machine','source','state']:
        value=arg(key)
        if value:runs=[r for r in runs if r[key]==value]
    if arg('snapshots','hide')!='show':runs=[r for r in runs if not r['snapshot']]
    if arg('stale','hide')!='show':runs=[r for r in runs if r['state']!='stale/unknown']
    if arg('text'):runs=[r for r in runs if arg('text').lower() in ' '.join(str(r[k] or '') for k in ['repo','agent','machine','id','branch','state','sourceName']).lower()]
    group=arg('group')
    if group in {'machine','repo'}:runs=sorted(runs,key=lambda r:(r[group],-r['last']))
    return {'page':page,'pageSize':size,'total':len(runs),'pages':math.ceil(len(runs)/size),'runs':runs[(page-1)*size:page*size],'truncated':data['truncated']}
