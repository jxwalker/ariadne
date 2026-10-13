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
