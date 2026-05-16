# Regula

Rules for the Ariadne control system.

1. Raw evidence is preserved before compression.
2. Source-derived claims must point back to an artifact path.
3. Speculative outputs must be labelled speculative.
4. Infrastructure actions require an approved plan.
5. Repository mutations require a branch, commit, PR, CI, review, merge, and cleanup loop unless the user explicitly chooses a lighter path.
6. Playwright UI testing is required before claiming a browser-facing workflow is complete.
7. No local or remote model endpoint may become a hidden authority. Model output is evidence to review, not permission to act.
8. The hot index must stay small enough to orient a new session.
9. Secrets must not be copied into the vault.
10. External automation must fail closed when approval or config is missing.
