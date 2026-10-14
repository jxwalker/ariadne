"""Separate signed agent transport. No observation credentials or operator sessions.
Key refs resolve through a separately enrolled, protected file; no secrets in SQL.
"""
import hashlib, hmac, json, os, pathlib, re, stat, subprocess, time
ID = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$')


def query(config, sql):
    # Explicit configuration only: never silently fall back to the operator/live DB.
    db = config['database']
    if db['user'] != 'ariadne_agent_transport' or not db['socket'].startswith('/'):
        raise RuntimeError('agent transport configuration unavailable')
    p = subprocess.run([config.get('psql', '/usr/lib/postgresql/17/bin/psql'), '-XqAt', '-v', 'ON_ERROR_STOP=1',
                        '-h', db['socket'], '-p', str(db['port']), '-U', db['user'], '-d', db['name']],
                       input=sql, text=True, capture_output=True, timeout=15,
                       env={'PATH': os.defpath, 'PGPASSFILE': '/dev/null'})
    if p.returncode:
        raise RuntimeError('agent ledger unavailable')
    return json.loads(p.stdout)


def handle(app, headers, raw, method, path, request):
    config = app.config.get('agentCommands', {})
    if not config.get('enabled'):
        raise PermissionError('agent enrollment unavailable')
    cap = headers.get('X-Ariadne-Capability', '')
    ts = headers.get('X-Ariadne-Timestamp', '')
    nonce = headers.get('X-Ariadne-Nonce', '')
    if not ID.fullmatch(cap) or not ID.fullmatch(nonce) or not re.fullmatch(r'\d{10}', ts) or abs(time.time()-int(ts)) > 300:
        raise PermissionError('invalid signature')
    keys_path = pathlib.Path(config['keyRegistry'])
    fd = os.open(keys_path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd) as registry:
        metadata = os.fstat(registry.fileno())
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_uid != os.geteuid() or metadata.st_mode & 0o077:
            raise RuntimeError('unprotected agent keys')
        enrollment = json.load(registry).get(cap)
    if not isinstance(enrollment, dict) or not isinstance(enrollment.get('secret'), str) or not enrollment['secret'] or not isinstance(enrollment.get('keyRef'), str):
        raise PermissionError('unknown capability')
    # Bind method and exact route as well as bytes to prevent GET/POST substitution.
    signed = ts.encode()+b'\n'+nonce.encode()+b'\n'+method.encode()+b'\n'+path.encode()+b'\n'+raw
    signature = hmac.new(enrollment['secret'].encode(), signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, headers.get('X-Ariadne-Signature', '')):
        raise PermissionError('invalid signature')
    def contains_secret(value):
        if isinstance(value, str): return enrollment['secret'] in value
        if isinstance(value, dict): return any(contains_secret(k) or contains_secret(v) for k, v in value.items())
        if isinstance(value, list): return any(contains_secret(v) for v in value)
        return False
    if contains_secret(request) or enrollment['secret'].encode() in raw:
        raise PermissionError('credential in payload')
    if set(request) - {'op','target','repository','nativeKind','nativeId','expectedRevision','generation','idempotencyKey','reason','patch','state'}:
        raise ValueError('unsupported command fields')
    for value in [request.get('reason'), *request.get('patch', {}).values()] if isinstance(request.get('patch', {}), dict) else []:
        if value is not None and (not isinstance(value, str) or len(value)>500):
            raise ValueError('bounded operational text required')
    def literal(value):
        # Hex has no SQL metacharacters, independent of server string settings.
        return "convert_from(decode('"+value.encode('utf-8').hex()+"','hex'),'UTF8')"
    # Key reference equality is checked inside the transaction, avoiding enrollment drift.
    request = dict(request, keyRef=enrollment['keyRef'])
    return query(config, 'SELECT master.agent_request('+literal(cap)+','+literal(nonce)+','+literal(json.dumps(request))+'::jsonb);')
