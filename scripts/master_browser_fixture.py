#!/usr/bin/env python3
"""Real activity route on loopback with disposable PostgreSQL and SQLite; no live access."""
import json, pathlib, threading
from unittest.mock import patch
from test_master_ledger import LedgerContract
from master_import import compile_import
from activity_server import App, Handler, ThreadingHTTPServer

def main():
    LedgerContract.setUpClass()
    server=None;app=None
    try:
        commands=json.dumps(compile_import()).replace("'","''")
        results=LedgerContract.sql("SELECT jsonb_agg(master.command('james',value) ORDER BY ord) FROM jsonb_array_elements('%s'::jsonb) WITH ORDINALITY AS c(value,ord);"%commands,database='ledger_test')
        assert all(r['ok'] for r in results),results
        registry=LedgerContract.dir/'sources.json';registry.write_text('{}');registry.chmod(0o600)
        app=App({'database':str(LedgerContract.dir/'activity.db'),'credentials':str(registry),'githubRepositories':['jxwalker/ariadne'],'machines':[]})
        for migration in ['002-agent-commands.sql','003-claims-leases.sql','004-adapter-dashboard.sql']:
            LedgerContract.sql((pathlib.Path(__file__).resolve().parents[1]/'migrations/master'/migration).read_text(),database='ledger_test',raw=True)
        # Deliberately synthetic agent-held pre-PR work; never a production receipt claim.
        LedgerContract.sql("""INSERT INTO master.agent_capabilities(id,agent_identity,harness,execution_source,key_ref,repositories,eligible_work_ids,allowed_operations,expires_at)
          SELECT 'synthetic-browser','agent:synthetic-browser','synthetic-Claude','synthetic-local','synthetic-browser',ARRAY['jxwalker/ariadne'],ARRAY[id],ARRAY['packet'],now()+interval '1 hour' FROM master.nodes WHERE kind='work' ORDER BY id LIMIT 1;
          UPDATE master.nodes SET body=body||jsonb_build_object('owner','agent:synthetic-browser','generation',2,'nextAction','Synthetic pre-PR adapter verification','blocker','Synthetic awaiting operator review','blockerSince','2026-10-14T08:00:00Z') WHERE id=(SELECT eligible_work_ids[1] FROM master.agent_capabilities WHERE id='synthetic-browser');
          INSERT INTO master.work_leases SELECT eligible_work_ids[1],id,2,now()+interval '10 minutes',NULL,true FROM master.agent_capabilities WHERE id='synthetic-browser';
          INSERT INTO master.agent_command_receipts SELECT id,'synthetic-browser-receipt',jsonb_build_object('target',eligible_work_ids[1],'op','update'),'{"ok":true,"synthetic":true}',now() FROM master.agent_capabilities WHERE id='synthetic-browser';
        """,database='ledger_test',raw=True)
        with app.store.connect() as db:
            db.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)",('synthetic-unbound','synthetic-run','synthetic-task',1,'unknown',0,json.dumps({'repository':'jxwalker/ariadne'}),0))
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.app=app;server.daemon_threads=True
        # Replace only the PG transport: production handler, render, CSP and links are exercised.
        def isolated_snapshot():return LedgerContract.sql('SELECT master.snapshot();',database='ledger_test')
        with patch('master_dashboard.snapshot',isolated_snapshot):
            worker=threading.Thread(target=server.serve_forever);worker.start()
            print(json.dumps({'url':'http://127.0.0.1:'+str(server.server_port),'source':'isolated real PostgreSQL + actual activity_server.Handler'}),flush=True)
            input()
            server.shutdown();worker.join()
    finally:
        if server:server.server_close()
        if app:app.store.close()
        LedgerContract.tearDownClass()
if __name__=='__main__':main()
