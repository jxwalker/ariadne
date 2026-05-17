# Live Evidence Promotion

Project: ariadne
Target: deployment
Title: Atlas Qwen runtime canary evidence
Status: promoted_for_operator_review
Generated: 2026-05-17T23:37:04.509Z
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This record promotes sanitized summaries from local live artifacts for operator review. It does not import operator evidence, approve mutation, grant live-adapter authority, or include private endpoint URLs.

## Summary

- Sources: 2
- Parsed sources: 2
- Redacted values: 2
- Notes: Read-only runtime canary against Atlas qwen3.6-35b-a3b-nvfp4-atlas plus blocked smoke summary; promotion remains review-only.

## Sources

| Source | Kind | Parsed | Bytes | SHA-256 | Redactions |
| --- | --- | --- | ---: | --- | ---: |
| projects/ariadne/infrastructure/runtime/local-runtime-probe-2026-05-17T23-36-40-581Z.json | local-runtime-probe | true | 5331 | 69f19e1a7386be7d1187167f3ef602b34b0249a07f097ea31abcf4d657cc86f6 | 1 |
| projects/ariadne/evaluation/e2e-smoke-2026-05-17T23-36-40-560Z.json | e2e-smoke | true | 4804 | 7e9af32ddbf13aac82f55e56100a8393e78bc237e8ba3c4ad0cccc3dfa54cc8c | 1 |

## Sanitized Summaries

### Source 1: local-runtime-probe

```json
{
  "generatedAt": "2026-05-17T23:36:40.581Z",
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

### Source 2: e2e-smoke

```json
{
  "generatedAt": "2026-05-17T23:36:40.560Z",
  "status": "blocked",
  "summary": {
    "steps": 12,
    "passed": 11,
    "blocked": 1,
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
      "detail": "51 present, 0 required missing."
    },
    {
      "status": "blocked",
      "detail": "6 passed, 3 blocked."
    }
  ]
}
```
