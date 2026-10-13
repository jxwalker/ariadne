# GSD Queue

Append-only log of future milestones and work items.

---

## Completed Milestones (archived)

- ✅ **M003** HuggingFace Advanced Model Management
- ✅ **M004** P1 Production Readiness Fixes
- ✅ **M006** Core IP Deepening & Production Hardening (7/7 slices)
- ✅ **M024** Enterprise Durability (5/5 slices)
- ✅ **M027** Verification Platform Foundation (6/6 slices)
- ✅ **M028** Inference Replay and Quality Evaluation (5/5 slices)
- ✅ **M029** Failure Catalog, Operational Drills, and Performance Profiling (5/5 slices)
- ✅ **M030** Claims, Release Gates, Diagnostics, and Continuous Improvement (6/6 slices)
- ✅ **M031** Deployment Profiler (6/6 slices)
- ✅ **M032** APCG Compliance Assurance (6/6 slices)
- ✅ **M033** Inference Pipeline Refactor — 6 slices (format-neutral pipeline, Responses API)
- ✅ **M034** Multi-Format API & Agentic Infrastructure — 6 slices (Anthropic adapter, MCP, agentic loops, reasoning traces)
- ⚠️ **M052–M055** Features built ad-hoc without GSD tracking. Code landed, docs honest.

---

## Active Priority: Preproduction Router Readiness

This is the current priority stack. New work starts here and in
`../docs/ROADMAP.md`; older milestone records below are retained only as
append-only history.

### Immediate Reviewable Slices

1. Extend provider-specific collectors beyond model-card source refresh:
   request contracts, retirement notices, quota posture, and explicit
   `not_published` posture for providers that do not disclose knowledge-cutoff
   dates. The cutover gate now rejects stale or undated source-evidence reports
   by default; keep source freshness in the collector and operator workflow.
   The current OpenAI static-catalog slice refreshes routable IDs to the
   official GPT-5.5/GPT-5.4 family and moves older compatibility IDs into
   retired guardrails with a regression test. The current cutover-diagnostics
   slice adds per-candidate source posture for model-card, request-contract,
   and retirement evidence so operators can distinguish missing, stale,
   fetched, and model-mentioned source states before enabling a non-local pair.
   The pricing source path now has an explicit strict mode as well: selected
   paid cutover evidence can require provider pricing pages to mention the
   configured model IDs instead of treating generic price pages as sufficient.
   The cutover evaluator now also requires pricing support for the selected
   provider/model pair, so omitting pricing from the evidence report cannot
   accidentally pass the gate.
   Model-card token proof is now available for exact context-window or
   knowledge-cutoff evidence; the OpenRouter cutover candidate requires its
   context metadata tokens to be present in fetched source evidence.
2. Run `scripts/prepare-shadow-ux-critique.py` against an authenticated
   dashboard, delegate the packet to Claude/GSD, Grok Build Composer 2.5, and
   Kimi, then turn findings into workflow-group PRs. The current
   production-beta packet is
   `target/ux-audit/20260605T-current-james-walker-shadow-critique` with 98/98
   route checks and 22/22 authenticated screenshots; it combines the latest
   clean route audit with the James Walker Config Publishing recapture. The
   capture used an exported dashboard capability inventory so route evidence
   did not depend on a live Cargo build. The
   capture harness now writes partial screenshot manifests incrementally, so
   interrupted future runs preserve truthful packet metadata instead of losing
   all screenshot evidence.
   The Overview
   distribution now labels historical providers, missing provider references,
   and retired model identifiers so route history does not masquerade as
   current provider/model readiness. Provider Management now promotes stale,
   unknown, drained, and incomplete account posture into an account-posture
   queue above the registry. FinOps now surfaces current-period trace activity
   without billing-ledger rows as a ledger-capture action instead of spend. The
   current provider route-gate slice makes provider access-mode and quota
   posture explicit in each row so operators can see why a provider is local
   ready, cutover ready, route-away, stale, missing allowance, missing auth,
   missing credential, missing contract, or disabled. The Overview distribution
   should remain historical trace evidence and must not hide recent traffic
   merely because a provider was later disabled or drained. The Overview fleet
   KPI now uses the provider route gate, so stale, drained, missing-auth,
   missing-credential, missing-contract, and missing-allowance rows do not
   inflate the routable provider/model count. Provider Management top-strip
   readiness counts should use the same row-level routing eligibility posture,
   not raw `billing_status = ok`, so missing endpoint contracts, missing auth,
   missing credentials, stale posture, allowance gaps, disabled rows, and
   route-away rows cannot look billing-ready. FinOps savings should render only
   when every billing-ledger row in the current month/scope has retained
   baseline-cost evidence; otherwise it should show trace/workload activity,
   expose the ledger-capture action, and hide monetary savings. Shadow was
   recovered enough for a bounded read-only Claude Code Sonnet review of the
   packet on 2026-06-05; the resulting tracked summary is
   `../docs/design/PRODUCTION-BETA-UX-CRITIQUE-2026-06-05.md`. Convert those
   findings into small workflow-group PRs. Production-gated local operator
   login, real config snapshot hash posture, missing JWT remediation,
   unassigned-provider warnings, and zero-tagged-model blocking states now have
   bounded implementation slices on main or in flight. A
   production-beta data correction changed stale config snapshot v43 ownership
   from `Sarah Chen` to `James Walker`; the recapture packet at
   `target/ux-audit/20260605T164449Z-config-owner-fix` passed 22/22 screenshots
   and verifies the Config Publishing page. Verification Replay now exposes
   stale evidence, high regret, provider mismatch, failed runs, active runs, and
   owner next actions directly in the replay table and HTMX refresh partial.
   Model Registry now flags `latest` aliases and unsafe/uncensored-style aliases
   as model-risk review items and excludes them from best-execution routing
   until an owner review clears the naming posture. Quality Alerts now separates
   no trace telemetry from zero breach events in the first-viewport posture, so
   an empty tenant cannot read as a clean quality window. Policy Sources now
   gives missing controlled source text a row-level fetch or upload action
   instead of forcing operators to drill into the detail workflow first.
   Monitoring SLO rows now show current measurement, source, sample count,
   units, and pass/breach/measurement-needed posture. Credential Vault rows now
   expose missing, unmatched, and configured-but-untested credential posture
   with inline add, bind-provider, and provider-test next actions.
   Billing Admin and the Chargeback report now label usage provenance and
   distinguish missing ledger rows from true zero spend. Provider Management
   now exposes an audit naming queue and row-level naming posture so
   operator-local provider labels, internal notes, and private endpoints cannot
   silently enter exported evidence as customer-safe names.
3. Capture retained scenario baseline or provider-reported alternative-cost
   evidence for the current workload ledger before making monetary savings
   claims.
4. Continue the developer-agent gateway track after the profile and binding
   baseline: `GET /api/v1/developer-agent-profiles/summary` defines the
   non-secret Claude Code, Codex CLI/Desktop, Grok Build, Kimi Code, and Cursor
   contracts, and `GET /api/v1/developer-agent-profiles/bindings` reports
   tenant-scoped app-endpoint readiness for those profiles without credentials,
   provider calls, or routed traffic. The NerfGuard parity backlog is now
   explicit in the roadmap: Mac/Linux one-command install, shell/client
   auto-configuration, Claude Code and Codex automatic setup, manual setup for
   other compatible coding agents, existing-plan/provider optimization,
   unchanged prompting, per-request model and reasoning-depth selection,
   route-up behavior, reversible enable/disable, status/doctor diagnostics,
   free/internal-dogfood packaging posture, measured low-latency overhead, and
   evidence-backed same-spend usage claims. The CLIProxyAPI++/VibeProxy gap
   review adds concrete "any model with any coding tool" work: protocol
   adapters for OpenAI Chat/Responses, Anthropic Messages, Gemini, Codex, and
   Amp-style paths; tool profiles for Factory Droids, Amp CLI, Roo Code,
   generic OpenAI/Anthropic/Gemini clients, and future coding harnesses;
   subscription/account adapters for Claude Code, Codex/ChatGPT, Gemini,
   Antigravity, Kimi, Qwen, GitHub Copilot, Kiro/Kilocode-style providers,
   Z.AI GLM, OpenRouter, Vertex/AI Studio, and arbitrary OpenAI-compatible
   providers; model alias pools, wildcard exclusions, payload transforms,
   thinking/reasoning suffixes, multi-account round-robin/failover,
   provider-priority hot reload, local management APIs, and a Mac menu-bar
   quality local UX. The first local tool now exists at
   `scripts/developer-agent-gateway.py`: it emits redacted status/doctor
   output, renders the managed shell block, lists tool profiles, renders
   profile-doctor effective-config diagnostics, renders non-mutating setup
   snippets for Factory Droids, Amp CLI, Roo Code, Cursor, generic
   OpenAI/Anthropic/Gemini clients, Grok Build, and Kimi Code, and can start a
   localhost-only management runtime. The runtime exposes health, redacted
   status, tool-profile render, profile-doctor, OpenAI-compatible model
   discovery, redacted OpenAI Chat/Responses and Anthropic Messages request normalization
   for supported OpenScorpion aliases, explicit route-gate evaluation covering
   protocol enablement, quota posture, model freshness, and signed route proof, and a
   non-secret `protocol-adapter-enable-snapshot.json` evidence contract that
   can pass only the protocol-adapter gate, a non-secret `quota-snapshot.json`
   evidence contract that can pass only the quota gate, a non-secret
   `model-snapshot.json` evidence contract that can pass only the
   model-freshness gate, and a non-secret `proof-snapshot.json` evidence
   contract that can pass only the signed-proof gate. It now also exposes a
   compatibility registry for protocol adapters, account adapters, sanctioned
   gateways, future coding-tool account profiles, and the blocked direct OAuth
   replay boundary. Non-streaming OpenAI Chat, OpenAI Responses, Anthropic
   Messages, and Gemini `generateContent` now have local-only dispatch paths:
   they can call only a configured HTTP loopback OpenAI-compatible upstream after
   all route gates pass and fresh non-secret `provider-dispatch-config.json`
   enables the selected route. The Gemini path carries the model alias in the
   request URL path (`/v1beta/models/{model}:generateContent`) and presents a
   placeholder `x-goog-api-key` to the gateway only; the Responses path is the
   wire API that current Codex CLI custom providers must use after Chat
   Completions was removed. The first real
   local proof is retained in
   `docs/operations/local-dispatch-dogfood-proof.md`: Shadow routed
   `openscorpion/local` through the gateway to Ollama `qwen2.5-coder:latest`
   with paid-provider calls disabled. OpenAI Chat streaming relays the upstream
   Server-Sent Events, Anthropic Messages streaming translates that upstream SSE
   into Anthropic events, Gemini `:streamGenerateContent` translates it into
   Gemini chunks, and OpenAI Responses streaming emits the Responses streaming
   event sequence, when fresh adapter evidence declares
   `streaming_and_non_streaming` parity. Vertex/AI Studio,
   real Gemini API, ChatGPT/Codex account, cloud, aggregator, subscription, and
   OAuth dispatch still fail closed without provider calls. (Amp's `amp.url` is a
   proprietary backend, not an OpenAI-compatible provider URL; Amp integration is
   scoped to the gateway-root proof plus recorded MCP management paths, so there
   is no Amp inference-path parity to implement.)
   The first manifest-backed reversible writers now support `amp-cli`,
   `claude-code`, `codex-cli`, `cursor`, `factory-droids`, `generic-anthropic`,
   `generic-openai`, and `roo-code`, preserving existing config and writing only
   placeholder local keys. The Claude Code writer manages a `claude.env`
   (`ANTHROPIC_BASE_URL` plus a placeholder key, API-key mode, never claude.ai
   OAuth). The Codex writer emits a `~/.codex/config.toml`
   `model_providers` table with `wire_api = responses`, references
   `OPENAI_API_KEY` via `env_key` (no key value written), and refuses to
   overwrite a non-managed config. The Roo writer uses
   `roo-cline.autoImportSettingsPath` plus a managed
   OpenScorpion import file and does not touch Roo secret storage; the Cursor
   writer preserves Cursor user settings, writes only the OpenAI-compatible
   gateway URL plus local placeholder key, and does not touch Cursor
   subscription credentials. Next connect the retained
   local gateway proof to the production Rust proof verifier or keep it
   explicitly scoped as local evidence. Each
   profile now also emits an
   `openscorpion.developer_agent_tool_profile_contract.v1` contract covering
   aliases, protocol/account adapters, direct OAuth replay posture, writer
   rollback, route gates, and management surfaces. The first profile-level
   proof path now supports `prove-tool-profile --tool amp-cli`,
   `prove-tool-profile --tool cursor`,
   `prove-tool-profile --tool factory-droids`,
   `prove-tool-profile --tool generic-openai`,
   `prove-tool-profile --tool generic-anthropic`,
   `prove-tool-profile --tool generic-gemini`,
   `prove-tool-profile --tool codex-cli`,
   `prove-tool-profile --tool claude-code`, and
   `prove-tool-profile --tool roo-code`, which send sanitized
   non-streaming requests through the running gateway and emit
   `openscorpion.developer_agent_tool_profile_proof.v1` without writing
   provider credentials or replaying OAuth tokens. The retained Shadow artifacts
   are
   `docs/operations/evidence/2026-06-06-shadow-amp-cli-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-cursor-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-factory-droids-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-roo-code-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-generic-openai-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-generic-anthropic-profile-proof.json`,
   `docs/operations/evidence/2026-06-06-shadow-generic-gemini-profile-proof.json`,
   `docs/operations/evidence/2026-06-07-shadow-codex-cli-profile-proof.json`,
   and
   `docs/operations/evidence/2026-06-08-shadow-claude-code-profile-proof.json`;
   tool-profile proofs are now explicitly scoped as local developer-agent
   gateway evidence (`evidence_scope: local_developer_agent_gateway_evidence`,
   `production_signed_proof_bundle: false`); production verifier wiring needs the
   APCG signed-bundle format (coordinated `scorpion-apcg` crate) and is tracked
   out-of-band. A new opt-in, budget-gated `prove-provider` makes one
   cheapest-model real call per provider (OpenAI, Anthropic, Gemini, OpenRouter)
   behind per-call/daily USD caps with a vault-materialized key, fail-closed
   pricing, and ledger accounting (local/Shadow only, never CI). A governed fleet
   rollout gate (`fleet-rollout-status` over a fail-closed
   `fleet-rollout-policy.json` with cohort allow-listing, version pinning, and an
   emergency kill switch) now controls which cohorts/versions may route. The
   planned local developer-agent gateway scope is complete; capture signed
   optimization proof and wire control-plane real-provider routing before normal
   coding-agent traffic routes through OpenScorpion.

