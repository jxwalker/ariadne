# Live Adapter Operator Evidence Workplan

Project: ariadne
Status: evidence_required
Generated: 2026-05-18T04:58:56.198Z
Mutation approved: false

## Rule

This workplan collects the evidence still needed from an operator. It does not approve mutation, does not grant live-adapter authority, and does not replace the filled evidence files.

## References

- Operator evidence audit: projects/ariadne/control/live-adapter-operator-evidence-audit.json
- Review session: projects/ariadne/control/live-adapter-review-session.json
- Evidence templates: projects/ariadne/control/live-adapter-evidence-templates.json
- Cutover audit: projects/ariadne/control/live-adapter-cutover-audit.json

## Summary

- Targets: 6
- Complete targets: 0
- Missing targets: 6
- Incomplete targets: 0
- Check commands: 6
- Import commands: 6
- GBrain queries: 18

## Targets

### github

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target github --from vault/projects/ariadne/control/operator-evidence/github/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target github --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- repository, PR, branch policy, and check-rollup evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for github.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the github live adapter.
- List risks, rollback requirements, and stale assumptions for github approval.
- Summarize operator-review evidence still missing before github mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-github.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/github/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

### deployment

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target deployment --from vault/projects/ariadne/control/operator-evidence/deployment/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target deployment --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- host identity, service state, sudo boundary, and rollback host evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for deployment.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the deployment live adapter.
- List risks, rollback requirements, and stale assumptions for deployment approval.
- Summarize operator-review evidence still missing before deployment mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-deployment.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/deployment/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
- projects/ariadne/control/live-evidence-promotions/live-evidence-promotion-deployment-2026-05-17T23-37-04-509Z.json

### hermes-cron

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target hermes-cron --from vault/projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target hermes-cron --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- scheduler auth, existing job snapshot, next-run, and disable-path evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for hermes-cron.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the hermes-cron live adapter.
- List risks, rollback requirements, and stale assumptions for hermes-cron approval.
- Summarize operator-review evidence still missing before hermes-cron mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-hermes-cron.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-hermes-cron.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/hermes-cron/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

### openscorpion

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target openscorpion --from vault/projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target openscorpion --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- governed route, payload sensitivity, and activity status evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for openscorpion.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the openscorpion live adapter.
- List risks, rollback requirements, and stale assumptions for openscorpion approval.
- Summarize operator-review evidence still missing before openscorpion mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-openscorpion.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/openscorpion/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

### gsd2

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target gsd2 --from vault/projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target gsd2 --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- local GSD2 binary/process snapshot and package/task identity evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for gsd2.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the gsd2 live adapter.
- List risks, rollback requirements, and stale assumptions for gsd2 approval.
- Summarize operator-review evidence still missing before gsd2 mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-gsd2.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-gsd2.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/gsd2/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json

### notebooklm

Status: needs_evidence
Template: projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md
First action: Prepare, fill, and import operator evidence

#### Check Command

```bash
npm run ariadne -- live-adapter-operator-evidence-check --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md
```

#### Import Command

```bash
npm run ariadne -- live-adapter-operator-evidence --project ariadne --target notebooklm --from vault/projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md --by <operator>
```

#### Packet Review Command

```bash
npm run ariadne -- live-adapter-approval-review --project ariadne --target notebooklm --by <operator> --status accepted --packet control/live-adapter-approval-pack.json --evidence <operator-review-evidence>
```

#### Missing Sections

- Operator identity and timestamp
- Approval packet review
- Authentication or authorization boundary
- Bounded action statement
- Rollback or disable path
- Post-action verification command
- Dry-run command and safe output
- Target-guarded execution wrapper
- Exact confirm-plan proof

#### Required Evidence

- operator identity and review timestamp
- reviewed approval packet path and generation timestamp
- authentication or authorization boundary observed for this target
- bounded action statement and explicit non-goals
- rollback or disable path checked by the operator
- post-action verification command checked by the operator
- dry-run command and expected safe output shape
- target-guarded execution command and expected post-verification output shape
- proof that execution used mutation-execute or a target-specific wrapper with an exact --confirm-plan match
- operator approval request record
- authentication or authorization evidence
- bounded scope statement
- dry-run command output evidence
- post-action verification command
- rollback or disable path
- NotebookLM auth, terms, source/export stability, and notebook identity evidence

#### Cutover Blockers

- Operator evidence complete: No operator evidence record exists for notebooklm.; Missing operator evidence section: Operator identity and timestamp; Missing operator evidence section: Approval packet review; Missing operator evidence section: Authentication or authorization boundary; Missing operator evidence section: Bounded action statement; Missing operator evidence section: Rollback or disable path; Missing operator evidence section: Post-action verification command; Missing operator evidence section: Dry-run command and safe output; Missing operator evidence section: Target-guarded execution wrapper; Missing operator evidence section: Exact confirm-plan proof
- Current accepted operator packet review: no accepted operator review exists
- Mutation-readiness audit passed: No target-specific mutation-readiness plan passes audit.
- Credential and auth-boundary evidence accepted: No passing readiness audit is available to prove auth evidence.
- Rollback and post-verification contract accepted: A passing readiness audit is required to prove rollback and post-verification.
- Dry-run evidence passed: No passed dry-run evidence exists for an audit-passed plan.
- Target-guarded execution evidence passed: No passed target-guarded execution evidence exists.

#### GBrain Advisory Queries

- Find prior Ariadne decisions and evidence for the notebooklm live adapter.
- List risks, rollback requirements, and stale assumptions for notebooklm approval.
- Summarize operator-review evidence still missing before notebooklm mutation readiness.

#### Evidence

- projects/ariadne/control/live-adapter-evidence-templates/live-adapter-evidence-template-notebooklm.md
- projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-notebooklm.json
- projects/ariadne/control/mutation-readiness-repair-plan.json
- projects/ariadne/control/live-adapter-readiness.json
- projects/ariadne/control/live-adapter-next-actions.json
- projects/ariadne/control/live-adapter-approval-pack.json
- projects/ariadne/control/live-adapter-approval-review-audit.json
- projects/ariadne/control/mutation-readiness-audit.json
- projects/ariadne/control/live-adapter-operator-evidence-workspace.json
- projects/ariadne/control/operator-evidence/notebooklm/operator-evidence.md
- projects/ariadne/control/live-adapter-operator-evidence-audit.json
