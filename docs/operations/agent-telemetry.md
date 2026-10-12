# Private live agent telemetry

The console reads `integrations/agents/*.json` alongside existing GitHub snapshots. Each host reports Claude/Codex sessions, bounded task labels and latest Codex status updates, repository/workspace, branch, changed filenames, last tool name, last event, session ID and collection time. Full transcripts, code contents, tool arguments, environment and authentication files are not transmitted. Status updates are bounded, escaped and credential patterns are redacted. Personal sessions outside the configured workspace and allowed jxwalker repositories are excluded.

## Sources and state

- Codex: a read-only session registry and bounded rollout log window. Explicit `task_started`, matching `task_complete` and `turn_aborted` events drive working/idle/interrupted state. A child completion cannot close its parent turn. Desktop session names are preferred as task labels.
- Claude: local session metadata, tool-use/result events, end-turn markers and stop-hook summaries. This collector does not add hooks or alter Claude execution. Its lifecycle meaning is checked against [Claude Code's official hooks reference](https://code.claude.com/docs/en/hooks).
- An unmatched start without activity for three minutes becomes stale, not idle. A disconnected or stale collector cannot display a session as currently working. Long quiet tool calls can therefore become stale until the next event.
- Missing lifecycle markers are unknown. Unavailable hosts do not imply their agents are idle.
- Branch association is compared to collected open PR evidence; absence of a match is not proof that no PR exists outside that collection.

## Current installation, 12 October 2026

JW-MBP runs `com.scorpionlabs.ariadne-agent-bridge` every 30 seconds, using `/opt/homebrew/bin/python3`, under `~/Library/Application Support/Scorpion Labs/Ariadne`. `bridge.json` maps this projectless Scorpion Labs workspace and uses the existing `codex-dev` LAN SSH alias. Existing agent logs are only read.

The VM runs `ariadne-agent-refresh.timer` every 30 seconds after the previous refresh completes. It collects its own Codex sessions, reads private incoming snapshots and regenerates the `scorpion-labs` console. The portfolio page refreshes every 30 seconds. GitHub collection still runs independently every five minutes. End-to-end latency can span two or three of these intervals.

M5 (`jim_m5`, Tailscale 100.74.85.107) is identified but remains unconnected: existing-key SSH attempts were rejected, including through the VM. The bridge has an explicit unconfigured M5 entry and the console reports authentication required. It must not be called live M5 tracking until a valid login and permitted key are provided and the actual sessions are verified.

To complete M5 connection, verify its login (`whoami` on that Mac), establish authorized SSH access, install the read-only `agent_telemetry.py` under an installer-owned path, then configure the M5 `sshTarget`, `python`, `collectorPath`, and (if needed) `jumpHost: codex-dev` in `bridge.json`. Preserve existing Claude/Codex settings. The bridge safely quotes installed paths including spaces. Never copy API tokens or raw agent logs.

## Operations

VM: `systemctl --user status ariadne-agent-refresh.timer ariadne-agent-refresh.service`; logs in `journalctl --user -u ariadne-agent-refresh.service`. Mac: `launchctl print gui/$(id -u)/com.scorpionlabs.ariadne-agent-bridge`; bridge/error logs live in the private installation directory. User services persist across VM restart and Mac login.

Stop only telemetry: disable the VM agent refresh timer and boot out the Mac bridge LaunchAgent. The GitHub view remains available. Source metadata stays on the private VM console and is not copied into `scorpion-public` or the public homepage.

## Validation

Five Python lifecycle/privacy/scope tests and two focused TypeScript integration tests pass, as do TypeScript check/build. The current live Codex turn was collected from its real session log and rendered on the VM before any matching PR. Claude's adapter is fixture-tested; a current M5 Claude session has not yet been verified because access is blocked.
