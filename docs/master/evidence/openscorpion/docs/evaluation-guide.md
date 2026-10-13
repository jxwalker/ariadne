# Evaluation & Benchmark Guide

> **Last updated:** 2026-09-27
> **Audience:** Platform operators and ML engineers configuring model evaluation

## Overview

OpenScorpion's eval platform provides three layers of model quality intelligence:

1. **Published scores** — Zero cost. Benchmark scores from the HF Open LLM
   Leaderboard, provider model cards or community evaluations, kept in
   `verification/datasets/published_scores.json`.
2. **Internal benchmark packs** — Run domain-specific evaluation suites against
   models through your router.
3. **Live reputation feedback** — The router records the outcome of every
   production inference and updates Bayesian reputation per provider and per
   provider×domain, which candidate selection reads on the next request.

Only two paths reach routing: the dataset file and live feedback. The control
plane reads `published_scores.json` at startup and ships those scores to routers
as quality priors, so a change to the file takes effect after a control-plane
restart. Scores you import through the verification server's API
(`scorpion-verify`, port 8070, `/api/v1/verification/evals/import`) stay inside
that server and never reach the router. Benchmark pack results reach routing
only when you add them to the dataset file. Live feedback is the one layer that
changes routing continuously.

## Where Eval Scores Live

Two services hold eval scores, and they do not share them:

| | Control plane (`scorpion-control`, port 8090) | Verification server (`scorpion-verify`, port 8070) |
|---|---|---|
| Source | Reads `verification/datasets/published_scores.json` when it builds its config snapshot at startup | Scores you import through its API, stored in its own database (`openscorpion_verify`) |
| Used for | Router quality priors (the scores ship to routers in the config snapshot) and the `/dashboard/evals` page | The eval API under `/api/v1/verification/evals/*` only. The verification dashboard does not show imported scores |
| On a fresh stack | 87 scores | Empty until you import |
| Auth | `/internal/config` takes the router-facing `INTERNAL_SECRET`; the dashboard takes a normal sign-in | `Authorization: Bearer <SCORPION_VERIFY_API_SECRET>`, or the read-only secret for `GET` requests |

Scores imported into the verification server do not change routing. To change
the router's priors, edit `verification/datasets/published_scores.json` and
restart the control plane. The Docker image copies `verification/datasets/` at
build time, so a containerised control plane needs a rebuild first.

## Quick Start: Published Scores

The fastest way to get eval-backed routing — zero tokens burned.

### The sample dataset

A pre-built dataset ships with OpenScorpion at `verification/datasets/published_scores.json` containing 87 scores across 10 models and 10 domains.

Treat this dataset as seed evaluation evidence, not as proof that the referenced
model IDs are still current or routable. Refresh model cards and provider
inventory before using any score as production routing evidence.

The control plane loads it automatically at startup. To check the count it
published to routers, read the config snapshot the way a router does. In the
default `internal_auth_mode = "token"` the bearer is `INTERNAL_SECRET` from
`.env`; in `mtls` mode `/internal/*` needs a router client certificate instead.

```bash
INTERNAL_SECRET=$(grep '^INTERNAL_SECRET=' .env | cut -d= -f2-)
curl -s -H "Authorization: Bearer $INTERNAL_SECRET" \
  http://localhost:8090/internal/config | jq '.snapshot.eval_scores | length'
# Expected: 87
```

The same scores appear as a heatmap at `http://localhost:8090/dashboard/evals`
after you sign in.

### Start the verification server

The base `docker-compose.yml` does not run `scorpion-verify`; the
`docker-compose.dogfood.yml` override adds it. With the base stack already up
(`docker compose up -d`, or `scripts/demo.sh`), from the repository root:

