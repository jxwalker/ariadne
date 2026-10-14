"""Synthetic outbound events; no server or real credentials."""
import io, json, pathlib, tempfile, unittest, urllib.error
from unittest.mock import patch
from contextlib import redirect_stderr
from activity_sender import flush


class SenderDeadletter(unittest.TestCase):
    def fixture(self,directory):
        spool=pathlib.Path(directory)/'spool';spool.mkdir()
        for sequence in range(2):
            (spool/(str(sequence)+'.json')).write_text(json.dumps({'runId':'synthetic-run','sequence':sequence,'summary':'synthetic body must not enter reason'}))
        return spool,{'spool':str(spool)}

    def test_synthetic_permanent_errors_do_not_block_next_event(self):
        for status in [400,404,409,413,422]:
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                spool,c=self.fixture(directory);stderr=io.StringIO()
                error=urllib.error.HTTPError('https://synthetic.invalid',status,'synthetic-secret-error',{},io.BytesIO(b'synthetic-secret-body'))
                with patch('activity_sender.deliver',side_effect=[error,{'eventId':'synthetic-success'}]) as deliver,redirect_stderr(stderr):flush(c)
                self.assertEqual(deliver.call_count,2);self.assertEqual(list(spool.glob('*.json')),[])
                dead=spool/'spool-deadletter';reason=json.loads((dead/'0.reason').read_text())
                self.assertEqual(reason['status'],status);self.assertTrue((dead/'0.json').exists())
                self.assertNotIn('synthetic-secret',str(reason)+stderr.getvalue());self.assertNotIn('summary',str(reason))
                self.assertEqual((dead/'0.json').stat().st_mode & 0o777,0o600)
                self.assertEqual((dead/'0.reason').stat().st_mode & 0o777,0o600)
                self.assertEqual(dead.stat().st_mode & 0o777,0o700)
                self.assertEqual(json.loads((spool/'.retry').read_text())['attempt'],0)

    def test_synthetic_transient_errors_keep_head_and_backoff(self):
        for error in [urllib.error.HTTPError('https://synthetic.invalid',429,'rate',{},None),
                      urllib.error.HTTPError('https://synthetic.invalid',500,'unavailable',{},None),
                      urllib.error.URLError('synthetic network')]:
            with self.subTest(error=type(error).__name__), tempfile.TemporaryDirectory() as directory:
                spool,c=self.fixture(directory)
                with patch('activity_sender.deliver',side_effect=error) as deliver:flush(c)
                self.assertEqual(deliver.call_count,1);self.assertEqual(len(list(spool.glob('*.json'))),2)
                self.assertEqual(json.loads((spool/'.retry').read_text())['attempt'],1)
                self.assertFalse((spool/'spool-deadletter').exists())

    def test_synthetic_storage_failure_retains_head_and_backoff(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            body=io.BytesIO(b'synthetic-upstream')
            error=urllib.error.HTTPError('https://synthetic.invalid',400,'invalid',{},body)
            with patch('activity_sender.deliver',side_effect=error),patch('activity_sender.quarantine',side_effect=OSError('synthetic full disk')),redirect_stderr(io.StringIO()):flush(c)
            self.assertTrue(body.closed)
            self.assertEqual(len(list(spool.glob('*.json'))),2)
            self.assertEqual(json.loads((spool/'.retry').read_text())['attempt'],1)

    def test_synthetic_collision_preserves_original_and_existing_evidence(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory);dead=spool/'spool-deadletter';dead.mkdir(mode=0o755)
            (dead/'0.json').write_text('synthetic prior evidence')
            error=urllib.error.HTTPError('https://synthetic.invalid',400,'invalid',{},None)
            with patch('activity_sender.deliver',side_effect=error),redirect_stderr(io.StringIO()):flush(c)
            self.assertTrue((spool/'0.json').exists());self.assertEqual((dead/'0.json').read_text(),'synthetic prior evidence')
            self.assertEqual(dead.stat().st_mode & 0o777,0o700)

    def test_synthetic_destination_sync_failure_preserves_source_and_recovers(self):
        from activity_sender import quarantine
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory);dead=spool/'spool-deadletter';dead.mkdir(mode=0o700)
            (dead/'0.reason').write_text('{"status":400}')
            original=(spool/'0.json').read_bytes()
            with patch('activity_sender.os.fsync',side_effect=[None,OSError('synthetic sync failure')]):
                with self.assertRaises(OSError):quarantine(spool,spool/'0.json',400)
            self.assertEqual((spool/'0.json').read_bytes(),original)
            self.assertEqual((dead/'0.json').read_bytes(),original)
            with redirect_stderr(io.StringIO()):quarantine(spool,spool/'0.json',400)
            self.assertFalse((spool/'0.json').exists());self.assertEqual((dead/'0.json').read_bytes(),original)

    def test_synthetic_auth_backlog_remains_intact(self):
        for status in [401,403]:
            with self.subTest(status=status),tempfile.TemporaryDirectory() as directory:
                spool,c=self.fixture(directory)
                for index in range(2,20):(spool/(str(index)+'.json')).write_text(json.dumps({'runId':'synthetic-run','sequence':index}))
                original={p.name:p.read_bytes() for p in spool.glob('*.json')}
                error=urllib.error.HTTPError('https://synthetic.invalid',status,'sensitive',{},None)
                with patch('activity_sender.deliver',side_effect=error) as deliver,redirect_stderr(io.StringIO()):flush(c);flush(c)
                self.assertEqual(deliver.call_count,1)
                self.assertEqual(original,{p.name:p.read_bytes() for p in spool.glob('*.json')})
                self.assertFalse((spool/'spool-deadletter').exists())
                retry=json.loads((spool/'.retry').read_text());self.assertTrue(retry['paused']);self.assertEqual(retry['consecutive'],1)

    def test_synthetic_same_failure_threshold_and_probe(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            for index in range(2,6):(spool/(str(index)+'.json')).write_text(json.dumps({'runId':'synthetic-run','sequence':index}))
            def bad(*_):raise urllib.error.HTTPError('https://synthetic.invalid',422,'sensitive',{},None)
            with patch('activity_sender.deliver',side_effect=bad) as deliver,redirect_stderr(io.StringIO()):flush(c)
            self.assertEqual(deliver.call_count,3);self.assertEqual(len(list(spool.glob('*.json'))),4)
            self.assertEqual(len(list((spool/'spool-deadletter').glob('*.json'))),2)
            retry=json.loads((spool/'.retry').read_text())
            with patch('activity_sender.time.time',return_value=retry['at']+1),patch('activity_sender.deliver',side_effect=bad) as deliver,redirect_stderr(io.StringIO()):flush(c)
            self.assertEqual(deliver.call_count,1);self.assertEqual(len(list(spool.glob('*.json'))),4)
            retry=json.loads((spool/'.retry').read_text())
            with patch('activity_sender.time.time',return_value=retry['at']+1),patch('activity_sender.deliver',return_value={'eventId':'synthetic-ok'}) as deliver:flush(c);flush(c)
            self.assertEqual(deliver.call_count,4);self.assertEqual(list(spool.glob('*.json')),[])
            self.assertFalse(json.loads((spool/'.retry').read_text()).get('paused',False))

    def test_synthetic_configurable_threshold_and_operator_reset(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory);c['permanentFailureThreshold']=1
            error=urllib.error.HTTPError('https://synthetic.invalid',400,'bad',{},None)
            with patch('activity_sender.deliver',side_effect=error),redirect_stderr(io.StringIO()):flush(c)
            self.assertEqual(len(list(spool.glob('*.json'))),2)
            reset=spool/'.circuit-reset';reset.write_text('synthetic operator reset');reset.chmod(0o600)
            with patch('activity_sender.deliver',return_value={'eventId':'synthetic-ok'}),redirect_stderr(io.StringIO()):flush(c)
            self.assertFalse(reset.exists());self.assertEqual(list(spool.glob('*.json')),[])

    def test_synthetic_different_probe_outcome_resumes_with_backoff(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            auth=urllib.error.HTTPError('https://synthetic.invalid',401,'bad',{},None)
            with patch('activity_sender.deliver',side_effect=auth),redirect_stderr(io.StringIO()):flush(c)
            retry=json.loads((spool/'.retry').read_text())
            transient=urllib.error.HTTPError('https://synthetic.invalid',500,'transient',{},None)
            with patch('activity_sender.time.time',return_value=retry['at']+1),patch('activity_sender.deliver',side_effect=transient):flush(c)
            retry=json.loads((spool/'.retry').read_text());self.assertFalse(retry['paused']);self.assertEqual(len(list(spool.glob('*.json'))),2)
            with patch('activity_sender.time.time',return_value=retry['at']+1),patch('activity_sender.deliver',return_value={'eventId':'synthetic-ok'}):flush(c)
            self.assertEqual(list(spool.glob('*.json')),[])

    def test_synthetic_unsafe_reset_and_invalid_config_do_not_kill_worker(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            auth=urllib.error.HTTPError('https://synthetic.invalid',401,'bad',{},None)
            with patch('activity_sender.deliver',side_effect=auth),redirect_stderr(io.StringIO()):flush(c)
            reset=spool/'.circuit-reset';reset.write_text('synthetic');reset.chmod(0o644)
            with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
            deliver.assert_not_called();self.assertTrue(reset.exists())
            reset.unlink();reset.symlink_to(spool/'0.json')
            with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
            deliver.assert_not_called();self.assertTrue(reset.is_symlink())
            reset.unlink()
            for value in [0,101,'bad',None]:
                with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush({**c,'permanentFailureThreshold':value})
                deliver.assert_not_called()
            self.assertEqual(len(list(spool.glob('*.json'))),2)

    def test_synthetic_paused_network_failure_keeps_probe_backoff(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            auth=urllib.error.HTTPError('https://synthetic.invalid',401,'bad',{},None)
            with patch('activity_sender.deliver',side_effect=auth),redirect_stderr(io.StringIO()):flush(c)
            retry=json.loads((spool/'.retry').read_text());now=retry['at']+1
            with patch('activity_sender.time.time',return_value=now),patch('activity_sender.deliver',side_effect=urllib.error.URLError('synthetic network')):flush(c)
            retry=json.loads((spool/'.retry').read_text());self.assertTrue(retry['paused']);self.assertEqual(retry['at'],now+300)
            self.assertEqual(len(list(spool.glob('*.json'))),2)

    def test_synthetic_storage_retries_keep_exponential_backoff(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory);c['permanentFailureThreshold']=100
            for attempt,now in enumerate([100,103,108],1):
                error=urllib.error.HTTPError('https://synthetic.invalid',400,'bad',{},None)
                with patch('activity_sender.time.time',return_value=now),patch('activity_sender.deliver',side_effect=error),patch('activity_sender.quarantine',side_effect=OSError('synthetic disk')),redirect_stderr(io.StringIO()):flush(c)
                retry=json.loads((spool/'.retry').read_text());self.assertEqual(retry['attempt'],attempt);self.assertEqual(retry['at'],now+2**attempt)

    def test_synthetic_paused_probe_stays_on_triggering_event(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            auth=urllib.error.HTTPError('https://synthetic.invalid',401,'bad',{},None)
            with patch('activity_sender.deliver',side_effect=auth),redirect_stderr(io.StringIO()):flush(c)
            (spool/'new.json').write_text(json.dumps({'runId':'a-earlier-synthetic','sequence':0}))
            retry=json.loads((spool/'.retry').read_text());seen=[]
            def probe(_,raw):seen.append(json.loads(raw)['runId']);raise urllib.error.HTTPError('https://synthetic.invalid',401,'bad',{},None)
            with patch('activity_sender.time.time',return_value=retry['at']+1),patch('activity_sender.deliver',side_effect=probe),redirect_stderr(io.StringIO()):flush(c)
            self.assertEqual(seen,['synthetic-run']);self.assertEqual(len(list(spool.glob('*.json'))),3)
            self.assertFalse((spool/'spool-deadletter').exists())

    def test_synthetic_corrupt_retry_can_be_reset(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory);(spool/'.retry').write_text('synthetic-corruption')
            with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
            deliver.assert_not_called()
            reset=spool/'.circuit-reset';reset.touch(mode=0o600)
            with patch('activity_sender.deliver',return_value={'eventId':'synthetic-ok'}),redirect_stderr(io.StringIO()):flush(c)
            self.assertEqual(list(spool.glob('*.json')),[]);self.assertFalse(reset.exists())

    def test_synthetic_retry_storage_failure_never_quarantines_or_kills_worker(self):
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            with patch('activity_sender.persist',side_effect=OSError('synthetic disk')),patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
            deliver.assert_not_called();self.assertEqual(len(list(spool.glob('*.json'))),2)
        with tempfile.TemporaryDirectory() as directory:
            spool,c=self.fixture(directory)
            auth=urllib.error.HTTPError('https://synthetic.invalid',403,'bad',{},None)
            from activity_sender import persist as real_persist
            calls=[]
            def fail_trip(path,value):
                calls.append(value)
                if value.get('paused'):raise OSError('synthetic disk after response')
                real_persist(path,value)
            with patch('activity_sender.persist',side_effect=fail_trip),patch('activity_sender.deliver',side_effect=auth),redirect_stderr(io.StringIO()):flush(c)
            with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
            deliver.assert_not_called();self.assertFalse((spool/'spool-deadletter').exists())
            self.assertEqual(len(list(spool.glob('*.json'))),2)

    def test_synthetic_malformed_breaker_fields_fail_before_delivery(self):
        variants=[{'at':10**400},{'at':float('nan')},{'consecutive':None},{'consecutive':'bad'},{'paused':'yes'},{'paused':True},{'permanent':{'status':400,'class':'unknown'}},{'probeEvent':'../outside.json'}]
        for variant in variants:
            with self.subTest(variant=variant),tempfile.TemporaryDirectory() as directory:
                spool,c=self.fixture(directory)
                state={'at':0,'attempt':0,'permanent':{'status':400,'class':'invalid-request'},'consecutive':1,'paused':False,**variant}
                (spool/'.retry').write_text(json.dumps(state))
                with patch('activity_sender.deliver') as deliver,redirect_stderr(io.StringIO()):flush(c)
                deliver.assert_not_called();self.assertEqual(len(list(spool.glob('*.json'))),2)
                (spool/'.circuit-reset').touch(mode=0o600)
                with patch('activity_sender.deliver',return_value={'eventId':'synthetic-ok'}),redirect_stderr(io.StringIO()):flush(c)
                self.assertEqual(list(spool.glob('*.json')),[])
