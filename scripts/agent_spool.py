"""Signed outbound-only command spool. Conflicts require explicit reconciliation.
No automatic rebasing, generation substitution or execution of work packet actions.
"""
import hashlib, hmac, json, pathlib, time, urllib.request, urllib.error, uuid, fcntl, sys
from activity_sender import persist


def enqueue(directory, command):
    directory=pathlib.Path(directory);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    key=command['idempotencyKey']
    digest=hashlib.sha256(key.encode()).hexdigest()
    with open(directory/'.enqueue-lock','a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        matches=list(directory.glob('*-'+digest+'.json'))
        if matches:
            path=matches[0]
            if json.loads(path.read_text())!=command:raise ValueError('idempotency payload conflict')
            return path
        if len(list(directory.glob('*.json')))+len(list(directory.glob('*.receipt')))>=100:raise ValueError('command spool full; archive retained receipts explicitly')
        sequence=directory/'.sequence'
        number=int(sequence.read_text())+1 if sequence.exists() else 1
        persist(sequence,number)
        path=directory/(str(number).zfill(20)+'-'+digest+'.json')
        persist(path,command)
    return path


def send(config, command):
    raw=json.dumps(command,sort_keys=True,separators=(',',':')).encode()
    path='/api/agent/v1/commands';ts=str(int(time.time()));nonce=str(uuid.uuid4());cap=config['capabilityId']
    envelope=(ts+'\n'+nonce+'\n'+cap+'\nPOST\n'+path+'\n').encode()+raw
    sig=hmac.new(config['secret'].encode(),envelope,hashlib.sha256).hexdigest()
    if not config['origin'].startswith('https://'):raise ValueError('HTTPS required')
    req=urllib.request.Request(config['origin'].rstrip('/')+path,data=raw,headers={'Content-Type':'application/json','X-Ariadne-Capability':cap,'X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig})
    try:
        with urllib.request.urlopen(req,timeout=5) as response:return json.loads(response.read(65537))
    except urllib.error.HTTPError as error:
        try:
            if error.code not in (400,403,409):raise
            return json.loads(error.read(65537))
        finally:error.close()


def flush(config, transport=send):
    directory=pathlib.Path(config['spool']);directory.mkdir(parents=True,exist_ok=True,mode=0o700)
    with open(directory/'.flush-lock','a') as lock:
        try:fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
        except BlockingIOError:return
        for path in sorted(directory.glob('*.json')):
            receipt_path=directory/(path.name+'.receipt')
            if receipt_path.exists() and not json.loads(receipt_path.read_text()).get('ok'):return
            try:
                command=json.loads(path.read_text())
                if not isinstance(command,dict):return
            except (OSError,ValueError):return
            try:result=transport(config,command)
            except Exception:
                print('Ariadne agent spool: transport unavailable; commands retained',file=sys.stderr)
                return
            if not isinstance(result,dict):return
            if result.get('error') in {'request rate exceeded','invalid nonce','signature replay'}:
                print('Ariadne agent spool: retryable transport rejection; commands retained',file=sys.stderr)
                return
            persist(receipt_path,result)
            if not result.get('ok'):return # keep rejected command and current state for operator/client reconciliation
            path.unlink()
