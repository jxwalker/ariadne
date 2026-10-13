# Requirements

## Active

### HF-01 — HuggingFace model discovery filters to inference-compatible models only

- Status: validated
- Class: core-capability
- Source: M003
- Primary Slice: M003/S01

### HF-02 — Gated model detection with access status visibility

- Status: validated
- Class: core-capability
- Source: M003
- Primary Slice: M003/S01

### HF-03 — Model metadata enrichment from Hub API (context window, quality signals, pricing tier)

- Status: validated
- Class: core-capability
- Source: M003
- Primary Slice: M003/S02

### HF-04 — Model variant grouping under logical model families

- Status: validated
- Class: core-capability
- Source: M003
- Primary Slice: M003/S03

### HF-05 — Scheduled model catalog refresh with change detection

- Status: validated
- Class: operational
- Source: M003
- Primary Slice: M003/S04

### HF-06 — Quality score estimation from community signals (downloads, likes, trending)

- Status: validated
- Class: core-capability
- Source: M003
- Primary Slice: M003/S02

### HF-07 — Dashboard UI for HF model discovery, filtering, and bulk import

- Status: validated
- Class: ui
- Source: M003
- Primary Slice: M003/S05

### ~~UI30-09 — Cache capacity is fairly partitioned or enforced per tenant so one tenant cannot monopolize router memory~~ ✅ VALIDATED

- Status: validated
- Class: core-capability
- Source: inferred (originally CACHE-07, reclassified as future UI/ops feature)
- Primary Slice: S32

Per-tenant cache capacity quotas are not yet enforced. Tenant isolation exists (scoped keys, filtered lookups) via moka LRU, but no per-tenant entry limit prevents one tenant from consuming a disproportionate share of the shared cache pool. A future enhancement could add per-tenant counters with configurable max entries per tenant.

### MULTI-01 — OpenRouter provider adapter supports chat completions and streaming via OpenAI-compatible API

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S01

### MULTI-02 — HuggingFace Inference provider adapter supports chat completions and streaming via OpenAI-compatible API

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S01

### MULTI-03 — Model equivalence mappings are stored in PostgreSQL with source_model, target_model, target_provider_id, quality_score, and cost metadata

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S02

### MULTI-04 — Model equivalence mappings are published to routers via ConfigSnapshot and hot-reloaded without restart

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S02

### MULTI-05 — The routing engine expands candidate providers using equivalence mappings so a request for model X also considers mapped alternatives on other providers

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S02

### MULTI-06 — Response model name is rewritten to the user's originally requested model when an equivalence substitution occurs

- Status: validated
- Class: core-capability
- Source: M002
- Primary Slice: M002/S03

### MULTI-07 — Operators can create, view, edit, and delete model equivalence mappings through the dashboard UI

- Status: validated
- Class: ui
- Source: M002
- Primary Slice: M002/S04

### MULTI-08 — Existing providers (OpenAI, Anthropic, Ollama, GenericHTTP) continue to work unchanged after adding new adapters and equivalence routing

- Status: validated
- Class: regression
- Source: M002
- Primary Slice: M002/S03

## Validated

### UI30-01 — The product UI exposes all major platform features through role-aware screens, so operators do not need shell access for normal workflows

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T02 built management UI for providers/models/policies/users; T03 built oversight pages for reports/audit/traces. All accessible via auth-aware dashboard without shell access.

### UI30-02 — Persona-specific experiences exist for operator, tenant admin, operations staff, CISO, auditor, and regulator personas with appropriate navigation, summaries, and evidence depth

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T01 created 5 personas (PlatformAdmin, TenantAdmin, Developer, Auditor, Viewer) with distinct NavVisibility. T04 test `all_five_personas_produce_distinct_nav_visibility` passes.

