"""Private evidence alerts. Log notifier only; external webhook delivery is disabled."""
import argparse
import fnmatch
import fcntl
import hashlib
import json
import os
import pathlib
import threading
import time
from collections import defaultdict
from activity_controls import controls, text
from activity_insights import sources_view

_LOCK = threading.Lock()

class LogNotifier:
    def notify(self, transition):
        # The append-only transition journal is the notification channel.
        return None

class WebhookNotifier:
    def __init__(self, config):
        from urllib.parse import urlsplit
        url=urlsplit(config.get('url',''))
        key=pathlib.Path(config['secretHeaderFile'])
        if url.scheme!='https' or not url.hostname or url.username or url.password or url.query or url.fragment or key.is_symlink() or key.stat().st_mode & 0o777 != 0o600:
            raise ValueError('webhook requires HTTPS and a mode-600 secret header file')
        header=json.loads(key.read_text())
        if not isinstance(header,dict) or set(header)!={'name','value'} or not all(isinstance(v,str) and v and '\r' not in v and '\n' not in v for v in header.values()):
            raise ValueError('secretHeaderFile must contain a name/value JSON object')
        self.header=header  # Protected memory only; never returned or logged.
    def notify(self, transition):
        raise RuntimeError('webhook delivery disabled; operator provisioning and approval required')

def quiet_seconds(ident, registration, config):
    rules=config.get('sourceQuietSeconds',{})
    if ident in rules:return rules[ident]
    host=registration.get('correlationHost','')
    kind='snapshot' if registration.get('provenance')=='read-only local snapshot' else 'native'
    for pattern,seconds in rules.items():
        if fnmatch.fnmatch(host+'/'+kind,pattern):return seconds
    return config.get('laptopQuietSeconds',86400) if host.lower() in {'jw-mbp','m5','jimm5.local'} or any(k in ident.lower() for k in ['jw-mbp','m5']) else config.get('defaultQuietSeconds',7200)

def candidates(store,registry,config,at):
    options=config.get('alerts',{});result=[]
    secrets=tuple(v.get('secret') for v in registry.values() if v.get('secret'))
    def add(key,rule,message,severity='warning'):
        result.append({'id':hashlib.sha256(key.encode()).hexdigest()[:24],'rule':rule,'message':text(message,secrets),'severity':severity})
    truncated=False
    control=controls(store,registry,config.get('controlEvidenceDirs',[]),at)
    pending={r['id'][7:] for r in control['controls'] if r['id'].startswith('source:') and r['records'][0]['state']=='provider-pending'}
    for source in sources_view(store,registry,at):
        ident=source['id']
        if source['state']=='revoked':continue
        if source['state'] in {'never-connected','provider-pending'} or ident in pending:
            add('pending:'+ident,'source-information',source['name']+': provider-pending' if ident in pending else source['name']+': never-connected','info')
        elif source.get('last') is None or at-source['last']>quiet_seconds(ident,registry[ident],options):add('quiet:'+ident,'quiet-source',source['name']+': collector/receipt quiet beyond configured threshold')
    for row in control['controls']:
        if row['id'] in {'executions','audit'} and row['status']=='fail':
            latest={}
            for record in row['records']:latest.setdefault(record.get('planId') or record['id'],record)
            for record in latest.values():
                if record['controlStatus']=='fail':add(row['id']+':'+record['id'],row['id'],row['title']+': '+record['id']+' reports '+record.get('status','failed'))
    with store.connect() as db:
        for row in db.execute("SELECT source,run,last FROM runs WHERE state IN ('working','blocked','interrupted')"):
            if at-row['last']>options.get('stalledMinutes',30)*60:add('stalled:'+row['source']+':'+row['run'],'stalled-run','Unfinished run '+row['run']+' has no fresh receipt beyond configured threshold')
        # Observation index contains both processed webhooks and latest reconciliation.
        groups=defaultdict(dict)
        for index,row in enumerate(db.execute('SELECT repo,observed,body FROM observations ORDER BY observed DESC LIMIT 50001')):
            if index>=50000:truncated=True;break
            obs=json.loads(row['body']);kind=obs.get('kind');body=obs.get('body',{});checks=[]
            for key in ['workflow_run','check_run','check_suite']:
                if isinstance(body.get(key),dict):checks.append((key,body[key]))
            if kind=='check_run':
                for page in body.get('pages',[]):
                    checks.extend(('check_run',c) for c in (page if isinstance(page,list) else page.get('check_runs',[])))
            for key,c in checks:
                if c.get('conclusion') is None or not c.get('id'):continue
                workflow=str(c.get('workflow_id') or c.get('name') or c.get('app',{}).get('slug') or key)
                groups[(row['repo'],key,workflow)].setdefault(str(c['id']),(row['observed'],c['conclusion']))
        for (repo,kind,workflow),results in groups.items():
            times=defaultdict(list)
            for observed,conclusion in results.values():times[observed].append(conclusion)
            streak=0
            for _,conclusions in sorted(times.items(),reverse=True):
                if any(c not in {'failure','timed_out','action_required'} for c in conclusions):break
                streak+=len(conclusions)
            if streak>=options.get('ciFailureStreak',2):add('ci:'+repo+':'+kind+':'+workflow,'ci-failure-streak',f'{repo} / {workflow}: {streak} consecutive observed CI failures (collection order)')
    return result,truncated or control['truncated']

