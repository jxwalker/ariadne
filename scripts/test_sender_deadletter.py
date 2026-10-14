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
        for status in [400,401,403,404,409,413,422]:
            with self.subTest(status=status), tempfile.TemporaryDirectory() as directory:
                spool,c=self.fixture(directory);stderr=io.StringIO()
                error=urllib.error.HTTPError('https://synthetic.invalid',status,'synthetic-secret-error',{},io.BytesIO(b'synthetic-secret-body'))
                with patch('activity_sender.deliver',side_effect=[error,{'eventId':'synthetic-success'}]) as deliver,redirect_stderr(stderr):flush(c)
                self.assertEqual(deliver.call_count,2);self.assertEqual(list(spool.glob('*.json')),[])
                dead=spool.parent/'spool-deadletter';reason=json.loads((dead/'0.reason').read_text())
                self.assertEqual(reason['status'],status);self.assertTrue((dead/'0.json').exists())
                self.assertNotIn('synthetic-secret',str(reason)+stderr.getvalue());self.assertNotIn('summary',str(reason))
                self.assertEqual((dead/'0.json').stat().st_mode & 0o777,0o600)
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
                self.assertFalse((spool.parent/'spool-deadletter').exists())