```bash
# 1. Secrets for the verification server. The dogfood override also requires
#    SCORPION_CONTROL_EXTERNAL_URL to be set before Compose will parse it, even
#    though scorpion-verify does not use it.
cat >> .env <<EOF
SCORPION_VERIFY_API_SECRET=$(openssl rand -hex 32)
SCORPION_VERIFY_API_READ_SECRET=$(openssl rand -hex 32)
SCORPION_VERIFY_DASHBOARD_SECRET=$(openssl rand -hex 32)
SCORPION_CONTROL_EXTERNAL_URL=http://localhost:8090
EOF

# 2. Its database. Nothing in the Compose stack creates it.
docker compose exec postgres sh -c \
  'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE DATABASE openscorpion_verify;"'

# 3. Build and start only scorpion-verify. --no-deps leaves the running stack
#    as it is; without it Compose would also recreate the control plane with
#    the dogfood override's production settings.
docker compose -f docker-compose.yml -f docker-compose.dogfood.yml build scorpion-verify
docker compose -f docker-compose.yml -f docker-compose.dogfood.yml up -d --no-deps scorpion-verify

curl -s http://localhost:8070/health
# {"database":"connected","service":"scorpion-verify","status":"healthy"}
```

The override publishes port 8070 on `127.0.0.1` only and uses `!override`,
which needs Docker Compose v2.24.4 or newer. The service runs migrations on
its own database at startup. Its dashboard is at
`http://localhost:8070/dashboard?token=<SCORPION_VERIFY_DASHBOARD_SECRET>`.

Every call under `/api/v1/verification/` except `/api/v1/verification/status`
needs a bearer token.
`SCORPION_VERIFY_API_SECRET` allows reads and writes.
`SCORPION_VERIFY_API_READ_SECRET` allows `GET` only; a write with it returns
`403`. A missing or wrong token returns `401`, and so does every call when
`SCORPION_VERIFY_API_SECRET` is empty. Only `/health`,
`/api/v1/verification/status` and `/metrics` are public.

```bash
VERIFY_API=$(grep '^SCORPION_VERIFY_API_SECRET=' .env | cut -d= -f2-)
VERIFY_READ=$(grep '^SCORPION_VERIFY_API_READ_SECRET=' .env | cut -d= -f2-)
VERIFY=http://localhost:8070/api/v1/verification
```

### Import the sample dataset

The dataset file is already in the import format:

```bash
curl -s -X POST "$VERIFY/evals/import" \
  -H "Authorization: Bearer $VERIFY_API" \
  -H "Content-Type: application/json" \
  --data @verification/datasets/published_scores.json
# {"imported":87,"source":"hf_leaderboard"}
```

Importing is idempotent: a score with the same model, benchmark, domain,
source and `scored_at` is updated, not duplicated.

### Importing custom scores

```bash
curl -s -X POST "$VERIFY/evals/import" \
  -H "Authorization: Bearer $VERIFY_API" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "provider_published",
    "source_url": "https://example.com/model-card",
    "scored_at": "2026-03-28T00:00:00Z",
    "scores": [
      {"model": "provider-current-text-model", "provider": "provider-a", "benchmark": "mmlu", "domain": "mathematics", "score": 0.912, "raw_score": 91.2},
      {"model": "provider-current-text-model", "provider": "provider-a", "benchmark": "mmlu", "domain": "computer_science", "score": 0.923, "raw_score": 92.3},
      {"model": "provider-current-reasoning-model", "provider": "provider-b", "benchmark": "mmlu", "domain": "mathematics", "score": 0.934, "raw_score": 93.4}
    ]
  }'
```

Valid `source` values: `hf_leaderboard`, `provider_published`, `manual`, `csv_import`.
Scores outside 0.0–1.0 are dropped, and `imported` counts only the rows kept.

### Querying scores

```bash
# All scores for a model
curl -s "$VERIFY/evals/scores?model=provider-current-text-model" \
  -H "Authorization: Bearer $VERIFY_READ"

# All models for a domain
curl -s "$VERIFY/evals/scores?domain=mathematics" \
  -H "Authorization: Bearer $VERIFY_READ"

# Models with imported scores (10 from the sample dataset, plus any you added)
curl -s "$VERIFY/evals/models" \
  -H "Authorization: Bearer $VERIFY_READ" | jq '.models | length'

# Best model per domain
curl -s "$VERIFY/evals/best-per-domain?benchmark=mmlu" \
  -H "Authorization: Bearer $VERIFY_READ"

# Simulated router advantage
curl -s "$VERIFY/evals/router-advantage?benchmark=mmlu" \
  -H "Authorization: Bearer $VERIFY_READ"

# Benchmark-subject to routing-domain mapping
curl -s "$VERIFY/evals/domains?benchmark=mmlu" \
  -H "Authorization: Bearer $VERIFY_READ"
```

