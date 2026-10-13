"""Fixture-only operations tests; no production writes or external notifications."""
import copy
import json
import pathlib
import tempfile
import time
import unittest
from activity_server import Store,canonical
from activity_controls import controls
from activity_insights import sources_view
from activity_reconcile import record_observation
from activity_backup import backup,restore_test,retention_report,apply_retention,rotation_candidates,crypt
from activity_alerts import evaluate,quiet_seconds,WebhookNotifier

class OpsTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.temp.name);self.store=Store(self.root/'activity.db');self.config={'database':self.store.path}
    def tearDown(self):self.temp.cleanup()
    def test_snapshot_connectivity_zero_sessions_and_failure(self):
        registry={'claude-dev':{'provenance':'read-only local snapshot'}}
        with self.store.connect() as db:db.execute('INSERT INTO health VALUES(?,?,?,?)',('snapshot:claude-dev',1000,'connected','0 recent sessions'))
        out=controls(self.store,registry,[],1050);row=next(r for r in out['controls'] if r['id']=='source:claude-dev')
        self.assertEqual(row['status'],'pass');self.assertIn('connected; 0 recent sessions',row['summary']);self.assertEqual(row['records'][0]['acceptedEvents'],0)
        self.assertEqual(sources_view(self.store,registry,1050)[0]['state'],'connected');self.assertEqual(sources_view(self.store,registry,1050)[0]['recentSessions'],0)
        with self.store.connect() as db:db.execute("UPDATE health SET status='error'")
        self.assertEqual(sources_view(self.store,registry,1050)[0]['state'],'never-connected')
        self.assertEqual(sources_view(self.store,{'claude-dev':{}},1050)[0]['state'],'never-connected')
    def test_history_ignores_only_repository_volatility_and_keeps_raw(self):
        body={'kind':'pull_request','body':{'pull_request':{'state':'open','updated_at':'old','head':{'repo':{'pushed_at':'a','size':12,'name':'repo'}},'number':1}}}
        changed=copy.deepcopy(body);changed['body']['pull_request']['head']['repo'].update(pushed_at='b',size=13)
        with self.store.connect() as db:
            record_observation(db,'pr:1','repo',body,1);record_observation(db,'pr:1','repo',changed,2)
            self.assertEqual(db.execute('SELECT count(*) FROM observation_history').fetchone()[0],1)
            self.assertEqual(json.loads(db.execute('SELECT body FROM observations').fetchone()[0]),changed)
            changed['body']['pull_request']['state']='closed';record_observation(db,'pr:1','repo',changed,3)
            self.assertEqual(db.execute('SELECT count(*) FROM observation_history').fetchone()[0],2)
            self.assertEqual(json.loads(db.execute('SELECT body FROM observation_history ORDER BY observed DESC').fetchone()[0]),changed)
    def test_old_audit_pass_and_newer_contradiction(self):
        root=self.root/'control';root.mkdir();(root/'mutation-readiness').mkdir();(root/'mutation-dry-runs').mkdir()
        (root/'mutation-readiness-audit.json').write_text(json.dumps({'schemaVersion':1,'project':'test','status':'ready_for_bounded_review','generatedAt':'2026-01-01T00:00:00Z'}))
        (root/'mutation-readiness'/'plan.json').write_text(json.dumps({'schemaVersion':1,'id':'plan','status':'passed','generatedAt':'2026-01-01T00:00:00Z'}))
        rows={r['id']:r for r in controls(self.store,{},[str(root)])['controls']};self.assertEqual(rows['audit']['status'],'pass');self.assertEqual(rows['plans']['status'],'pass')
        (root/'mutation-dry-runs'/'fail.json').write_text(json.dumps({'schemaVersion':1,'id':'attempt','planId':'plan','status':'failed','exitCode':1,'generatedAt':'2026-02-01T00:00:00Z'}))
        rows={r['id']:r for r in controls(self.store,{},[str(root)])['controls']};self.assertEqual(rows['plans']['status'],'fail')
        (root/'mutation-executions').mkdir()
        (root/'mutation-executions'/'post.json').write_text(json.dumps({'schemaVersion':1,'id':'post','planId':'plan','status':'passed','liveExitCode':0,'postVerificationExitCode':1,'generatedAt':'2026-03-01T00:00:00Z'}))
        (root/'mutation-dry-runs'/'fail.json').unlink()
        self.assertEqual(next(r for r in controls(self.store,{},[str(root)])['controls'] if r['id']=='plans')['status'],'fail')
        (root/'live-adapter-readiness.json').write_text(json.dumps({'schemaVersion':1,'project':'test','status':'blocked','generatedAt':'2026-01-01T00:00:00Z'}))
        row=next(r for r in controls(self.store,{},[str(root)])['controls'] if r['id']=='readiness');self.assertEqual(row['status'],'stale')
    def test_alert_dedupe_resolution_pending_thresholds_and_ci(self):
        registry={'vm':{'provenance':'read-only local snapshot'},'m5':{'correlationHost':'M5','provenance':'read-only local snapshot'},'grok-hosted':{}}
        with self.store.connect() as db:
            for source in ['vm','m5']:db.execute('INSERT INTO health VALUES(?,?,?,?)',('snapshot:'+source,100,'connected','0 recent sessions'))
            for i in range(2):db.execute('INSERT INTO observations VALUES(?,?,?,?)',(str(i),'repo',200+i,canonical({'kind':'workflow_run','body':{'workflow_run':{'id':i+1,'name':'CI','conclusion':'failure'}}})))
        result=evaluate(self.store,registry,self.config,8000)
        self.assertEqual({a['rule'] for a in result['alerts']},{'quiet-source','source-information','ci-failure-streak'})
        path=self.root/'alerts.jsonl';before=path.read_text();evaluate(self.store,registry,self.config,8001);self.assertEqual(before,path.read_text())
        with self.store.connect() as db:db.execute("UPDATE health SET at=8002 WHERE name='snapshot:vm'")
        evaluate(self.store,registry,self.config,8002);self.assertIn('"transition": "resolved"',path.read_text());self.assertEqual(path.stat().st_mode & 0o777,0o600)
        self.assertEqual(quiet_seconds('vm',{}, {'sourceQuietSeconds':{'vm':10}}),10)
        self.assertEqual(quiet_seconds('x',{'correlationHost':'M5'},{'sourceQuietSeconds':{'M5/*':20}}),20)
    def test_encrypted_restore_counts_rotation_and_retention(self):
        key=self.root/'key';key.write_text('fixture-only-key\n');key.chmod(0o600)
        self.config.update(backup={'encryptionKeyFile':str(key)},retention={'observationHistoryDays':None,'eventsDays':1,'backupsDays':None})
        with self.store.connect() as db:db.execute('INSERT INTO observation_history VALUES(?,?,?)',('old',1,'{}'))
        from test_activity import event
        envelope=event();self.store.accept(envelope,canonical(envelope).encode());self.store.process()
        with self.store.connect() as db:db.execute('INSERT INTO webhooks VALUES(?,?,?,?,?)',('fixture','ping',1,b'{}',1))
        path=backup(self.config);self.assertTrue(path.name.endswith('.enc'));self.assertFalse(path.read_bytes().startswith(b'SQLite'))
        self.assertEqual(restore_test(self.config)['counts'],{'events':1,'runs':1,'webhooks':1})
        self.assertEqual(retention_report(self.config)['wouldRemove']['observation_history'],0)
        self.assertEqual(rotation_candidates(self.config),[])
        self.config['backup'].update(keepDaily=1,keepWeekly=1)
        old=path.parent/'activity-20250101T000000Z.db';old.write_bytes(b'old');self.assertEqual(rotation_candidates(self.config),[old]);old.unlink()
        self.config['retention']['observationHistoryDays']=1
        self.assertEqual(retention_report(self.config)['wouldRemove']['observation_history'],1)
        apply_retention(self.config)
        with self.store.connect() as db:self.assertEqual(db.execute('SELECT count(*) FROM observation_history').fetchone()[0],0)
        with self.store.connect() as db:self.assertEqual(db.execute('SELECT count(*) FROM events').fetchone()[0],1)
        key.chmod(0o644)
        with self.assertRaises(ValueError):crypt(path,self.root/'out',key,True)
    def test_failed_execution_blocked_audit_and_stalled_run_alerts(self):
        root=self.root/'control';root.mkdir();folder=root/'mutation-executions';folder.mkdir()
        audit={'schemaVersion':1,'project':'test','status':'blocked','generatedAt':'2026-01-01T00:00:00Z'}
        (root/'mutation-readiness-audit.json').write_text(json.dumps(audit))
        failed={'schemaVersion':1,'id':'failed','planId':'plan','status':'passed','liveExitCode':0,'postVerificationExitCode':1,'generatedAt':'2026-01-01T00:00:00Z'}
        (folder/'failed.json').write_text(json.dumps(failed));self.config['controlEvidenceDirs']=[str(root)]
        with self.store.connect() as db:db.execute('INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)',('source','private-run','task',0,'blocked',1,'{}',0))
        out=evaluate(self.store,{},self.config,3000);self.assertEqual({a['rule'] for a in out['alerts']},{'executions','audit','stalled-run'})
        passed=failed|{'id':'retry','postVerificationExitCode':0,'generatedAt':'2026-02-01T00:00:00Z'}
        (folder/'retry.json').write_text(json.dumps(passed));self.assertNotIn('executions',{a['rule'] for a in evaluate(self.store,{},self.config,3001)['alerts']})
    def test_webhook_notifier_validates_protected_file_and_never_sends(self):
        header=self.root/'header';header.write_text(json.dumps({'name':'Authorization','value':'fixture-only'}));header.chmod(0o600)
        config={'url':'https://example.invalid/alerts','secretHeaderFile':str(header)}
        notifier=WebhookNotifier(config)
        with self.assertRaises(RuntimeError):notifier.notify({'rule':'fixture'})
        header.chmod(0o644)
        with self.assertRaises(ValueError):WebhookNotifier(config)
    def test_corrupted_backup_rejected(self):
        path=backup(self.config);path.write_bytes(b'corrupt')
        with self.assertRaises(ValueError):restore_test(self.config)
if __name__=='__main__':unittest.main()
