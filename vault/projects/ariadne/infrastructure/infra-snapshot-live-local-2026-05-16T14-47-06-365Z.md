# Live Read-Only Infrastructure Snapshot: ariadne

Kind: live_read_only
Imported: 2026-05-16T14:47:06.365Z
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
  "notes": "Current Mac read-only local collector smoke."
}
```

## Safety

- Collector uses local read-only Node.js OS APIs.
- Hostname is hashed.
- Network and MAC addresses are omitted.
- No remote host, infrastructure, repository, or deployment mutation is attempted.
