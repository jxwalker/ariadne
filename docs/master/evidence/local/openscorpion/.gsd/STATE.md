# GSD State

**Active Milestone:** Shippable MVP program (P0–P7, feature flags plus config layering, no fork; follow-on P8 dogfood and P9 eval program)
**Active Slice:** Demo readiness for the Zscaler technical session: MVP P0–P2 and P4 are merged (#795, #796, #799, #798); the September demo track is merged (#803, #805, #809, #826, #827, #830, #831, #833, #836, #838, #839, #840, #841); the security and dead-feature pass (#851) is in review; MVP P3 cargo feature layer is next
**Active Task:** Rehearse the demos on the commit that will be presented ([Technical Walkthrough](../docs/demo/technical-walkthrough.md)), land #851 and the remaining demo-path fixes, then start MVP P3 (it also removes the AVX floor; `ort` load-dynamic is PR #824); keep production-beta routing and source evidence current, restore paid-provider allowance evidence, and capture the first low-token non-local proof only after the paid-provider cutover gate passes again
**Last Updated:** 2026-09-27

## Current Phase

OpenScorpion is in preproduction hardening after v0.1.0, sequenced by the
shippable MVP program approved on 2026-06-10: feature flags plus config
layering, no fork and no v2 branch, with advanced features kept in-tree and
tested while a lean default surface ships. MVP P0 (hygiene and BSL 1.1
licensing, #795), P1 (standalone single-binary router mode, #796), P2
(15-minute quickstart, #799) and P4 (dashboard profile, #798) are merged. P3
(cargo feature layer) is next, with P5–P7 (runtime flags plus bank-default
profile and proof attestation, bench harness, hardening and release gate)
queued in `../docs/ROADMAP.md`. Two follow-on phases extend the program: P8
(dogfood — proxy real coding-tool traffic through the standalone router with
proofs; config and runbook shipped in #800) and P9 (eval program — score
routing decisions on real coding workloads and gate regressions).

The September demo track put every demo claim under a test: best execution on
live traffic (#803), demo beats in CI (#805), human approval holds (#809), the
zero-trust demo (#826), exact signed bytes in proof bundles (#830), all five
beats in one command plus the beat-3 Integration test (#831), and PII masking
before dispatch (#833). The product goal is unchanged: use OpenScorpion locally
as the governed inference router for real development traffic, then broaden
usage only after model, quota, access-mode, and proof evidence are reliable.

## Current Baseline

- Canonical repository path: operator-specific; see the private operator
  runbook for concrete local paths.
- Current planning source: `../docs/ROADMAP.md`.
- Agent orchestration operating model:
  `../docs/operations/shadow-agent-development.md`.
- Model management baseline:
  `../docs/architecture/MODEL-MANAGEMENT-OPERATING-MODEL.md`.
- Enterprise UX audit baseline:
  `../docs/design/ENTERPRISE-UX-AUDIT-PLAN.md`.
- Current codebase counts: `../docs/CANONICAL-FACTS.md`.

## Product Readiness

| Area | State | Next action |
|---|---|---|
| Recently merged | Bounded cutover-proof evidence, non-spending source collection, strict source-evidence cutover gating, bounded source-hit snippets, aggregate source-gap reporting, dynamic static-catalog provider discovery, model lifecycle coverage reporting, OpenAI model-card source refresh, Gemini model-card source refresh, request-contract/retirement source evidence for static providers, explicit `not_published` knowledge-cutoff posture, OpenRouter account-credit posture, fresh manual/OAuth allowance preservation during refresh, the guarded production-beta schema catch-up, the OpenRouter Haiku cutover catalog entry, PR #724 quality-alert operations queue, PR #746 historical Overview route-distribution evidence, PR #747 provider readiness count hardening, PR #748 FinOps baseline-coverage gating, PR #764 FinOps ledger-capture attention, and PR #765 Provider Management account-posture queue are merged on main. | Keep production-beta readiness evidence current, restore paid-provider allowance evidence, and capture the low-token non-local proof only after the readiness gate passes again. |
| Local dogfood router | Production-beta is upgraded to `dogfood-f36dd341`; control, router, verifier, Grafana, and VictoriaMetrics are healthy. Pre-placeholder-cleanup DB backup/evidence is `target/dogfood-evidence/20260605T233451Z`; final post-hardening evidence is `target/dogfood-evidence/20260605T234141Z`; heuristic quality-mode evidence is `target/dogfood-model-assets/20260606T094437Z`; restore verification is `target/dogfood-restore-verification/20260606T095531Z`; split-image build timing is `target/dogfood-build-timing/20260606T100914Z`; clean seed rehearsal is `target/dogfood-clean-seed-rehearsal/20260606T104724Z`. The stack now runs in production mode behind the private tailnet HTTPS edge (host name in the operator runbook); `/v1` routes to the router, `/control-health` and `/router-health` pass, and all published service ports bind to `127.0.0.1` except Tailscale HTTPS. The repository production Compose override now wires Redis into the control plane for OIDC state. The latest auth/edge audit `target/dogfood-auth-edge/post-port-hardening-production-mode` is blocked only by `auth_non_dev_auth_not_configured`. | Configure real non-dev auth before normal development traffic uses the router; restore paid-provider allowance evidence before any non-local routed proof; install ONNX model assets only when ONNX-backed quality scoring is required. |
| Model management | The model-management surface includes lifecycle and static-catalog audit coverage, billing posture, manual/OAuth posture, Kimi API-key balance collection, retired-model UI guarding, context-window formatting, dogfood cleanup, the provider/model readiness workbench, provider contract panels, safe API mutation controls, provider access/quota rollups, dashboard endpoint-contract editing, bounded cutover-proof evidence, source-evidence collection, strict source-evidence cutover gating, request-contract proof coverage, bounded source-hit context, aggregate source-gap reporting, dynamic static-catalog provider discovery, model lifecycle coverage reporting, and model-card/request-contract/retirement source metadata where published. The current OpenAI static catalog refresh keeps GPT-5.5/GPT-5.4 family models routable and moves stale GPT-5.2, GPT-5.1, GPT-5, GPT-5 mini/nano, and o4-mini IDs into retired guardrails. Cutover diagnostics now surface per-candidate source posture for model-card, request-contract, and retirement evidence. Newly discovered or review-pending model rows are excluded from routing-ready and best-execution posture until an operator clears the review gate; floating `latest` aliases and unsafe/uncensored-style aliases now get explicit model-risk review posture and stay out of best-execution routing. The developer-agent gateway/token-optimizer track now has a non-secret control-plane profile baseline at `GET /api/v1/developer-agent-profiles/summary` for Claude Code, Codex CLI/Desktop, Grok Build, Kimi Code, and Cursor plus tenant-scoped app-endpoint binding readiness at `GET /api/v1/developer-agent-profiles/bindings`; the local tool now adds a localhost-only management runtime with health/status/tool-profile/profile-doctor/model-discovery endpoints, redacted OpenAI Chat/Responses and Anthropic Messages request normalization, explicit route-gate evaluation, non-secret protocol-adapter, quota, model-freshness, signed-proof, and loopback-only provider-dispatch config evidence, local-only OpenAI Chat, OpenAI Responses, Anthropic Messages, and Gemini `generateContent` non-streaming dispatch, real Shadow/Ollama dogfood proof for `openscorpion/local` to `qwen2.5-coder:latest`, profile-level proof for `amp-cli`, `cursor`, `factory-droids`, `generic-openai`, `generic-anthropic`, `generic-gemini`, `codex-cli`, `claude-code`, and `roo-code`, and manifest-backed reversible writers for `amp-cli`, `claude-code`, `codex-cli`, `cursor`, `factory-droids`, `generic-anthropic`, `generic-openai`, and `roo-code` (the Codex writer emits a `~/.codex/config.toml` `model_providers` table with `wire_api = responses`, references `OPENAI_API_KEY` via `env_key`, and refuses to overwrite a non-managed config). The Roo writer uses VS Code auto-import and does not touch Roo secret storage; the Cursor writer preserves Cursor user settings, writes only the OpenAI-compatible gateway URL plus local placeholder key, and does not touch Cursor subscription credentials. OpenAI Chat SSE streaming relays the upstream stream, Anthropic Messages streaming translates it into Anthropic events, and Gemini `:streamGenerateContent` translates it into Gemini chunks, and OpenAI Responses streaming emits the Responses streaming event sequence, when adapter evidence declares streaming parity. `prove-provider` adds an opt-in, budget-gated real-provider smoke test for OpenAI, Anthropic, Gemini, and OpenRouter that makes one cheap-model call behind per-call/daily USD caps (`paid-test-budget.json`) with a vault-materialized key, fail-closed pricing, and ledger accounting — local/Shadow only, never CI. Amp integration is scoped to the `amp.url` gateway-root OpenAI-compatible proof plus recorded MCP management paths (`amp.mcpServers` -> `/.api/mcp*`); Amp's proprietary backend is not a public OpenAI-compatible provider URL, so there is no inference-path parity to implement. A governed fleet rollout gate (`fleet-rollout-status` over a fail-closed `fleet-rollout-policy.json`) controls which cohorts and gateway versions may route, with version pinning and an emergency kill switch, complementing the control-plane fleet surfaces. Harness installers, broader Vertex/AI Studio and real Gemini API dispatch, ChatGPT/Codex account and other cloud/subscription/OAuth dispatch are still pending. | Continue source collectors where provider sources are authoritative; do not infer unpublished knowledge-cutoff dates. Tool-profile proofs are now explicitly scoped as local developer-agent gateway evidence (`evidence_scope`, `production_signed_proof_bundle: false`); production verifier wiring needs the APCG signed-bundle format and is tracked out-of-band. The planned local developer-agent gateway scope is complete; remaining work (control-plane real-provider routing, signed optimization proof, cloud/subscription/OAuth account adapters) is tracked separately. |
| Enterprise UX | Main workflow pages are operating surfaces, with proof/policy pages removed from the open UX tail. The current production-beta packet is `target/ux-audit/20260605T-current-james-walker-shadow-critique`, with 98/98 dashboard routes and 22/22 authenticated screenshots against the operator LAN control plane (see the operator runbook); static CSS loaded and no authenticated screenshot redirected to login. It combines the latest clean route audit with the Config Publishing recapture that verifies snapshot v43 is owned by James Walker. Shadow was recovered enough for a bounded read-only Claude Code Sonnet review on 2026-06-05; the tracked summary is `../docs/design/PRODUCTION-BETA-UX-CRITIQUE-2026-06-05.md`. Quality Alerts uses an evidence-first queue and now distinguishes no trace telemetry from zero quality breaches in the headline posture; Policy Sources now exposes row-level fetch and upload actions when controlled source text is missing; Monitoring SLO rows now show current measurement, evidence source, sample count, units, and pass/breach/measurement-needed posture; Credential Vault rows now show missing, unmatched, and configured-but-untested credential posture with add, bind-provider, and provider-test next actions; Billing Admin and Chargeback now label live usage-ledger versus registry-only provenance so missing billing data does not render as zero spend; Overview route distribution remains tied to historical trace evidence and now promotes missing provider references into an action queue; Routing Governance promotes active rules with zero tagged models into a blocking state; Settings gives missing assistant JWT a Vault remediation path; Config Publishing now records real assembled snapshot JSON and hashes for new publishes; local operator login now requires explicit non-production opt-in; `/auth/readiness` and `scripts/audit-dogfood-auth-edge.sh` now provide a non-mutating auth/edge posture gate; Provider Management uses row-level routing eligibility for readiness counts, promotes stale, unknown, drained, and incomplete account posture, and now exposes an audit naming queue for operator-local provider labels, internal notes, and private endpoints before evidence export; FinOps hides savings unless every current-month billing-ledger row in scope has retained baseline-cost evidence; Verification Replay now records reviewer sign-off/escalation decisions against completed replays (stored with the evidence row, history-preserving, gated on governed-activity sign-off authority) and surfaces high-regret, stale-evidence, provider-mismatch, failure, and active-run posture with owner next actions; Model Registry now flags risky naming aliases as model-risk review items. | Continue dogfood auth rollout: keep the audited HTTPS edge and configure SSO until the auth/edge audit passes. |
| Provider spend and quota | Billing posture is route evidence and can drain providers near thresholds. OpenRouter per-key/account posture is fresh after the `f3f9a7bf` restart, but it reports `exhausted`, quota usage 100%, and `routing_enabled=false`. OpenRouter is now disabled fail-closed in the production-beta database; local-only readiness evidence `target/dogfood-provider-inventory/20260602T094830Z` has 0 local-readiness blockers and 17 routable local pairs. Current non-spending source evidence remains clean: `target/model-pricing-audit-current.json`, `target/model-source-evidence-current.json`, and strict OpenRouter cutover evidence `target/model-source-openrouter-cutover-current.json` all passed on 2026-06-05. This does not satisfy the paid-provider cutover gate. | Restore OpenRouter credits or allowance evidence, then rerun the paid-provider readiness gate before any paid proof. |
| Evidence and claims | Signed proof bundles, route evidence, compliance packages, verification paths, the file-based dogfood claims pack builder, the first repeatable local workload wrapper, restore verification, build timing, and clean seed rehearsal now exist. `target/dogfood-clean-seed-rehearsal/20260606T104724Z` applies main migrations, verifier migrations, maintained seed SQL, bank/UI proof-signing wrappers, routing config seed, and verifier seed in isolated temporary databases with no blockers and no production database access. `target/dogfood-claims-evidence-pack/20260602T-local-failclosed-proof-v3` packages the fresh local route proof plus local-only readiness evidence with 5/5 claims passing and no provider calls; `target/dogfood-evidential-workload/workload-20260602-concurrency-01` captures three concurrent live local routed requests at max concurrency 2 with `workload-ledger.json`, a nested claims pack, 3/3 local routes, and 3/3 quality/cost/quota evidence records; `target/dogfood-evidential-workload/workload-20260602-baseline-cost-01` remains the latest workload with retained scenario baseline-cost evidence at `target/baseline-cost-evidence/workload-20260602-baseline-cost-01.json`. | Collect provider-reported/account/invoice evidence before making authoritative monetary savings claims, keep seed rehearsal current after seed/schema changes, and expand the concurrent workload profile only when real dogfood or customer review needs broader workflow coverage. |
| CI and APCG dogfood | Protected Proxmox runner classes are the active path; Blacksmith is not active; a third Rust runner is online for release-sensitive CI fan-out, the runner VMs have passed reboot-survivability smoke, PR #709 shipped path-aware Integration skipping for catalog/source-evidence tooling changes, and main was green at `0efe0b48` before this seed-rehearsal slice. Grok and Qodo are not GitHub Actions jobs or branch-protection gates, and `.pr_agent.toml` disables automatic Qodo feedback. | Keep same-repo CI local, add another light runner only after measured queue pressure, and keep Grok/Qodo-style critique as developer-initiated Shadow work rather than automatic CI. If they are ever reintroduced, keep them manual or non-blocking so external rate limits cannot fail required CI. |

## Orchestration Host Status

Latest checked status from the operator workstation:

- Primary orchestration CLI present.
- Long-running code assistant present and configured for API-key-only mode.
- Adversarial review CLI present with OAuth posture.
- Daily harness updater timer present.

Before delegating work, sync the orchestration-host checkout to `main`. Use the
private operator runbook for the concrete status command and host alias.

Do not let subagents edit the same files as Codex at the same time.

## Current Operating Notes

- Route health is clean enough to focus on workflow quality and model/provider
  readiness rather than 404 repair.
- The production-beta dogfood stack is running `dogfood-f36dd341` after a
  side-by-side release upgrade from `dogfood-c72b2896`. The guarded
  pre-upgrade DB backup/evidence capture is
  `target/dogfood-evidence/20260605T230705Z`; post-upgrade stack evidence is
  `target/dogfood-evidence/20260605T232138Z`; post-edge stack evidence is
  `target/dogfood-evidence/20260605T232806Z`.
- The six disabled-provider placeholder vault rows that blocked production
  mode were removed after backup
  `target/dogfood-evidence/20260605T233451Z`. Production mode now starts
  successfully and `/auth/readiness` reports only
  `non_dev_auth_not_configured`.
- Tailscale Serve provides the current internal HTTPS edge at
  the private tailnet HTTPS host (see the operator runbook), with `/`, `/v1`,
  `/control-health`, `/router-health`, and `/nginx-health` routed for dogfood
  and audit use. All published service ports for control, router, verifier,
  Postgres, Grafana, Vector, and VictoriaMetrics now bind to `127.0.0.1`; the
  only non-loopback listener for the stack is Tailscale HTTPS on `443`.
- The latest auth/edge audit is
  `target/dogfood-auth-edge/post-port-hardening-production-mode`. It is
  blocked only by `auth_non_dev_auth_not_configured`; the final stack evidence
  capture is `target/dogfood-evidence/20260605T234141Z`.
- The current dogfood router quality mode is documented as heuristic-only by
  `target/dogfood-model-assets/20260606T094437Z`. Two router containers were
  observed, required ONNX assets were absent on host and container paths, and
  both router logs reported heuristic fallback. Use
  `scripts/audit-dogfood-model-assets.sh --require-onnx` after installing
  `model.onnx` and `tokenizer.json`.
- Restore verification is now repeatable with
  `scripts/verify-dogfood-db-restore.sh`. The latest retained passing drill is
  `target/dogfood-restore-verification/20260606T095531Z`, run on Shadow against
  `target/dogfood-evidence/20260605T233451Z/db/openscorpion.dump`; it restored
  into an isolated Postgres container, matched tracked source counts, and left
  no restore container behind.
- Split-image build timing is repeatable with
  `scripts/capture-dogfood-build-timing.sh`. The first retained Shadow timing
  packet is `target/dogfood-build-timing/20260606T100914Z`: first runtime image
  743.929s, subsequent runtime images 2.803s and 1.927s from the shared
  all-binary builder layer, and the separate migration image 41.643s.
- Clean seed rehearsal is repeatable with
  `scripts/verify-dogfood-clean-seed-rehearsal.sh`. The latest retained Shadow
  rehearsal is `target/dogfood-clean-seed-rehearsal/20260606T104724Z`: main
  migrations, verifier migrations, base/demo/provider/bank/UI/routing/verifier
  seeds, and proof-signing wrappers all passed in isolated temporary databases.
  The first run found stale tenant UUIDs in `scripts/seed-demo.sql`; the current
  seed now uses the dev tenant UUID for tenant-scoped ML, contextual reputation,
  and regret rows.
- Proof verifier, policy release, and policy library adoption are no longer
  open UX-tail items after PR #687.
- The provider/model readiness workbench implements everyday posture. The
  provider summary API and dashboard expose access-mode and quota posture; the
  non-spending cutover audit enforces OAuth reset-window, routing-enabled, and
  non-secret endpoint header-contract evidence; safe API contract mutation
  controls, dashboard contract editing, and bounded cutover-proof evidence are
  merged. Provider Management readiness counts now exclude rows with missing
  endpoint contracts, missing auth, missing credentials, stale posture,
  route-away posture, missing allowance evidence, unknown status, disabled
  posture, or deleted posture.
- The developer-agent gateway/token-optimizer track now has first
  control-plane API surfaces:
  `GET /api/v1/developer-agent-profiles/summary` describes non-secret profile
  contracts for Claude Code, Codex CLI/Desktop, Grok Build, Kimi Code, and
  Cursor, and `GET /api/v1/developer-agent-profiles/bindings` reports
  tenant-scoped app-endpoint readiness for those profiles without credentials,
  provider calls, or routed traffic. It should match lightweight local
  optimizer ergonomics for coding-agent gateways, including the NerfGuard
  public baseline captured on 2026-06-06: Mac/Linux one-command install,
  shell/client auto-configuration, Claude Code and Codex automatic setup,
  manual compatible-gateway setup for other agents, existing-plan/provider
  optimization, unchanged prompting, per-request model and reasoning-depth
  selection, route-up behavior, reversible enable/disable, status/doctor
  diagnostics, low-latency overhead evidence, and same-spend usage claims.
  The 2026-06-06 CLIProxyAPI++/VibeProxy review adds missing local-compatibility
  scope: protocol adapters for OpenAI Chat/Responses, Anthropic Messages,
  Gemini, Codex, and Amp-style paths; tool profiles for Factory Droids, Amp
  CLI, Roo Code, generic OpenAI/Anthropic/Gemini clients, and future coding
  harnesses; subscription/account adapters for Claude Code, Codex/ChatGPT,
  Gemini, Antigravity, Kimi, Qwen, GitHub Copilot, Kiro/Kilocode-style
  providers, Z.AI GLM, OpenRouter, Vertex/AI Studio, and arbitrary
  OpenAI-compatible providers; model alias pools, wildcard exclusions, payload
  transforms, thinking/reasoning suffixes, multi-account round-robin/failover,
  provider-priority hot reload, local management APIs, and Mac menu-bar quality
  server/account UX. The first local tool
  `scripts/developer-agent-gateway.py` now emits redacted status/doctor output,
  renders the managed shell block, lists tool profiles, renders profile-doctor
  effective-config diagnostics, and renders non-mutating setup snippets for
  Factory Droids, Amp CLI, Roo Code, Cursor, generic OpenAI/Anthropic/Gemini
  clients, Grok Build, and Kimi Code. It can also start a localhost-only
  management runtime with health, redacted status, tool-profile render,
  profile-doctor, OpenAI-compatible model discovery, redacted OpenAI
  Chat/Responses and Anthropic Messages request normalization, explicit
  route-gate evaluation, and non-secret protocol-adapter, quota,
  model-freshness, signed-proof snapshot, and loopback-only provider-dispatch
  evidence. It also exposes a
  compatibility registry for protocol adapters, account adapters, sanctioned
  gateways, future coding-tool account profiles, and the blocked direct OAuth
  replay boundary. Non-streaming OpenAI Chat and Anthropic Messages now have
  local-only dispatch paths through a configured HTTP loopback
  OpenAI-compatible upstream after all route gates pass and fresh non-secret
  dispatch config enables the selected route. The first real local dispatch proof is retained in
  `docs/operations/local-dispatch-dogfood-proof.md`: Shadow routed
  `openscorpion/local` through the gateway to Ollama `qwen2.5-coder:latest`
  with paid-provider calls disabled. Other inference endpoints fail closed
  without prompt echo or public-provider calls, and it now has
  manifest-backed reversible writers for `amp-cli`, `claude-code`, `codex-cli`,
  `cursor`, `factory-droids`, `generic-anthropic`, `generic-openai`, and
  `roo-code` that preserve existing config and write no provider credentials.
  The Claude Code writer manages a `claude.env` (`ANTHROPIC_BASE_URL` plus a
  placeholder key, API-key mode, no OAuth). The Codex writer
  emits a `~/.codex/config.toml` `model_providers` table with
  `wire_api = responses` and refuses to overwrite a non-managed config. The Roo writer
  uses `roo-cline.autoImportSettingsPath` and a managed OpenScorpion import
  file without touching Roo secret storage; the Cursor writer preserves Cursor
  user settings, writes only the OpenAI-compatible gateway URL plus local
  placeholder key, and does not touch Cursor subscription credentials. Each
  local tool profile now carries an
  `openscorpion.developer_agent_tool_profile_contract.v1` contract covering
  aliases, protocol/account adapters, direct OAuth replay posture, writer
  rollback, route gates, and management surfaces. The first profile-level proof
  path now supports `prove-tool-profile --tool amp-cli`,
  `prove-tool-profile --tool cursor`,
  `prove-tool-profile --tool factory-droids`,
  `prove-tool-profile --tool generic-openai`,
  `prove-tool-profile --tool generic-anthropic`, and
  `prove-tool-profile --tool roo-code`, which send sanitized
  non-streaming requests through the running local gateway and emit
  `openscorpion.developer_agent_tool_profile_proof.v1` without writing
  provider credentials or replaying OAuth tokens. The retained Shadow artifacts
  are
  `docs/operations/evidence/2026-06-06-shadow-amp-cli-profile-proof.json`,
  `docs/operations/evidence/2026-06-06-shadow-cursor-profile-proof.json`,
  `docs/operations/evidence/2026-06-06-shadow-factory-droids-profile-proof.json`,
  `docs/operations/evidence/2026-06-06-shadow-roo-code-profile-proof.json`,
  `docs/operations/evidence/2026-06-06-shadow-generic-openai-profile-proof.json`,
  and
  `docs/operations/evidence/2026-06-06-shadow-generic-anthropic-profile-proof.json`.
  It still does not capture production optimization proof bundles.
  OpenScorpion must add controls:
  agent endpoint profiles, reasoning-depth policy, quota and allowance floors,
  model-freshness gates, signed optimization evidence, privacy controls, and
  local-only fail-closed operation until paid-provider evidence is current.
- FinOps now separates trace/workload activity from billing-ledger spend.
  Baseline and savings figures render only when every current-month
  billing-ledger row in scope has retained baseline-cost evidence; partial
  coverage is labelled and monetary savings are hidden until the evidence is
  complete.
- Provider Management now makes provider audit naming an explicit workflow:
  operator-local names, internal notes, and private endpoints are counted in
  the first-viewport attention total, promoted into an audit naming queue, and
  labelled in row-level posture before exported evidence is treated as
  customer-safe.
- Production auth/edge posture now has a repeatable non-spending gate:
  `scripts/audit-dogfood-auth-edge.sh` checks sanitized `/auth/readiness`,
  blocked local operator login, HTTPS edge health, TLS-verification posture,
  and public control-plane host-port exposure. Current dogfood SSO/ingress work
  should aim for this audit to pass before normal development traffic uses the
  router.
- Paid, aggregator, and subscription-backed traffic remains controlled. The
  first selected OpenRouter model, `anthropic/claude-haiku-4.5`, has current
  model-card, pricing, request-contract, and source evidence, but fresh billing
  evidence marks OpenRouter exhausted and route-away. OpenRouter and its
  cutover model were disabled fail-closed in the production-beta database after
  `target/dogfood-provider-inventory/20260602T094724Z` reported them as
  blockers. The next step is to restore allowance evidence, not to run paid
  inference.
- The source-evidence collector has caught missing official model-card mentions
  for stale or unsupported configured IDs. Strict source evidence is now part
  of the paid-provider cutover gate, bounded mention context is available in the
  evidence output, aggregate gap reporting shows provider/model/source severity,
  the static catalog audit discovers provider sections dynamically, lifecycle
  coverage reports reasoning-capable model entries without knowledge-cutoff
  metadata, and OpenAI, Gemini, Anthropic, xAI, and Kimi have official source
  evidence where published. Model metadata now distinguishes published
  knowledge-cutoff dates from explicit provider-not-published posture; do not
  invent missing dates. The 2026-06-05 non-spending refresh passed
  `scripts/audit-model-pricing-catalog.py` with 14 static model rows and no
  blockers, passed full public source collection with 29 sources, 44
  references, and no gaps, and passed strict OpenRouter cutover collection for
  `anthropic/claude-haiku-4.5` with exact model-card/pricing mention,
  required `context_length` and `200000` source tokens, and required
  OpenAI-compatible request-contract tokens.
- Shadow is synced to `main`, and Codex CLI, Claude Code, Grok Build, and Kimi
  are installed through the canonical Shadow operating model. Shadow required
  Proxmox-side recovery on 2026-06-05 after repo and packet reads entered
  D-state; the repository path and Claude Code API-key-only path recovered
  enough for a bounded read-only Sonnet review of
  `target/ux-audit/20260605T-current-james-walker-shadow-critique`. Treat the
  model-service side as only partially verified until the Shadow model mounts
  and local model services are checked separately. The current production-beta
  packet has 98/98 routes and 22/22 authenticated screenshots captured against
  the operator LAN control plane (see the operator runbook), with handoff prompts regenerated around the
  James Walker Config Publishing recapture. The capture harness now writes
  partial screenshot manifests incrementally, so future timeouts can still
  produce honest partial packet metadata.
- Standalone bounded work can be offloaded to Claude Code with GSD or GSD auto,
  Grok Build composer-2.5, Kimi, or additional Shadow Codex CLI sessions when
  the handoff specifies the scope, branch/worktree, verification, and return
  format.
  Codex still owns final integration, diff review, and PRs.
- CI throughput now uses three Rust-class VMs for same-repo Rust Fast Path,
  Integration, and release-sensitive aarch64 smoke fan-out. VM `113` has passed
  targeted GitHub Actions smoke dispatches, and VMs `109`, `110`, `111`, and
  `113` have survived guest reboot with runner services returning online.
- PR #709 proved the path-aware Integration skip for narrowly scoped
  catalog/source-evidence tooling paths while keeping Rust, security, Helm,
  Python SDK, APCG governance, release-sensitive aarch64 smoke, and `CI
  Required Gate` intact. Grok and Qodo are not present in `.github` workflow
  YAML; use Grok from Shadow only for bounded, manually requested critique or
  implementation spikes.
- The latest non-spending production-provider inventory capture is
  `target/dogfood-provider-inventory/20260602T094830Z`: 0 local-readiness
  blockers, 1 expected warning for no routable cloud or aggregator provider, 17
  routable local pairs, and 0 enabled non-local providers after OpenRouter was
  disabled fail-closed. This is a local-only readiness result, not paid-provider
  cutover readiness.
  The guarded pre-migration backup is
  `target/dogfood-evidence/20260602T032125Z`; the disabled dev-alias model
  cleanup backup is `target/dogfood-evidence/20260602T033514Z`; and the
  post-cleanup stack evidence capture is
  `target/dogfood-evidence/20260602T033539Z`. Local model-card and inventory
  timestamps were refreshed by
  `target/dogfood-model-cards/20260602T024710Z`; provider endpoint contracts
  and local-region metadata were filled by
  `target/dogfood-provider-contracts/local-provider-contracts-apply-20260602T0000Z`.
  Dev-host-only local providers were disabled fail-closed by
  `target/dogfood-dev-local-cleanup/dev-local-provider-cleanup-apply-20260602T0000Z`.
  OpenRouter cutover source evidence is
  `target/model-source-openrouter-cutover-current.json` for the latest
  2026-06-05 refresh and
  `target/model-source-openrouter-cutover-evidence-final.json` for the earlier
  retained cutover package; the pre-change DB
  backup is `target/dogfood-evidence/20260602T034941Z-before-openrouter-cutover`;
  post-change stack evidence is
  `target/dogfood-evidence/20260602T035024Z-after-openrouter-cutover`; and the
  targeted paid-provider cutover gate previously passed at
  `target/readiness/20260602T035342Z-openrouter-final`, but current billing
  evidence marks OpenRouter exhausted, quota usage 100%, and routing disabled.
  A later local-only readiness run,
  `target/dogfood-provider-inventory/20260602T094830Z`, confirms the production
  beta is now fail-closed for non-local providers.
- Fresh local-only route proof `target/dogfood-routed-request/20260602T094901Z`
  selected Jim Spark Ollama `gpt-oss:120b`, returned HTTP 200, recorded trace,
  route decision, compliance audit, signed proof, and valid proof verification
  with no cloud-token spend.
- The latest dogfood claims evidence pack is
  `target/dogfood-claims-evidence-pack/20260602T-local-failclosed-proof-v3`.
  It was built from the fresh local route proof and local-only readiness gate,
  records 5/5 claims passing, and remains non-spending. The pack builder now
  extracts selected-versus-best utility, regret, candidate, and cost-metric
  material from signed route evidence while separating local-only readiness from
  paid-provider cutover readiness. It still proves retained local proof coverage
  only; monetary savings, quality-retention, and paid-provider cutover claims
  require workload and allowance evidence.
- `scripts/run-dogfood-evidential-workload.py` is the first repeatable workload
  wrapper. It runs bounded prompts through the existing routed-request capture
  script, requires proof bundles, writes a workload manifest plus
  `workload-ledger.json`, accepts optional baseline-cost evidence, records
  serial versus concurrent execution mode, and builds a nested claims pack. It
  defaults to local-only and does not authorize paid, aggregator, or
  subscription-backed routing.
- The latest concurrent local workload evidence is
  `target/dogfood-evidential-workload/workload-20260602-concurrency-01`:
  preflight passed, three local route captures returned HTTP 200 at max
  concurrency 2, each capture recorded route decision, compliance audit, signed
  proof bundle, and successful verifier response, and the nested claims pack
  passed. The ledger records 3/3 local routes, 3/3 records with quality, cost,
  and quota evidence, and execution mode `concurrent`. It remains non-spending
  local workload evidence; monetary savings still require baseline-cost
  evidence for the same prompts.
- The latest baseline-cost local workload evidence is
  `target/dogfood-evidential-workload/workload-20260602-baseline-cost-01`:
  preflight passed, one local route capture returned HTTP 200, recorded route
  decision, compliance audit, signed proof bundle, successful verifier response,
  a nested 5/5 conservative local-only claims pack, and retained scenario
  baseline-cost evidence at
  `target/baseline-cost-evidence/workload-20260602-baseline-cost-01.json`. The
  ledger records token, quality, cost-metric, quota, regret, local-boundary
  posture, and a `scenario_baseline_cost_delta` against verified OpenRouter
  price-card pricing. It remains scenario evidence only; authoritative monetary
  savings still require provider-reported, account API, or invoice evidence for
  the same prompts.

## Verification Guidance

Documentation-only changes do not need full Rust CI. Use targeted checks:

```bash
git diff --check
rg -n "demo-only|hero/explainer|unsupported claim" docs .gsd AGENTS.md
```

Model or router behavior changes need the relevant non-spending readiness checks
before any real provider request:

```bash
scripts/audit-model-pricing-catalog.py \
  --catalog config/model-pricing.toml \
  --output target/model-pricing-audit.json

scripts/collect-model-source-evidence.py \
  --catalog config/model-pricing.toml \
  --provider <provider> \
  --source-kind model_card \
  --source-kind request_contract \
  --source-kind retirement \
  --require-model-card-mentions \
  --output target/model-source-cutover-evidence.json

scripts/audit-dogfood-routing-readiness.sh

MODEL_SOURCE_EVIDENCE=target/model-source-cutover-evidence.json \
  scripts/audit-dogfood-routing-readiness.sh --require-paid-provider
```

UI changes need browser evidence against a live seeded app, not static HTML:

```bash
scripts/dashboard-route-audit.py --base-url http://localhost:8090 --dev-login --delay-ms 500
```

## Open Decisions

- Collect provider-reported, account API, or invoice evidence before making
  authoritative monetary savings claims.
- Restore OpenRouter account credits or provide fresh allowance evidence before
  approving the first non-local low-token proof through a selected current
  non-local provider/model pair.
- Which local provider hosts are production dogfood candidates and which are
  intermittent failover targets?
- Which APCG CI artifacts are stable enough to add to branch protection?
