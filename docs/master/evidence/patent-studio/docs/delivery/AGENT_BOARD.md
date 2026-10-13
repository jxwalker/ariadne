# Agent board

The board is the set of files under [`board/`](board/): one claim file per
branch (`board/<branch-slug>.md`, slug = branch with `/` → `--`) and one note
file per note (`board/notes/<UTC>-<agent>.md`). Protocol:
[`AGENT_MESSAGING.md`](AGENT_MESSAGING.md).

To read it, render it:

```bash
scripts/agents/render_board.sh
```

This file is a fixed stub. The rendered index is not committed, because a
committed render changed on every merge and put every open pull request back
into conflict on the day the per-branch claim files landed (2026-09-08). Nothing
in this file changes when a claim is added or released, so pull requests never
conflict here.

Open PRs remain authoritative for exact file lists:
`scripts/agents/list_open_pr_files.sh`. A claim file is deleted by the pull
request that lands the work, so a claim whose PR has merged is an abandoned
branch: anyone may delete it, with a `DONE` note.