### UI30-03 — Users can create, inspect, and modify providers, models, policies, rules, weights, routing preferences, and sessions through polished management UI flows

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T02 built CRUD UI for providers/models/policies/users. Weights/preferences/sessions managed via REST API at /api/v1/*.

### UI30-04 — Reports, traces, audit views, compliance evidence, and oversight artifacts are available through product surfaces with export/share/print-friendly outputs

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T03 built reports/audit/traces/compliance surfaces with cross-navigation, filtering, and compliance banners. 13 oversight tests pass.

### UI30-05 — Authentication, session handling, user administration, role assignment, and RBAC-driven feature visibility are fully represented in the UI

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T01 auth-aware shell with persona badges and permission-gated navigation; T02 user admin with role assignment/removal.

### UI30-06 — The product supports locale-aware navigation, labels, validation copy, and evidence/report framing so the UI can be localized cleanly

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T01 i18n with 5 locales (en/es/fr/de/ja), t() lookup, fallback chain. T04 test `i18n_catalog_has_coverage_for_all_locales` passes.

### UI30-07 — The app includes demo-ready seeded states, scenario walkthroughs, and polished empty/loading/error states suitable for investor presentations

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S32 T04 DashboardCapabilities with 8 demo tests. `all_page_templates_render_for_platform_admin` verifies all 11 pages render. Polished empty states across all management/oversight pages.

### UI30-08 — The UI remains clean, corporate, responsive, and accessibility-conscious across desktop and mobile form factors

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

S30 corporate design system with light-theme tokens, Inter font, responsive drawer. S32 maintained consistent responsive and accessible styling across all pages.

### CI-01 — CI pipeline passes with zero clippy warnings (fix needless lifetimes, derivable impl, too-many-arguments)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

CI pipeline passes with zero clippy warnings (fix needless lifetimes, derivable impl, too-many-arguments)

### CI-02 — Proof bundler seed is loaded from configuration or control plane secret, not hardcoded

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Proof bundler seed is loaded from configuration or control plane secret, not hardcoded

### CI-03 — Provider adapter calls in anthropic.rs and ollama.rs propagate errors instead of panicking via unwrap()

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Provider adapter calls in anthropic.rs and ollama.rs propagate errors instead of panicking via unwrap()

### CI-04 — Hardcoded country code "US" in handlers.rs is replaced with tenant-context-derived or request-derived value

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Hardcoded country code "US" in handlers.rs is replaced with tenant-context-derived or request-derived value

### CACHE-01 — Response cache has a configurable maximum entry limit with automatic eviction of least-recently-used entries

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Response cache has a configurable maximum entry limit with automatic eviction of least-recently-used entries

### CACHE-02 — Cache eviction runs without deadlocking the semantic matching scan

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Cache eviction runs without deadlocking the semantic matching scan

### CACHE-03 — Semantic cache matching is scoped by tenant to prevent cross-tenant cache interference

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Semantic cache matching is scoped by tenant to prevent cross-tenant cache interference

### CACHE-04 — Cache size and hit/miss rates are observable via metrics or logging

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Cache size and hit/miss rates are observable via metrics or logging

### QUAL-01 — The 171-line resolve_routing_context() function is decomposed into testable sub-functions without changing behavior

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

The 171-line resolve_routing_context() function is decomposed into testable sub-functions without changing behavior

### QUAL-02 — publish_snapshot_with_decision_layer() accepts a params struct instead of 9 positional arguments

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

publish_snapshot_with_decision_layer() accepts a params struct instead of 9 positional arguments

### QUAL-03 — Silent failures in cache semantic matching and plugin execution emit tracing debug/warn logs

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Silent failures in cache semantic matching and plugin execution emit tracing debug/warn logs

### QUAL-04 — Dual cache policy model (local settings vs governance) has documented precedence rules

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Dual cache policy model (local settings vs governance) has documented precedence rules

### TEST-01 — Integration test exercises cache lookup, plugin stage execution, and gateway hint extraction in a single request flow

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Integration test exercises cache lookup, plugin stage execution, and gateway hint extraction in a single request flow

### TEST-02 — Integration test verifies preference CRUD triggers ConfigSnapshot republication to routers

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Integration test verifies preference CRUD triggers ConfigSnapshot republication to routers

### TEST-03 — Integration test verifies provider/policy mutations propagate via ConfigSnapshot within one poll cycle

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Integration test verifies provider/policy mutations propagate via ConfigSnapshot within one poll cycle

### INFRA-01 — Standard JSON error envelope is used consistently across all /api/v1/* endpoints with machine-readable error codes

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Standard JSON error envelope is used consistently across all /api/v1/* endpoints with machine-readable error codes

### INFRA-02 — Cursor-based pagination is available as a shared extractor for all list endpoints

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Cursor-based pagination is available as a shared extractor for all list endpoints

### INFRA-03 — OpenAPI documentation is auto-generated via utoipa and served at /api/docs on the control plane

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

OpenAPI documentation is auto-generated via utoipa and served at /api/docs on the control plane

### INFRA-04 — Admin audit log helper records all mutating API operations with before/after state

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin audit log helper records all mutating API operations with before/after state

### PROV-01 — Admin can list providers with cursor pagination and filtering by type, enabled status, and tenant

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can list providers with cursor pagination and filtering by type, enabled status, and tenant

### PROV-02 — Admin can view a single provider's full detail including endpoints, model catalog, and reputation

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can view a single provider's full detail including endpoints, model catalog, and reputation

### PROV-03 — Admin can create a new provider with API key stored securely via vault

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can create a new provider with API key stored securely via vault

### PROV-04 — Admin can update provider configuration (base_url, auth, pricing) with partial PATCH semantics

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can update provider configuration (base_url, auth, pricing) with partial PATCH semantics

### PROV-05 — Admin can soft-delete a provider, excluding it from ConfigSnapshot without losing historical data

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can soft-delete a provider, excluding it from ConfigSnapshot without losing historical data

### PROV-06 — Admin can toggle a provider enabled/disabled for quick operational control

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can toggle a provider enabled/disabled for quick operational control

### PROV-07 — Admin can test a provider's connection before saving credentials

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can test a provider's connection before saving credentials

### PROV-08 — Provider/policy mutations trigger ConfigSnapshot republication to all routers

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Provider/policy mutations trigger ConfigSnapshot republication to all routers

### POL-01 — Admin can list policies with cursor pagination and filtering by active status and tenant scope

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can list policies with cursor pagination and filtering by active status and tenant scope

### POL-02 — Admin can view a single policy's full detail including all rules

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can view a single policy's full detail including all rules

### POL-03 — Admin can create a new policy with rules validated against the APCG compiler before persistence

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can create a new policy with rules validated against the APCG compiler before persistence

### POL-04 — Admin can update policy rules and metadata with partial PATCH semantics

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can update policy rules and metadata with partial PATCH semantics

### POL-05 — Admin can soft-delete a policy without breaking audit trail

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can soft-delete a policy without breaking audit trail

### POL-06 — Admin can toggle a policy active/inactive

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can toggle a policy active/inactive

### POL-07 — Admin can dry-run policy compilation to validate rules without persisting

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can dry-run policy compilation to validate rules without persisting

### ADMIN-01 — Org admin can list tenants within their organization with cursor pagination

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Org admin can list tenants within their organization with cursor pagination

### ADMIN-02 — Org admin can create a new tenant with default quota

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Org admin can create a new tenant with default quota

### ADMIN-03 — Org admin can view tenant detail including user count and quota info

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Org admin can view tenant detail including user count and quota info

### ADMIN-04 — Tenant admin can list users within their tenant with cursor pagination

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Tenant admin can list users within their tenant with cursor pagination

### ADMIN-05 — Tenant admin can view user detail including roles and permissions

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Tenant admin can view user detail including roles and permissions

### ADMIN-06 — Tenant admin can update user role assignments

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Tenant admin can update user role assignments

### ADMIN-07 — Tenant admin can remove a user from the tenant (with self-delete and last-admin protection)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Tenant admin can remove a user from the tenant (with self-delete and last-admin protection)

### ADMIN-08 — Admin can list available roles with their permissions

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can list available roles with their permissions

### AUDIT-01 — Admin can query inference traces with filters (tenant, provider, model, date range, latency, cost) and cursor pagination

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can query inference traces with filters (tenant, provider, model, date range, latency, cost) and cursor pagination

### AUDIT-02 — Admin can view a single trace's full detail

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can view a single trace's full detail

### AUDIT-03 — Admin can query the admin audit log with filters (user, action, resource type, date range) and cursor pagination

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can query the admin audit log with filters (user, action, resource type, date range) and cursor pagination

### AUDIT-04 — Admin can query policy violations with filters (tenant, policy, violation type, date range) and cursor pagination

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Admin can query policy violations with filters (tenant, policy, violation type, date range) and cursor pagination

### UIX-01 — The management app uses a shared enterprise app shell with persistent left-hand navigation on desktop and a consistent mobile navigation fallback

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

The management app uses a shared enterprise app shell with persistent left-hand navigation on desktop and a consistent mobile navigation fallback

### UIX-02 — The primary light theme uses a restrained corporate palette built around navy, slate, white, and controlled blue accents rather than playful or high-saturation styling

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

The primary light theme uses a restrained corporate palette built around navy, slate, white, and controlled blue accents rather than playful or high-saturation styling

### UIX-03 — Core admin patterns for tables, forms, cards, filters, status badges, and empty states are standardized so all management pages share one visual grammar

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Core admin patterns for tables, forms, cards, filters, status badges, and empty states are standardized so all management pages share one visual grammar

### UIX-04 — Typography, spacing, and component density are optimized for a clean modern corporate dashboard feel with strong readability for operators and executive demos

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Typography, spacing, and component density are optimized for a clean modern corporate dashboard feel with strong readability for operators and executive demos

### UIX-05 — Visual guidance explicitly defines how trace/timeline views surface complex evidence cleanly without collapsing into raw developer-console aesthetics

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Visual guidance explicitly defines how trace/timeline views surface complex evidence cleanly without collapsing into raw developer-console aesthetics

### TRACEUI-01 — The app includes a request trace explorer where operators can list and open individual requests or transactions with filtering and direct deep links from audit or reporting views

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

The app includes a request trace explorer where operators can list and open individual requests or transactions with filtering and direct deep links from audit or reporting views

### TRACEUI-02 — A trace detail screen renders a stage-oriented decision timeline covering request intake, intent resolution, APCG or policy gates, cache or plugins, route selection, provider execution, and emitted events

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

A trace detail screen renders a stage-oriented decision timeline covering request intake, intent resolution, APCG or policy gates, cache or plugins, route selection, provider execution, and emitted events

### TRACEUI-03 — Each trace stage exposes both an executive-friendly summary and drill-down evidence showing inputs, decisions, blocked candidates, selected provider or model, and proof or trace metadata

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Each trace stage exposes both an executive-friendly summary and drill-down evidence showing inputs, decisions, blocked candidates, selected provider or model, and proof or trace metadata

### TRACEUI-04 — The trace viewer surfaces routing transparency artifacts including resolution chain, cache outcome, fallback usage, plugin tags, and APCG proof or compliance status

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

The trace viewer surfaces routing transparency artifacts including resolution chain, cache outcome, fallback usage, plugin tags, and APCG proof or compliance status

### PRE-01 — A governed pre-route preprocessing stage exists with bounded mutation authority and policy/profile-controlled enablement

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

A governed pre-route preprocessing stage exists with bounded mutation authority and policy/profile-controlled enablement

### PRE-02 — PII detection and redaction can run before provider dispatch when enabled by tenant policy or routing profile

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

PII detection and redaction can run before provider dispatch when enabled by tenant policy or routing profile

### PRE-03 — Prompt compression or normalization can run before routing and provider dispatch with explicit safety and quality guardrails

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Prompt compression or normalization can run before routing and provider dispatch with explicit safety and quality guardrails

### PRE-04 — Any preprocessing mutation is auditable and explainable in traces or headers so request transformation is never opaque

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Any preprocessing mutation is auditable and explainable in traces or headers so request transformation is never opaque

### FLEET-01 — Router maintains worker discovery and health state for backend/model replicas instead of assuming static upstreams

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Router maintains worker discovery and health state for backend/model replicas instead of assuming static upstreams

### FLEET-02 — Replica selection policies include at least round-robin, consistent-hash affinity, and power-of-two choices

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Replica selection policies include at least round-robin, consistent-hash affinity, and power-of-two choices

### FLEET-03 — Sticky routing or KV-affinity can keep a conversation or workflow on a compatible backend replica when configured

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Sticky routing or KV-affinity can keep a conversation or workflow on a compatible backend replica when configured

### FLEET-04 — Backend retry, circuit-breaker, and fault-isolation behavior exists at the worker-pool layer

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Backend retry, circuit-breaker, and fault-isolation behavior exists at the worker-pool layer

### FLEET-05 — Prefill/decode disaggregation can be represented and routed as an optional backend scheduling mode

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Prefill/decode disaggregation can be represented and routed as an optional backend scheduling mode

### FLEET-06 — Kubernetes-native discovery and autoscaling inputs exist for router-managed worker fleets

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S32

Kubernetes-native discovery and autoscaling inputs exist for router-managed worker fleets

### CACHE-05 — Response cache entries enforce configurable freshness/TTL rules instead of persisting indefinitely

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S25

Governance `default_ttl_seconds` (default 300s) controls entry TTL. Local `minimum_freshness_secs` acts as floor. Moka TTL handles exact-hit expiration; freshness check filters semantic scan results. Configurable via router settings and governance config pushed from control plane.

### CACHE-06 — Cache admission, bypass, and invalidation rules are explicit and configurable for exact and semantic cache paths

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S25

`CachePolicyMode` enum (ServeCached/BypassCache/ContinueLiveRouting) controls admission. `cacheable_profiles` governance filter controls profile-level bypass. `enabled` flag provides master switch. Moka handles invalidation via TTL expiration and LRU eviction. All paths configurable via local settings and governance config.

### CACHE-08 — Cache decisions are explainable in traces and headers, including hit type, bypass reason, and freshness outcome

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S25

`x-scorpion-cache-outcome` header emitted on every response (exact_hit/semantic_hit/miss/bypassed). Prometheus metrics: `scorpion_cache_hits_total` (labeled exact/semantic), `scorpion_cache_misses_total`, `scorpion_cache_bypasses_total`, `scorpion_cache_evictions_total` (labeled expired/size/explicit/replaced), `scorpion_cache_entries` gauge.

## Deferred

## Out of Scope
