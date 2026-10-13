# Operator responses in Needs you

An opted-in signed source can supply a recommendation alongside an explicit question.
The dashboard labels this as the agent's suggestion. It does not pretend that a rule-based
CI investigation link is a newly generated LLM fix. Existing agent recommendations are
used without adding a model provider or sending repository context to another service.

James can confirm the suggestion in one click, or choose/edit a response. This records a
decision through `master.command`; it does not merge, deploy, retry CI, provision access,
accept work or approve a baseline. Those actions retain their existing execution gates.

The private loopback service uses its existing Tailscale Serve identity. Enable only
James's existing login in protected server configuration:

```json
{"operatorActions":{"enabled":true,"origin":"https://codex-dev.tail7b3a3b.ts.net","allowedLogins":["EXISTING_OPERATOR_LOGIN"],"allowedClientIPs":["EXISTING_OPERATOR_MAC_TAILNET_IP"]}}
```

The response route requires that exact identity from an explicitly selected operator Mac,
a fresh same-origin CSRF token, the
current signed question revision and a command UUID. Source credentials cannot submit
responses. The public ingest-only listener exposes no operator session or response route.
Same-uid processes on the server remain trusted, as documented for the Phase 1 CLI;
Serve identity headers do not isolate a compromised local process.

Responses include the actor, transport, original source/run/question/revision, recommendation
and actual answer. Duplicate clicks are safe; competing answers cannot overwrite the first.
A changed question needs a new response. The original signed evidence is never rewritten.

Authenticated signed report receipts return `operatorDecisions` only for that exact source,
repository and run. No public query API is introduced. Updated senders preserve these in
the protected spool file `.operator-decisions.json.state`. A harness should deduplicate by
`commandId`, check the request revision, process the response within its existing authorization,
and report its subsequent progress or blocker. Delivery availability is distinct from bot
acknowledgement and execution. Phase 2 remains responsible for general agent ledger writes.

Resolved master decisions remain authoritative regardless of their origin. Re-emitting a resolved request ID cannot reopen or overwrite it; an amended question must use a new request ID. Exact duplicate submissions remain idempotent.
