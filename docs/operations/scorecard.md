# Phase 1 coding scorecard

Ships isolated GitHub evidence, explicit bot attribution, daily PR/CI/rework
projections, offline fixtures and a static matrix. Only the four exact repositories
in config/scorecard-allowlist.json may be ingested or displayed. tech-demos is
GitHub-only and unregistered. No canonical ledger writes, telemetry, human-time
estimates, deployment, timers, secrets or token provisioning ship here.

Operator deployment prerequisite: deploy PR #174 first through its approved
execution path. This build does not deploy it or assert it has been deployed.

Run from the repository root:

```sh
python3 -m scripts.scorecard.github_ingest --fixtures test/fixtures/scorecard --db /tmp/scorecard.sqlite
python3 -m scripts.scorecard.scorecard_project --db /tmp/scorecard.sqlite
python3 -m http.server 18099 --bind 127.0.0.1
# Open http://127.0.0.1:18099/scripts/scorecard_dashboard.html
python3 -m unittest discover -s scripts -p 'test_*.py'
node scripts/check_scorecard_dashboard.mjs
```

Fixtures are the default ingest mode. The committed dashboard data is labelled
fixture evidence. `--public` performs unauthenticated TLS-verified REST reads.
404 repositories are reported as inaccessible/private or missing; private data is
skipped without credentials. Pagination follows only api.github.com links. Rate
limit responses stop with retry/reset information; rerun later. Updated timestamps
skip unchanged PR details while check history is refreshed for reruns; changed PRs replace nested raw snapshots, preserving reruns
returned by GitHub. Historical runs unavailable from GitHub cannot be reconstructed.
No network is used by unit tests. The browser check serves only local fixture data.

Token required locations (D2 is NOT approved):

- `github_ingest.main`: `--token-env NAME` is the only credential input; a missing
  variable fails with `TOKEN REQUIRED (not approved: D2)`. No ambient GH_TOKEN lookup.
- `GitHub.get`: authenticated REST Authorization header, only when explicitly supplied.
- `collect` branch protection lookup: reading required status-check policy may need
  repository permissions; an unavailable policy yields unknown CI.
- `collect`: private repository metadata, PRs, labels, reviews, commit/file lists and
  check runs need that token. Without it private repositories are skipped/reported.

All these paths carry `# TOKEN-REQUIRED(D2)` comments. Fixtures, public reads,
projection, dashboard and tests do not require tokens. Do not enable authenticated
mode until independently approved. Tokens and headers are never logged.

SQLite is built in. Postgres uses optional psycopg 3 and the same DB-API contract:
pass `--db postgresql://...` using passwordless local authentication. Apply
migrations/master/005-scorecard.sql only via approved deployment; rollback is
005-scorecard-rollback.sql. Role grants are commented placeholders, not automatic
privileges. The existing dashboard helper shells out to psql for the canonical
master API; this projection deliberately does not call that API.

Daily rows carry binding_quality. Merge rate is merged / (merged + closed-unmerged)
on their outcome dates; opened counts use creation dates. CI metrics use the
final PR head SHA and explicit required contexts. First-pass CI evaluates the
first completed attempt of each required context independently across suites;
all must succeed. Missing contexts or ambiguous multi-context rerun evidence
remain unknown and are excluded from the first-pass denominator. Eventual CI
uses each context's latest state as of merge. Legacy commit statuses use only
the latest status event at or before merge, so pending followed by success
resolves to success. Check-run attempts are ordered by start/creation time; a
latest attempt still incomplete at merge, including one completed afterward,
makes CI unknown and excludes it from the merge-CI denominator. Missing timing
evidence for an outstanding run also remains unknown. Reruns known to start
after merge do not affect that outcome. Unknown required-check policy
produces unknown CI, never an assumed pass. REST collection reads legacy
branch-protection required status checks when available; ruleset-only requirements
remain unsupported/unknown. required_checks can also be supplied in reviewed
evidence/fixtures. Rates must be recomputed from numerator and denominator totals
across dates. Review rounds count CHANGES_REQUESTED reviews separately for bots
and humans; commits are not treated as push events. Revert links detect standard
`This reverts commit` messages and Revert PRs with explicit PR references; links
resolve original PRs only when unambiguous. Revert counts charge the original
PR's bot and outcome date, counting each reverting PR once across link types.
Suspected fix-ups need
a reference, overlapping files and creation within seven days of original merge.
Fix-up counts are labelled estimates. No agent productivity ranking is produced.
Source-only and unbound are shown with distinct colours; neither is coverage.
