# Evaluation Plan: e2e-local-smoke

Target: benchmark-local
Generated: 2026-05-17T10:45:17.834Z

## Dimensions

### D1: Evidence fidelity

Weight: 25

Sensors:
- manifest.jsonl
- hygiene.json
- context dossier

Success signals:
- raw sources preserved
- hashes stable
- source references survive into PRD and GSD

### D2: Planning quality

Weight: 20

Sensors:
- prd.json
- roadmap.json
- gsd2-bundle.json

Success signals:
- requirements are bounded
- tasks have success criteria
- write scopes are explicit

### D3: Execution safety

Weight: 20

Sensors:
- execution run
- worktree guard
- decision records

Success signals:
- external mutation remains gated
- worktrees are isolated
- human approvals are explicit

### D4: Verification strength

Weight: 25

Sensors:
- typecheck
- unit tests
- build
- Playwright evidence
- CodeRabbit review

Success signals:
- fast checks run left
- UI evidence is captured
- review feedback is recorded

### D5: Operational fit

Weight: 10

Sensors:
- infrastructure registry
- infra snapshots
- control report

Success signals:
- placement is explicit
- runner trust boundary is visible
- readiness report is current

## Scenarios

### EVAL-001: Source evidence intake

Evaluate whether TASK-001 can move from source evidence to verified control-plane evidence.

Tasks: TASK-001

Expected evidence:
- npm run check
- npm test
- src/vault.ts
- src/extract.ts
- docs/source-contract.md

### EVAL-002: Source-grounded PRD synthesis

Evaluate whether TASK-002 can move from source evidence to verified control-plane evidence.

Tasks: TASK-002

Expected evidence:
- npm run check
- npm test
- src/prd.ts
- vault/projects/<project>/requirements/

### EVAL-003: GSD2 task bridge

Evaluate whether TASK-003 can move from source evidence to verified control-plane evidence.

Tasks: TASK-003

Expected evidence:
- npm run check
- npm test
- src/gsd.ts
- vault/projects/<project>/gsd/

### EVAL-004: Bounded execution loop

Evaluate whether TASK-004 can move from source evidence to verified control-plane evidence.

Tasks: TASK-004

Expected evidence:
- npm run check
- npm test
- src/execution.ts
- vault/projects/<project>/execution/

### EVAL-006: Review and CI control plane

Evaluate whether TASK-006 can move from source evidence to verified control-plane evidence.

Tasks: TASK-006

Expected evidence:
- npm run check
- npm test
- src/controlPlane.ts
- vault/projects/<project>/control/

### EVAL-007: Infrastructure substrate registry

Evaluate whether TASK-007 can move from source evidence to verified control-plane evidence.

Tasks: TASK-007

Expected evidence:
- npm run check
- npm test
- src/infraSnapshot.ts
- vault/projects/<project>/infrastructure/

### EVAL-005: Playwright UI verification evidence

Evaluate whether TASK-005 can move from source evidence to verified control-plane evidence.

Tasks: TASK-005

Expected evidence:
- npm run check
- npm test
- npx playwright test --reporter=list
- src/playwrightEvidence.ts
- vault/projects/<project>/verification/
