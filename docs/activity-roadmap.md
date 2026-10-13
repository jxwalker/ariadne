# Ariadne activity and orchestration roadmap (13 Oct 2026)

Approved for commit by James, 19:19 BST 12 Oct 2026. Both May records were retired the same day: approval decisions recorded as rejected (retired/superseded) via audited plan `mutation-readiness-deployment-2026-10-12T18-23-40-442Z`; the mutation-readiness audit now reports `ready_for_bounded_review` with 2 retired plans.

Grounded in: the original brief (`~/ariadne-run/brief.md`), `PENDING.md`, `docs/roadmap.md` (Milestones 0–6), the May roadmap-completion and cutover audits, and today's `/api/controls` (23 rows: 11 pass, 8 stale, 3 missing, 1 fail). Production runs main `d0fbc7d`.

## May plans and approvals: verdicts

| Record | What it proposed | Why it stalled | Today's coverage | Verdict |
|---|---|---|---|---|
| `approval-2026-05-16T13-21-33-834Z` + `mutation-readiness-github-2026-05-16T16-50-54-241Z` (github, medium) | A bounded mutation-capable PR adapter that runs `gh pr merge <n> --squash --delete-branch` after review gates pass | Approval never decided. The plan has no post-verification command and a placeholder `<number>`. The cutover audit lists 9 missing operator-evidence sections for github. | Partly covered. Today's PR merges (#157–#161) were done by hand with gh, gated on CI and CodeRabbit, and are not recorded as plans. The webhook and reconciliation add read-only GitHub evidence, not merge automation. | Retire this record (it can't pass as written). Re-plan only if James wants automated merges: new plan with a concrete PR, a post-verify command (`gh pr view --json state,mergeCommit`) and operator evidence. |
| `approval-2026-05-18T14-53-53-213Z` + `mutation-readiness-deployment-2026-05-18T14-54-52-671Z` (deployment, high) | A readiness plan for Atlas runtime health on mac/jimm5.local. Explicitly no live mutation; the live command is a disabled `printf` placeholder. | Approval left at requested. The plan was evidence-only by design. | Superseded for the deployment target. Today's four codex-dev deployment plans (ingest tunnel, redeploy, webhook, Grok source) plus the d0fbc7d dashboard deploy all passed audit, dry run, execute and post-verify. Atlas health on the M5 Mac was not touched. | Retire as superseded (decision: rejected/withdrawn, citing today's plans). If Atlas runtime monitoring is still wanted, add it as a new read-only item (below), not a mutation plan. |

Retiring both clears the Mutation-readiness audit (fail), the Approvals (stale) and the Mutation-readiness plans (stale) controls.

## Done (with evidence)

- **Versioned protocol and durable API:** `activity_server.py` on 127.0.0.1:18095, SQLite with migrations 1–2, under a user systemd unit. Restart kept events (404 before, 406 after redeploy). Online backup passed integrity checks at 16:32 and 18:52 BST.
- **Real Claude and Codex runs before a PR** (brief acceptance 1): PENDING.md records PRs #158/#159. A fresh Codex run after the redeploy was received at 16:39 BST.
- **Restricted public ingestion:** tunnel `ariadne-ingest` (14269787-…), loopback nginx allowlist, POST-only on two paths, 64 KiB limit. Verified 401/404/405/413 from the public internet. Plan `mutation-readiness-deployment-2026-10-12T15-19-14-572Z`.
- **GitHub webhook:** `jxwalker/ariadne`, signed with a secret file. 42 deliveries accepted (Webhook deliveries control: pass). Reconciliation passes for all 5 repos.
- **Grok CLI source (`codex-dev-grok-cli`):** 4 events accepted at 16:43 BST through the public URL once the Cloudflare block was cleared (Python-urllib user agent now gets 400 instead of 403).
- **Dashboard v2 and orchestration controls:** PR #161 merged as `d0fbc7d`, deployed through plan `mutation-readiness-deployment-2026-10-12T17-52-25-200Z`. Unit tests (27), npm test (48), and visual and browser checks all pass.

