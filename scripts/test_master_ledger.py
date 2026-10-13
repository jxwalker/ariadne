"""Real PostgreSQL contract tests in a disposable socket-only cluster, never the live DB."""
from concurrent.futures import ThreadPoolExecutor
import json, os, pathlib, shutil, subprocess, tempfile, unittest, uuid
ROOT=pathlib.Path(__file__).resolve().parents[1]

def pg_bin():
    candidates=sorted(pathlib.Path('/usr/lib/postgresql').glob('*/bin/initdb'),reverse=True)
    return candidates[0].parent if candidates else None

class LedgerContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bin=pg_bin()
        if not cls.bin: raise unittest.SkipTest('PostgreSQL server binaries unavailable')
        cls.temp=tempfile.TemporaryDirectory(prefix='ariadne-ledger-test-')
        cls.dir=pathlib.Path(cls.temp.name); cls.data=cls.dir/'data'; cls.socket=cls.dir/'socket';cls.socket.mkdir()
        cls.pg_run('initdb','-D',str(cls.data),'--auth-local=trust','--auth-host=reject','--no-locale','--encoding=UTF8')
        cls.pg_run('pg_ctl','-D',str(cls.data),'-l',str(cls.dir/'postgres.log'),'-o',f"-k {cls.socket} -p 55433 -c listen_addresses=''",'-w','start')
        cls.sql("CREATE DATABASE ledger_test;")
        cls.sql((ROOT/'migrations/master/001-ledger.sql').read_text(),database='ledger_test',raw=True)
    @classmethod
    def tearDownClass(cls):
        if hasattr(cls,'data'):cls.pg_run('pg_ctl','-D',str(cls.data),'-m','fast','-w','stop');cls.temp.cleanup()
    @classmethod
    def pg_run(cls,*args):
        return subprocess.run([str(cls.bin/args[0]),*args[1:]],check=True,capture_output=True,text=True).stdout
    @classmethod
    def sql(cls,text,database='postgres',raw=False):
        p=subprocess.run([str(cls.bin/'psql'),'-XqAt','-v','ON_ERROR_STOP=1','-h',str(cls.socket),'-p','55433','-d',database],input=text,text=True,capture_output=True)
        if p.returncode: raise AssertionError(p.stderr)
        if raw:return p.stdout
        return json.loads(p.stdout) if p.stdout.strip() else None
    def cmd(self,op,target,rev=0,actor='james',**kw):
        c=dict(commandId=kw.pop('commandId',str(uuid.uuid4())),op=op,target=target,expectedRevision=rev,reason='contract test',**kw)
        result=self.sql("SELECT master.command('%s','%s');"%(actor,json.dumps(c).replace("'","''")),database='ledger_test')
        return result
    def ok(self,*a,**kw):
        r=self.cmd(*a,**kw);self.assertTrue(r['ok'],r);return r['revision']
    def fixture(self, two_criteria=False):
        p='t'+uuid.uuid4().hex[:10]
        self.ok('create',p,kind='product',body={'title':p})
        self.ok('create',p+'b',kind='baseline',parent=p,body={'title':'v1','state':'proposed'})
        self.ok('create',p+'p',kind='phase',parent=p+'b',body={'title':'Phase'})
        self.ok('create',p+'m',kind='milestone',parent=p+'p',body={'title':'Milestone'})
        self.ok('create',p+'policy',kind='policy',body={'requiredKinds':['ci','runtime'],'maxAgeSeconds':3600})
        for suffix in ['w','x']:
            self.ok('create',p+suffix,kind='work',parent=p+'m',body={'title':suffix,'goal':'outcome','owner':'agent:bot','policy':p+'policy','criteria':[{'id':p+suffix+'c','text':'works'}]+([{'id':p+suffix+'c2','text':'second outcome'}] if two_criteria and suffix=='w' else []),'candidate':'a'*40})
        self.ok('scope',p+'b',1,scope=[{'workId':p+'w','criterionId':p+'wc'},{'workId':p+'x','criterionId':p+'xc'}]+([{'workId':p+'w','criterionId':p+'wc2'}] if two_criteria else []),scopeDiff={'added':2})
        self.ok('approve',p+'b',2)
        return p
    def test_concurrency_idempotency_and_graph(self):
        p=self.fixture(); w=p+'w';cid=str(uuid.uuid4())
        self.ok('update',w,1,commandId=cid,patch={'nextAction':'start'})
        self.assertEqual(self.cmd('update',w,1,commandId=cid,patch={'nextAction':'start'})['revision'],2)
        self.assertFalse(self.cmd('update',w,1,commandId=cid,patch={'nextAction':'changed'})['ok'])
        self.assertFalse(self.cmd('update',w,1,patch={'nextAction':'stale'})['ok'])
        self.ok('dependencies',w,2,dependencies=['unknown'])
        self.assertFalse(self.cmd('transition',w,3,state='ready')['ok'])
        self.ok('dependencies',w,3,dependencies=[p+'x'])
        self.assertFalse(self.cmd('dependencies',p+'x',1,dependencies=[w])['ok'])
        self.assertFalse(self.cmd('transition',w,4,state='ready')['ok'])
        self.ok('dependencies',w,4,dependencies=[])
        self.ok('transition',w,5,state='ready')
    def test_real_competing_writers(self):
        p=self.fixture();w=p+'w'
        with ThreadPoolExecutor(max_workers=2) as pool:
            results=list(pool.map(lambda value:self.cmd('update',w,1,patch={'nextAction':value}),['writer one','writer two']))
        self.assertEqual(sum(r['ok'] for r in results),1)
        self.assertTrue(any(r.get('error')=='revision conflict' for r in results))

    def test_application_role_transport(self):
        self.sql("CREATE ROLE ariadne_master LOGIN; REVOKE ALL ON DATABASE ledger_test FROM PUBLIC; GRANT CONNECT ON DATABASE ledger_test TO ariadne_master; REVOKE ALL ON SCHEMA public FROM PUBLIC; GRANT USAGE ON SCHEMA master TO ariadne_master; GRANT EXECUTE ON FUNCTION master.command(text,jsonb),master.snapshot() TO ariadne_master;",database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):self.sql('SET SESSION AUTHORIZATION ariadne_master; CREATE SCHEMA forbidden;',database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):self.sql('SET SESSION AUTHORIZATION ariadne_master; DELETE FROM master.journal;',database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):self.sql("SET SESSION AUTHORIZATION ariadne_master; SELECT master.command('agent:bot','{\"commandId\":\"transport-test\",\"target\":\"unknown\"}');",database='ledger_test',raw=True)
        result=self.sql('SET SESSION AUTHORIZATION ariadne_master; SELECT jsonb_typeof(master.snapshot());',database='ledger_test',raw=True)
        self.assertIn('object',result)

    def test_acceptance_and_permissions(self):
        p=self.fixture();w=p+'w';rev=1
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state,actor='agent:bot')
        self.assertFalse(self.cmd('accept',w,rev,actor='agent:bot')['ok'])
        self.assertFalse(self.cmd('approve',p+'b',3,actor='agent:bot')['ok'])
        self.assertFalse(self.cmd('override',w,rev,actor='agent:bot')['ok'])
        self.assertFalse(self.cmd('update',w,rev,actor='agent:other',patch={'nextAction':'take'})['ok'])
        self.assertFalse(self.cmd('accept',w,rev)['ok'])
        future=self.sql("SELECT to_jsonb(now()+interval '1 day');",database='ledger_test')
        for waived in [{},{'waivedCriteria':None},{'waivedCriteria':{}},{'waivedCriteria':[]}]:
            self.assertFalse(self.cmd('override',w,rev,risk='recorded risk',expiresAt=future,**waived)['ok'])
        variants=[{'kind':'agent_run'},{'observedAt':'2000-01-01T00:00:00Z'},{'candidate':'b'*40},{'synthetic':True},{'policy':'unrelated'},{'status':'skipped'}]
        for variant in variants:
            e={'id':str(uuid.uuid4()),'kind':'ci','criterionId':p+'wc','candidate':'a'*40,'policy':p+'policy','status':'passed','synthetic':False,'sha256':'a'*64,'observedAt':'2026-10-13T17:00:00Z','uri':'https://example.invalid/proof',**variant}
            # Use DB clock for eligible evidence, so the test is date independent.
            if 'observedAt' not in variant:e['observedAt']=self.sql("SELECT to_jsonb(now());",database='ledger_test')
            rev=self.ok('evidence',w,rev,evidence=e)
            self.assertFalse(self.cmd('accept',w,rev)['ok'])
        for kind in ['ci','runtime']:
            rev=self.ok('evidence',w,rev,evidence={'id':str(uuid.uuid4()),'kind':kind,'criterionId':p+'wc','candidate':'a'*40,'policy':p+'policy','status':'passed','synthetic':False,'sha256':'a'*64,'observedAt':self.sql('SELECT to_jsonb(now());',database='ledger_test'),'uri':'https://example.invalid/proof'})
        rev=self.ok('accept',w,rev)
        self.assertFalse(self.cmd('update',w,rev,patch={'candidate':'b'*40})['ok'])
        progress=self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b'),database='ledger_test')
        self.assertEqual((progress['accepted_criteria'],progress['denominator']),(1,2))
        self.assertFalse(self.cmd('scope',p+'b',3,scope=[],scopeDiff={})['ok'])
        linked=self.sql("SELECT to_jsonb(count(*)) FROM master.acceptance_evidence WHERE work_id='%s';"%w,database='ledger_test')
        self.assertEqual(linked,2)
    def test_restart_backup_restore_history(self):
        p=self.fixture();self.ok('update',p+'w',1,patch={'nextAction':'persist this'})
        before=self.sql('SELECT master.snapshot();',database='ledger_test')
        self.pg_run('pg_ctl','-D',str(self.data),'-l',str(self.dir/'postgres.log'),'-m','fast','-w','restart')
        self.assertEqual(before,self.sql('SELECT master.snapshot();',database='ledger_test'))
        dump=self.dir/'ledger.dump'
        self.pg_run('pg_dump','-h',str(self.socket),'-p','55433','-d','ledger_test','-Fc','-f',str(dump))
        self.sql('CREATE DATABASE ledger_restore;')
        self.pg_run('pg_restore','-h',str(self.socket),'-p','55433','-d','ledger_restore',str(dump))
        self.assertEqual(before,self.sql('SELECT master.snapshot();',database='ledger_restore'))
        self.sql('DROP DATABASE ledger_restore;')
    def test_imports_and_split_denominator(self):
        from master_import import compile_import
        commands=compile_import()
        literal=json.dumps(commands).replace("'","''")
        results=self.sql("SELECT jsonb_agg(master.command('james',value) ORDER BY ord) FROM jsonb_array_elements('%s'::jsonb) WITH ORDINALITY AS c(value,ord);"%literal,database='ledger_test')
        self.assertTrue(all(r['ok'] for r in results),[r for r in results if not r['ok']][:5])
        snapshot=self.sql('SELECT master.snapshot();',database='ledger_test')
        self.assertEqual(len([n for n in snapshot['nodes'] if n['kind']=='product' and n['id'].startswith('product:')]),3)
        self.assertTrue(all(n['body']['state']=='proposed' for n in snapshot['nodes'] if n['kind']=='baseline' and n['id'].startswith('baseline:')))
        p=self.fixture(two_criteria=True);w=p+'w';rev=1
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        for criterion in [p+'wc',p+'wc2']:
            for kind in ['ci','runtime']:
                rev=self.ok('evidence',w,rev,evidence={'id':str(uuid.uuid4()),'kind':kind,'criterionId':criterion,'candidate':'a'*40,'policy':p+'policy','status':'passed','synthetic':False,'sha256':'a'*64,'observedAt':self.sql('SELECT to_jsonb(now());',database='ledger_test'),'uri':'https://example.invalid/proof'})
        rev=self.ok('accept',w,rev)
        self.ok('dependencies',p+'x',1,dependencies=[w])
        # Two mandatory criteria remain two commitments after split and revision.
        before=self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b'),database='ledger_test')
        self.assertFalse(self.cmd('split',w,rev,children=[{'id':p+'s1','title':'one','criteria':[{'id':p+'wc'}]},{'id':p+'s2','title':'two','criteria':[{'id':p+'new'}]}])['ok'])
        self.ok('split',w,rev,children=[{'id':p+'s1','title':'one','criteria':[{'id':p+'wc'}]},{'id':p+'s2','title':'two','criteria':[{'id':p+'wc2'}]}])
        self.assertEqual(before,self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b'),database='ledger_test'))
        self.assertEqual(self.sql("SELECT master.blockers('%s');"%(p+'x'),database='ledger_test'),[])
        self.ok('transition',p+'x',3,state='ready')
        for child in [p+'s1',p+'s2']:
            self.assertEqual(self.sql("SELECT to_jsonb(count(*)) FROM master.journal WHERE target='%s';"%child,database='ledger_test'),1)
        self.ok('create',p+'b2',kind='baseline',parent=p,body={'title':'revision v2','state':'proposed','previousBaseline':p+'b'})
        self.ok('scope',p+'b2',1,scope=[{'workId':p+'s1','criterionId':p+'wc'},{'workId':p+'x','criterionId':p+'xc'},{'workId':p+'s2','criterionId':p+'wc2'}],scopeDiff={'split':w,'denominatorDelta':0})
        after=self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b2'),database='ledger_test')
        self.assertEqual(before['denominator'],after['denominator'])
        self.assertEqual((before['accepted_criteria'],after['accepted_criteria']),(2,2))

    def test_scope_product_boundary(self):
        a=self.fixture();b=self.fixture()
        self.ok('create',a+'b2',kind='baseline',parent=a,body={'title':'revision','state':'proposed'})
        self.assertFalse(self.cmd('scope',a+'b2',1,scope=[{'workId':b+'w','criterionId':b+'wc'}],scopeDiff={})['ok'])

    def test_partial_scope_cannot_ready_or_accept(self):
        p=self.fixture(two_criteria=True);w=p+'w'
        # Deliberately create a baseline covering only one of this work's outcomes.
        self.sql("DELETE FROM master.scope WHERE baseline_id='%s' AND criterion_id='%s';"%(p+'b',p+'wc2'),database='ledger_test',raw=True)
        self.assertFalse(self.cmd('transition',w,1,state='ready')['ok'])
        self.sql("UPDATE master.nodes SET body=body||'{\"state\":\"verification\"}' WHERE id='%s';"%w,database='ledger_test',raw=True)
        self.assertIn('scope not approved',self.cmd('accept',w,1)['error'])

    def test_excluded_import_scope(self):
        from master_import import compile_import
        commands=compile_import()
        excluded={c['target']:c['body']['scopeExclusion'] for c in commands if c.get('body',{}).get('scopeExclusion')}
        self.assertEqual(len(excluded),4)
        scoped={e['workId'] for c in commands if c['op']=='scope' for e in c['scope']}
        self.assertFalse(set(excluded)&scoped)
        self.assertEqual(excluded['work:openscorpion:quota'],'Deferred by DEC-002 A')

    def test_resolution_dependencies_cancellation_and_blocker_age(self):
        p=self.fixture();w=p+'w'
        self.assertFalse(self.cmd('transition',w,1,actor='agent:bot',state='cancelled')['ok'])
        rev=self.ok('transition',w,1,state='blocked')
        body=self.sql("SELECT body FROM master.nodes WHERE id='%s';"%w,database='ledger_test')
        self.assertRegex(body['blockerSince'],r'T.*Z$')
        rev=self.ok('update',w,rev,patch={'blocker':None})
        body=self.sql("SELECT body FROM master.nodes WHERE id='%s';"%w,database='ledger_test')
        self.assertNotIn('blockerSince',body)
        rev=self.ok('transition',w,rev,state='ready')
        self.ok('create',p+'gap',kind='external',body={'title':'gap'})
        rev=self.ok('dependencies',w,rev,dependencies=[p+'gap'])
        journal=self.sql("SELECT to_jsonb(j) FROM master.journal j WHERE target='%s' ORDER BY sequence DESC LIMIT 1;"%w,database='ledger_test')
        self.assertEqual(journal['before_state']['dependencies'],[])
        self.assertEqual(journal['after_state']['dependencies'],[p+'gap'])
        self.assertEqual(self.sql("SELECT body->'state' FROM master.nodes WHERE id='%s';"%w,database='ledger_test'),'proposed')
        self.assertFalse(self.cmd('resolve',p+'gap',1,actor='agent:bot',resolution='proof obtained')['ok'])
        self.ok('resolve',p+'gap',1,resolution='proof obtained')
        self.assertEqual(self.sql("SELECT master.blockers('%s');"%w,database='ledger_test'),[])
        rev=self.ok('transition',w,rev,state='ready',via='ariadne-bot/codex')
        self.assertEqual(self.sql("SELECT to_jsonb(j) FROM master.journal j WHERE target='%s' ORDER BY sequence DESC LIMIT 1;"%w,database='ledger_test')['via'],'ariadne-bot/codex')

    def test_policy_kinds_and_exact_waiver_scope(self):
        p=self.fixture();w=p+'w'
        for kinds in [['c1'],['ci','ci'],['agent_run'],['ci',None],[42],[],None,{}]:
            result=self.cmd('create',p+'badpolicy',kind='policy',body={'requiredKinds':kinds,'maxAgeSeconds':3600})
            self.assertFalse(result['ok'],kinds)
        rev=1
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        expiry=self.sql("SELECT to_jsonb(now()+interval '1 day');",database='ledger_test')
        for criteria in [[p+'wc','unrelated'],[p+'wc',p+'wc'],[p+'wc',None],['misspelled']]:
            self.assertFalse(self.cmd('override',w,rev,waivedCriteria=criteria,risk='risk',expiresAt=expiry)['ok'])
        self.ok('override',w,rev,waivedCriteria=[p+'wc'],risk='risk',expiresAt=expiry)

    def test_root_parent_cannot_break_portfolio_traversal(self):
        p='root'+uuid.uuid4().hex[:10]
        self.assertFalse(self.cmd('create',p,kind='product',parent=p,body={'title':'cyclic'})['ok'])
        self.ok('create',p,kind='product',body={'title':'valid product'})
        self.assertFalse(self.cmd('create',p+'decision',kind='decision',parent=p,body={'title':'invalid parent'})['ok'])
        snapshot=self.sql('SELECT master.snapshot();',database='ledger_test')
        from master_dashboard import render
        self.assertIn('valid product',render(snapshot,'/roadmaps',{}))

    def test_waiver_progress_and_expiry(self):
        p=self.fixture();w=p+'w';rev=1
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        expiry=self.sql("SELECT to_jsonb(now()+interval '1 day');",database='ledger_test')
        self.ok('override',w,rev,waivedCriteria=[p+'wc'],risk='operator risk',expiresAt=expiry)
        progress=self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b'),database='ledger_test')
        self.assertEqual((progress['accepted_criteria'],progress['waived_criteria']),(0,1))
        body=self.sql("SELECT body FROM master.nodes WHERE id='%s';"%w,database='ledger_test')
        self.assertEqual(body['acceptanceMode'],'waiver');self.assertEqual(body['waiver']['expiresAt'],expiry)

    def test_root_parent_links_rejected(self):
        p=self.fixture()
        for kind,body in [('product',{}),('policy',{'requiredKinds':['ci'],'maxAgeSeconds':3600}),('decision',{}),('external',{})]:
            target=p+'root-'+kind
            for parent in [target,p]:
                self.assertFalse(self.cmd('create',target,kind=kind,parent=parent,body=body)['ok'])
            self.ok('create',target,kind=kind,body=body)

    def test_owner_generation_and_reference_validation(self):
        p=self.fixture();w=p+'w';rev=1
        for refs in ['bad',{'url':'x'},[None],['bad']]:
            self.assertFalse(self.cmd('update',w,rev,patch={'refs':refs})['ok'])
            self.assertFalse(self.cmd('create',p+'badrefs',kind='work',parent=p+'m',body={'goal':'test','policy':p+'policy','criteria':[{'id':p+'badc','text':'test'}],'refs':refs})['ok'])
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        def proof(kind,generation=None):
            result={'id':str(uuid.uuid4()),'kind':kind,'criterionId':p+'wc','candidate':'a'*40,'policy':p+'policy','status':'passed','synthetic':False,'sha256':'a'*64,'observedAt':self.sql('SELECT to_jsonb(now());',database='ledger_test'),'uri':'https://example.invalid/proof'}
            if generation is not None:result['generation']=generation
            return result
        for kind in ['ci','runtime']:rev=self.ok('evidence',w,rev,evidence=proof(kind))
        rev=self.ok('update',w,rev,patch={'owner':'agent:new'})
        body=self.sql("SELECT body FROM master.nodes WHERE id='%s';"%w,database='ledger_test')
        self.assertEqual((body['generation'],body['state']),(2,'proposed'))
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        self.assertFalse(self.cmd('accept',w,rev)['ok'])
        self.assertFalse(self.cmd('evidence',w,rev,evidence=proof('ci',1))['ok'])
        for kind in ['ci','runtime']:rev=self.ok('evidence',w,rev,evidence=proof(kind))
        self.ok('accept',w,rev)

    def test_display_shapes_and_managed_fields(self):
        p=self.fixture()
        body={'goal':'test','policy':p+'policy','criteria':[{'id':p+'shape-c','text':'test'}]}
        for value in [None,42,'unexpected',[]]:
            self.assertFalse(self.cmd('create',p+'source-shape',kind='work',parent=p+'m',body=body|{'source':value})['ok'])
        for value in [None,42,'unexpected',{}]:
            self.assertFalse(self.cmd('create',p+'options-shape',kind='decision',body={'options':value})['ok'])
        for patch in [{'waiver':{}},{'splitFrom':{}},{'blockerSince':42},{'acceptedBy':'james'},{'generation':1}]:
            self.assertFalse(self.cmd('create',p+'managed-shape',kind='work',parent=p+'m',body=body|patch)['ok'])
        for criterion in [{'id':{},'text':'test'},{'id':42,'text':'test'},{'id':'shape','text':42}]:
            self.assertFalse(self.cmd('create',p+'criteria-shape',kind='work',parent=p+'m',body=body|{'criteria':[criterion]})['ok'])
        self.ok('create',p+'source-shape',kind='work',parent=p+'m',body=body|{'source':{}})
        self.ok('create',p+'options-shape',kind='decision',body={'options':[]})

    def test_expired_waiver_blocks_dependencies_without_erasing_history(self):
        p=self.fixture();w=p+'w';x=p+'x';rev=1
        for state in ['ready','active','verification']:rev=self.ok('transition',w,rev,state=state)
        self.assertFalse(self.cmd('override',w,rev,waivedCriteria=[p+'wc'],risk='test risk',expiresAt='infinity')['ok'])
        expiry=self.sql("SELECT to_jsonb(now()+interval '3 seconds');",database='ledger_test')
        self.ok('override',w,rev,waivedCriteria=[p+'wc'],risk='test risk',expiresAt=expiry)
        xrev=self.ok('dependencies',x,1,dependencies=[w])
        self.assertEqual(self.sql("SELECT master.blockers('%s');"%x,database='ledger_test'),[])
        for state in ['ready','active','verification']:xrev=self.ok('transition',x,xrev,state=state)
        accepted=self.sql("SELECT to_jsonb(a) FROM master.accepted a WHERE work_id='%s';"%w,database='ledger_test')
        self.sql("SELECT pg_sleep(greatest(0,extract(epoch FROM ('%s'::timestamptz-now())))::double precision+0.05);"%expiry,database='ledger_test',raw=True)
        blockers=self.sql("SELECT master.blockers('%s');"%x,database='ledger_test')
        self.assertEqual(blockers[0]['reason'],'expired or invalid waiver')
        for state in ['ready','active','verification']:
            self.assertFalse(self.cmd('transition',x,xrev,state=state)['ok'])
        self.assertFalse(self.cmd('accept',x,xrev)['ok'])
        self.assertEqual(self.sql("SELECT to_jsonb(a) FROM master.accepted a WHERE work_id='%s';"%w,database='ledger_test'),accepted)
        self.assertTrue(next(n for n in self.sql('SELECT master.snapshot();',database='ledger_test')['nodes'] if n['id']==w)['waiverInactive'])
        progress=self.sql("SELECT to_jsonb(p) FROM master.progress p WHERE baseline_id='%s';"%(p+'b'),database='ledger_test')
        self.assertEqual(progress['expired_waived_criteria'],1)

    def test_append_only(self):
        with self.assertRaises(AssertionError):self.sql('DELETE FROM master.journal;',database='ledger_test')

if __name__=='__main__':unittest.main()

    def test_operator_reply_resolves_aliased_master_decision_durably(self):
        from types import SimpleNamespace
        from unittest.mock import patch
        from activity_decisions import OperatorActions,hide_answered
        p='reply'+uuid.uuid4().hex[:10];repo='jxwalker/ariadne';source='box-ariadne-bot'
        self.ok('create',p,kind='decision',body={'title':'Known pilot decision','state':'open'},aliases=[{'source':source+'/'+repo,'alias':p}])
        app=SimpleNamespace(config={'operatorActions':{'enabled':True,'origin':'https://dashboard.example','allowedLogins':['operator@example'],'allowedClientIPs':['100.64.1.10']}},store=object(),sources=lambda:{})
        def read():return self.sql('SELECT master.snapshot();',database='ledger_test')
        def write(c):return self.sql("SELECT master.command('james','%s');"%json.dumps(c).replace("'","''"),database='ledger_test')
        actions=OperatorActions(app,read=read,write=write)
        headers={'Tailscale-User-Login':'operator@example','X-Forwarded-For':'100.64.1.10','Origin':'https://dashboard.example'}
        headers['X-Ariadne-CSRF']=actions.session(headers,'127.0.0.1')['csrfToken']
        question={'sourceId':source,'repo':repo,'runId':p+'run','requestId':p,'requestRevision':'a'*64,'kind':'explicit-decision','title':'Pilot','reason':'Choose a boundary','source':'Ariadne Bot','recommendation':'Operator only','options':['Operator only','Add agents']}
        body={'sourceId':source,'repo':repo,'requestId':p,'requestRevision':'a'*64,'commandId':str(uuid.uuid4()),'resolution':"Operator only; preserve James's decision"}
        with patch('activity_operating.operating',return_value={'needsYou':[question]}):
            self.assertEqual(actions.answer(headers,'127.0.0.1',body)['decisionId'],p)
            self.assertTrue(actions.answer(headers,'127.0.0.1',body)['duplicate'])
        ledger=read();node=next(n for n in ledger['nodes'] if n['id']==p)
        self.assertEqual(node['revision'],2);self.assertEqual(node['body']['resolution'],body['resolution'])
        self.assertEqual(node['body']['state'],'resolved');self.assertEqual(node['body']['requestRevision'],'a'*64)
        self.assertEqual(hide_answered({'needsYou':[question]},ledger)['needsYou'],[])
        self.assertEqual(actions.replies({'sourceId':source,'repository':repo,'runId':p+'run'})[0]['resolution'],body['resolution'])
        self.assertEqual(actions.replies({'sourceId':'other','repository':repo,'runId':p+'run'}),[])
        self.assertEqual(len([n for n in ledger['nodes'] if n['id']==p]),1)
        self.assertEqual(len([j for j in ledger['history'] if j['target']==p]),2)
