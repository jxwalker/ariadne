"""Run migration/rollback against the existing disposable Postgres harness."""
import unittest
import test_master_ledger as ledger
from scorecard.storage import ROOT


class ScorecardMigration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        ledger.LedgerContract.setUpClass()

    @classmethod
    def tearDownClass(cls):
        ledger.LedgerContract.tearDownClass()

    def test_isolated_schema_constraints_roles_and_rollback(self):
        sql = ledger.LedgerContract.sql
        before = sql('SELECT count(*) FROM master.journal;', database='ledger_test')
        sql((ROOT/'migrations/master/005-scorecard.sql').read_text(),database='ledger_test',raw=True)
        for quality in ['canonical','correlated','source-only','unbound']:
            sql(f"INSERT INTO scorecard.sc_pr_attribution VALUES ('{quality}','jxwalker/ariadne','{{}}','{quality}');",database='ledger_test',raw=True)
        for quality in ["'invented'", 'NULL']:
            with self.assertRaises(AssertionError):
                sql(f"INSERT INTO scorecard.sc_daily_metrics VALUES ('invalid','jxwalker/ariadne','{{}}',{quality});",database='ledger_test',raw=True)
        sql('CREATE ROLE scorecard_reader; GRANT USAGE ON SCHEMA scorecard TO scorecard_reader; GRANT SELECT ON ALL TABLES IN SCHEMA scorecard TO scorecard_reader;',database='ledger_test',raw=True)
        sql('SET ROLE scorecard_reader; SELECT * FROM scorecard.gh_pr;',database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):
            sql('SET ROLE scorecard_reader; DELETE FROM scorecard.gh_pr;',database='ledger_test',raw=True)
        with self.assertRaises(AssertionError):
            sql('SET ROLE scorecard_reader; SELECT * FROM master.journal;',database='ledger_test',raw=True)
        self.assertEqual(sql('SELECT count(*) FROM master.journal;',database='ledger_test'),before)
        sql((ROOT/'migrations/master/005-scorecard-rollback.sql').read_text(),database='ledger_test',raw=True)
        self.assertEqual(sql("SELECT count(*) FROM information_schema.schemata WHERE schema_name='scorecard';",database='ledger_test'),0)
        self.assertEqual(sql('SELECT count(*) FROM master.journal;',database='ledger_test'),before)