Without a filter, `/evals/scores` returns the latest score per model and
domain. `best-per-domain`, `router-advantage` and `domains` default to
`benchmark=mmlu`.

## Domain Benchmark Packs

Five domain-specific benchmark packs ship with OpenScorpion in `verification/datasets/benchmark_packs/`:

| Pack | Domain | Cases | Task Types |
|------|--------|-------|------------|
| `sql.json` | SQL & structured data | 10 | query_generation, query_explanation, query_repair, dialect_translation |
| `coding.json` | Software engineering | 8 | function_generation, bug_fixing, code_review, documentation, refactoring |
| `tool_calling.json` | Tool orchestration | 6 | single_tool_call, multi_step_chain, tool_selection, error_recovery |
| `long_context.json` | Document analysis | 7 | needle_in_haystack, multi_document_synthesis, contract_analysis, meeting_summary |
| `executive_reasoning.json` | Business communication | 7 | board_memo, risk_assessment, strategic_recommendation, stakeholder_communication |

### Benchmark case format

Each case includes:

```json
{
  "case_id": "sql_gen_002",
  "task_type": "query_generation",
  "subtask": "multi_table_join",
  "difficulty": 2,
  "input": {
    "prompt": "Write a SQL query to find monthly revenue by region...",
    "context": {"dialect": "postgres", "schema": "orders(...); customers(...)"}
  },
  "constraints": {
    "max_latency_ms": 3000,
    "max_cost_usd": 0.02
  },
  "expected": {
    "reference": "SELECT ...",
    "unit_tests": ["joins tables", "groups by month", "filters active"]
  },
  "evaluation": {
    "metric_primary": "execution_accuracy",
    "metric_secondary": ["syntax_validity", "cost_efficiency"]
  },
  "routing_tags": {
    "schema_heavy": true,
    "cacheable_prefix": true
  }
}
```

### Running benchmarks via lm-eval-harness

For industry-standard benchmarks (MMLU, GSM8K, HumanEval, MT-Bench), use EleutherAI's lm-evaluation-harness pointed at your router:

```bash
# Install lm-eval
pip install lm-eval

# Run MMLU subset through the router
lm_eval --model local-chat-completions \
  --model_args model=auto,base_url=http://localhost:8080/v1/chat/completions,num_concurrent=5,tokenized_requests=False \
  --tasks mmlu_pro \
  --limit 50 \
  --output_path /tmp/eval-results \
  --log_samples

# Run against a specific model for comparison
lm_eval --model local-chat-completions \
  --model_args model=provider-current-text-model,base_url=http://localhost:8080/v1/chat/completions,num_concurrent=5,tokenized_requests=False \
  --tasks mmlu_pro \
  --limit 50 \
  --output_path /tmp/eval-provider-current-text-model
```

**Important:** Chat completion endpoints don't support loglikelihood-based MC scoring. Use generation-based benchmarks (MMLU-Pro, GSM8K, TruthfulQA MC2) or accept answer-extraction scoring.

### Budget controls

When running benchmarks:
- Use `--limit N` to cap the number of questions per task
- Monitor spend via the FinOps dashboard at `/dashboard/finops`
- Set per-cost-center budgets to prevent runaway eval costs

## How Eval Scores Affect Routing

### Quality estimation priority

When the router scores a candidate model, it looks up quality in this order:

1. **Explicit operator override** — set via `QualityOverride` in config
2. **Eval score for (model, domain/task_type)** — for example, a current model on sql/query_generation = 0.92
3. **Eval score for (model, domain)** — for example, the same model on computer_science = 0.923
4. **Eval score for (model, overall)** — for example, the same model overall = 0.887
5. **Tier heuristic** — name-based classification (flagship=0.85, standard=0.65, economy=0.45)

