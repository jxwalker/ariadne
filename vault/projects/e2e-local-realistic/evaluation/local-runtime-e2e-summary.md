# Local Runtime E2E Summary

Generated: 2026-05-17T10:45:20Z

This run exercised Ariadne's deterministic benchmark pipeline and local runtime evidence path on the Mac.

## Pipeline

- Smoke benchmark: passed, 13/13 steps, 0 missing required artifacts.
- Realistic benchmark: passed, 19/19 steps, 0 missing required artifacts.
- Stress benchmark: passed, 29/29 steps across 2 target projects, 0 missing required artifacts.

## Local Runtime

- Hermes dashboard: running at `http://127.0.0.1:9119`.
- Hermes gateway: running under launchd.
- Hermes cron: reachable, 0 scheduled jobs in the local snapshot.
- DS4 OpenAI-compatible endpoint: running at `http://127.0.0.1:8000/v1`, model `deepseek-v4-flash`.
- Ollama endpoint: running at `http://127.0.0.1:11434`, models `qwen3.5:35b-a3b-coding-nvfp4` and `qwen3.5:35b`.
- LM Studio CLI: installed, server off during this run.

## Local Model Canaries

- DS4 chat-completions canary reached the model and returned token accounting: 48 total tokens.
- Ollama generate canary reached the model and returned token accounting: 23 total tokens.
- Both local model exact-output canaries were marked `reachable_degraded_semantics` because reasoning-mode defaults consumed the tiny output budget before producing the requested exact string.

## Evidence

- Runtime deployment snapshot: `deployment/deployment-mac-2026-05-17T10-45-18-335Z.json`.
- Local model usage report: `evaluation/usage-report.json`.
- Hermes cron snapshot and proposal: `coordination/hermes/`.
