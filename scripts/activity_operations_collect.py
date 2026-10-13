#!/usr/bin/env python3
"""Read-only GitHub and host collection with durable raw evidence and bounded writes.

Uses existing gh/SSH authorization. No GitHub mutation or host provisioning.
"""
import argparse,concurrent.futures,fcntl,json,pathlib,shlex,subprocess,time
from datetime import datetime,timezone
from activity_server import Store,canonical
from activity_reconcile import persist_observations

class BudgetExceeded(Exception):pass
class GitHub:
    def __init__(self,budget=450):self.remaining=budget
    def api(self,endpoint):
        if self.remaining<=0:raise BudgetExceeded()
        self.remaining-=1
        r=subprocess.run(['gh','api',endpoint],capture_output=True,text=True,timeout=45,check=True)
        return json.loads(r.stdout)
    def pages(self,endpoint,key=None,max_pages=100):
        out=[];total=None
        for page in range(1,max_pages+1):
            raw=self.api(endpoint+('&' if '?' in endpoint else '?')+f'per_page=100&page={page}')
            items=raw.get(key,[]) if key else raw
            if not isinstance(items,list):raise ValueError('invalid list response')
            if isinstance(raw,dict):total=raw.get('total_count')
            out.extend(items)
            if len(items)<100 or total is not None and len(out)>=total:return out,total
        raise BudgetExceeded()

