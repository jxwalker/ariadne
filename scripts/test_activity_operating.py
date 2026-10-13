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
    def test_decision_can_discuss_access_without_exposing_credential_values(self):
        d={'id':'access','recipient':'james','question':'May I use the existing SSH key to finish the repository deployment?','recommendation':'Use the existing authorized SSH key','options':['Authorize the existing SSH key','Leave blocked'],'blocking':True}
        self.send('decision.requested',decision=d);text=canonical(self.read());self.assertIn('existing SSH key',text)
        token='ghp_'+'A1b2'*9
        self.send('decision.requested',seq=1,decision=dict(d,question='Use '+token+' to proceed'))
        self.assertNotIn(token,canonical(self.read()))
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
    def test_later_success_clears_historical_deployment_failure(self):
        for ident,offset,state in [(1,-300,'failure'),(2,-10,'success')]:
            at=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at+offset))
            self.observe('deploy-'+str(ident),'pipeline_deployment',{'id':ident,'created_at':at,'environment':'production','latest_status':{'state':state,'created_at':at}})
        d=self.read();self.assertFalse(any(a['kind']=='deployment-failure' for a in d['blocked']));self.assertEqual(len(d['deployments']),2)
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

    def test_malformed_machine_snapshot_is_sanitised_not_fatal(self):
        self.observe('machine:vm','machine_snapshot',{'host':'vm','at':self.at-5,'status':'available','cpuPercent':'<img src=x onerror=alert(1)>','diskPercent':{'x':1},'pressure':{'macFreePercent':'<b>','memory_full':1.5},'temperatures':[{'celsius':'<i>'},{'name':'CPU','celsius':41,'status':'ok'},{'name':'no-celsius'}],'vms':[{'name':'guest','vmid':100,'mem':'<s>'}],'services':['bad',{'name':'svc','state':'active'}]})
        row=self.read()['machines'][0]
        self.assertIsNone(row['cpuPercent']);self.assertIsNone(row['diskPercent']);self.assertEqual(row['pressure'],{'memory_full':1.5})
        self.assertEqual([t['name'] for t in row['temperatures']],['CPU']);self.assertIsNone(row['vms'][0]['mem']);self.assertEqual(row['services'],[{'name':'svc','state':'active'}])
        self.assertNotIn('<',canonical(row))
    def test_resolution_sequence_survives_producer_clock_rollback(self):
        self.send('decision.requested',decision={'id':'choice','recipient':'james','question':'Choose?','blocking':True})
        self.send('decision.resolved',seq=1,decision={'id':'choice','recipient':'james','resolution':'Chosen'})
        with self.store.connect() as db:
            env=json.loads(db.execute("SELECT envelope FROM events WHERE id='event-1'").fetchone()['envelope'])
            env['occurredAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-3600))
            db.execute("UPDATE events SET envelope=? WHERE id='event-1'",(canonical(env),))
        self.assertEqual(self.read()['needsYou'],[])

    def test_late_lower_sequence_cannot_reopen_resolved_question(self):
        self.send('decision.resolved',seq=2,decision={'id':'choice','recipient':'james','resolution':'Chosen'})
        self.send('decision.requested',seq=1,decision={'id':'choice','recipient':'james','question':'Choose?','blocking':True})
        with self.store.connect() as db:
            env=json.loads(db.execute("SELECT envelope FROM events WHERE id='event-1'").fetchone()['envelope'])
            env['occurredAt']=time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at+300))
            db.execute("UPDATE events SET envelope=? WHERE id='event-1'",(canonical(env),))
        self.assertEqual(self.read()['needsYou'],[])

    def test_unresolved_question_survives_large_decision_history(self):
        original=self.send('decision.requested',decision={'id':'old-choice','recipient':'james','question':'Still needs an answer','blocking':True})
        rows=[]
        for i in range(5001):
            e=copy.deepcopy(original);e.update(eventId='history-'+str(i),sequence=i+1,kind='decision.resolved',decision={'id':'closed-'+str(i),'recipient':'james','resolution':'Already answered'})
            validate(e);encoded=canonical(e);rows.append((e['eventId'],'test',self.at+i*0.001,e['occurredAt'],encoded.encode(),encoded))
        with self.store.connect() as db:
            db.executemany('INSERT INTO events(id,source,received,received_at,raw,envelope) VALUES(?,?,?,?,?,?)',rows)
        self.assertEqual([a['requestId'] for a in self.read()['needsYou']],['old-choice'])
        self.send('decision.resolved',seq=5002,decision={'id':'old-choice','recipient':'james','resolution':'Chosen'})
        self.assertEqual(self.read()['needsYou'],[])

    def test_basic_format_resolution_time_still_orders_decisions(self):
        d={'id':'choice','recipient':'james','question':'Choose?','blocking':True}
        self.send('decision.requested',decision=d)
        self.send('decision.resolved',seq=1,decision={'id':'choice','recipient':'james','resolution':'Chosen'})
        with self.store.connect() as db:
            row=db.execute("SELECT envelope FROM events WHERE id='event-1'").fetchone();env=json.loads(row['envelope']);env['occurredAt']=time.strftime('%Y%m%dT%H%M%SZ',time.gmtime(self.at+1));db.execute("UPDATE events SET envelope=? WHERE id='event-1'",(canonical(env),))
        self.assertEqual(self.read()['needsYou'],[])
    def test_approved_deployment_leaves_queue_after_run_moves_on(self):
        self.observe('pending','pending_deployments',{'runId':7,'pending':[{'environment':{'id':1,'name':'production'},'reviewers':[{'type':'User','reviewer':{'login':'jxwalker'}}]}]},self.at-60)
        self.assertEqual(len(self.read()['needsYou']),1)
        self.observe('run','workflow_run',{'workflow_run':{'id':7,'name':'Deploy UAT','status':'in_progress','created_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-100)),'updated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at-10))}},self.at-5)
        self.assertEqual(self.read()['needsYou'],[])
    def test_fleet_machine_observations_are_not_a_repository(self):
        from activity_insights import project
        self.observe('machine:vm','machine_snapshot',{'host':'vm','at':self.at,'status':'available'})
        with self.store.connect() as db:db.execute("UPDATE observations SET repo='_fleet' WHERE id='machine:vm'")
        self.assertNotIn('_fleet',canonical(project(self.store,self.registry,'24h',self.at+1)))

    def test_current_ci_failure_stays_stuck_outside_selected_range(self):
        fmt=lambda o:time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime(self.at+o))
        self.observe('info','repo_info',{'default_branch':'main'})
        self.observe('old','workflow_run',{'workflow_run':{'id':9,'name':'CI','run_attempt':1,'status':'completed','conclusion':'failure','head_branch':'main','head_sha':'abc','created_at':fmt(-3*86400),'updated_at':fmt(-3*86400+60)}})
        for r in ('24h','7d'):self.assertTrue(any(a['kind']=='ci-failure' for a in self.read(range=r)['blocked']),r)
        self.assertEqual(self.read(range='24h')['delivery'][0]['pipeline']['runs'],0)

if __name__=='__main__':unittest.main()
