"""Synthetic adapters through real HTTPS handler and disposable socket-only PG."""
import json
import pathlib
import ssl
import subprocess
import threading
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import patch
from http.server import ThreadingHTTPServer
import test_claims_leases as claims
from harness_adapter import Adapter, request
from activity_server import Handler
from test_master_ledger import ROOT

class HarnessAdapters(unittest.TestCase):
    bin=None
    pg_run=classmethod(claims.ClaimsLeases.pg_run.__func__)
    sql=classmethod(claims.ClaimsLeases.sql.__func__)
    cmd=claims.ClaimsLeases.cmd
    ok=claims.ClaimsLeases.ok
    fixture=claims.ClaimsLeases.fixture
    request=claims.ClaimsLeases.request
    setup=claims.ClaimsLeases.setup
    send=claims.ClaimsLeases.send
    claim=claims.ClaimsLeases.claim
    start=claims.ClaimsLeases.start

    @classmethod
    def setUpClass(cls):
        claims.ClaimsLeases.setUpClass.__func__(cls)
        cls.sql((ROOT/'migrations/master/004-adapter-dashboard.sql').read_text(),database='ledger_test',raw=True)
        assert cls.sql('SELECT to_jsonb(count(*)) FROM master.migrations WHERE version=4;',database='ledger_test')==1
        cls.sql('CREATE ROLE ariadne_agent_transport LOGIN; GRANT USAGE ON SCHEMA master TO ariadne_agent_transport; GRANT EXECUTE ON FUNCTION master.agent_request(text,text,jsonb) TO ariadne_agent_transport;',database='ledger_test',raw=True)
        cls.keys=cls.dir/'adapter-keys';cls.keys.write_text('{}');cls.keys.chmod(0o600)
        cert,key=cls.dir/'cert.pem',cls.dir/'key.pem'
        subprocess.run(['openssl','req','-x509','-newkey','rsa:2048','-nodes','-keyout',str(key),'-out',str(cert),'-days','1','-subj','/CN=localhost','-addext','subjectAltName=IP:127.0.0.1'],check=True,capture_output=True)
        context=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);context.load_cert_chain(cert,key)
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.server.socket=context.wrap_socket(cls.server.socket,server_side=True)
        cls.server.app=SimpleNamespace(config={'agentCommands':{'enabled':True,'keyRegistry':str(cls.keys)},'ingestOnly':True})
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True);cls.thread.start()
        cls.trust=patch('ssl._create_default_https_context',lambda:ssl.create_default_context(cafile=str(cert)));cls.trust.start()
        cls.query_patch=patch('agent_commands.query',lambda config,sql:cls.sql('SET SESSION AUTHORIZATION ariadne_agent_transport; '+sql,database='ledger_test'));cls.query_patch.start()

    @classmethod
    def tearDownClass(cls):
        cls.query_patch.stop();cls.trust.stop();cls.server.shutdown();cls.thread.join();cls.server.server_close()
        claims.ClaimsLeases.tearDownClass.__func__(cls)

    def adapter(self,harness,work=None):
        cap,c=self.setup(work=work)
        keys=json.loads(self.keys.read_text());keys[cap]={'secret':'synthetic-test-key-'+cap,'keyRef':cap};self.keys.write_text(json.dumps(keys));self.keys.chmod(0o600)
        cfg={'harness':harness,'credentialKind':'agent-command','capabilityId':cap,'secret':keys[cap]['secret'],
             'origin':'https://127.0.0.1:'+str(self.server.server_port),'spool':str(self.dir/('spool-'+cap)),
             'binding':{k:c[k] for k in ('target','repository','nativeKind','nativeId')}}
        return Adapter(cfg),c,cap

    def receipt(self,adapter,path):
        adapter.replay()
        return json.loads(path.with_name(path.name+'.receipt').read_text())

    def owned(self,a,c):
        path=a.command('claim',str(uuid.uuid4()),c['expectedRevision'],c['generation'])
        result=self.receipt(a,path);self.assertTrue(result['ok'],result)
        snapshot=self.sql('SELECT master.snapshot();',database='ledger_test')
        state=next(row for row in snapshot['agentState'] if row['work_id']==c['target'])
        self.assertEqual(state['last_receipt']['result'],result) # claim receipt establishes the incremented lease generation
        c={**c,'expectedRevision':result['revision'],'generation':result['generation'],'assignmentId':result['assignmentId']}
        for state in ['received','acknowledged','started']:
            path=a.command('receipt',str(uuid.uuid4()),c['expectedRevision'],c['generation'],assignmentId=c['assignmentId'],state=state)
            self.assertTrue(self.receipt(a,path)['ok'])
        path=a.command('start',str(uuid.uuid4()),c['expectedRevision'],c['generation'])
        result=self.receipt(a,path);self.assertTrue(result['ok'],result);c['expectedRevision']=result['revision']
        return c

    def test_each_harness_pre_pr_offline_duplicates_privilege_and_privacy(self):
        for harness in ['claude','codex','cloud-bot']:
            with self.subTest(harness=harness):
                a,c,cap=self.adapter(harness);c=self.owned(a,c)
                packet=a.poll();self.assertTrue(packet['ok']);self.assertEqual(packet['work']['id'],c['target'])
                a.lifecycle('PreToolUse')
                self.assertEqual(set(json.loads((a.directory/'.lifecycle').read_text())),{'event','at','binding'})
                for op,fields in [('accept',{}),('approve',{}),('update',{'patch':{'prompt':'SYNTHETIC-FORBIDDEN'}}),('retainedEvidence',{'evidence':{'tool_input':'SYNTHETIC-FORBIDDEN'}}),('handover',{'handover':{'transcript':'SYNTHETIC-FORBIDDEN'}})]:
                    with self.assertRaises(ValueError):a.command(op,str(uuid.uuid4()),c['expectedRevision'],c['generation'],**fields)
                key='synthetic-pre-pr-'+cap
                path=a.command('update',key,c['expectedRevision'],c['generation'],patch={'nextAction':'synthetic pre-PR implementation check','blocker':'synthetic waiting for review'})
                real=a.transport;a.transport=lambda *_args,**_kw:(_ for _ in ()).throw(ConnectionError())
                a.replay();self.assertTrue(path.exists());a.transport=real
                receipt=self.receipt(a,path);self.assertTrue(receipt['ok'],receipt)
                payload={**c,'op':'update','idempotencyKey':key,'reason':'deliberate adapter report','patch':{'nextAction':'synthetic pre-PR implementation check','blocker':'synthetic waiting for review'}}
                payload.pop('keyRef');payload.pop('assignmentId')
                self.assertEqual(request(a.config,payload),receipt)
                self.assertEqual(request(a.config,{**payload,'patch':{'nextAction':'changed'}})['error'],'idempotency payload conflict')
                c['expectedRevision']=receipt['revision']
                for op in ['accept','approve','scope']:
                    denied=request(a.config,{**payload,'op':op,'idempotencyKey':str(uuid.uuid4()),'expectedRevision':c['expectedRevision']});self.assertFalse(denied['ok'])
                done=a.command('done',str(uuid.uuid4()),c['expectedRevision'],c['generation']);result=self.receipt(a,done);self.assertTrue(result['ok'],result)
                self.assertEqual(a.poll()['work']['state'],'verification')
                for file in a.directory.iterdir():
                    if file.is_file():self.assertNotIn('SYNTHETIC-FORBIDDEN',file.read_text())
                snap=self.sql('SELECT master.snapshot();',database='ledger_test')
                state=next(row for row in snap['agentState'] if row['work_id']==c['target'])
                self.assertEqual(state['generation'],c['generation']);self.assertTrue(state['current']);self.assertTrue(state['last_receipt']['result']['ok'])

    def test_each_harness_binding_observer_stale_generation_and_human_edit(self):
        for harness in ['claude','codex','cloud-bot']:
            with self.subTest(harness=harness):
                a,c,cap=self.adapter(harness)
                with self.assertRaises(ValueError):Adapter({**a.config,'binding':{}})
                with self.assertRaises(ValueError):Adapter({**a.config,'credentialKind':'observation'})
                observer={**a.config,'capabilityId':'synthetic-observer'}
                for packet in [False,True]:
                    with self.assertRaises(__import__('urllib.error',fromlist=['HTTPError']).HTTPError):request(observer,{**a.binding,'op':'update','patch':{'nextAction':'synthetic denied'}},packet)
                unbound=Adapter({**a.config,'spool':str(a.directory)+'-unbound','binding':{**a.binding,'nativeId':'synthetic-unbound'}})
                self.assertFalse(unbound.poll()['ok'])
                c=self.owned(a,c)
                stale=a.command('update',str(uuid.uuid4()),c['expectedRevision'],c['generation']-1,patch={'nextAction':'synthetic stale'})
                rejected=self.receipt(a,stale);self.assertFalse(rejected['ok']);self.assertIn('current',rejected)
                calls=[];a.transport=lambda *args,**kw:calls.append(args) or {'ok':True};a.replay();self.assertEqual(calls,[])
                # Reconciliation explicitly retains stale rejection; another instance/spool tests human edits.
                b=Adapter({**a.config,'spool':str(a.directory)+'-human'})
                path=b.command('update',str(uuid.uuid4()),c['expectedRevision'],c['generation'],patch={'nextAction':'offline overwrite'})
                revision=self.ok('update',c['target'],c['expectedRevision'],patch={'nextAction':'synthetic human edit survives'})
                result=self.receipt(b,path);self.assertEqual(result['error'],'revision conflict');self.assertEqual(result['current']['revision'],revision)
                self.assertEqual(b.poll()['work']['nextAction'],'synthetic human edit survives')

    def test_each_harness_renew_handover_successor_and_release(self):
        for harness in ['claude','codex','cloud-bot']:
            a,c,cap=self.adapter(harness);c=self.owned(a,c)
            path=a.command('renew',str(uuid.uuid4()),c['expectedRevision'],c['generation'],leaseSeconds=120)
            self.assertTrue(self.receipt(a,path)['ok'])
            hand=dict(branch='synthetic/adapter',revision='a'*40,changedPaths=['synthetic/a'],checks=['synthetic check'],evidenceRefs=['https://example.invalid/synthetic'],remainingWork=['synthetic resume'],blockers=[],nextAction='synthetic resume',localWork=['synthetic retained patch'])
            path=a.command('handover',str(uuid.uuid4()),c['expectedRevision'],c['generation'],handover=hand)
            self.assertTrue(self.receipt(a,path)['ok'])
            b,d,successor=self.adapter(harness,work=c['target'])
            # New capability receives the canonical work ID and increased generation.
            path=b.command('claim',str(uuid.uuid4()),d['expectedRevision'],d['generation'])
            result=self.receipt(b,path);self.assertTrue(result['ok'],result);self.assertGreater(result['generation'],c['generation'])
            for state in ['received','acknowledged','started']:
                path=b.command('receipt',str(uuid.uuid4()),result['revision'],result['generation'],assignmentId=result['assignmentId'],state=state)
                self.assertTrue(self.receipt(b,path)['ok'])
            self.assertEqual(b.poll()['work']['handover'],hand)
            path=b.command('resume',str(uuid.uuid4()),result['revision'],result['generation'],branch=hand['branch'],revision=hand['revision'])
            self.assertTrue(self.receipt(b,path)['ok'])
            path=b.command('release',str(uuid.uuid4()),result['revision'],result['generation'])
            self.assertTrue(self.receipt(b,path)['ok'])

    def test_transient_auth_retry_and_explicit_rejection_archival(self):
        a,c,cap=self.adapter('cloud-bot');c=self.owned(a,c)
        key='synthetic-auth-retry'
        path=a.command('update',key,c['expectedRevision'],c['generation'],patch={'nextAction':'synthetic transport recovery'})
        secret=a.config['secret'];a.config['secret']='synthetic-wrong-auth'
        a.replay();self.assertTrue(path.exists());self.assertFalse(path.with_name(path.name+'.receipt').exists())
        a.config['secret']=secret;result=self.receipt(a,path);self.assertTrue(result['ok'])
        stale=a.command('update','synthetic-archive',result['revision'],c['generation']-1,patch={'nextAction':'synthetic stale'})
        rejection=self.receipt(a,stale);self.assertFalse(rejection['ok'])
        a.archive_rejection('synthetic-archive');self.assertFalse(stale.exists())
        self.assertEqual(json.loads((a.directory/'.reconciled'/stale.name).read_text())['idempotencyKey'],'synthetic-archive')
        self.assertEqual(json.loads((a.directory/'.reconciled'/(stale.name+'.receipt')).read_text()),rejection)
        # Explicit archival is not a generation rewrite or resubmission.
        self.assertEqual(a.poll()['work']['generation'],c['generation'])
        with self.assertRaises(ValueError):a.archive_rejection(key)

    def test_local_bounds_private_spool_and_identity(self):
        a,c,cap=self.adapter('claude')
        with self.assertRaises(ValueError):Adapter({**a.config,'capabilityId':'synthetic-other'})
        a.directory.chmod(0o755)
        try:
            with self.assertRaises(ValueError):Adapter(a.config)
        finally:a.directory.chmod(0o700)
        for op,fields in [('receipt',{'assignmentId':{},'state':'started'}),('resume',{'branch':'synthetic','revision':{}}),('retainedEvidence',{'evidence':{'summary':'x'*501}}),('retainedEvidence',{'evidence':{'summary':{'prompt':'SYNTHETIC-FORBIDDEN'}}}),('claim',{'leaseSeconds':True})]:
            with self.assertRaises(ValueError):a.command(op,str(uuid.uuid4()),c['expectedRevision'],c['generation'],**fields)
        self.assertFalse(list(a.directory.glob('*.json')))

    def test_transport_validation_reconciliation_and_success_receipt_race(self):
        from activity_sender import persist
        from harness_adapter import main
        a,c,cap=self.adapter('codex')
        # A deterministic HTTP-layer validation failure is local evidence, not a ledger receipt.
        result=request(a.config,{**a.binding,'op':'packet'})
        self.assertEqual(result['transportStatus'],400);self.assertTrue(result['localOnly'])
        path=a.command('release','synthetic-local-rejection',c['expectedRevision'],c['generation'])
        a.transport=lambda *_:result;self.receipt(a,path);a.archive_rejection('synthetic-local-rejection')
        path=a.command('release','synthetic-race-success',c['expectedRevision'],c['generation'])
        persist(path.with_name(path.name+'.receipt'),{'ok':True})
        with patch('harness_adapter.flush'):self.assertEqual(a.replay(),[])
        config=self.dir/'synthetic-exec-config';config.write_text(json.dumps({k:v for k,v in a.config.items() if k!='secret'}));config.chmod(0o600)
        with patch('sys.argv',['adapter','--config',str(config),'exec']),patch('harness_adapter.Adapter.lifecycle',side_effect=OSError()),patch('harness_adapter.subprocess.call',return_value=7):
            self.assertEqual(main('codex'),7)

    def test_hook_never_reads_input_and_https_required(self):
        import tempfile
        for harness in ['claude','codex','cloud-bot']:
            a,c,cap=self.adapter(harness)
            config=self.dir/(harness+'.json');config.write_text(json.dumps({k:v for k,v in a.config.items() if k!='secret'}));config.chmod(0o600)
            proc=subprocess.run(['python3',str(ROOT/'scripts'/({'claude':'claude_adapter.py','codex':'codex_adapter.py','cloud-bot':'cloud_bot_adapter.py'}[harness])),'--config',str(config),'hook','Stop'],input='{"prompt":"SYNTHETIC-FORBIDDEN","tool_output":"SYNTHETIC-FORBIDDEN"}',capture_output=True,text=True)
            self.assertEqual(proc.returncode,0,proc.stderr);self.assertNotIn('SYNTHETIC-FORBIDDEN',proc.stdout+proc.stderr+(a.directory/'.lifecycle').read_text())
            with self.assertRaises(ValueError):request({**a.config,'origin':'http://localhost'},a.binding,True)
