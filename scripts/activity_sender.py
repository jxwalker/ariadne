#!/usr/bin/env python3
"""Bounded local spool and authenticated HTTPS delivery. Hooks never perform network IO."""
import argparse, fcntl, hashlib, hmac, json, os, pathlib, subprocess, sys, time, urllib.error, urllib.request, uuid
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

def flush(c):
    spool=pathlib.Path(c['spool']); spool.mkdir(parents=True,exist_ok=True,mode=0o700)
    with open(spool/'.delivery-lock','a') as lock:
        try: fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError: return
        state=spool/'.retry'; retry=json.loads(state.read_text()) if state.exists() else {'at':0,'attempt':0}
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
                receipt=deliver(c,p.read_bytes()); p.unlink(); retry={'at':0,'attempt':0}
                (spool/'.last-receipt').write_text(json.dumps(receipt))
                if receipt.get('operatorDecisions'):
                    replies=spool/'.operator-decisions.json.state'
                    known=json.loads(replies.read_text()) if replies.exists() else {}
                    for reply in receipt['operatorDecisions']:
                        known[reply['requestId']+':'+reply['requestRevision']]=reply
                    replies.write_text(json.dumps(dict(list(known.items())[-100:])))
                    replies.chmod(0o600)
            except Exception:
                retry['attempt']=min(retry['attempt']+1,10); retry['at']=time.time()+min(300,2**retry['attempt']); break
        state.write_text(json.dumps(retry))

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
