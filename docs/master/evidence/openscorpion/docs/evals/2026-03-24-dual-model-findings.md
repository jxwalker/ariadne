# Routing Intelligence Findings — 104-Request Dual-Model Eval

> **Status (2026-09-17):** historical record of the March evaluation. Findings 5
> and 6 are superseded: provider reputation and latency EWMA now persist across
> restarts (see [Feature Maturity](../FEATURE-MATURITY.md), "Live provider
> feedback"). Findings 1, 2 and 4 remain the checklist for any real-provider
> demo: decision rules must target providers that exist, and provider cost and
> latency estimates must be set.

## Test Setup
- 52 prompts × 2 models = 104 requests through full pipeline
- ONNX quality evaluator (MiniLM-L12-v2 cosine similarity)
- Models: Llama 3.1 8B (Ollama local), Nemotron Cascade 30B (vLLM remote)
- All requests with signed APCG proof bundles

## Finding 1: Decision Rules Target Unreachable Providers

The signal chain correctly fires (financial_keywords, medical_keywords, etc.) but
every decision rule targets a provider that doesn't exist locally:
- Medical → `<medical-review-approved-model-id>` (replace with an approved model ID)
- Legal → `<legal-review-approved-model-id>` (replace with an approved model ID)
- Financial → `<financial-review-approved-model-id>` (replace with an approved model ID)
- Code → `<code-review-approved-model-id>` (replace with an approved model ID)

**All 104 requests fell through to default balanced routing.** The signal
extraction is working but having zero routing effect.

**Action:** Either:
1. Add real API keys for cloud providers, or
2. Add decision rules that route to available local models:
   - Reasoning tasks → Nemotron (is_reasoning=true, better at step-by-step)
   - Quick/simple → Llama 8B (faster cold start, no reasoning overhead)
   - Code → Llama 8B (lower latency for the same quality)

## Finding 2: Models Are Quality-Equivalent — Cost Should Differentiate

| Metric | Llama 8B | Nemotron 30B |
|--------|----------|-------------|
| Avg quality | 0.918 | 0.914 |
| Avg relevance | 0.869 | 0.868 |
| Avg latency | 2,649ms | 2,606ms |

Δ quality = 0.004. The router has no basis to prefer either model on quality.

But both have `input_cost_per_million = NULL` (defaults to 0.001). The cost
dimension in `U = αQ − βC − γL + κR − χP` contributes nothing.

**Action:** Set realistic cost estimates:
- Ollama local: $0.00 (self-hosted, electricity only)
- Nemotron remote: $0.10/M (GPU amortization on remote node)

This gives the utility function signal to prefer the local model when quality
is equal, which is the correct behavior.

## Finding 3: ONNX Relevance Catches What Heuristics Miss

The heuristic evaluator scored 95%+ on nearly everything. The ONNX relevance
score ranged 0.67–0.95, providing genuine discrimination:

- `relativity to a 10-year-old`: rel=0.70 (model got verbose/tangential)
- `debug this code`: rel=0.76–0.78 (generic advice, not specific)
- `time-critical market alert`: rel=0.72 (model hedged instead of answering)
- `classified information`: rel=0.80 (disclaimer instead of content)

**Action:** The relevance score should feed into the reputation system with
higher weight. Currently `compute_overall` uses equal weights for all dimensions.
Relevance should be weighted 2x for reputation updates since it's the only
dimension that measures semantic alignment.

## Finding 4: Reasoning Models Hurt on Simple/Latency-Sensitive Queries

Nemotron scored q=0.638 on "live customer chat" — its reasoning chain leaked
into the content field (`substantive=0.2`). The model spent all tokens thinking
about the question instead of answering it.

This confirms: **reasoning models should NOT be default-routed for simple queries.**

**Action:** Add a decision rule:
```text
when complexity < "moderate" AND is_reasoning_model:
  prefer non-reasoning model
  weight_overrides: { latency: 0.5, quality: 0.3 }
```text

Or more practically: when the `real_time` signal fires, exclude providers flagged
as `is_reasoning=true` from the candidate set.

## Finding 5: The Bandit Learns Nothing Across Restarts

After 104 requests, the bandit has observed quality signals for both providers.
But all state is in-memory. On container restart, everything resets.

The proportional Beta posterior updates are working (quality → reputation), but
the posteriors die with the process. The ONNX quality scores should be persisted
in the request traces so the bandit can warm-start.

**Action:** M051/S07 — store quality scores in traces. S10 — posterior export
for fleet aggregation.

## Finding 6: Provider Latency Estimates Are Wrong

Both providers show ~2.6s average latency, dominated by LLM inference time.
But `default_latency_estimate_ms` is NULL for both. The utility function uses
200ms as default, which is 13x wrong.

**Action:** Set realistic latency estimates from observed data:
- Ollama local: 2500ms (avg from eval)
- Nemotron remote: 2500ms (avg from eval)

Or better: let the EWMA latency tracker (already in ProviderFeedback) update
the estimate automatically. It does — but only while the process is running.

## Recommended Priority

1. **Set provider costs** — 5 minutes, immediate routing improvement
2. **Add local decision rules** — route reasoning vs simple queries differently
3. **Persist quality scores in traces** (M051/S07) — enables post-hoc analysis
4. **Weight relevance higher in reputation** — makes the ONNX evaluator's
   contribution to routing decisions proportional to its discrimination power
5. **Persist reputation across restarts** — either DB or periodic ONNX export
