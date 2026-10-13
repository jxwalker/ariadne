import unittest
from master_dashboard import render
class MasterDashboard(unittest.TestCase):
    def test_escape_and_denominators(self):
        data={'nodes':[{'id':'p','kind':'product','parent':None,'revision':1,'body':{'title':'<script>alert(1)</script>'}}, {'id':'b','kind':'baseline','parent':'p','revision':2,'body':{'title':'draft','state':'proposed'}}], 'progress':[{'baseline_id':'b','denominator':7,'accepted_criteria':0}], 'history':[],'dependencies':[],'evidence':[]}
        portfolio=render(data,'/roadmaps',{})
        self.assertNotIn('<script>',portfolio);self.assertIn('&lt;script&gt;',portfolio)
        drill=render(data,'/roadmaps',{'node':['p']})
        self.assertIn('0 accepted mandatory criteria / 7 proposed criteria',drill)
        self.assertIn('Approved denominator: none',drill)
    def test_split_child_retains_selected_evidence(self):
        old={'id':'original','kind':'work','revision':7,'parent':None,'body':{'title':'original','state':'superseded','criteria':[{'id':'criterion','text':'outcome'}]}}
        child={'id':'child','kind':'work','revision':1,'parent':None,'body':{'title':'child','state':'accepted','splitFrom':'original','criteria':[{'id':'criterion','text':'outcome'}]}}
        data={'nodes':[old,child],'progress':[],'scope':[],'dependencies':[],'history':[],'evidence':[{'id':'proof-ci','work_id':'original','body':{'kind':'ci','criterionId':'criterion','uri':'https://example.invalid/immutable'}}],'acceptanceEvidence':[{'work_id':'original','criterion_id':'criterion','kind':'ci','evidence_id':'proof-ci'}]}
        output=render(data,'/work',{'id':['child']})
        self.assertIn('proof-ci',output);self.assertIn('selectedAcceptanceEvidence',output);self.assertIn('Inherited criterion evidence',output)
