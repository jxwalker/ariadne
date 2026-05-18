# Live Evidence Promotion

Project: ariadne
Target: deployment
Title: Atlas e2e smoke and runtime evidence
Status: promoted_for_operator_review
Generated: 2026-05-18T08:36:20.265Z
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This record promotes sanitized summaries from local live artifacts for operator review. It does not import operator evidence, approve mutation, grant live-adapter authority, or include private endpoint URLs.

## Summary

- Sources: 2
- Parsed sources: 2
- Redacted values: 2
- Notes: End-to-end smoke passed 11 checks and correctly blocked 2 operator-gated roadmap checks; Atlas canary remained reachable with qwen3.6-35b-a3b-nvfp4-atlas. Raw endpoint URL remains local-only and redacted.

## Sources

| Source | Kind | Parsed | Bytes | SHA-256 | Redactions |
| --- | --- | --- | ---: | --- | ---: |
| projects/ariadne/evaluation/e2e-smoke-2026-05-18T08-35-24-172Z.json | e2e-smoke | true | 5685 | 44fda2e4768b3f58ff122d9bf144d6ea2b5b42b6195cdde986df2b9c10bfb6f9 | 1 |
| projects/ariadne/infrastructure/runtime/local-runtime-probe-2026-05-18T08-35-24-190Z.json | local-runtime-probe | true | 5325 | 9ee162b68c10d7a0169fdbd680e503a41419a98b594eb56155ff5f865a0ad5f6 | 1 |

## Sanitized Summaries

### Source 1: e2e-smoke

```json
{
  "generatedAt": "2026-05-18T08:35:24.172Z",
  "status": "blocked",
  "summary": {
    "steps": 13,
    "passed": 11,
    "blocked": 2,
    "degraded": 0,
    "failed": 0
  },
  "steps": [
    {
      "status": "passed",
      "detail": "7 task(s) exported for downstream runners."
    },
    {
      "status": "passed",
      "detail": "7 scenario(s) planned for <redacted-url>"
    },
    {
      "status": "passed",
      "detail": "6 host(s), 2 runner pool(s), 3 model endpoint(s)."
    },
    {
      "status": "passed",
      "detail": "Merge-readiness status ready; 0 missing item(s)."
    },
    {
      "status": "passed",
      "detail": "6 passed, 0 warnings, 0 failed."
    },
    {
      "status": "passed",
      "detail": "8 reachable, 0 degraded, 0 unreachable, 13 models."
    },
    {
      "status": "passed",
      "detail": "actions_required; 0 audit-passed, 5 missing, 0 repairable, 1 operator-action-required, 0 blocked."
    },
    {
      "status": "passed",
      "detail": "Rendered console with readiness ready."
    },
    {
      "status": "passed",
      "detail": "32 passed, 0 failed."
    },
    {
      "status": "passed",
      "detail": "10 passed, 0 failed at 1440x1100."
    },
    {
      "status": "passed",
      "detail": "57 present, 0 required missing."
    },
    {
      "status": "blocked",
      "detail": "6 passed, 3 blocked."
    },
    {
      "status": "blocked",
      "detail": "3 roadmap blocker(s), 42 GBrain document(s), next target deployment."
    }
  ]
}
```

### Source 2: local-runtime-probe

```json
{
  "generatedAt": "2026-05-18T08:35:24.190Z",
  "mode": "read_only_with_canary",
  "summary": {
    "services": 8,
    "reachable": 8,
    "degraded": 0,
    "unreachable": 0,
    "models": 13,
    "usageRecords": 1,
    "warnings": []
  },
  "hermes": {
    "dashboard": {
      "id": "hermes-dashboard",
      "url": "<redacted>",
      "status": "reachable",
      "httpStatus": 200,
      "detail": "HTTP endpoint responded."
    },
    "statusCommand": {
      "command": "hermes status",
      "status": "reachable",
      "exitCode": 0,
      "stdoutPreview": "┌─────────────────────────────────────────────────────────┐ │ ⚕ Hermes Agent Status │ └─────────────────────────────────────────────────────────┘ ◆ Environment Project: <HOME>/.hermes/hermes-agent Python: 3.11.15 .env file: ✓ exists Model: anthropic/claude-opus-4.6 Provider: Auto",
      "stderrPreview": "<HOME>/.hermes/hermes-agent/hermes_cli/config.py:4132: EncodingWarning: 'encoding' argument not specified with open(env_path, **open_kw) as f: <HOME>/.hermes/hermes-agent/hermes_cli/auth.py:896: EncodingWarning: 'encoding' argument not specified with lock_path.open(\"r+\" if msvcrt",
      "detail": "Command completed."
    },
    "doctorCommand": {
      "command": "hermes doctor",
      "status": "reachable",
      "exitCode": 0,
      "stdoutPreview": "┌─────────────────────────────────────────────────────────┐ │ 🩺 Hermes Doctor │ └─────────────────────────────────────────────────────────┘ ◆ Python Environment ✓ Python 3.11.15 ✓ Virtual environment active ◆ Required Packages ✓ OpenAI SDK ✓ Rich (terminal UI) ✓ python-dotenv ✓ ",
      "stderrPreview": "<HOME>/.hermes/hermes-agent/hermes_cli/doctor.py:592: EncodingWarning: 'encoding' argument not specified with open(config_path) as f: <HOME>/.hermes/hermes-agent/hermes_cli/auth.py:896: EncodingWarning: 'encoding' argument not specified with lock_path.open(\"r+\" if msvcrt else \"a+",
      "detail": "Command completed."
    },
    "gatewayCommand": {
      "command": "hermes gateway status",
      "status": "reachable",
      "exitCode": 0,
      "stdoutPreview": "Launchd plist: <HOME>/Library/LaunchAgents/ai.hermes.gateway.plist ✓ Service definition matches the current Hermes install ✓ Gateway service is loaded { \"StandardOutPath\" = \"<HOME>/.hermes/logs/gateway.log\"; \"LimitLoadToSessionType\" = \"Aqua\"; \"StandardErrorPath\" = \"<HOME>/.hermes",
      "stderrPreview": "<HOME>/.hermes/hermes-agent/gateway/status.py:221: EncodingWarning: 'encoding' argument not specified raw = pid_path.read_text().strip() <HOME>/.hermes/hermes-agent/gateway/status.py:116: EncodingWarning: 'encoding' argument not specified return int(stat_path.read_text().split()[",
      "detail": "Command completed."
    }
  },
  "modelEndpoints": [
    {
      "id": "ollama",
      "kind": "ollama",
      "status": "reachable",
      "models": 2
    },
    {
      "id": "ds4-openai",
      "kind": "openai-compatible",
      "status": "reachable",
      "models": 1
    },
    {
      "id": "lmstudio",
      "kind": "openai-compatible",
      "status": "reachable",
      "models": 9
    },
    {
      "id": "atlas",
      "kind": "openai-compatible",
      "status": "reachable",
      "models": 1,
      "canaryStatus": "passed",
      "canaryModel": "qwen3.6-35b-a3b-nvfp4-atlas"
    }
  ]
}
```
