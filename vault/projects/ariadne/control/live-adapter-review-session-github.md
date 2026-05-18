# Live Adapter Review Session

Project: ariadne
Target: github
Status: operator_review_required
Generated: 2026-05-18T06:16:28.130Z
Mutation approved: false
Operator decision required: true

## Summary

- Targets: 1
- Operator review required: 1
- Ready for adapter work: 0
- Blocked: 0
- Action items: 5
- Current accepted reviews: 0
- Cutover-ready targets: 0
- GBrain reports: 0

## Rule

This session is a review packet. It does not approve mutation and does not authorize external-system changes. GBrain context is advisory memory only; Ariadne artifacts remain the source of truth.

## References

- Next actions: projects/ariadne/control/live-adapter-next-actions.json
- Approval pack: projects/ariadne/control/live-adapter-approval-pack.json
- Approval-review audit: projects/ariadne/control/live-adapter-approval-review-audit.json
- Cutover audit: projects/ariadne/control/live-adapter-cutover-audit-github.json
- Mutation repair plan: projects/ariadne/control/mutation-readiness-repair-plan.json
- Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- Operator evidence queue: projects/ariadne/control/live-adapter-operator-evidence-queue.json
- Operator evidence assist: projects/ariadne/control/live-adapter-operator-evidence-assist-github.json
- Dossiers: projects/ariadne/control/live-adapter-dossiers

## Targets

### github

Status: operator_review_required
Readiness: blocked
Cutover: blocked
Review audit: missing_review
Operator evidence: needs_evidence
Operator evidence queue: needs_evidence
First action: Prepare, fill, and import operator evidence
Dossier: projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json

#### Operator Evidence Action

Evidence file: projects/ariadne/control/operator-evidence/github/operator-evidence.md

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

Missing operator evidence sections:
- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

Latest preflight: projects/ariadne/control/live-adapter-operator-evidence-checks/operator-evidence-check-github-2026-05-18T05-22-23-800Z.json

Read-only assist: projects/ariadne/control/operator-evidence/github/read-only-assist.md

Assist next steps:
- Open read-only-assist.md and the listed support refs.
- Verify each relevant fact manually before copying it into operator-evidence.md.
- Fill the Operator and Review timestamp fields with real operator values.
- Run the check command, then import only after the check is complete and the operator evidence file contains verified human observations.

#### Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Approval Request Draft

```bash
npm run ariadne -- approval-request --project ariadne --by <operator> --target github --action "Enable one reviewed GitHub mutation adapter action" --risk medium --reason "Permit a bounded PR or workflow operation after checks, review, and branch policy are verified" --rollback "Document how to revert or undo the PR/workflow operation and restore manual review flow." --evidence <auth-or-policy-evidence>
```

#### Mutation Plan Draft

```bash
npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
```

#### Mutation Repair

Status: operator_action_required

Approval request:

```bash
npm run ariadne -- approval-request --project <project> --by <operator> --target github --action "<bounded action>" --risk <low|medium|high> --reason "<why this target should mutate>" --rollback "<operator rollback path>" --evidence <auth-or-policy-evidence>
```

Regeneration:

```bash
npm run ariadne -- github-mutation-plan --project <project> --repo <owner/name> --action <merge-pr|rerun-failed-run> --auth-evidence <paths> --approval <approval-id>
```

Next action commands:
- npm run ariadne -- live-adapter-operator-evidence-next --project <project> --target github
- npm run ariadne -- live-adapter-approval-review --project <project> --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
- Review mutation-readiness-github-2026-05-16T16-50-54-241Z; after operator approval, record approval-decision, ensure --post-verify is present, then rerun npm run ariadne -- mutation-readiness-audit --project <project>
- After mutation-readiness-github-2026-05-16T16-50-54-241Z passes audit, run npm run ariadne -- mutation-dry-run --project <project> --plan mutation-readiness-github-2026-05-16T16-50-54-241Z
- Run a passed dry-run for an audit-passed plan first.

#### Required Evidence

- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- repository, PR, branch policy, and check-rollup evidence

#### Blockers

- no accepted operator review exists for live-adapter approval packet
- no readiness plan passes audit
- no passed dry-run evidence exists for an audit-passed plan
- no passed target-guarded execution evidence exists

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for github.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

Export: projects/ariadne/integrations/gbrain/gbrain-export.json
Reports:
- none
Queries:
- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace-github.json
- projects/ariadne/control/operator-evidence/github/operator-evidence.md
