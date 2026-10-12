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

M5 (`jim_m5`, Tailscale 100.74.85.107) is connected as verified from current VM receiver snapshots on 12 October 2026. JW-MBP and M5 have current repository sessions; codex-dev and claude-dev collectors are reachable with no recent repository sessions at that check. Connection status remains separate from task status. The read-only bridge and SSH configuration were preserved.

The optional durable API candidate is documented in [activity ingestion](activity-ingestion.md). Existing snapshot collection continues during migration. Native hooks are opt-in and capability checked; deployment/provider status is recorded in the private operator report.

## Operations

VM: `systemctl --user status ariadne-agent-refresh.timer ariadne-agent-refresh.service`; logs in `journalctl --user -u ariadne-agent-refresh.service`. Mac: `launchctl print gui/$(id -u)/com.scorpionlabs.ariadne-agent-bridge`; bridge/error logs live in the private installation directory. User services persist across VM restart and Mac login.

Stop only telemetry: disable the VM agent refresh timer and boot out the Mac bridge LaunchAgent. The GitHub view remains available. Source metadata stays on the private VM console and is not copied into `scorpion-public` or the public homepage.

## Validation

Five Python lifecycle/privacy/scope tests and two focused TypeScript integration tests pass, as do TypeScript check/build. The current live Codex turn was collected from its real session log and rendered on the VM before any matching PR. Claude's collector remains fixture-tested; source access is now verified. A real new Claude run still requires live evidence before claiming current activity.
