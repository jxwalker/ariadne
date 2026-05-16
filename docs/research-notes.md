# Research Notes

These notes capture external references that shape the roadmap. They are not executable contracts.

## Harness Engineering

Martin Fowler/Birgitta Bockeler's harness engineering article frames coding-agent reliability as a system of feedforward guides and feedback sensors. The useful distinctions for this repo are:

- computational controls: deterministic checks such as tests, type checks, static analysis, artifact validation, and Playwright
- inferential controls: semantic review such as CodeRabbit, architecture review, LLM judges, and human review
- regulation categories: maintainability, architecture fitness, and behavior
- harness templates: reusable bundles of guides and sensors for common project topologies

Reference: https://martinfowler.com/articles/harness-engineering.html

## Hermes

Hermes Agent is relevant because it already includes memory, scheduled automation, multi-backend terminal execution, subagents, and a gateway model. The integration lesson is to treat Hermes as a runtime/supervisor and preserve `ariadne` as the evidence/control layer.

Reference: https://github.com/NousResearch/hermes-agent

## Hermes Web UI

Hermes Web UI shows useful console primitives: chat sessions, scheduled jobs, usage analytics, profile isolation, skills, memory, logs, web terminal, and a BFF layer over the Hermes gateway. The relevant design pattern is the BFF/console reading runtime state while respecting profile and credential boundaries.

Reference: https://github.com/EKKOLearnAI/hermes-web-ui

## Mission Control

OpenClaw Mission Control is useful as an operations-surface reference: boards, tasks, agents, gateways, approvals, audit timeline, and API-backed automation share one object model. The relevant design pattern is not its exact implementation, but its governance-first UI/API model.

Reference: https://github.com/abhi1693/openclaw-mission-control

## GBrain

GBrain is relevant as a memory/search substrate: it exposes CLI and MCP surfaces, supports hybrid retrieval and graph-style links, and includes eval capture/replay concepts. Ariadne should use it as a derived index over Ariadne artifacts, not as the canonical source for approvals, gates, or deployment state.

Reference: https://github.com/garrytan/gbrain

## Design Consequence

The Ariadne Console should start as a read-only vault viewer with:

- evidence lineage
- gate status
- task/run state
- review and approval status
- infrastructure topology
- evaluation trends

Mutation controls should come later, after the approval and rollback contract is implemented.