### P0 — Local Inference Dogfood

- Use OpenScorpion as the local governed inference router for real development
  traffic.
- Keep cloud, aggregator, and subscription-backed routes disabled until the
  non-spending paid-provider cutover gate passes.
- Capture one local-only proof and one explicitly authorized bounded non-local
  proof before broader routing.
- Keep production dogfood behind an audited HTTPS edge and add non-dev
  authentication before sustained use.
- Current edge slice: `dogfood-f36dd341` is live in production mode behind the
  private tailnet HTTPS edge (host name in the operator runbook); `/v1`
  reaches the router, direct host-port exposure for control, router, verifier,
  Postgres, Grafana, Vector, and VictoriaMetrics is closed by loopback-only
  bindings, and
  `target/dogfood-auth-edge/post-port-hardening-production-mode` is blocked
  only by `auth_non_dev_auth_not_configured`. The repository production Compose
  override now wires Redis into the control plane for OIDC state; real IdP
  configuration is still required. Six disabled-provider placeholder vault rows
  were removed after backup
  `target/dogfood-evidence/20260605T233451Z`.
- Clean seed rehearsal now passes through
  `scripts/verify-dogfood-clean-seed-rehearsal.sh`; latest retained evidence is
  `target/dogfood-clean-seed-rehearsal/20260606T104724Z`. It applies the main
  database migrations, verifier migrations, maintained seed SQL, bank/UI
  proof-signing wrappers, routing config seed, and verifier seed in isolated
  temporary databases without touching production.
- Retain a passing `scripts/audit-dogfood-auth-edge.sh` evidence bundle before
  declaring production dogfood ready for normal development traffic.

### P0 — Model Management And Provider Access

- Continue production-dogfood inventory hardening: the latest dated inventory
  evidence snapshot has a clean local-only gate; next keep the paid-provider
  cutover gate fail-closed until a deliberately selected non-local pair has
  current evidence.
- The model/provider readiness workbench described in
  `../docs/architecture/MODEL-MANAGEMENT-OPERATING-MODEL.md#provider-and-model-management-attributes`
  is implemented.
- Expert endpoint/header/request-contract review, safe API mutation controls,
  and dashboard editing without exposing secrets are implemented.
- Bounded cutover-proof evidence is emitted by the non-spending readiness audit
  before any non-local dogfood route can be enabled; strict model-card source
  evidence, request-contract proof coverage, and a default 24-hour source
  evidence freshness window are now part of that same gate.
- Support provider-specific headers and request profiles for OpenAI-compatible
  providers through endpoint profiles without exposing secrets.
- Keep OAuth/subscription posture explicit and measurable; do not treat it as
  unlimited provider capacity.
- Add provider-specific collectors only where reliable model-card, pricing,
  allowance, or reset APIs exist.
- Keep stale OpenAI compatibility IDs out of the static routing catalog; use
  the retired guardrail list for audit visibility until an authoritative source
  says they should become routable again.

### P0 — Developer Agent Gateway And Token Optimizer

- Add a local gateway path for coding-agent traffic so OpenScorpion can route
  Claude Code, Codex CLI, Codex Desktop, and other compatible coding harnesses
  without changing normal prompting behavior.
- Provide one-command bootstrap for Mac and Linux developer machines, including
  signed installer verification, shell configuration, reversible
  enable/disable controls, and a status/doctor command that shows active agent
  profiles without printing secrets.
- Automatically configure Claude Code CLI, Codex CLI, and Codex Desktop where
  supported, while retaining manual setup instructions for any other compatible
  coding agent.
- Add tool profiles for Factory Droids, Amp CLI, Roo Code, generic
  OpenAI-compatible clients, generic Anthropic clients, generic Gemini clients,
  Cursor, Grok Build, Kimi Code, and future coding harnesses. Roo Code now has
  the first VS Code-extension writer via auto-import; each remaining profile
  needs config write/restore, model naming, protocol transform, and route-proof
  evidence.
- Support manual setup for any agent that can target a compatible model gateway
  or OpenAI-compatible endpoint.
- Add protocol adapters for OpenAI Chat Completions, OpenAI Responses,
  Anthropic Messages, Gemini, Codex, Amp-style provider and management paths,
  and streaming/non-streaming parity before claiming universal coding-tool
  support.
- Optimize existing provider access modes instead of forcing a new vendor:
  subscriptions/OAuth, API keys, aggregators, and local models should all be
  represented as explicit access modes with quota and allowance posture.
- Treat Claude Code, Codex/ChatGPT, Gemini, Vertex/AI Studio, Antigravity,
  Kimi, Qwen, GitHub Copilot, Kiro/Kilocode-style providers, Z.AI GLM,
  OpenRouter, and arbitrary OpenAI-compatible providers as separate adapter
  targets with terms, billing, quota, model-freshness, and source evidence.
- Keep internal dogfood free of any separate optimizer tax; decide external
  packaging later and do not let pricing questions block technical readiness.
- Add local management APIs and a Mac menu-bar quality UX for server start/stop,
  account connection, provider priority, usage/quota/log diagnostics, update
  posture, and hot-reload provider toggles. Linux can start with CLI/systemd
  parity and honest support status.
- Add alias and transform policy: prefixes, wildcard exclusions, forked aliases,
  alias pools, reasoning/thinking suffixes, payload defaults/overrides/filters,
  and response normalization, all visible in signed optimization evidence.
- Add multi-account support per provider with rate-limit failover,
  round-robin/fill-first routing, per-account quota posture, and provider
  priority controls that do not discard auth state when disabled.
- Select provider, model, request shape, and reasoning depth per request. Route
  up to the strongest approved model for high-judgment tasks and route down
  only when policy, model freshness, quality, and quota evidence support it.
- Keep gateway overhead measured with an SLO target in the low hundreds of
  milliseconds for local routing overhead; store latency evidence instead of
  making unsupported speed claims.
- Add agent endpoint profiles for Claude Code, Codex, Grok Build, Kimi, Cursor,
  and other coding harnesses, including required non-secret headers, request
  transforms, response transforms, and provider terms/access-mode posture.
- Emit signed optimization evidence for selected model, alternatives
  considered, route-up/route-down reason, expected cost/latency/quality
  tradeoff, quota posture, policy constraints, and local/sovereign boundary
  posture.
- Add privacy controls so prompts, secrets, OAuth tokens, API keys, and
  provider credentials do not enter logs, evidence packs, or agent handoff
  artifacts.
- Keep local-only developer routing fail-closed for paid and subscription
  providers until allowance, billing, request-contract, pricing, and model-card
  evidence is current.

### P0 — Enterprise UX Audit

- Route health is clean; now fix workflow quality and expert configuration.
- UX-Tail-01 is merged through PR #687; proof verifier, policy release, and
  policy library adoption are no longer open UX-tail items unless a regression
  appears.
- Verification Replay now turns replay evidence into an operator queue by
  surfacing stale evidence, high regret, provider mismatch, failure, active-run
  posture, and the next owner action in the main table and refresh partial.
- Model Registry now treats risky model naming as workflow posture: floating
  `latest` aliases and unsafe/uncensored-style aliases are visible model-risk
  review items and remain excluded from best-execution routing.
- Quality Alerts now treats absent trace telemetry as an attention posture
  rather than a successful zero-breach state.
- Policy Sources now exposes inline fetch/upload controls for rows that are
  missing controlled source text.
- Monitoring now gives each SLO row current measurement posture with source and
  sample count instead of only showing configured targets.
- Credential Vault now makes missing, unmatched, and untested credential rows
  actionable without exposing secret values.
- Billing Admin and Chargeback now expose live-ledger versus registry-only
  provenance so missing billing data cannot read as zero spend.
- Provider Management now promotes provider audit-naming issues above the
  registry and labels row-level posture for operator-local names, internal
  notes, and private endpoints before evidence export.
- Use `scripts/prepare-shadow-ux-critique.py` to generate the bounded
  route/screenshot packet and handoffs. Claude/GSD handles systematic workflow
  review, Grok Build Composer 2.5 handles adversarial product critique, Kimi
  handles large-context flow review, and Codex owns final diffs, verification,
  and PRs.
- Convert the remaining findings into small PR-sized UX slices with screenshots
  before and after; do not relist proof verifier, policies, or policy library
  as open debt after UX-Tail-01 merges.

### P0 — Evidence And Claims Harness

- Extend the bounded workload harness so it emits signed evidence for savings,
  quality, regret, sovereign/data-boundary gates, quota failover, and
  cheaper-equivalent substitution.
