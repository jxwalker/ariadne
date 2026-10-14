#!/usr/bin/env python3
"""Bounded local spool and authenticated HTTPS delivery. Hooks never perform network IO."""
import argparse, fcntl, hashlib, hmac, json, os, pathlib, stat, subprocess, sys, time, urllib.error, urllib.request, uuid
from datetime import datetime, timezone
from activity_server import validate, canonical

def config(path):
    p=pathlib.Path(path)
    if p.stat().st_mode & 0o077: raise ValueError('sender config must be mode 0600')
    c=json.loads(p.read_text())
    if not c['endpoint'].startswith('https://'): raise ValueError('HTTPS required')
    return c

def enqueue(c,kind,run,task,summary='',parent=None,session=None,operating=None):
    spool=pathlib.Path(c['spool']); spool.mkdir(parents=True,exist_ok=True,mode=0o700)
    with open(spool/'.lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        if len(list(spool.glob('*.json')))>=1000: return None
        state=spool/'sequence.json.state'; seqs=json.loads(state.read_text()) if state.exists() else {}; seq=seqs.get(run,-1)+1; seqs[run]=seq
        tmp=spool/'.sequence.tmp'; tmp.write_text(json.dumps(seqs)); tmp.replace(state)
        e={'schemaVersion':1,'eventId':str(uuid.uuid4()),'sourceId':c['sourceId'],'agent':c['agent'],'project':c['project'],'repository':c['repository'],'taskId':task,'runId':run,'sequence':seq,'occurredAt':datetime.now(timezone.utc).isoformat(),'kind':kind,'label':c.get('label','Repository activity')[:160],'summary':summary[:500]}
        for k in ['branch','commit','pr','location']:
            if k in c: e[k]=c[k]
        if parent: e['parentRunId']=parent
        if session: e['sessionId']=session
        if operating:
            e['schemaVersion']=2;e.update(operating)
        validate(e); p=spool/(e['eventId']+'.json'); p.write_text(canonical(e)); os.chmod(p,0o600)
        return e

def deliver(c,raw):
    ts=str(int(time.time())); nonce=str(uuid.uuid4()); sig=hmac.new(c['secret'].encode(),ts.encode()+b'\n'+nonce.encode()+b'\n'+raw,hashlib.sha256).hexdigest()
    req=urllib.request.Request(c['endpoint'],data=raw,headers={'Content-Type':'application/json','X-Ariadne-Source':c['sourceId'],'X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig})
    with urllib.request.urlopen(req,timeout=5) as r: return json.loads(r.read())

def persist(path, value):
    """Atomically save a protected receipt before acknowledging its spool event."""
    tmp=path.with_name('.'+path.name+'.'+uuid.uuid4().hex+'.tmp')
    try:
        fd=os.open(tmp,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
        with os.fdopen(fd,'w') as f:
            json.dump(value,f);f.flush();os.fsync(f.fileno())
        tmp.replace(path)
        directory=os.open(path.parent,os.O_RDONLY)
        try:os.fsync(directory)
        finally:os.close(directory)
    finally:
        tmp.unlink(missing_ok=True)

def quarantine(spool,event,status):
    # Keep protected storage on the same filesystem and under the delivery lock.
    deadletter=spool/'spool-deadletter'
    deadletter.mkdir(exist_ok=True,mode=0o700)
    metadata=deadletter.lstat()
    if not stat.S_ISDIR(metadata.st_mode) or metadata.st_uid!=os.geteuid():
        raise OSError('unsafe dead-letter directory')
    os.chmod(deadletter,0o700)
    target=deadletter/event.name
    if not target.exists() and len(list(deadletter.glob('*.json')))>=10000:
        raise OSError('dead-letter capacity reached')
    labels={400:'invalid request',401:'unauthorized',403:'forbidden',404:'route not found',
            409:'conflicting event',413:'body too large',422:'unprocessable event'}
    # Preserve evidence on a filename collision; recover an interrupted identical move.
    if target.exists() and (target.is_symlink() or target.read_bytes()!=event.read_bytes()):
        raise OSError('dead-letter identity conflict')
    reason=deadletter/(event.stem+'.reason')
    if not reason.exists():
        persist(reason,{'status':status,'serverError':labels[status],
                        'at':datetime.now(timezone.utc).isoformat()})
    os.chmod(event,0o600)
    descriptor=os.open(event,os.O_RDONLY | os.O_NOFOLLOW)
    try:os.fsync(descriptor)
    finally:os.close(descriptor)
    if not target.exists():os.link(event,target)
    # Destination must be durable before removing the original spool link.
    for directory in (deadletter,spool):
        descriptor=os.open(directory,os.O_RDONLY)
        try:os.fsync(descriptor)
        finally:os.close(descriptor)
    event.unlink()
    descriptor=os.open(spool,os.O_RDONLY)
    try:os.fsync(descriptor)
    finally:os.close(descriptor)
    print('Ariadne sender dead-letter: HTTP '+str(status)+' '+labels[status],file=sys.stderr)

def flush(c):
    spool=pathlib.Path(c['spool']); spool.mkdir(parents=True,exist_ok=True,mode=0o700)
    with open(spool/'.delivery-lock','a') as lock:
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: return
        state=spool/'.retry'; retry=json.loads(state.read_text()) if state.exists() else {'at':0,'attempt':0}
        threshold=int(c.get('permanentFailureThreshold',3))
        backoff=int(c.get('circuitBreakerBackoffSeconds',300))
        if not 1<=threshold<=100 or not 1<=backoff<=86400:raise ValueError('invalid circuit breaker settings')
        reset=spool/'.circuit-reset'
        if reset.exists():
            metadata=reset.lstat()
            if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid!=os.geteuid() or metadata.st_mode & 0o077:
                raise ValueError('operator circuit reset must be a protected regular file')
            retry={'at':0,'attempt':0}
            persist(state,retry) # persist reset before consuming it
            reset.unlink()
            print('Ariadne sender circuit breaker: operator reset consumed',file=sys.stderr)
        if time.time()<retry['at']: return
        # Filesystem timestamps can tie: preserve each run's producer order.
        def order(path):
            try:
                event=json.loads(path.read_text())
                return event['runId'],event['sequence']
            except (OSError,ValueError,KeyError,TypeError):
                return '~invalid',0
        files=sorted(spool.glob('*.json'),key=order)
        for p in files[:100]:
            try:
                receipt=deliver(c,p.read_bytes())
                persist(spool/'.last-receipt',receipt)
                if receipt.get('operatorDecisions'):
                    replies=spool/'.operator-decisions.json.state'
                    known=json.loads(replies.read_text()) if replies.exists() else {}
                    for reply in receipt['operatorDecisions']:
                        known[reply['requestId']+':'+reply['requestRevision']]=reply
                    persist(replies,dict(list(known.items())[-100:]))
                p.unlink();retry={'at':0,'attempt':0}
            except urllib.error.HTTPError as error:
                try:
                    if error.code in {400,401,403,404,409,413,422}:
                        # Fixed local classes only: never store response bodies, URLs or error text.
                        labels={400:'invalid-request',401:'authentication',403:'authentication',404:'route',409:'conflict',413:'body-size',422:'unprocessable'}
                        fingerprint={'status':error.code,'class':labels[error.code]}
                        same=retry.get('permanent')==fingerprint
                        count=retry.get('consecutive',0)+1 if same else 1
                        still_paused=retry.get('paused',False) and same
                        retry.update(permanent=fingerprint,consecutive=count,paused=still_paused)
                        limit=1 if error.code in {401,403} else threshold
                        if still_paused or count>=limit:
                            retry.update(paused=True,at=time.time()+backoff,attempt=0)
                            persist(state,retry)
                            print('Ariadne sender circuit breaker: paused HTTP '+str(error.code)+' '+labels[error.code]+'; backlog retained; probe after backoff or protected .circuit-reset required',file=sys.stderr)
                            break
                        # A different probe outcome releases the old circuit. Persist streak before quarantine.
                        retry.update(at=0,attempt=0,paused=False)
                        persist(state,retry)
                        try:
                            quarantine(spool,p,error.code)
                        except OSError:
                            print('Ariadne sender dead-letter storage unavailable; preserving evidence with backoff',file=sys.stderr)
                        else:
                            continue
                    else:
                        # Transient status differs from the tripping outcome; resume after normal backoff.
                        retry.pop('permanent',None);retry.pop('consecutive',None);retry['paused']=False
                    retry['attempt']=min(retry['attempt']+1,10); retry['at']=time.time()+min(300,2**retry['attempt']); break
                finally:
                    error.close()
            except Exception:
                # Network/storage failure is not an HTTP probe outcome; keep any paused circuit.
                retry['attempt']=min(retry['attempt']+1,10); retry['at']=time.time()+(backoff if retry.get('paused') else min(300,2**retry['attempt'])); break
        persist(state,retry)

HOOKS={'SessionStart':'session.start','UserPromptSubmit':'task.start','PreToolUse':'task.progress','PostToolUse':'task.progress','PostToolUseFailure':'task.progress','Stop':'task.progress','SessionEnd':'session.end','Interrupt':'task.interrupted','SubagentStart':'subagent.start','SubagentStop':'subagent.end'}
def hook(c,data):
    name=data.get('hook_event_name'); kind=HOOKS.get(name)
    if not kind: return
    # Scope by exact approved workspace. Never read transcript, prompt, tool arguments or outputs.
    if pathlib.Path(data.get('cwd','/')).resolve()!=pathlib.Path(c['workspace']).resolve(): return
    session=data.get('session_id'); run=data.get('agent_id') if name.startswith('Subagent') else session
    if not session or not run: return
    enqueue(c,kind,run,c.get('taskId',session),summary={'Stop':'Response stopped; task completion unknown','PostToolUseFailure':'Tool error observed; task state remains independent'}.get(name,name),parent=session if name.startswith('Subagent') else None,session=session)

def overrides(c,a):
    """Per-task title, repository and later branch/SHA/PR association. The server still enforces source scope."""
    c=dict(c)
    if a.repository:
        if a.repository not in c.get('repositories',[c['repository']]): raise ValueError('repository outside configured scope')
        c['repository']=a.repository
    for k in ('label','branch','commit','pr'):
        if getattr(a,k) is not None: c[k]=getattr(a,k)
    return c

def main():
    p=argparse.ArgumentParser(); p.add_argument('--config',required=True); p.add_argument('mode',choices=['hook','flush','worker','event','run']); p.add_argument('--kind',default='task.progress'); p.add_argument('--run-id'); p.add_argument('--task-id'); p.add_argument('--summary',default=''); [p.add_argument(f) for f in ('--label','--repository','--branch','--commit','--stage','--next-step','--blocker-category','--owner','--classification','--decision-file')]; p.add_argument('--pr',type=int); argv=sys.argv[1:]; split=argv.index('--') if '--' in argv else len(argv); a=p.parse_args(argv[:split]); a.command=argv[split+1:]; c=config(a.config); c=overrides(c,a)
    if a.mode=='hook':
        try: hook(c,json.loads(sys.stdin.read(65537)))
        except Exception: pass
        return
    if a.mode=='flush': flush(c); return
    if a.mode=='worker':
        while True: flush(c); time.sleep(2)
    run=a.run_id or str(uuid.uuid4()); task=a.task_id or run
    if a.mode=='event':
        metadata={key:getattr(a,name) for key,name in [('stage','stage'),('nextStep','next_step'),('blockerCategory','blocker_category'),('owner','owner'),('classification','classification')] if getattr(a,name) is not None}
        if a.decision_file:metadata['decision']=json.loads(pathlib.Path(a.decision_file).read_text())
        enqueue(c,a.kind,run,task,a.summary,operating=metadata); flush(c); return
    command=a.command[1:] if a.command[:1]==['--'] else a.command
    if not command: p.error('runner requires command after --')
    enqueue(c,'task.start',run,task,'Runner started'); proc=subprocess.Popen(command); interrupted=False
    try:
        while proc.poll() is None:
            enqueue(c,'heartbeat',run,task,'Runner active; long tools may be in progress'); flush(c)
            try: proc.wait(timeout=15)
            except subprocess.TimeoutExpired: pass
    except KeyboardInterrupt:
        interrupted=True; proc.terminate(); enqueue(c,'task.interrupted',run,task,'Runner interrupted')
    if not interrupted: enqueue(c,'task.progress' if proc.returncode==0 else 'task.failed',run,task,'Process exited; exit zero is not task completion' if proc.returncode==0 else 'Runner process failed')
    flush(c)
if __name__=='__main__': main()
