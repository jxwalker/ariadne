# Scorecard bot attribution

Add a git trailer in the final paragraph of a commit message:

```text
Implement the change

Bot: box-ariadne-bot
```

`git interpret-trailers --trailer 'Bot: box-ariadne-bot'` can produce this convention.
Alternatively apply the exact PR label `bot:box-ariadne-bot`.
Trailer keys are case-insensitive; label prefix `bot:` and source IDs are
case-sensitive. Values must be one of the exact configured source IDs. Snapshot
importers require explicit future registration in this config; no wildcard identity
is trusted. Duplicate identical values agree; distinct values across any commit or
label conflict and remain unattributed. Unknown IDs remain unattributed. A trailer
must be in a final trailer-only paragraph. Titles and timestamps never attribute.

These are source hints only (`source-only`), never verified coverage. Without a
hint the row is `unbound`. Phase 1 has no signed event joins or canonical bindings.
