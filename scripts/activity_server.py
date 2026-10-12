#!/usr/bin/env python3
"""Private durable activity ingestion. Python 3.11+; no third-party dependencies."""
import argparse, hashlib, hmac, html, json, os, pathlib, re, signal, sqlite3, threading, time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs

KINDS = {'task.start','task.progress','heartbeat','task.blocked','task.resumed','task.interrupted','task.completed','task.failed','session.start','session.end','subagent.start','subagent.end'}
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
    return u.scheme=='https' and bool(u.hostname) and not u.username and not u.password and not any(c.isspace() for c in value)
def validate(e):
    required={'schemaVersion','eventId','sourceId','agent','project','repository','taskId','runId','sequence','occurredAt','kind','label','summary'}
    if not isinstance(e,dict) or not required<=e.keys() or e.keys()-FIELDS: raise ValueError('unknown or missing fields')
    if e['schemaVersion']!=1 or type(e['schemaVersion']) is not int or e['kind'] not in KINDS: raise ValueError('unsupported version/kind')
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
        with self.connect() as db:
            db.executescript('''
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS rates(source TEXT, minute INTEGER, requests INTEGER, PRIMARY KEY(source,minute));
            CREATE TABLE IF NOT EXISTS migrations(version INTEGER PRIMARY KEY);
            INSERT OR IGNORE INTO migrations VALUES(1);
            CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY, source TEXT, received REAL, received_at TEXT, raw BLOB, envelope TEXT, processed INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS runs(source TEXT, run TEXT, task TEXT, seq INTEGER, state TEXT, last REAL, envelope TEXT, gaps INTEGER DEFAULT 0, PRIMARY KEY(source,run));
            CREATE TABLE IF NOT EXISTS webhooks(id TEXT PRIMARY KEY, kind TEXT, received REAL, raw BLOB, processed INTEGER DEFAULT 0);
            CREATE TABLE IF NOT EXISTS observations(id TEXT PRIMARY KEY, repo TEXT, observed REAL, body TEXT);
            CREATE TABLE IF NOT EXISTS health(name TEXT PRIMARY KEY, at REAL, status TEXT, detail TEXT);
            ''')
        os.chmod(self.path,0o600)
    def connect(self):
        db=sqlite3.connect(self.path,timeout=10,factory=ClosingConnection); db.row_factory=sqlite3.Row
        db.execute('PRAGMA synchronous=FULL'); return db
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
                for o in db.execute('SELECT * FROM observations WHERE repo=? ORDER BY observed DESC LIMIT 200',(e['repository'],)):
                    obs=json.loads(o['body']); b=obs.get('body',{}); pr=b.get('pull_request',{}); branch=pr.get('head',{}).get('ref') or b.get('ref','').removeprefix('refs/heads/'); sha=pr.get('head',{}).get('sha') or b.get('after') or b.get('head_sha') or b.get('workflow_run',{}).get('head_sha') or b.get('check_run',{}).get('head_sha') or b.get('check_suite',{}).get('head_sha')
                    explicit_text='\n'.join(str(x) for x in [pr.get('body',''),b.get('issue',{}).get('body',''),b.get('comment',{}).get('body','')])
                    explicit=(re.search(r'(?m)^Ariadne-Task: '+re.escape(e['taskId'])+r'\s*$',explicit_text) is not None or re.search(r'(?m)^Ariadne-Run: '+re.escape(e['runId'])+r'\s*$',explicit_text) is not None)
                    if explicit or (e.get('pr') and e['pr']==(pr.get('number') or b.get('number'))) or (e.get('branch') and e['branch']==branch) or (e.get('commit') and e['commit']==sha):
                        evidence.append({'kind':obs['kind'],'observedAt':o['observed'],'association':'repository/branch/commit/PR reference; not agent authorship','state': ('; '.join(str(x.get('state') or x.get('conclusion') or x.get('status')) for page in b.get('pages',[]) for x in (page if isinstance(page,list) else page.get('check_runs',[]))) if b.get('pages') else None) or pr.get('state') or b.get('state') or b.get('workflow_run',{}).get('conclusion') or b.get('check_run',{}).get('conclusion'),'url':pr.get('html_url') if safe_link(pr.get('html_url')) else None})
                timeline=[{'eventId':x['id'],'receivedAt':x['received_at'],'kind':json.loads(x['envelope'])['kind'],'sequence':json.loads(x['envelope'])['sequence']} for x in db.execute("SELECT * FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? ORDER BY received DESC LIMIT 30",(r['source'],r['run']))]
                runs.append({'event':e,'state':state,'lastReceipt':r['last'],'sequenceGaps':r['gaps'],'delivery':'accepted; agent report','github':evidence,'timeline':timeline})
            grouped={}; uncorrelated=[]
            for r in runs:
                e=r['event']; registration=sources.get(e['sourceId'],{}); host=registration.get('correlationHost')
                if not host or not e.get('sessionId'): uncorrelated.append(r);continue
                key=(host,e['repository'],e['agent']['product'].lower(),e['sessionId'])
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
        if e['project'] not in source['projects'] or e['repository'] not in source['repositories']: raise PermissionError('repository/project unauthorized')
        # Nonces are bound to a request digest and retained durably; retry identical bodies is safe.
        with self.store.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS nonces(source TEXT, nonce TEXT, digest TEXT, at REAL, PRIMARY KEY(source,nonce))')
            db.execute('BEGIN IMMEDIATE'); db.execute('DELETE FROM nonces WHERE at<?',(time.time()-600,))
            minute=int(time.time()/60);db.execute('DELETE FROM rates WHERE minute<?',(minute-1,))
            rate=db.execute('SELECT requests FROM rates WHERE source=? AND minute=?',(s,minute)).fetchone()
            if rate and rate[0]>=120: raise OverflowError('rate limited')
            db.execute('INSERT INTO rates VALUES(?,?,1) ON CONFLICT(source,minute) DO UPDATE SET requests=requests+1',(s,minute))
            row=db.execute('SELECT digest FROM nonces WHERE source=? AND nonce=?',(s,nonce)).fetchone(); digest=hashlib.sha256(raw).hexdigest()
            if row and row[0]!=digest: raise PermissionError('nonce replay conflict')
            db.execute('INSERT OR IGNORE INTO nonces VALUES(?,?,?,?)',(s,nonce,digest,time.time()))
    def work(self):
        while not self.stop.wait(0.5):
            try: self.store.process()
            except Exception as exc: print('processor failure:',type(exc).__name__,flush=True)

