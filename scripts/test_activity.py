import hashlib,hmac,json,pathlib,tempfile,time,unittest,threading,urllib.request,urllib.error
from activity_server import App,Store,validate,dashboard,canonical,ThreadingHTTPServer,Handler
from activity_sender import enqueue,hook

def event(kind='task.start',seq=0,run='run',parent=None):
    e={'schemaVersion':1,'eventId':f'{run}-{seq}-{kind}','sourceId':'test','agent':{'identity':'integration','product':'controlled test','version':'1'},'project':'ariadne','repository':'jxwalker/ariadne','taskId':'task','runId':run,'sequence':seq,'occurredAt':'2026-10-12T12:00:00Z','kind':kind,'label':'<script>unsafe</script>','summary':'<img src=x onerror=x>'}
    if parent:e['parentRunId']=parent
    return e

class ActivityTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name); self.creds=self.root/'creds'; self.creds.write_text(json.dumps({'test':{'secret':'test-secret','projects':['ariadne'],'repositories':['jxwalker/ariadne']}})); self.creds.chmod(0o600)
        self.app=App({'database':str(self.root/'state.db'),'credentials':str(self.creds),'consoleHtml':str(self.root/'index.html')}); self.store=self.app.store
    def tearDown(self): self.tmp.cleanup()
    def accept(self,e): validate(e); return self.store.accept(e,canonical(e).encode())
    def headers(self,raw,ts=None,nonce='nonce'):
        ts=str(ts or int(time.time())); return {'X-Ariadne-Source':'test','X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':hmac.new(b'test-secret',ts.encode()+b'\n'+nonce.encode()+b'\n'+raw,hashlib.sha256).hexdigest()}
    def test_signature_scope_rotation_replay(self):
        e=event(); raw=canonical(e).encode(); headers=self.headers(raw); self.app.authenticate(headers,raw,e)
        with self.assertRaises(PermissionError): self.app.authenticate(headers,raw+b' ',e)
        with self.assertRaises(PermissionError): self.app.authenticate(self.headers(raw,ts=int(time.time())-301),raw,e)
        e['repository']='jxwalker/private'; raw2=canonical(e).encode()
        with self.assertRaises(PermissionError):self.app.authenticate(self.headers(raw2,nonce='new'),raw2,e)
        e['repository']='jxwalker/ariadne'
        with self.assertRaises(PermissionError):self.app.authenticate(self.headers(raw2),raw2,e)
        self.creds.write_text('{}')
        with self.assertRaises(PermissionError):self.app.authenticate(headers,raw,e)
    def test_duplicate_and_conflict(self):
        e=event(); at,dup=self.accept(e); self.assertFalse(dup); self.assertEqual(self.accept(e),(at,True)); e['summary']='different'
        with self.assertRaises(ValueError): self.accept(e)
    def test_out_of_order_terminal_parent(self):
        self.accept(event()); self.accept(event('task.completed',3)); self.accept(event('task.progress',2)); self.accept(event('task.start',4)); self.accept(event('subagent.start',0,'child','run')); self.accept(event('task.completed',1,'child','run')); self.store.process()
        runs={r['event']['runId']:r for r in self.store.snapshot({})['runs']}; self.assertEqual(runs['run']['state'],'agent-reported completion'); self.assertEqual(runs['child']['state'],'agent-reported completion'); self.assertGreater(runs['run']['sequenceGaps'],0)
    def test_interruption_tool_error_session_end(self):
        self.accept(event()); self.accept(event('task.interrupted',1)); self.accept(event('heartbeat',2)); self.store.process(); self.assertEqual(self.store.snapshot({})['runs'][0]['state'],'interrupted')
        self.accept(event('task.resumed',3)); self.accept(event('task.progress',4)); self.store.process();self.assertEqual(self.store.snapshot({})['runs'][0]['state'],'working')
        self.accept(event('session.end',5)); self.store.process();self.assertEqual(self.store.snapshot({})['runs'][0]['state'],'unknown')
    def test_stale_and_never_connected(self):
        self.accept(event());self.store.process()
        with self.store.connect() as db:db.execute('UPDATE runs SET last=?',(time.time()-100,));db.execute('UPDATE events SET received=?',(time.time()-100,))
        snap=self.store.snapshot({'test':{},'cloud':{}});self.assertEqual(snap['runs'][0]['state'],'stale/unknown');self.assertEqual(snap['sources'][1]['state'],'never-connected')
    def test_validation_and_html(self):
        e=event(); validate(e);self.accept(e);self.store.process();body=dashboard(self.store.snapshot({}));self.assertNotIn('<script>',body);self.assertIn('&lt;script&gt;',body)
        for patch in [{'evidenceLinks':['javascript:alert(1)']},{'evidenceLinks':['https://user:pass@example.com']},{'summary':'a'*501},{'sequence':True},{'path':'/etc/passwd'},{'occurredAt':'2026-10-12'}]:
            with self.assertRaises(ValueError):validate(event()|patch)
    def test_restart_backup_restore(self):
        self.accept(event()); self.store.process();backup=str(self.root/'backup.db');self.store.backup(backup); restored=Store(backup);self.assertEqual(restored.snapshot({})['runs'],self.store.snapshot({})['runs']);self.assertEqual(Store(self.root/'state.db').snapshot({})['runs'],self.store.snapshot({})['runs'])
    def test_webhook_dedupe_reconcile(self):
        e=event()|{'branch':'feature'};self.accept(e);raw=json.dumps({'repository':{'full_name':'jxwalker/ariadne'},'pull_request':{'number':1,'head':{'ref':'feature'},'state':'open','html_url':'https://github.com/jxwalker/ariadne/pull/1'}}).encode();self.assertFalse(self.store.webhook('delivery','pull_request',raw));self.assertTrue(self.store.webhook('delivery','pull_request',raw));self.store.process();self.assertEqual(self.store.snapshot({})['runs'][0]['github'][0]['kind'],'pull_request')
        with self.assertRaises(ValueError):self.store.webhook('delivery','pull_request',b'{}')
    def test_hooks_spool_privacy_and_parent(self):
        c={'spool':str(self.root/'spool'),'sourceId':'test','agent':event()['agent'],'project':'ariadne','repository':'jxwalker/ariadne','workspace':str(self.root)}
        hook(c,{'hook_event_name':'Stop','session_id':'session','cwd':str(self.root),'prompt':'SECRET','tool_input':{'command':'secret'}})
        e=json.loads(next((self.root/'spool').glob('*.json')).read_text()); self.assertNotIn('SECRET',canonical(e));self.assertEqual(e['kind'],'task.progress');self.assertIn('completion unknown',e['summary'])
        hook(c,{'hook_event_name':'SubagentStop','session_id':'session','agent_id':'child','cwd':str(self.root)});ev=[json.loads(p.read_text()) for p in (self.root/'spool').glob('*.json')];self.assertEqual(next(x for x in ev if x['runId']=='child')['parentRunId'],'session')
    def test_sequence_identity_rate_and_public_read_boundaries(self):
        self.accept(event()); e=event()|{'eventId':'other'}
        with self.assertRaises(ValueError): self.accept(e)
        with self.assertRaises(ValueError): self.accept(event('heartbeat',1)|{'taskId':'different-task'})
        e=event();raw=canonical(e).encode()
        for i in range(120): self.app.authenticate(self.headers(raw,nonce='rate-'+str(i)),raw,e)
        with self.assertRaises(OverflowError): self.app.authenticate(self.headers(raw,nonce='excess'),raw,e)
        replacement=App(self.app.config)
        with self.assertRaises(OverflowError): replacement.authenticate(self.headers(raw,nonce='restart'),raw,e)
    def test_old_gh_pagination_and_task_scoped_reconciliation(self):
        from unittest.mock import patch
        from activity_reconcile import pages,reconcile
        with patch('activity_reconcile.subprocess.run') as run:
            run.return_value.stdout='[1,2]\n[3]'
            self.assertEqual(pages('test'),[[1,2],[3]])
            self.assertNotIn('--slurp',run.call_args.args[0])
        self.accept(event()|{'branch':'feature'});self.store.process()
        pr={'number':7,'state':'open','head':{'ref':'feature','sha':'a'*40}}
        unrelated={'number':8,'state':'open','head':{'ref':'other','sha':'b'*40}}
        with patch('activity_reconcile.pages',side_effect=[[[pr,unrelated]],[[{'state':'APPROVED'}]],[{'check_runs':[{'conclusion':'success'}]}]]) as paginate:
            reconcile(self.store,['jxwalker/ariadne']);self.assertEqual(paginate.call_count,3)
        snap=self.store.snapshot({}); self.assertEqual(snap['health'][0]['status'],'success');self.assertTrue(any('APPROVED'==x['state'] for x in snap['runs'][0]['github']))
    def test_registered_session_correlation(self):
        a=event()|{'sessionId':'session'};self.accept(a)
        b=event('task.progress',1,'native')|{'sourceId':'native','sessionId':'session'};self.accept(b);self.store.process()
        registry={'test':{'correlationHost':'approved-host','provenance':'read-only local snapshot'},'native':{'correlationHost':'approved-host'}}
        merged=self.store.snapshot(registry)['runs'];self.assertEqual(len(merged),1);self.assertEqual(merged[0]['event']['sourceId'],'native');self.assertEqual(len(merged[0]['timeline']),2)
        self.assertEqual(len(self.store.snapshot({})['runs']),2)
    def test_snapshot_metadata_privacy_and_operator_binding(self):
        import sys
        from unittest.mock import patch
        from activity_snapshot_import import main
        snapshots=self.root/'snapshots';snapshots.mkdir();session='test-session';run=hashlib.sha256(('approved-host\n'+session).encode()).hexdigest()[:32]
        (snapshots/'host.json').write_text(json.dumps({'host':'approved-host','status':'available','collectedAt':__import__('activity_server').now(),'sessions':[{'id':session,'agent':'Codex','repository':'jxwalker/ariadne','lastEventAt':__import__('activity_server').now(),'event':'task_started','status':'working','task':'SECRET PROMPT','update':'SECRET OUTPUT','lastTool':'Read'}]}))
        config=self.app.config|{'snapshotDirectory':str(snapshots),'snapshotSources':{'approved-host':'test'},'githubRepositories':['jxwalker/ariadne'],'snapshotRunRefs':{run:{'branch':'verified-branch','pr':157}}};file=self.root/'server.json';file.write_text(json.dumps(config))
        with patch.object(sys,'argv',['import','--config',str(file)]):main()
        projection=self.store.snapshot({})['runs'][0]['event'];self.assertNotIn('SECRET',canonical(projection));self.assertEqual(projection['branch'],'verified-branch');self.assertEqual(projection['pr'],157)
    def test_http_boundaries(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.app=self.app;thread=threading.Thread(target=server.serve_forever);thread.start();base=f'http://127.0.0.1:{server.server_port}'
        try:
            raw=canonical(event()).encode();req=urllib.request.Request(base+'/ingest/v1/events',data=raw,headers=self.headers(raw)|{'Content-Type':'application/json'})
            with urllib.request.urlopen(req) as r:self.assertEqual(r.status,202)
            with urllib.request.urlopen(req) as r:self.assertEqual(r.status,200)
            with self.assertRaises(urllib.error.HTTPError) as ex:urllib.request.urlopen(urllib.request.Request(base+'/ingest/v1/events',data=b'x'*65537,headers={'Content-Type':'application/json'}))
            self.assertEqual(ex.exception.code,413)
            with self.assertRaises(urllib.error.HTTPError) as ex:urllib.request.urlopen(urllib.request.Request(base+'/ingest/v1/events',data=b'{}',headers={'Content-Type':'application/json'}))
            self.assertEqual(ex.exception.code,400)
            secret=self.root/'github';secret.write_text('github-secret');self.app.config.update({'githubSecretFile':str(secret),'githubRepositories':['jxwalker/ariadne']});payload=b'{"repository":{"full_name":"jxwalker/ariadne"}}';signature='sha256='+hmac.new(b'github-secret',payload,hashlib.sha256).hexdigest();headers={'Content-Type':'application/json','X-GitHub-Delivery':'github-delivery','X-GitHub-Event':'push','X-Hub-Signature-256':signature}
            with urllib.request.urlopen(urllib.request.Request(base+'/ingest/v1/github',data=payload,headers=headers)) as r:self.assertEqual(r.status,202)
            with self.assertRaises(urllib.error.HTTPError) as ex:urllib.request.urlopen(urllib.request.Request(base+'/ingest/v1/github',data=payload+b' ',headers=headers))
            self.assertEqual(ex.exception.code,401)
            self.app.config['ingestOnly']=True
            for route in ['/','/readyz','/healthz','/api/activity']:
                with self.assertRaises(urllib.error.HTTPError) as ex: urllib.request.urlopen(base+route)
                self.assertEqual(ex.exception.code,404)
        finally:server.shutdown();thread.join();server.server_close()
if __name__=='__main__':unittest.main()