- Keep customer claims tied to observed evidence or clearly labelled scenario
  assumptions.
- First retained-evidence pack slice exists:
  `scripts/build-dogfood-claims-evidence-pack.py` packages local route captures
  and readiness captures into a reviewer pack with `manifest.json`,
  `claims.json`, `SUMMARY.md`, copied evidence, and `checksums.sha256`. The
  latest generated local-only pack is
  `target/dogfood-claims-evidence-pack/20260602T-local-failclosed-proof-v3` with
  5/5 conservative claims passing and no provider calls; it explicitly does not
  authorize paid, aggregator, or subscription-backed routing.
- First workload wrapper exists: `scripts/run-dogfood-evidential-workload.py`
  runs bounded prompts through the existing routed-request capture path,
  requires proof bundles, writes a workload manifest plus `workload-ledger.json`,
  accepts optional baseline-cost evidence, records serial versus concurrent
  execution mode, and builds a nested claims pack. It is local-only by default
  and requires explicit paid-inference opt-in before non-local captures.
- Clean seed rehearsal exists:
  `scripts/verify-dogfood-clean-seed-rehearsal.sh` creates isolated main and
  verifier databases, applies migrations and maintained seed paths, captures
  per-step logs plus table-count posture, and removes the temporary database
  container by default. Latest evidence:
  `target/dogfood-clean-seed-rehearsal/20260606T104724Z`.
- Latest live local workload evidence:
  `target/dogfood-evidential-workload/workload-20260602-concurrency-01` passed
  with three concurrent live local route captures at max concurrency 2, 3/3
  local routes, 3/3 records with quality/cost/quota evidence, and a nested
  claims pack. It proves concurrent local workload capture and proof coverage,
  but it deliberately does not make a monetary savings claim because no
  baseline-cost evidence was attached to that concurrent run.
- Latest baseline-cost workload evidence:
  `target/dogfood-evidential-workload/workload-20260602-baseline-cost-01`
  passed with one live local route capture, `workload-ledger.json`, a nested
  5/5 claims pack, and retained scenario baseline-cost evidence at
  `target/baseline-cost-evidence/workload-20260602-baseline-cost-01.json`. The
  pack proves local-only route/proof coverage and transparent
  selected-versus-best route evidence. The ledger records observed route, token,
  quality, cost-metric, quota, regret, local-boundary posture, and a
  `scenario_baseline_cost_delta` against verified OpenRouter price-card
  pricing. Authoritative monetary savings claims remain open until
  provider-reported, account API, or invoice evidence exists for the same
  workload.

### P0 — CI And APCG Dogfood

- Keep trusted CI on protected Proxmox runner classes.
- Keep docs-only PRs on the light bypass path.
- Run same-repo classification, docs-only bypass, and the required aggregate
  gate on the light runner; keep fork PRs on hosted runners.
- Run Rust Fast Path, Integration, and release-sensitive aarch64 smoke in
  parallel after change classification so all three Rust-class VMs can be used.
- Integrate APCG signed decision artifacts when the parallel APCG CI work is
  stable enough for branch protection.

---

## Archived Priority: Bank Product and Compliance Certification Readiness

Guided by competitive analysis and the April 30 GTM/TAM response: our moat is governed best execution with provable compliance, not generic gateway features. The broader product frame is a compliance workflow resolver and certification system for regulated industries, with AI as the highest-growth runtime application. Priorities are ordered to close bank deals.

### 🔴 P0 — Bank Product Demo Critical

- ✅ **Bank Product Demo Script** — `internal/demo/demo-guide.md` — 10-minute scripted product demo with setup, 7-step walkthrough, buyer qualification questions, competitive responses.
- ✅ **Proof/Evidence UX** — Verify Signature + Download Proof Bundle buttons on trace detail, inline verification, deny-path evidence visible.
- ✅ **Data Residency** — `region` field on providers, DataResidency policy rules enforced in APCG, dashboard page, migration.
- ✅ **LLM-as-Judge** — Wired into dispatch (streaming + buffered), configurable, sovereign-safe routing, graceful fallback.
- ✅ **Quality Alerting** — End-to-end: DB persistence, control plane processing, dashboard page, API.
- ✅ **Bank Product Narrative Refresh** — Product-facing demo materials say finished product, governed best execution, meaningful FinOps, and audit-ready evidence. The 2026-05-17 customer presentation removes internal implementation commentary, avoids unsupported pilot/timeline claims, and aligns the utility model with the shipped scorer.
- ✅ **Seeded Dashboard Smoke Path** — Local dev startup now handles Docker Compose v2/v1 detection, exports the computed `DATABASE_URL`, applies migrations cleanly, and seeds representative bank data for overview, FinOps, billing, Fleet V2, provider reputation, data residency, regimes, models, compliance, certification, and routing-governance pages. Vault credentials remain intentionally empty unless real secrets are configured.
- ✅ **UX-01 Enterprise Operating Surfaces** — Compliance and governed-activity pages now use compact queue controls, real status strips, export/review actions, filters, and primary tables in the first viewport. Standard: `docs/design/ENTERPRISE-UI-OPERATING-MODEL.md`.
- ✅ **UX-02 Exception And Governance Surfaces** — Exception certificates and routing governance now follow the operating-surface standard. Hero/explainer sections, role/persona teaching blocks, card-and-notes configuration pages, and API endpoint note blocks have been removed from those first-view operating surfaces. The demo seed now loads routing-governance signals, decision rules, bandit policy, and tagged-model coverage so the governance workbench is not an empty shell.
- ✅ **UX-03 Live Routing Configuration Surface** — App endpoint route book and user routing preferences now use enterprise operating surfaces with real status strips, process/publication/key readiness, endpoint attention queue, governed next actions, and first-viewport links into governance, process definitions, and routing analytics.
- ✅ **UX-04 Config Publishing Release Control** — Config publishing now uses the operating-surface standard: first viewport shows current snapshot version, router acknowledgement, hash/publisher metadata, snapshot history posture, publish action, rollback actions, and an actionable empty state instead of a card-first explainer page.
- ✅ **UX-05 ML Signal Evaluation Operating Surface** — ML signal evaluation now uses the operating-surface standard: first viewport shows evaluation coverage, accuracy posture, training queue state, model registry readiness, labelled corpus size, and concrete review actions instead of a hero metric strip.
- ✅ **UX-06 Overview And FinOps Operating Surfaces** — Overview and FinOps now use command-bar operating surfaces with runtime posture, distribution/event evidence, baseline-vs-routed savings, utility-model context, budget attention, and compact chargeback tables. This corrects the previous roadmap drift that implied full UI coverage before every route had been audited.
- ✅ **UX-07 Fleet Operating Surfaces** — Router Fleet and Fleet Groups now use command-bar operating surfaces with live fleet posture, router inventory, enrollment-token readiness, tag taxonomy posture, and deployment actions. This removes the remaining `hero-metrics`/`hero-stat` first-viewport regression found by the route audit.
- ✅ **UX-11 Process Definition Operating Surface** — Process definitions now use command-bar release controls, a status strip, definition register, draft certification-point editing, control counts, publication hash posture, endpoint-binding posture, next actions, and technical JSON disclosures instead of a page-header/card-first admin surface.
- ✅ **UX-12 Verification Replay Operating Surface** — Verification now uses a replay evidence workbench with current run posture, active replay state, completed/failed counts, request coverage, seeded replay results, trace-replay and quality-trend actions, and replay execution in the first viewport instead of a page-header/card-first layout.
- ✅ **UX-13 Policy Source Ingestion Operating Surface** — Policy-source ingestion now opens as an operator work queue with source posture, document/extraction/draft state, next actions, detail workflow controls, operator-safe registration errors, and review-safe queue counts instead of a card-first source list.

### 🔴 P0 — Compliance Certification Wedge

- 🔄 **Network Architecture / Configuration Compliance Certification** — First slices shipped as `/dashboard/certifications`: a bank-friendly workbench around process checkpoints, governed activity evidence, exception certificates, remediation/signoff state, recertification dates, JSON/HTML/PDF evidence exports, named verifier-profile readiness, signed policy material, and package-verification policy-pack provenance review for model risk, audit, platform, finance, and regulator review. Next work should be API/AXI coverage or buyer-driven evidence depth. This uses the same policy/evidence resolver that governs AI inference; do not build a disconnected network-audit tool.
- ✅ **Certification Summary API** — `/api/v1/certifications/summary` exposes package-readiness aggregates, reviewer-profile readiness, evidence-package links, and next actions for integrations and diligence tooling. The bank seed now creates process definitions for the live capital-markets workflow and network-configuration certification package so the certification workbench and API have concrete package rows.

- 🔄 **Certification Evidence Pack Schema** — Reusable process-scoped package structure exists through the compliance evidence exporter: source documents, evidence artifacts, route evidence, governed activities, exception records, proof signatures, signed policy material, material hashes, recertification metadata, dashboard verifier-profile readiness, and policy-pack provenance review can be exported or reviewed for a process/certification-point scope. Next work should expand API/AXI coverage or add evidence fields only when customer review exposes a gap.

- 📋 **Agentic Workflow Certification Expansion** — Treat agentic workflow governance as the natural expansion path: pre-approve plans/tools, enforce runtime constraints, record deviations, and issue a final certification record.

### 🔴 P0 — Moat-Strengthening (next up)

- 🔄 **Provider Model-Card And Quota Freshness** — Treat provider `/models`
  APIs as availability signals, not approval signals. The first model-card
  guardrail slices are implemented: daily discovery is enabled in
  `config/control.toml`, static fallback rows are disabled by default, router
  snapshots exclude API-discovered models not seen in the last 48 hours, source
  URLs and verification timestamps are recorded from the static pricing catalog,
  known legacy/speculative IDs stay visible but deprecated,
  `scripts/audit-model-pricing-catalog.py` fails static catalog drift where
  source metadata, context windows, duplicate IDs, or retired-model conflicts
  are unsafe, source evidence now includes bounded model-hit context plus
  aggregate source-gap reporting, API-discovered exact catalog matches now
  inherit audited model-card source metadata without treating provider inventory
  as model-card truth, and OpenAI plus Gemini model-card source URLs,
  context-window metadata, and knowledge-cutoff metadata are refreshed using
  model-specific official pages. Anthropic is refreshed to Claude Opus 4.8 with
  official cutoff/context metadata, xAI Grok 4.3 has official pricing/context/
  cutoff evidence, and Kimi K2.6 has official model-card/context evidence with
  explicit `not_published` knowledge-cutoff posture. Next slices:
  structured collectors for provider docs that expose request-parameter
  contracts, knowledge cutoffs, and retirement notices; provider-specific
  OAuth/subscription quota collectors remain tracked under Provider Spend And
  Quota Telemetry.

- 🔄 **Provider Spend And Quota Telemetry** — Control/data-plane posture, first collector slice, provider dashboard posture, signed billing evidence, API alert summaries, and persisted alert state are complete: provider-account billing snapshot/history tables, normalized status/source types, `ConfigSnapshot` publication after scheduled/API/manual posture changes, `/api/v1/provider-billing`, `POST /api/v1/provider-billing/refresh`, manual/OAuth allowance posture entry, local/OpenRouter/OpenAI/Anthropic account collectors, Kimi/Moonshot API-key balance collection, trace-ledger fallback, router drain/penalty logic, route-evidence billing posture, provider-billing alert ledger, realtime freshness/collector-coverage fields, outbound alert webhooks, provider operating-surface billing/quota columns, account-posture queueing on Provider Management, OpenAI-compatible provider-reported per-request cost capture, and fresh manual/OAuth allowance preservation during automatic refresh exist. Next slices: provider-specific OAuth/subscription collectors only where reliable allowance, usage, or reset-window APIs exist. Routing should avoid providers whose remaining quota is below the configured floor, for example redirecting traffic before an account reaches 95% of its monthly or prepaid allowance.

