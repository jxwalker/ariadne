#!/usr/bin/env python3
"""Read-only paginated GitHub reconciliation using existing host gh auth. No token output."""
import argparse,hashlib,json,pathlib,subprocess,time
from activity_server import Store,canonical

# Repository metadata embedded in every historical PR changes independently of the PR.
# Keep full raw bodies in history on meaningful changes and in the current index on every poll.
REPO_VOLATILE = {'pushed_at', 'updated_at', 'open_issues', 'open_issues_count', 'size',
                 'stargazers_count', 'watchers_count', 'watchers', 'forks', 'forks_count', 'subscribers_count'}

def meaningful(value, repository=False):
    if isinstance(value, dict):
        return {k: meaningful(v, k in {'repo','repository'}) for k,v in value.items()
                if not (repository and k in REPO_VOLATILE)}
    if isinstance(value, list):return [meaningful(v) for v in value]
    return value

def version_digest(body):
    return hashlib.sha256(canonical(meaningful(body)).encode()).hexdigest()

def record_observation(db, ident, repo, body, at):
    raw=canonical(body);old=db.execute('SELECT body FROM observations WHERE id=?',(ident,)).fetchone()
    # Compare the prior current body too: prevents a one-time duplicate after upgrading the digest.
    if old is None or version_digest(json.loads(old[0]))!=version_digest(body):
        version=ident+':'+version_digest(body)
        db.execute('INSERT OR IGNORE INTO observation_history VALUES(?,?,?)',(version,at,raw))
    db.execute('INSERT OR REPLACE INTO observations VALUES(?,?,?,?)',(ident,repo,at,raw))

def pages(endpoint):
    # Older deployed gh 2.46 supports --paginate but not --slurp. Decode concatenated pages.
    r=subprocess.run(['gh','api','--paginate',endpoint],check=True,capture_output=True,text=True,timeout=120)
    decoder=json.JSONDecoder();text=r.stdout;result=[]
    while text.strip():
        page,end=decoder.raw_decode(text.lstrip());result.append(page);text=text.lstrip()[end:]
    return result

def persist_observations(store,repo,observations,batch_size=25):
    # Network work is already outside SQLite. Bound each write lock so ingestion,
    # snapshot import and the projection worker can commit between GitHub batches.
    for start in range(0,len(observations),batch_size):
        with store.connect() as db:
            for ident,body in observations[start:start+batch_size]:
                record_observation(db,ident,repo,body,time.time())
        # SQLite's busy handler backs off to 100 ms. A shorter gap can repeatedly
        # miss waiting producers and starve them despite nominally small commits.
        if start+batch_size<len(observations):time.sleep(0.1)

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
            persist_observations(store,repo,observations)
            with store.connect() as db:
                db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'success','All PR pages collected; associated task review/check pages collected; no agent attribution'))
        except Exception:
            with store.connect() as db: db.execute('INSERT OR REPLACE INTO health VALUES(?,?,?,?)',('github:'+repo,time.time(),'error','Read-only API reconciliation failed; inspect host gh access/rate limits'))

def main():
    p=argparse.ArgumentParser(); p.add_argument('--config',required=True); a=p.parse_args(); c=json.loads(pathlib.Path(a.config).read_text()); reconcile(Store(c['database']),c['githubRepositories'])
if __name__=='__main__':main()
