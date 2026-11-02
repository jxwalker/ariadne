"""Regression evidence for PR 180 exact-head reviews."""
import copy
import json
import unittest
import urllib.error
import urllib.request
from unittest.mock import patch
from scorecard.attribution import trailers
from scorecard.github_ingest import ingest, collect, commit_checks, SameOriginRedirect
from scorecard.scorecard_project import ci, project
from scorecard.storage import connect, rows, ROOT


class ReviewFixes(unittest.TestCase):
    def setUp(self):
        self.db = connect(':memory:')
        self.addCleanup(self.db.close)
        self.bundle = json.loads((ROOT/'test/fixtures/scorecard/ariadne.json').read_text())

    def test_first_completed_suite_cannot_mix_passes(self):
        pr = self.bundle['prs'][0]
        pr['required_checks'] = ['a', 'b']
        pr['checks'] = []
        for suite, values in [(1, [('a','success'),('b','failure')]), (2, [('a','failure'),('b','success')])]:
            for i, (name, conclusion) in enumerate(values):
                pr['checks'].append(dict(id=suite*10+i, name=name, conclusion=conclusion,
                    check_suite={'id':suite}, head_sha=pr['head']['sha'], status='completed',
                    completed_at=f'2026-10-01T0{suite+4}:00:00Z'))
        self.assertEqual(ci(pr), (False, False))
        # Repeated runs within a single suite must retain distinct attempts too.
        for check in pr['checks']:
            check['run_attempt'] = check['check_suite']['id']
            check['check_suite']['id'] = 1
        self.assertEqual(ci(pr), (False, False))

    def test_required_contexts_across_suites_count_in_denominator(self):
        pr = self.bundle['prs'][0]
        pr['required_checks'] = ['a', 'b']
        pr['checks'] = [dict(id=i, name=name, conclusion='success',
            check_suite={'id':i}, run_attempt=1, head_sha=pr['head']['sha'],
            status='completed', completed_at=f'2026-10-01T0{i+3}:00:00Z')
            for i, name in enumerate(['a', 'b'], 1)]
        self.assertEqual(ci(pr), (True, True))
        ingest(self.db, [dict(self.bundle, prs=[pr])])
        row = next(r for r in project(self.db) if r.get('merged'))
        self.assertEqual((row['first_ci_known'], row['first_ci_pass']), (1, 1))
        pr['checks'][0]['conclusion'] = 'failure'
        pr['checks'].append(dict(pr['checks'][0], id=3, run_attempt=2,
            conclusion='success', completed_at='2026-10-01T06:00:00Z'))
        self.assertEqual(ci(pr), (False, True))

    def test_pending_check_run_at_merge_never_passes(self):
        pr = self.bundle['prs'][0]
        baseline = ci(pr)
        for status in ('queued', 'in_progress'):
            for started in (None, '2026-10-01T07:00:00Z'):
                with self.subTest(status=status, started=started):
                    pending = dict(pr['checks'][-1], id=999, status=status,
                        conclusion=None, completed_at=None, started_at=started)
                    candidate = dict(pr, checks=pr['checks'] + [pending])
                    self.assertIsNone(ci(candidate)[1])
                    ingest(self.db, [dict(self.bundle, prs=[candidate])])
                    self.assertEqual(sum(r['merge_ci_pass'] for r in project(self.db)), 0)
                    self.assertEqual(sum(r['merge_ci_known'] for r in project(self.db)), 0)
        pending['started_at'] = '2026-10-02T00:00:00Z'
        self.assertEqual(ci(dict(pr, checks=pr['checks'] + [pending]))[1], baseline[1])

    def test_ci_is_per_final_head(self):
        pr = self.bundle['prs'][0]
        pr['checks'][0]['head_sha'] = 'old-head'
        self.assertEqual(ci(pr), (True, True))
        dashboard = (ROOT/'scripts/scorecard_dashboard.js').read_text()
        self.assertIn('final head commit', dashboard)

    def test_refresh_removes_obsolete_children_and_reverts(self):
        ingest(self.db, [self.bundle])
        changed = copy.deepcopy(self.bundle)
        pr = changed['prs'][2]
        pr['commits'] = []
        pr['reviews'] = []
        pr['checks'] = []
        ingest(self.db, [changed])
        fresh = connect(':memory:'); self.addCleanup(fresh.close)
        ingest(fresh, [changed])
        for table in ('gh_pr','gh_review','gh_commit_pr','gh_check_run','gh_revert_link'):
            self.assertEqual(rows(self.db, table), rows(fresh, table))
        self.assertEqual(project(self.db), project(fresh))
        self.assertEqual(sum(r.get('reverts',0) for r in project(self.db)),0)
        # Failure after deletion restores the previous snapshot.
        before = rows(self.db, 'gh_review')
        with patch('scorecard.github_ingest.put', side_effect=ValueError('bad')):
            with self.assertRaises(ValueError): ingest(self.db, [self.bundle])
        self.assertEqual(rows(self.db,'gh_review'),before)

    def test_reverts_charge_original_bot_and_day_once(self):
        self.bundle['prs'][2]['merged_at'] = '2026-10-03T12:00:00Z'
        self.bundle['prs'][2]['labels'] = ['bot:box-scorpion-build-bot']
        self.bundle['prs'][2]['title'] = 'Revert "example"'
        self.bundle['prs'][2]['body'] = '#1'
        ingest(self.db, [self.bundle])
        charged = [r for r in project(self.db) if r.get('reverts')]
        self.assertEqual([(r['bot'],r['day'],r['reverts']) for r in charged],
                         [('box-ariadne-bot','2026-10-01',1)])

    def test_revert_resolves_merged_pr_merge_sha(self):
        original, other, reverting = self.bundle['prs'][:3]
        merge_sha = 'abcdef0123456789abcdef0123456789abcdef01'
        original['merge_commit_sha'] = merge_sha
        reverting.update(merged_at='2026-10-03T12:00:00Z', body='')
        message = reverting['commits'][0]['commit']
        for reference in (merge_sha, merge_sha[:7]):
            with self.subTest(reference=reference):
                message['message'] = 'This reverts commit ' + reference
                ingest(self.db, [self.bundle])
                link, = rows(self.db, 'gh_revert_link')
                self.assertEqual(link['original_pr'], 1)
                self.assertEqual(link['candidate_prs'], [1])
                charged = [r for r in project(self.db) if r.get('reverts')]
                self.assertEqual([(r['bot'], r['day'], r['reverts']) for r in charged],
                                 [('box-ariadne-bot', '2026-10-01', 1)])

        # A constituent and merge SHA for the same PR remain one candidate.
        original['commits'][0]['sha'] = merge_sha
        ingest(self.db, [self.bundle])
        self.assertEqual(rows(self.db, 'gh_revert_link')[0]['candidate_prs'], [1])

        # Collisions with either kind of SHA must remain unresolved.
        for source in ('merge', 'constituent'):
            with self.subTest(collision=source):
                other['merge_commit_sha'] = merge_sha if source == 'merge' else None
                other['commits'][0]['sha'] = merge_sha if source == 'constituent' else '2' * 40
                ingest(self.db, [self.bundle])
                link, = rows(self.db, 'gh_revert_link')
                self.assertIsNone(link['original_pr'])
                self.assertEqual(link['candidate_prs'], [1, 2])
                self.assertEqual(sum(r.get('reverts', 0) for r in project(self.db)), 0)

    def test_unmerged_pr_merge_sha_is_not_a_revert_candidate(self):
        original, _, reverting = self.bundle['prs'][:3]
        original.update(merged_at=None, merge_commit_sha='a' * 40)
        reverting.update(merged_at='2026-10-03T12:00:00Z', body='')
        reverting['commits'][0]['commit']['message'] = 'This reverts commit ' + 'a' * 40
        ingest(self.db, [self.bundle])
        link, = rows(self.db, 'gh_revert_link')
        self.assertIsNone(link['original_pr'])
        self.assertEqual(link['candidate_prs'], [])
        self.assertEqual(sum(r.get('reverts', 0) for r in project(self.db)), 0)

    def test_legacy_status_history_and_pending_merge(self):
        class Fake:
            def get(self, path):
                if '/check-runs?' in path: return []
                return [dict(id=2,context='test',state='success',created_at='2026-10-01T06:00:00Z'),
                        dict(id=1,context='test',state='failure',created_at='2026-10-01T05:00:00Z')]
        pr = self.bundle['prs'][0]
        pr['checks'] = commit_checks(Fake(),self.bundle['repo'],pr['head']['sha'])
        self.assertEqual(ci(pr), (False, True))
        pr['checks'].append(dict(pr['checks'][0],id='status:3',status='in_progress',
            created_at='2026-10-01T07:00:00Z',completed_at='2026-10-01T07:00:00Z'))
        self.assertEqual(ci(pr), (False, None))

    def test_legacy_pending_resolved_by_latest_status_at_merge(self):
        pr = self.bundle['prs'][0]
        class Fake:
            def get(self, path):
                if '/check-runs?' in path:
                    return []
                return [dict(id=i, context='test', state=state, created_at=at)
                        for i, state, at in [
                            (1, 'pending', '2026-10-01T05:00:00Z'),
                            (2, 'success', '2026-10-01T06:00:00Z'),
                            (3, 'pending', '2026-10-02T00:00:00Z')]]
        checks = commit_checks(Fake(), self.bundle['repo'], pr['head']['sha'])
        for legacy_payload in (False, True):
            with self.subTest(legacy_payload=legacy_payload):
                candidate = copy.deepcopy(checks)
                if legacy_payload:
                    for check in candidate:
                        check.pop('created_at')
                # API order must not change which event is selected.
                for ordered in (candidate, list(reversed(candidate))):
                    self.assertEqual(ci(dict(pr, checks=ordered)), (True, True))

    def test_check_run_state_reconstructed_at_merge(self):
        pr = self.bundle['prs'][0]
        pr['required_checks'] = ['test']
        pr['merged_at'] = '2026-10-01T08:00:00Z'
        success = dict(id=1, name='test', head_sha=pr['head']['sha'],
            status='completed', conclusion='success',
            started_at='2026-10-01T05:00:00Z', completed_at='2026-10-01T06:00:00Z')
        for prior_success in (False, True):
            for completed in (None, '2026-10-01T09:00:00Z'):
                for start_key in ('started_at', 'created_at'):
                    with self.subTest(prior_success=prior_success, completed=completed,
                                      start_key=start_key):
                        rerun = dict(success, id=2, status='completed' if completed else 'in_progress',
                                     completed_at=completed)
                        rerun.pop('started_at')
                        rerun[start_key] = pr['merged_at']
                        checks = ([success] if prior_success else []) + [rerun]
                        self.assertIsNone(ci(dict(pr, checks=checks))[1])
                        if completed:
                            undated = dict(rerun)
                            undated.pop(start_key)
                            self.assertIsNone(ci(dict(pr, checks=[success, undated]))[1])
                        # Once it completes at merge, its success is known.
                        rerun.update(status='completed', completed_at=pr['merged_at'])
                        self.assertIs(ci(dict(pr, checks=checks))[1], True)
                        # A run known to start after merge cannot replace success.
                        rerun[start_key] = '2026-10-01T09:00:00Z'
                        rerun['completed_at'] = '2026-10-01T10:00:00Z'
                        self.assertIs(ci(dict(pr, checks=[success, rerun]))[1], True)

    def test_latest_attempt_per_context_across_split_suites(self):
        pr = self.bundle['prs'][0]
        pr['required_checks'] = ['a', 'b']
        pr['merged_at'] = '2026-10-01T08:00:00Z'
        pr['checks'] = [dict(id=i, name=name, check_suite={'id': i}, run_attempt=1,
            head_sha=pr['head']['sha'], status='completed', conclusion='success',
            started_at='2026-10-01T04:00:00Z', completed_at='2026-10-01T05:00:00Z')
            for i, name in enumerate(['a', 'b'], 1)]
        self.assertEqual(ci(pr), (True, True))
        rerun = dict(pr['checks'][0], id=3, run_attempt=2,
            started_at='2026-10-01T07:00:00Z', completed_at='2026-10-01T09:00:00Z')
        pr['checks'].append(rerun)
        self.assertEqual(ci(pr), (True, None))
        ingest(self.db, [dict(self.bundle, prs=[pr])])
        row = next(r for r in project(self.db) if r.get('merged'))
        self.assertEqual((row['merge_ci_known'], row['merge_ci_pass']), (0, 0))
        rerun['completed_at'] = pr['merged_at']
        self.assertEqual(ci(pr), (True, True))

    def test_redirect_host_rejected_before_forwarding_token(self):
        handler = SameOriginRedirect()
        req = urllib.request.Request('https://api.github.com/start',headers={'Authorization':'Bearer secret'})
        for target in ('https://evil.example/','http://api.github.com/','https://api.github.com@evil.example/'):
            with self.assertRaisesRegex(ValueError,'redirect origin'):
                handler.redirect_request(req,None,302,'redirect',{},target)
        redirected = handler.redirect_request(req,None,302,'redirect',{},'https://api.github.com/next')
        self.assertEqual(redirected.get_header('Authorization'),'Bearer secret')

    def test_review_rounds_split_without_commit_push_guess(self):
        pr = self.bundle['prs'][0]
        pr['reviews'].append(dict(id=9,state='CHANGES_REQUESTED',submitted_at='2026-10-01T01:00:00Z',user={'type':'Bot'}))
        pr['commits'].append(copy.deepcopy(pr['commits'][0]))
        ingest(self.db,[dict(self.bundle,prs=[pr])])
        row = next(r for r in project(self.db) if r.get('merged'))
        self.assertEqual((row['bot_review_rounds'],row['human_review_rounds']), (1,1))
        dashboard = (ROOT/'scripts/scorecard_dashboard.js').read_text()
        self.assertIn("sum('bot_review_rounds')", dashboard)
        self.assertIn("sum('human_review_rounds')", dashboard)

    def test_completed_bundle_survives_generator_failure(self):
        def bundles():
            yield self.bundle
            raise RuntimeError('later repository failed')
        with self.assertRaisesRegex(RuntimeError,'later repository'):
            ingest(self.db,bundles())
        self.assertEqual(len(rows(self.db,'gh_pr')),4)

    def test_subcall_404_is_not_missing_repository(self):
        class Fake:
            token = None
            def get(self,path):
                if path == 'repos/jxwalker/ariadne': return [{'private':False}]
                raise urllib.error.HTTPError('https://api.github.com/',404,'missing',{},None)
        with patch('builtins.print') as report:
            with self.assertRaisesRegex(RuntimeError,'GitHub HTTP 404'):
                list(collect(self.db,Fake()))
            report.assert_not_called()

    def test_projection_reads_revert_links_once(self):
        ingest(self.db,[self.bundle])
        from scorecard.storage import rows as read_rows
        with patch('scorecard.scorecard_project.rows', wraps=read_rows) as read:
            result = project(self.db)
        self.assertEqual(sum(c.args[1] == 'gh_revert_link' for c in read.call_args_list),1)
        self.assertEqual(sum(r.get('suspected_fixups',0) for r in result),1)

    def test_subject_required_for_trailer(self):
        self.assertEqual(trailers('Bot: box-ariadne-bot'),[])
        self.assertEqual(trailers('Subject\n\nBot: box-ariadne-bot'),['box-ariadne-bot'])

    def test_postgres_adapter_commits_session_setup_and_wraps_jsonb(self):
        import sys
        import types
        from unittest.mock import Mock
        from scorecard.storage import put
        db = Mock()
        driver = types.ModuleType('psycopg')
        driver.connect = Mock(return_value=db)
        json_module = types.ModuleType('psycopg.types.json')
        class Jsonb:
            def __init__(self, obj): self.obj = obj
        json_module.Jsonb = Jsonb
        with patch.dict(sys.modules, {'psycopg':driver, 'psycopg.types':types.ModuleType('psycopg.types'), 'psycopg.types.json':json_module}):
            self.assertIs(connect('postgresql:///disposable'),db)
            db.execute.assert_called_once_with('SET search_path TO scorecard')
            db.commit.assert_called_once_with()
            payload = dict(repo=self.bundle['repo'],number=1)
            put(db,'gh_pr','key',self.bundle['repo'],payload)
            self.assertEqual(db.execute.call_args.args[1][2].obj,payload)

    def test_rollback_is_repeatable(self):
        rollback = (ROOT/'migrations/master/005-scorecard-rollback.sql').read_text()
        self.assertIn('DROP SCHEMA IF EXISTS scorecard CASCADE',rollback)

    def test_missing_or_ambiguous_suite_evidence_is_unknown(self):
        pr = self.bundle['prs'][0]
        pr['required_checks'] = ['test','other']
        self.assertEqual(ci(pr)[0],None)
        pr['checks'].extend([dict(c,name='other') for c in list(pr['checks'])])
        self.assertEqual(ci(pr)[0],None)
