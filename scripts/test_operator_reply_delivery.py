import json, pathlib, tempfile, unittest
from unittest.mock import patch
from activity_sender import flush,persist

class ReceiptDelivery(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=pathlib.Path(self.temp.name);self.event=self.root/'event.json'
        self.event.write_text(json.dumps({'runId':'run','sequence':0}))
        self.config={'spool':str(self.root)}
        self.reply={'requestId':'decision','requestRevision':'a'*64,'resolution':'Operator only'}
        self.receipt={'accepted':True,'operatorDecisions':[self.reply]}
    def test_success_persists_private_reply_then_removes_event(self):
        with patch('activity_sender.deliver',return_value=self.receipt):flush(self.config)
        self.assertFalse(self.event.exists())
        for name in ['.last-receipt','.operator-decisions.json.state','.retry']:
            self.assertEqual((self.root/name).stat().st_mode&0o777,0o600)
        self.assertEqual(json.loads((self.root/'.operator-decisions.json.state').read_text())['decision:'+('a'*64)],self.reply)
    def test_corrupt_reply_state_retains_event_and_can_recover(self):
        state=self.root/'.operator-decisions.json.state';state.write_text('{broken')
        with patch('activity_sender.deliver',return_value=self.receipt):flush(self.config)
        self.assertTrue(self.event.exists());self.assertEqual(state.read_text(),'{broken')
        state.write_text('{}');(self.root/'.retry').unlink()
        with patch('activity_sender.deliver',return_value=self.receipt):flush(self.config)
        self.assertFalse(self.event.exists());self.assertIn(self.reply,json.loads(state.read_text()).values())
    def test_failed_atomic_replace_preserves_previous_state_and_spool(self):
        state=self.root/'.operator-decisions.json.state';state.write_text('{"previous":{}}')
        original=pathlib.Path.replace
        def fail(path,target):
            if target==state:raise OSError('isolated disk failure')
            return original(path,target)
        with patch('activity_sender.deliver',return_value=self.receipt),patch('pathlib.Path.replace',fail):flush(self.config)
        self.assertTrue(self.event.exists());self.assertEqual(json.loads(state.read_text()),{'previous':{}})
        self.assertFalse(list(self.root.glob('*.tmp')))
    def test_failed_receipt_persistence_never_acknowledges_event(self):
        def save(path,value):
            if path.name=='.last-receipt':raise OSError('isolated receipt failure')
            return persist(path,value)
        with patch('activity_sender.deliver',return_value=self.receipt),patch('activity_sender.persist',side_effect=save):flush(self.config)
        self.assertTrue(self.event.exists());self.assertFalse((self.root/'.operator-decisions.json.state').exists())