def evaluate(store,registry,config,at=None):
    at=time.time() if at is None else at
    with _LOCK:
        current,truncated=candidates(store,registry,config,at)
        notifier_config=config.get('alerts',{}).get('notifier',{'backend':'log'})
        backend=notifier_config.get('backend','log')
        if backend not in {'log','webhook'}:raise ValueError('unsupported notifier backend')
        if backend=='webhook':WebhookNotifier(notifier_config)  # Validate provisioning; delivery remains disabled.
        notifier=LogNotifier()
        path=pathlib.Path(config.get('alerts',{}).get('logFile',str(pathlib.Path(store.path).parent/'alerts.jsonl')))
        path.parent.mkdir(mode=0o700,parents=True,exist_ok=True)
        fd=os.open(path,os.O_RDWR|os.O_CREAT|os.O_APPEND|os.O_NOFOLLOW,0o600)
        os.fchmod(fd,0o600)
        with os.fdopen(fd,'a+') as file:
            fcntl.flock(file,fcntl.LOCK_EX)
            previous={}
            file.seek(0)
            for line in file:
                entry=json.loads(line);previous[entry['id']]=entry
            transitions=[];active=set()
            for alert in current:
                ident=alert['id'];active.add(ident);old=previous.get(ident)
                alert.update(firstSeen=old['firstSeen'] if old and old['state']!='resolved' else at,lastSeen=at,state='active')
                if not old or old['state']=='resolved':transitions.append(dict(alert,transition='first-seen'))
                elif at-old['lastSeen']>=config.get('alerts',{}).get('logIntervalSeconds',300):transitions.append(dict(alert,transition='last-seen'))
            for ident,old in previous.items():
                if ident not in active and old['state']!='resolved':transitions.append(dict(old,state='resolved',resolvedAt=at,transition='resolved'))
            for entry in transitions:file.write(json.dumps(entry,sort_keys=True)+'\n');notifier.notify(entry)
            file.flush()
            if transitions:os.fsync(file.fileno())
        return {'generatedAt':at,'alerts':current,'notificationBackend':'log','webhookEnabled':False,'truncated':truncated,'coverage':'Latest 50000 observations, ordered by collection time; workflow-only reconciliation remains pending'}

def main():
    from activity_server import App
    parser=argparse.ArgumentParser();parser.add_argument('--config',required=True);args=parser.parse_args()
    config=json.loads(pathlib.Path(args.config).read_text());app=App(config)
    print(json.dumps(evaluate(app.store,app.sources(),config)))
if __name__=='__main__':main()
