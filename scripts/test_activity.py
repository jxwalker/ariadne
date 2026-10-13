import hashlib,hmac,json,pathlib,tempfile,time,unittest,threading,urllib.request,urllib.error
from activity_server import App,Store,validate,dashboard,canonical,ThreadingHTTPServer,Handler
from activity_sender import enqueue,hook,flush,overrides
from unittest.mock import patch
import os

def event(kind='task.start',seq=0,run='run',parent=None):
    e={'schemaVersion':1,'eventId':f'{run}-{seq}-{kind}','sourceId':'test','agent':{'identity':'integration','product':'controlled test','version':'1'},'project':'ariadne','repository':'jxwalker/ariadne','taskId':'task','runId':run,'sequence':seq,'occurredAt':'2026-10-12T12:00:00Z','kind':kind,'label':'<script>unsafe</script>','summary':'<img src=x onerror=x>'}
    if parent:e['parentRunId']=parent
    return e

class ActivityTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name); self.creds=self.root/'creds'; self.creds.write_text(json.dumps({'test':{'secret':'test-secret','projects':['ariadne'],'repositories':['jxwalker/ariadne']}})); self.creds.chmod(0o600)
        self.app=App({'database':str(self.root/'state.db'),'credentials':str(self.creds),'consoleHtml':str(self.root/'index.html')}); self.store=self.app.store
    def tearDown(self): self.store.close(); self.tmp.cleanup()
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
        leaked=e|{'summary':'test-secret'};leaked_raw=canonical(leaked).encode()
        with self.assertRaises(PermissionError):self.app.authenticate(self.headers(leaked_raw,nonce='credential-leak'),leaked_raw,leaked)
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
        e=event(); validate(e);self.accept(e);self.store.process();body=dashboard(self.store.snapshot({}));self.assertNotIn('<script>',body);self.assertNotIn('unsafe',body)
        for patch in [{'evidenceLinks':['javascript:alert(1)']},{'evidenceLinks':['https://user:pass@example.com']},{'evidenceLinks':['https://example.com/?access_token=secret']},{'evidenceLinks':['https://example.com/?X-Amz-Signature=signed']},{'summary':'a'*501},{'sequence':True},{'path':'/etc/passwd'},{'occurredAt':'2026-10-12'}]:
            with self.assertRaises(ValueError):validate(event()|patch)
    def test_restart_backup_restore(self):
        self.accept(event()); self.store.process();backup=str(self.root/'backup.db');self.store.backup(backup); restored=Store(backup);self.assertEqual(restored.snapshot({})['runs'],self.store.snapshot({})['runs']);self.assertEqual(Store(self.root/'state.db').snapshot({})['runs'],self.store.snapshot({})['runs'])
    def test_webhook_dedupe_reconcile(self):
        e=event()|{'branch':'feature'};self.accept(e);raw=json.dumps({'repository':{'full_name':'jxwalker/ariadne'},'pull_request':{'number':1,'head':{'ref':'feature'},'state':'open','html_url':'https://github.com/jxwalker/ariadne/pull/1'}}).encode();self.assertFalse(self.store.webhook('delivery','pull_request',raw));self.assertTrue(self.store.webhook('delivery','pull_request',raw));self.store.process();self.assertEqual(self.store.snapshot({})['runs'][0]['github'][0]['kind'],'pull_request')
        with self.assertRaises(ValueError):self.store.webhook('delivery','pull_request',b'{}')
    def test_sender_timestamp_ties_preserve_lifecycle_order(self):
        c={'spool':str(self.root/'spool'),'sourceId':'test','agent':event()['agent'],'project':'ariadne','repository':'jxwalker/ariadne'}
        enqueue(c,'task.start','run','task');enqueue(c,'heartbeat','run','task')
        spool=pathlib.Path(c['spool'])
        # Reverse directory/name order and tie timestamps, as on the live VM.
        files=list(spool.glob('*.json'))
        for p in files:
            e=json.loads(p.read_text());p.rename(spool/('z.json' if e['sequence']==0 else 'a.json'))
        for p in spool.glob('*.json'):os.utime(p,(1,1))
        delivered=[]
        def deliver(config,raw):
            e=json.loads(raw);delivered.append(e['sequence']);self.accept(e);return {'accepted':True}
        with patch('activity_sender.deliver',side_effect=deliver):flush(c)
        self.store.process()
        self.assertEqual(delivered,[0,1]);self.assertEqual(self.store.snapshot({})['runs'][0]['state'],'working')

    def test_empty_review_pages_do_not_inherit_pr_open_state(self):
        self.accept(event()|{'pr':7});self.store.process()
        body={'kind':'pull_request_review','body':{'pull_request':{'number':7,'state':'open','html_url':'https://github.com/jxwalker/ariadne/pull/7'},'pages':[[]]}}
        with self.store.connect() as db:db.execute('INSERT INTO observations VALUES(?,?,?,?)',('reviews','jxwalker/ariadne',time.time(),canonical(body)))
        self.assertEqual(self.store.snapshot({})['runs'][0]['github'][0]['state'],'no reviews')

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
        a=event()|{'sessionId':'session','agent':event()['agent']|{'product':'Claude'}};self.accept(a)
        b=event('task.progress',1,'native')|{'sourceId':'native','sessionId':'session','agent':event()['agent']|{'product':'Claude Code'}};self.accept(b);self.store.process()
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
    def test_reference_match_before_display_limit_and_history(self):
        self.accept(event()|{'branch':'feature'});self.store.process()
        with self.store.connect() as db:
            db.execute('INSERT INTO observations VALUES(?,?,?,?)',('match','jxwalker/ariadne',0,canonical({'kind':'pull_request','body':{'pull_request':{'number':1,'head':{'ref':'feature'},'state':'open'}}})))
            for i in range(250): db.execute('INSERT INTO observations VALUES(?,?,?,?)',(str(i),'jxwalker/ariadne',time.time(),canonical({'kind':'pull_request','body':{'pull_request':{'number':i+2,'head':{'ref':'unrelated'},'state':'closed'}}})))
        self.assertEqual(len(self.store.snapshot({})['runs'][0]['github']),1)
        from unittest.mock import patch
        from activity_reconcile import reconcile
        pr={'number':1,'state':'open','head':{'ref':'unmatched','sha':'a'*40}}
        with patch('activity_reconcile.pages',return_value=[[pr]]): reconcile(self.store,['jxwalker/ariadne'])
        pr['state']='closed'
        with patch('activity_reconcile.pages',return_value=[[pr]]): reconcile(self.store,['jxwalker/ariadne'])
        with self.store.connect() as db: self.assertEqual(db.execute('SELECT count(*) FROM observation_history').fetchone()[0],2)
    def fixture_run(self, run, times, kinds, source='test', product='Codex'):
        for seq,(received,kind) in enumerate(zip(times,kinds)):
            self.accept(event(kind,seq,run)|{'sourceId':source,'agent':event()['agent']|{'product':product},'sessionId':run,'location':{'kind':'machine','name':'Fixture host'}})
            with self.store.connect() as db:db.execute('UPDATE events SET received=? WHERE id=?',(received,f'{run}-{seq}-{kind}'))
        self.store.process()

    def test_insights_deterministic_aggregates_and_privacy(self):
        from activity_insights import project,page_runs
        self.fixture_run('success',[100000,100060],['task.start','task.completed'])
        self.fixture_run('failure',[100000,100300],['task.start','task.failed'],product='Claude Code')
        self.fixture_run('interrupt',[100100,100200],['task.start','task.interrupted'])
        self.fixture_run('snapshot',[100000,100300],['task.start','task.progress'],source='snapshot')
        d=project(self.store,{'snapshot':{'provenance':'read-only local snapshot'}},'24h',100320)
        m=d['metrics'];self.assertEqual(m['runs'],3);self.assertEqual(m['snapshotRuns'],1)
        self.assertEqual(m['medianSeconds'],180);self.assertEqual(m['p90Seconds'],276)
        self.assertAlmostEqual(m['activeHours'],460/3600);self.assertEqual(m['events'],8)
        self.assertEqual(m['rates']['success'],1/3);self.assertEqual(m['outcomes']['unknown/interrupted'],1)
        self.assertEqual(sum(map(sum,d['heatmap'])),3);self.assertEqual(sum(d['histogram']['counts']),2)
        self.assertNotIn('unsafe',canonical(d));self.assertNotIn('onerror',canonical(d));self.assertNotIn('summary',canonical(d));self.assertNotIn('test-secret',canonical(d))
        page=page_runs(d,{'pageSize':['1'],'agent':['Codex'],'stale':['show']})
        self.assertEqual(page['total'],2);self.assertEqual(len(page['runs']),1)
        with self.assertRaises(ValueError):project(self.store,{},'all',100320)
        with self.assertRaises(ValueError):page_runs(d,{'page':['bad']})

    def test_sender_overrides_respect_configured_repository_scope(self):
        import argparse
        c={'repository':'jxwalker/a','repositories':['jxwalker/a','jxwalker/b']}
        a=argparse.Namespace(repository='jxwalker/b',label='Fix login',branch='x',commit=None,pr=12)
        o=overrides(c,a);self.assertEqual((o['repository'],o['label'],o['branch'],o['pr']),('jxwalker/b','Fix login','x',12));self.assertNotIn('commit',o);self.assertEqual(c['repository'],'jxwalker/a')
        with self.assertRaises(ValueError):overrides(c,argparse.Namespace(repository='jxwalker/c',label=None,branch=None,commit=None,pr=None))

    def test_enrolled_source_task_metadata_is_opt_in_and_separate(self):
        from activity_insights import project
        for run,last,note in [('enrolled','task.progress','Tests passing; opening PR next'),('blocked','task.blocked','Waiting on CI runner')]:
            for seq,kind in enumerate(['task.start',last]):
                self.accept(event(kind,seq,run)|{'label':'Fix login form','summary':note,'sessionId':run,'location':{'kind':'cloud','name':'box'}})
        self.store.process()
        plain=project(self.store,{},'24h')
        self.assertTrue(all('title' not in r and 'note' not in r for r in plain['runs']))
        d=project(self.store,{'test':{'displayTaskMetadata':True}},'24h')
        runs={r['id']:r for r in d['runs']}
        self.assertEqual(runs['enrolled']['title'],'Fix login form')
        self.assertEqual(runs['enrolled']['note'],'Tests passing; opening PR next');self.assertIsNone(runs['enrolled']['blocker'])
        self.assertEqual(runs['blocked']['blocker'],'Waiting on CI runner');self.assertIsNone(runs['blocked']['note'])
        self.assertEqual(runs['enrolled']['claim'],'agent-reported');self.assertIn('github',runs['enrolled'])
        named=project(self.store,{'test':{'displayTaskMetadata':True,'displayName':'Ariadne Bot (box)'}},'24h')
        self.assertTrue(all(r['sourceName']=='Ariadne Bot (box)' and r['title'] for r in named['runs']))
        snap=project(self.store,{'test':{'displayTaskMetadata':True,'provenance':'read-only local snapshot'}},'24h')
        self.assertTrue(all('title' not in r for r in snap['runs']))
        xss=project(self.store,{'test':{'displayTaskMetadata':True}},'24h')
        self.assertNotIn('onerror',canonical(xss))

    def test_enrolled_metadata_redacts_secrets_across_insights_and_runs(self):
        from activity_insights import project,page_runs
        known='9f'*32; leaks=[known,'ghp_'+'A1b2'*9,'github_pat_11ABCDEFG0123456789_abcdefghijklmnopqrstuvwxyz','sk-proj-'+'x9'*20,'xoxb-123456789012-abcdefABCDEF','AKIAIOSFODNN7EXAMPLE','eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2ln','Bearer abc.def']
        for i,leak in enumerate(leaks):
            run=f'leak{i}'
            for seq,(kind,label,summary) in enumerate([('task.start',f'Deploy {leak}','start'),('task.progress','Deploy',f'used {leak} for push')]):
                self.accept(event(kind,seq,run)|{'label':label,'summary':summary,'sessionId':run,'location':{'kind':'cloud','name':'box'}})
        self.accept(event('task.start',0,'benign')|{'label':'Fix login form','summary':'start','sessionId':'benign','location':{'kind':'cloud','name':'box'}})
        self.accept(event('task.progress',1,'benign')|{'label':'Fix login form','summary':'Tests passing; opening PR next','sessionId':'benign','location':{'kind':'cloud','name':'box'}})
        self.store.process()
        reg={'test':{'secret':known,'displayTaskMetadata':True}}
        d=project(self.store,reg,'24h');blob=canonical(d)+canonical(page_runs(d,{'stale':['show'],'pageSize':['100']}))+canonical(d['live'])
        for leak in leaks: self.assertNotIn(leak,blob)
        runs={r['id']:r for r in d['runs']}
        self.assertEqual(runs['benign']['title'],'Fix login form');self.assertEqual(runs['benign']['note'],'Tests passing; opening PR next')
        self.assertTrue(all(runs[f'leak{i}']['title']!=f'Deploy {l}' for i,l in enumerate(leaks)))

    def test_insights_correlation_stale_empty_and_range_boundary(self):
        from activity_insights import project,page_runs
        at=200000;start=at-86400
        self.fixture_run('carry',[start-60,start+60],['task.start','task.completed'])
        self.fixture_run('stale',[at-4000,at-3600],['task.start','heartbeat'])
        self.fixture_run('session',[at-30,at-10],['task.start','heartbeat'],source='snapshot')
        # Correlation uses session metadata, not coincidental branch or timing.
        for seq,kind in enumerate(['task.start','heartbeat']):
            e=event(kind,seq,'native')|{'sessionId':'session','agent':event()['agent']|{'product':'Codex CLI'}};self.accept(e)
            with self.store.connect() as db:db.execute('UPDATE events SET received=? WHERE id=?',(at-20+seq*10,e['eventId']))
        self.store.process()
        registry={'snapshot':{'correlationHost':'M5','provenance':'read-only local snapshot'},'test':{'correlationHost':'M5'},'missing':{}}
        d=project(self.store,registry,'24h',at)
        self.assertEqual(len(d['runs']),3);self.assertEqual(d['metrics']['snapshotRuns'],0)
        self.assertEqual(d['metrics']['events'],7);self.assertEqual(d['metrics']['medianSeconds'],120)
        self.assertEqual(d['live'][0]['eventCount'],4);self.assertEqual(len(d['live']),1);self.assertTrue(any('30 minutes' in i for i in d['insights']))
        self.assertEqual(page_runs(d,{})['total'],2)
        empty=project(self.store,{},'24h',at+200000)
        self.assertEqual(empty['metrics']['runs'],0);self.assertIsNone(empty['metrics']['medianSeconds']);self.assertIsNone(empty['metrics']['rates']['success'])

    def test_insights_repository_evidence_dedup_and_streak(self):
        from activity_insights import project
        rows=[('push',{'commits':[{'id':'abc'},{'id':'abc'}]}),('pull_request',{'pull_request':{'number':7}}),('pull_request',{'pull_request':{'number':7}}),('check_run',{'check_run':{'id':1,'conclusion':'success'}}),('check_run',{'pages':[{'check_runs':[{'id':1,'conclusion':'success'}]}]}),('check_run',{'check_run':{'id':2,'conclusion':'failure'}}),('check_run',{'check_run':{'id':3,'conclusion':'failure'}})]
        with self.store.connect() as db:
            for i,(kind,body) in enumerate(rows):db.execute('INSERT INTO observations VALUES(?,?,?,?)',(str(i),'jxwalker/ariadne',1000+i,canonical({'kind':kind,'body':body})))
        d=project(self.store,{},'24h',1100);r=d['repositories'][0]
        self.assertEqual(r['commits'],1);self.assertEqual(r['prs'],1);self.assertEqual(r['checks'],3);self.assertEqual(r['passed'],1)
        self.assertTrue(any('latest 2' in i for i in d['insights']))

    def test_insights_terminal_duration_caps_and_association_privacy(self):
        from activity_insights import project
        self.fixture_run('terminal',[1000,1060,1300],['task.start','task.completed','heartbeat'])
        with self.store.connect() as db:
            e=json.loads(db.execute('SELECT envelope FROM runs').fetchone()[0]);e['pr']=7
            db.execute('UPDATE runs SET envelope=?',(canonical(e),))
            body={'kind':'pull_request','body':{'pull_request':{'number':7,'state':'open','body':'SECRET PROMPT','title':'PRIVATE','html_url':'https://github.com/jxwalker/ariadne/pull/7'}}}
            db.execute('INSERT INTO observations VALUES(?,?,?,?)',('private','jxwalker/ariadne',1200,canonical(body)))
        d=project(self.store,{},'24h',1310);self.assertEqual(d['metrics']['medianSeconds'],60)
        self.assertEqual(d['runs'][0]['github'][0]['state'],'open');self.assertNotIn('SECRET',canonical(d));self.assertNotIn('PRIVATE',canonical(d))
        with patch('activity_insights.MAX_RECORDS',2):self.assertTrue(project(self.store,{},'24h',1310)['truncated'])

    def control_record(self, directory, category, ident, **values):
        names={'approvals':'approvals','plans':'mutation-readiness','dryRuns':'mutation-dry-runs','executions':'mutation-executions'}
        singleton={'audit':'mutation-readiness-audit.json','readiness':'live-adapter-readiness.json','cutover':'live-adapter-cutover-audit.json'}
        p=directory/names[category]/(ident+'.json') if category in names else directory/singleton[category]
        p.parent.mkdir(parents=True,exist_ok=True)
        record={'schemaVersion':1,'id':ident,'project':'ariadne','target':'ingest','generatedAt':'2026-10-12T12:00:00Z','status':'passed'}|values
        p.write_text(canonical(record));return p

    def test_controls_states_history_and_cross_directory_precedence(self):
        from activity_controls import controls
        from activity_server import stamp
        at=stamp('2026-10-12T13:00:00Z');first=self.root/'dev-control';second=self.root/'overlay-control'
        self.control_record(first,'approvals','approved',status='approved',decisionBy='Operator',decidedAt='2026-10-12T12:00:00Z')
        self.control_record(second,'approvals','approved',status='requested',generatedAt='2026-05-01T12:00:00Z')
        self.control_record(first,'approvals','pending',status='requested')
        self.control_record(first,'plans','old-plan',status='ready_for_bounded_review',generatedAt='2026-05-01T12:00:00Z')
        self.control_record(first,'audit','audit',status='blocked',checks=[{'planId':'old-plan','status':'blocked','blockers':['Approval pending']}])
        self.control_record(first,'dryRuns','dry-run',planId='ingest-plan',exitCode=0)
        self.control_record(first,'executions','failed-ingest',planId='ingest-plan',status='failed',liveExitCode=1,finishedAt='2026-10-12T12:01:00Z')
        self.control_record(first,'executions','passed-ingest',planId='ingest-plan',liveExitCode=0,postVerificationExitCode=0,finishedAt='2026-10-12T12:02:00Z',rollback='Restore previous release')
        d=controls(self.store,{},[str(first),str(second)],at);rows={r['id']:r for r in d['controls']}
        self.assertEqual(rows['approvals']['status'],'fail');self.assertEqual(rows['approvals']['recordCount'],2)
        self.assertEqual(rows['plans']['status'],'pass');self.assertEqual(rows['audit']['status'],'fail')
        self.assertFalse(any(c['recordId']=='old-plan' for c in d['callouts']))
        self.assertEqual(rows['dryRuns']['status'],'pass');self.assertEqual(rows['executions']['status'],'pass')
        self.assertEqual(rows['readiness']['status'],'missing');self.assertEqual(rows['executions']['recordCount'],2)
        self.assertEqual(rows['executions']['records'][0]['postVerify'],'passed')
        self.assertTrue(any(c['recordId']=='failed-ingest' and 'later record passed-ingest' in c['message'] for c in d['callouts']))
        self.assertTrue(any(c['recordId']=='pending' for c in d['callouts']))
        self.assertEqual(d['evidenceDirectories'][0]['state'],'read-only')

    def test_controls_retired_plans_and_rejected_approvals_are_closed(self):
        from activity_controls import controls
        from activity_server import stamp
        at=stamp('2026-10-12T13:00:00Z');d=self.root/'retire-control'
        self.control_record(d,'approvals','old-approval',status='rejected',decisionBy='james',decidedAt='2026-10-12T12:30:00Z',generatedAt='2026-05-16T12:00:00Z')
        self.control_record(d,'approvals','new-approval',status='approved',decidedAt='2026-10-12T12:00:00Z')
        self.control_record(d,'plans','old-plan',status='approval_required',approvalRef='old-approval',approvalStatus='requested',generatedAt='2026-05-16T12:00:00Z')
        self.control_record(d,'plans','new-plan',status='ready_for_bounded_review',approvalRef='new-approval',approvalStatus='approved')
        self.control_record(d,'audit','audit',status='ready_for_bounded_review',checks=[{'planId':'old-plan','status':'retired','blockers':[]},{'planId':'new-plan','status':'passed','blockers':[]}])
        out=controls(self.store,{},[str(d)],at);rows={r['id']:r for r in out['controls']}
        self.assertEqual(rows['approvals']['status'],'pass');self.assertEqual(rows['plans']['status'],'pass');self.assertEqual(rows['audit']['status'],'pass')
        plan=next(r for r in rows['plans']['records'] if r['id']=='old-plan')
        self.assertEqual((plan['status'],plan['controlStatus'],plan['approvalStatus']),('retired','closed','rejected'))
        self.assertFalse(any(c['recordId'] in {'old-plan','old-approval'} for c in out['callouts']))

    def test_controls_redact_secret_strings_and_drop_raw_fields(self):
        from activity_controls import controls
        directory=self.root/'controls'
        self.control_record(directory,'executions','execution',planId='plan',liveExitCode=0,postVerificationExitCode=0,
            liveCommand='curl -H "Authorization: Bearer DO_NOT_SHOW" https://example.com',
            postVerificationCommand='node --check server.js',rollback='Restore previous release',
            scope='api_key=DO_NOT_SHOW',liveStdout='PRIVATE OUTPUT',postVerificationStderr='PRIVATE ERROR',
            env={'PASSWORD':'DO_NOT_SHOW'},apiKey='DO_NOT_SHOW')
        self.control_record(directory,'approvals','approval',status='approved',decisionBy='Operator',
            action='echo ghp_abcdefghijklmnop',rollback='echo opaque-value',scope='normal bounded scope')
        d=controls(self.store,{'source':{'secret':'opaque-value'}},[str(directory)])
        raw=canonical(d)
        for forbidden in ['DO_NOT_SHOW','PRIVATE OUTPUT','PRIVATE ERROR','PASSWORD','opaque-value','ghp_abcdefghijklmnop','liveStdout','postVerificationStderr','apiKey']:
            self.assertNotIn(forbidden,raw)
        self.assertIn('[redacted sensitive material]',raw);self.assertIn('node --check server.js',raw)
        self.assertIn('Restore previous release',raw);self.assertIn('Operator',raw)
        from activity_controls import text
        for value in ['curl --key HIDDEN https://example.com','key=HIDDEN','refreshKey: HIDDEN','JWT eyJabc.defghi.signature','PRIVATE_KEY=HIDDEN']:
            self.assertEqual(text(value),'[redacted sensitive material]')

    def test_controls_invalid_missing_timestamp_symlink_and_limits(self):
        from activity_controls import controls
        directory=self.root/'controls'
        self.control_record(directory,'approvals','bad-clock',status='approved',generatedAt='not-a-date')
        outside=self.root/'outside.json';outside.write_text('PRIVATE OUTSIDE')
        (directory/'approvals'/'link.json').symlink_to(outside)
        (directory/'approvals'/'broken.json').write_text('not-json SECRET')
        (self.root/'linked-control').symlink_to(directory,target_is_directory=True)
        d=controls(self.store,{},[str(directory),str(self.root/'absent'),'relative',str(self.root/'linked-control')])
        row=next(r for r in d['controls'] if r['id']=='approvals');self.assertEqual(row['status'],'missing')
        self.assertTrue(d['warnings']);self.assertNotIn('PRIVATE',canonical(d));self.assertNotIn('SECRET',canonical(d))
        self.assertEqual([r['state'] for r in d['evidenceDirectories']],['read-only','missing','invalid','invalid'])
        with patch('activity_controls.MAX_FILES',1):self.assertTrue(controls(self.store,{},[str(directory)])['truncated'])

    def test_controls_sources_hosted_onboarding_and_receipt_coverage(self):
        from activity_controls import controls
        self.fixture_run('report',[1000,1100],['task.start','heartbeat'])
        self.accept(event('task.start',0,'controlled')|{'sourceId':'grok-provider','agent':event()['agent']|{'product':'Grok'},'location':{'kind':'cloud','name':'Provider'}})
        with self.store.connect() as db:db.execute('UPDATE events SET received=1100 WHERE source=?',('grok-provider',))
        self.store.process()
        registry={'test':{},'quiet':{},'revoked':{'revoked':True},'grok-provider':{'displayName':'Grok hosted'}}
        d=controls(self.store,registry,[],1150);rows={r['id']:r for r in d['controls']}
        self.assertEqual(rows['source:test']['status'],'pass');self.assertEqual(rows['source:quiet']['status'],'missing')
        self.assertEqual(rows['source:revoked']['status'],'fail');self.assertIn('provider-pending',rows['source:grok-provider']['summary'])
        receipts=rows['receipts']['records'][0];self.assertEqual(receipts['acceptedEvents'],3);self.assertIsNone(receipts['duplicateReceipts'])
        self.accept(event('task.start',0,'production')|{'sourceId':'grok-provider','agent':event()['agent']|{'product':'Grok'},'location':{'kind':'cloud','name':'Provider'}})
        with self.store.connect() as db:db.execute('UPDATE events SET received=1140 WHERE source=?',('grok-provider',))
        self.store.process()
        rows={r['id']:r for r in controls(self.store,registry,[],1150)['controls']}
        self.assertEqual(rows['source:grok-provider']['status'],'pass');self.assertIn('hosted-event-observed',rows['source:grok-provider']['summary'])
        stale=next(r for r in controls(self.store,registry,[],10000)['controls'] if r['id']=='source:test')
        self.assertEqual(stale['status'],'stale')

    def test_controls_webhooks_reconciliation_and_post_verify_failure(self):
        from activity_controls import controls
        from activity_server import stamp
        at=stamp('2026-10-12T13:00:00Z')
        directory=self.root/'controls'
        self.control_record(directory,'executions','bad-verify',planId='plan',liveExitCode=0,postVerificationExitCode=1)
        self.store.webhook('delivery','ping',b'{}')
        with self.store.connect() as db:
            db.execute('UPDATE webhooks SET received=1000')
            db.execute('INSERT INTO health VALUES(?,?,?,?)',('github:owner/repo',1000,'success','Metadata collected'))
            db.execute('INSERT INTO health VALUES(?,?,?,?)',('github:owner/failed',at-1,'error','Read-only API failed'))
        d=controls(self.store,{},[str(directory)],at);rows={r['id']:r for r in d['controls']}
        self.assertEqual(rows['reconciliation:owner/repo']['status'],'stale')
        self.assertEqual(rows['reconciliation:owner/failed']['status'],'fail')
        self.assertEqual(rows['webhooks']['records'][0]['count'],1)
        self.assertEqual(rows['webhooks']['records'][0]['kinds'][0]['kind'],'ping')
        self.assertEqual(rows['executions']['status'],'fail');self.assertEqual(rows['executions']['records'][0]['postVerify'],'failed')
        self.assertTrue(any(c['recordId']=='bad-verify' for c in d['callouts']))

    def test_public_nginx_allowlist_excludes_insights(self):
        import re
        config=(pathlib.Path(__file__).resolve().parents[1]/'deployment/activity/public-ingestion.nginx.example').read_text()
        locations=re.findall(r'location\s+([^{}]+)\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}',config)
        proxy=[(route,body) for route,body in locations if 'proxy_pass' in body]
        self.assertEqual(len(proxy),1)
        route,body=proxy[0];self.assertEqual(route.strip(),'~ ^/ingest/v1/(events|github)$')
        self.assertIn('limit_except POST { deny all; }',body);self.assertIn('location / { return 404; }',config)
        pattern=route.strip()[2:]
        self.assertIsNotNone(re.fullmatch(pattern,'/ingest/v1/events'));self.assertIsNotNone(re.fullmatch(pattern,'/ingest/v1/github'))
        for path in ['/api/insights','/api/runs','/api/sources','/api/activity','/api/controls','/api/alerts','/favicon.ico','/','/assets/activity-dashboard.js','/ingest/v1/events/']:
            self.assertIsNone(re.fullmatch(pattern,path))

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
            self.store.process()
            for route in ['/api/insights?range=24h','/api/runs?stale=show&snapshots=show','/api/sources','/api/activity','/api/controls','/api/alerts']:
                with urllib.request.urlopen(base+route) as r:
                    projection=r.read().decode();self.assertNotIn('unsafe',projection);self.assertNotIn('test-secret',projection);self.assertNotIn('onerror',projection)
            for route in ['/api/insights?range=forever','/api/runs?page=bad','/api/sources?'+('&x=y'*21)]:
                with self.assertRaises(urllib.error.HTTPError) as ex:urllib.request.urlopen(base+route)
                self.assertEqual(ex.exception.code,400)
            with urllib.request.urlopen(base+'/api/controls') as r:
                controls_payload=json.load(r);self.assertEqual(controls_payload['schemaVersion'],1);self.assertTrue(controls_payload['controls']);self.assertIn('summary',controls_payload)
            with self.assertRaises(urllib.error.HTTPError) as ex:urllib.request.urlopen(urllib.request.Request(base+'/api/controls',data=b'{}'))
            self.assertEqual(ex.exception.code,404)
            self.app.config['consoleHtml']=str(self.root/'index.html')
            (self.root/'index.html').write_text('<html><head><meta http-equiv="refresh" content="30"></head><body><main class="shell"><div class="repo-work"><strong>Codex</strong><p>SECRET PROMPT</p><small>Latest update: SECRET OUTPUT</small></div><script type="application/json" id="console-data">'+canonical({'agentTelemetry':[{'sessions':[{'task':'SECRET PROMPT','update':'SECRET OUTPUT'}]}]})+'</script></main></body></html>')
            with urllib.request.urlopen(base+'/') as r:
                page=r.read().decode();self.assertNotIn('SECRET',page);self.assertNotIn('http-equiv="refresh"',page);self.assertIn('script-src \'self\'',r.headers['Content-Security-Policy'])
            with urllib.request.urlopen(base+'/favicon.ico') as r:self.assertEqual(r.status,204)
            self.assertIn('rel="icon"',page)
            self.app.config['ingestOnly']=True
            for route in ['/','/readyz','/healthz','/api/activity','/api/insights?range=7d','/api/runs?page=1','/api/sources','/api/controls','/api/alerts','/favicon.ico','/assets/activity-dashboard.js']:
                with self.assertRaises(urllib.error.HTTPError) as ex: urllib.request.urlopen(base+route)
                self.assertEqual(ex.exception.code,404)
        finally:server.shutdown();thread.join();server.server_close()
if __name__=='__main__':unittest.main()
