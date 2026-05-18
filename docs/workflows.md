# Ariadne Workflows

Ariadne is used through a small set of human workflows, not by memorising every runner command.

## Interaction Model

The primary human surface is the Ariadne Console. It shows the project journey, the current blocking gate, the evidence chain, verification state, review state, and operations substrate.

The same workflow state is part of `console/console-data.json` under `workflow`. UI surfaces should consume that typed contract instead of scraping the rendered HTML or re-deriving next actions independently.

Hermes is the long-running runtime layer: scheduling, sleep routines, memory reviews, sessions, mail, and background coordination. Hermes should feed Ariadne evidence and receive reviewed work from Ariadne, but it is not the only operator interface.

NotebookLM is a research and source-grounding tool. Its reviewed exports enter Ariadne as preserved source material.

GBrain is advisory semantic memory. Ariadne can export evidence for indexing and import GBrain reports, but GBrain output does not become approval, verification, or operator proof by itself.

The `ariadne` runner is the expert and automation surface. Guided users should normally start from the console and follow the next action. Experienced developers can use the runner directly when they already know which artifact they need to refresh.

For terminal use, `ariadne guide --project <project>` is the front door. It reads the same `workflow` contract as the console and prints the current mode, surface split, workflow lane, and progressive Next Best Action steps. Guided mode hides commands; `--mode developer`, `--mode operator`, or `--show-commands` reveals the runner details for experienced users.

## Operator Interaction Modes

The console exposes the interaction model as `workflow.modes` so a UI can route users without showing every command at once.

| Mode | Primary surface | Who it is for | Command exposure |
| --- | --- | --- | --- |
| Guided | Ariadne Console | first-time coders and anyone who wants one safe next step | hidden by default |
| Developer | Ariadne Console plus `ariadne` runner | experienced builders working a bounded slice | shown as needed |
| Operator | Ariadne Console plus evidence packets | humans reviewing external-system evidence | expert |
| Automation | Hermes | sleep, memory, mail, scheduled refreshes, and background coordination | background only |

The important rule is simple: Hermes runs routines, but Ariadne remains the evidence cockpit and approval gate. NotebookLM and GBrain provide research and memory context; they do not approve work, verify behavior, or grant mutation authority.

`workflow.routes` is the higher-level route map for overloaded users. It collapses the system into four canonical paths: idea to working system, implementation slice, operator evidence gate, and sleep/memory automation loop. The current route is marked in the data and UI, so a user can ignore unrelated commands until the route changes.

## User Modes

### Guided Developer

Use this mode for first-time coders or anyone who wants Ariadne to reduce choices.

1. Add idea material: notes, NotebookLM exports, drawings, dictated transcripts, screenshots, white papers, or architecture docs.
2. Open the console and read the workflow lane from Capture through Operate.
3. Follow the Next Best Action panel.
4. Treat generated PRDs, tasks, and implementation plans as drafts until their source links and acceptance criteria are clear.
5. Stop at human review gates instead of approving mutation from generated text.

### Working Developer

Use this mode when building a feature or fixing a system.

1. Refresh the source and planning spine.
2. Work in a small branch or worktree slice.
3. Run deterministic checks locally.
4. Capture UI evidence with Playwright when the work has a user interface.
5. Import CI, review-bot, GitHub, and local runtime evidence.
6. Use the console to decide whether the slice is ready, blocked, or needs repair.

### Operator

Use this mode when Ariadne is close to changing an external system.

1. Review the live-adapter target packet.
2. Fill the operator evidence workspace from real systems, not from generated summaries.
3. Run preflight checks on the filled evidence.
4. Import only evidence that passes preflight.
5. Record packet review and approval separately.
6. Run dry-run and live mutation only when the approved plan, dry-run, rollback, and exact confirmation all match.

## End-To-End Journey

### 1. Capture The Idea

Raw inputs are preserved first. Ariadne should keep the original file, hash it, and only then create extracted text or summaries.

Common inputs:

