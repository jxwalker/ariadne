#!/usr/bin/env python3
"""Read-only paginated GitHub reconciliation using existing host gh auth. No token output."""
import argparse,json,pathlib,subprocess,time
from activity_server import Store,canonical

def reconcile(store,repositories):
    for repo in repositories:
        try:
            # No fixed PR sample; all pages. Retain raw API response as private delivery evidence.
            result=subprocess.run(['gh','api','--paginate','--slurp',f'repos/{repo}/pulls?state=all&per_page=100'],check=True,capture_output=True,text=True,timeout=120)
            pages=json.loads(result.stdout)
            observations=[]
            for page in pages:
                for pr in page:
                    observations.append(('reconcile:pr:'+repo+':'+str(pr['number']),{'kind':'pull_request','body':{'pull_request':pr}}))
                    for route,kind in [(f'pulls/{pr["number"]}/reviews','pull_request_review'),(f'commits/{pr["head"]["sha"]}/check-runs','check_run')]:
                        r=subprocess.run(['gh','api','--paginate','--slurp',f'repos/{repo}/{route}'+('?per_page=100')],check=True,capture_output=True,text=True,timeout=120)
                        raw=json.loads(r.stdout)
                        # Preserve API pages; explicit PR reference attaches reviews/checks without inferring authorship.
                        observations.append(('reconcile:'+kind+':'+repo+':'+str(pr['number']),{'kind':kind,'body':{'pull_request':pr,'pages':raw}}))
            with store.connect() as db:
                for ident,body in observations: db.execute('INSERT OR REPLACE INTO observations VALUES(?,?,?,?)',(ident,repo,time.time(),canonical(body)))
                db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'success','All PR/review/check pages collected; no agent attribution'))
        except Exception:
            with store.connect() as db: db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'error','Read-only API reconciliation failed; inspect host gh access/rate limits'))

def main():
    p=argparse.ArgumentParser(); p.add_argument('--config',required=True); a=p.parse_args(); c=json.loads(pathlib.Path(a.config).read_text()); reconcile(Store(c['database']),c['githubRepositories'])
if __name__=='__main__':main()