- 🔄 **Production Dogfood Traffic Readiness** — The internal Proxmox environment now has the first persistent production-style OpenScorpion deployment. A guarded evidence-capture script inventories the stack, captures health endpoints, records aggregate DB/provider posture, and can stream a local `pg_dump -Fc` backup before cleanup. A non-mutating routing-readiness audit turns service health, provider billing/quota state, placeholder provider records, stale model inventory, model-card evidence, legacy model IDs, cloud-model pricing, endpoint contracts, local-provider metadata, and schema-compatibility posture into an explicit pass/warn/fail gate without spending provider tokens; OAuth/subscription cutover also requires reset-window, routing-enabled, non-secret endpoint header-contract evidence, and fresh source evidence under the default 24-hour cutover window. The stack is upgraded to `dogfood-e24a1571`; the post-upgrade evidence capture `target/dogfood-evidence/20260602T-post-e24a1571-upgrade` passes with control, router, verifier, Grafana, and VictoriaMetrics health endpoints returning HTTP 200. During recovery, the stale enabled equivalence `o3-mini -> deepseek/deepseek-r1` was disabled because its target was not in the current OpenRouter catalog. OpenRouter `anthropic/claude-haiku-4.5` still has official non-spending source evidence; the latest strict refresh `target/model-source-openrouter-cutover-current.json` passed on 2026-06-05 with exact model mention, pricing, request-contract, retirement, and required context tokens. Fresh billing evidence still marks OpenRouter `exhausted`, quota usage 100%, and routing disabled. OpenRouter and its cutover model are now disabled fail-closed in the production-beta database. The latest local-only readiness audit `target/readiness/20260602T-post-e24a1571-local` has 0 blockers, 17 routable local pairs, and 0 routable non-local pairs. The latest paid diagnostic `target/readiness/20260602T-model-source-freshness-paid-diagnostic` fails closed with 1 blocker because no paid provider is currently routable; source evidence is fresh and accepted. The latest bounded local route proof `target/dogfood-routed-request/20260602T094901Z` selected Jim Spark Ollama `gpt-oss:120b`, produced HTTP 200, trace, route decision, compliance audit, signed proof, and successful proof verification with no cloud-token spend. Next restore OpenRouter allowance evidence or select another paid provider with fresh quota evidence before authorising any non-local routed proof.

- 🔄 **Paid-Provider Cutover Diagnostics** — The production readiness audit now
  keeps the cutover gate fail-closed while exposing
  `cutover_gate.source_evidence.pre_cutover_candidates` when
  `MODEL_SOURCE_EVIDENCE` is supplied. This lets operators inspect disabled,
  non-deprecated, non-local chat models, see whether their source evidence is
  already supported, and review remaining blockers such as disabled provider,
  disabled model, exhausted billing posture, missing quota/allowance evidence,
  missing model-card timestamp, or missing reasoning cutoff posture before
  enabling a paid, aggregator, or subscription-backed route.

- 🔄 **Evidential Load And Claims Substantiation Harness** — The internal seed design has been moved into `internal/operations/evidential-load-harness-design-2026-05-31.md`, with the readiness framing in `internal/operations/enterprise-poc-readiness-plan-2026-05-31.md`. First implementation slices are complete: `scripts/build-dogfood-claims-evidence-pack.py` turns retained route proof and readiness captures into a tamper-evident claims pack; it now extracts signed route-evidence coverage for selected-versus-best utility, regret, candidate counts, and cost metrics without calling providers, and separates local-only readiness from paid-provider cutover readiness. `scripts/run-dogfood-evidential-workload.py` adds a repeatable local workload wrapper that drives bounded prompts through the existing route-capture path and packages the result; it now emits `workload-ledger.json` for observed token, route, quality, cost-metric, quota, regret, local-boundary posture, serial/concurrent execution mode, and optional baseline-cost evidence status. `target/dogfood-evidential-workload/workload-20260602-concurrency-01` is the latest passing concurrent live local workload pack; `target/dogfood-evidential-workload/workload-20260602-baseline-cost-01` remains the latest workload pack with a scenario baseline-cost delta. Next: collect provider-reported/account/invoice evidence before making authoritative monetary savings claims, and expand the concurrent workload profile only when customer or internal dogfood use exposes a concrete workflow gap.

- 🔄 **Development Workspace And Shadow Orchestration** — The canonical Mac workspace is `/Users/james/code`, and Shadow is cut over to the clean `/data/code-next` workspace. Codex CLI, Claude Code in API-key-only mode, Grok Build composer-2.5 with OAuth posture, and Kimi Code are available on Shadow. Next: use the documented handoff packets for bounded Grok/Kimi/Claude offload while Codex keeps final integration, preserve/apply/close the dirty Mac APCG branch handoff, keep a short burn-in before deleting the old Shadow tree, then run long-lived monitors and heavy verification from Shadow.

- ✅ **Industry Standard Evals** — Integrate established LLM evaluation benchmarks (MMLU, HumanEval, MT-Bench, AlpacaEval etc.) into the verification platform. Enables objective provider quality comparison, evidence for routing decisions, and regression detection. Banks need third-party-validated quality metrics, not just internal heuristics.

- 🔄 **Policy Ingestion Engine & Editing Tool** — Backend API coverage exists for source registration, fetch/upload, extraction, mapping, draft review, approval, and publication. The dashboard now opens as an operator ingestion queue with readiness posture, document/extraction/draft state, and next actions, and the source detail workflow exposes fetch, upload, extract, map, review, approve, and publish controls. Remaining work should be driven by buyer review or route audit evidence: richer guided editing, diff-assisted review, or APCG graph visualization only where it improves operator decisions.

- 🔄 **Policy Visualisation** — PR #613 delivered the first htmx slice on compliance detail: the APCG resolution review panel summarises argument counts, accepted/rejected/undecided status, attack relationships, and reviewer notes before the interactive graph; the parser now accepts current `arguments/attacks` and legacy graph shapes, and seeded bank data includes a real conflict path. Reference: `/home/james/apcg/frontend/src/views/` has ConflictResolutionView (692 lines, cascading precedence), FormalProofView (1032 lines, interactive SVG argumentation graph), ComplianceWorkspaceView (1220 lines). Remaining work is a richer conflict-resolution cascade or formal-proof viewer only if customer review shows argumentation explainability is still a buying blocker.

### 🔴 P0 — Router Workflow Certification

- ✅ **Certification Context Signing** — App endpoints can carry process context into router execution, compliance evidence, and signed proof traces without adding a hot-path control-plane database lookup.

- ✅ **Best-Execution Route Evidence** — Signed route-evidence summaries now include the selected route, best eligible route, selected-vs-best utility regret, regret reason, utility inputs, auction summary, fallback status, cost estimate, eligible candidates, request-capability exclusions, decision-rule exclusions, wiki-constraint exclusions, and provider execution failures. Trace detail and governed-activity detail now expose a buyer-visible best-execution review panel with selected-vs-best route, regret status, candidate set, scorer weights, candidate score inputs, cache contribution, and exclusion reasons. Evidence-package manifests add verifier-facing route-evidence coverage for candidate evidence, score inputs, exclusions, cache contribution, best-eligible evidence, selected/best match counts, regret totals, eligible/excluded candidate totals, and package-verification policy provenance.

- ✅ **Compliance Evidence Package, First Slices + Phase 6B Material** — `GET /api/v1/compliance/audit/export?format=package` emits a JSON package manifest with scoped population filters, audit records, and linked governed activities. Integrity material includes proof hashes, public-key fingerprints, optional inline signature verification, signed policy material, per-section hashes, and the package material hash. Indexes and flags cover route evidence, branch/eval/signoff activity records, external-orchestrator workflows, critic/judge stages, eval gates, aggregation stages, alert outputs, signoff controls, policy-source packs, source document hashes, extracted source-clause locations, reviewer/approver/effective-date metadata, record-to-policy-material references, and dependent exception-certificate links. Reviewer outputs include the package summary plus `format=package_html`, `format=package_pdf`, and the package-verification dashboard policy-provenance table from the same data. `scorpion-verify-proof` verifies full evidence packages offline, including embedded proof-bundle signatures, proof hashes, policy-material signatures, material hashes, policy-provenance manifest indexes, governed-activity manifest indexes, workflow-control flags, and public-key fingerprints. Durable exception certificates now include quorum status plus legacy embedded exception material, dashboard exception queues, requester/approver separation-of-duties checks, and configurable approval quorum.

- ✅ **Endpoint Publication Records** — API/database, dashboard create/review/publish workflow, endpoint-binding references, process publication hash metadata, endpoint publication records, compliance-detail process links, and package-level policy-pack provenance have shipped. Follow-up work should add richer publication audit views.

- ✅ **Governed Activity Register / Execution Graph Spine** — Backend read model, dashboard register, activity detail foundation, linked branch/eval/signoff records, dashboard branch/eval reviewer workbench, role-aware signoff actions, role-specific model-risk/compliance/platform/business/audit queues, compact `/api/v1/governed-activities/summary` role-queue and evidence-coverage posture, execution-graph ingest API, customer-facing orchestrator-run submit API, deterministic evidence receipts for orchestrator-run and execution-graph snapshots, signed candidate provenance, first-class exception certificate API, dashboard exception queue/detail pages, configurable approval quorum, evidence-package inclusion, the first customer-orchestrator dashboard workflow view, evidence-package workflow-control flags, scoped package-verification dashboard handoff, route-evidence package coverage, buyer-visible best-execution review, policy-pack provenance export, signed policy material, and package-verification policy-pack provenance review are implemented so audit, model risk, platform engineering, finance, compliance, and business owners share one evidence queue and investigation file. The detail page reads linked branch/eval rows and exposes reviewer-owner, confidence, source, freshness, retry, score, threshold, latency, failure, selected-vs-best route evidence, candidate score inputs, and exclusion reasons before raw JSON. The model is shaped around `RequestEnvelope`, `Intent`, `PolicyDecision`, `ContextBundle`, `ExecutionGraph`, `BranchResult`, `EvalResult`, `DecisionState`, and `AuditTrace`. The next major product slice should be targeted API-01/AXI-01 only where a real integration gap remains, renewal-window UAT recapture only if required by the checklist, or customer-driven APCG visualization.

### 🟡 P1 — Bank Product Support

- ✅ **FinOps Module** — Phase 1 complete (cost centers, spend API, budgets). Phase 2 complete (real-time budget enforcement). Phase 3 complete (margin CRUD + chargeback reports). FIN-SUB-01 adds persistence/API coverage for subscription-plan catalog, tenant assignment, and usage/overage posture. FIN-SUB-02 adds the dashboard billing workbench. FIN-SUB-03 adds subscription-period invoice evidence export with chargeback rows, deterministic package hash over canonical decimal-string material, and optional Ed25519 material signature.

- ✅ **CI/Review Operating Model Recovery** — Blacksmith has been removed from active workflows, the repositories have moved back to `jxwalker`, OpenScorpion trusted same-repo test jobs use Proxmox runner classes (`SCORPION_CI_RUNNER_RUST=scorpion-ci-rust`, `SCORPION_CI_RUNNER_LIGHT=scorpion-ci-light`), same-repo classifier/docs/gate jobs run on the light runner, fork PRs remain on GitHub-hosted runners, CD defaults away from the general PR runner, and PR #633 exercised CI plus CodeRabbit under the personal owner. Grok and Qodo are not automatic PR-review gates; use Grok from Shadow only for bounded developer-initiated critique, and keep automatic Qodo feedback disabled through `.pr_agent.toml`. If either is reintroduced in GitHub Actions, it must be manual or non-blocking so rate limits cannot fail required CI. Coverage and benchmarks stay opt-in/manual unless `SCORPION_ENABLE_MAIN_HEAVY_CI=true`.

