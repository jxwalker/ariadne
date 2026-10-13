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
