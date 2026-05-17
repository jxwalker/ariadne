import { writeJsonArtifact, writeTextArtifact } from "./artifacts.js";
import { slugifyProject } from "./paths.js";
import type { InfraRegistry } from "./types.js";

interface GenerateInfraOptions {
  project: string;
  vaultRoot: string;
}

export async function generateInfrastructureRegistry(options: GenerateInfraOptions): Promise<{
  jsonPath: string;
  markdownPath: string;
  registry: InfraRegistry;
}> {
  const project = slugifyProject(options.project);
  const registry: InfraRegistry = {
    schemaVersion: 1,
    project,
    generatedAt: new Date().toISOString(),
    hosts: [
      {
        id: "m1-hermes",
        label: "M1 Mac mini",
        role: "always-on Hermes supervisor",
        notes: "Control-plane host for long-running supervision; verify live details before automation."
      },
      {
        id: "m1-max",
        label: "M1 Max",
        role: "local development and testing",
        notes: "Apple Silicon development machine; use for local validation where available."
      },
      {
        id: "m5-max",
        label: "M5 Max",
        role: "high-memory local agent workstation",
        notes: "Primary Mac-class local execution surface mentioned by user."
      },
      {
        id: "dgx-spark",
        label: "DGX Spark",
        role: "local inference and memory-heavy workloads",
        notes: "Treat as planned/observed only until live endpoint inventory exists."
      },
      {
        id: "beast",
        label: "Proxmox dev server",
        role: "runners, services, model endpoints, infrastructure substrate",
        notes: "Read-only inventory first; Proxmox live state is authoritative at execution time."
      },
      {
        id: "atlas-node",
        label: "Atlas model host",
        role: "fast OpenAI-compatible local model endpoint",
        notes: "Use local-runtime-probe --atlas-url for the actual LAN or Tailscale address; registry keeps a neutral endpoint alias."
      }
    ],
    modelEndpoints: [
      {
        id: "openscorpion-router",
        hostId: "beast",
        kind: "governed model route",
        url: "http://localhost:8080",
        status: "planned"
      },
      {
        id: "dgx-local-models",
        hostId: "dgx-spark",
        kind: "local inference",
        status: "planned"
      },
      {
        id: "atlas-local-models",
        hostId: "atlas-node",
        kind: "openai-compatible",
        url: "http://atlas.local:8888/v1",
        status: "observed"
      }
    ],
    runnerPools: [
      {
        id: "trusted-private-runners",
        hostId: "beast",
        scope: "private jxwalker project repositories",
        trustBoundary: "persistent self-hosted runners only for trusted private repositories",
        status: "planned"
      },
      {
        id: "public-repo-safe-path",
        hostId: "beast",
        scope: "public repositories",
        trustBoundary: "manual or ephemeral approval path; no untrusted public PRs on persistent runners",
        status: "planned"
      }
    ]
  };

  const jsonPath = await writeJsonArtifact(options.vaultRoot, project, "infrastructure", "registry.json", registry);
  const markdownPath = await writeTextArtifact(
    options.vaultRoot,
    project,
    "infrastructure",
    "runner-and-model-plan.md",
    renderInfrastructurePlan(registry)
  );

  return { jsonPath, markdownPath, registry };
}

function renderInfrastructurePlan(registry: InfraRegistry): string {
  return [
    `# Infrastructure Registry: ${registry.project}`,
    "",
    `Generated: ${registry.generatedAt}`,
    "",
    "## Hosts",
    "",
    ...registry.hosts.map((host) => `- ${host.id}: ${host.label} - ${host.role}. ${host.notes}`),
    "",
    "## Model Endpoints",
    "",
    ...registry.modelEndpoints.map(
      (endpoint) => `- ${endpoint.id}: ${endpoint.kind} on ${endpoint.hostId} (${endpoint.status})`
    ),
    "",
    "## Runner Pools",
    "",
    ...registry.runnerPools.map(
      (pool) => `- ${pool.id}: ${pool.scope} on ${pool.hostId}. Boundary: ${pool.trustBoundary}.`
    ),
    "",
    "## Rules",
    "",
    "- No Proxmox mutation in this slice.",
    "- No runner registration from registry generation.",
    "- Live inventory must be collected before placement decisions are treated as current.",
    "- OpenScorpion remains the governed model/evidence route for model-assisted planning.",
    ""
  ].join("\n");
}
