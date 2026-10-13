"""Private operating projection. Correct entity grain, source time, explicit decisions.

Raw evidence stays in SQLite. This API returns only bounded, redacted operational fields.
"""
import hashlib,json,math,time
from collections import Counter,defaultdict
from datetime import datetime,timezone
from activity_server import stamp,safe_link
from activity_insights import project,safe_text,percentile,sources_view

MAX_ROWS=50000
ELIGIBLE={'success','failure','timed_out','startup_failure','action_required'}
DEFAULT_CI={'CI','Build','Tests','Validate','Activity validation','Security','Supply chain','Runtime Conformance','APCG Governance','Compliance API CI','Split Release Manifest','APCG Security PR','APCG Security Main','Image Scan','Secrets History Scan','Proxmox Runner Smoke','Eval Factory','Eval Factory nightly Replay B'}
DEFAULT_CD={'Deploy UAT','Promote UAT to Production','APCG Deploy — Staging','APCG Deploy — Evaluation','Release'}
DEFAULT_REVIEW={'Grok PR Review','AI review','Running Copilot Code Review'}
DEFAULT_OPERATIONS={'Production Uptime','CI Repair Fan-out','Main CI Freshness','UAT Disk Health','Release Train Freshness','Backup Health','Weekly SLO Baseline','SLO Incident Reconciliation','Backup Restore Drill','APCG Re-pin Drift','APCG Operations Cadence Evidence','Engine drift','Main Red Alert'}
def workflow_role(run,policy=None):
    name=run.get('name') or 'Unnamed workflow';policy=policy or {}
    for role,names in [('ci',DEFAULT_CI),('cd',DEFAULT_CD),('review',DEFAULT_REVIEW),('operations',DEFAULT_OPERATIONS)]:
        if name in policy.get(role,names):return role
    if run.get('event')=='dynamic' or ' - Update #' in name or name.startswith('Graph Update:'):return 'dependency'
    return 'unclassified'
def ts(value):
    try:return stamp(value)
    except (ValueError,TypeError,OverflowError):return None
def link(value):return value if isinstance(value,str) and safe_link(value) else None
def test_run(e,reg):
    if e.get('classification')=='test' or reg.get('classification')=='test':return True
    words=' '.join(str(e.get(k,'')) for k in ['runId','taskId','label','sourceId']).lower()
    return any(v in words for v in ['conntest-','hbtest-','controlled-test','connectivity test','controlled test'])
def day(t):return datetime.fromtimestamp(t,timezone.utc).strftime('%Y-%m-%d')
def stable(*parts):return hashlib.sha256('\n'.join(str(p) for p in parts).encode()).hexdigest()[:20]