def iso(at):return datetime.fromtimestamp(at,timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
def workflow_window(api,repo,start,end):
    # Actions filtered searches have a 1,000-result cap. Split busy intervals before pagination.
    endpoint=f'repos/{repo}/actions/runs?created={iso(start)}..{iso(end)}'
    initial=api.api(endpoint+'&per_page=100&page=1');total=initial.get('total_count',0)
    if total>1000:
        if end-start<=1:raise ValueError('one-second interval exceeds GitHub search limit')
        mid=int((start+end)/2)
        return workflow_window(api,repo,start,mid)+workflow_window(api,repo,mid+1,end)
    runs=initial.get('workflow_runs',[])
    for page in range(2,(total+99)//100+1):runs.extend(api.api(endpoint+f'&per_page=100&page={page}').get('workflow_runs',[]))
    if len(runs)<total:raise ValueError('incomplete workflow window')
    return runs

def collect_pipeline(store,config,api=None):
    api=api or GitHub(config.get('operationsRequestBudget',450));now=int(time.time());days=config.get('pipelineHistoryDays',30)
    repositories=config.get('operatingRepositories',config['githubRepositories'])
    # Give incomplete repositories a turn before refreshed ones, preventing a busy repo starving the rest.
    with store.connect() as db:states={r['name'][9:]:(r['status']=='success',r['at']) for r in db.execute("SELECT name,at,status FROM health WHERE name LIKE 'pipeline:%'")}
    for repo in sorted(repositories,key=lambda r:states.get(r,(False,0))):
        observations=[];complete=True;detail='Read-only GitHub workflow/attempt/deployment reconciliation complete';first_missing=0
        with store.connect() as db:
            prior=db.execute('SELECT detail FROM health WHERE name=?',('pipeline:'+repo,)).fetchone()
            cached={row['id']:json.loads(row['body']) for row in db.execute("SELECT id,body FROM observations WHERE repo=? AND id LIKE 'pipeline:run:%'",(repo,))}
            cached_deployments={row['id']:json.loads(row['body']).get('body',{}) for row in db.execute("SELECT id,body FROM observations WHERE repo=? AND id LIKE 'pipeline:deploy:%'",(repo,))}
        try:previous=json.loads(prior[0]) if prior else {}
        except ValueError:previous={}
        history_start=now-days*86400
        # Bootstrap full history; later poll recent creations plus every still-open run below.
        cursor=max(history_start,previous.get('backfillCursor',history_start))
        window_start=max(history_start,previous.get('end',history_start)-86400) if cursor>=previous.get('end',now) and previous.get('backfillCursor') else cursor
        try:
            repo_data=api.api(f'repos/{repo}')
            observations.append(('pipeline:repo:'+repo,{'kind':'repo_info','body':{'default_branch':repo_data.get('default_branch')}}))
            current=[]
            chunk_start=window_start
            while chunk_start<=now:
                chunk_end=min(now,chunk_start+86400-1)
                chunk=workflow_window(api,repo,chunk_start,chunk_end)
                persist_observations(store,repo,[(f'pipeline:run:{repo}:{r["id"]}:{r.get("run_attempt",1)}',{'kind':'workflow_run','body':{'workflow_run':r}}) for r in chunk])
                current.extend(chunk);cursor=max(cursor,chunk_end+1);chunk_start=chunk_end+1
                # Advance the durable cursor after each complete day, even if later requests fail.
                progress={'backfillCursor':cursor,'end':now,'complete':False}
                with store.connect() as db:db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('pipeline:'+repo,time.time(),'collecting',canonical(progress)))
            known={v['body']['workflow_run']['id']:v['body']['workflow_run'] for v in cached.values() if v.get('body',{}).get('workflow_run',{}).get('status')!='completed'}
            current_ids={r['id'] for r in current}
            for ident in known:
                if ident not in current_ids:current.append(api.api(f'repos/{repo}/actions/runs/{ident}'))
            # Include cached retries missing their first attempt, not only newly created runs.
            current_by_id={r['id']:r for r in current}
            for v in cached.values():
                r=v.get('body',{}).get('workflow_run',{})
                if r.get('run_attempt',1)>1 and f'pipeline:run:{repo}:{r["id"]}:1' not in cached:current_by_id.setdefault(r['id'],r)
            for r in current_by_id.values():
                attempt=r.get('run_attempt',1);ident=f'pipeline:run:{repo}:{r["id"]}:{attempt}'
                observations.append((ident,{'kind':'workflow_run','body':{'workflow_run':r}}))
            persist_observations(store,repo,observations);observations=[]
            # Cached attempt 1 remains immutable after completion, while retried attempts are separate.
            for r in current_by_id.values():
                if r.get('run_attempt',1)<=1:continue
                ident=f'pipeline:run:{repo}:{r["id"]}:1';old=cached.get(ident,{}).get('body',{}).get('workflow_run',{})
                if old.get('status')=='completed':continue
                try:first=api.api(f'repos/{repo}/actions/runs/{r["id"]}/attempts/1')
                except (subprocess.SubprocessError,BudgetExceeded):first_missing+=1;complete=False;continue
                observations.append((ident,{'kind':'workflow_run','body':{'workflow_run':first}}))
            persist_observations(store,repo,observations);observations=[]
            # Timing diagnostics are an explicit latest-run sample, not a fleet-wide queue percentile.
            sampled=sorted(current,key=lambda r:r.get('created_at',''),reverse=True)[:config.get('pipelineJobSample',20)]
            for r in sampled:
                jobs,_=api.pages(f'repos/{repo}/actions/runs/{r["id"]}/jobs?filter=latest','jobs')
                for j in jobs:j.setdefault('run_attempt',r.get('run_attempt',1))
                observations.append((f'pipeline:jobs:{repo}:{r["id"]}:{r.get("run_attempt",1)}',{'kind':'pipeline_jobs','body':{'jobs':jobs}}))
            for r in current:
                if r.get('status') in {'waiting','pending'}:
                    pending=api.api(f'repos/{repo}/actions/runs/{r["id"]}/pending_deployments')
                    observations.append((f'pipeline:pending:{repo}:{r["id"]}',{'kind':'pending_deployments','body':{'runId':r['id'],'pending':pending}}))
            deployments=[]
            for page in range(1,11):
                part=api.api(f'repos/{repo}/deployments?per_page=100&page={page}')
                deployments.extend(d for d in part if d.get('created_at','')>=iso(history_start))
                if len(part)<100 or part[-1].get('created_at','')<iso(history_start):break
            else:complete=False;detail='Deployment page limit reached; deployment history is partial'
            limit=config.get('pipelineDeploymentLimit',400)
            refresh_ids=set();by_environment={}
            for d in sorted(deployments,key=lambda v:v.get('created_at',''),reverse=True):
                env=d.get('environment','');by_environment[env]=by_environment.get(env,0)+1
                if by_environment[env]<=3:refresh_ids.add(d['id'])
            for d in deployments[:limit]:
                old=cached_deployments.get(f'pipeline:deploy:{repo}:{d["id"]}',{})
                if old.get('latest_status',{}).get('state')=='inactive' and old.get('terminal_status'):continue
                if old.get('terminal_status') and d['id'] not in refresh_ids and d.get('created_at','')<iso(now-86400):continue
                statuses,_=api.pages(f'repos/{repo}/deployments/{d["id"]}/statuses')
                terminal=next((s for s in statuses if s.get('state') in {'success','failure','error'}),None)
                observations.append((f'pipeline:deploy:{repo}:{d["id"]}',{'kind':'pipeline_deployment','body':dict(d,latest_status=statuses[0] if statuses else {},terminal_status=terminal)}))
            if len(deployments)>limit:complete=False;detail=f'Latest {limit} deployments collected; older deployment status coverage is partial'
            # Explicit assigned decisions; ordinary open issues do not become James's queue.
            for alias in config.get('operatorGitHubLogins',['jxwalker']):
                issues,_=api.pages(f'repos/{repo}/issues?state=open&assignee={alias}')
                observations.append((f'pipeline:issues:{repo}:{alias}',{'kind':'issues','body':{'issues':issues}}))
            prs,_=api.pages(f'repos/{repo}/pulls?state=open')
            for pr in prs:observations.append((f'reconcile:pr:{repo}:{pr["number"]}',{'kind':'pull_request','body':{'pull_request':pr}}))
            for page in range(1,51):
                recent=api.api(f'repos/{repo}/pulls?state=all&sort=updated&direction=desc&per_page=100&page={page}')
                for pr in recent:
                    if pr.get('updated_at','')>=iso(history_start):observations.append((f'reconcile:pr:{repo}:{pr["number"]}',{'kind':'pull_request','body':{'pull_request':pr}}))
                if len(recent)<100 or recent[-1].get('updated_at','')<iso(history_start):break
            else:complete=False;detail='Recent PR history page limit reached; throughput coverage is partial'
        except BudgetExceeded:complete=False;detail='GitHub request budget reached; next collection continues backfill; current metrics are partial'
        except Exception:complete=False;detail='GitHub collection incomplete; inspect host access/rate limits; previous evidence retained'
        persist_observations(store,repo,observations)
        coverage={'start':history_start,'end':now,'backfillCursor':cursor,'complete':complete and cursor>now,'detail':detail,'firstAttemptsMissing':first_missing,'jobSampleRuns':config.get('pipelineJobSample',20),'remainingRequestBudget':api.remaining}
        persist_observations(store,repo,[(f'pipeline:coverage:{repo}',{'kind':'pipeline_collection','body':coverage})])
        with store.connect() as db:db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('pipeline:'+repo,time.time(),'success' if complete else 'partial',canonical(coverage)))
        print(repo, 'complete' if complete else 'partial',flush=True)

