# Live Read-Only Infrastructure Snapshot: e2e-local-realistic

Kind: live_read_only
Imported: 2026-05-17T10:45:20.668Z
Source: <LIVE_READ_ONLY>/local-host

## Summary

```json
{
  "collector": "local-node-os",
  "mode": "read_only",
  "host": "local-host",
  "platform": "darwin",
  "arch": "arm64",
  "cpuCount": 18,
  "totalMemoryGiB": 128,
  "networkInterfaces": 16,
  "notes": "Local Ariadne e2e runtime probe with Hermes dashboard/gateway, DS4, and Ollama."
}
```

## Safety

- Collector uses read-only inventory commands.
- Hostname and SSH target are hashed when present.
- Network and MAC addresses are omitted.
- No remote host, infrastructure, repository, or deployment mutation is attempted.