class Handler(BaseHTTPRequestHandler):
    server_version='AriadneActivity/1'
    def log_message(self,fmt,*args): pass  # bodies/auth never logged
    def reply(self,status,obj):
        raw=canonical(obj).encode(); self.send_response(status); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.end_headers(); self.wfile.write(raw)
    def do_POST(self):
        try:
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
                return self.reply(200 if duplicate else 202,{'eventId':e['eventId'],'receivedAt':received,'duplicate':duplicate})
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
        if self.server.app.config.get('ingestOnly'): return self.reply(404,{'error':'route not found'})
        if self.path=='/assets/ariadne-logo-square.png' and self.server.app.config.get('logoFile'):
            raw=pathlib.Path(self.server.app.config['logoFile']).read_bytes();self.send_response(200);self.send_header('Content-Type','image/png');self.send_header('Content-Length',str(len(raw)));self.end_headers();self.wfile.write(raw);return
        if self.path=='/healthz': return self.reply(200,{'status':'alive'})
        if self.path=='/readyz':
            try: self.server.app.sources(); self.server.app.store.snapshot({}); return self.reply(200,{'status':'ready'})
            except Exception: return self.reply(503,{'status':'unavailable'})
        # On private listener only. It MUST be behind a tailnet HTTPS proxy; never expose this listener publicly.
        if self.path=='/api/activity': return self.reply(200,self.server.app.store.snapshot(self.server.app.sources()))
        route=urlsplit(self.path)
        if route.path not in {'/','/scorpion-labs/console/'}: return self.reply(404,{'error':'route not found'})
        data=self.server.app.store.snapshot(self.server.app.sources())
        filters=parse_qs(route.query)
        for key in ['repository','sourceId','taskId']:
            if filters.get(key): data['runs']=[r for r in data['runs'] if r['event'].get(key)==filters[key][0]]
        if filters.get('agent'): data['runs']=[r for r in data['runs'] if r['event']['agent']['product']==filters['agent'][0]]
        if filters.get('location'): data['runs']=[r for r in data['runs'] if r['event'].get('location',{}).get('name')==filters['location'][0]]
        p=pathlib.Path(self.server.app.config['consoleHtml'])
        body=p.read_text() if p.exists() else '<html><head><title>Ariadne</title></head><body><h1>Ariadne</h1></body></html>'
        # Legacy task labels can be prompt-derived; suppress those excerpts on the new surface.
        body=re.sub(r'(<div class="repo-work"><strong>.*?</strong>)<p>.*?</p>',r'\1<p>Read-only repository session</p>',body,flags=re.DOTALL)
        body=body.replace('content="30"','content="10"')
        if 'http-equiv="refresh"' not in body: body=body.replace('</head>','<meta http-equiv="refresh" content="10"></head>')
        body=body.replace('<main class="shell">','<main class="shell">'+dashboard(data),1) if '<main class="shell">' in body else body.replace('</body>',dashboard(data)+'</body>')
        raw=body.encode(); self.send_response(200); self.send_header('Content-Type','text/html; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff'); self.send_header('Content-Security-Policy',"default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'"); self.end_headers(); self.wfile.write(raw)