def evidence(store):
    prs={};runs={};jobs={};deployments={};collections={};machines={};issues={};pending={};repo_info={};truncated=False
    with store.connect() as db:
        rows=db.execute('SELECT repo,observed,body FROM observations ORDER BY observed DESC LIMIT ?', (MAX_ROWS+1,)).fetchall()
    for n,row in enumerate(rows):
        if n==MAX_ROWS:truncated=True;break
        try:o=json.loads(row['body']);b=o.get('body',{});repo=row['repo'];kind=o.get('kind');observed=row['observed']
        except (ValueError,TypeError):continue
        if not isinstance(b,dict):continue
        if kind=='pipeline_collection':collections.setdefault(repo,dict(b,observedAt=observed));continue
        if kind=='repo_info':repo_info.setdefault(repo,b);continue
        if kind=='machine_snapshot':
            if b.get('host'):machines.setdefault(b['host'],b)
            continue
        candidates=[]
        if kind=='pull_request':candidates=[('pr',b.get('pull_request'))]
        elif kind=='workflow_run':candidates=[('run',b.get('workflow_run'))]
        elif kind=='pipeline_jobs':
            for j in b.get('jobs',[]):
                if isinstance(j,dict) and j.get('id'):jobs.setdefault((repo,j['id']),dict(j,_observed=observed))
        elif kind=='deployment':candidates=[('deploy',b.get('deployment'))]
        elif kind=='deployment_status':
            d=b.get('deployment');s=b.get('deployment_status')
            if isinstance(d,dict) and isinstance(s,dict):candidates=[('deploy',dict(d,latest_status=s))]
        elif kind=='pipeline_deployment':candidates=[('deploy',b)]
        elif kind=='issues':
            for i in b.get('issues',[]):
                if isinstance(i,dict) and not i.get('pull_request') and i.get('number'):issues.setdefault((repo,i['number']),dict(i,_observed=observed))
        elif kind=='pending_deployments':
            for d in b.get('pending',[]):
                if isinstance(d,dict):pending.setdefault((repo,b.get('runId'),d.get('environment',{}).get('id')),dict(d,repo=repo,runId=b.get('runId'),_observed=observed))
        for typ,value in candidates:
            if not isinstance(value,dict):continue
            if typ=='pr':
                ident=value.get('number') or b.get('number');mapping=prs;key=(repo,ident)
            elif typ=='run':
                ident=value.get('id');mapping=runs;key=(repo,ident,value.get('run_attempt',1))
            else:ident=value.get('id');mapping=deployments;key=(repo,ident)
            if not ident:continue
            previous=mapping.get(key);event_time=ts(value.get('updated_at') or value.get('created_at')) or observed
            if typ=='deploy':event_time=ts(value.get('latest_status',{}).get('created_at')) or event_time
            if previous is None or (event_time,observed)>(previous['_event'],previous['_observed']):mapping[key]=dict(value,_event=event_time,_observed=observed)
    return dict(prs=prs,runs=runs,jobs=jobs,deployments=deployments,collections=collections,machines=machines,issues=issues,pending=pending,repo_info=repo_info,truncated=truncated)

