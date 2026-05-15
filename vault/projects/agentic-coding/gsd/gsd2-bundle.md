# GSD Task Export: agentic-coding

Generated: 2026-05-15T22:38:53.516Z

## M1: Control Spine

### TASK-001: Source evidence intake

Slice: core
Requirements: REQ-001
Parallel: yes

Success criteria:
- Raw artifacts are copied into the durable vault.
- Each artifact has a digest, source path, kind, and timestamp.
- Extracted text remains linked to the raw evidence.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/vault.ts`
- `src/extract.ts`
- `docs/source-contract.md`

### TASK-002: Source-grounded PRD synthesis

Slice: core
Requirements: REQ-002
Parallel: yes

Success criteria:
- PRD records source references for every major claim.
- Ambiguities are separated from accepted requirements.
- Manual exports work before automation is attempted.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/prd.ts`
- `vault/projects/<project>/requirements/`

### TASK-003: GSD2 task bridge

Slice: core
Requirements: REQ-003
Parallel: no

Success criteria:
- Tasks are independently inspectable as JSON and Markdown.
- Each task names expected write areas and verification commands.
- Tasks preserve requirement traceability.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/gsd.ts`
- `vault/projects/<project>/gsd/`

### TASK-004: Bounded execution loop

Slice: core
Requirements: REQ-004
Parallel: no

Success criteria:
- Execution runs are recorded before work begins.
- The system can identify planned worktrees and gates.
- External mutations remain blocked unless a later approved adapter is enabled.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/execution.ts`
- `vault/projects/<project>/execution/`

### TASK-006: Review and CI control plane

Slice: core
Requirements: REQ-006
Parallel: yes

Success criteria:
- Merge readiness lists satisfied and missing gates.
- CI and review records are imported without being treated as hidden authority.
- Blocked states are explicit.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/controlPlane.ts`
- `vault/projects/<project>/control/`

### TASK-007: Infrastructure substrate registry

Slice: core
Requirements: REQ-007
Parallel: yes

Success criteria:
- Infrastructure records are readable without model calls.
- Runner trust boundaries are explicit.
- Mutation plans require approval and remain non-executing in this slice.

Verification:
- `npm run check`
- `npm test`

Write scope:
- `src/infrastructure.ts`
- `vault/projects/<project>/infrastructure/`

## M2: Verification Surface

### TASK-005: Playwright UI verification evidence

Slice: verification
Requirements: REQ-005
Parallel: yes

Success criteria:
- Generated tests use role-oriented locators where possible.
- Scenario records link back to requirement ids.
- Evidence paths are recorded separately from claims.

Verification:
- `npm run check`
- `npm test`
- `npx playwright test --reporter=list`

Write scope:
- `src/playwrightPlan.ts`
- `vault/projects/<project>/verification/`

