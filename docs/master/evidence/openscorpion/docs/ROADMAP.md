# OpenScorpion Roadmap

> Current delivery plan for the preproduction product. Detailed append-only task
> history remains in `.gsd/QUEUE.md`; canonical facts remain in
> [Canonical Facts](CANONICAL-FACTS.md).

- **Last updated:** 2026-10-09
- **Current baseline:** preproduction hardening after the v0.1.0 release
- **Active program:** shippable MVP (P0–P7), feature flags plus config
  layering, no fork and no v2 branch
- **Immediate objective:** use OpenScorpion locally as the primary governed
  inference router before broad customer rollout
- **Primary constraints:** no unbounded paid-provider testing, no stale model
  assumptions, no demo-only UX, no drift between roadmap, state, and user docs

## Current Priorities

OpenScorpion is not in a release-recap phase. The next work is product
readiness: route real local development traffic through the system, prove model
and quota freshness, and make the dashboard feel like an enterprise operating
application for regulated users. As of 2026-06-16 that work is sequenced by the
shippable MVP program below; the dogfood, model-management, UX, and evidence
tracks continue, but MVP phases take precedence when choosing the next
reviewable slice.

## Shippable MVP Program

An eight-phase shippable-MVP program (P0–P7) was approved on 2026-06-10 from an
external product review. The strategy is feature flags plus config layering:
no fork and no v2 branch. Advanced and research features stay in-tree and
tested, the `full` build remains the default build, a lean default surface
ships, and every reduced feature returns as an explicit roadmap item rather
than deleted code. Two follow-on phases, P8 (dogfood) and P9 (eval program),
extend the program to put the shipped MVP under real daily-driver coding
traffic and to score routing decisions on those workloads; both build on
shipped surfaces and are sequenced after P7.

