#!/usr/bin/env python3
"""Render real imported sources for CI browser evidence in an isolated database."""
import argparse, json, pathlib
from test_master_ledger import LedgerContract
from master_import import compile_import
from master_dashboard import render

def main():
    p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
    LedgerContract.setUpClass()
    try:
        c=json.dumps(compile_import()).replace("'","''")
        r=LedgerContract.sql("SELECT jsonb_agg(master.command('james',value) ORDER BY ord) FROM jsonb_array_elements('%s'::jsonb) WITH ORDINALITY AS c(value,ord);"%c,database='ledger_test')
        assert all(x['ok'] for x in r),[x for x in r if not x['ok']]
        data=LedgerContract.sql('SELECT master.snapshot();',database='ledger_test')
        routes=[('portfolio','/roadmaps',{}),('product','/roadmaps',{'node':['product:patent-studio']}),('baseline','/roadmaps',{'node':['baseline:patent-studio:v1']}),('phase','/roadmaps',{'node':['phase:patent:gate-0']}),('milestone','/roadmaps',{'node':['milestone:patent:gate-0']}),('work-details','/work',{'id':['ARIADNE-MASTER-PILOT-20261013-P01']}),('work-queues','/work',{})]
        for name,route,filters in routes:(out/(name+'.html')).write_text(render(data,route,filters))
        (out/'manifest.json').write_text(json.dumps({'source':'real Phase 0 snapshots; isolated CI database; no live acceptance assertion','products':3,'workItems':sum(n['kind']=='work' for n in data['nodes'])},indent=2))
    finally:LedgerContract.tearDownClass()
if __name__=='__main__':main()
