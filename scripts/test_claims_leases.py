"""All demonstrations synthetic; real parallel socket-only PostgreSQL connections."""
import json, uuid, time
from concurrent.futures import ThreadPoolExecutor
import test_agent_commands as agents
from test_master_ledger import ROOT
import unittest

class ClaimsLeases(unittest.TestCase):
    bin=None
    pg_run=classmethod(agents.AgentCommands.pg_run.__func__)
    sql=classmethod(agents.AgentCommands.sql.__func__)
    tearDownClass=classmethod(agents.AgentCommands.tearDownClass.__func__)
    cmd=agents.AgentCommands.cmd
    ok=agents.AgentCommands.ok
    fixture=agents.AgentCommands.fixture
    request=agents.AgentCommands.request
    @classmethod
    def setUpClass(cls):
        agents.AgentCommands.setUpClass.__func__(cls)
        cls.sql((ROOT/'migrations/master/003-claims-leases.sql').read_text(),database='ledger_test',raw=True)

    def setup(self,paths=None,work=None,role='implementer'):
        if work is None:
            p=self.fixture();work=p+'w'
            self.ok('transition',work,1,state='ready')
            self.sql("UPDATE master.nodes SET body=body||'%s'::jsonb WHERE id='%s';"%(json.dumps({'source':{'repository':'jxwalker/ariadne'},'pathScope':paths or ['synthetic/'+p]}),work),database='ledger_test',raw=True)
        cap='synthetic-'+uuid.uuid4().hex;source=cap+'-source'
        ops=['packet','claim','renew','release','handover','resume','receipt','update','transition','retainedEvidence','review','evaluate']
        self.sql("INSERT INTO master.agent_capabilities(id,agent_identity,harness,execution_source,key_ref,repositories,eligible_work_ids,allowed_operations,expires_at) VALUES('%s','agent:%s','synthetic-codex','%s','%s',ARRAY['jxwalker/ariadne'],ARRAY['%s'],ARRAY[%s],now()+interval '1 hour'); INSERT INTO master.agent_roles VALUES('%s','%s');"%(cap,cap,source,cap,work,','.join("'%s'"%v for v in ops),cap,role),database='ledger_test',raw=True)
        self.sql("SET SESSION AUTHORIZATION ariadne_master; SELECT master.bind_work('%s','jxwalker/ariadne','run','%s','%s','synthetic-approved');"%(source,cap,work),database='ledger_test',raw=True)
        rev=self.sql("SELECT to_jsonb(revision) FROM master.nodes WHERE id='%s';"%work,database='ledger_test')
        gen=self.sql("SELECT body->'generation' FROM master.nodes WHERE id='%s';"%work,database='ledger_test')
        return cap,dict(target=work,repository='jxwalker/ariadne',nativeKind='run',nativeId=cap,keyRef=cap,op='claim',expectedRevision=rev,generation=gen,idempotencyKey=str(uuid.uuid4()),reason='synthetic')
    def send(self,cap,c,op,**kw):
        return self.request(cap,{**c,'op':op,'idempotencyKey':str(uuid.uuid4()),**kw})
    def claim(self,cap,c,**kw):
        r=self.send(cap,c,'claim',**kw);self.assertTrue(r['ok'],r)
        return {**c,'expectedRevision':r['revision'],'generation':r['generation'],'assignmentId':r['assignmentId']}
    def start(self,cap,c):
        for state in ['received','acknowledged','started']:
            self.assertTrue(self.send(cap,c,'receipt',state=state)['ok'])
    def test_two_contenders_duplicate_writer_and_scopes(self):
        a,c=self.setup(['synthetic/shared']);b,d=self.setup(work=c['target'])
        with ThreadPoolExecutor(2) as pool:r=list(pool.map(lambda pair:self.send(*pair,'claim'),[(a,c),(b,d)]))
        self.assertEqual(sum(x['ok'] for x in r),1,r)
        winner=r[0] if r[0]['ok'] else r[1];cap=a if r[0]['ok'] else b;req=c if r[0]['ok'] else d
        self.assertFalse(self.send(cap,{**req,'expectedRevision':winner['revision']},'claim')['ok'])
        other,e=self.setup(['synthetic/shared/child']);self.assertEqual(self.send(other,e,'claim')['error'],'exclusive scope conflict')
        sibling,f=self.setup(['synthetic/shared-other']);self.claim(sibling,f)
    def test_expiry_takeover_stale_owner_and_evidence(self):
        a,c=self.setup();owned=self.claim(a,c,leaseSeconds=1);time.sleep(1.1)
        b,d=self.setup(work=c['target']);new=self.claim(b,d);self.assertGreater(new['generation'],owned['generation'])
        for op in ['renew','release','handover','update','transition']:
            self.assertFalse(self.send(a,owned,op,patch={'nextAction':'late'})['ok'])
        self.assertTrue(self.send(a,owned,'retainedEvidence',evidence={'uri':'synthetic://retained'})['retainedOnly'])
        self.assertFalse(self.send(a,owned,'heartbeat')['ok'])
    def test_handover_resume_offline_and_idempotency(self):
        a,c=self.setup();owned=self.claim(a,c);self.start(a,owned)
        update={**owned,'op':'update','patch':{'nextAction':'synthetic action'},'idempotencyKey':'synthetic-effect'}
        r=self.request(a,update);self.assertTrue(r['ok'],r);owned['expectedRevision']=r['revision']
        hand=dict(branch='synthetic/branch',revision='a'*40,changedPaths=['synthetic/a'],checks=['synthetic check'],evidenceRefs=['synthetic://evidence'],remainingWork=['resume'],blockers=[],nextAction='resume',localWork=['synthetic patch'])
        self.assertTrue(self.send(a,owned,'handover',handover=hand)['ok'])
        b,d=self.setup(work=c['target']);new=self.claim(b,d);self.start(b,new)
        self.assertEqual(self.send(b,new,'update',patch={'nextAction':'oops'})['error'],'environment verification required')
        self.assertEqual(self.send(b,new,'resume',branch='wrong',revision='a'*40)['error'],'environment mismatch')
        self.assertTrue(self.send(b,new,'resume',branch=hand['branch'],revision=hand['revision'])['ok'])
        packet=self.send(b,new,'packet')['work'];self.assertEqual(packet['handover'],hand)
        replay={**new,'op':'update','patch':update['patch'],'idempotencyKey':'synthetic-effect'}
        self.assertEqual(self.request(b,replay),r)
        human_rev=self.ok('update',c['target'],new['expectedRevision'],patch={'nextAction':'human edit while offline'})
        # Applied effect recovery must precede stale revision rejection.
        self.assertEqual(self.request(b,replay),r)
        stale=self.send(b,new,'update',patch={'nextAction':'offline overwrite'})
        self.assertEqual(stale['error'],'revision conflict');self.assertEqual(stale['current']['revision'],human_rev)
        self.assertEqual(self.send(b,new,'packet')['work']['nextAction'],'human edit while offline')
    def test_role_boundaries_receipts_and_release(self):
        a,c=self.setup();owned=self.claim(a,c)
        self.assertFalse(self.send(a,owned,'receipt',state='started')['ok'])
        self.start(a,owned)
        self.assertTrue(self.send(a,owned,'receipt',state='acknowledged')['ok'])
        self.assertTrue(self.send(a,owned,'renew')['ok'])
        for role,allowed,denied in [('reviewer','review','evaluate'),('evaluator','evaluate','review')]:
            cap,req=self.setup(work=c['target'],role=role)
            self.assertTrue(self.send(cap,req,allowed,evidence={'synthetic':True})['ok'])
            for op in [denied,'claim','renew','release','update','transition']:
                self.assertFalse(self.send(cap,req,op,evidence={'synthetic':True})['ok'])
        self.assertFalse(self.send(a,owned,'review',evidence={'synthetic':True})['ok'])
        self.assertTrue(self.send(a,owned,'release')['ok']);self.assertFalse(self.send(a,owned,'renew')['ok'])
    def test_restart_dump_restore_pending_handover_commands(self):
        a,c=self.setup();owned=self.claim(a,c);self.start(a,owned)
        command={**owned,'op':'update','patch':{'nextAction':'synthetic external action reference'},'idempotencyKey':'synthetic-external-action'}
        r=self.request(a,command);self.assertTrue(r['ok']);owned['expectedRevision']=r['revision']
        self.assertTrue(self.send(a,owned,'handover',handover=dict(branch='synthetic/restart',revision='b'*40,changedPaths=[],checks=[],evidenceRefs=[],remainingWork=[],blockers=[],nextAction='resume',localWork=[]))['ok'])
        b,d=self.setup(work=c['target']);new=self.claim(b,d)
        before=self.send(b,new,'packet')['work']
        self.pg_run('pg_ctl','-D',str(self.data),'-l',str(self.dir/'postgres.log'),'-m','fast','-w','restart')
        after=self.send(b,new,'packet')['work'];before.pop('recentReceipts');after.pop('recentReceipts');self.assertEqual(before,after)
        dump=self.dir/'slice2.dump';self.pg_run('pg_dump','-h',str(self.socket),'-p','55433','-d','ledger_test','-Fc','-f',str(dump));self.sql('CREATE DATABASE slice2_restore;')
        self.pg_run('pg_restore','-h',str(self.socket),'-p','55433','-d','slice2_restore',str(dump))
        literal=json.dumps(command).replace("'","''")
        restored=self.sql("SELECT master.agent_request('%s','%s','%s');"%(a,uuid.uuid4(),literal),database='slice2_restore')
        self.assertEqual(restored,r)
        for table in ['commands','assignments','assignment_receipts','handovers','work_effects']:
            q='SELECT to_jsonb(count(*)) FROM master.'+table+';'
            self.assertEqual(self.sql(q,database='ledger_test'),self.sql(q,database='slice2_restore'))
        self.sql('DROP DATABASE slice2_restore;')

    def test_synthetic_client_spool_offline_reconciliation(self):
        import tempfile
        from agent_spool import enqueue, flush
        a,c=self.setup();owned=self.claim(a,c);self.start(a,owned)
        command={**owned,'op':'update','patch':{'nextAction':'offline action'},'idempotencyKey':'synthetic-offline'}
        with tempfile.TemporaryDirectory() as directory:
            path=enqueue(directory,command)
            flush({'spool':directory},lambda *_: (_ for _ in ()).throw(ConnectionError('synthetic offline')))
            self.assertTrue(path.exists())
            rev=self.ok('update',c['target'],owned['expectedRevision'],patch={'nextAction':'human survives'})
            flush({'spool':directory},lambda _,payload:self.request(a,payload))
            self.assertTrue(path.exists())
            receipt=json.loads(path.with_name(path.name+'.receipt').read_text())
            self.assertEqual(receipt['error'],'revision conflict');self.assertEqual(receipt['current']['revision'],rev)
            self.assertEqual(self.send(a,owned,'packet')['work']['nextAction'],'human survives')

    def test_synthetic_unacknowledged_expiry_and_queue_bound(self):
        a,c=self.setup();owned=self.claim(a,c,leaseSeconds=1);time.sleep(1.1)
        self.assertFalse(self.send(a,owned,'receipt',state='received')['ok'])
        self.assertEqual(self.send(a,owned,'packet')['work']['assignments'],[])
        # Bounded filesystem queue without discarding commands.
        import tempfile
        from agent_spool import enqueue
        with tempfile.TemporaryDirectory() as directory:
            for index in range(100):enqueue(directory,{'idempotencyKey':'synthetic-'+str(index)})
            with self.assertRaisesRegex(ValueError,'spool full'):enqueue(directory,{'idempotencyKey':'synthetic-overflow'})

    def test_synthetic_acknowledged_offer_cannot_start_after_expiry(self):
        a,c=self.setup();owned=self.claim(a,c,leaseSeconds=1)
        for state in ['received','acknowledged']:self.assertTrue(self.send(a,owned,'receipt',state=state)['ok'])
        self.assertTrue(self.send(a,owned,'renew',leaseSeconds=30)['ok'])
        time.sleep(1.1)
        self.assertFalse(self.send(a,owned,'receipt',state='started')['ok'])

    def test_synthetic_spool_sequence_and_http_conflict(self):
        import tempfile, pathlib, io, urllib.error
        from unittest.mock import patch
        from agent_spool import enqueue,flush,send
        with tempfile.TemporaryDirectory() as directory:
            for index in range(3):enqueue(directory,{'idempotencyKey':'synthetic-order-'+str(index),'index':index})
            seen=[]
            flush({'spool':directory},lambda _,c:seen.append(c['index']) or {'ok':True})
            self.assertEqual(seen,[0,1,2])
            bad=enqueue(directory,{'idempotencyKey':'synthetic-rejected'})
            flush({'spool':directory},lambda *_:{'ok':False,'current':{'revision':9}})
            with patch('agent_spool.send') as transport:
                flush({'spool':directory},transport);transport.assert_not_called()
            self.assertTrue(bad.exists())
        error=urllib.error.HTTPError('https://synthetic.invalid',409,'conflict',{},io.BytesIO(b'{"ok":false,"current":{"revision":9}}'))
        with patch('urllib.request.urlopen',side_effect=error):
            result=send({'origin':'https://synthetic.invalid','capabilityId':'synthetic','secret':'synthetic'}, {'idempotencyKey':'synthetic'})
            self.assertEqual(result['current']['revision'],9)

    def test_synthetic_takeover_without_handover_requires_environment(self):
        a,c=self.setup();owned=self.claim(a,c,leaseSeconds=1);time.sleep(1.1)
        b,d=self.setup(work=c['target']);new=self.claim(b,d);self.start(b,new)
        self.assertFalse(self.send(b,new,'update',patch={'nextAction':'unverified'})['ok'])
        self.assertEqual(self.send(b,new,'resume',branch='unknown',revision='a'*40)['error'],'environment baseline unavailable')
