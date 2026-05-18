# Live Evidence Promotion

Project: ariadne
Target: deployment
Title: Atlas deployment runtime evidence 2026-05-18
Status: promoted_for_operator_review
Generated: 2026-05-18T14:53:28.810Z
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Rule

This record promotes sanitized summaries from local live artifacts for operator review. It does not import operator evidence, approve mutation, grant live-adapter authority, or include private endpoint URLs.

## Summary

- Sources: 1
- Parsed sources: 1
- Redacted values: 1

## Sources

| Source | Kind | Parsed | Bytes | SHA-256 | Redactions |
| --- | --- | --- | ---: | --- | ---: |
| projects/ariadne/infrastructure/runtime/local-runtime-probe-2026-05-18T14-53-07-316Z.json | local-runtime-probe | true | 5325 | ab211389a5868763f69b3bc63384947687883c9fd8f389cf7966a334311f112f | 1 |

## Sanitized Summaries

### Source 1: local-runtime-probe

```json
{
  "generatedAt": "2026-05-18T14:53:07.316Z",
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
