#!/usr/bin/env python3
"""Private durable activity ingestion. Python 3.11+; no third-party dependencies."""
import argparse, hashlib, hmac, json, os, pathlib, re, signal, sqlite3, threading, time, weakref
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs

KINDS = {'task.start','task.progress','heartbeat','task.blocked','task.resumed','task.interrupted','task.completed','task.failed','session.start','session.end','subagent.start','subagent.end'}
OPERATING_KINDS = KINDS | {'decision.requested','decision.resolved'}
OPERATING_FIELDS = {'stage','nextStep','blockerCategory','owner','decision','classification'}
TERMINAL = {'agent-reported completion','agent-reported failure'}
FIELDS = {'schemaVersion','eventId','sourceId','agent','project','repository','taskId','runId','parentRunId','sequence','occurredAt','kind','label','summary','location','branch','commit','pr','evidenceLinks','sessionId'}
ID = re.compile(r'^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$')
REPO = re.compile(r'^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$')
MAX_BODY = 65536

def now(): return datetime.now(timezone.utc).isoformat()
def stamp(value):
    if not isinstance(value,str) or len(value)>64: raise ValueError('invalid timestamp')
    d=datetime.fromisoformat(value.replace('Z','+00:00'))
    if d.tzinfo is None: raise ValueError('timestamp requires timezone')
    return d.timestamp()
def bounded(value, limit):
    return isinstance(value,str) and 0<len(value)<=limit and not any(ord(c)<32 and c not in '\n\t' for c in value)
def safe_link(value):
    if not bounded(value,2048): return False
    u=urlsplit(value)
    sensitive={'token','access_token','auth','authorization','password','secret','key','api_key','apikey','signature','credential'}
    if any(k.lower() in sensitive or k.lower().startswith('x-amz-') for k in parse_qs(u.query)): return False
    if re.search(r'(?:access_token|password|secret|api_key)=',u.fragment,re.I): return False
    return u.scheme=='https' and bool(u.hostname) and not u.username and not u.password and not any(c.isspace() for c in value)
def validate(e):
    required={'schemaVersion','eventId','sourceId','agent','project','repository','taskId','runId','sequence','occurredAt','kind','label','summary'}
    if not isinstance(e,dict) or not required<=e.keys(): raise ValueError('unknown or missing fields')
    version=e['schemaVersion']
    if type(version) is not int or version not in {1,2} or e['kind'] not in (KINDS if version==1 else OPERATING_KINDS): raise ValueError('unsupported version/kind')
    if e.keys()-(FIELDS if version==1 else FIELDS|OPERATING_FIELDS): raise ValueError('unknown fields')
    if version==2:
        for k,limit in [('stage',80),('nextStep',300),('owner',128)]:
            if k in e and not bounded(e[k],limit): raise ValueError('invalid operating metadata')
        if 'classification' in e and e['classification'] not in {'work','test'}: raise ValueError('invalid classification')
        if 'blockerCategory' in e and e['blockerCategory'] not in {'decision','ci','review','dependency','access','network','capacity','telemetry','other'}: raise ValueError('invalid blocker category')
        if e['kind'].startswith('decision.'):
            d=e.get('decision');allowed={'id','recipient','question','options','recommendation','blocking','url','resolution'}
            required_decision={'id','recipient','question','blocking'} if e['kind']=='decision.requested' else {'id','recipient','resolution'}
            if not isinstance(d,dict) or not required_decision<=d.keys() or d.keys()-allowed: raise ValueError('invalid decision')
            if not isinstance(d['id'],str) or not ID.fullmatch(d['id']) or not bounded(d['recipient'],128): raise ValueError('invalid decision identity')
            for k,limit in [('question',500),('recommendation',300),('resolution',300)]:
                if k in d and not bounded(d[k],limit): raise ValueError('invalid decision text')
            if 'blocking' in d and type(d['blocking']) is not bool: raise ValueError('invalid blocking flag')
            if 'options' in d and (not isinstance(d['options'],list) or not 1<=len(d['options'])<=5 or not all(bounded(v,160) for v in d['options'])): raise ValueError('invalid decision options')
            if 'url' in d and not safe_link(d['url']): raise ValueError('unsafe decision link')
        elif 'decision' in e: raise ValueError('decision requires decision lifecycle kind')
    for k in ['eventId','sourceId','taskId','runId','project']:
        if not isinstance(e[k],str) or not ID.fullmatch(e[k]): raise ValueError('invalid identity')
    for k in ['parentRunId','sessionId']:
        if k in e and (not isinstance(e[k],str) or not ID.fullmatch(e[k])): raise ValueError('invalid run correlation')
    if e.get('parentRunId')==e['runId']: raise ValueError('self-parent')
    if not isinstance(e['repository'],str) or not REPO.fullmatch(e['repository']): raise ValueError('invalid repository')
    if type(e['sequence']) is not int or not 0<=e['sequence']<2**53: raise ValueError('invalid sequence')
    if not bounded(e['label'],160) or not isinstance(e['summary'],str) or len(e['summary'])>500: raise ValueError('invalid text')
    if not isinstance(e['agent'],dict) or set(e['agent'])!={'identity','product','version'} or not all(bounded(v,128) for v in e['agent'].values()): raise ValueError('invalid agent')
    if 'location' in e and (not isinstance(e['location'],dict) or set(e['location'])-{'kind','name'} or e['location'].get('kind') not in {'machine','cloud'} or not bounded(e['location'].get('name'),128)): raise ValueError('invalid location')
    if 'branch' in e and not bounded(e['branch'],250): raise ValueError('invalid branch')
    if 'commit' in e and (not isinstance(e['commit'],str) or not re.fullmatch('[a-fA-F0-9]{40}',e['commit'])): raise ValueError('invalid commit')
    if 'pr' in e and (type(e['pr']) is not int or e['pr']<1): raise ValueError('invalid PR')
    if 'evidenceLinks' in e and (not isinstance(e['evidenceLinks'],list) or len(e['evidenceLinks'])>10 or not all(safe_link(v) for v in e['evidenceLinks'])): raise ValueError('unsafe link')
    stamp(e['occurredAt'])
    return e

