export type SourceKind =
  | "markdown"
  | "text"
  | "docx"
  | "pdf"
  | "image"
  | "audio"
  | "unknown";

export interface IngestRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  sourcePath: string;
  storedPath: string;
  extractedTextPath?: string;
  handoffPath?: string;
  fileName: string;
  kind: SourceKind;
  sensitivity: "public" | "internal" | "confidential" | "secret";
  sha256: string;
  bytes: number;
  ingestedAt: string;
  notes?: string;
}

export interface IngestOptions {
  project: string;
  vaultRoot: string;
  notes?: string;
  sensitivity?: IngestRecord["sensitivity"];
}

export interface DossierOptions {
  project: string;
  vaultRoot: string;
  maxCharsPerSource: number;
}

export interface ProjectStatus {
  project: string;
  projectDir: string;
  records: number;
  extracted: number;
  latestIngestedAt?: string;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  sourceRefs: string[];
  acceptance: string[];
  priority: "must" | "should" | "could";
  status: "draft" | "accepted" | "implemented" | "verified";
}

export interface PrdDocument {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  title: string;
  goals: string[];
  nonGoals: string[];
  requirements: Requirement[];
  ambiguities: string[];
  sourceDossier?: string;
}

export interface GsdTask {
  id: string;
  title: string;
  requirementIds: string[];
  slice: string;
  successCriteria: string[];
  verificationCommands: string[];
  canRunInParallel: boolean;
  writes: string[];
}

export interface GsdRoadmap {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  milestones: Array<{
    id: string;
    title: string;
    tasks: GsdTask[];
  }>;
}

export interface ExecutionRun {
  schemaVersion: 1;
  id: string;
  project: string;
  createdAt: string;
  taskIds: string[];
  repoPath?: string;
  branchPrefix: string;
  status: "planned" | "running" | "blocked" | "complete";
  gates: string[];
  worktrees: Array<{
    taskId: string;
    branch: string;
    worktreePath: string;
  }>;
  stopConditions: string[];
}

export interface PlaywrightEvidencePlan {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  targetUrl: string;
  scenarios: Array<{
    id: string;
    title: string;
    requirementIds: string[];
    assertions: string[];
  }>;
}

export interface ControlReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "blocked" | "review_required" | "ready";
  evidence: string[];
  missing: string[];
  mergeGates: string[];
}

export interface InfraRegistry {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  hosts: Array<{
    id: string;
    label: string;
    role: string;
    notes: string;
  }>;
  modelEndpoints: Array<{
    id: string;
    hostId: string;
    kind: string;
    url?: string;
    status: "planned" | "observed" | "active";
  }>;
  runnerPools: Array<{
    id: string;
    hostId: string;
    scope: string;
    trustBoundary: string;
    status: "planned" | "observed" | "active";
  }>;
}