- ✅ **CI Runtime Optimisation** — Docs-only PRs stay on the classifier plus `Docs-Only CI Bypass` path, with Rust, integration, security, Helm, and Python jobs skipped. PR #631 changed integration CI to version-check and reuse `sqlx-cli 0.8.6` instead of rebuilding it with `cargo install --force` on every run. PR #655 preserves `target/` on trusted self-hosted Rust jobs, resets tracked files, pre-cleans persistent workspaces before checkout, and keeps hosted/fork jobs clean. The current workflow adds `CI Required Gate` as the stable branch-protection target: docs-only changes require the bypass job, runtime code changes require Rust, integration, security, Helm, and Python success, catalog/source-evidence tooling changes can skip Integration while keeping the other checks, and aarch64 smoke is required only when release-sensitive files change. PR #690 parallelized the Rust graph; VM `113` adds the third Rust runner so Rust Fast Path, Integration, and release-sensitive aarch64 smoke can fan out together instead of queueing behind two Rust slots. PR #691 and the follow-up maintenance pass proved the three-runner baseline plus reboot-survivability for VMs `109`, `110`, `111`, and `113`. PR #709 shipped path-aware Integration skipping for narrow catalog/source-evidence tooling changes while keeping Rust, security, Helm, Python, APCG, and `CI Required Gate` intact. Do not add a second light runner until measured queueing shows VM `109` delaying `CI Required Gate`.

- ✅ **Control-Plane RAG Startup Hardening** — PR #558 moved the initial dashboard documentation RAG index build behind a background lifecycle task so control-plane listener binding is no longer blocked by ONNX embedding over the docs corpus. Regression coverage proves lifecycle startup returns before a slow initial index build completes. Shadow UAT was rebuilt from merged `main` at `1f61460e` and verified with control/router healthy in roughly two seconds without `SCORPION_MODEL_DIR` overrides. The latest full code PR path is PR #618, with Rust Fast Path at 7m48s, Release aarch64 Smoke at 11m40s, and Integration at 11m45s.

- ✅ **Node 24 GitHub Actions Maintenance** — CI, CD, and release workflows now pin Node 24-compatible JavaScript action majors for checkout, cache, artifacts, Python setup, Helm/kubectl setup, Docker image publishing, and release creation. Keep future workflow edits on Node 24-compatible action versions.

- ✅ **UAT Environment** — OpenScorpion UAT now runs on the designated Shadow VM against the shared PostgreSQL-backed UAT configuration. Keep concrete host, port, VM, LXC, and privileged-access details in the private operations inventory. `docs/operations/uat-runbook.md` defines the dedicated database/role setup, deployment procedure, acceptance criteria, and private-inventory fields. `scripts/capture-uat-evidence.sh` captures health checks, database posture, seed-script hashes, dashboard route-audit results, optional smoke-test output, checksums, service build matching, and a manifest. PR #606 added `EVIDENCE_DIR` support and fixed telemetry persistence for `InferenceCompleted` events. PR #622 added required control/router build-SHA matching. The current retained passing Shadow UAT evidence bundle is for commit `a78a760c` at `~/.openscorpion/evidence/uat-20260525T133319Z`, with clean repo state, matching service build SHAs, PostgreSQL UAT readiness, dashboard route audit 96/96, and smoke test 15/15.

- 🔄 **Dogfood Production Beta** — First persistent Proxmox VM deployment is live with control, two router containers, verifier, PostgreSQL, Grafana, Vector, and VictoriaMetrics managed by the dogfood Compose stack. The deployment record is `internal/operations/dogfood-production-2026-05-26.md`. The current stack runs `dogfood-f36dd341`; pre-upgrade backup/evidence is `target/dogfood-evidence/20260605T230705Z`, post-upgrade evidence is `target/dogfood-evidence/20260605T232138Z`, pre-placeholder-cleanup backup/evidence is `target/dogfood-evidence/20260605T233451Z`, final post-hardening evidence is `target/dogfood-evidence/20260605T234141Z`, current heuristic quality-mode evidence is `target/dogfood-model-assets/20260606T094437Z`, restore verification is `target/dogfood-restore-verification/20260606T095531Z`, and split-image build timing is `target/dogfood-build-timing/20260606T100914Z`. The stack now runs in production mode behind the private tailnet HTTPS edge (host name in the operator runbook); `/v1` reaches the router, health paths pass, and all published service ports except Tailscale HTTPS bind to `127.0.0.1`. The repository production Compose override now wires Redis into the control plane for OIDC state. `target/dogfood-auth-edge/post-port-hardening-production-mode` is blocked only by missing production auth configuration. The current targeted OpenRouter gate remains blocked because OpenRouter billing is exhausted and routing is disabled. Remaining gates: configure real OIDC/SAML or equivalent non-dev auth, restore paid-provider allowance evidence, capture an explicitly authorized low-token non-local routed proof, make `scripts/audit-dogfood-auth-edge.sh` pass, install ONNX model assets only if ONNX-backed quality scoring is required, keep restore verification current after new backup captures, and recapture split-image build timing only after release-path Dockerfile changes.

- ✅ **MLflow Autologging / Experiment Tracking Investigation** — Strategy whitepaper complete in `internal/whitepapers/2026-04-27_OpenScorpion_vs_MLflow_and_AI_Gateways.md`; ADR complete in `docs/architecture/AUTOLOGGER-ADR.md`. The native OpenScorpion autologger remains the evidence authority: AUT-01 adds the canonical run/decision/metric/artifact schema, redaction/hash helpers, and a deterministic JSONL sink. AUT-02 wires controlled verification pipelines into JSONL run lifecycle, aggregate metrics, and a hashed summary artifact. AUT-03 adds `scorpion-eval evidence-pack` to package completed autolog runs with a summary, manifest, copied records, referenced artifacts, and SHA-256 hashes. AUT-04 adds an optional `mlflow` feature and explicit `autolog_mlflow` config so Databricks/MLflow-heavy customers can mirror redacted run metadata, metrics, decision hashes, and artifact references to MLflow without changing the router hot path. AUT-05 adds native verification-store persistence for canonical run, decision, metric, and artifact records so controlled verification history is queryable by the verification API/dashboard while JSONL remains the portable evidence-pack source.

- ✅ **Documentation Canonical Map** — README and `docs/README.md` now point readers to maintained front doors instead of planning history. Canonical indexes exist for engineering, algorithms/maths, invention guides, and operations, with user, architecture, security, API, and verification docs linked from the same map. PR #619 added canonical facts, documentation style rules, whitepaper indexing, user-guide depth cleanup, wiki inventory fixes, and contributor-document alignment.

- ✅ **Contextual Reputation API/AXI Diagnostics** — `/api/v1/routing/reputation` is now part of the generated OpenAPI router, and `/api/v1/routing/reputation/summary` returns provider-domain learning health, confidence gaps, weakest/strongest contexts, stale context counts, and next-step hints without requiring clients to scrape dashboard tables.
- ✅ **Provider Fleet API/AXI Readiness Summary** — `/api/v1/providers/summary` returns tenant-scoped provider readiness across registry entries, enabled models, endpoint definitions, credential references, region coverage, persisted health checks, concrete attention items, and next-step hints without requiring clients to join raw provider tables.
- ✅ **Router Fleet API/AXI Readiness Summary** — `/api/v1/fleet/summary` is mounted through the generated OpenAPI router and returns router health, mTLS enabled/enrolled/certificate posture, release drift, platform diversity, bounded attention items, and next-step hints without requiring clients to join raw fleet inventory routes.
- ✅ **Fleet V2 API/AXI Readiness Summary** — `/api/v1/fleet-v2/summary` is mounted through the generated OpenAPI router and returns Fleet V2 tag taxonomy, group coverage, enrollment-token posture, router health, attention items, and next-step hints without requiring clients to join the Fleet V2 tables.
- ✅ **Audit Log API/AXI Posture Summary** — `/api/v1/audit-log/summary` is mounted through the generated OpenAPI router and returns administrative audit activity, runtime policy-violation posture, top categories, attention items, and next-step hints without requiring clients to join audit and policy-violation tables.
- ✅ **Role Catalog API/AXI Readiness Summary** — `/api/v1/roles/summary` is mounted through the generated OpenAPI router and returns RBAC role counts, organization/global scope coverage, permission assignment coverage, role hygiene attention items, and next-step hints. The `/api/v1/roles` route layer now matches the handler contract by accepting `role.view` with admin bypass.
- ✅ **User Administration API/AXI Readiness Summary** — `/api/v1/users/summary` is mounted through the generated OpenAPI router and returns tenant user posture, tenant-admin coverage, unassigned-user gaps, RBAC catalog coverage, latest users, attention items, and next-step hints without requiring clients to page through user and role lists.
- ✅ **Budget Management API/AXI Coverage** — `/api/v1/budgets` now exposes list/detail/create/update/enable/delete plus `/api/v1/budgets/summary`, with tenant-scoped utilization rollups, hard-limit posture, warning/breach counts, scope hints, explicit-null patch semantics, and OpenAPI documentation for FinOps automation.
- ✅ **Cost-Center API/AXI Readiness Summary** — `/api/v1/cost-centers/summary` exposes tenant-scoped FinOps attribution posture, assignment gaps, budget hygiene, current-month spend, top-spend rollups, attention items, and next-step hints without requiring clients to join raw cost-center and usage tables.
- ✅ **ML Training API/AXI Coverage** — `/api/v1/ml/training/jobs`, `/api/v1/ml/models`, `/api/v1/ml/training/data`, and related trigger/promote/export endpoints are now mounted through the generated OpenAPI router. Training-job lists, model-version lists, and training-data capacity responses expose compact summaries and next-step hints for dashboard and agent clients.
- ✅ **Reports API/AXI Coverage** — `/api/v1/reports/summary`, `/api/v1/reports/cost-trend`, `/api/v1/reports/latency-trend`, and `/api/v1/reports/quality-trend` are now mounted through the generated OpenAPI router with documented scope/date/granularity parameters and exact-decimal cost fields for reporting clients.
- ✅ **Quality Alerts API/AXI Coverage** — `/api/v1/quality-alerts/summary` now returns aggregate alert posture, 24-hour and 7-day counts, provider breach rollups, criticality, attention items, and next-step hints for quality operations.
- ✅ **Process Definition API/AXI Coverage** — `/api/v1/process-definitions/summary` now returns operating-model definition posture, publication/binding coverage, certification/evidence completeness, latest definitions, attention items, and next-step hints.
- ✅ **App Endpoint API/AXI Coverage** — `/api/v1/app-endpoints/summary` now returns runtime endpoint readiness, enabled/disabled posture, process-definition binding coverage, endpoint publication freshness, cost/rate/budget/region control coverage, latest endpoints, attention items, and next-step hints.
- ✅ **Governed Activity API/AXI Coverage** — `/api/v1/governed-activities/summary` now returns lifecycle posture, core evidence coverage, role-queue ownership, human-signoff gaps, policy-review counts, cost/latency rollups, and next-step hints without requiring clients to page through the activity register.
- ✅ **Circuit Breaker API/AXI Coverage** — `/api/v1/circuit-breakers` is now part of the generated OpenAPI router, and `/api/v1/circuit-breakers/summary` returns provider-resilience posture, open/half-open counts, recent success/failure totals, and operator next steps without requiring clients to parse dashboard rows.
- ✅ **MCP Tool-Server API/AXI Readiness** — MCP server management is now part of the generated OpenAPI router with `infra.view`/`infra.manage` RBAC. `/api/v1/mcp/summary` exposes registered server counts, healthy/unhealthy/unchecked posture, tool coverage, attention items, and next-step hints for agentic workflow readiness.
- ✅ **Monitoring API/AXI Readiness** — Monitoring SLO and alert-rule state is now part of the generated OpenAPI router with `infra.view` RBAC. `/api/v1/monitoring/summary`, `/api/v1/monitoring/slos`, and `/api/v1/monitoring/alert-rules` expose objective coverage, active/inactive alert posture, critical escalation coverage, notification-target hygiene, metric coverage, attention items, and next-step hints without requiring clients to scrape `/dashboard/monitoring`.
- ✅ **Tenant Administration API/AXI Readiness** — `/api/v1/tenants/summary` exposes organization-level tenant posture, user-assignment coverage, empty-tenant hygiene, latest tenant rows, attention items, and next-step hints without requiring org administrators or agents to page through tenant lists.
- ✅ **Trace Posture API/AXI Readiness** — `/api/v1/traces/summary` exposes trace status distribution, proof-bundle/signature coverage, auction coverage, provider/model cohorts, token/cost totals, attention items, and next-step hints without requiring operators or agents to page through trace rows.
- ✅ **Intent Compiler API/AXI Readiness** — `/api/v1/intents/summary`, compact compile-response metadata, OpenAPI coverage, and docs let dashboards, agents, and configuration tools discover deterministic compiler capabilities and review caveats before publishing generated decision rules.
- ✅ **Routing Governance API/AXI Readiness** — `/api/v1/routing/governance/summary` is mounted through the generated OpenAPI router and returns signal/rule/model-tag, selection-mode, bandit, safety-plugin, and quality-evaluation posture with attention items and next-step hints.