def canonical(e): return json.dumps(e,sort_keys=True,separators=(',',':'),ensure_ascii=False)

class ClosingConnection(sqlite3.Connection):
    def __exit__(self,*args):
        try: return super().__exit__(*args)
        finally: self.close()

class Store:
    def __init__(self,path):
        self.path=str(path); pathlib.Path(path).parent.mkdir(parents=True,exist_ok=True)
        # Keep WAL open between requests: closing the last connection checkpoints it,
        # making unrelated producers compete with repeated checkpoint/DDL work.
        self._keeper=sqlite3.connect(self.path,timeout=30,check_same_thread=False)
        self._finalize=weakref.finalize(self,self._keeper.close)
        self._keeper.execute('PRAGMA synchronous=FULL')
        if self._keeper.execute('PRAGMA journal_mode').fetchone()[0]!='wal':
            self._keeper.execute('PRAGMA journal_mode=WAL')
        if self._keeper.execute('PRAGMA user_version').fetchone()[0]<3:
            db=self._keeper
            db.executescript('''
            BEGIN IMMEDIATE;
            CREATE TABLE IF NOT EXISTS rates(source TEXT, minute INTEGER, requests INTEGER, PRIMARY KEY(source,minute));
            CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
            INSERT OR IGNORE INTO migrations VALUES(1);
            INSERT OR IGNORE INTO migrations VALUES(2);
            CREATE TABLE IF NOT EXISTS observation_history(id TEXT PRIMARY KEY, observed REAL, body TEXT);
            CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, source TEXT, received REAL, received_at TEXT, raw BLOB, envelope TEXT, processed INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS runs(source TEXT, run TEXT, task TEXT, seq INTEGER, state TEXT, last REAL, envelope TEXT, gaps INTEGER DEFAULT 0, PRIMARY KEY(source,run));
            CREATE TABLE IF NOT EXISTS webhooks(id TEXT PRIMARY KEY, kind TEXT, received REAL, raw BLOB, processed INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS observations(id TEXT PRIMARY KEY, repo TEXT, observed REAL, body TEXT);
            CREATE INDEX IF NOT EXISTS observation_repo ON observations(repo);
            CREATE TABLE IF NOT EXISTS health(name TEXT PRIMARY KEY, at REAL, status TEXT, detail TEXT);
            CREATE TABLE IF NOT EXISTS nonces(source TEXT, nonce TEXT, digest TEXT, at REAL, PRIMARY KEY(source,nonce));
            CREATE INDEX IF NOT EXISTS events_run_sequence ON events(source,json_extract(envelope,'$.runId'),json_extract(envelope,'$.sequence'));
            CREATE INDEX IF NOT EXISTS events_received ON events(received);
            CREATE INDEX IF NOT EXISTS events_source_received ON events(source,received);
            CREATE INDEX IF NOT EXISTS events_pending ON events(processed,received,id);
            CREATE INDEX IF NOT EXISTS webhooks_pending ON webhooks(processed,received);
            CREATE INDEX IF NOT EXISTS observations_observed ON observations(observed);
            CREATE INDEX IF NOT EXISTS runs_last ON runs(last);
            INSERT OR IGNORE INTO migrations VALUES(3);
            PRAGMA user_version=3;
            COMMIT;
            ''')
        if self._keeper.execute('PRAGMA user_version').fetchone()[0]<4:
            self._keeper.executescript("""
            BEGIN IMMEDIATE;
            CREATE INDEX IF NOT EXISTS events_decision_lifecycle ON events(
                source,json_extract(envelope,'$.repository'),json_extract(envelope,'$.decision.id'),
                json_extract(envelope,'$.runId'),json_extract(envelope,'$.sequence') DESC,received DESC,id DESC)
                WHERE json_extract(envelope,'$.kind') IN ('decision.requested','decision.resolved');
            INSERT OR IGNORE INTO migrations VALUES(4);
            PRAGMA user_version=4;
            COMMIT;
            """)
        os.chmod(self.path,0o600)
    def close(self):
        self._finalize()
    def connect(self):
        db=sqlite3.connect(self.path,timeout=30,factory=ClosingConnection); db.row_factory=sqlite3.Row
        db.execute('PRAGMA synchronous=FULL'); return db
    def ready(self):
        # No projections, row scans, write transactions or schema creation on probes.
        uri=pathlib.Path(self.path).resolve().as_uri()+'?mode=ro'
        with sqlite3.connect(uri,uri=True,timeout=0.25,factory=ClosingConnection) as db:
            db.execute('SELECT version FROM migrations ORDER BY version DESC LIMIT 1').fetchone()
            db.execute('SELECT id FROM events LIMIT 1').fetchone()
        return True
    def accept(self,e,raw):
        received=now()
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            old=db.execute('SELECT envelope,received_at FROM events WHERE id=?',(e['eventId'],)).fetchone()
            if old:
                if old['envelope']!=canonical(e): raise ValueError('event ID conflict')
                return old['received_at'],True
            prior=db.execute('SELECT envelope FROM events WHERE source=? AND json_extract(envelope,\'$.runId\')=? LIMIT 1',(e['sourceId'],e['runId'])).fetchone()
            if prior:
                p=json.loads(prior['envelope'])
                if any(p.get(k)!=e.get(k) for k in ['taskId','repository','project','parentRunId','agent']): raise ValueError('run identity conflict')
            seqrow=db.execute("SELECT envelope FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? AND json_extract(envelope,'$.sequence')=?",(e['sourceId'],e['runId'],e['sequence'])).fetchone()
            if seqrow: raise ValueError('producer sequence conflict')
            db.execute('INSERT INTO events(id,source,received,received_at,raw,envelope) VALUES(?,?,?,?,?,?)',(e['eventId'],e['sourceId'],time.time(),received,raw,canonical(e)))
        return received,False
    def webhook(self,delivery,kind,raw):
        with self.connect() as db:
            old=db.execute('SELECT raw FROM webhooks WHERE id=?',(delivery,)).fetchone()
            if old:
                if bytes(old['raw'])!=raw: raise ValueError('delivery ID conflict')
                return True
            db.execute('INSERT INTO webhooks(id,kind,received,raw) VALUES(?,?,?,?)',(delivery,kind,time.time(),raw))
        return False
    def process(self):
        with self.connect() as db:
            pending=db.execute('SELECT 1 FROM events WHERE processed=0 LIMIT 1').fetchone() or db.execute('SELECT 1 FROM webhooks WHERE processed=0 LIMIT 1').fetchone()
        if not pending:return
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            for row in db.execute('SELECT * FROM events WHERE processed=0 ORDER BY received,id LIMIT 200').fetchall():
                e=json.loads(row['envelope']); old=db.execute('SELECT * FROM runs WHERE source=? AND run=?',(e['sourceId'],e['runId'])).fetchone()
                if not old or e['sequence']>old['seq']:
                    state=old['state'] if old else 'unknown'; gaps=(old['gaps'] if old else 0)+ (max(0,e['sequence']-old['seq']-1) if old else 0)
                    if state not in TERMINAL:
                        state={'task.start':'working','task.progress':'working','task.resumed':'working','task.blocked':'blocked','task.interrupted':'interrupted','task.completed':'agent-reported completion','task.failed':'agent-reported failure','session.end':'unknown','subagent.end':'unknown'}.get(e['kind'],state)
                    db.execute('INSERT OR REPLACE INTO runs VALUES(?,?,?,?,?,?,?,?)',(e['sourceId'],e['runId'],e['taskId'],e['sequence'],state,row['received'],row['envelope'],gaps))
                db.execute('UPDATE events SET processed=1 WHERE id=?',(row['id'],))
            for row in db.execute('SELECT * FROM webhooks WHERE processed=0 ORDER BY received LIMIT 100').fetchall():
                body=json.loads(row['raw']); repo=body.get('repository',{}).get('full_name')
                if repo:
                    db.execute('INSERT OR REPLACE INTO observations VALUES(?,?,?,?)',('webhook:'+row['id'],repo,row['received'],canonical({'kind':row['kind'],'body':body})))
                db.execute('UPDATE webhooks SET processed=1 WHERE id=?',(row['id'],))
    def snapshot(self,sources):
        t=time.time()
        with self.connect() as db:
            events=db.execute('SELECT source,MAX(received) AS last FROM events GROUP BY source').fetchall(); last={r['source']:r['last'] for r in events}
            runs=[]
            for h in db.execute("SELECT * FROM health WHERE name LIKE 'snapshot:%'"):
                last[h['name'].removeprefix('snapshot:')]=h['at']
            for r in db.execute('SELECT * FROM runs ORDER BY last DESC LIMIT 500'):
                e=json.loads(r['envelope']); state=r['state']
                if state=='working' and t-r['last']>90: state='stale/unknown'
                evidence=[]
                text_fields="COALESCE(json_extract(body,'$.body.pull_request.body'),'') || char(10) || COALESCE(json_extract(body,'$.body.issue.body'),'') || char(10) || COALESCE(json_extract(body,'$.body.comment.body'),'')"
                match_fields=[("$.body.pull_request.number",e.get('pr')),("$.body.number",e.get('pr')),("$.body.pull_request.head.ref",e.get('branch')),("$.body.ref",'refs/heads/'+e['branch'] if e.get('branch') else None),("$.body.pull_request.head.sha",e.get('commit')),("$.body.after",e.get('commit')),("$.body.head_sha",e.get('commit')),("$.body.workflow_run.head_sha",e.get('commit')),("$.body.check_run.head_sha",e.get('commit')),("$.body.check_suite.head_sha",e.get('commit'))]
                predicates=["json_extract(body,?)=?" for _ in match_fields]
                params=[value for pair in match_fields for value in pair]
                predicates += ["instr("+text_fields+",?)>0","instr("+text_fields+",?)>0"]
                params += ['Ariadne-Task: '+e['taskId'],'Ariadne-Run: '+e['runId']]
                query='SELECT * FROM observations WHERE repo=? AND ('+' OR '.join(predicates)+') ORDER BY observed DESC LIMIT 200'
                # Limit display AFTER repository/reference filtering, never truncate the repository sample.
                for o in db.execute(query,[e['repository']]+params):
                    obs=json.loads(o['body']); b=obs.get('body',{}); pr=b.get('pull_request',{}); branch=pr.get('head',{}).get('ref') or b.get('ref','').removeprefix('refs/heads/'); sha=pr.get('head',{}).get('sha') or b.get('after') or b.get('head_sha') or b.get('workflow_run',{}).get('head_sha') or b.get('check_run',{}).get('head_sha') or b.get('check_suite',{}).get('head_sha')
                    explicit_text='\n'.join(str(x) for x in [pr.get('body',''),b.get('issue',{}).get('body',''),b.get('comment',{}).get('body','')])
                    explicit=(re.search(r'(?m)^Ariadne-Task: '+re.escape(e['taskId'])+r'\s*$',explicit_text) is not None or re.search(r'(?m)^Ariadne-Run: '+re.escape(e['runId'])+r'\s*$',explicit_text) is not None)
                    if explicit or (e.get('pr') and e['pr']==(pr.get('number') or b.get('number'))) or (e.get('branch') and e['branch']==branch) or (e.get('commit') and e['commit']==sha):
                        observed_state=pr.get('state') or b.get('state') or b.get('workflow_run',{}).get('conclusion') or b.get('check_run',{}).get('conclusion')
                        if obs['kind'] in {'pull_request_review','check_run'} and 'pages' in b:
                            records=[x for page in b['pages'] for x in (page if isinstance(page,list) else page.get('check_runs',[]))]
                            observed_state='; '.join(str(x.get('state') or x.get('conclusion') or x.get('status')) for x in records) or ('no reviews' if obs['kind']=='pull_request_review' else 'no checks')
                        evidence.append({'kind':obs['kind'],'observedAt':o['observed'],'association':'repository/branch/commit/PR reference; not agent authorship','state':observed_state,'url':pr.get('html_url') if safe_link(pr.get('html_url')) else None})
                timeline=[{'eventId':x['id'],'receivedAt':x['received_at'],'kind':json.loads(x['envelope'])['kind'],'sequence':json.loads(x['envelope'])['sequence']} for x in db.execute("SELECT * FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? ORDER BY received DESC LIMIT 30",(r['source'],r['run']))]
                runs.append({'event':e,'state':state,'lastReceipt':r['last'],'sequenceGaps':r['gaps'],'delivery':'accepted; agent report','github':evidence,'timeline':timeline})
            grouped={}; uncorrelated=[]
            for r in runs:
                e=r['event']; registration=sources.get(e['sourceId'],{}); host=registration.get('correlationHost')
                if not host or not e.get('sessionId'): uncorrelated.append(r);continue
                # Known display names for the same CLI; retain the original envelope.
                product=e['agent']['product'].lower()
                product={'claude code':'claude','codex cli':'codex'}.get(product,product)
                key=(host,e['repository'],product,e['sessionId'])
                previous=grouped.get(key)
                if not previous: grouped[key]=r;r['correlatedSourceIds']=[e['sourceId']];continue
                previous_registration=sources.get(previous['event']['sourceId'],{})
                # Native event evidence wins over read-only snapshots; server-approved host mapping only.
                native=registration.get('provenance')!='read-only local snapshot'
                previous_native=previous_registration.get('provenance')!='read-only local snapshot'
                winner=r if (native and not previous_native) or (native==previous_native and r['lastReceipt']>previous['lastReceipt']) else previous
                winner['correlatedSourceIds']=list(set(previous.get('correlatedSourceIds',[])+[e['sourceId']]))
                winner['timeline']=sorted(previous['timeline']+r['timeline'],key=lambda x:x['receivedAt'],reverse=True)[:30]
                grouped[key]=winner
            runs=uncorrelated+list(grouped.values())
            return {'generatedAt':now(),'runs':runs,'sources':[{'sourceId':s,'name':v.get('correlationHost',s), 'activity': 'unknown' if s not in last or t-last[s]>90 else 'actively working' if any(r['event']['sourceId']==s and r['state']=='working' for r in runs) else 'blocked' if any(r['event']['sourceId']==s and r['state']=='blocked' for r in runs) else 'idle/no active report', 'state':'revoked' if v.get('revoked') else 'never-connected' if s not in last else 'connected' if t-last[s]<=90 else 'stale','lastReceipt':last.get(s)} for s,v in sources.items()], 'queueBacklog':db.execute('SELECT (SELECT COUNT(*) FROM events WHERE processed=0)+(SELECT COUNT(*) FROM webhooks WHERE processed=0)').fetchone()[0], 'health':[dict(r) for r in db.execute('SELECT * FROM health')]}
    def backup(self,target):
        with self.connect() as db, sqlite3.connect(target,factory=ClosingConnection) as out: db.backup(out)
        os.chmod(target,0o600)