def pipeline(repo,ev,start,end,policy=None):
    cohort=defaultdict(dict)
    for (r,ident,attempt),run in ev['runs'].items():
        created=ts(run.get('created_at'))
        if r==repo and created is not None and start<=created<=end:cohort[ident][attempt]=run
    all_cohort=cohort;cohort={};automation=defaultdict(Counter);other_failures=[]
    for ident,attempts in all_cohort.items():
        latest=attempts[max(attempts)];role=workflow_role(latest,policy)
        if role=='ci':cohort[ident]=attempts;continue
        name='Dependency update automation' if role=='dependency' else latest.get('name') or 'Unnamed workflow';automation[(role,name)][latest.get('conclusion') or latest.get('status') or 'unknown']+=1
        if role=='cd':other_failures.append({'id':ident,'repo':repo,'title':name,'state':latest.get('conclusion'),'createdAt':ts(latest.get('created_at')),'at':ts(latest.get('updated_at')),'url':link(latest.get('html_url')),'attempt':max(attempts),'branch':latest.get('head_branch'),'sha':latest.get('head_sha')})
    outcomes=Counter();first=Counter();missing=0;retried=0;queue=[];execution=[];trend=defaultdict(Counter);failures=other_failures;workflows=defaultdict(lambda:Counter());runner_jobs=defaultdict(lambda:Counter())
    for ident,attempts in cohort.items():
        latest=attempts[max(attempts)];f=attempts.get(1);conclusion=latest.get('conclusion');created=ts(latest['created_at']);name=latest.get('name') or 'Workflow';workflow=workflows[name]
        outcomes[conclusion or latest.get('status') or 'unknown']+=1;workflow[conclusion or latest.get('status') or 'unknown']+=1
        if max(attempts)>1:retried+=1
        if f is None:missing+=1
        elif f.get('status')=='completed' and f.get('conclusion') in ELIGIBLE:
            first[f['conclusion']]+=1;workflow['firstEligible']+=1;workflow['firstPassed']+=int(f['conclusion']=='success')
            trend[day(created)]['firstEligible']+=1;trend[day(created)]['firstPassed']+=int(f['conclusion']=='success')
        if latest.get('status')=='completed':
            completed=ts(latest.get('updated_at'))
            if completed and start<=completed<=end:trend[day(completed)]['completed']+=1
        failures.append({'id':ident,'repo':repo,'title':name,'state':conclusion,'createdAt':created,'at':ts(latest.get('updated_at')),'url':link(latest.get('html_url')),'attempt':max(attempts),'branch':latest.get('head_branch'),'sha':latest.get('head_sha')})
    for (r,_),job in ev['jobs'].items():
        if r!=repo or job.get('run_id') not in cohort:continue
        started=ts(job.get('started_at'));finished=ts(job.get('completed_at'));created=ts(job.get('created_at'))
        if not created:
            run=cohort[job['run_id']].get(job.get('run_attempt',1));created=ts(run.get('run_started_at') or run.get('created_at')) if run else None
        if started and created and started>=created:queue.append(started-created)
        if finished and started and finished>=started:execution.append(finished-started)
        name=job.get('runner_name') or 'Runner not assigned';runner_jobs[name]['jobs']+=1
        runner_jobs[name]['inProgress']+=int(job.get('status')=='in_progress');runner_jobs[name]['failed']+=int(job.get('conclusion') in ELIGIBLE-{'success'})
    denominator=sum(first.values());eventual_eligible=sum(outcomes[k] for k in ELIGIBLE)
    completion=sum(outcomes[k] for k in list(ELIGIBLE)+['cancelled','skipped','neutral','stale'])
    collection=dict(ev['collections'].get(repo,{}))
    if collection and end-collection.get('observedAt',0)>1800:collection.update(complete=False,detail='Collector evidence is stale; current performance coverage is partial')
    latest_by_branch={}
    for f in sorted(failures,key=lambda r:r['createdAt'] or 0,reverse=True):latest_by_branch.setdefault((f['title'],f['branch']),f)
    failures=[r for r in latest_by_branch.values() if r['state'] in ELIGIBLE-{'success'}]
    return {'repo':repo,'runs':len(cohort),'allWorkflowRuns':len(all_cohort),'automation':[{'category':role,'name':name,**dict(v)} for (role,name),v in sorted(automation.items())],'completed':completion,'firstPassed':first['success'],'firstEligible':denominator,'firstSuccess':first['success']/denominator if denominator else None,'firstMissing':missing,'eventualPassed':outcomes['success'],'eventualEligible':eventual_eligible,'eventualSuccess':outcomes['success']/eventual_eligible if eventual_eligible else None,'retried':retried,'outcomes':dict(outcomes),'medianQueueSeconds':percentile(queue,.5),'p90QueueSeconds':percentile(queue,.9),'medianExecutionSeconds':percentile(execution,.5),'timingSamples':len(execution),'queueSamples':len(queue),'trend':dict(trend),'failures':sorted(failures,key=lambda r:r['at'] or 0,reverse=True),'workflows':[{'name':n,**dict(v),'firstSuccess':v['firstPassed']/v['firstEligible'] if v['firstEligible'] else None} for n,v in sorted(workflows.items())],'runners':[{'name':n,**dict(v)} for n,v in sorted(runner_jobs.items())],'coverage':collection}

