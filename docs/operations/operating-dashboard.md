# Operating dashboard

The private activity listener provides one operating surface at `/`, with Overview, Delivery, Machines and Evidence views. `/api/operating?range=7d&repo=owner/name` is a read-only, bounded projection of stored evidence. Existing lifecycle, run-history, source and control APIs remain available. The ingest-only listener still has no dashboard or query access.

## Questions and actions

Needs you contains explicit agent decisions addressed to configured `operatorAliases`, current GitHub review requests, open decision-labelled issues assigned to the operator, and pending protected-environment approvals whose reviewers explicitly include the operator. An ordinary open PR or a task blocker does not imply a request to James. Actions open the source; they do not approve, merge, rerun, delete or provision anything.

What’s stuck retains explicit agent blockers and their original blocker timestamp. Heartbeats do not reset blocker age. CI failures enter this queue only when they are the latest workflow result on a current open PR head or the collected default branch. Older failures remain in historical measures, without becoming current action items. Unknown execution freshness is an informational item, separate from a reported blocker.

Raw evidence remains in SQLite. Text is bounded, credential-redacted and HTML-escaped. Supplied stage, next step, owner and decisions require the existing per-source private-display opt-in; read-only snapshot provenance cannot opt in. Test classifications and the existing controlled connectivity/heartbeat test identifiers are excluded from default work and action queues.

## Decisions and operating metadata

The signed `/ingest/v1/events` route accepts the original strict v1 envelope and the backward-compatible v2 envelope in `schemas/activity-event-v2.json`. V1 does not accept new fields. V2 adds bounded `stage`, `nextStep`, `owner`, `blockerCategory`, `classification`, and explicit `decision.requested` / `decision.resolved` kinds. Authentication, exact repo/project scope, nonce replay checks and durable event/sequence identities remain unchanged.

Use a stable request ID and the same source/repository for request and resolution. A request needs recipient, question and blocking flag; options, recommendation and a safe source URL are optional. Resolution needs recipient and a short resolution. A resolved decision does not automatically complete or resume its parent coding task. Decisions arriving late cannot reopen a newer resolution. Source time orders decision lifecycle; server receipt time measures ingestion freshness.

The sender supports `--stage`, `--next-step`, `--owner`, `--blocker-category`, `--classification` and `--decision-file` with event mode. Put the bounded decision object in an installer-owned file; never include full prompts, transcripts, tool arguments, credentials or personal tasks. Existing v1 clients continue reporting unchanged. Clients must be updated before they can report structured decisions; an unreported bot question cannot appear in Needs you.

## Delivery measures

The CI headline uses the named build/validation workflow policy in `activity_operating.py`, with optional per-repo `workflowPolicies` overrides. Monitoring, repair coordinators, review automation, dependency updates and unclassified workflows remain visible separately and cannot inflate CI success. Unknown new workflows require classification. Workflow run ID is the CI grain; attempt number distinguishes retries. First-attempt success divides successful eligible completed attempt-1 runs by all eligible completed attempt-1 runs. Eligible conclusions are success, failure, timed_out, startup_failure and action_required. Cancellation, skip, neutral and in-flight states are counted separately. Missing attempt 1 is excluded and disclosed. Eventual success uses only the latest observed eligible completed attempt per run ID. The first-pass headline recomputes its numerator and denominator across the selected repositories, rather than averaging repo rates.

PR throughput uses distinct repo/PR identities and actual `merged_at`; opening activity uses `created_at`. CI completion history uses terminal workflow `updated_at`, and the start cohort uses run `created_at`. Repeated polling changes freshness, not throughput. Work and outstanding decisions remain current independently of the performance window.

Deployment reports use distinct GitHub deployment IDs and the latest terminal success/failure/error when an environment has subsequently become inactive. GitHub-reported success remains separate from independent running-revision, health and acceptance evidence. The dashboard does not claim verified production acceptance or end-to-end accepted-work throughput until those sources are integrated.

Job queue and execution timing are explicit samples from recent workflow runs. Queue delay uses job `created_at` to `started_at`, only when job creation is supplied. Workflow-start to job-start is a separate schedule-wait measure that includes dependency time. Execution uses `started_at` to `completed_at`. Runner names and in-progress counts cover sampled jobs, not the complete runner estate. Low first-pass reliability generates an advisory investigation at fewer than 80% passes with at least 10 eligible observations; it is a heuristic, not an SLO or an agent ranking.

The read-only collector uses GitHub's [workflow run and attempt API](https://docs.github.com/en/rest/actions/workflow-runs), [job API](https://docs.github.com/en/rest/actions/workflow-jobs) and [deployment status API](https://docs.github.com/en/rest/deployments/statuses). Busy Actions intervals split before the 1,000-result search cap. Completed daily backfill intervals have durable cursors; request limits and incomplete first-attempt coverage remain visible. Historical and current records are preserved in bounded SQLite transactions so ingestion and readiness probes can continue.

## Collection and configuration

`operatingRepositories` defaults to `githubRepositories`; add explicit component repo scopes through the normal deployment plan. `pipelineHistoryDays` defaults to 30, `pipelineJobSample` to 20, `pipelineDeploymentLimit` to 400 and `operationsRequestBudget` to 450. A larger explicitly configured backfill limit can cover busy deployment histories. Cached terminal history is retained; recent deployments and the latest three per environment are refreshed. Existing host `gh` authorization is reused. `operatorAliases` defaults to james/jxwalker, with `operatorGitHubLogins` defaulting to jxwalker.

`machines` is an operator-owned list of host, kind, optional parent, and an existing SSH target/identity or `local: true`. `activity_machine_probe.py` gathers CPU, Linux available memory, swap, root disk capacity, Linux pressure, explicit Ariadne service states and optional local R740 IPMI/Proxmox readings. It reads no process arguments, environment, agent prompts or file contents. On macOS, memory pressure/free percentage is reported separately; Linux MemAvailable is not fabricated. Cloud sources show reporting coverage and explicitly unavailable hardware metrics.

`ariadne-operations-pipeline.timer` refreshes five minutes after the prior collection completes. `ariadne-operations-machines.timer` samples every minute. The existing Mac bridge can carry a hardware sample from `agent_telemetry.py` when the adjacent probe module is installed; the existing snapshot importer persists it. Hardware history retains raw measurements and displays the latest 120 samples in the selected period, with measurement time and unknown/unreachable states. A sleeping Mac is not classified as a failed production host.

Deployment must use the repository mutation-readiness, approval evidence, audit, dry run, exact confirmed execution and post-verification flow. Back up the current scripts/config/units, keep data additive, and use existing private TLS access. Rollback restores those files and disables only the two new timers; accepted activity and collected evidence stay intact. The legacy template/assets remain in the repository for recovery.
