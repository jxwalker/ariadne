"""Transactional, idempotent GitHub-only projection; no signed-event inference."""
import argparse
import collections
import datetime
import json
import re
from pathlib import Path
from .attribution import attribute
from .storage import CONFIG, connect, put, rows


def ci(pr):
    # Required-check policy is explicit evidence. Unknown policy is not a pass.
    required = pr.get('required_checks')
    if not required:
        return None, None
    checks = [c for c in pr.get('checks', []) if c['name'] in required and c.get('status') == 'completed' and c.get('head_sha') == pr.get('head', {}).get('sha')]
    first, eventual = [], []
    for name in required:
        runs = sorted([c for c in checks if c['name'] == name], key=lambda c: (c['completed_at'], c['id']))
        if not runs:
            return None, None
        first.append(runs[0]['conclusion'] == 'success')
        at_merge = [c for c in runs if pr.get('merged_at') and c['completed_at'] <= pr['merged_at']]
        eventual.append(at_merge[-1]['conclusion'] == 'success' if at_merge else False)
    return all(first), all(eventual) if pr.get('merged_at') else None


def project(db):
    try:
        return _project(db)
    except Exception:
        db.rollback()
        raise


def _project(db):
    prs = rows(db, 'gh_pr')
    groups = collections.defaultdict(lambda: collections.Counter())
    db.execute('DELETE FROM sc_pr_attribution')
    db.execute('DELETE FROM sc_daily_metrics')
    for pr in prs:
        repo = pr['repo']
        messages = [c.get('commit', {}).get('message', '') for c in pr.get('commits', [])]
        bot, quality, reason = attribute(messages, [l['name'] if isinstance(l, dict) else l for l in pr.get('labels', [])], CONFIG['sources'])
        key = f"{repo}#{pr['number']}"
        put(db, 'sc_pr_attribution', key, repo, dict(repo=repo, pr=pr['number'], bot=bot, binding_quality=quality, reason=reason), quality)
        events = [('opened', pr['created_at']), ('merged', pr.get('merged_at')), ('closed_unmerged', pr.get('closed_at') if not pr.get('merged_at') else None)]
        first, eventual = ci(pr)
        reviews = pr.get('reviews', [])
        first_review = min((r['submitted_at'] for r in reviews if r.get('submitted_at')), default='9999')
        rounds = sum(r['state'] == 'CHANGES_REQUESTED' for r in reviews) + sum(c.get('commit', {}).get('committer', {}).get('date', '') > first_review for c in pr.get('commits', []))
        day = (pr.get('merged_at') or pr.get('closed_at') or pr['created_at'])[:10]
        counter = groups[(repo, bot, quality, day)]
        counter['review_rounds'] += rounds
        counter['superseded'] += any((l.get('name') if isinstance(l, dict) else l) == 'superseded' for l in pr.get('labels', []))
        counter['bot_reviews'] += sum(r.get('user', {}).get('type') == 'Bot' for r in reviews)
        counter['human_reviews'] += sum(r.get('user', {}).get('type') != 'Bot' for r in reviews)
        counter['bot_changes_requested'] += sum(r['state'] == 'CHANGES_REQUESTED' and r.get('user', {}).get('type') == 'Bot' for r in reviews)
        counter['human_changes_requested'] += sum(r['state'] == 'CHANGES_REQUESTED' and r.get('user', {}).get('type') != 'Bot' for r in reviews)
        for metric, at in events:
            if at:
                groups[(repo, bot, quality, at[:10])][metric] += 1
        counter['first_ci_known'] += first is not None
        counter['first_ci_pass'] += first is True
        counter['merge_ci_known'] += eventual is not None
        counter['merge_ci_pass'] += eventual is True
        reverted = False
        for link in rows(db, 'gh_revert_link'):
            if link['repo'] == repo and link['pr'] == pr['number']:
                if not reverted:
                    counter['reverts'] += 1
                reverted = True

        # Heuristic only: explicit reference + overlapping files within seven days.
        for original in prs:
            if original['repo'] != repo or not original.get('merged_at') or original['number'] == pr['number']:
                continue
            delta = datetime.datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00')) - datetime.datetime.fromisoformat(original['merged_at'].replace('Z', '+00:00'))
            if 0 <= delta.total_seconds() <= 7*86400 and set(pr.get('files', [])) & set(original.get('files', [])) and re.search(r"#" + str(original['number']) + r"\b", pr.get('body') or ''):
                counter['suspected_fixups'] += 1
    output = []
    for (repo, bot, quality, day), counts in sorted(groups.items()):
        row = dict(repo=repo, bot=bot, binding_quality=quality, day=day, **counts)
        for name, numerator, denominator in [('merge_rate', counts['merged'], counts['merged'] + counts['closed_unmerged']), ('first_ci_rate', counts['first_ci_pass'], counts['first_ci_known']), ('merge_ci_rate', counts['merge_ci_pass'], counts['merge_ci_known'])]:
            row[name] = numerator / denominator if denominator else None
        put(db, 'sc_daily_metrics', '|'.join((repo, bot, quality, day)), repo, row, quality)
        output.append(row)
    db.commit()
    return output


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--db', default='scorecard.sqlite')
    parser.add_argument('--output', type=Path, default=Path('scripts/scorecard-data.json'))
    args = parser.parse_args()
    args.output.write_text(json.dumps({'repositories': CONFIG['repositories'], 'metrics': project(connect(args.db))}, indent=2) + '\n')


if __name__ == '__main__':
    main()
