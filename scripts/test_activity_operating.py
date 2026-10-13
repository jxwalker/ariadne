"""Decision lifecycle, privacy, entity-grain and source-time regression cases."""
import copy,json,pathlib,tempfile,time,unittest,hashlib,hmac,threading,urllib.request,uuid
from unittest.mock import patch
from activity_server import Store,canonical,validate,App,Handler,ThreadingHTTPServer
from activity_operating import operating,evidence,pipeline
from activity_operations_collect import workflow_window
from activity_reconcile import record_observation
from test_activity import event

class OperatingTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.store=Store(pathlib.Path(self.tmp.name)/'activity.db');self.at=time.time();self.repo='jxwalker/repo'
        self.config={'githubRepositories':[self.repo],'operatorAliases':['james','jxwalker'],'machines':[{'host':'vm','kind':'vm'}]};self.registry={'test':{'displayTaskMetadata':True,'displayName':'Repo bot'}}
    def tearDown(self):self.store.close();self.tmp.cleanup()
    def observe(self,ident,kind,body,at=None):
        with self.store.connect() as db:record_observation(db,ident,self.repo,{'kind':kind,'body':body},at or self.at)
    def send(self,kind,seq=0,**extra):
        e=event();e.update(schemaVersion=2,sourceId='test',repository=self.repo,eventId=f'event-{seq}',runId='real-work',taskId='real-task',sequence=seq,kind=kind,label='Implement operating dashboard',occurredAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-60+seq)),**extra)
        validate(e);self.store.accept(e,canonical(e).encode());self.store.process();return e
    def read(self,registry=None,**filters):return operating(self.store,self.registry if registry is None else registry,self.config,{k:[v] for k,v in filters.items()},self.at+5)
    def test_first_fail_eventual_pass_is_not_counted_twice(self):
        base={'id':10,'name':'CI','created_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-500)),'updated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-100)),'status':'completed'}
        self.observe('run1','workflow_run',{'workflow_run':dict(base,run_attempt=1,conclusion='failure')})
        self.observe('run2','workflow_run',{'workflow_run':dict(base,run_attempt=2,conclusion='success')})
        self.observe('duplicate-webhook','workflow_run',{'workflow_run':dict(base,run_attempt=2,conclusion='success')},self.at+1)
        p=self.read()['delivery'][0]['pipeline'];self.assertEqual((p['runs'],p['completed'],p['retried']),(1,1,1));self.assertEqual(p['firstSuccess'],0);self.assertEqual(p['eventualSuccess'],1)
    def test_missing_first_cancelled_skipped_and_inflight(self):
        for ident,attempt,status,conclusion in [(1,2,'completed','success'),(2,1,'completed','cancelled'),(3,1,'completed','skipped'),(4,1,'in_progress',None)]:
            r={'id':ident,'name':'CI','run_attempt':attempt,'created_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-200)),'status':status,'conclusion':conclusion};self.observe(str(ident),'workflow_run',{'workflow_run':r})
        p=self.read()['delivery'][0]['pipeline'];self.assertIsNone(p['firstSuccess']);self.assertEqual(p['firstMissing'],1);self.assertEqual(p['eventualEligible'],1);self.assertEqual(p['outcomes']['cancelled'],1)
    def test_monitoring_and_review_success_do_not_inflate_ci(self):
        created=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-200))
        for ident,name,result in [(1,'CI','failure'),(2,'Production Uptime','success'),(3,'Grok PR Review','success'),(4,'Deploy UAT','success')]:
            self.observe(str(ident),'workflow_run',{'workflow_run':{'id':ident,'name':name,'created_at':created,'status':'completed','conclusion':result,'run_attempt':1}})
        p=self.read()['delivery'][0]['pipeline'];self.assertEqual(p['runs'],1);self.assertEqual(p['allWorkflowRuns'],4);self.assertEqual(p['firstSuccess'],0);self.assertEqual({v['category'] for v in p['automation']},{'operations','review','cd'})
    def test_old_pr_poll_does_not_create_current_throughput(self):
        pr={'number':1,'state':'closed','merged_at':'2025-01-01T00:00:00Z','created_at':'2024-12-01T00:00:00Z','updated_at':'2025-01-01T00:00:00Z'}
        self.observe('pr','pull_request',{'pull_request':pr});self.observe('webhook','pull_request',{'pull_request':pr},self.at+1)
        r=self.read()['delivery'][0];self.assertEqual(r['merged'],0);self.assertEqual(r['opened'],0)
    def test_latest_pr_by_source_time_and_explicit_review_only(self):
        old={'number':1,'state':'open','title':'Review feature','created_at':'2026-10-01T00:00:00Z','updated_at':'2026-10-02T00:00:00Z','requested_reviewers':[{'login':'jxwalker'}]}
        new=dict(old,state='closed',updated_at='2026-10-03T00:00:00Z')
        self.observe('new','pull_request',{'pull_request':new},self.at-3);self.observe('late-old','pull_request',{'pull_request':old},self.at-1)
        self.assertEqual(self.read()['needsYou'],[])
        self.observe('open','pull_request',{'pull_request':dict(old,number=2,updated_at='2026-10-04T00:00:00Z')})
        self.assertEqual(len(self.read()['needsYou']),1)
    def test_decision_request_resolution_same_source_and_recipient(self):
        d={'id':'choose-runner','recipient':'james','question':'Use the dedicated runner?','options':['Use existing','Prepare a new VM'],'blocking':True}
        self.send('decision.requested',decision=d);self.assertEqual(len(self.read()['needsYou']),1)
        self.send('decision.resolved',seq=1,decision={'id':'choose-runner','recipient':'james','resolution':'Use existing'});self.assertEqual(self.read()['needsYou'],[])
    def test_old_decision_arriving_late_cannot_reopen(self):
        d={'id':'choice','recipient':'james','question':'Choose?','blocking':True}
        self.send('decision.resolved',seq=1,decision={'id':'choice','recipient':'james','resolution':'Chosen'})
        self.send('decision.requested',seq=0,decision=d);self.assertEqual(self.read()['needsYou'],[])
    def test_decision_for_someone_else_not_needs_james(self):
        self.send('decision.requested',decision={'id':'choice','recipient':'another-owner','question':'Choose?','blocking':True});self.assertEqual(self.read()['needsYou'],[])
    def test_unenrolled_and_snapshot_text_suppressed(self):
        self.send('task.start',stage='PRIVATE STAGE',nextStep='PRIVATE NEXT',owner='PRIVATE OWNER')
        for reg in [{'test':{}},{'test':{'displayTaskMetadata':True,'provenance':'read-only local snapshot'}}]:
            text=canonical(self.read(reg));self.assertNotIn('PRIVATE STAGE',text);self.assertNotIn('PRIVATE NEXT',text)
    def test_secrets_redacted_and_test_work_excluded(self):
        self.send('task.blocked',summary='password=do-not-display',owner='secret-owner',classification='work')
        text=canonical(self.read());self.assertNotIn('do-not-display',text);self.assertNotIn('secret-owner',text)
        self.send('task.progress',seq=1,classification='test');self.assertEqual(self.read()['work'],[])
    def test_heartbeat_does_not_reset_blocker_age(self):
        e=self.send('task.blocked',summary='Dependency unavailable');since=self.read()['blocked'][0]['since']
        self.send('heartbeat',seq=1);self.assertEqual(self.read()['blocked'][0]['since'],since)
    def test_stale_machine_measurement_not_a_zero(self):
        self.observe('machine:vm','machine_snapshot',{'host':'vm','at':self.at-1000,'status':'available','cpuPercent':80})
        row=self.read()['machines'][0];self.assertEqual(row['state'],'unknown');self.assertEqual(row['cpuPercent'],80);self.assertIsNone(row['memoryPercent'])
    def test_git_deploy_success_not_runtime_acceptance(self):
        created=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-10))
        self.observe('deploy','pipeline_deployment',{'id':1,'created_at':created,'environment':'production','latest_status':{'state':'success','created_at':created}})
        row=self.read()['deployments'][0];self.assertEqual(row['state'],'success');self.assertFalse(row['runtimeVerified'])
    def test_v1_contract_stays_strict_and_v2_decisions_validated(self):
        e=event();e['stage']='build'
        with self.assertRaises(ValueError):validate(e)
        e.update(schemaVersion=2,kind='decision.requested',decision={'id':'choice','recipient':'james','question':'Choose?','blocking':True});validate(e)
        e['decision']['execute']='merge'
        with self.assertRaises(ValueError):validate(e)
    def test_busy_workflow_window_splits_before_pagination(self):
        class API:
            def __init__(self):self.calls=[]
            def api(self,url):
                self.calls.append(url)
                return {'total_count':1001,'workflow_runs':[]} if len(self.calls)==1 else {'total_count':1,'workflow_runs':[{'id':len(self.calls)}]}
        api=API();rows=workflow_window(api,'owner/repo',1000,2000);self.assertEqual(len(rows),2);self.assertEqual(len(api.calls),3)
    def test_signed_http_decision_projects_and_resolves(self):
        credentials=pathlib.Path(self.tmp.name)/'sources.json';credentials.write_text(json.dumps({'test':{'secret':'fixture-only-signing-value','projects':['scorpion-labs'],'repositories':[self.repo],'displayTaskMetadata':True}}));credentials.chmod(0o600)
        app=App(self.config|{'database':str(pathlib.Path(self.tmp.name)/'http.db'),'credentials':str(credentials)});server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.app=app;thread=threading.Thread(target=server.serve_forever);thread.start();base=f'http://127.0.0.1:{server.server_port}'
        try:
            e=event();e.update(schemaVersion=2,sourceId='test',repository=self.repo,project='scorpion-labs',runId='real-http-work',taskId='real-http-task',label='Choose deployment path',kind='decision.requested',decision={'id':'choose-path','recipient':'james','question':'Which deployment path?','blocking':True})
            for seq,kind in [(0,'decision.requested'),(1,'decision.resolved')]:
                e.update(eventId=f'http-{seq}',sequence=seq,kind=kind,occurredAt=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at+seq)))
                if seq:e['decision']={'id':'choose-path','recipient':'james','resolution':'Existing path'}
                raw=canonical(e).encode();ts=str(int(time.time()));nonce=str(uuid.uuid4());sig=hmac.new(b'fixture-only-signing-value',ts.encode()+b'\n'+nonce.encode()+b'\n'+raw,hashlib.sha256).hexdigest()
                req=urllib.request.Request(base+'/ingest/v1/events',data=raw,headers={'Content-Type':'application/json','X-Ariadne-Source':'test','X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig})
                with urllib.request.urlopen(req) as response:self.assertEqual(response.status,202)
                app.store.process();app.operating_cache.clear()
                with urllib.request.urlopen(base+'/api/operating') as response:d=json.load(response)
                self.assertEqual(len(d['needsYou']),1 if seq==0 else 0);self.assertNotIn('fixture-only-signing-value',canonical(d))
        finally:server.shutdown();server.server_close();thread.join();app.store.close()

if __name__=='__main__':unittest.main()
