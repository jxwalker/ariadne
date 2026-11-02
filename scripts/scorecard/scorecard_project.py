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
    checks = [c for c in pr.get('checks', []) if c['name'] in required
              and c.get('head_sha') == pr.get('head', {}).get('sha')]
    if any(not any(c['name'] == name for c in checks) for name in required):
        return None, None
    # Each required context may belong to a different workflow/suite. Select
    # its first completed attempt independently, never a later passing rerun.
    first_results = []
    for name in required:
        runs = [c for c in checks if c['name'] == name]
        identities = collections.Counter(
            (c.get('evidence_type', 'check_run'),
             (c.get('check_suite') or {}).get('id'), c.get('run_attempt'))
            for c in runs)
        ambiguous = len(required) > 1 and any(
            count > 1 and identity[2] is None
            for identity, count in identities.items())
        completed = sorted(
            (c for c in runs if c.get('status') == 'completed' and c.get('completed_at')),
            key=lambda c: (c['completed_at'], str(c['id'])))
        first_results.append(None if ambiguous or not completed else
                             completed[0].get('conclusion') == 'success')
    first = None if None in first_results else all(first_results)
    eventual = None
    if pr.get('merged_at'):
        merge_results = []
        for name in required:
            snapshot = []
            undated_pending = False
            for check in (c for c in checks if c['name'] == name):
                if check.get('evidence_type') == 'commit_status':
                    # Statuses are immutable events, including pending events.
                    # Older ingests stored their event time in completed_at.
                    at = check.get('created_at') or check.get('completed_at')
                else:
                    # Order attempts by their start, not by their completion:
                    # a rerun can finish after merge yet be outstanding then.
                    at = check.get('started_at') or check.get('created_at')
                    if not at and (check.get('completed_at') or '') <= pr['merged_at']:
                        at = check.get('completed_at')
                if not at:
                    undated_pending = True
                elif at <= pr['merged_at']:
                    snapshot.append((at, str(check['id']), check))
            if undated_pending or not snapshot:
                merge_results.append(None)
                continue
            latest = max(snapshot, key=lambda item: item[:2])[2]
            completed = latest.get('completed_at')
            if (latest.get('status') != 'completed' or not completed
                    or completed > pr['merged_at']):
                merge_results.append(None)
            else:
                merge_results.append(latest.get('conclusion') == 'success')
        eventual = None if None in merge_results else all(merge_results)
    return first, eventual


def project(db):
    try:
        return _project(db)
    except Exception:
        db.rollback()
        raise


def _project(db):
    prs = rows(db, 'gh_pr')
    groups = collections.defaultdict(lambda: collections.Counter())
    originals = {(p['repo'], p['number']): p for p in prs}
    revert_targets = collections.defaultdict(set)
    for link in rows(db, 'gh_revert_link'):
        reverting = originals.get((link['repo'], link['pr']))
        if link.get('original_pr') is not None and reverting and reverting.get('merged_at'):
            revert_targets[(link['repo'], link['original_pr'])].add(link['pr'])

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
        day = (pr.get('merged_at') or pr.get('closed_at') or pr['created_at'])[:10]
        counter = groups[(repo, bot, quality, day)]
        # GitHub commit timestamps cannot establish push events. Count review
        # requests separately by reviewer type; do not label commits as pushes.
        counter['reverts'] += len(revert_targets[(repo, pr['number'])])
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
        counter['bot_review_rounds'] += sum(r['state'] == 'CHANGES_REQUESTED' and r.get('user', {}).get('type') == 'Bot' for r in reviews)
        counter['human_review_rounds'] += sum(r['state'] == 'CHANGES_REQUESTED' and r.get('user', {}).get('type') != 'Bot' for r in reviews)

        # Look up only explicit references instead of scanning every PR pair.
        for number in set(re.findall(r'#(\d+)\b', pr.get('body') or '')):
            original = originals.get((repo, int(number)))
            if not original or not original.get('merged_at') or original['number'] == pr['number']:
                continue
            delta = datetime.datetime.fromisoformat(pr['created_at'].replace('Z', '+00:00')) - datetime.datetime.fromisoformat(original['merged_at'].replace('Z', '+00:00'))
            if 0 <= delta.total_seconds() <= 7*86400 and set(pr.get('files', [])) & set(original.get('files', [])):
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
