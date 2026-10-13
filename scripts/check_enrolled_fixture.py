#!/usr/bin/env python3
"""Seed an isolated loopback server with enrolled-bot fixture runs (benign + credential-bearing) for browser checks."""
import json, os, pathlib, sys, tempfile, time, uuid
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from activity_server import App, canonical, validate, main as serve
KNOWN='9f'*32
LEAKS=[KNOWN,'ghp_'+'A1b2'*9,'sk-proj-'+'x9'*20,'xoxb-123456789012-abcdefABCDEF','AKIAIOSFODNN7EXAMPLE']
root=pathlib.Path(tempfile.mkdtemp(prefix='enrol-check-')); creds=root/'creds.json'
creds.write_text(json.dumps({'fixture-bot':{'secret':KNOWN,'projects':['ariadne'],'repositories':['jxwalker/ariadne'],'displayName':'Fixture bot','displayTaskMetadata':True},'fixture-plain':{'secret':'p'*64,'projects':['ariadne'],'repositories':['jxwalker/ariadne']}})); creds.chmod(0o600)
cfg={'database':str(root/'state.db'),'credentials':str(creds),'consoleHtml':str(root/'index.html'),'bind':'127.0.0.1','port':int(sys.argv[1]) if len(sys.argv)>1 else 18102}
(root/'index.html').write_text('<!doctype html><html><head><title>fixture</title></head><body></body></html>')
app=App(cfg); store=app.store
def ev(source,run,seq,kind,label,summary):
    e={'schemaVersion':1,'eventId':str(uuid.uuid4()),'sourceId':source,'agent':{'identity':'fixture','product':'Grok Bot','version':'1'},'project':'ariadne','repository':'jxwalker/ariadne','taskId':run,'runId':run,'sequence':seq,'occurredAt':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'kind':kind,'label':label,'summary':summary,'location':{'kind':'cloud','name':'fixture-box'}}
    validate(e); store.accept(e,canonical(e).encode())
ev('fixture-bot','benign-run',0,'task.start','Fix login form','start'); ev('fixture-bot','benign-run',1,'task.progress','Fix login form','Tests passing; opening PR next')
ev('fixture-bot','blocked-run',0,'task.start','Upgrade CI image','start'); ev('fixture-bot','blocked-run',1,'task.blocked','Upgrade CI image','Waiting on CI runner')
for i,l in enumerate(LEAKS): ev('fixture-bot',f'leak-{i}',0,'task.start',f'Deploy {l}',f'used {l}')
ev('fixture-plain','plain-run',0,'task.start','UNENROLLED TITLE','UNENROLLED NOTE')
store.process(); store.close()
(root/'config.json').write_text(json.dumps(cfg)); print(json.dumps({'config':str(root/'config.json'),'leaks':LEAKS}),flush=True)
sys.argv=['activity_server.py','--config',str(root/'config.json')]; serve()
