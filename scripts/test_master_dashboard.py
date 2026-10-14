import unittest
from master_dashboard import render,api_page,age
class MasterDashboard(unittest.TestCase):
    def test_escape_and_denominators(self):
        data={'nodes':[{'id':'p','kind':'product','parent':None,'revision':1,'body':{'title':'<script>alert(1)</script>'}}, {'id':'b','kind':'baseline','parent':'p','revision':2,'body':{'title':'draft','state':'proposed'}}], 'progress':[{'baseline_id':'b','denominator':7,'accepted_criteria':0}], 'history':[],'dependencies':[],'evidence':[]}
        portfolio=render(data,'/roadmaps',{})
        self.assertNotIn('<script>',portfolio);self.assertIn('&lt;script&gt;',portfolio)
        drill=render(data,'/roadmaps',{'node':['p']})
        self.assertIn('0 evidence accepted · 0 current waived (0 inactive/expired) mandatory criteria / 7 proposed criteria',drill)
        self.assertIn('Approved denominator: none',drill)
    def test_split_child_retains_selected_evidence(self):
        old={'id':'original','kind':'work','revision':7,'parent':None,'body':{'title':'original','state':'superseded','criteria':[{'id':'criterion','text':'outcome'}]}}
        child={'id':'child','kind':'work','revision':1,'parent':None,'body':{'title':'child','state':'accepted','splitFrom':'original','criteria':[{'id':'criterion','text':'outcome'}]}}
        data={'nodes':[old,child],'progress':[],'scope':[],'dependencies':[],'history':[],'evidence':[{'id':'proof-ci','work_id':'original','body':{'kind':'ci','criterionId':'criterion','uri':'https://example.invalid/immutable'}}],'acceptanceEvidence':[{'work_id':'original','criterion_id':'criterion','kind':'ci','evidence_id':'proof-ci'}]}
        output=render(data,'/work',{'id':['child']})
        self.assertIn('proof-ci',output);self.assertIn('selectedAcceptanceEvidence',output);self.assertIn('Inherited criterion evidence',output)

    def test_api_filters_and_age(self):
        data={'nodes':[{'id':str(i),'body':{'state':'proposed'}} for i in range(120)]}
        result=api_page(data,{'limit':['999']})
        self.assertEqual(len(result['items']),100);self.assertEqual(result['nextOffset'],100)
        self.assertEqual(api_page(data,{'id':['3']})['total'],1)
        self.assertIn('days; original',age('2026-10-13T00:00:00.000Z'))
        self.assertEqual(age(None),'No recorded blocker')

    def test_real_route_filters_headers_and_failure(self):
        import json,pathlib,tempfile,threading,urllib.request,urllib.error
        from unittest.mock import patch
        from activity_server import App,Handler,ThreadingHTTPServer
        with tempfile.TemporaryDirectory() as tmp:
            credentials=pathlib.Path(tmp)/'sources.json';credentials.write_text('{}');credentials.chmod(0o600)
            app=App({'database':str(pathlib.Path(tmp)/'activity.db'),'credentials':str(credentials)})
            server=ThreadingHTTPServer(('127.0.0.1',0),Handler);server.app=app
            thread=threading.Thread(target=server.serve_forever);thread.start()
            base='http://127.0.0.1:'+str(server.server_port)
            data={'nodes':[{'id':'p','kind':'product','revision':1,'body':{'title':'Product'}}],'progress':[]}
            try:
                with patch('master_dashboard.snapshot',return_value=data):
                    with urllib.request.urlopen(base+'/api/master?limit=1') as response:
                        result=json.load(response);self.assertEqual(len(result['items']),1)
                    with urllib.request.urlopen(base+'/roadmaps') as response:
                        self.assertIn("default-src 'none'",response.headers['Content-Security-Policy'])
                    for route in ['/api/master?limit=oops','/work?limit=oops','/work?offset=oops']:
                        with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(base+route)
                        self.assertEqual(error.exception.code,400)
                with patch('master_dashboard.snapshot',side_effect=RuntimeError('unavailable')):
                    with self.assertRaises(urllib.error.HTTPError) as error:urllib.request.urlopen(base+'/roadmaps')
                    self.assertEqual(error.exception.code,503)
            finally:server.shutdown();thread.join();server.server_close();app.store.close()

    def test_split_api_inherits_only_child_criterion_records(self):
        data={'nodes':[{'id':'child','body':{'splitFrom':'middle','criteria':[{'id':'c1'}]}},{'id':'middle','body':{'splitFrom':'original'}}],
              'accepted':[{'work_id':'original','criterion_id':'c1'},{'work_id':'original','criterion_id':'sibling'}],
              'acceptanceEvidence':[{'work_id':'original','criterion_id':'c1','kind':'ci'},{'work_id':'original','criterion_id':'sibling','kind':'ci'}],
              'evidence':[{'id':'proof','work_id':'original','body':{'criterionId':'c1'}},{'id':'sibling-proof','work_id':'original','body':{'criterionId':'sibling'}}],
              'history':[{'target':'original'},{'target':'middle'},{'target':'unrelated'}]}
        for collection in ['accepted','acceptanceEvidence','evidence']:
            result=api_page(data,{'collection':[collection],'id':['child']})
            self.assertEqual(result['total'],1,collection)
            self.assertEqual(result['items'][0]['work_id'],'original')
        result=api_page(data,{'collection':['history'],'id':['child']})
        self.assertEqual(result['total'],2)

    def test_malformed_legacy_metadata_does_not_break_rendering(self):
        for value in [None,42,'unexpected',{'wrong':'shape'}]:
            data={'nodes':[{'id':'work','kind':'work','revision':1,'body':{'title':'Work','state':'proposed','source':value,'refs':value,'waiver':value,'blockerSince':value,'splitFrom':value,'criteria':[{'id':{}}]}},
                           {'id':'decision','kind':'decision','revision':1,'body':{'title':'Decision','options':value}}],
                  'progress':[],'dependencies':[],'history':[],'evidence':[]}
            for route,filters in [('/work',{}),('/work',{'id':['work']}),('/roadmaps',{})]:
                result=render(data,route,filters)
                self.assertIn('Master development portfolio',result)

    def test_work_paging_preserves_state_filter(self):
        from urllib.parse import urlsplit,parse_qs
        from html.parser import HTMLParser
        class Links(HTMLParser):
            def __init__(self):super().__init__();self.hrefs=[]
            def handle_starttag(self,tag,attrs):
                if tag=='a':self.hrefs.extend(v for k,v in attrs if k=='href')
        data={'nodes':[],'progress':[],'history':[],'dependencies':[],'evidence':[]}
        page=render(data,'/work',{'state':['active'],'limit':['2'],'offset':['2']})
        parser=Links();parser.feed(page)
        paging=[parse_qs(urlsplit(href).query) for href in parser.hrefs if 'offset=' in href]
        self.assertEqual(len(paging),2)
        self.assertTrue(all(query['state']==['active'] and query['limit']==['2'] for query in paging))

    def test_hierarchy_rollups_separate_inactive_waivers(self):
        data={'nodes':[{'id':'p','kind':'product','revision':1,'body':{'title':'Product'}},{'id':'b','kind':'baseline','parent':'p','revision':1,'body':{'title':'Baseline','state':'approved'}},{'id':'phase','kind':'phase','parent':'b','revision':1,'body':{'title':'Phase'}},{'id':'m','kind':'milestone','parent':'phase','revision':1,'body':{'title':'Milestone'}},{'id':'w','kind':'work','parent':'m','revision':1,'body':{'title':'Waived work','state':'accepted'},'waiverInactive':True}],
              'progress':[{'baseline_id':'b','baseline_state':'approved','denominator':1,'accepted_criteria':0,'waived_criteria':1,'expired_waived_criteria':1}],
              'scope':[{'baseline_id':'b','work_id':'w','criterion_id':'c'}],'accepted':[{'work_id':'w','criterion_id':'c','evidence_id':None}],'dependencies':[],'history':[],'evidence':[]}
        for node in ['p','phase','m']:
            result=render(data,'/roadmaps',{'node':[node]})
            self.assertIn('0 current waived · 1 inactive (expired/invalid) waivers',result)
        self.assertIn('0 current waived (1 inactive/expired)',render(data,'/roadmaps',{'node':['b']}))

    def test_takeover_verification_visible_without_handover(self):
        data={'nodes':[{'id':'synthetic-work','kind':'work','parent':None,'revision':2,'body':{'state':'active'}}],'progress':[],'agentState':[{'work_id':'synthetic-work','resumed':False,'handover':None,'current':True}]}
        output=render(data,'/work',{})
        self.assertIn('pending environment verification',output)
        self.assertNotIn('Handover: none pending',output)

    def test_unbound_uses_exact_registered_execution_source(self):
        import json,pathlib,tempfile
        from activity_server import Store
        from master_dashboard import unbound_activity
        with tempfile.TemporaryDirectory() as directory:
            store=Store(str(pathlib.Path(directory)/'synthetic.db'))
            try:
                with store.connect() as db:
                    for run,repo in [('exact','jxwalker/ariadne'),('same-title','jxwalker/ariadne'),('wrong-repo','jxwalker/openscorpion')]:
                        db.execute('INSERT INTO runs VALUES(?,?,?,?,?,?,?,?)',('synthetic-live-claude',run,'task-'+run,1,'unknown',1,json.dumps({'repository':repo}),0))
                bindings=[{'execution_source':'synthetic-host','repository':'jxwalker/ariadne','native_kind':'run','native_id':'exact'}]
                rows=unbound_activity(store,bindings,{'synthetic-live-claude':{'correlationHost':'synthetic-host'}})
                self.assertEqual({r['run'] for r in rows},{'same-title','wrong-repo'})
                self.assertEqual(len(unbound_activity(store,bindings,{})),3)
                direct=[{**bindings[0],'execution_source':'synthetic-live-claude'}]
                self.assertEqual(len(unbound_activity(store,direct,{})),3) # source ID is not an execution mapping
            finally:store.close()

    def test_historical_handover_not_pending_after_verified_release(self):
        data={'nodes':[{'id':'synthetic-work','kind':'work','parent':None,'revision':3,'body':{'state':'active'}}],'progress':[],'agentState':[{'work_id':'synthetic-work','generation':3,'resumed':True,'released_at':'2026-10-14T08:00:00Z','handover':{'generation':2,'body':{}},'current':False}]}
        self.assertIn('Handover: none pending',render(data,'/work',{}))
        data['agentState'][0]['handover']['generation']=3
        self.assertIn('pending environment verification',render(data,'/work',{}))
