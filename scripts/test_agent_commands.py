"""Synthetic capability fixtures in a disposable socket-only PostgreSQL cluster."""
import json, uuid
import test_master_ledger as ledger
from test_master_ledger import ROOT
import unittest


class AgentCommands(unittest.TestCase):
    bin = None
    pg_run = classmethod(ledger.LedgerContract.pg_run.__func__)
    sql = classmethod(ledger.LedgerContract.sql.__func__)
    tearDownClass = classmethod(ledger.LedgerContract.tearDownClass.__func__)
    cmd = ledger.LedgerContract.cmd
    ok = ledger.LedgerContract.ok
    fixture = ledger.LedgerContract.fixture
    @classmethod
    def setUpClass(cls):
        ledger.LedgerContract.setUpClass.__func__(cls)
        cls.sql((ROOT/'migrations/master/002-agent-commands.sql').read_text(), database='ledger_test', raw=True)

    def setup_cap(self):
        p=self.fixture();w=p+'w';cap=p+'cap'
        self.ok('update',w,1,patch={'nextAction':'synthetic fixture'})
        self.sql("UPDATE master.nodes SET body=body||'{\"source\":{\"repository\":\"jxwalker/ariadne\"}}' WHERE id='%s';"%w,database='ledger_test',raw=True)
        self.sql("INSERT INTO master.agent_capabilities(id,agent_identity,harness,execution_source,key_ref,repositories,eligible_work_ids,allowed_operations,expires_at) VALUES('%s','agent:bot','synthetic-codex','synthetic-source','%s',ARRAY['jxwalker/ariadne'],ARRAY['%s'],ARRAY['update','transition','packet'],now()+interval '1 hour');"%(cap,cap,w),database='ledger_test',raw=True)
        c={'target':w,'repository':'jxwalker/ariadne','op':'update','patch':{'nextAction':'synthetic progress'},'reason':'synthetic','expectedRevision':2,'generation':1,'idempotencyKey':str(uuid.uuid4()),'keyRef':cap}
        return cap,c

    def request(self,cap,c,nonce=None):
        return self.sql("SELECT master.agent_request('%s','%s','%s');"%(cap,nonce or str(uuid.uuid4()),json.dumps(c).replace("'","''")),database='ledger_test')

    def test_synthetic_authorization_and_duplicates(self):
        cap,c=self.setup_cap();nonce=str(uuid.uuid4())
        result=self.request(cap,c,nonce);self.assertTrue(result['ok'],result)
        self.assertEqual(result,self.request(cap,c))
        self.assertFalse(self.request(cap,c,nonce)['ok'])
        self.assertFalse(self.request(cap,{**c,'patch':{'nextAction':'changed'}})['ok'])
        for change in [{'repository':'jxwalker/openscorpion'},{'target':'unknown'},{'generation':0},{'expectedRevision':1},
                       {'op':'approve'},{'op':'accept'},{'op':'scope'},{'patch':{'criteria':[]}},{'patch':{'owner':'agent:other'}}]:
            self.assertFalse(self.request(cap,{**c,**change,'idempotencyKey':str(uuid.uuid4())})['ok'],change)
        packet=self.request(cap,{**c,'op':'packet'});self.assertTrue(packet['ok']);self.assertNotIn('history',packet)
        self.sql("UPDATE master.agent_capabilities SET revoked_at=now() WHERE id='%s';"%cap,database='ledger_test',raw=True)
        self.assertFalse(self.request(cap,c)['ok'])

    def test_synthetic_expiry_owner_and_done(self):
        cap,c=self.setup_cap();w=c['target']
        self.ok('transition',w,2,state='ready');self.ok('transition',w,3,state='active')
        done={**c,'op':'transition','state':'Done','expectedRevision':4}
        self.assertTrue(self.request(cap,done)['ok'])
        self.assertEqual(self.sql("SELECT to_jsonb(body->>'state') FROM master.nodes WHERE id='%s';"%w,database='ledger_test'),'verification')
        self.ok('update',w,5,patch={'owner':'agent:other'})
        self.assertFalse(self.request(cap,{**c,'op':'packet'})['ok'])
        cap,c=self.setup_cap()
        self.sql("UPDATE master.agent_capabilities SET issued_at=now()-interval '2 hours',expires_at=now()-interval '1 hour' WHERE id='%s';"%cap,database='ledger_test',raw=True)
        self.assertFalse(self.request(cap,c)['ok'])


class TransportAuthentication(__import__('unittest').TestCase):
    def test_synthetic_observation_credentials_rejected(self):
        from agent_commands import handle
        from types import SimpleNamespace
        with self.assertRaises(PermissionError):
            handle(SimpleNamespace(config={'agentCommands':{'enabled':True}}),
                   {'X-Ariadne-Source':'synthetic-observer'},b'{}','POST','/api/agent/v1/commands',{})