| Phase | Status | Scope |
|---|---|---|
| P0 — Hygiene and licensing | Done (PR #795) | `internal/` and `legacy-docs/` extracted to the private sibling repos `openscorpion-internal` and `openscorpion-legacy-docs` and gitignored; root Business Source License 1.1 with parameters pending counsel; `scripts/package-release.sh` fails closed while LICENSE placeholders remain (`ALLOW_PLACEHOLDER_LICENSE=1` is an internal-only override); gated [History Rewrite Runbook](operations/history-rewrite-runbook.md) — do not execute until external git access is needed. |
| P1 — Standalone single-binary mode | Done (PR #796) | `scorpion-router --config-file <path>` boots with no control plane, Postgres, or Redis from a TOML/JSON snapshot with `${ENV_VAR}` interpolation, SIGHUP reload, ephemeral demo signing, and a `mint-dev-token` subcommand; ships `examples/standalone/demo.toml`, a required Standalone Smoke CI job, and standalone-mode operator docs. |
| P2 — 15-minute quickstart | Done (PR #799) | `Dockerfile.quickstart` bundling the router, `scorpion-verify-proof`, a mock provider, and demo config; `docs/QUICKSTART.md` rewritten around docker run, curl, offline proof verification, and a tamper-detection demo; a `--from-response` flag on `scorpion-verify-proof`; a quickstart-smoke CI job. |
| P3 — Cargo feature layer | Queued | Core versus full builds with router `default = ["full"]` and a bank build via `--no-default-features --features core,apcg`; feature gates for semantic, judge, bandits, auctions, eval-scoring, extended-providers, grpc, and wasm; breaks the forced engine-to-signals/ml dependency so ONNX leaves the core graph; CI feature matrix and a `scorpion-router-core` release artifact. |
| P4 — Dashboard profile | Done (PR #798) | `DashboardProfile` (`Default` with roughly 9 pages, `OperatorAdvanced` with all pages) masking `NavVisibility` multiplicatively; profile stored in the existing `system_configs` table with no migration; `require_profile` middleware returning 404 on gated route groups. |
| P5 — Runtime flags, bank-default profile, proof attestation | Queued | `docs/FLAGS.md` as the canonical flag catalogue; `config/profiles/bank-default.toml` with deterministic scoring, grounded APCG, circuit breakers on, and the rest off; bandit shadow mode that computes and logs without acting; `ProofTrace` gains `snapshot_version` and `governance_regime_hash`; per-stage `StagePolicy` timeout and fail-mode with `FailOpen` hard-rejected for guard and governance stages. Async proof signing is explicitly rejected for the MVP; signing stays pre-execution and fail-closed. |
| P6 — Bench harness | Queued | `scripts/bench/` with an `oha` versus passthrough baseline; per-stage budgets of Guard ≤50µs, Protection ≤200µs, APCG ≤300µs including signing, and Selection ≤100µs, with total p50 ≤1ms; `docs/benchmarks/METHODOLOGY.md`; TTFT measured separately. |
| P7 — Hardening and release gate | Queued | Convert roughly 18 non-test `unwrap`/`expect` sites in the router and APCG crates, then enforce `clippy::unwrap_used`/`clippy::expect_used`; README leads with the quickstart; FEATURE-MATURITY refresh and milestone archive. |
| P8 — Dogfood: proxy all real inferencing through the router | In progress (config and runbook shipped in #800; exit criterion not yet met) | Run `scorpion-router` standalone with REAL providers (Anthropic, OpenAI, local Ollama) and route the owner's daily coding-tool traffic — Claude Code, Codex CLI, generic OpenAI clients — through it, with governed routing and signed proof bundles captured on real traffic. Pure configuration: no code change. Ships `examples/standalone/dogfood.toml` (real-provider template, keys from env only) and `docs/operations/dogfood.md` (the runbook). Exit: Claude Code, Codex CLI, and a local model all served through the router for a full day with proofs captured. |
| P9 — Eval program | Queued | Build on the existing verification plane (`scorpion-verify-runner` replay harness, `verification/datasets/golden-prompts-v1.json`, the 6-layer quality eval, `ExternalLlmJudge`, autologger/evidence-pack). New work: an owner-specific coding golden set, capture-and-replay of real dogfood traffic, an LLM-judge rubric for a "good coding response", A/B comparison of routing policies, and regression gating. Exit: a repeatable eval run that scores routing decisions on real coding workloads and gates regressions. |

### CPU Baseline: AVX Required (ONNX Runtime)

**Status:** open; guarded. #823 (2026-09-20) shipped the install/start guard,
the docs and the report-only `scripts/ci/check-cpu-baseline.sh`; fix step 1
below (`ort` load-dynamic) is PR #824, open. **Belongs with P3** (the phase that takes ONNX out of the
core graph); until P3 lands this is documented and guarded, not fixed.

`scorpion-control` and `scorpion-router` abort with `SIGILL` before `main` on
any x86-64 CPU without plain AVX — not even `--version` prints. Diagnosed with gdb
and a qemu-user ISA bisect: a `vxorps` in a C++ global constructor of the
statically linked ONNX Runtime that `ort`'s `download-binaries` feature pulls
in through `crates/scorpion-signals` (`ml` feature, hard-wired by
`crates/scorpion-engine/Cargo.toml`). Everything above AVX is
runtime-dispatched, so the floor is exactly AVX: Sandy Bridge boots,
Nehalem/Westmere and `qemu64` do not. Proxmox/KVM's default guest CPU type
`x86-64-v2-AES` has no AVX, so a default VM cannot run the product at all.
`scorpion-verify-proof` does not link ORT and is unaffected.

Product fix, in this order:

1. Switch `ort` from `download-binaries` to `load-dynamic`, so the ONNX Runtime
   library is opened at the point of use rather than statically linked with its
   constructors running at process start.
2. Add a CPUID guard before the first `dlopen`, so a host without the required
   features degrades to signals that do not need ORT instead of dying.
3. Feature-gate the signals ML dependency in the engine — today
   `crates/scorpion-engine/Cargo.toml` depends on `scorpion-signals` with
   `features = ["ml"]` unconditionally, so no build of the router or control
   plane can opt out.

`-C target-cpu` cannot fix this: the offending code is in a prebuilt library.
Neither can a static scan of the binary — it contains roughly half a million
legitimate runtime-dispatched VEX instructions, so "contains AVX opcodes" is
not the same claim as "executes AVX unconditionally".

Until it is fixed:

- [Quickstart](QUICKSTART.md) and the [Installation Guide](install.md) state
  the requirement and the Proxmox/KVM fix.
- `scripts/install.sh` and `scripts/start.sh` refuse to start on a CPU without
  AVX, with a one-line message naming the fix.
- `scripts/ci/check-cpu-baseline.sh` runs each shipped binary under
  `qemu-x86_64 -cpu Nehalem`, with a flag that binary returns from, and reports
  which ones take signal 4 (and which fail to probe cleanly at all). It is
  report-only by default — today's binaries fail it — and enforces on
  `SCORPION_CPU_BASELINE_CHECK=1`. Flipping that flag to `1` in CI is the
  acceptance test for this item.

## Demo Readiness (September 2026)

Merged between 2026-09-19 and 2026-10-09 so that every demo claim is asserted
by a test or by the demo script itself:

| PR | What it made true |
|---|---|
| #803 | Best execution on live traffic: Pareto filter before utility weighting; bandit exploration on shadow and evaluation traffic only |
| #805 | Demo beats 1, 2, 4 and 5 asserted in CI on the quickstart image |
| #809 | Human approval holds (`require_human_approval`): hold before dispatch, separation of duties, release once |
| #826 | Zero-trust demo (`scripts/demo-zero-trust.sh`): identity, DLP, jailbreak, policy deny and offline verification, each checked against the mock provider's hit counter |
| #827 | Mid-stream provider errors are signalled instead of a clean `[DONE]` |
| #830 | Proof bundles carry the exact signed bytes (`signed_trace`) |
| #831 | All five beats in one command (`scripts/demo-five-beats.sh`) and the beat-3 Integration test |
| #833 | PII `mask` redacts user messages before dispatch |
| #836 | Third-party images, rustup-init and the actions runner pinned by digest |
| #838, #841 | Evaluator docs corrected; CI checks every relative link and anchor in README, docs and wiki |
| #839 | Multi-argument proof-bundle smoke test |
| #840 | Routing governance writes require a permission, not just a login |
| #819, #821, #822, #832 | Evaluation-host deploy |
| #851 | Token revocation wired into default builds; control-plane bearer auth through `JwtIssuer::verify`; SAML refused in production until assertions are signature-checked; tenant RLS settings transaction-scoped |
| #828 | PII masking gaps left after #833 closed |
| #854 | Dashboard policy **Edit → Save** and provider **Test connection** routed; one denial no longer stops telemetry persisting |
| #855 | Recorded 3D demo video; live PII redaction beat in the zero-trust demo |
| #862 | API token issuance confined to the caller's organization and permissions |
| #865 | wasmtime 48.0.3 for RUSTSEC-2026-0315 and RUSTSEC-2026-0316 (plugin fuel accounting) |
| #837, #850, #853 | Policy changes reach routers: policy API and dashboard create, toggle and delete republish the snapshot; deleted policies stay out of snapshots; an import draft's policy is committed before the republish |
| apcg-verifier #57 | `apcg-verify router-bundle` accepts `signed_trace` when it is byte-identical to the rebuilt trace |

Rehearsed on `5e32ad9` (2026-09-30): `scripts/demo-zero-trust.sh` passed all
eight beats, and `apcg-verify router-bundle` (apcg-verifier `adeefcf`) returned
`VALID` for the run's allow and deny bundles and `INVALID` at `signature` for
the tampered one.

Still open before the technical walkthrough (see
[Technical Walkthrough](demo/technical-walkthrough.md)):

- `scripts/demo.sh` with an LLM on a port other than 8081: PR #820 (conflicts
  with `main`; needs a rebase onto #826).
- `scripts/demo-five-beats.sh` has not been rehearsed on the presented commit.
  Its images download ONNX Runtime from `cdn.pyke.io` at build time, so build
  them on a host that can reach it, or use `FIVE_BEATS_IMAGE_TAG=<release>`.
- The evaluation release set in apcg-platform (`2026-09-27-eval-candidate-5`)
  pins this repository at `40e5032`, apcg-verifier before #57 and apcg-ui
  before #247. Re-pin to the commit that carries #853, then tag.
- The evaluation host needs a guest CPU with AVX (see
  [CPU baseline](#cpu-baseline-avx-required-onnx-runtime) above) before it can run this release.

## Priority Path

### Internal Production Dogfood

1. Keep production-beta local-only until paid-provider allowance evidence is
   restored and the cutover gate passes.
2. Finish provider/model freshness for the providers we actually intend to use:
   local Ollama, OpenRouter or another aggregator, Kimi, Grok/xAI, Gemini,
   Perplexity, and any API-key providers with reliable billing or quota APIs.
3. Keep workload evidence realistic by recording whether captures are serial or
   concurrent, and attach retained scenario or provider-reported
   alternative-cost evidence before using monetary savings claims.
4. Put the dogfood service behind an audited HTTPS edge and non-dev
   authentication.
5. Route a narrow class of real development prompts through OpenScorpion and
   retain signed route, compliance, quota, cost, quality, and proof evidence.
6. Add a developer-agent gateway track so OpenScorpion can compete with
   lightweight token optimizers while preserving governance: one-command local
   install, Claude Code/Codex bootstrap, compatible-gateway setup for other
   agents, existing-plan/provider optimization, unchanged prompting,
   per-request model and reasoning-depth routing, reversible enable/disable,
   route-up for hard work, measured low-latency overhead, and signed evidence
   for every optimization decision.

### Tier 1 Bank Demo Readiness

1. Recapture screenshots from the current production-beta dashboard, not stale
   standalone decks.
2. Run `scripts/dashboard-route-audit.py` and `scripts/capture-screenshots.js`
   against the authenticated dashboard to produce the route audit and
   screenshot manifest.
3. Convert findings into workflow-group PRs: FinOps controls, remaining
   ops/quality pages, security/admin, and integration surfaces.
4. Keep the product narrative evidence-backed: governed best execution,
   quota-safe failover, local/sovereign routing, model freshness, signed proof,
   and cost control without unsupported savings figures.

## Next Reviewable Sequence

The shippable MVP phases above are the priority track: land the open MVP phase
before starting a new slice from this sequence. The items below remain planned
work and continue in parallel only where they do not conflict with an open MVP
gate. Within this sequence, finish the work in this order. Do not start a broad
rewrite while an earlier gate is still open.

1. Fix production dashboard data integrity in Overview, Provider Management,
   and FinOps so active-provider counts, enabled-model counts, provider
   readiness, trace activity, billing-ledger posture, and savings claims match
   the current production-beta evidence. The dashboard-trust slices make
   provider and model queues sort operator-ready rows first, label
   seed-placeholder config hashes as unverified, and keep Overview route
   distribution tied to historical trace evidence rather than current provider
   enablement. The Overview fleet KPI now uses the same route-gate posture as
   Provider Management, so stale, drained, missing-auth, missing-credential,
   missing-contract, and missing-allowance providers do not inflate the
   routable provider/model count. Provider Management readiness counts now
   exclude non-local rows that are missing chat endpoint contracts, explicit
   auth, credential registration, measurable allowance evidence, or fresh
   billing posture. FinOps savings are now hidden unless every current-month
   billing-ledger row in scope carries retained baseline-cost evidence; local
   trace/workload activity without ledger rows is shown as an operator
   ledger-capture action, not spend. Provider Management now promotes stale,
   unknown, drained, and incomplete account posture into an account-posture
   queue above the registry.
2. Finish access-mode and quota posture controls for API-key,
   OAuth/subscription, aggregator, and local providers. The provider summary API
   and dashboard now expose access-mode coverage, quota posture, route-away,
   stale, low-confidence, and OAuth allowance gaps; the non-spending cutover
   audit now requires routing enabled and future reset-window evidence for
   OAuth/subscription routes. OpenRouter has per-key limit collection and
   account-credit collection where the key has management access; the current
   quota work preserves fresh manual/OAuth allowance posture during refresh.
3. Add current model-card, pricing, retirement, request-contract, context-window,
   and knowledge-cutoff collectors only from authoritative provider sources or
   account APIs; provider `/models` remains inventory evidence only. Paid,
   aggregator, and subscription cutover source reports now have a default
   24-hour freshness window, so stale source files cannot authorize a route.
   The static OpenAI catalog now tracks the official GPT-5.5/GPT-5.4 family
   and keeps older GPT-5.2, GPT-5.1, GPT-5, GPT-5 mini/nano, and o4-mini IDs in
   retired guardrails instead of first-class routing candidates. Current
   cutover diagnostics now expose per-provider/model source posture for
   model-card, request-contract, and retirement evidence so operators can see
   whether a candidate is blocked by missing references, stale fetched pages, or
   an unmentioned model ID before changing provider rows. Strict cutover source
   collection now also promotes pricing-page model misses to blockers, so a
   provider/model pair cannot pass on a generic or stale price page. The
   downstream paid-provider cutover evaluator now requires pricing evidence for
   the selected pair instead of relying on collector invocation alone. Catalog
   models can now require exact model-card source tokens for context-window or
   knowledge-cutoff evidence.
4. Delegate the current production-beta UX packet to Claude Code with GSD or
   GSD auto, Grok Build Composer 2.5, and Kimi, then convert findings into a
   small workflow-group PR. The current packet,
   `target/ux-audit/20260605T-current-james-walker-shadow-critique`, combines
   the 98/98 route audit from
   `target/ux-audit/20260605T161915Z-mac-post-capture-hardening` with the
   22/22 authenticated screenshot recapture from
   `target/ux-audit/20260605T164449Z-config-owner-fix`, which verifies Config
   Publishing snapshot v43 is owned by `James Walker`. The capture harness now
   writes partial screenshot manifests incrementally, so future interrupted
   runs preserve truthful packet metadata. Shadow was recovered enough to
   complete a bounded read-only Claude Code Sonnet review on 2026-06-05; the
   tracked summary is
   [Production-Beta UX Critique](design/PRODUCTION-BETA-UX-CRITIQUE-2026-06-05.md).
   The current implementation slice addresses missing JWT remediation,
   unassigned-provider warnings, zero-tagged-model blocking states, and real
   Config Publishing snapshot hash computation. Local operator login now
   requires explicit non-production opt-in, and `/auth/readiness` plus
   `scripts/audit-dogfood-auth-edge.sh` provide a non-mutating gate for the
   remaining dogfood SSO/ingress rollout. Quality Alerts now separates no trace
   telemetry from zero quality breaches in first-viewport posture, and Policy
   Sources now exposes row-level fetch/upload actions for missing controlled
   source text. Monitoring SLO rows now show current measurement, source,
   sample count, units, and pass/breach/measurement-needed posture. Credential
   Vault rows now show missing, unmatched, and configured-but-untested
   credential posture with add, bind-provider, and provider-test next actions.
   Billing Admin and Chargeback now label live usage-ledger versus registry-only
   provenance so missing billing data does not render as zero spend. Provider
   Management now surfaces provider audit naming posture so operator-local
   labels, internal notes, and private endpoints are reviewed before evidence
   export.
5. Add the developer-agent gateway/token-optimizer path. The competitive
   baseline from NerfGuard, inspected on 2026-06-06, is a local coding-agent
   gateway that markets up to 3x Claude Code usage for the same spend by
   routing supported coding-agent requests to the right model and reasoning
   depth. It includes a `curl | bash` style Mac/Linux installer, shell
   auto-configuration, automatic Claude Code CLI and Codex CLI/Desktop setup,
   manual setup for any compatible model gateway, existing-plan/provider
   optimization, no prompt changes, per-request model and reasoning-depth
   selection, route-up behavior for hard tasks, reversible `enable` and
   `disable` commands, no separate inference vendor requirement, free pricing,
   and a roughly 250 ms local-overhead target. OpenScorpion should implement
   the same developer-visible capability set with governance additions:
   explicit app-endpoint profiles for coding harnesses, auditable optimization
   policy, quota and allowance floors, model-freshness gates, prompt/response
   privacy controls, signed route and optimization evidence, and enterprise
   controls for teams using subscriptions or API keys.
6. Keep the retained local route proof, concurrent workload pack, and
   scenario-baseline workload pack current; capture one explicitly authorized,
   low-token non-local route proof only after the paid/subscription cutover
   gate passes.

### 1. Local Inference Router Dogfood

Goal: run normal development inference traffic through OpenScorpion with
governance, cost, quota, model-freshness, and proof evidence enabled.

Work:

- Keep the Proxmox dogfood deployment treated as production, not demo.
- Keep local Ollama capacity routable where model-card evidence is fresh enough.
- Keep cloud, aggregator, and subscription-backed providers disabled until they
  pass the non-spending paid-provider cutover gate.
- Authorise exactly one bounded low-token non-local route only after billing,
  quota, model-card, pricing, region, and request-contract evidence is current.
- Put the stack behind an audited HTTPS edge and non-dev authentication before
  using it for broader traffic. The current Tailscale Serve edge is acceptable
  if the auth/edge audit passes.
- Retain a passing `scripts/audit-dogfood-auth-edge.sh` evidence bundle before
  declaring the dogfood stack ready for normal development traffic.
- Capture a signed trace, compliance decision, route decision, cost ledger row,
  and proof verification for each cutover step.

Exit criteria:

- `scripts/audit-dogfood-routing-readiness.sh` passes with no blockers.
- `scripts/audit-dogfood-provider-inventory.sh --no-fail` produces the
  provider/model cleanup evidence bundle under `target/dogfood-provider-inventory/`.
- The same audit passes with `--require-paid-provider` for one deliberately
  selected non-local provider/model pair.
- A local-only route proof and one explicitly authorized low-token non-local
  proof are retained as evidence.
- The auth/edge audit passes with an HTTPS edge, no public control-plane host
  port exposure, blocked local operator login, and production non-dev auth
  readiness.
- The router can be used from normal development tools without bypassing
  quota, policy, or proof generation.

### 2. Model Management And Provider Access

Goal: make OpenScorpion first class at provider/model onboarding, model
freshness, OAuth/subscription posture, API-key posture, request headers, and
quota-aware failover.

Work:

- Treat provider `/models` endpoints as inventory only, not approval or model
  card truth.
- Refresh model cards, pricing, retirement status, request-parameter contracts,
  context windows, and knowledge-cutoff metadata from authoritative sources.
- Keep current OpenAI static routes limited to GPT-5.5, GPT-5.4, GPT-5.4 mini,
  and GPT-5.4 nano until the official model-card evidence changes again.
- Keep retired and compatibility-only model identifiers visible for audit but
  excluded from best-execution routing.
- Keep newly discovered or review-pending model rows excluded from
  routing-ready and best-execution posture until an operator explicitly clears
  the review gate.
- Separate API-key, OAuth/subscription, aggregator, and local access modes in
  both the database and UI.
- Support provider-specific header and request-shape profiles for OpenAI-
  compatible APIs, including coding-harness-style providers that require custom
  headers.
- Keep header overrides explicit and auditable: header names, non-secret
  constants, purpose, provider scope, and last successful contract proof are
  visible; secret values stay as vault references; providers whose terms or
  harnesses do not permit direct programmatic routing remain non-routable.
- Drain or penalise providers before configured quota thresholds, with 95% as
  the default failover guardrail unless the provider profile overrides it.
- Combine per-key and account-level quota posture where the provider exposes
  both; for example, OpenRouter key limits remain the per-key control while
  account credits provide an additional fail-closed balance signal.
- Add model-management UI that distinguishes everyday operations from expert
  configuration.

Reference:

- [Model Management Operating Model](architecture/MODEL-MANAGEMENT-OPERATING-MODEL.md)
- [Model Lifecycle And Freshness](architecture/MODEL-LIFECYCLE.md)
- [Provider Billing And Quota Telemetry](architecture/PROVIDER-BILLING-TELEMETRY.md)
- [Provider Onboarding Guide](operations/provider-onboarding.md)

Exit criteria:

- Operators can see why every enabled provider/model is routable or excluded.
- OAuth/subscription providers cannot be treated as unlimited without measurable
  allowance and reset-window evidence.
- Provider-specific headers can be configured, inspected, tested, and included
  in cutover readiness evidence without exposing secrets.
- Static catalog changes fail local audit if they contain stale, duplicate,
  unverified, or retired routing candidates.

### 3. Developer Agent Gateway And Token Optimizer

Goal: make OpenScorpion the governed router for coding assistants and internal
developer-agent traffic, matching lightweight optimizer ergonomics while adding
bank-grade policy, quota, model freshness, and proof evidence.

Competitive feature baseline from NerfGuard:

- Public positioning as an agent token optimizer that increases usable Claude
  Code volume for the same spend by avoiding excess intelligence on simple
  requests.
- One-command local install/bootstrap for Mac and Linux developer machines,
  including a copyable `curl -fsSL ... | bash` install command.
- Clear runtime support posture per OS; do not imply Linux runtime parity until
  the gateway daemon and installer have passing Linux evidence.
- Local gateway for coding-agent traffic, with shell configuration that routes
  supported clients through the gateway.
- Automatic setup for Claude Code CLI, Codex CLI, and Codex Desktop through the
  gateway CLI, including reversible client configuration patching and restore.
- Explicit support posture for "any other" modern coding agent through manual
  setup instructions when the tool can target a compatible model gateway.
- Manual compatible-gateway setup for any coding assistant that can target an
  OpenAI-compatible or model-gateway endpoint.
- Use existing subscriptions, OAuth sessions, API keys, local models, or
  aggregator accounts rather than forcing a new provider.
- Avoid forcing operators to evaluate new models before benefit is possible;
  optimize the models and inference providers they already pay for first.
- Avoid a separate optimizer tax for internal dogfood and document any later
  enterprise packaging decision separately from technical routing readiness.
  NerfGuard advertises the public optimizer as free; OpenScorpion should treat
  price packaging as separate from internal routing readiness.
- Keep user prompting unchanged; classify and optimize behind the agent client.
- Select the right provider, model, request shape, and reasoning depth per
  request.
- Route up to the strongest approved model when the task requires high
  judgment instead of always downshifting to cheaper models.
- Provide reversible `enable`/`disable` style controls, a `status` or `doctor`
  command, and clear uninstall/restore behavior.
- Keep the gateway usable for subscription, OAuth, API-key, aggregator, and
  local-provider access modes without treating any access mode as unlimited.
- Keep added gateway latency bounded and measured; target low hundreds of
  milliseconds for local routing overhead, with SLO evidence rather than a
  marketing-only claim.
- Treat "more usage for the same spend" as an evidence-backed claim only after
  retained workload captures prove token, quality, latency, and route-up/down
  behavior for the same prompt set.

Parity implementation backlog:

- `install`: signed Mac/Linux installer, checksum verification, supported-shell
  detection, and clear dry-run output before writing local config.
- `configure`: automatic, reversible Claude Code CLI, Codex CLI, and Codex
  Desktop profile setup, plus manual instructions for other compatible coding
  agents.
- `enable`/`disable`: idempotent commands that patch and restore shell/client
  state without losing the user's original configuration.
- `status`/`doctor`: local diagnostics for active gateway URL, agent profile
  binding, auth mode, quota posture, model-card freshness, and last successful
  optimization proof, without printing secrets.
- `optimize`: per-request selection of model, provider, request contract,
  reasoning depth, and route-up/down behavior against the existing paid plan,
  OAuth session, API key, aggregator, or local model access mode.
- `measure`: retained evidence for local overhead, token reduction,
  route-quality retention, route-up correctness, and same-spend usage claims.
- `fleet`: team rollout inventory, gateway version drift detection, emergency
  disable, and proof that managed developer machines are on approved builds.

Additional coding-tool proxy baselines:

- CLIProxyAPI++ provides a broad compatibility target: OpenAI-compatible
  surfaces across heterogeneous providers, provider-aware request/response
  translation, unified auth handling for API keys and OAuth-backed accounts,
  operational CLI diagnostics, management APIs, quotas, TLS, per-credential
  proxy settings, streaming keep-alives, retry controls, and usage statistics.
- Its config surface shows several compatibility features OpenScorpion should
  make explicit before claiming "any model with any coding tool": model
  prefixes, wildcard model exclusions, per-provider aliases, forked aliases,
  alias pools with round-robin/failover, protocol-scoped payload
  default/override/filter transforms, OpenAI Chat/Completions/Responses
  compatibility, Codex-specific headers, Claude Code header cloaking, and
  WebSocket authentication where a client needs it.
- VibeProxy adds the local user experience expected by vibe-coding users:
  native macOS menu-bar server management, one-click OAuth/account connection,
  real-time auth-file detection, automatic token management, multi-account
  provider support with round-robin and rate-limit failover, provider priority
  toggles with hot reload, self-contained app packaging, code signing,
  notarization, and automatic app updates.
- VibeProxy's tool guides show that compatibility is not only a model endpoint;
  it also requires concrete profile writers for Factory Droids, Amp CLI, and
  similar tools that expect custom model lists, dummy local API keys, local
  base URLs, provider-specific paths, direct management redirects, or
  Anthropic/OpenAI/Gemini protocol labels.
- Subscription-backed provider coverage should be tracked separately from API
  key coverage. The observed proxy ecosystem treats Claude Code, Codex/ChatGPT,
  Gemini, Kimi, Qwen, Antigravity, GitHub Copilot, Kiro/Kilocode-style coding
  providers, Z.AI GLM, OpenRouter, Vertex/AI Studio, and arbitrary
  OpenAI-compatible providers as independent auth/profile targets.
- Direct OAuth token replay and account-cookie reuse must remain explicitly
  governed. Where a sanctioned gateway exists, such as Vercel AI Gateway for
  Claude subscription access, OpenScorpion should model it as a provider
  access path with terms, billing, quota, and source-evidence controls instead
  of treating direct OAuth scraping as the default enterprise route.
- The local gateway should expose a management surface for effective config,
  auth-file posture, enabled/disabled provider state, request logs, usage,
  quota fallback toggles, debug status, and last-route diagnostics. It must be
  localhost-only by default, protected when remotely exposed, and redacted by
  construction.
- A first-class "tool profile" layer should separate client compatibility from
  provider selection: Claude Code, Codex CLI/Desktop, Cursor, Grok Build, Kimi
  Code, Factory Droids, Amp CLI, Roo Code, generic OpenAI clients, generic
  Anthropic clients, generic Gemini clients, and future coding harnesses each
  need config writers, protocol transforms, model naming rules, and rollback
  evidence.

OpenScorpion additions:

- Agent endpoint profiles for Claude Code, Codex, Grok Build, Kimi, Cursor, and
  other coding harnesses, including required headers, request transforms,
  response transforms, and subscription/API-key access mode.
- Extend agent endpoint profiles into tool profiles that can write and restore
  client-specific configuration for Factory Droids, Amp CLI, Roo Code, generic
  OpenAI-compatible clients, Anthropic-compatible clients, Gemini-compatible
  clients, and other vibe-coding tools that can target a local gateway.
- Add local gateway protocol adapters for OpenAI Chat Completions, OpenAI
  Responses, Anthropic Messages, Gemini, Codex, Amp-style provider paths, and
  streaming/non-streaming parity before claiming universal coding-tool support.
- Add provider/account adapters for Claude Code subscription/API access,
  Codex/ChatGPT subscription or API access, Gemini/Vertex/AI Studio,
  Antigravity, Kimi, Qwen, GitHub Copilot, Kiro/Kilocode-style OAuth coding
  providers, Z.AI GLM, OpenRouter, and arbitrary OpenAI-compatible providers,
  each with source, terms, quota, billing, and model-freshness posture.
- Add model-alias and payload-transform policy: prefixes, wildcard exclusions,
  forked aliases, alias pools, reasoning/thinking suffixes, protocol-scoped
  request defaults, overrides, filters, and response normalization, with every
  transform visible in optimization proof.
- Add multi-account provider support with per-account health, quota,
  rate-limit, round-robin, fill-first, failover, and provider-priority
  controls; provider toggles should hot-reload without losing auth state.
- Add local management APIs and optional native UI for server start/stop,
  auth/account status, provider priority, effective config, logs, usage, quota
  fallback, update posture, and diagnostics. Mac should have a menu-bar quality
  experience; Linux can start with CLI/systemd parity and honest support
  status.
- First-class gateway installation profiles for Mac and Linux covering binary
  install location, shell profile edits, launch daemon or service management,
  client config backup, and rollback.
- The first non-secret profile baseline is implemented at
  `GET /api/v1/developer-agent-profiles/summary`, covering Claude Code, Codex
  CLI, Codex Desktop, Grok Build, Kimi Code, and Cursor with access-mode,
  request-control, header-strategy, and evidence-requirement metadata. This is
  a control-plane contract only; it does not yet install the local gateway,
  touch credentials, or route harness traffic.
- Binding readiness between developer-agent profiles and governed app
  endpoints so operators can see which coding harnesses have policy, budget,
  publication, region, credential, quota, and evidence controls before traffic
  is routed.
- The first tenant-scoped binding-readiness endpoint is implemented at
  `GET /api/v1/developer-agent-profiles/bindings`. It maps canonical profiles
  to app endpoints through `process_context.developer_agent_profile_id` or
  `developer-agent:<profile-id>` tags and reports unbound, enablement,
  governance, publication, cost-control, and region-control blockers without
  reading credentials, calling providers, or routing traffic.
- A local classifier and optimization policy path by default, with any hosted
  classifier or remote optimization service treated as an explicit enterprise
  integration that must pass privacy, residency, and audit gates.
- Reasoning-depth policy as a first-class routing dimension, with approved
  values, provider contract evidence, and route evidence.
- Per-developer and per-team token, spend, allowance, and subscription quota
  budgets with default route-away thresholds.
- Model-freshness and retirement gates before a model can be selected by the
  optimizer.
- Signed optimization evidence showing selected model, alternatives considered,
  reason for route-up or route-down, expected cost/latency/quality tradeoff,
  quota posture, and policy constraints.
- Local-only and sovereign routing modes for sensitive work, with explicit
  proof that non-local providers were excluded.
- Enterprise admin controls for who may enable the local gateway, which agents
  may use it, and which provider access modes are allowed.
- Privacy controls that prevent raw prompts, secrets, OAuth tokens, and
  provider credentials from entering logs or evidence packs.
- Developer-facing status and diagnostics: active gateway, current agent
  profiles, selected default route policy, quota posture, stale model-card
  blockers, and last optimization proof.
- Enterprise fleet rollout controls: team-scoped install policy, version
  inventory, drift detection, emergency disable, and proof that all managed
  developer machines are on an approved gateway build.

Reference:

- [NerfGuard public site](https://www.nerfguard.com/) inspected on
  2026-06-06 for the competitive feature baseline.
- [CLIProxyAPI++](https://github.com/KooshaPari/cliproxyapi-plusplus) and
  [VibeProxy](https://github.com/automazeio/vibeproxy) inspected on
  2026-06-06 for coding-tool compatibility, OAuth/subscription, and local UX
  baselines.

Exit criteria:

- A developer can route Claude Code and Codex traffic through OpenScorpion on a
  local machine without changing normal prompting behavior.
- Factory Droids, Amp CLI, Cursor, Kimi Code, Grok Build, and at least one
  generic OpenAI-compatible client have retained profile setup, rollback, and
  route-proof evidence; unsupported tools have explicit blockers and manual
  setup guidance.
- The gateway can be enabled, disabled, and status-checked without manual
  database edits.
- The installer can update, rollback, and uninstall without leaving stale shell
  or client configuration behind.
- Mac and Linux support statements match retained runtime evidence.
- Local management surfaces show effective config, auth posture, account
  health, provider priority, usage, quota, and logs without printing secrets.
- Agent traffic produces route decisions, quota/cost records, model-freshness
  checks, and signed proof evidence.
- Reasoning-depth and route-up decisions are visible to operators and are
  bounded by policy.
- Alias, payload transform, protocol adapter, subscription gateway, and
  account failover behavior is captured in signed route or optimization
  evidence.
- Local-only mode passes with no paid-provider calls; non-local mode remains
  fail-closed until allowance, billing, and model-source evidence are current.
- Token-usage improvement claims are backed by retained workload packs, not
  copied from competitor positioning.

### 4. Enterprise UX And Workflow Audit

Goal: remove any remaining dashboard surface that reads like a concept demo and
replace it with role-based work queues, decisions, approvals, evidence, and
operator actions.

Work:

- Run a full dashboard route audit against a seeded local instance.
- Capture screenshots for every primary user journey, not just landing pages.
- Review the route audit and screenshots as a critique packet before slicing
  workflow-group PRs.
- Evaluate each page against regulated-industry personas: platform operator,
  application owner, model-risk reviewer, compliance officer, FinOps owner,
  security administrator, internal auditor, and developer/integrator.
- Split the UI into everyday operating surfaces and expert configuration
  surfaces, instead of mixing deep technical controls into ordinary queues.
- Keep technical power visible where it matters: policy graph, signed proof,
  scoring inputs, quota posture, request contract, and model lifecycle should be
  inspectable without becoming first-viewport marketing copy.

Reference:

- [Enterprise UI Operating Model](design/ENTERPRISE-UI-OPERATING-MODEL.md)
- [Enterprise UX Audit Plan](design/ENTERPRISE-UX-AUDIT-PLAN.md)
- [Preproduction UX Workflow Audit](design/PREPRODUCTION-UX-WORKFLOW-AUDIT-2026-05-31.md)

Exit criteria:

- Browser screenshots exist for all primary journeys in light and dark themes.
- No first-viewport hero, explainer, card-and-notes, fake metric, or empty demo
  panel remains on an internal operating surface.
- Every major page has a clear owner, queue, status, action, and evidence path.
- User-guide pages match the UI terminology and do not describe controls that
  no longer exist.

### 5. Evidence, Claims, And Load Proof

Goal: substantiate the product claims we want to make: governed best execution,
quota-safe failover, local/sovereign routing, cheaper-equivalent substitution,
quality retention, and signed auditability.

Work:

- Extend the evidential workload harness for realistic regulated workflows,
  including bounded concurrent request capture where the workload needs it.
- Record utility decomposition, selected-versus-best regret, candidate
  exclusions, quality score, latency, cost, quota posture, and proof material.
- Produce a repeatable evidence pack that supports customer diligence without
  relying on unsupported sales claims.
- Keep savings claims tied to observed routed workloads or clearly labelled
  scenario assumptions.

Exit criteria:

- A reviewer can reproduce the workload and inspect the generated proof,
  savings, quality, and gate-effectiveness evidence.
- Customer materials use evidence-backed claims only.

### 6. APCG-Governed CI And Local Runner Operations

Goal: keep CI affordable, local, and useful while dogfooding APCG governance as
part of the software delivery process.

Work:

- Keep trusted same-repo Rust jobs on protected Proxmox runner classes.
- Keep fork PRs on GitHub-hosted runners; run trusted same-repo
  classification, docs-only bypass, required-gate, and light jobs on the
  Proxmox light runner.
- Run Rust Fast Path, Integration, and release-sensitive aarch64 smoke in
  parallel after classification so all three Rust-class runners can be used.
- Keep docs-only changes from running full Rust/integration/release jobs.
- Integrate APCG evidence into PR, main, release, and promotion checks without
  blocking the normal developer loop on noisy policy output.
- Maintain Node 24-compatible GitHub Actions.

Exit criteria:

- Branch protection depends on stable aggregate checks rather than fragile
  individual heavy jobs.
- CI output is fast enough to support frequent small PRs.
- APCG decision artifacts are signed and reviewable.

## Active Implementation Slices

| Slice | Status | Next action |
|---|---|---|
| PR #681 readiness | Done | Merged the provider-billing grant, tenant-scoped posture route, retired-model UI guards, context-window formatting, and latest UX evidence. |
| UX-Tail-01 | Done | PR #687 merged proof verifier, policy release, and policy library adoption workbenches; keep these out of the open UX debt list unless a regression appears. |
| Dogfood inventory cleanup | Local-only ready | Non-spending provider-inventory audit `target/dogfood-provider-inventory/20260602T094830Z` confirms 0 local-readiness blockers, 17 routable local pairs, and no enabled non-local providers after disabling the exhausted OpenRouter row fail-closed. Fresh local route proof `target/dogfood-routed-request/20260602T094901Z` verifies trace, route decision, compliance audit, signed proof, and proof verification with no cloud-token spend. This does not satisfy the paid-provider cutover gate. |
| Dogfood auth and edge | Partially hardened | Production-beta is upgraded to `dogfood-f36dd341` with pre-upgrade DB backup/evidence `target/dogfood-evidence/20260605T230705Z`, post-upgrade evidence `target/dogfood-evidence/20260605T232138Z`, pre-placeholder-cleanup backup/evidence `target/dogfood-evidence/20260605T233451Z`, final post-hardening evidence `target/dogfood-evidence/20260605T234141Z`, heuristic quality-mode evidence `target/dogfood-model-assets/20260606T094437Z`, restore verification `target/dogfood-restore-verification/20260606T095531Z`, split-image build timing `target/dogfood-build-timing/20260606T100914Z`, and clean seed rehearsal `target/dogfood-clean-seed-rehearsal/20260606T104724Z`. Tailscale Serve provides tailnet HTTPS on a private host (name in the operator runbook); `/v1` reaches the router; `/control-health` and `/router-health` pass; and all published service ports except Tailscale HTTPS now bind to `127.0.0.1`. The production Compose override now wires Redis into the control plane for OIDC state. `target/dogfood-auth-edge/post-port-hardening-production-mode` is blocked only by `auth_non_dev_auth_not_configured`. Next configure real OIDC/SAML or equivalent non-dev auth before declaring production dogfood ready. |
| Paid-provider cutover readiness | Blocked by quota | OpenRouter `anthropic/claude-haiku-4.5` still has official non-spending source evidence: `target/model-source-openrouter-cutover-current.json` passed strict model-card, pricing, request-contract, and retirement collection on 2026-06-05 with exact model mention plus required `context_length` and `200000` source tokens. Fresh production-beta evidence still marks OpenRouter `exhausted`, quota usage 100%, and route-away. OpenRouter is disabled fail-closed in the production-beta database; do not re-enable it or run the paid proof until account credits or allowance evidence are restored and the paid-provider gate passes again. The readiness audit now records disabled non-local pre-cutover candidates with source-support, blocker diagnostics, and a default 24-hour source-evidence freshness window so the next paid candidate can be selected without first enabling it or relying on stale source files. |
| Model management UX | Active | MM-Expert-01 foundations are merged through bounded source-hit context, aggregate source-gap reporting, dynamic catalog-audit provider discovery, lifecycle coverage reporting, official model-card metadata, request-contract/retirement source evidence where published, explicit provider-not-published knowledge-cutoff posture, and cutover-proof request-contract evidence. Provider route-gate and readiness-count slices add first-viewport eligibility reasons plus top-strip counts that exclude missing-auth, missing-credential, missing-contract, stale, route-away, allowance-gap, unknown, and disabled provider rows. Model Registry now flags floating `latest` aliases and unsafe/uncensored-style aliases as model-risk review items and excludes them from best-execution routing. Continue source collectors only where provider sources are authoritative. |
| Developer agent gateway and token optimizer | Moved out of this repository | The local Python gateway (`developer-agent-gateway.py`), its tests and Shadow profile-proof evidence now live in the developer-tooling repository. The control plane keeps `GET /api/v1/developer-agent-profiles/{summary,bindings}` as the non-secret profile baseline. |
| UX audit and screenshots | Review complete; PR slicing | The current production-beta audit packet is `target/ux-audit/20260605T-current-james-walker-shadow-critique`: 98/98 route crawl pass, 22/22 authenticated screenshots, static CSS loaded, no authenticated screenshot redirected to login, and handoff prompts regenerated around the James Walker recapture. A bounded read-only Claude Code Sonnet review completed on Shadow; the tracked summary is [Production-Beta UX Critique](design/PRODUCTION-BETA-UX-CRITIQUE-2026-06-05.md). Overview route distribution and event rows now label historical providers, missing provider references, and retired model identifiers instead of implying current provider/model readiness from historical traces, the Overview fleet KPI now counts route-ready providers/models instead of raw enabled rows, FinOps now exposes current-period trace activity without ledger rows as a ledger-capture action, Provider Management now promotes stale, unknown, drained, and incomplete account posture into a queue above the registry, Verification Replay now exposes stale/high-regret/provider-mismatch/failure posture plus owner next actions in the table and HTMX partial, with reviewer sign-off and escalation actions recorded against each completed replay (decision stored with the evidence row, prior decisions preserved in a review history, attestation requires governed-activity sign-off authority), Model Registry now turns risky naming aliases into model-risk review posture, Quality Alerts now distinguishes absent trace telemetry from zero quality breaches, Policy Sources now exposes missing-document fetch/upload actions in the queue, Monitoring now shows current SLO measurement posture with source, sample count, and units, Credential Vault now shows row-level missing, unmatched, and configured-but-untested credential posture with add, bind-provider, and provider-test next actions, and Billing Admin plus Chargeback now distinguish live usage-ledger evidence from registry-only/no-ledger posture. Current slices promote missing assistant JWT, unassigned-provider traffic, zero-tagged-model governance, real Config Publishing snapshot hashes, and explicit non-production local-login opt-in into operator-visible integrity posture; remaining auth work is dogfood SSO/ingress rollout. |
| Provider spend and quota collectors | Active | Fresh manual/OAuth allowance posture is preserved during automatic refresh and combined with provider spend APIs where available. Continue provider-specific OAuth/subscription collectors only where provider/account sources expose reliable allowance, usage, or reset-window evidence. |
| Evidence harness | Active | First non-spending claims-pack builder is implemented: `scripts/build-dogfood-claims-evidence-pack.py` packages retained route/readiness captures and now separates local-only readiness from paid-provider cutover readiness. `scripts/run-dogfood-evidential-workload.py` adds the repeatable local workload wrapper around the routed-request capture path and now writes a workload manifest, workload ledger, serial/concurrent execution mode, claims pack, and optional baseline-cost evidence posture. `scripts/verify-dogfood-clean-seed-rehearsal.sh` now proves main migrations, verifier migrations, maintained seed SQL, proof-signing wrappers, routing config seed, and verifier seed against isolated temporary databases; latest evidence is `target/dogfood-clean-seed-rehearsal/20260606T104724Z`. Fresh local-only pack `target/dogfood-claims-evidence-pack/20260602T-local-failclosed-proof-v3` passes 5/5 claims; concurrent local workload evidence `target/dogfood-evidential-workload/workload-20260602-concurrency-01` captures three local routed requests at max concurrency 2 with `workload-ledger.json` and a nested claims pack; and `target/dogfood-evidential-workload/workload-20260602-baseline-cost-01` remains the latest workload with a scenario baseline-cost delta. These explicitly do not authorize paid, aggregator, or subscription-backed routing. Next collect provider-reported, account API, or invoice evidence before making authoritative monetary savings claims. |
| CI throughput and APCG dogfood | In progress | Keep Blacksmith out of the active path, keep the three-runner Rust fan-out and reboot-survivability evidence current, skip Integration only for narrowly scoped catalog/source-evidence tooling and non-runtime UX evidence-capture tooling changes, keep Grok/Qodo-style AI review outside required GitHub Actions, add light-runner capacity only when measured queueing justifies it, and review APCG CI artifacts once signed checks are stable. |

## Current Product Gaps

These are the gaps that block serious local dogfood and customer-facing
preproduction use. Dated evidence bundles live in the design audit and `target/`
artifacts, not in this roadmap.

- **Provider contract controls:** the provider workbench exposes endpoint,
  header, request, response, vault, and cutover-evidence review. Safe API
  mutation controls are merged, and the dashboard editor now covers endpoint
  path, method, transforms, non-secret headers, optimistic contract hashes, and
  runtime config refresh. OpenRouter Haiku has non-spending source evidence,
  but the current production cutover gate is blocked by exhausted OpenRouter
  billing posture.
- **Access-mode posture:** API-key, OAuth/subscription, aggregator, and local
  runtime paths now roll up through the provider summary API and dashboard with
  allowance, quota, reset-window, confidence, stale, and route-away posture. The
  cutover audit also blocks OAuth/subscription routes without future
  reset-window evidence and recorded non-secret endpoint header-contract
  evidence. OpenRouter currently fails the aggregator cutover gate because fresh
  account-credit/quota posture reports exhausted allowance and disables routing.
- **Model freshness:** stale, retired, compatibility-only, and inventory-only
  model IDs must stay visible for audit but excluded from best-execution routing
  unless current model-card, pricing, retirement, and request-contract evidence
  exists. The latest production-beta local inventory refresh restored 17
  routable local pairs without token spend. The OpenRouter catalog now carries a
  single verified cutover candidate, `anthropic/claude-haiku-4.5`, sourced from
  the official OpenRouter Models API and chat-completion contract docs. The
  production-beta database now has the current production migration ledger
  applied; the latest readiness audit records `models.knowledge_cutoff_status`
  as present instead of inferred. Kimi currently has official K2.6 model-card
  evidence with explicit `not_published` knowledge-cutoff posture; keep that
  posture visible until an official source publishes a date.
- **UX tail:** route and screenshot evidence is current, with 98/98 route
  checks and 22/22 authenticated screenshots captured at
  `target/ux-audit/20260605T-current-james-walker-shadow-critique`; the first
  Shadow Claude review is summarized in
  [Production-Beta UX Critique](design/PRODUCTION-BETA-UX-CRITIQUE-2026-06-05.md).
  Remaining work is workflow-quality implementation: dogfood SSO/ingress,
  paid-provider allowance evidence, and expert/admin surfaces such as budgets,
  cost centers, monitoring, circuit breakers, vault, users, roles, tenants,
  signals, decisions, intent, equivalences, HuggingFace discovery, cache,
  safety, MCP, and WASM plugins.
- **Evidence harness:** the first file-based dogfood claims pack now packages
  retained local route proof and non-spending OpenRouter cutover readiness
  evidence without provider calls. The workload harness captures route, token,
  quality, cost-metric, quota, regret, local-boundary, and optional baseline
  cost posture from live routed runs. The remaining gap is retained scenario or
  provider-reported baseline evidence for the same prompts before any monetary
  savings or cheaper-equivalent substitution claim is made.
- **Subagent review:** Shadow has Grok Build Composer 2.5 and Kimi available.
  Claude Code Sonnet has completed the first read-only review of
  `target/ux-audit/20260605T-current-james-walker-shadow-critique`. Use Grok or
  Kimi next only for bounded second-opinion critique or isolated implementation
  spikes. Codex remains the final integrator.

## Completed Baseline

The following baseline is available and should not be replanned unless a
regression is found:

- v0.1.0 release artifacts and proof-verifier packaging.
- Seven-stage router pipeline with signed compliance and route evidence.
- Control-plane dashboard, OIDC/RBAC, vault-backed provider credentials,
  provider billing posture, config publishing, fleet management, and evidence
  review surfaces.
- Provider lifecycle guardrails for stale inventory, retired model identifiers,
  static catalog audit, and model-card evidence lift from audited catalog rows.
- Local dogfood deployment with no-blocker local readiness audit, local route
  proof, and a current fail-closed OpenRouter paid-provider cutover gate.
- Enterprise UI operating-surface work across the main governance, FinOps,
  fleet, process, policy-source, and verification pages.
- Documentation front doors for architecture, engineering, algorithms,
  inventions, operations, user workflows, security, API integration, and
  verification.

## Deferred Or Buyer-Driven

- Later patent-family implementation tracks should start only when customer
  pull, filing strategy, or ecosystem timing justifies production work.
- Additional API/AXI summary endpoints should be added only where a real
  integration, dashboard, or agent workflow lacks compact posture.
- Richer APCG graph visualisation should be driven by reviewer evidence needs,
  not by the existence of old React components in adjacent repositories.
- UAT renewal-window evidence should be recaptured only when deployment
  checklists require a fresh environment-specific bundle.
