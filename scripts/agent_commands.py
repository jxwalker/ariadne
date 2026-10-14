"""Separate signed agent transport. No observation credentials or operator sessions.
Key refs resolve through a separately enrolled, protected file; no secrets in SQL.
"""
import hashlib, hmac, json, os, pathlib, re, subprocess, time
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
    if keys_path.stat().st_mode & 0o077:
        raise RuntimeError('unprotected agent keys')
    enrollment = json.loads(keys_path.read_text()).get(cap)
    if not enrollment:
        raise PermissionError('unknown capability')
    # Bind method and exact route as well as bytes to prevent GET/POST substitution.
    signed = ts.encode()+b'\n'+nonce.encode()+b'\n'+method.encode()+b'\n'+path.encode()+b'\n'+raw
    signature = hmac.new(enrollment['secret'].encode(), signed, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, headers.get('X-Ariadne-Signature', '')):
        raise PermissionError('invalid signature')
    def literal(value):
        return "'"+value.replace("'", "''")+"'"
    # Key reference equality is checked inside the transaction, avoiding enrollment drift.
    request = dict(request, keyRef=enrollment['keyRef'])
    return query(config, 'SELECT master.agent_request('+literal(cap)+','+literal(nonce)+','+literal(json.dumps(request))+'::jsonb);')