def operating(store,registry,config,params=None,at=None):
    params=params or {};at=time.time() if at is None else at
    days_key=params.get('range',['7d'])[0]
    if days_key not in {'24h','7d','30d'}:raise ValueError('invalid range')
    start=at-({'24h':1,'7d':7,'30d':30}[days_key])*86400
    selected=params.get('repo',[''])[0]
    repos=config.get('operatingRepositories',config.get('githubRepositories',[]))
    if selected and selected not in repos:raise ValueError('invalid repository')
    active_repos=[selected] if selected else repos
    secrets=tuple(r.get('secret','') for r in registry.values());clean=lambda v,n=500:safe_text(v,secrets,n)
    aliases={s.lower() for s in config.get('operatorAliases',['james','jxwalker'])}
    ev=evidence(store);needs=[];blocked=[];insights=[];work=[];pr_rows=[];repo_rows=[]
    def action(ident,title,reason,owner,repo,since,next_step,url=None,kind='review',priority=2,**extra):
        return {'id':ident,'title':clean(title,160),'reason':clean(reason),'owner':clean(owner,128),'repo':repo,'since':since,'nextStep':clean(next_step,300),'url':link(url),'kind':kind,'priority':priority,**extra}
    # Current work and unresolved decisions are not hidden by a historical performance window.
    run_data=project(store,registry,'30d',at,include_github=False)
    run_keys={(r['source'],r['id']):r for r in run_data['runs']}
    with store.connect() as db:
        rows=db.execute("SELECT source,run,envelope,state,last FROM runs ORDER BY last DESC LIMIT 10000").fetchall()
        for row in rows:
            e=json.loads(row['envelope']);reg=registry.get(row['source'],{})
            if e['repository'] not in active_repos or test_run(e,reg) or reg.get('revoked'):continue
            r=run_keys.get((row['source'],row['run']))
            if r is None:continue
            title=r.get('title') or r['task'];state=r['state'];owner=r['sourceName']
            events=db.execute("SELECT envelope,received FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? ORDER BY json_extract(envelope,'$.sequence') DESC LIMIT 100",(row['source'],row['run'])).fetchall()
            meaningful=None;block_at=None;stage=None;next_step=None;category=None;reported_owner=None
            opted_in=reg.get('displayTaskMetadata') is True and not r['snapshot']
            for event in events:
                v=json.loads(event['envelope'])
                if meaningful is None and v['kind']!='heartbeat':meaningful=ts(v['occurredAt']) or event['received']
                if opted_in:
                    stage=stage or v.get('stage');next_step=next_step or v.get('nextStep');category=category or v.get('blockerCategory');reported_owner=reported_owner or v.get('owner')
                if block_at is None and v['kind']=='task.blocked':block_at=ts(v['occurredAt']) or event['received']
            pr=ev['prs'].get((r['repo'],r['pr'])) if r.get('pr') else None
            pr_url=link(pr.get('html_url')) if pr else ('https://github.com/'+r['repo']+'/pull/'+str(r['pr']) if r.get('pr') else None)
            work.append({'id':stable(row['source'],row['run']),'run':r['id'],'source':r['source'],'owner':clean(owner,128),'harness':r['agent'],'machine':clean(r['machine'],128),'repo':r['repo'],'title':clean(title,160),'state':state,'note':r.get('note'),'blocker':r.get('blocker'),'last':r['last'],'progressAt':meaningful,'stage':clean(stage,80) if stage else None,'nextStep':clean(next_step,300) if next_step else None,'pr':r.get('pr'),'url':pr_url,'snapshot':r['snapshot'],'merged':bool(pr and pr.get('merged_at'))})
            if state=='blocked':
                blocked.append(action(stable('block',row['source'],row['run']),title,r.get('blocker') or 'Reporter marked this task blocked; reason not supplied',reported_owner or owner,r['repo'],block_at or meaningful,next_step or 'Open the linked work and confirm the prerequisite with its owner.',pr_url or 'https://codex-dev.tail7b3a3b.ts.net/#work',kind=category or 'agent-blocker',priority=1))
            elif state=='stale/unknown' and not r['snapshot']:
                blocked.append(action(stable('unknown',row['source'],row['run']),title,'Execution freshness is unknown; this is not proof that the task is stuck.',owner,r['repo'],r['last'],'Inspect the source or contact the owning bot before restarting or reassigning.',pr_url,kind='telemetry',priority=4))
        # Resolve only an exact source/request identity; another source cannot close it.
        decisions={}
        for row in db.execute("SELECT source,envelope,received FROM events WHERE json_extract(envelope,'$.kind') IN ('decision.requested','decision.resolved') ORDER BY julianday(json_extract(envelope,'$.occurredAt')) DESC,json_extract(envelope,'$.sequence') DESC LIMIT 5000"):
            e=json.loads(row['envelope']);d=e.get('decision',{});key=(row['source'],e['repository'],d.get('id'));reg=registry.get(row['source'],{})
            if key in decisions:continue
            decisions[key]=True
            if e['kind']!='decision.requested' or e['repository'] not in active_repos or d.get('recipient','').lower() not in aliases or reg.get('displayTaskMetadata') is not True or test_run(e,reg) or reg.get('provenance')=='read-only local snapshot' or reg.get('revoked'):continue
            needs.append(action(stable('decision',*key),e['label'],d['question'],d['recipient'],e['repository'],ts(e['occurredAt']) or row['received'],d.get('recommendation') or 'Open the request and choose one of the supplied options.',d.get('url'),kind='explicit-decision',priority=0 if d['blocking'] else 2,options=[clean(v,160) for v in d.get('options',[])],requestId=d['id'],source=clean(reg.get('displayName') or row['source'],128)))
    for repo in active_repos:
        pipeline_data=pipeline(repo,ev,start,at,config.get('workflowPolicies',{}).get(repo));open_prs=[];merged=0;opened=0;merged_trend=Counter()
        for (r,number),pr in ev['prs'].items():
            if r!=repo:continue
            created=ts(pr.get('created_at'));merge=ts(pr.get('merged_at'))
            merged+=int(merge is not None and start<=merge<=at);opened+=int(created is not None and start<=created<=at)
            if merge is not None and start<=merge<=at:merged_trend[day(merge)]+=1
            if pr.get('state')!='open':continue
            open_prs.append(pr)
            requested=[v.get('login','') for v in pr.get('requested_reviewers',[]) if isinstance(v,dict)]
            url=link(pr.get('html_url'));title=clean(pr.get('title') or f'PR #{number}',160)
            pr_rows.append({'repo':repo,'number':number,'title':title,'draft':bool(pr.get('draft')),'createdAt':created,'updatedAt':ts(pr.get('updated_at')),'author':clean(pr.get('user',{}).get('login','Unknown'),128),'reviewers':[clean(v,128) for v in requested],'url':url,'head':pr.get('head',{}).get('sha'),'branch':clean(pr.get('head',{}).get('ref',''),128)})
            if any(v.lower() in aliases for v in requested):needs.append(action(stable('review',repo,number),title,'GitHub explicitly requests your review; request time has not been collected.',next(v for v in requested if v.lower() in aliases),repo,None,'Review the changes and current checks on GitHub.',url,kind='requested-review',priority=1))
        repo_rows.append({'repo':repo,'openPRs':len(open_prs),'draftPRs':sum(bool(p.get('draft')) for p in open_prs),'opened':opened,'merged':merged,'mergedTrend':dict(merged_trend),'pipeline':pipeline_data,'deploymentCounts':{},'deploymentTrend':{},'observedAt':max((p['_observed'] for p in open_prs),default=None)})
        failures=pipeline_data['failures']
        current_heads={p.get('head',{}).get('sha') for p in open_prs}
        default_branch=ev['repo_info'].get(repo,{}).get('default_branch')
        for f in failures:
            if f['sha'] not in current_heads and (not default_branch or f['branch']!=default_branch):continue
            blocked.append(action(stable('ci',repo,f['id']),f['title'],f"Latest attempt {f['attempt']}: {f['state']} on {f['branch'] or 'current PR head'}.",'Repository maintainer',repo,f['at'],'Open the failed run, inspect the first failing job and decide whether a fix or rerun is appropriate.',f['url'],kind='ci-failure',priority=3))
        first=pipeline_data['firstSuccess']
        if first is not None and pipeline_data['firstEligible']>=10 and first<.8:
            insights.append(action(stable('ci-reliability',repo),'Investigate repeated CI rework',f"{pipeline_data['firstPassed']} of {pipeline_data['firstEligible']} eligible first attempts passed in this range. {pipeline_data['retried']} runs were retried.",'Repository maintainer',repo,None,'Use the workflow breakdown to identify the failing pipeline before changing runner capacity.','https://github.com/'+repo+'/actions',kind='ci-reliability',priority=2))
        cov=pipeline_data['coverage']
        if not cov or not cov.get('complete') or (cov.get('observedAt') and at-cov['observedAt']>1800):
            insights.append(action(stable('coverage',repo),'Delivery collection needs attention',cov.get('detail') or 'Historical workflows, attempts and deployment collection is not complete.', 'Ariadne collector',repo,cov.get('observedAt'),'Check the collector status and rate-limit evidence; treat the displayed rates as partial.','https://github.com/'+repo+'/actions',kind='coverage',priority=4))
    for (repo,number),issue in ev['issues'].items():
        labels={v.get('name','').lower() for v in issue.get('labels',[]) if isinstance(v,dict)};assignees={v.get('login','').lower() for v in issue.get('assignees',[]) if isinstance(v,dict)}
        if repo in active_repos and issue.get('state')=='open' and labels & {'needs-james','needs-decision','needs-owner'} and assignees & aliases:
            needs.append(action(stable('issue',repo,number),issue.get('title') or f'Issue #{number}','An open decision issue is explicitly assigned to you; assignment time has not been collected.','James',repo,None,'Read the issue and record your decision there.',issue.get('html_url'),kind='assigned-decision',priority=1))
    for p in ev['pending'].values():
        if p['repo'] not in active_repos or at-p['_observed']>900:continue
        reviewers=p.get('reviewers',[]);mine=any(v.get('type')=='User' and v.get('reviewer',{}).get('login','').lower() in aliases for v in reviewers)
        if mine:
            needs.append(action(stable('deploy-approval',p['repo'],p['runId'],p.get('environment',{}).get('id')),'Deployment approval requested',p.get('environment',{}).get('name') or 'Protected environment','James',p['repo'],p['_observed'],'Review the exact revision and checks in the protected environment before approving.','https://github.com/'+p['repo']+'/actions/runs/'+str(p['runId']),kind='deployment-approval',priority=0))
    deployment_rows=[]
    for (repo,ident),d in ev['deployments'].items():
        if repo not in active_repos:continue
        created=ts(d.get('created_at'));s=d.get('latest_status',{});state=s.get('state') or 'unknown';at_status=ts(s.get('created_at'));terminal=d.get('terminal_status') or s
        if created is None or not start<=created<=at:continue
        deployment_rows.append({'repo':repo,'id':ident,'environment':clean(d.get('environment') or 'Unspecified',128),'sha':d.get('sha'),'state':state,'at':at_status or created,'url':link(s.get('log_url') or s.get('environment_url')),'production':d.get('production_environment'),'runtimeVerified':False})
        stats=next(r for r in repo_rows if r['repo']==repo);key=terminal.get('state') if terminal.get('state') in {'success','failure','error'} else state
        stats['deploymentCounts'][key]=stats['deploymentCounts'].get(key,0)+1
        terminal_at=ts(terminal.get('created_at')) or created
        if start<=terminal_at<=at:
            bucket=stats['deploymentTrend'].setdefault(day(terminal_at),{'success':0,'failure':0,'pending':0})
            bucket['success' if key=='success' else 'failure' if key in {'failure','error'} else 'pending']+=1
        if state in {'failure','error'}:blocked.append(action(stable('deployment',repo,ident),'Deployment reported a failure',d.get('environment') or 'Environment unspecified','Repository maintainer',repo,at_status or created,'Inspect the deployment log and verify which revision is running before retrying.',s.get('log_url'),kind='deployment-failure',priority=1))
    machine_rows=[]
    for spec in config.get('machines',[]):
        host=spec['host'];m=ev['machines'].get(host,{})
        measured=m.get('at');status=m.get('status','never-collected');stale=measured is None or at-measured>180
        state='unknown' if stale else 'reachable' if status=='available' else 'unreachable'
        row={k:m.get(k) for k in ['cpuPercent','cores','memoryPercent','memoryAvailableBytes','memoryTotalBytes','swapUsedBytes','diskPercent','diskUsedBytes','diskTotalBytes','load','pressure','temperatures','fans','services','vms']}
        row.update(host=host,kind=spec.get('kind','machine'),parent=spec.get('parent'),at=measured,state=state,platform=m.get('platform'),history=[])
        with store.connect() as db:
            history=db.execute("SELECT observed,body FROM observation_history WHERE id LIKE ? AND observed BETWEEN ? AND ? ORDER BY observed DESC LIMIT 120",('machine:'+host+':%',start,at)).fetchall()
        row['history']=[{'at':h['observed'],**{k:json.loads(h['body']).get('body',{}).get(k) for k in ['cpuPercent','memoryPercent','diskPercent']}} for h in reversed(history)]
        machine_rows.append(row)
        if state=='reachable':
            if row.get('diskPercent') is not None and row['diskPercent']>=85:insights.append(action(stable('disk',host),'Inspect storage headroom',f"{host}: root disk is {row['diskPercent']:.1f}% used.",'Machine operator',None,measured,'Inspect disk growth and retention; prepare a reviewed cleanup or expansion plan.',kind='storage',priority=1))
            pressure=row.get('pressure') or {}
            if pressure.get('memory_full',0)>5 or pressure.get('io_full',0)>10:insights.append(action(stable('pressure',host),'Investigate resource pressure',f'{host} reports sustained memory or IO stalls.','Machine operator',None,measured,'Compare the host history with runner occupancy and job queue delay before changing capacity.',kind='capacity',priority=2))
            for sensor in row.get('temperatures') or []:
                if sensor.get('status') not in {'ok','ns'}:insights.append(action(stable('thermal',host,sensor['name']),'Check thermal status',f"{host}: {sensor['name']} is {sensor['celsius']} °C, sensor status {sensor['status']}.",'Machine operator',None,measured,'Inspect the R740 management readings and workload; do not change cooling from a single value.',kind='thermal',priority=1))
        else:insights.append(action(stable('machine',host),'Check machine collection',f'{host}: {state}. '+('A Mac may be asleep; reachability alone does not establish a failure.' if spec.get('kind')=='mac' else 'No current hardware health measurement is available.'),'Machine operator',None,measured,'Check the machine and its collector; retain unknown status until a fresh measurement arrives.',kind='machine-coverage',priority=4))
    sources=sources_view(store,registry,at)
    cloud=[]
    for source in sources:
        reg=registry.get(source['id'],{})
        if source['id'].startswith('box-'):cloud.append({'host':source['name'],'kind':'cloud','state':source['state'],'at':source['last'],'hardwareAvailable':False})
    def order(items):return sorted({v['id']:v for v in items}.values(),key=lambda v:(v['priority'],v['since'] or at))
    return {'generatedAt':at,'range':days_key,'start':start,'repo':selected,'repositories':repos,'needsYou':order(needs),'blocked':order(blocked),'insights':order(insights),'workTotal':len(work),'workLimit':200,'work':sorted(work,key=lambda r:(r['state'] not in {'working','blocked'},-r['last']))[:200],'pullRequests':sorted(pr_rows,key=lambda r:r['updatedAt'] or 0,reverse=True),'delivery':repo_rows,'deployments':sorted(deployment_rows,key=lambda r:r['at'],reverse=True)[:100],'machines':machine_rows,'cloud':cloud,'sources':sources,'truncated':ev['truncated'] or run_data['truncated'],'definitions':{'firstAttempt':'Named build/validation workflows only; review, monitoring, dependency and unclassified automation is shown separately. Successful completed attempt 1 / eligible completed attempt 1. Failures, timeouts, startup failures and action_required are eligible. Cancelled, skipped, neutral and in-flight runs are separate. Missing first attempts are excluded and counted.','eventual':'Latest observed attempt successes / eligible completed latest attempts, one count per workflow run ID.','throughput':'Distinct merged PRs use merged_at; CI completions use terminal workflow updated_at. A repeated poll does not create delivery.','timing':'Job queue delay uses created_at to started_at; where absent, workflow run_started_at is the lower-resolution fallback. Execution uses started_at to completed_at. Timing sample counts are shown.','deployment':'GitHub-reported deployment status, not verified runtime or accepted delivery. Production success is unknown without independent running-revision and health evidence.','coverage':'Current work and decisions cover the configured repos independently of the historical range. Performance measures use the selected repository and range. Cloud hardware is unavailable.'}}
