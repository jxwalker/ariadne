import importlib.util,pathlib,tempfile,unittest,time
spec=importlib.util.spec_from_file_location('collector',pathlib.Path(__file__).with_name('agent_telemetry.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Lifecycle(unittest.TestCase):
 def setUp(self):self.now=m.stamp('2026-10-12T07:00:00Z');self.row={'id':'s','cwd':'/repo','name':'Implement disclosure uploads','rollout_path':'session.jsonl'};self.mapping={'/repo':'jxwalker/patent-studio'}
 def event(self,t,kind,**extra):return {'timestamp':t,'type':'event_msg','payload':{'type':kind,**extra}}
 def test_unsubmitted_work_and_completion(self):
  start=self.event('2026-10-12T06:59:50Z','task_started',turn_id='root')
  result=m.codex_session(self.row,[start], 'M5',self.now,self.mapping)
  self.assertEqual(result['status'],'working');self.assertEqual(result['task'],'Implement disclosure uploads')
  # A child's completion must not close the root's turn.
  child=self.event('2026-10-12T06:59:55Z','task_complete',turn_id='child')
  self.assertEqual(m.codex_session(self.row,[start,child],'M5',self.now,self.mapping)['status'],'working')
  end=self.event('2026-10-12T06:59:59Z','task_complete',turn_id='root')
  self.assertEqual(m.codex_session(self.row,[start,end],'M5',self.now,self.mapping)['status'],'idle')
 def test_stale_and_private_scope(self):
  start=self.event('2026-10-12T06:00:00Z','task_started',turn_id='root')
  self.assertEqual(m.codex_session(self.row,[start],'M5',self.now,self.mapping)['status'],'stale')
  self.assertIsNone(m.codex_session(self.row,[start],'M5',self.now,{}))
 def test_no_secrets_or_tool_arguments(self):
  records=[self.event('2026-10-12T06:59:50Z','task_started',turn_id='root'),{'timestamp':'2026-10-12T06:59:51Z','type':'response_item','payload':{'type':'function_call','name':'exec_command','arguments':'password=never-export-this'}}]
  result=m.codex_session(self.row,records,'M5',self.now,self.mapping)
  self.assertEqual(result['lastTool'],'exec_command');self.assertNotIn('never-export-this',str(result))
 def test_desktop_commentary_phase_is_redacted(self):
  records=[self.event('2026-10-12T06:59:50Z','task_started',turn_id='root'),{'timestamp':'2026-10-12T06:59:51Z','type':'response_item','payload':{'type':'message','role':'assistant','phase':'commentary','content':[{'type':'output_text','text':'Connecting the collector. token=secret-value https://example.com/private'}]}}]
  result=m.codex_session(self.row,records,'M5',self.now,self.mapping)
  self.assertIn('Connecting the collector',result['update']);self.assertNotIn('secret-value',result['update']);self.assertNotIn('https://',result['update'])
 def test_claude_explicit_stop(self):
  records=[{'timestamp':'2026-10-12T06:59:50Z','type':'user','cwd':'/repo','sessionId':'c','message':{'content':'Wire disclosure uploads'}},{'timestamp':'2026-10-12T06:59:58Z','type':'system','subtype':'stop_hook_summary','preventedContinuation':False}]
  result=m.claude_session(pathlib.Path('c.jsonl'),records,'M5',self.now,self.mapping)
  self.assertEqual(result['status'],'idle');self.assertEqual(result['task'],'Wire disclosure uploads')
if __name__=='__main__':unittest.main()