def collect_machines(store,config):
    source=pathlib.Path(__file__).with_name('activity_machine_probe.py').read_bytes()
    def probe(spec):
        try:
            if spec.get('local'):cmd=['python3','-','--host',spec['host'],'--kind',spec.get('kind','machine')]
            else:
                cmd=['ssh','-T','-o','BatchMode=yes','-o','StrictHostKeyChecking=yes','-o','ConnectTimeout=5']
                if spec.get('identity'):cmd+=['-i',spec['identity']]
                cmd += [spec['target'],shlex.join(['python3','-','--host',spec['host'],'--kind',spec.get('kind','machine')])]
            result=subprocess.run(cmd,input=source,capture_output=True,timeout=25,check=True)
            value=json.loads(result.stdout)
            if value.get('host')!=spec['host']:raise ValueError('host identity mismatch')
        except Exception:value={'host':spec['host'],'at':time.time(),'kind':spec.get('kind','machine'),'status':'unreachable'}
        return spec,value
    targets=[s for s in config.get('machines',[]) if s.get('target') or s.get('local')]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for spec,value in pool.map(probe,targets):
            host=spec['host'];at=value['at'];body={'kind':'machine_snapshot','body':value}
            with store.connect() as db:
                db.execute('INSERT OR REPLACE INTO observations VALUES(?,?,?,?)',('machine:'+host,'_fleet',at,canonical(body)))
                db.execute('INSERT OR IGNORE INTO observation_history VALUES(?,?,?)',('machine:'+host+':'+str(int(at)),at,canonical(body)))
            print(host,value['status'],flush=True)

def main():
    p=argparse.ArgumentParser();p.add_argument('--config',required=True);p.add_argument('--mode',choices=['pipeline','machines','all'],default='all');a=p.parse_args();c=json.loads(pathlib.Path(a.config).read_text())
    root=pathlib.Path(c['database']).parent;lock=(root/('operations-'+a.mode+'.lock')).open('a')
    try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
    except BlockingIOError:return
    store=Store(c['database'])
    try:
        if a.mode in {'pipeline','all'}:collect_pipeline(store,c)
        if a.mode in {'machines','all'}:collect_machines(store,c)
    finally:store.close()

if __name__=='__main__':main()
