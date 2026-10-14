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
        self.sql("SELECT master.bind_work('synthetic-source','jxwalker/ariadne','run','%srun','%s','synthetic-operator-approval');"%(w,w),database='ledger_test',raw=True)
        c={'nativeKind':'run','nativeId':w+'run','target':w,'repository':'jxwalker/ariadne','op':'update','patch':{'nextAction':'synthetic progress'},'reason':'synthetic','expectedRevision':2,'generation':1,'idempotencyKey':str(uuid.uuid4()),'keyRef':cap}
        return cap,c

    def request(self,cap,c,nonce=None):
        return self.sql("SELECT master.agent_request('%s','%s','%s');"%(cap,nonce or str(uuid.uuid4()),json.dumps(c).replace("'","''")),database='ledger_test')

    def test_synthetic_authorization_and_duplicates(self):
        cap,c=self.setup_cap();nonce=str(uuid.uuid4())
        result=self.request(cap,c,nonce);self.assertTrue(result['ok'],result)
        self.assertEqual(result,self.request(cap,c))
        self.assertEqual(self.sql("SELECT to_jsonb(count(*)) FROM master.agent_command_receipts WHERE capability_id='%s';"%cap,database='ledger_test'),1)
        self.assertEqual(self.sql("SELECT to_jsonb(count(*)) FROM master.commands WHERE id='agent-'||encode(sha256(convert_to(jsonb_build_array('%s'::text,'%s'::text)::text,'UTF8')),'hex');"%(cap,c['idempotencyKey']),database='ledger_test'),1)
        self.assertFalse(self.request(cap,c,nonce)['ok'])
        self.assertFalse(self.request(cap,{**c,'patch':{'nextAction':'changed'}})['ok'])
        for change in [{'nativeId':'unbound-run'},{'nativeKind':'task'},{'repository':'jxwalker/openscorpion'},{'target':'unknown'},{'generation':0},{'expectedRevision':1},
                       {'op':'approve'},{'op':'accept'},{'op':'scope'},{'patch':{'criteria':[]}},{'patch':{'owner':'agent:other'}}]:
            self.assertFalse(self.request(cap,{**c,**change,'idempotencyKey':str(uuid.uuid4())})['ok'],change)
        packet=self.request(cap,{**c,'op':'packet'});self.assertTrue(packet['ok']);self.assertNotIn('history',packet)
        self.sql("UPDATE master.agent_capabilities SET revoked_at=now() WHERE id='%s';"%cap,database='ledger_test',raw=True)
        self.assertFalse(self.request(cap,c)['ok'])

    def test_synthetic_explicit_binding_and_transport_grants(self):
        cap,c=self.setup_cap();w=c['target']
        self.sql("SELECT master.bind_work('synthetic-source','jxwalker/ariadne','run','synthetic-run','%s','synthetic-operator-approval');"%w,database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):
            self.sql("SELECT master.bind_work('synthetic-source','jxwalker/ariadne','run','synthetic-run','%s','synthetic-other-proposal');"%w,database='ledger_test',raw=True)
        self.sql("CREATE ROLE ariadne_agent_transport LOGIN; GRANT USAGE ON SCHEMA master TO ariadne_agent_transport; GRANT EXECUTE ON FUNCTION master.agent_request(text,text,jsonb) TO ariadne_agent_transport;",database='ledger_test',raw=True)
        for sql in ["SELECT master.command('james','{}');",'SELECT master.snapshot();','SELECT * FROM master.agent_capabilities;',"SELECT master.bind_work('a','b','run','c','d','e');"]:
            with self.assertRaises(AssertionError):self.sql('SET SESSION AUTHORIZATION ariadne_agent_transport;'+sql,database='ledger_test',raw=True)
        r=self.sql("SET SESSION AUTHORIZATION ariadne_agent_transport; SELECT master.agent_request('%s','synthetic-granted-nonce','%s');"%(cap,json.dumps(c)),database='ledger_test')
        self.assertTrue(r['ok'],r)

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

    def test_synthetic_signature_bound_to_method_route_and_bytes(self):
        from agent_commands import handle
        from types import SimpleNamespace
        from unittest.mock import patch
        import tempfile, pathlib, time, hashlib, hmac
        with tempfile.TemporaryDirectory() as directory:
            keys=pathlib.Path(directory)/'keys';keys.write_text(json.dumps({'synthetic-cap':{'keyRef':'synthetic-ref','secret':'synthetic-test-key'}}));keys.chmod(0o600)
            app=SimpleNamespace(config={'agentCommands':{'enabled':True,'keyRegistry':str(keys)}})
            ts=str(int(time.time()));nonce='synthetic-nonce';route='/api/agent/v1/commands';raw=b'{}'
            sig=hmac.new(b'synthetic-test-key',(ts+'\n'+nonce+'\nPOST\n'+route+'\n').encode()+raw,hashlib.sha256).hexdigest()
            headers={'X-Ariadne-Capability':'synthetic-cap','X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig}
            with patch('agent_commands.query',return_value={'ok':True}) as query:
                self.assertTrue(handle(app,headers,raw,'POST',route,{})['ok']);query.assert_called_once()
                with self.assertRaises(PermissionError):handle(app,headers,raw,'POST',route,{'reason':'synthetic-test-key'})
                for method,path,body in [('GET',route,raw),('POST',route+'/wrong',raw),('POST',route,b'{"changed":true}')]:
                    with self.assertRaises(PermissionError):handle(app,headers,body,method,path,{})

    def test_synthetic_http_routes_and_observation_denial(self):
        from activity_server import Handler
        from types import SimpleNamespace
        from unittest.mock import patch
        from http.server import ThreadingHTTPServer
        import tempfile, pathlib, time, hashlib, hmac, threading, http.client
        with tempfile.TemporaryDirectory() as directory:
            keys=pathlib.Path(directory)/'keys';keys.write_text(json.dumps({'synthetic-cap':{'keyRef':'synthetic-ref','secret':'synthetic-test-key'}}));keys.chmod(0o600)
            server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
            server.app=SimpleNamespace(config={'agentCommands':{'enabled':True,'keyRegistry':str(keys)},'ingestOnly':True})
            thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
            try:
                def send(method,path,raw=b'',signed=True):
                    ts=str(int(time.time()));nonce=str(uuid.uuid4())
                    headers={'Content-Type':'application/json','X-Ariadne-Source':'synthetic-observer'}
                    if signed:
                        sig=hmac.new(b'synthetic-test-key',(ts+'\n'+nonce+'\n'+method+'\n'+path+'\n').encode()+raw,hashlib.sha256).hexdigest()
                        headers.update({'X-Ariadne-Capability':'synthetic-cap','X-Ariadne-Timestamp':ts,'X-Ariadne-Nonce':nonce,'X-Ariadne-Signature':sig})
                    connection=http.client.HTTPConnection(*server.server_address)
                    connection.request(method,path,body=raw,headers=headers)
                    response=connection.getresponse();status=response.status;body=json.loads(response.read());connection.close();return status,body
                with patch('agent_commands.query',return_value={'ok':True,'work':{'id':'synthetic-work'}}):
                    self.assertEqual(send('POST','/api/agent/v1/commands',b'{"op":"update"}')[0],200)
                    self.assertEqual(send('GET','/api/agent/v1/work/synthetic-work?repository=jxwalker%2Fariadne&nativeKind=run&nativeId=synthetic-run')[0],200)
                    self.assertEqual(send('POST','/api/agent/v1/commands',b'{"op":"update"}',False)[0],401)
                    self.assertEqual(send('GET','/api/master')[0],404)
            finally:server.shutdown();thread.join();server.server_close()
