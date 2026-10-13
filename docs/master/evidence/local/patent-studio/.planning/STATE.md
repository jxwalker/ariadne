# Project state pointer

**Status:** Active planning is governed by [`CANONICAL.md`](CANONICAL.md).

This file remains for tools and agents that look for `.planning/STATE.md`. It
does not maintain a second release status or backlog.

## Current state

- Current `main`: resolve with `git fetch origin` and
  `git rev-parse origin/main` before any release or branch operation.
- Public-beta gate state: [`../docs/PUBLIC_BETA_CHECKLIST.md`](../docs/PUBLIC_BETA_CHECKLIST.md).
- Exact release evidence: [`../docs/BETA_TODO.md`](../docs/BETA_TODO.md) plus
  the private release packet.
- Current UX and style contract: [`../docs/UX_GUIDE.md`](../docs/UX_GUIDE.md)
  and [`../docs/STYLE_GUIDE.md`](../docs/STYLE_GUIDE.md).
- Current product work queue: [`../docs/delivery/README.md`](../docs/delivery/README.md)
  (program `*-backlog.md` files). This file is not that queue.
- Current UI surface evidence:
  [`../design/north-star-ui/SURFACE-TRACKER.md`](../design/north-star-ui/SURFACE-TRACKER.md).
- Current architecture: [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md).

The current registration decision and rollback rules are owned by
[`../docs/decisions/PUBLIC_BETA_REGISTRATION.md`](../docs/decisions/PUBLIC_BETA_REGISTRATION.md).
Follow the exact-SHA UAT-first release rules until the public-beta checklist
explicitly changes the release level.