- NotebookLM export
- white paper
- dictated notes
- screenshot
- drawing or whiteboard photo
- architecture document
- issue thread or review notes

Console stage: `Capture`.

### 2. Shape The Work

Ariadne turns evidence into a dossier, PRD, GSD tasks, acceptance criteria, and ambiguity lists. This is where a vague idea becomes a bounded implementation slice.

Console stage: `Shape`.

### 3. Build Safely

The implementation should be small enough to review. Worktree guards, task scopes, and mutation-readiness records keep the build path inspectable.

Console stage: `Build`.

### 4. Verify Deeply

Verification includes type checks, unit tests, build checks, Playwright screenshots/traces, browser-backed console checks, CI, local model/runtime probes, and benchmark/evaluation reports.

Console stage: `Verify`.

### 5. Review And Ship

Review joins human review, CodeRabbit/Grok or other reviewer evidence, GitHub state, approval records, and roadmap completion gates. Ariadne should not call a project complete because a model says it is complete; it should require current artifacts.

Console stage: `Review`.

### 6. Operate And Remember

After shipping, Ariadne records the operating state: Hermes sleep and memory routines, agent mail, leases, runtime probes, deployment snapshots, infrastructure inventory, and evaluation trends.

Console stage: `Operate`.

## Surface Responsibilities

| Surface | Role | Mutates External Systems |
| --- | --- | --- |
| Ariadne Console | Human cockpit and evidence view | No |
| Hermes | Runtime, scheduler, sleep, memory, sessions, coordination | Only through its own reviewed controls |
| NotebookLM | Source-grounded research input | Outside Ariadne; imported manually until a reviewed adapter exists |
| GBrain | Advisory semantic memory | No |
| `ariadne` runner | Artifact generation, checks, imports, expert automation | Only through approved mutation execution |
| GitHub and CI | Review, branch, PR, and status evidence | Only through approved mutation execution |

## Command Use

Commands are implementation details behind the workflows. Keep the first screen focused on the workflow lane and next action. Put dense command recipes in generated packets, developer docs, or expert command reference sections.

Use `status` as a diagnostic summary, not the main operating surface. It points to the console and `guide`, then prints only the short `operator-next` handoff and `operator-section` guide by default. `operator-next` refreshes the current packet and console, then prints the exact evidence file to fill, current section, start guidance, record location, preflight expectation, section guide command, the preflight command, and the later import command. `operator-section` is the next step when the operator wants only one missing section with start refs, GBrain advisory queries, and the exact file to edit. `status --expert` is for experienced operators who deliberately want the full command list.

When adding a new command, also decide which workflow stage it supports and whether it should appear in the console as a human next action, a supporting artifact, or expert-only detail.

## Console Data Contract

`console/console-data.json` contains:

- `workflow.stages`: the ordered Capture, Shape, Build, Verify, Review, Operate lane with status, detail, and proof refs.
- `workflow.nextAction`: the selected human next action, its source, artifact ref, and optional runner command.
- `workflow.nextAction.steps`: the progressive action plan behind the selected next action. Guided users can follow the step titles in order; experienced operators can expand the attached commands and artifact refs.
- `workflow.operatorChecklist`: the selected target's missing sections with start refs, recording location, preflight guidance, a current-section marker, advisory context counts, promoted-live-evidence counts, and GBrain query counts when operator evidence blocks the roadmap. This is a fill aid only; it does not create evidence or approve mutation.
- `workflow.routes`: the four canonical interaction routes, their audiences, primary/support surfaces, current-route marker, and route-specific steps. This is the main answer to "how does the operator interact?".
- `workflow.modes`: guided, developer, operator, and automation interaction modes with primary surface, support surfaces, command policy, and next-step guidance.
- `workflow.surfaces`: the responsibility split for Ariadne Console, Hermes, NotebookLM, GBrain, and the `ariadne` runner.

Hermes dashboards, a future live Ariadne UI, and other operator displays should read that object as the canonical workflow projection.
