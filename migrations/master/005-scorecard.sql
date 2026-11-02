-- Isolated scorecard evidence; no canonical ledger writes.
BEGIN;
CREATE SCHEMA scorecard;
REVOKE ALL ON SCHEMA scorecard FROM PUBLIC;
CREATE TABLE scorecard.gh_pr (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL);
CREATE TABLE scorecard.gh_review (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL);
CREATE TABLE scorecard.gh_check_run (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL);
CREATE TABLE scorecard.gh_commit_pr (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL);
CREATE TABLE scorecard.gh_revert_link (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL);
CREATE TABLE scorecard.sc_pr_attribution (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL, binding_quality text NOT NULL CHECK(binding_quality IN ('canonical','correlated','source-only','unbound')));
CREATE TABLE scorecard.sc_daily_metrics (id text PRIMARY KEY, repo text NOT NULL, body jsonb NOT NULL, binding_quality text NOT NULL CHECK(binding_quality IN ('canonical','correlated','source-only','unbound')));
-- Substitute role identifiers only after approved deployment.
-- GRANT USAGE ON SCHEMA scorecard TO <ingest_role>, <dashboard_role>;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA scorecard TO <ingest_role>;
-- GRANT SELECT ON ALL TABLES IN SCHEMA scorecard TO <dashboard_role>;
COMMIT;