- ✅ **TypeScript/JavaScript SDK** — Node.js client with async iterators, streaming, proof bundle access. Banks want a client library, not curl.

- ✅ **Policy Authoring Wizard** — Covered by policy ingestion UI (PR #294) + source creation form (PR #297). Full lifecycle: create source → fetch/upload → extract → map → review → approve → publish + NL quick rule input.

### 🟢 P2 — Competitive Differentiation (Post-Demo)

- ✅ **MCP Server** — Expose OpenScorpion as an MCP tool server for agentic integrations
- 🔄 **M056: Enterprise Polish** — Dashboard accessibility audit, dark/light theme hardening, SLO benchmarks, and operating-surface polish. The dashboard now has template-copy guardrails that block retired hero/card-note first-viewport patterns and unsupported customer-facing pitch language, accessibility guardrails that require icon/action buttons to expose accessible names, and style guardrails that keep dark/light text tokens above the contrast floor. The latest browser audits captured overview, compliance, governed activities, exception certificates, FinOps, and verification replay evidence; they fixed the compliance violation-badge overlap, the verification page-header/card-first regression, and remaining inline styling in the app-endpoint create workflow plus settings cost-center form in PR #626. Keep this item open only for future SLO/browser-audit defects rather than broad visual redesign.
- ✅ **Dashboard Chatbot** (All 4 phases complete) — Design complete (M058-CONTEXT.md). Expert assistant with RAG over product docs (90 files, 26K lines), live data tools (10 read + 5 action), inline visualization (Chart.js, argumentation graphs, reputation curves), RBAC-scoped actions, dogfooding through own pipeline. 4-phase plan: RAG foundation → live data tools → visualization → actions.
- 🔄 **mTLS router↔control rollout verification** — Code, operator docs, an automated dual-listener release gate, fleet mTLS status reporting, router `/health` mTLS readiness fields, stale-certificate boot re-enrollment, local baseline/renewal evidence capture, and `scripts/capture-mtls-uat-evidence.sh` are present. PR #555 hardened the evidence script with preflight checks, run/operator manifest fields, deterministic checksums, bounded authenticated `/api/v1/fleet/summary` capture and validation, renewal comparison, optional dashboard screenshot capture, and optional archive generation. The real Shadow UAT fleet evidence bundle was captured on 2026-05-22; only UAT-specific renewal-window recapture remains if required by the deployment checklist.
- ✅ **WASM Plugin Sandboxing** — Already Beta/23 tests, deeper integration
- ✅ **ML Feedback Loop Scripts** — `fine-tune-quality-model.py` for custom judge model training

---

## APCG Reference Assets (`/home/james/apcg`)

The standalone APCG Python repo has frontend components worth porting:

| Component | Lines | What It Does |
|---|---|---|
| `PoliciesView.tsx` | 1795 | Monaco editor, version history, diff, rollout simulation, policy group management |
| `ConflictResolutionView.tsx` | 692 | Multi-regime conflict detection, cascading precedence (authority→specificity→recency→rule), argumentation graph |
| `FormalProofView.tsx` | 1032 | Interactive SVG argumentation graph (force-directed), argument status, evidence chain, proof bundle explorer |
| `ComplianceWorkspaceView.tsx` | 1220 | Unified compliance workspace with pipeline steps |
| `conflict_resolver.py` | 1100 | Backend: multi-source regime ingestion, pairwise+multi-party conflict detection, cascading precedence, 5 authority levels |
| `policy_compiler.py` | 418 | Backend: JSON→executable knowledge base compilation |

These are React/TypeScript — porting to htmx/Askama is non-trivial. Options: (a) port the logic to Rust + Askama templates with vanilla JS for interactivity, (b) embed a standalone React viewer as an iframe/micro-frontend, (c) build a simpler htmx version inspired by the layouts.

---

## Strategic Guidance (from competitive analysis)

**One-line positioning:** "Kong and Portkey are AI gateways. OpenScorpion is governed AI routing for regulated environments."

**The moat is:** governed routing, signed decision evidence, independently verifiable audit trails, multi-policy conflict handling, bank-ready controls and explainability.

**The mistake to avoid:** spending the next quarter trying to become a better generic gateway.

**Buyer qualification questions:**
- "Do you need to prove later why a request went to a given model or provider?"
- "Will risk or compliance need more than logs?"
- "Do provider, geography, or policy constraints affect routing decisions?"
- "If a regulator asks in six months, what evidence will you produce?"

### 🔴 P0 — Product Gaps (Post-Demo)

- ✅ **App Endpoints** — Named endpoint configurations with pre-baked routing rules. Each endpoint gets a unique URL (e.g. `/v1/trading-desk/chat/completions`) with pinned provider, model remapping, rate limits, budget, cost center, data residency, optional process/certification context, dashboard CRUD, publication records, router slug matching, and OpenAPI-documented management endpoints.
- ✅ **Model Catalog Readiness Summary** — `/api/v1/models/summary` now gives the dashboard and agents compact capability, pricing, context-window, health-probe, provider, model-family, filter-rule, attention, and next-action rollups for model-management follow-through.
- ✅ **Model Filter Readiness Summary** — `/api/v1/model-filters/summary` now gives the dashboard and agents compact routing-eligibility rule posture, active filter-preview impact, guardrail coverage, attention, next-action rollups, and model-view/model-manage permission alignment for filter operations.
- ✅ **User Administration Readiness Summary** — `/api/v1/users/summary` now gives dashboards and agents compact tenant user posture, tenant-admin coverage, role-assignment gaps, RBAC catalog gaps, latest-user rows, attention items, and next-step hints.
- ✅ **Policy Management Readiness Summary** — `/api/v1/policies/summary` now gives dashboards and agents compact tenant policy posture, active/inactive counts, executable-rule coverage, documentation gaps, latest policy rows, attention items, and next-step hints without requiring clients to page through the policy list.
- ✅ **Policy Library Readiness Summary** — `/api/v1/policy-library/summary` now gives dashboards and agents compact curated-template posture, tenant adoption coverage, metadata/rule completeness, attention items, next actions, and policy-library permission alignment.

- 📋 **Full UI Coverage** — Ensure every feature has dashboard management:
  - ✅ Provider API key management is now a provider-credential readiness surface: dashboard provider create/update paths register `provider/<uuid>` vault references, the vault page shows configured and missing provider keys, and operators can add, rotate, or revoke keys from the UI without inspecting raw database state
  - ✅ Model enable/disable and review actions are available in the dashboard and now have generated REST API coverage for automation clients
  - ✅ Model configuration for pricing, tier, priority, and capabilities is available in the dashboard and now has generated REST API coverage for automation clients
  - ✅ Chatbot provider/model selection from settings page
  - ✅ Reputation/domain scores viewer polish on top of the live contextual reputation API: `/dashboard/reputation` now uses the operating-surface pattern with command actions, real learning-health status, triage counts, strongest/weakest provider-domain queues, posterior intervals, evidence freshness, and row-level next actions
  - ✅ Config publishing now presents release-control state, current snapshot metadata, router acknowledgement, history, publish, and rollback in the first viewport
  - ✅ Cost center CRUD dashboard hardening on top of the existing cost-center API and seeded management page
  - ✅ Budget configuration now has generated REST API coverage for spending/token/request caps, hard-limit enforcement, utilization summaries, and enable/disable controls; cost-center monthly/daily budget fields remain managed from the cost-center dashboard

- ✅ **Eval Score Refresh** — `verification/datasets/published_scores.json` was refreshed for the then-current catalog. Treat it as seed evidence, not proof that those model IDs are still current or routable. Next eval work should refresh benchmark provenance and model-card alignment, not just identifiers.

---


---

## AXI-Informed Backlog Items

*Added April 2026 — sourced from https://axi.md/ (Agent eXperience Interface design research)*

### AXI-01 — Agent-ergonomic API response design
**Priority:** 🟡 P1 — Apply during Pilot / Post-Launch Polish API-01 annotation work
**Context:** AXI benchmarks show that compact, aggregate-first output with contextual next-step hints reduces agent token cost by 38–60% vs. verbose JSON. Our `/api/v1/` responses currently return full objects with no pre-computed aggregates and no contextual guidance.

**Apply AXI principles to:**
- List endpoints: include `count:` field, return 3–4 fields by default, add `?fields=` expansion. The generic cursor-page wrapper now supplies `count` and `has_more` for cursor-paginated list APIs.
- Compliance/trace detail: pre-compute summary fields (e.g. `verdict`, `semantics`, `violation_count`) rather than requiring agents to parse the full proof bundle
- Error responses: structured, to stdout-equivalent, with suggested next action (`hint:` field)
- Proof bundle API: first slice adds `/api/v1/compliance/audit/:id/summary` with verdict, violation count, proof status, graph counts, key arguments, and next links so agents do not need to parse the full ASPIC+ graph to get a compliance answer
- Exception certificate API: second slice adds an aggregate-first list summary with page count, filtered total, pending approvals, quorum gaps, expired certificates, high-materiality count, and next steps
- Fail-mode API: latest slice moves tenant fail-mode endpoints into the generated OpenAPI router and adds a typed `/fail-mode/summary` response with active override counts and next-step hints while preserving the legacy `/fail-mode` wire format
- Config admin API: latest slice documents config rollback/version and token issuance at the intended `/api/v1/config/*` and `/api/v1/auth/token` paths, adds typed response schemas, and keeps legacy `/api/v1/v1/*` aliases for compatibility
- Contextual reputation API: latest slice documents `/api/v1/routing/reputation` in OpenAPI and adds `/api/v1/routing/reputation/summary` so agents can inspect provider-domain learning health, confidence gaps, weak domains, and next actions without joining raw posterior rows.
- Budget management API: latest slice documents `/api/v1/budgets` in OpenAPI and adds `/api/v1/budgets/summary` so agents can inspect FinOps budget posture, warning/breach counts, and hard-limit coverage without scraping dashboard tables.
- Audit log API: latest slice documents `/api/v1/audit-log/summary` in OpenAPI and returns compact administrative audit posture, runtime policy-violation posture, top categories, attention items, and next steps without requiring agents to join raw audit tables.
- Role catalog API: latest slice documents `/api/v1/roles` and `/api/v1/roles/summary` in OpenAPI/API docs and returns compact RBAC catalog posture without requiring agents to parse the raw role list.
- Reports API: latest slice moves aggregate savings plus cost, latency, and quality trends into generated OpenAPI coverage, documenting report scope, date limits, aggregation grain, and exact-decimal accounting fields.

**Reference:** AXI Principle 2 (minimal default schemas), 4 (pre-computed aggregates), 9 (contextual disclosure)

---

### AXI-02 — `gh-axi` in dev workflow
**Priority:** 🟢 P2 — Dev ergonomics, not product
**Context:** `gh-axi` is a drop-in replacement for `gh` CLI that follows AXI principles. It returns aggregate counts, truncates large output, and appends contextual next-step hints. Our agentic dev sessions (PR creation, release management, issue triage) use `gh` extensively — switching to `gh-axi` reduces token overhead on those tasks.

**Action:** `npx -y gh-axi` — evaluate for one sprint, measure token savings vs. raw `gh`

---

### AXI-03 — MCP server design follows AXI principles
**Priority:** 🟡 P1 — Apply when MCP tools are designed (already in P2 backlog as "MCP Server")
**Context:** Our MCP server already exists (Beta). AXI research shows MCP schema overhead is 2.3× token cost vs. well-designed CLI (185K vs 79K tokens/task). When we extend the MCP server with Compliance, Regime, and Proof Verifier tools, apply:
- Combined operations: `compliance_check` should return verdict + top violations + proof hash in one call, not require 3 separate lookups
- Minimal schemas: default tool response = compact summary, `--full` flag for full proof bundle
- Contextual disclosure: append suggested follow-up tool calls in each response (`next_steps: ["verify_proof(id)", "export_audit(id, format=pdf)"]`)
- Avoid the MCP schema inflation trap: keep tool definitions lean, expose detail via optional parameters not separate tools

**Reference:** AXI Finding 3 (MCP Compressor validates CLI-over-MCP), Principle 1 (TOON format)

---

### AXI-04 — Standalone proof verifier binary ✅ COMPLETE
**Completed:** April 2026 (new crate `scorpion-verify-proof`, bundled in all Docker images)
**Priority:** 🟡 P1 — Natural Pilot / Post-Launch Polish addition, half-day of work
**Context:** The hard part is already done. `ProofBundler::verify_bundle()` in `scorpion-apcg` is fully offline — no network call needed. `POST /api/v1/compliance/audit/verify-bundle` and the dashboard proof verifier UI already wrap it. What's missing is a standalone binary for CI pipeline use.

**What exists:**
- `scorpion-apcg::ProofBundler::verify_bundle(&bundle) -> bool` — offline Ed25519 verification
- `POST /api/v1/compliance/audit/verify-bundle` — HTTP API (requires running control plane)
- `GET /.well-known/signing-key` — public key exposure for independent verification
- Dashboard proof verifier page — UI wrapper

**What's missing (~4h):**
Add `scorpion-verify-proof` as a standalone binary (thin wrapper, new crate or subcommand of scorpion-profiler):
```bash
# Usage
scorpion-verify-proof bundle.json       # exit 0 = valid, 1 = invalid, 2 = error
cat bundle.json | scorpion-verify-proof # stdin support
scorpion-verify-proof bundle.json --json # machine-readable output

# Output (AXI compact)
VALID | ed25519:abc123… | verdict:allow | policy:finreg-v2 | 3 rules
hint: scorpion-verify-proof bundle.json --full for complete argumentation graph
```
Ships in the release tarball. Banks drop it into CI — no dashboard, no network call.

**Reference:** AXI Principles 5 (definitive empty states), 6 (structured errors & exit codes), 8 (content first)

---

### AXI-05 — SBOM generation for release artifacts
**Status:** ✅ Complete
**Priority:** 🟢 P2 — Completed in product polish
**Context:** Software Bill of Materials is increasingly required for enterprise/government procurement. The release workflow previously had a `cargo cyclonedx` step that was removed when the CLI API changed. Re-add using the correct API.

**Result:** `.github/workflows/release.yml` now installs the current `cargo-cyclonedx`, generates per-crate CycloneDX JSON SBOMs with `--override-filename`, creates `SHA256SUMS.sbom`, and attaches the SBOM artifacts to GitHub Releases.
**Note:** Not AXI-specific but surfaced during the same release work

## M061 — eBPF Kernel-Level Tamper-Evident Compliance Evidence

**Queued:** April 7, 2026
**Priority:** 🟡 P1 — High-value differentiator, no blocking dependencies, builds on existing APCG proof bundle infrastructure
**Patent:** P-041 (filed, priority date secured)

### Vision

Deploy eBPF programs alongside the inference router to generate a second, kernel-layer compliance evidence trail that is architecturally isolated from the application. Because eBPF programs run in the kernel's verified sandbox, the application cannot alter what the kernel recorded — giving banks and regulators independently verifiable, tamper-proof evidence that does not require trusting the application that generated it.

This directly answers the hardest bank objection: "How do we know your compliance records weren't tampered with by your own software?"

### The Three Deliverables

**1. eBPF Observation Sidecar**
- Socket hooks: capture provider endpoint, byte counts, latency at the kernel layer
- Uprobes on the compiled router binary: extract tenant ID, model ID, compliance verdict without modifying source
- TC (traffic control) hooks: enforce provider allowlist + data residency at the egress network layer
- Ring buffer: one-directional kernel→userspace flow, app cannot write to it

**2. Kernel-Co-Located Signing Agent**
- Separate Rust process, isolated namespace, Ed25519 signing (consistent with P-001/P-004)
- Reads compliance records from ring buffer, signs each one
- Publishes to append-only tamper-evident log
- Key not accessible to inference router process

**3. Discrepancy Detection Service**
- Cross-references kernel-layer bundle vs application-layer proof bundle
- Detects mismatches: provider routing errors, timing anomalies, evidence suppression
- Issues verified compliance certificate or discrepancy alert
- New dashboard page: "Kernel Evidence" showing both trails side by side

### Why Now (or Soon)

- P-041 priority date is secured — implementation within 12 months strengthens the embodiment argument for non-provisional conversion
- Linux 5.8+ is now universal in enterprise on-prem (the target market)
- The Rust `aya` crate makes eBPF from Rust practical — no C required
- Single enterprise customer asking for "hardware-level" compliance assurance closes this immediately
- Complements regime convergence work (P-034–P-040) — kernel enforcement of data residency rules is defense-in-depth for the regime bridge

### Technical Approach

```
crates/scorpion-ebpf/          — new crate
  src/
    loader.rs                  — aya-based eBPF program loader
    programs/
      socket_hook.rs           — socket send/receive observation
      tc_egress.rs             — traffic control enforcement
      uprobe.rs                — binary function probes
    maps.rs                    — ring buffer + policy map management
    record.rs                  — structured compliance record type

crates/scorpion-signing-agent/ — new crate (separate process)
  src/
    main.rs                    — reads ring buffer, signs, publishes
    publisher.rs               — append-only log integration

crates/scorpion-router/src/pipeline/
  ebpf_guard.rs                — optional stage: verifies eBPF sidecar is running

wiki/normative/policies/
  ebpf-enforcement-policy.md  — policy wiki page for kernel enforcement rules
```

**Deployment:**
- Privileged init container loads eBPF programs (`CAP_BPF`, `CAP_PERFMON`)
- Signing agent sidecar container with HSM access
- Config sync: policy maps updated from ConfigSnapshot distribution (reuses existing mechanism)
- Kubernetes: `securityContext.capabilities.add: [BPF, PERFMON]` on init container

### Slices

| Slice | Title | Risk |
|-------|-------|------|
| S01 | eBPF sidecar crate + socket observation | High (new technology, aya/eBPF learning curve) |
| S02 | TC egress enforcement + policy map sync | Medium (builds on S01) |
| S03 | Uprobe integration for application metadata | High (binary probe stability) |
| S04 | Signing agent + append-only log | Low (reuses Ed25519 infrastructure) |
| S05 | Discrepancy detection + dashboard page | Low (straightforward comparison logic) |

### Dependencies

- Linux kernel 5.8+ on target deployment hosts
- `aya` crate (Rust eBPF framework): `aya = "0.13"`, `aya-ebpf = "0.1"`
- `CAP_BPF` and `CAP_PERFMON` Linux capabilities in deployment
- Existing Ed25519 signing infrastructure (P-001, P-004 — already in scorpion-apcg)
- Existing ConfigSnapshot distribution (already in scorpion-control/scorpion-router)

### Success Criteria

- A kernel-signed evidence bundle is generated for every inference request with zero application-layer changes
- A compromised/buggy inference router cannot suppress or alter the kernel-layer bundle
- Cross-reference discrepancy detection catches a fabricated application-layer compliance record in the integration test
- Provider allowlist enforcement at tc egress drops connections to non-approved endpoints regardless of application-layer routing decision
- Dashboard shows both evidence trails side by side for any trace

### Notes

- P-041 is concept-only (I=1 in scoring). Implementation here converts it to fully embodied, boosting the non-provisional conversion argument significantly.
- The signing agent architecture deliberately mirrors the existing ProofBundler (P-001) — same Ed25519, same bundle structure, different origin (kernel vs application). This means existing verification tooling works for both.
- Start with S01 only if there is a specific customer ask — the patent priority date is secured either way.

---

## Status Update — April 7, 2026

### Completed Since Last Update

All P0 bank demo items are done. Summary of what shipped:

**APCG Regime Convergence (P-034–P-040):**
- ✅ 32 regulatory wiki pages (16 regulators, 7 regulations, 6 domains, taxonomy, source registry)
- ✅ Regime bridge in Rust (regime_bridge.rs — P-034)
- ✅ Zero-I/O constraint distribution via ConfigSnapshot + ArcSwap (P-035)
- ✅ Selection-stage regime enforcement, cascading governance→selection (P-036)
- ✅ Policy knowledge graph + wiki compilation (P-037)
- ✅ Dual-layer normative/empirical compliance (P-038)
- ✅ Precedent system with 3 seed decisions (P-039)
- ✅ Trust domain compilation (P-040)
- ✅ Dashboard regimes page at /dashboard/regimes

**Demo Readiness:**
- ✅ Cost centers dashboard page (/dashboard/cost-centers) — was genuinely missing
- ✅ 500 inference traces + 20 quality alerts seeded into live DB (scripts/seed_demo_data.py)
- ✅ Docker rebuilt with all today's changes
- ✅ 19 fresh screenshots at 1440×900
- ✅ UI polish: warm blue palette, real typography scale, toast notifications
- ✅ Synthetic demo data generator (5K records, 12 models, 3 providers)

**Patent Portfolio (48 patents):**
- ✅ P-034–P-040: Wave 5 regime convergence patents, drawings, specs, DOCX
- ✅ P-041: eBPF kernel-level tamper-evident compliance evidence
- ✅ P-042–P-048: agentic marketplace governance addendum covering compliance-gated settlement, signal-conditioned wallet release, federated capability admission, portable reputation, bidirectional listing, pay-per-proof settlement, and two-stage auction clearing
- ✅ All drawing issues fixed (overlapping text, hardcoded values, crossing lines)
- ✅ Strategy v5.0: unified ranking, two prosecution families, umbrella provisional approach
- ✅ Counsel PDFs: instructions-to-counsel.pdf (226pp), patent-pack.pdf (370pp)
- ✅ Meeting agenda for April 7 counsel call (MEETING_AGENDA.md)

**Presentations:**
- ✅ v9 bank presentation (13 slides)
- ✅ v10 enterprise presentation (15 slides, banking/pharma/insurance/healthcare)
- ✅ Competitive analysis flyer (A4 PDF)
- ✅ Patent attorney briefing (10 slides)

### Remaining Open Items (genuine backlog)

- ✅ **FinOps subscription plans** — FIN-SUB-01 persistence/API and FIN-SUB-02 dashboard workbench are implemented; FIN-SUB-03 invoice/evidence export is active in the current slice
- ✅ **mTLS router↔control rollout verification** — Code, operator docs, an automated dual-listener release gate, fleet mTLS status reporting, router `/health` mTLS readiness fields, stale-certificate boot re-enrollment, local baseline/renewal evidence capture, hardened evidence capture, and real Shadow UAT fleet-summary plus screenshot archive evidence are present. Only UAT-specific renewal-window recapture remains if a deployment checklist requires environment-specific renewal proof.
- 📋 **M061: eBPF Kernel Evidence** — planned (M061-ROADMAP.md), start when customer asks or 12-month patent clock demands it
- 🔄 **APCG frontend ports** — PR #613 delivered the compliance-detail APCG resolution review as the first htmx slice; richer ConflictResolutionView/FormalProofView ports remain longer term and should be buyer-driven.

---

## M062 — Release Hardening ✅ COMPLETE

**Queued:** April 8, 2026
**Completed:** April 8, 2026 (PRs #369–#370)
**Priority:** 🔴 P0 — Must complete before v0.1.0 tag
**Full plan:** `docs/RELEASE-PLAN.md`

### Blockers to clear (in order)

1. **SEC-01** — Fix dynamic SQL concatenation in `compliance.rs` API
   - `crates/scorpion-control/src/routes/api/compliance.rs:182`
   - Replace `format!("...WHERE {where_clause}")` with `sqlx::QueryBuilder` or static multi-branch queries

2. **SEC-02** — `restart: unless-stopped` in production Docker config
   - `docker-compose.yml` all services: `restart: "no"` → `restart: unless-stopped`
   - Create `docker-compose.prod.yml` if it doesn't exist with production overrides

3. **REL-01** — Audit `unwrap()`/`expect()` in non-test pipeline code
   - 361 in router, 747 in control (includes test helpers in binary)
   - Convert non-test hot-path unwraps to `?` or graceful error handling

4. **OPS-01** — Add 404/500 error page templates
   - New: `crates/scorpion-dashboard/templates/error_404.html`
   - New: `crates/scorpion-dashboard/templates/error_500.html`
   - Wire into axum error handler in routes/mod.rs

5. **DEP-01** — Resolve `rustls-pemfile` advisory (RUSTSEC-2025-0134)

6. **OBS-01** — Add per-stage pipeline latency metrics
   - `metrics::histogram!("pipeline.stage.latency_ms", ...)` in executor
   - Provider selection outcomes, cache hit rate, budget enforcement events

7. **MAT-01** — Gate experimental dashboard surfaces with "Coming Soon"
   - Remote embedding API, LLM intent compiler, CyberArk vault

8. **DOC-01** — Update CHANGELOG with everything since M034

9. **DOC-02** — Update docs/RELEASE-CHECKLIST.md (test count, page count, date)

10. **I18N-01** — Fill WASM plugin strings in es/fr/de/ja locales

### After M062 → PR #370 also shipped
- REL-03: spawn_blocking for std::fs in async (tls.rs, config_poller.rs)
- OBS-02: db_pool_size config field wired through settings
- 29 PR bot comment sweep — date filter crash fix, metrics gaps, CSS selector drift, wiki ID mismatches

### After M062 → tag v0.1.0 → M063 Launch

## M063 — v0.1.0 Tag + Launch ✅ COMPLETE

**Completed:** April 8–9, 2026 (PRs #369–#388)

### Shipped

**Release hardening (M062, PRs #369–370)**
- SEC-01/02: dynamic SQL → QueryBuilder; Docker restart policies
- REL-01/03: unwrap audit; spawn_blocking for async fs I/O
- OPS-01: error_404/500 templates; DEP-01: RUSTSEC advisory documented
- OBS-01/02: per-stage metrics, db_pool_size config
- MAT-01, DOC-01/02, I18N-01: maturity, changelog, WASM translations

**Code optimizer audit (PRs #373–376)**
- Batch 1 (CRITICAL + security): .dockerignore, tx.commit, --seed removed, nginx SSE fix, provider timeouts configurable, ReDoS guards, safety scan cap, secret redaction
- Batch 2 (13 HIGH): N+1 batch/model/health/eval → UNNEST, dashboard 7-serial → tokio::join!, DashMap circuit breakers, signal pipeline cached, O(1) quota/JWT/provider/wiki maps
- Batch 3 (MEDIUM + build): AtomicU64, OnceLock clients, SipHash-2-4, release profile (LTO/strip), CI tool caching
- Final cleanup: Dockerfile single-binary, verify-store LIMIT 500, Postgres tuned, VictoriaMetrics retention

**Infrastructure fixes (PRs #371–384)**
- VictoriaMetrics/Vector healthcheck fixes (IPv6/localhost, 204 not a failure)
- Release workflow: SQLX cache, cross-compile workaround (binary builds best-effort), SBOM removed (CLI API changed), empty SHA256SUMS fix
- Stale PR bot comments swept (all 29 PRs #341–#369)

**scorpion-verify-proof (PRs #387–388)**
- New 16th crate: standalone offline proof bundle verifier
- Bundled in all Docker images at /usr/local/bin/scorpion-verify-proof
- Exit 0=valid, 1=invalid, 2=error; stdin, --json, --full flags
- docs/user-guide/proof-bundle-verification.md (410 lines)

**Docs + repo hygiene (PRs #371, #377, #385–386)**
- SQLX cache regenerated; 35 stale branches deleted
- Counts are current across AGENTS.md, docs/ROADMAP.md, STATE.md, PROJECT.md, README.md, and the patent review packet.
- AXI backlog items added from https://axi.md research
- AXI-04 (proof verifier CLI) marked complete

---

## Bank Product / Post-Launch Polish

This is the canonical name for the product-polish track. Any older release-planning references to `M064` in this file should be read as `Bank Product / Post-Launch Polish`; do not confuse that legacy shorthand with `.gsd/milestones/M064/`, which is the P-043 signal-conditioned wallet release patent-implementation roadmap.

**Priority:** 🟠 P1 — Do after the bank product demo/admin cleanup is merged
**Depends on:** working demo stack + first serious buyer/design-partner feedback

### Items

**Product readiness (do first):**
1. **Deployable bank stack** — Prove the released GHCR images can start from `ghcr.io/jxwalker/openscorpion/*:0.1.0`; configure `imagePullSecrets` for the private packages or make the packages public, then run smoke tests and run `scripts/dashboard-route-audit.py --base-url http://localhost:8090 --dev-login --delay-ms 500` against the seeded dashboard to confirm the 96 current dashboard route patterns in `scorpion-dashboard::dashboard_capabilities()` return successfully.
2. **mTLS router↔control rollout verification** — code, operator docs, an automated enrollment/mTLS access proof, fleet mTLS status reporting, router `/health` mTLS readiness fields, stale-certificate boot re-enrollment, local baseline/renewal evidence capture, authenticated fleet-summary capture, and a hardened evidence capture script are present; enable it in dev/UAT and archive the script output before marking the zero-trust rollout closed
3. ~~**Eval score refresh**~~ ✅ `published_scores.json` was refreshed for that release window. Re-check model-card and provider-inventory freshness before using those scores for current routing.

**API surface:**
4. **API-01 / AXI-01** — Continue bounded endpoint-group slices only for remaining high-value API gaps. `count`/`has_more` fields are now handled generically by cursor-paginated list responses, app-endpoint controls have moved into the generated OpenAPI router with their existing URLs and billing permissions preserved, contextual reputation has aggregate learning-health diagnostics, provider fleet readiness has a compact tenant-scoped summary endpoint, router fleet readiness has a compact mTLS/health/release summary endpoint, tenant administration exposes organization-level tenant posture and empty-tenant hygiene, trace posture exposes proof/auction/provider coverage, intent compiler exposes deterministic template capability and review caveats, model filters expose routing-eligibility readiness and active preview impact, policy library exposes curated-template and tenant-adoption readiness, ML training endpoints are covered by generated OpenAPI with compact job/model/capacity summaries, reports endpoints are covered by generated OpenAPI with documented scope/date/granularity semantics, cost centers expose attribution-readiness and current-month spend posture, circuit breakers expose provider-resilience posture, policy sources expose ingestion-readiness posture across sources, documents, extraction runs, import drafts, attention items, and next actions, and monitoring exposes SLO/alert-rule readiness plus escalation coverage. Governed-activity branch/eval review ergonomics are a dashboard workflow improvement, not another summary endpoint.
5. ~~**OpenAPI Swagger UI**~~ ✅ `/api/docs` serves the generated OpenAPI explorer; remaining API work is route/schema coverage, not Swagger wiring.

**Release artifacts:**
6. ~~**aarch64 binary builds**~~ ✅ `reqwest` and ORT download paths now use explicit rustls features, and CI runs a gated release-aarch64 smoke in a Linux 24.04 cross image with the C++ linker/sysroot required by the ORT aarch64 archive.
7. ~~**AXI-05 / SBOM**~~ ✅ Release workflow now emits per-crate CycloneDX JSON SBOMs with checksum material

**UX:**
8. ~~**Ollama base URL hint**~~ ✅ Provider form now shows `http://localhost:11434` without `/v1` and states that the adapter appends its own paths.
9. ~~**Trace status label**~~ ✅ Trace explorer and trace APIs derive status from durable event evidence: policy violations become `Policy block`, completed router events become `Success`, and partial evidence stubs become `Incomplete`.
10. ~~**REL-02**~~ ✅ Static asset cache-busting — dashboard shell, login, report partial, and chargeback assets carry a deployment asset version; `/static` is cacheable with immutable headers because release URLs change.
11. **UX-01** — Mobile responsive improvements across the dashboard template inventory; see `docs/CANONICAL-FACTS.md` for the current template count.

**Observability:**
12. **OTLP distributed tracing** ✅ COMPLETE — Router emits opt-in `opentelemetry-otlp` request and stage spans, with waterfall coverage across all seven enforced pipeline stages and lifecycle-step attributes for production latency diagnostics.

**FinOps:**
13. **FinOps subscription plans** — FIN-SUB-01 persistence/API and FIN-SUB-02 dashboard workbench are implemented; FIN-SUB-03 invoice/evidence export is active in the current slice

**AXI:**
14. **AXI-02** — Evaluate `gh-axi` (`npx -y gh-axi`) as drop-in `gh` replacement for one sprint; measure token savings
15. **AXI-03** — When extending MCP server tools: apply combined operations, minimal schemas, contextual next-step hints

### Deferred optimizer items (intentionally skipped)

Cold paths with negligible impact on inference latency:
- M9 (pg_trgm index + window-function pagination on audit log)
- M11 (JSONB expression index — needs migration)
- L10 (`[workspace.dependencies]` consolidation)
- L12 (cache-busting fingerprints)
- M2, M4, M6, M7, M15, M18, M19, M21, M23, M25 — reporting/cold paths

---

## M061 — eBPF Kernel-Level Tamper-Evident Compliance Evidence
