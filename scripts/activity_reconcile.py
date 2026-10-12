#!/usr/bin/env python3
"""Read-only paginated GitHub reconciliation using existing host gh auth. No token output."""
import argparse,json,pathlib,subprocess,time
from activity_server import Store,canonical

def pages(endpoint):
    # Older deployed gh 2.46 supports --paginate but not --slurp. Decode concatenated pages.
    r=subprocess.run(['gh','api','--paginate',endpoint],check=True,capture_output=True,text=True,timeout=120)
    decoder=json.JSONDecoder();text=r.stdout;result=[]
    while text.strip():
        page,end=decoder.raw_decode(text.lstrip());result.append(page);text=text.lstrip()[end:]
    return result

def reconcile(store,repositories):
    for repo in repositories:
        try:
            with store.connect() as db: refs=[json.loads(r['envelope']) for r in db.execute("SELECT envelope FROM runs WHERE json_extract(envelope,'$.repository')=?",(repo,))]
            observations=[]
            for page in pages(f'repos/{repo}/pulls?state=all&per_page=100'):
                for pr in page:
                    observations.append(('reconcile:pr:'+repo+':'+str(pr['number']),{'kind':'pull_request','body':{'pull_request':pr}}))
                    # Enumerate every PR; expensive detail calls are scoped to exact task associations.
                    associated=any((e.get('pr')==pr['number']) or (e.get('branch')==pr['head']['ref']) or (e.get('commit')==pr['head']['sha']) for e in refs)
                    if not associated:continue
                    for route,kind in [(f'pulls/{pr["number"]}/reviews','pull_request_review'),(f'commits/{pr["head"]["sha"]}/check-runs','check_run')]:
                        raw=pages(f'repos/{repo}/{route}?per_page=100')
                        observations.append(('reconcile:'+kind+':'+repo+':'+str(pr['number']),{'kind':kind,'body':{'pull_request':pr,'pages':raw}}))
            with store.connect() as db:
                for ident,body in observations: db.execute('INSERT OR REPLACE INTO observations VALUES(?,?,?,?)',(ident,repo,time.time(),canonical(body)))
                db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'success','All PR pages collected; associated task review/check pages collected; no agent attribution'))
        except Exception:
            with store.connect() as db: db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'error','Read-only API reconciliation failed; inspect host gh access/rate limits'))

def main():
    p=argparse.ArgumentParser(); p.add_argument('--config',required=True); a=p.parse_args(); c=json.loads(pathlib.Path(a.config).read_text()); reconcile(Store(c['database']),c['githubRepositories'])
if __name__=='__main__':main()