class App:
    def __init__(self,config):
        self.config=config; self.store=Store(config['database']); self.stop=threading.Event(); self.rates={}
        self.operating_cache={};self.operating_lock=threading.Lock()
    def sources(self):
        # Reload protected credentials on every request for immediate revocation/rotation.
        p=pathlib.Path(self.config['credentials'])
        if p.stat().st_mode & 0o077: raise ValueError('credentials must be mode 0600')
        return json.loads(p.read_text())
    def authenticate(self,headers,raw,e):
        s=headers.get('X-Ariadne-Source',''); source=self.sources().get(s)
        if not source or source.get('revoked') or s!=e['sourceId']: raise PermissionError('source unauthorized')
        ts=headers.get('X-Ariadne-Timestamp',''); nonce=headers.get('X-Ariadne-Nonce','')
        if not re.fullmatch(r'\d{10}',ts) or abs(time.time()-int(ts))>300 or not ID.fullmatch(nonce): raise PermissionError('invalid signature time/nonce')
        expected=hmac.new(source['secret'].encode(),ts.encode()+b'\n'+nonce.encode()+b'\n'+raw,hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected,headers.get('X-Ariadne-Signature','')): raise PermissionError('invalid signature')
        if source['secret'].encode() in raw: raise PermissionError('credential in event metadata')
        if e['project'] not in source['projects'] or e['repository'] not in source['repositories']: raise PermissionError('repository/project unauthorized')
        # Nonces are bound to a request digest and retained durably; retry identical bodies is safe.
        with self.store.connect() as db:
            db.execute('BEGIN IMMEDIATE'); db.execute('DELETE FROM nonces WHERE at<?',(time.time()-600,))
            minute=int(time.time()/60);db.execute('DELETE FROM rates WHERE minute<?',(minute-1,))
            rate=db.execute('SELECT requests FROM rates WHERE source=? AND minute=?',(s,minute)).fetchone()
            if rate and rate[0]>=120: raise OverflowError('rate limited')
            db.execute('INSERT INTO rates VALUES(?,?,1) ON CONFLICT(source,minute) DO UPDATE SET requests=requests+1',(s,minute))
            row=db.execute('SELECT digest FROM nonces WHERE source=? AND nonce=?',(s,nonce)).fetchone(); digest=hashlib.sha256(raw).hexdigest()
            if row and row[0]!=digest: raise PermissionError('nonce replay conflict')
            db.execute('INSERT OR IGNORE INTO nonces VALUES(?,?,?,?)',(s,nonce,digest,time.time()))
    def work(self):
        next_alert=0
        while not self.stop.wait(0.5):
            try:
                self.store.process()
                if not self.config.get('ingestOnly') and time.time()>=next_alert:
                    next_alert=time.time()+60
                    from activity_alerts import evaluate
                    evaluate(self.store,self.sources(),self.config)
            except Exception as exc: print('processor failure:',type(exc).__name__,flush=True)

