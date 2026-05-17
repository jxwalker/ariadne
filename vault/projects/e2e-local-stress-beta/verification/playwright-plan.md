# Playwright Evidence Plan: e2e-local-stress-beta

Generated: 2026-05-17T10:45:17.883Z
Target URL: http://127.0.0.1:9119

## PW-001: Source evidence intake

Requirements: REQ-001

Assertions:
- Raw artifacts are copied into the durable vault.
- Each artifact has a digest, source path, kind, and timestamp.
- Extracted text remains linked to the raw evidence.

## PW-002: Source-grounded PRD synthesis

Requirements: REQ-002

Assertions:
- PRD records source references for every major claim.
- Ambiguities are separated from accepted requirements.
- Manual exports work before automation is attempted.

## PW-003: GSD2 task bridge

Requirements: REQ-003

Assertions:
- Tasks are independently inspectable as JSON and Markdown.
- Each task names expected write areas and verification commands.
- Tasks preserve requirement traceability.

## PW-004: Bounded execution loop

Requirements: REQ-004

Assertions:
- Execution runs are recorded before work begins.
- The system can identify planned worktrees and gates.
- External mutations remain blocked unless a later approved adapter is enabled.

## PW-005: Playwright UI verification evidence

Requirements: REQ-005

Assertions:
- Generated tests use role-oriented locators where possible.
- Scenario records link back to requirement ids.
- Evidence paths are recorded separately from claims.

## PW-006: Review and CI control plane

Requirements: REQ-006

Assertions:
- Merge readiness lists satisfied and missing gates.
- CI and review records are imported without being treated as hidden authority.
- Blocked states are explicit.

## PW-007: Infrastructure substrate registry

Requirements: REQ-007

Assertions:
- Infrastructure records are readable without model calls.
- Runner trust boundaries are explicit.
- Mutation plans require approval and remain non-executing in this slice.

## Evidence To Capture

- Playwright trace archive
- screenshot on failure
- accessibility tree snapshot where a locator is repaired
- generated test diff and review note before accepting healer changes
