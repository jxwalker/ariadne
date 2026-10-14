"""Signed outbound-only command spool. Conflicts require explicit reconciliation.
No automatic rebasing, generation substitution or execution of work packet actions.
"""
import hashlib, hmac, json, pathlib, time, urllib.request, uuid, fcntl
from activity_sender import persist


def enqueue(directory, command):
    directory=pathlib.Path(directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    key=command['idempotencyKey']
    path=directory/(hashlib.sha256(key.encode()).hexdigest()+'.json')
    with open(directory/'.enqueue-lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        if path.exists():
            if json.loads(path.read_text())!=command:raise ValueError('idempotency payload conflict')
            return path
        if len(list(directory.glob('*.json')))>=100:raise ValueError('command spool full')
        persist(path,command)
    return path


def send(config, command):
    raw=json.dumps(command,sort_keys=True,separators=(',',':')).encode()
    path='/api/agent/v1/commands';ts=str(int(time.time()));nonce=str(uuid.uuid4());cap=config['capabilityId']
    envelope=(ts+'\n'+nonce+'\n'+cap+'\nPOST\n'+path+'\n').encode()+raw
    sig=hmac.new(config['secret'].encode(),envelope,hashlib.sha256).hexdigest()
    if not config['origin'].startswith('https://'):raise ValueError('HTTPS required')
    req=urllib.request.Request(config['origin'].rstrip('/')+path,data=raw,headers={'Content-Type':'application/json','X-Ariadne-Capability':cap,'X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig})
    with urllib.request.urlopen(req,timeout=5) as response:return json.loads(response.read())


def flush(config, transport=send):
    directory=pathlib.Path(config['spool']);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    with open(directory/'.flush-lock','a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return
        for path in sorted(directory.glob('*.json'),key=lambda p:(p.stat().st_mtime_ns,p.name)):
            command=json.loads(path.read_text())
            try:result=transport(config,command)
            except Exception:return
            persist(directory/(path.name+'.receipt'),result)
            if not result.get('ok'):return # keep rejected command and current state for operator/client reconciliation
            path.unlink()