class Handler(BaseHTTPRequestHandler):
    server_version='AriadneActivity/1'
    def log_message(self,fmt,*args): pass  # bodies/auth never logged
    def reply(self,status,obj):
        raw=canonical(obj).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(raw)
    def operator_peer(self):
        from activity_decisions import kernel_peer_uid
        return {'ip':self.client_address[0],'proxyUid':kernel_peer_uid(self.connection)}
    def do_POST(self):
        try:
            if self.path=='/api/agent/v1/commands':
                from agent_commands import handle
                if self.headers.get('Transfer-Encoding') or not self.headers.get('Content-Length'):return self.reply(411,{'error':'content length required'})
                n=int(self.headers['Content-Length'])
                if not 0<n<=32768:return self.reply(413,{'error':'body too large'})
                if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.reply(415,{'error':'JSON required'})
                self.connection.settimeout(5)
                raw=self.rfile.read(n)
                if len(raw)!=n:raise ValueError('truncated body')
                request=json.loads(raw)
                if not isinstance(request,dict) or request.get('op')=='packet':raise ValueError('invalid command')
                result=handle(self.server.app,self.headers,raw,'POST',self.path,request)
                error=result.get('error')
                status=200 if result.get('ok') else 403 if error in {'work scope denied','operation denied'} else 400 if error in {'patch denied','idempotency key required'} else 409
                return self.reply(status,result)
            if self.path=='/api/operator-response':
                if self.server.app.config.get('disableQueries') or self.server.app.config.get('ingestOnly'):return self.reply(404,{'error':'route not found'})
                from activity_decisions import controller, StaleDecision
                if self.headers.get('Transfer-Encoding') or not self.headers.get('Content-Length'):return self.reply(411,{'error':'content length required'})
                n=int(self.headers['Content-Length'])
                if not 0<n<=4096:return self.reply(413,{'error':'body too large'})
                if self.headers.get('Content-Type','').split(';')[0]!='application/json':return self.reply(415,{'error':'JSON required'})
                self.connection.settimeout(5)
                raw=self.rfile.read(n)
                if len(raw)!=n:raise ValueError('truncated body')
                try:return self.reply(200,controller(self.server.app).answer(self.headers,self.operator_peer(),json.loads(raw)))
                except StaleDecision as exc:return self.reply(409,{'error':str(exc)})
                except PermissionError as exc:return self.reply(401,{'error':str(exc)})
                except ValueError as exc:return self.reply(400,{'error':str(exc)})
                except RuntimeError:return self.reply(503,{'error':'Operator ledger unavailable; response was not confirmed'})
            if self.path not in {'/ingest/v1/events','/ingest/v1/github'}: return self.reply(404,{'error':'route not found'})
            self.connection.settimeout(5)
            if self.headers.get('Transfer-Encoding') or not self.headers.get('Content-Length'): return self.reply(411,{'error':'content length required'})
            n=int(self.headers['Content-Length'])
            if not 0<n<=MAX_BODY: return self.reply(413,{'error':'body too large'})
            if self.headers.get('Content-Type','').split(';')[0]!='application/json': return self.reply(415,{'error':'JSON required'})
            raw=self.rfile.read(n)
            if len(raw)!=n: raise ValueError('truncated body')
            body=json.loads(raw)
            if self.path.endswith('/events'):
                e=validate(body); self.server.app.authenticate(self.headers,raw,e); received,duplicate=self.server.app.store.accept(e,raw)
                receipt={'eventId':e['eventId'],'receivedAt':received,'duplicate':duplicate}
                if self.server.app.config.get('operatorActions',{}).get('enabled'):
                    try:
                        from activity_decisions import controller
                        receipt['operatorDecisions']=controller(self.server.app).replies(e)
                    except Exception:pass  # Ledger availability never rejects a signed observation.
                return self.reply(200 if duplicate else 202,receipt)
            secret=self.server.app.config.get('githubSecretFile')
            if not secret: raise PermissionError('GitHub onboarding pending')
            expected='sha256='+hmac.new(pathlib.Path(secret).read_bytes().strip(),raw,hashlib.sha256).hexdigest()
            if not hmac.compare_digest(expected,self.headers.get('X-Hub-Signature-256','')): raise PermissionError('invalid GitHub signature')
            delivery=self.headers.get('X-GitHub-Delivery',''); kind=self.headers.get('X-GitHub-Event','')
            if not ID.fullmatch(delivery) or kind not in {'push','pull_request','pull_request_review','workflow_run','check_run','check_suite','issues','issue_comment','ping'}: raise ValueError('unsupported delivery')
            if kind!='ping' and body.get('repository',{}).get('full_name') not in self.server.app.config.get('githubRepositories',[]): raise PermissionError('repository unauthorized')
            duplicate=self.server.app.store.webhook(delivery,kind,raw); self.reply(200 if duplicate else 202,{'deliveryId':delivery,'duplicate':duplicate})
        except PermissionError: self.reply(401,{'error':'unauthorized'})
        except OverflowError: self.reply(429,{'error':'rate limited'})
        except (ValueError,TypeError,KeyError): self.reply(400,{'error':'invalid or conflicting event'})
        except Exception: self.reply(503,{'error':'unavailable'})
    def do_GET(self):
        if self.path.startswith('/api/agent/v1/work/'):
            from agent_commands import handle
            try:
                route=urlsplit(self.path);filters=parse_qs(route.query,strict_parsing=True)
                if set(filters)!={'repository','nativeKind','nativeId'} or any(len(v)!=1 for v in filters.values()):raise ValueError('invalid scope')
                request={'op':'packet','target':route.path.removeprefix('/api/agent/v1/work/'),'repository':filters['repository'][0],'nativeKind':filters['nativeKind'][0],'nativeId':filters['nativeId'][0]}
                result=handle(self.server.app,self.headers,b'','GET',self.path,request)
                return self.reply(200 if result.get('ok') else 403,result)
            except PermissionError:return self.reply(401,{'error':'unauthorized'})
            except ValueError:return self.reply(400,{'error':'invalid packet request'})
            except Exception:return self.reply(503,{'error':'agent ledger unavailable'})
        if self.server.app.config.get('ingestOnly'): return self.reply(404,{'error':'route not found'})
        if self.path=='/assets/activity-dashboard.js':
            raw=pathlib.Path(__file__).with_name('operating_dashboard.js').read_bytes()
            self.send_response(200);self.send_header('Content-Type','application/javascript; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('X-Content-Type-Options','nosniff');self.end_headers();self.wfile.write(raw);return
        if self.path=='/assets/ariadne-logo-square.png':
            logo=self.server.app.config.get('logoFile')
            if logo and pathlib.Path(logo).is_file():
                raw=pathlib.Path(logo).read_bytes();self.send_response(200);self.send_header('Content-Type','image/png');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw);return
            return self.reply(404,{'error':'logo unavailable'})
        if self.path=='/favicon.ico':
            self.send_response(204);self.send_header('Content-Length','0');self.end_headers();return
        if self.path=='/healthz': return self.reply(200,{'status':'alive'})
        if self.path=='/readyz':
            try: self.server.app.sources(); self.server.app.store.ready(); return self.reply(200,{'status':'ready'})
            except Exception: return self.reply(503,{'status':'unavailable'})
        # On private listener only. It MUST be behind a tailnet HTTPS proxy; never expose this listener publicly.
        route=urlsplit(self.path)
        if route.path=='/api/operator-session':
            try:
                from activity_decisions import controller
                return self.reply(200,controller(self.server.app).session(self.headers,self.operator_peer()))
            except Exception:return self.reply(503,{'error':'Operator ledger unavailable'})
        if len(route.query)>2048: return self.reply(400,{'error':'query too long'})
        try: filters=parse_qs(route.query,max_num_fields=20)
        except ValueError:return self.reply(400,{'error':'too many query fields'})
        if route.path in {'/roadmaps','/work','/api/master'}:
            from master_dashboard import snapshot,render,api_page,unbound_activity
            try:
                data=snapshot()
                if route.path=='/api/master':
                    try:return self.reply(200,api_page(data,filters))
                    except ValueError:return self.reply(400,{'error':'invalid master filter'})
                try:data['unboundActivity']=unbound_activity(self.server.app.store,data.get('workBindings',[]),self.server.app.sources())
                except Exception:data['unboundActivity']=None
                try:raw=render(data,route.path,filters).encode()
                except ValueError:return self.reply(400,{'error':'invalid master filter'})
                self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8');self.send_header('Content-Length',str(len(raw)));self.send_header('Cache-Control','no-store');self.send_header('X-Content-Type-Options','nosniff');self.send_header('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");self.end_headers();self.wfile.write(raw);return
            except (BrokenPipeError,ConnectionResetError):return
            except Exception:return self.reply(503,{'error':'ledger unavailable'})
        if route.path in {'/api/activity','/api/insights','/api/runs','/api/sources','/api/controls','/api/alerts','/api/operating'}:
            from activity_insights import project,page_runs,sources_view
            try:
                registry=self.server.app.sources()
                if route.path=='/api/operating':
                    from activity_operating import operating
                    app=self.server.app;key=(filters.get('range',['7d'])[0],filters.get('repo',[''])[0],hashlib.sha256(canonical(registry).encode()).hexdigest())
                    with app.operating_lock:
                        cached=app.operating_cache.get(key)
                        if cached is None or time.time()-cached[0]>10:
                            data=operating(app.store,registry,app.config,filters)
                            if len(app.operating_cache)>20:app.operating_cache.clear()
                            app.operating_cache[key]=(time.time(),data)
                        else:data=cached[1]
                    if app.config.get('operatorActions',{}).get('enabled'):
                        try:
                            from activity_decisions import hide_answered
                            from activity_decisions import resolved_decisions
                            data=hide_answered(data,resolved_decisions())
                        except Exception:pass  # Keep operational evidence visible when the ledger is unavailable.
                    return self.reply(200,data)
                from activity_controls import controls
                if route.path=='/api/alerts':
                    from activity_alerts import evaluate
                    return self.reply(200,evaluate(self.server.app.store,registry,self.server.app.config))
                if route.path=='/api/controls':return self.reply(200,controls(self.server.app.store,registry,self.server.app.config.get('controlEvidenceDirs',[])))
                if route.path=='/api/sources':return self.reply(200,{'sources':sources_view(self.server.app.store,registry,time.time())})
                data=project(self.server.app.store,registry,filters.get('range',['24h'])[0])
                if route.path=='/api/runs':return self.reply(200,page_runs(data,filters))
                control_data=controls(self.server.app.store,registry,self.server.app.config.get('controlEvidenceDirs',[]))
                data['insights'].extend(c['message'] for c in control_data['callouts'])
                data['filters']={key:sorted({r[key] for r in data['runs']}) for key in ['repo','agent','machine','source','state']}
                data['sourceLabels']={r['source']:r['sourceName'] for r in data['runs']}
                data.pop('runs')
                # Legacy API now uses the same prompt-free, metadata-only contract.
                return self.reply(200,data)
            except (BrokenPipeError,ConnectionResetError):return  # Tab closed during a metadata poll.
            except ValueError:return self.reply(400,{'error':'invalid query'})
            except Exception:return self.reply(503,{'error':'insights unavailable'})
        if route.path not in {'/','/scorpion-labs/console/'}: return self.reply(404,{'error':'route not found'})
        # One canonical operating surface; legacy generated console stays on disk for rollback.
        body='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ariadne · Operations</title></head><body>'+dashboard({})+'</body></html>'
        body=body.replace('</head>', '<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 32 32%22%3E%3Ctext y=%2226%22 font-size=%2228%22%3EA%3C/text%3E%3C/svg%3E"></head>')
        raw=body.encode(); self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'"); self.end_headers(); self.wfile.write(raw)

def dashboard(data):
    return pathlib.Path(__file__).with_name('operating_dashboard.html').read_text()

def main():
    parser=argparse.ArgumentParser(); parser.add_argument('--config',required=True); parser.add_argument('--backup'); a=parser.parse_args()
    config=json.loads(pathlib.Path(a.config).read_text()); app=App(config)
    if a.backup: app.store.backup(a.backup); return
    host=config.get('bind','127.0.0.1')
    if host!='127.0.0.1': raise ValueError('bind must remain loopback; TLS proxy required')
    server=ThreadingHTTPServer((host,config.get('port',18095)),Handler); server.app=app; server.daemon_threads=True
    worker=threading.Thread(target=app.work); worker.start()
    def stop(*_): app.stop.set(); threading.Thread(target=server.shutdown).start()
    signal.signal(signal.SIGTERM,stop); signal.signal(signal.SIGINT,stop)
    try: server.serve_forever()
    finally: app.stop.set(); worker.join(); server.server_close(); app.store.close()
if __name__=='__main__': main()
