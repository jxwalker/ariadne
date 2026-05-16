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
  hygieneReportPath?: string;
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
  allowSecretFindings?: boolean;
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

export interface CheckRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  name: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  evidence?: string;
}

export interface ReviewRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  source: "human" | "coderabbit" | "ci" | "local";
  status: "approved" | "changes_requested" | "pending" | "failed" | "passed";
  summary: string;
  evidence?: string;
}

export interface SecretFinding {
  kind: string;
  severity: "low" | "medium" | "high";
  line: number;
  evidence: string;
}

export interface SourceHygieneReport {
  schemaVersion: 1;
  sourcePath: string;
  scannedAt: string;
  status: "clean" | "warning" | "blocked";
  findings: SecretFinding[];
}

export interface NotebookLmImport {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  sourcePath: string;
  title: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
  citations: Array<{
    marker: string;
    text: string;
  }>;
}

export interface DecisionRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  title: string;
  status: "proposed" | "accepted" | "superseded";
  context: string;
  decision: string;
  consequences: string[];
  sourceRefs: string[];
}

export interface WorktreeGuardReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  runId: string;
  apply: boolean;
  status: "ready" | "created" | "blocked";
  checks: Array<{
    name: string;
    status: "passed" | "failed";
    detail: string;
  }>;
}

export interface PlaywrightEvidenceRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  targetUrl: string;
  status: "passed" | "failed" | "skipped";
  tracePath?: string;
  screenshotPath?: string;
  notes?: string;
}

export interface InfraSnapshot {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  sourcePath: string;
  snapshotKind: "manual" | "manifest" | "live_read_only";
  summary: Record<string, unknown>;
  raw: unknown;
}

export interface OpenScorpionActivityDraft {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  title: string;
  activityType: string;
  evidenceRefs: string[];
  payload: Record<string, unknown>;
  submit: false;
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

export interface EvaluationPlan {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  target: string;
  dimensions: Array<{
    id: string;
    title: string;
    weight: number;
    sensors: string[];
    successSignals: string[];
  }>;
  scenarios: Array<{
    id: string;
    title: string;
    description: string;
    taskIds: string[];
    expectedEvidence: string[];
  }>;
}

export interface EvaluationRun {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  planPath: string;
  target: string;
  operator: string;
  overallScore: number;
  dimensionScores: Array<{
    id: string;
    score: number;
    notes: string;
  }>;
  evidenceRefs: string[];
  regressions: string[];
  recommendations: string[];
}

export interface ArtifactCheckReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "passed" | "missing";
  summary: {
    required: number;
    optional: number;
    present: number;
    missingRequired: number;
  };
  checks: Array<{
    id: string;
    label: string;
    required: boolean;
    path: string;
    status: "present" | "missing";
    count?: number;
    matches?: string[];
  }>;
}

export interface ConsoleData {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  projectDir: string;
  summary: {
    sources: number;
    requirements: number;
    tasks: number;
    executionRuns: number;
    checks: number;
    reviews: number;
    decisions: number;
    evaluations: number;
    infraSnapshots: number;
    readinessStatus?: ControlReport["status"];
    latestEvaluationScore?: number;
  };
  sources: Array<{
    id: string;
    fileName: string;
    kind: SourceKind;
    sensitivity: IngestRecord["sensitivity"];
    sha256: string;
    ingestedAt: string;
    hasExtractedText: boolean;
    hasHandoff: boolean;
    hygieneStatus?: SourceHygieneReport["status"];
  }>;
  requirements: Requirement[];
  tasks: Array<GsdTask & { milestoneId: string; milestoneTitle: string }>;
  executionRuns: ExecutionRun[];
  checks: CheckRecord[];
  reviews: ReviewRecord[];
  decisions: DecisionRecord[];
  playwrightEvidence: PlaywrightEvidenceRecord[];
  evaluations: EvaluationRun[];
  infrastructure: {
    registry?: InfraRegistry;
    snapshots: InfraSnapshot[];
  };
  readiness?: ControlReport;
  artifacts: {
    hotIndex?: string;
    prd?: string;
    roadmap?: string;
    control?: string;
    evaluationPlan?: string;
    artifactChecks?: string;
  };
}
