"""Exercise independent SQLite clients and the actual readiness HTTP boundary."""
import concurrent.futures
import json
import pathlib
import tempfile
import threading
import time
import unittest
import urllib.request
from unittest.mock import patch

from activity_server import App, Store, Handler, ThreadingHTTPServer, canonical
from activity_reconcile import reconcile, record_observation
from test_activity import event


class ContentionTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=pathlib.Path(self.tmp.name)
        credentials=self.root/'sources.json'; credentials.write_text('{}'); credentials.chmod(0o600)
        self.app=App({'database':str(self.root/'activity.db'),'credentials':str(credentials)})
        self.store=self.app.store

    def tearDown(self):
        self.store.close(); self.tmp.cleanup()

    def test_ready_http_does_not_project_or_wait_for_a_writer(self):
        server=ThreadingHTTPServer(('127.0.0.1',0),Handler); server.app=self.app
        thread=threading.Thread(target=server.serve_forever,daemon=True); thread.start()
        try:
            with self.store.connect() as writer:
                writer.execute('BEGIN IMMEDIATE')
                writer.execute('INSERT INTO health VALUES(?,?,?,?)',('held',time.time(),'success','test'))
                # A readiness probe must not run the expensive evidence projection.
                with patch.object(self.store,'snapshot',side_effect=AssertionError('projection called')):
                    started=time.monotonic()
                    with urllib.request.urlopen(f'http://127.0.0.1:{server.server_port}/readyz',timeout=1) as response:
                        self.assertEqual(json.load(response),{'status':'ready'})
                    self.assertLess(time.monotonic()-started,1)
        finally:
            server.shutdown(); thread.join(); server.server_close()

    def test_existing_store_initialization_does_not_need_writer_lock(self):
        with self.store.connect() as writer:
            writer.execute('BEGIN IMMEDIATE')
            with concurrent.futures.ThreadPoolExecutor() as pool:
                other=pool.submit(Store,self.store.path).result(timeout=1)
                other.close()

    def test_reconciliation_allows_ingestion_before_all_prs_commit(self):
        prs=[{'number':i,'head':{'ref':f'branch-{i}','sha':'a'*40},'body':'evidence'*100} for i in range(1,101)]
        writing=threading.Event()
        def slow_record(*args):
            record_observation(*args); writing.set(); time.sleep(0.005)
        with patch('activity_reconcile.pages',return_value=[prs]),patch('activity_reconcile.record_observation',side_effect=slow_record):
            with concurrent.futures.ThreadPoolExecutor() as pool:
                future=pool.submit(reconcile,self.store,['jxwalker/ariadne'])
                self.assertTrue(writing.wait(2))
                e=event();self.store.accept(e,canonical(e).encode())
                with self.store.connect() as db:
                    at_accept=db.execute('SELECT count(*) FROM observations').fetchone()[0]
                self.assertLess(at_accept,len(prs),'GitHub held its writer lock until the whole repository finished')
                future.result(timeout=5)
        self.store.process()
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM observations').fetchone()[0],100)
            self.assertEqual(db.execute('SELECT count(*) FROM runs').fetchone()[0],1)

    def test_concurrent_producers_preserve_events_and_dedupe(self):
        def produce(producer):
            client=Store(self.store.path)
            try:
                for seq in range(30):
                    e=event('heartbeat',seq,f'producer-{producer}');raw=canonical(e).encode()
                    self.assertFalse(client.accept(e,raw)[1]);self.assertTrue(client.accept(e,raw)[1])
            finally:client.close()
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(produce,range(4)))
        self.store.process()
        with self.store.connect() as db:
            self.assertEqual(db.execute('SELECT count(*) FROM events').fetchone()[0],120)
            self.assertEqual(db.execute('SELECT count(*) FROM runs').fetchone()[0],4)
            self.assertEqual(db.execute('PRAGMA integrity_check').fetchone()[0],'ok')
            plan=db.execute("EXPLAIN QUERY PLAN SELECT received FROM events WHERE source=? AND json_extract(envelope,'$.runId')=? ORDER BY json_extract(envelope,'$.sequence')",('test','producer-0')).fetchall()
            self.assertTrue(any('events_run_sequence' in str(tuple(row)) for row in plan))

    def test_migration_preserves_raw_evidence(self):
        e=event();raw=canonical(e).encode();self.store.accept(e,raw)
        with self.store.connect() as db:
            db.execute('PRAGMA user_version=2');db.execute('DELETE FROM migrations WHERE version=3')
        migrated=Store(self.store.path)
        try:
            with migrated.connect() as db:
                self.assertEqual(bytes(db.execute('SELECT raw FROM events').fetchone()[0]),raw)
                self.assertEqual(db.execute('PRAGMA user_version').fetchone()[0],4)
            self.assertTrue(migrated.ready())
        finally:migrated.close()


if __name__=='__main__': unittest.main()