def dashboard(data):
    esc=lambda v:html.escape(str(v),quote=True)
    source_names={s['sourceId']:s.get('name',s['sourceId']) for s in data['sources']}
    health='<h3>Integration health</h3><table><thead><tr><th>Source</th><th>Last collection</th><th>State</th><th>Coverage / next action</th></tr></thead><tbody>'+''.join('<tr><td>'+esc(source_names.get(h['name'].removeprefix('snapshot:'),h['name']))+'</td><td>'+esc(datetime.fromtimestamp(h['at'],timezone.utc).isoformat())+'</td><td>'+esc(h['status'])+'</td><td>'+esc(h['detail'])+'</td></tr>' for h in data['health'])+'</tbody></table>'
    rows=[]
    for r in data['runs']:
        e=r['event']; evidence='; '.join(esc(x['kind']+': '+str(x['state'])) for x in r['github']) or 'No matching independent GitHub evidence'
        timeline=' '.join(esc(x['kind']+' #'+str(x['sequence'])) for x in reversed(r['timeline']))
        links=' '.join('<a rel="noreferrer" href="'+esc(x)+'">Evidence link</a>' for x in e.get('evidenceLinks',[]) if safe_link(x))
        rows.append('<tr>'+''.join('<td>'+v+'</td>' for v in [esc(e['repository']),esc(e['agent']['product']+' / '+source_names.get(e['sourceId'],e['sourceId'])),esc(e['label'])+'<br>'+esc(e['summary']),esc(r['state']),esc(e['branch'] if 'branch' in e else 'unassociated'),esc(datetime.fromtimestamp(r['lastReceipt'],timezone.utc).isoformat()),esc(e['taskId']+' / '+e['runId'])+'<br>'+esc(r['delivery'])+'<br>Correlated sources: '+esc(', '.join(r.get('correlatedSourceIds',[])))+'<br>Sequence gaps: '+esc(r['sequenceGaps']),evidence+'<br>'+timeline+'<br>'+links])+'</tr>')
    return '<section id="durable-activity" style="padding:24px;overflow:auto"><h2>Durable agent activity</h2><form method="get"><label>Repository <input name="repository"></label> <label>Agent <input name="agent"></label> <label>Machine / cloud <input name="location"></label> <label>Source ID <input name="sourceId"></label> <label>Task <input name="taskId"></label> <button>Filter</button></form><p>Accepted private reports; completion never grants delivery approval. Refresh at most every 10 seconds.</p><p>'+esc(data['generatedAt'])+' · Queue backlog '+esc(data['queueBacklog'])+'</p><p>'+ ' · '.join(esc(s.get('name',s['sourceId'])+': '+s['state']+' / '+s.get('activity','unknown')) for s in data['sources'])+'</p><table><thead><tr>'+''.join('<th>'+s+'</th>' for s in ['Repository','Agent / source','Task / progress','Agent-reported state','Branch','Last accepted heartbeat/event','Task / run / receipt','Independent evidence / timeline'])+'</tr></thead><tbody>'+''.join(rows)+'</tbody></table>'+health+'</section>'

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
    finally: app.stop.set(); worker.join(); server.server_close()
if __name__=='__main__': main()
