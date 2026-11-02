"""Read-only GitHub ingestion. Raw responses are retained before projection."""
import argparse
import json
import os
import re
import ssl
import urllib.error
import urllib.request
import urllib.parse
from pathlib import Path
from .storage import CONFIG, ROOT, connect, put, rows


class GitHub:
    def __init__(self, token=None):
        self.token = token
        self.reset = None

    def get(self, path):
        if self.reset is not None:
            raise RuntimeError('GitHub rate limit exhausted; retry after ' + self.reset)
        result = []
        url = 'https://api.github.com/' + path
        while url:
            if not url.startswith('https://api.github.com/'):
                raise ValueError('Unexpected pagination origin')
            headers = {'Accept': 'application/vnd.github+json', 'User-Agent': 'ariadne-scorecard'}
            if self.token:
                # TOKEN-REQUIRED(D2): authenticated REST reads, never print headers.
                headers['Authorization'] = 'Bearer ' + self.token
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=headers), context=ssl.create_default_context()) as response:
                    payload = json.load(response)
                    result.extend(payload if isinstance(payload, list) else payload.get('check_runs', [payload]))
                    link = re.search(r'<([^>]+)>; rel="next"', response.headers.get('Link', ''))
                    url = link.group(1) if link else None
                    if response.headers.get('X-RateLimit-Remaining') == '0':
                        self.reset = response.headers.get('X-RateLimit-Reset', 'reset')
                        if url:
                            raise RuntimeError('GitHub rate limit exhausted; retry after ' + self.reset)
            except urllib.error.HTTPError as error:
                if error.code == 429 or (error.code == 403 and (error.headers.get('X-RateLimit-Remaining') == '0' or error.headers.get('Retry-After'))):
                    raise RuntimeError('GitHub rate limited; retry after ' + error.headers.get('Retry-After', error.headers.get('X-RateLimit-Reset', 'reset'))) from None
                raise
        return result


def ingest(db, bundles):
    try:
        _ingest(db, bundles)
    except Exception:
        db.rollback()
        raise


def _ingest(db, bundles):
    for bundle in bundles:
        repo = bundle['repo']
        if repo not in CONFIG['repositories']:
            continue
        for pr in bundle['prs']:
            pr = dict(pr, repo=repo)
            key = f"{repo}#{pr['number']}"
            for field, table in [('reviews', 'gh_review'), ('commits', 'gh_commit_pr'), ('checks', 'gh_check_run')]:
                for item in pr.get(field, []):
                    put(db, table, key + ':' + str(item.get('id', item.get('sha'))), repo, dict(item, repo=repo, pr=pr['number']))
            if re.match(r'^Revert \"', pr.get('title', '')):
                reference = re.search(r'#(\d+)', pr.get('body') or '')
                if reference:
                    put(db, 'gh_revert_link', key + ':pr', repo, dict(id=key + ':pr', repo=repo, pr=pr['number'], original_pr=int(reference[1])))
            for commit in pr.get('commits', []):
                match = re.search(r'This reverts commit ([0-9a-f]{7,40})', commit.get('commit', {}).get('message', ''), re.I)
                if match:
                    put(db, 'gh_revert_link', key + ':' + commit['sha'], repo, dict(id=key + ':' + commit['sha'], repo=repo, pr=pr['number'], reverted_sha=match[1]))
            put(db, 'gh_pr', key, repo, pr)
    commits = [(p['repo'], c['sha'], p['number']) for p in rows(db, 'gh_pr') for c in p.get('commits', [])]
    for link in rows(db, 'gh_revert_link'):
        if link.get('reverted_sha'):
            candidates = sorted({n for repo, sha, n in commits if repo == link['repo'] and sha.startswith(link['reverted_sha'])})
            link['original_pr'] = candidates[0] if len(candidates) == 1 else None
            link['candidate_prs'] = candidates
            put(db, 'gh_revert_link', link['id'], link['repo'], link)
    db.commit()


def collect(db, client):
    existing = {(p['repo'], p['number']): p for p in rows(db, 'gh_pr')}
    for repo in CONFIG['repositories']:
        try:
            metadata = client.get(f'repos/{repo}')[0]
            if metadata.get('private') and not client.token:
                # TOKEN-REQUIRED(D2): private repository evidence needs approved credentials.
                print(f'{repo}: skipped private repository (token required)')
                continue
            prs = []
            policies = {}
            for pr in client.get(f'repos/{repo}/pulls?state=all&sort=updated&direction=desc&per_page=100'):
                previous = existing.get((repo, pr['number']))
                if previous and previous.get('updated_at') == pr.get('updated_at'):
                    previous['checks'] = [check for commit in previous.get('commits', []) for check in client.get(f"repos/{repo}/commits/{commit['sha']}/check-runs?filter=all&per_page=100")]
                    prs.append(previous)
                    continue
                base = f"repos/{repo}/pulls/{pr['number']}"
                pr = client.get(base)[0]
                branch = pr.get('base', {}).get('ref')
                if branch and branch not in policies:
                    try:
                        # TOKEN-REQUIRED(D2): private/protected branch policy may need approved access.
                        policy = client.get(f'repos/{repo}/branches/{urllib.parse.quote(branch, safe="")}/protection/required_status_checks')[0]
                        policies[branch] = sorted(set(policy.get('contexts', []) + [c['context'] for c in policy.get('checks', [])]))
                    except urllib.error.HTTPError as error:
                        if error.code not in (401, 403, 404):
                            raise
                        policies[branch] = None
                        print(f'{repo}: required-check policy unavailable; CI denominator unknown')
                pr['required_checks'] = policies.get(branch)
                pr['reviews'] = client.get(base + '/reviews?per_page=100')
                pr['commits'] = client.get(base + '/commits?per_page=100')
                pr['files'] = [f['filename'] for f in client.get(base + '/files?per_page=100')]
                # Historical commit checks preserve first-run failures across pushes.
                pr['checks'] = [check for commit in pr['commits'] for check in client.get(f"repos/{repo}/commits/{commit['sha']}/check-runs?filter=all&per_page=100")]
                prs.append(pr)
            yield {'repo': repo, 'prs': prs}
        except urllib.error.HTTPError as error:
            if error.code == 404:
                print(f'{repo}: skipped inaccessible/private or missing repository (token required for private)')
            else:
                raise RuntimeError(f'{repo}: GitHub HTTP {error.code}') from None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--fixtures', type=Path, default=None)
    mode.add_argument('--public', action='store_true')
    mode.add_argument('--token-env')
    parser.add_argument('--db', default='scorecard.sqlite')
    args = parser.parse_args()
    token = None
    if args.token_env:
        # TOKEN-REQUIRED(D2): the only token input; no implicit environment lookup.
        token = os.environ.get(args.token_env)
        if not token:
            parser.error('TOKEN REQUIRED (not approved: D2)')
    db = connect(args.db)
    if args.public or args.token_env:
        ingest(db, collect(db, GitHub(token)))
    else:
        directory = args.fixtures or ROOT / 'test/fixtures/scorecard'
        ingest(db, [json.loads(p.read_text()) for p in sorted(directory.glob('*.json'))])


if __name__ == '__main__':
    main()
