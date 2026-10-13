# Baseline

Observed **2026-10-13**. Provenance conventions: [README](README.md). Import `P0-BASELINE-001`.

| Reference | Observed value | Evidence |
|---|---|---|
| `origin/main` and GitHub main | `d9aacc455ffe5c78698efbbad469f0f8f446b387` | `git rev-parse origin/main`; [GitHub response](evidence/ariadne-github.json), repository `jxwalker/ariadne` |
| PR #169 head and starting worktree | `03dd67778ce5ef7b37089b79957b13526d70c829` | [PR #169](https://github.com/jxwalker/ariadne/pull/169); [response](evidence/pr169.json); OPEN, draft, merge-state CLEAN (not review approval) |
| Installed deployment marker | `b5c6a9f5b424fd25258f9188012645b85202cd37` | `~/.local/lib/ariadne-activity/DEPLOYED_COMMIT`, [comparison](evidence/installed-comparison.json); marker does not describe current script bytes |
| Claimed sender version | `8a186225d1b96be4238f127fa924d94239fcf1e8` | [sender source](https://github.com/jxwalker/ariadne/blob/8a186225d1b96be4238f127fa924d94239fcf1e8/scripts/activity_sender.py); byte comparison below |

Installed regular script files were read, SHA-256 hashed and compared against `git show <revision>:scripts/<name>` for PR #169, main, marker and sender revision. **All 16 operational files match PR #169 exactly.** One historical `.bak` file has no corresponding source path. Compiled `__pycache__` files are excluded from source identity. Full hashes are in [comparison](evidence/installed-comparison.json); exact main-to-installed patches are retained in [diff](evidence/installed-vs-source.diff). PR #169-to-installed diff is empty for operational files. Source-level main-to-PR changes outside the installed scripts are not deployment evidence.

| Installed `~/.local/lib/ariadne-activity/scripts/` file | PR #169 | main | marker | sender revision |
|---|---|---|---|---|
| `activity_alerts.py` | match | match | match | match |
| `activity_backup.py` | match | match | match | match |
| `activity_controls.py` | match | different | different | match |
| `activity_dashboard.html` | match | match | match | match |
| `activity_dashboard.js` | match | match | match | match |
| `activity_insights.py` | match | different | different | match |
| `activity_machine_probe.py` | match | absent | absent | match |
| `activity_operating.py` | match | absent | absent | different |
| `activity_operations_collect.py` | match | absent | absent | match |
| `activity_reconcile.py` | match | match | match | match |
| `activity_sender.py` | match | different | different | match |
| `activity_server.py` | match | different | different | match |
| `activity_server.py.bak-20261012-175935` | absent | absent | absent | absent |
| `activity_snapshot_import.py` | match | different | different | match |
| `agent_telemetry.py` | match | different | different | match |
| `operating_dashboard.html` | match | absent | absent | match |
| `operating_dashboard.js` | match | absent | absent | match |

`match` means byte equality; `different` means the path exists with different bytes; `absent` means that source revision has no such path. The marker is stale metadata, not proof of a failed deployment. Correcting it or merging #169 is outside this run.

The installed sender matches both PR #169 and the claimed `8a186225…`. **Remote bots' actual sender versions are unverified:** enrollment/scopes do not attest to their executable bytes, and this run does not access their hosts. Do not label every bot upgraded from this local equality alone. Source: comparison above, commits in the table, observation 2026-10-13.

SQLite was inspected using exactly `sqlite3 -readonly ~/.local/state/ariadne-activity/activity.db .schema`. [Raw schema](evidence/sqlite-schema.sql), local commit SHA N/A, observed 2026-10-13: nine tables—`migrations`; raw `events` and `webhooks` with processing flags; current `runs` keyed by source/run; repository `observations`; `observation_history`; collector `health`; nonce replay protection (`nonces`); per-minute request counters (`rates`). Indexes cover repo/freshness, event source/run sequence, pending ingestion and last run activity. This schema has no master product/roadmap/work-item/acceptance tables; it remains evidence, not the proposed canonical ledger. No row contents, credentials or raw event payloads were exported.

Only `systemctl --user is-active <unit>` was used for service health. [Raw unit observations](evidence/service-health.json), local commit SHA N/A, observed 2026-10-13:

- `ariadne-activity-backup.service`: **inactive**.
- `ariadne-activity-backup.timer`: **active**.
- `ariadne-activity-import.service`: **inactive**.
- `ariadne-activity-import.timer`: **active**.
- `ariadne-activity-reconcile.service`: **activating**.
- `ariadne-activity-reconcile.timer`: **active**.
- `ariadne-activity.service`: **active**.
- `ariadne-agent-refresh.service`: **inactive**.
- `ariadne-agent-refresh.timer`: **active**.
- `ariadne-console.service`: **active**.
- `ariadne-ingest-proxy.service`: **active**.
- `ariadne-ingest-tunnel.service`: **active**.
- `ariadne-operations-machines.service`: **inactive**.
- `ariadne-operations-machines.timer`: **active**.
- `ariadne-operations-pipeline.service`: **inactive**.
- `ariadne-operations-pipeline.timer`: **active**.
- `ariadne-refresh.service`: **inactive**.
- `ariadne-refresh.timer`: **active**.
- `ariadne-remote-collect.service`: **inactive**.
- `ariadne-remote-collect.timer`: **active**.

An inactive oneshot service with an active timer is not itself a collector failure; activating is an in-progress snapshot. These probes establish unit activity only, not successful collection, freshness, API readiness, database integrity or coverage. Pipeline, machine, remote, import, reconcile, refresh and backup collectors are enrolled as units; their latest successful executions are not verified here. Timer intentions and bounded collection contracts are documented in [operating dashboard](https://github.com/jxwalker/ariadne/blob/03dd67778ce5ef7b37089b79957b13526d70c829/docs/operations/operating-dashboard.md), source SHA `03dd67778ce5ef7b37089b79957b13526d70c829`, observed 2026-10-13.

GitHub observed successful Activity validation at PR head `03dd677…`, [run 38412622113](https://github.com/jxwalker/ariadne/actions/runs/38412622113). This is verified workflow completion, not master-roadmap acceptance; full sampled runs are in [GitHub evidence](evidence/ariadne-github.json), observed 2026-10-13.