- **May plans retired:** both approvals rejected as superseded on 12 Oct; audit passes (0 blocked, 2 retired).

- **Ops follow-up implemented locally, awaiting audited deployment:** snapshot health makes a reachable zero-session collector connected/pass without implying work; private favicon; per-source quiet thresholds, failure/audit/CI/stalled alerts with local deduplicated transition log; state-based durable control freshness; optional encrypted backups, isolated restore verification and explicitly gated history/backup retention. Python fixtures and private/public boundary checks cover these paths. Notifications use log only; external delivery is disabled.
- **History growth investigated read-only:** 2.676 GB / 146,665 history rows initially, rising to 2.722 GB / 149,189 rows across 17.4 hours, versus 4,083 current observations. Embedded repository metadata drives unrelated PR versions. Digest normalization preserves meaningful PR/check changes and raw response evidence; deletes nothing. Defaults remain keep-all. Recommend 30 history days and 30 daily / 8 weekly backups after post-deploy measurement and audited review.

## Now (next 1–2 weeks)

| Item | Goal | Acceptance check | Control turned green |
|---|---|---|---|
| Macs-asleep / bridge-outage test (brief acceptance 5) | Show ingestion, collection and reconciliation continue with both Macs asleep | While JW-MBP and M5 sleep for ≥30 min, codex-dev events, webhook deliveries and reconciliation keep landing; the dashboard loads from a second client | Run receipts and Reconciliation stay pass; JW-MBP and M5 go quiet but are explained |
| Retire the Mac bridge | Remove the laptop bridge/tunnel dependency for legacy snapshot collection | Bridge disabled through an audited plan; no data path depends on it; rollback recorded | Live-adapter cutover (deployment) gets fresh evidence |
| Hosted Grok event (needs a hosted runner) | Get a real event from a hosted Grok runner, not the CLI on codex-dev | Provider confirms outbound HTTPS works; scoped source issued over a secret channel; one authenticated hosted event shows on the dashboard | Source · Grok hosted: missing → pass |


## Next

| Item | Goal | Acceptance check | Control |
|---|---|---|---|
| External notifications (channel pending) | Provide an HTTPS destination and protected header credentials | Disabled webhook interface is provisioned through an approved send policy; default log backend remains local | Alerts |
| Off-host encrypted backup (destination pending) | Close the off-host backup gap PENDING.md calls operator-pending | Encryption/restore and disabled hook exist locally; provision a destination and credentials so a nightly encrypted copy leaves the R740; restore test into a separate directory matches event and run counts | (new) Backup control |
| Live-adapter cutover evidence (deferred) | Decide which of the 6 adapter targets are actually wanted, then fill operator evidence for only those | The cutover audit is ready for chosen targets; unwanted targets are marked out of scope | Live-adapter readiness and cutover: stale → pass or n/a |

## Later

- **Event dedupe tombstones:** events remain keep-all even when `eventsDays` is set. History/backup retention report and explicit backed-up pruning are implemented locally; production pruning and compacting remain audited operator actions. Design durable tombstones before any event deletion.
- **Reconciliation breadth** (from PENDING.md): workflow-only and backfill runs without a PR, plus incremental/ETag fetches. Acceptance: workflow-only runs are visible and API calls per cycle drop. Turns the repo-activity commit counts from unknown to real.
- **Source enrollment UI:** issue and revoke scoped sources without editing `sources.json` by hand, still private and audited.
- **Atlas/M5 runtime health:** a read-only probe feeding a control row, if still wanted. This replaces the retired May deployment plan's intent.
- **Native Claude and Codex hooks:** optional, additive and separately scoped. PENDING.md notes the wrapper is the verified path today.
- **Duplicate-receipt accounting:** the controls report "duplicate count unavailable", so add a counter to make it measurable.
