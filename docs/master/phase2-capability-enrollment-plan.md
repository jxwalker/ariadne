# Phase 2 capability enrollment proposal

Assignment ARIADNE-MASTER-PILOT-20261014-P02; run ariadne-bot-20261014-master-pilot-p02-r1. Plan only; no credentials issued.

| Agent identity | Harness | Execution source | Maximum repositories |
|---|---|---|---|
| agent:codex | Codex | codex-dev | jxwalker/ariadne, jxwalker/patent-studio, jxwalker/openscorpion |
| agent:claude | Claude | codex-dev | jxwalker/ariadne, jxwalker/patent-studio, jxwalker/openscorpion |
| agent:box-ariadne-bot | explicitly selected at enrollment | box-ariadne-bot | jxwalker/ariadne |
| agent:box-patent-studio-ui-bot | explicitly selected at enrollment | box-patent-studio-ui-bot | jxwalker/patent-studio |
| agent:box-scorpion-build-bot | explicitly selected at enrollment | box-scorpion-build-bot | jxwalker/openscorpion |
| agent:box-scorpion-verifier | explicitly selected at enrollment | box-scorpion-verifier | jxwalker/openscorpion |

Issue one capability per bounded assignment, exact eligible canonical work IDs and repository subset, expiring after 24 hours. No wildcard eligibility. James must approve each work assignment and explicit task/run binding; similar titles or times never establish identity. Record actual harness independently from accountable bot and source. Verifier receives packet only in slice 1; implementation agents receive packet, update (nextAction/blocker), transition. No baseline, criteria, evidence acceptance, overrides, credentials or operator actions. Done submits verification only.

Generate independent random HMAC keys on the operator host and transfer through an authenticated secret manager or protected SSH file transfer, never chat, git, reports, command arguments or logs. Server registry and client files must be mode 0600, parent directories 0700; DB stores key reference only. Registry entries contain capability ID, keyRef and secret. Existing observation keys cannot be used. The private HTTPS proxy must expose only the two signed agent routes, not master queries. TLS termination configuration requires its own reviewed plan.

Rotation creates a new capability/key reference and records rotation_predecessor; validate new signed receipt then revoke old capability. Revocation sets revoked_at immediately; restart must not clear nonces/receipts. Retain consumed nonces through credential expiry (no automatic deletion in this slice). Rollback disables agent routes, revokes issued capabilities and preserves bindings, receipts and ledger state. Offline delivery re-signs with a fresh nonce and retains the same idempotency key and payload; revision/generation conflicts require reconciliation, never automatic overwrite.

Validate permitted update and Done submission, owner/repository/work exclusions, expiration, revocation, changed-payload rejection, signature replay, observation-key denial, scoped packets and retained state after restart in isolated environments before enrollment. Synthetic tests are not evidence of actual pilot agent receipts. Same-uid James processes remain operator-equivalent; isolate client credentials and transport process OS identity before claiming adversarial isolation. Claims, leases, assignment delivery and real harness rollout belong to later slices.

Slice 2 proposed operations: implementer receives packet, claim, renew, release, receipt, handover, resume, update, transition and retainedEvidence. Reviewer receives packet, review and retainedEvidence; evaluator receives packet, evaluate and retainedEvidence. Explicit immutable agent_roles rows distinguish these roles; default compatibility role is implementer but operations still require an exact capability allowlist. Review/evaluation contributions are retained evidence only, never acceptance or ownership. Record approved lexical repository-relative pathScope arrays on eligible work before enabling claims. Handovers require branch, 40-character revision, changedPaths, checks, evidenceRefs, remainingWork, blockers, nextAction and localWork. Renew ownership explicitly; a heartbeat does not do so. Offline clients retain command keys through successor resume and reconcile returned current revisions with human edits. Claims/leases are now synthetic-tested; real enrollment and harness rollout remain separate approvals.

Takeover without a predecessor handover requires an operator record via master.record_takeover_baseline, bound to the expected work revision and preceding ownership generation. This is operator recovery authority only; do not grant it to any agent or observation capability. A first claimant different from the currently assigned owner must verify that baseline before advancing work.
