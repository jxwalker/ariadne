import unittest
from master_dashboard import render,api_page,age
class MasterDashboard(unittest.TestCase):
    def test_escape_and_denominators(self):
        data={'nodes':[{'id':'p','kind':'product','parent':None,'revision':1,'body':{'title':'<script>alert(1)</script>'}}, {'id':'b','kind':'baseline','parent':'p','revision':2,'body':{'title':'draft','state':'proposed'}}], 'progress':[{'baseline_id':'b','denominator':7,'accepted_criteria':0}], 'history':[],'dependencies':[],'evidence':[]}
        portfolio=render(data,'/roadmaps',{})
        self.assertNotIn('<script>',portfolio);self.assertIn('&lt;script&gt;',portfolio)
        drill=render(data,'/roadmaps',{'node':['p']})
        self.assertIn('0 evidence accepted · 0 waived (0 expired) mandatory criteria / 7 proposed criteria',drill)
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

    def test_work_pagination_preserves_state(self):
        from html import unescape
        from urllib.parse import urlparse,parse_qs
        import re
        data={'nodes':[{'id':str(i),'kind':'work','revision':1,'body':{'title':str(i),'state':'active' if i<4 else 'proposed'}} for i in range(8)],'progress':[],'dependencies':[],'history':[],'evidence':[]}
        page=render(data,'/work',{'state':['active'],'offset':['2'],'limit':['2']})
        links=re.findall(r'href="([^"]+)"[^>]*>(?:Previous|Next)',page)
        self.assertEqual(len(links),2)
        for url in links:self.assertEqual(parse_qs(urlparse(unescape(url)).query)['state'],['active'])