### Reputation seeding from eval data

Eval scores seed the Bayesian prior for cold-start models:

```
score = 0.92 → Beta(α=19.4, β=2.6) — equivalent to 20 pseudo-observations
```

Live traffic refines the prior. After 100 real observations, the eval prior contributes only ~16% of the score.

### Task-type hierarchy

Reputation is tracked at three levels of granularity:

```
global → domain → task_type → subtask
  0.5      0.88     0.92       0.95    (score)
  ∞        50       20         5       (observations)
```

The router uses the most specific level with ≥20 observations, falling back to broader levels when data is thin.

## Model Capabilities

The router uses model capabilities as **hard gates** — a model without tool calling will never receive a tool-calling request, regardless of its quality score.

### Capability fields

| Capability | What it means |
|-----------|---------------|
| `supports_tools` | Can handle tool/function call definitions |
| `supports_vision` | Can process image inputs |
| `supports_audio_input` | Can process audio inputs |
| `supports_audio_output` | Can generate audio (TTS) |
| `supports_json_mode` | Can produce structured JSON output |
| `supports_streaming` | Can stream responses via SSE |
| `context_window` | Maximum input tokens |
| `max_output_tokens` | Maximum generation length |

### How filtering works

1. Request arrives with tools, images, or other capability requirements
2. Router extracts `CapabilityRequirements` from the request
3. Each candidate model is checked: `model.satisfies(&requirements)`
4. Models that fail are excluded from the candidate set
5. Remaining models are scored with the utility function

### Viewing capabilities

Model capabilities are visible in the dashboard at `/dashboard/models`. The control plane populates capabilities from:
- Provider API model metadata
- Known model family defaults (GPT-5.x, Claude, o-series)
- Manual operator overrides in the models table

## Dashboard Pages

| Page | URL | What it shows |
|------|-----|---------------|
| Evaluations | `/dashboard/evals` | Model comparison heatmap, router advantage, per-domain best model |
| Provider Reputation | `/dashboard/reputation` | Bayesian posteriors per provider×domain, confidence intervals |
| AI Spend & Savings | `/dashboard/finops` | Per-department cost attribution, savings from routing |
| App Endpoints | `/dashboard/endpoints` | Named endpoint configurations with pinned models/providers |

## Shadow Routing

Shadow routing sends a percentage of production traffic to a comparison model for quality evaluation without affecting the primary response.

### Configuration

Shadow routing is configured in the router settings under `[shadow_routing]` (`config/router.toml`, or `SCORPION_ROUTER_SHADOW_ROUTING__*` env overrides). It applies to non-streaming requests only, because quality scoring needs the full response:

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | false | Master switch |
| `sample_rate_pct` | 2.0 | % of requests to shadow (0-100) |
| `daily_budget_usd` | 10.0 | Max daily spend on shadow requests |
| `shadow_model` | null | Model for comparison (null = second-best candidate) |
| `use_judge` | false | Use LLM-as-judge for comparison (vs heuristic) |

### How it works

1. For each request, with probability `sample_rate_pct`, a shadow model is selected
2. The primary response is returned to the client immediately
3. The shadow request runs asynchronously
4. Both responses are evaluated (judge or heuristic)
5. Results feed into task-type posteriors, updating reputation scores
6. Budget is tracked atomically — exhaustion stops shadowing

Shadow results are never visible to the client.

## Creating Custom Benchmark Packs

To create a domain-specific benchmark pack for your organisation:

1. Create a JSON file matching the benchmark case schema (see format above)
2. Place it in `verification/datasets/benchmark_packs/`
3. Ensure each case has a unique `case_id`
4. Include `constraints` relevant to your operating environment
5. Provide either `reference` answers (for exact match) or `judge_rubric` (for LLM-as-judge scoring)

### Best practices

- Start with 50-100 cases per domain. More is better but quality matters more than quantity.
- Include a mix of difficulties (1-5) to test model capability range.
- Include constraint-relevant cases — test behavior under latency and cost limits.
- Tag cases with `routing_tags` so the eval system can test capability filtering.
- Use real examples from your business domain, not academic toy problems.
