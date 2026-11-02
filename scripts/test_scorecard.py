"""Offline scorecard contracts, discovered by the existing Python CI job."""
import json
import sqlite3
import unittest
from unittest.mock import patch
from scorecard.attribution import attribute, trailers
from scorecard.github_ingest import ingest, collect, GitHub
from scorecard.scorecard_project import project, ci
from scorecard.storage import ROOT, CONFIG, connect, rows


class Scorecard(unittest.TestCase):
    def test_attribution(self):
        bot = 'box-ariadne-bot'
        self.assertEqual(trailers('Title\n\nbOt: '+bot), [bot])
        self.assertEqual(trailers('Bot: '+bot+'\n\nFinal paragraph'), [])
        self.assertEqual(trailers('Title\nBot: '+bot), [])
        self.assertEqual(attribute([], ['Bot:'+bot], [bot])[0], bot)
        self.assertEqual(attribute([], ['bOt:'+bot], [bot])[0], bot)
        self.assertEqual(attribute(['Title\n\nBot: '+bot], ['BOT:other'], [bot])[2], 'conflict')
        self.assertEqual(attribute([], ['bot:'+bot.upper()], [bot])[0], 'unattributed')
        self.assertEqual(attribute([], ['bot:unknown'], [bot])[0], 'unattributed')
        self.assertEqual(attribute(['Title\n\nBot: '+bot], ['bot:other'], [bot])[2], 'conflict')
        self.assertEqual(attribute(['Title\n\nBot: '+bot], ['bot:'+bot], [bot])[:2], (bot,'source-only'))
        self.assertEqual(attribute(['Title\n\nBot: '+bot+'\nBot: other'], [], [bot])[2], 'conflict')

    def test_projection_incremental_idempotent_and_allowlist(self):
        db = connect(':memory:'); self.addCleanup(db.close)
        bundle = json.loads((ROOT/'test/fixtures/scorecard/ariadne.json').read_text())
        ingest(db, [bundle, dict(bundle, repo='jxwalker/secret')])
        ingest(db, [bundle])
        self.assertEqual(len(rows(db, 'gh_pr')), 4)
        self.assertEqual(rows(db, 'gh_revert_link')[0]['original_pr'],1)
        first = project(db)
        self.assertEqual(first, project(db))
        self.assertEqual(sum(r.get('reverts',0) for r in first),0)
        self.assertEqual(sum(r.get('suspected_fixups',0) for r in first),1)
        self.assertEqual(sum(r.get('human_review_rounds',0) for r in first),4)
        self.assertEqual(sum(r.get('first_ci_pass',0) for r in first),0)
        self.assertEqual(sum(r.get('merge_ci_pass',0) for r in first),2)
        self.assertTrue(all(r['binding_quality'] in ('source-only','unbound') for r in first))
        self.assertEqual(ci(dict(bundle['prs'][0],required_checks=[])), (None,None))
        with self.assertRaises(sqlite3.IntegrityError):
            db.execute("INSERT INTO sc_pr_attribution VALUES ('x','x','{}','invented')")

    def test_only_merged_reverts_charge_original_bot(self):
        bundle = json.loads((ROOT/'test/fixtures/scorecard/ariadne.json').read_text())
        reverting = next(pr for pr in bundle['prs'] if pr['number'] == 3)
        merged_at = '2026-10-03T12:00:00Z'
        db = connect(':memory:'); self.addCleanup(db.close)
        for state, merged in [('open', None), ('closed', None), ('closed', merged_at)]:
            with self.subTest(state=state, merged=merged):
                reverting.update(state=state, merged_at=merged,
                                 closed_at=merged_at if state == 'closed' else None)
                ingest(db, [bundle])
                self.assertTrue(rows(db, 'gh_revert_link'))
                metrics = project(db)
                charged = [r for r in metrics if r.get('reverts')]
                self.assertEqual(sum(r.get('reverts', 0) for r in metrics), int(bool(merged)))
                if merged:
                    self.assertEqual(charged[0]['bot'], 'box-ariadne-bot')

    def test_public_private_and_incremental(self):
        db=connect(':memory:'); self.addCleanup(db.close)
        class Fake:
            token=None
            def get(self, path):
                return [{'private': True}]
        with patch('builtins.print') as report:
            self.assertEqual(list(collect(db, Fake())), [])
            self.assertEqual(report.call_count, 4)
        self.assertEqual(CONFIG['repositories']['jxwalker/tech-demos']['registered'],False)

    def test_missing_token(self):
        from scorecard.github_ingest import main
        with patch('sys.argv',['ingest','--token-env','UNAPPROVED_SCORECARD_TOKEN']), patch.dict('os.environ',{},clear=True), patch('sys.stderr') as err:
            with self.assertRaises(SystemExit): main()
            self.assertIn('TOKEN REQUIRED (not approved: D2)', ''.join(c.args[0] for c in err.write.call_args_list))

    def test_migration_boundary(self):
        sql=(ROOT/'migrations/master/005-scorecard.sql').read_text()
        self.assertNotIn('REFERENCES master.',sql)
        self.assertNotIn('INSERT INTO master.',sql)
        self.assertEqual(sql.count('CREATE TABLE scorecard.'),7)
        self.assertIn('DROP SCHEMA IF EXISTS scorecard CASCADE',(ROOT/'migrations/master/005-scorecard-rollback.sql').read_text())

    def test_rest_pagination_tls_and_rate_limits(self):
        import io
        import urllib.error
        class Response(io.StringIO):
            def __init__(self, body, headers):
                super().__init__(json.dumps(body)); self.headers=headers
        replies=[Response([{'id':1}],{'Link':'<https://api.github.com/next>; rel="next"'}),Response([{'id':2}],{})]
        with patch('urllib.request.OpenerDirector.open',side_effect=replies) as request:
            self.assertEqual(GitHub().get('repos/jxwalker/ariadne/pulls'),[{'id':1},{'id':2}])
            import ssl
            self.assertTrue(ssl.create_default_context().check_hostname)
            self.assertNotIn('Authorization', request.call_args.args[0].headers)
        error=urllib.error.HTTPError('https://api.github.com/',429,'limited',{'Retry-After':'10'},None)
        with patch('urllib.request.OpenerDirector.open',side_effect=error):
            with self.assertRaisesRegex(RuntimeError,'retry after 10'): GitHub().get('repos/jxwalker/ariadne')

    def test_projection_rollback(self):
        db=connect(':memory:'); self.addCleanup(db.close)
        bundle=json.loads((ROOT/'test/fixtures/scorecard/ariadne.json').read_text())
        ingest(db,[bundle]);expected=project(db)
        with patch('scorecard.scorecard_project.attribute',side_effect=ValueError('invalid evidence')):
            with self.assertRaises(ValueError): project(db)
        self.assertEqual(rows(db,'sc_daily_metrics'),expected)

    def test_live_contract_without_network(self):
        db=connect(':memory:'); self.addCleanup(db.close)
        bundle=json.loads((ROOT/'test/fixtures/scorecard/ariadne.json').read_text())
        pr=dict(bundle['prs'][0],base={'ref':'main'})
        calls=[]
        policy = ['test']
        class Fake:
            token=None
            def get(self,path):
                calls.append(path)
                if path=='repos/jxwalker/ariadne': return [{'private':False}]
                if path.count('/')==2: return [{'private':True}]
                if '/protection/' in path:
                    if policy is None:
                        import urllib.error
                        raise urllib.error.HTTPError(path, 403, 'unavailable', {}, None)
                    return [{'contexts':policy,'checks':[]}]
                if '/statuses?' in path: return []
                if '/check-runs?' in path: return pr['checks']
                if '/reviews?' in path: return pr['reviews']
                if '/commits?' in path: return pr['commits']
                if '/files?' in path: return [{'filename':f} for f in pr['files']]
                return [dict(pr)]
        with patch('builtins.print'):
            ingest(db,collect(db,Fake()))
        self.assertEqual(rows(db,'gh_pr')[0]['required_checks'],['test'])
        self.assertEqual(ci(rows(db,'gh_pr')[0]),(False,True))
        calls.clear()
        with patch('builtins.print'):
            ingest(db,collect(db,Fake()))
        self.assertFalse(any('/reviews?' in path for path in calls))
        self.assertTrue(any('/check-runs?' in path for path in calls))
        self.assertTrue(any('/statuses?' in path for path in calls))
        self.assertEqual(len(rows(db,'gh_pr')),1)

        for policy, expected_ci in [(['test', 'new-required'], (None, None)),
                                    (None, (None, None)),
                                    (['test'], (False, True))]:
            with self.subTest(policy=policy):
                calls.clear()
                with patch('builtins.print'):
                    ingest(db, collect(db, Fake()))
                stored = rows(db, 'gh_pr')[0]
                self.assertEqual(stored['required_checks'], sorted(policy) if policy is not None else None)
                self.assertEqual(ci(stored), expected_ci)
                self.assertTrue(any('/protection/' in path for path in calls))
                self.assertFalse(any('/reviews?' in path for path in calls))
                self.assertFalse(any('/commits?' in path for path in calls))
                self.assertTrue(any('/check-runs?' in path for path in calls))
                self.assertEqual(stored['updated_at'], pr['updated_at'])
