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
  extractionResultPaths?: string[];
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

export interface ExtractionResultRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  sourceRecordId: string;
  importedAt: string;
  extractionKind: "ocr" | "transcription" | "pdf-text" | "visual-description";
  tool: string;
  confidence?: number;
  sourcePath: string;
  extractedTextPath: string;
  notes?: string;
}

export interface ExtractionRunnerPlan {
  schemaVersion: 1;
  id: string;
  project: string;
  generatedAt: string;
  sourceRecordId: string;
  sourceKind: SourceKind;
  extractionKind: ExtractionResultRecord["extractionKind"];
  tool: string;
  host: string;
  runner: "local" | "ssh" | "manual" | "mac" | "dgx-spark" | "proxmox" | "generic";
  status: "planned";
  inputPath: string;
  handoffPath?: string;
  outputPath: string;
  importCommand: string;
  constraints: string[];
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

export interface ApprovalRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  requestedAt: string;
  decidedAt?: string;
  requestedBy: string;
  target: string;
  action: string;
  risk: "low" | "medium" | "high";
  status: "requested" | "approved" | "rejected" | "expired";
  reason: string;
  rollback: string;
  evidenceRefs: string[];
  decisionBy?: string;
  decisionNotes?: string;
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

export interface HealerProposalRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  generatedAt: string;
  status: "review_required";
  evidenceRecordId: string;
  targetUrl: string;
  evidenceRefs: string[];
  observations: string[];
  proposedActions: Array<{
    id: string;
    title: string;
    rationale: string;
    suggestedFiles: string[];
    verificationCommands: string[];
    reviewGate: string;
  }>;
  reviewGates: string[];
  apply: false;
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

export type BenchmarkSet = "smoke" | "realistic" | "stress";

export interface BenchmarkPack {
  schemaVersion: 1;
  set: BenchmarkSet;
  title: string;
  purpose: string;
  generatedAt: string;
  root: string;
  files: Array<{
    path: string;
    role:
      | "source"
      | "notebooklm_export"
      | "ci_status"
      | "coderabbit_review"
      | "usage_metrics"
      | "infra_snapshot"
      | "execution_seed"
      | "expected";
    description: string;
  }>;
  recommendedCommands: string[];
  acceptance: string[];
}

export interface EvaluationTrendReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "empty" | "stable" | "improving" | "declining";
  runCount: number;
  latestScore?: number;
  previousScore?: number;
  delta?: number;
  runs: Array<{
    id: string;
    recordedAt: string;
    target: string;
    operator: string;
    overallScore: number;
    evidenceCount: number;
    regressionCount: number;
    recommendationCount: number;
  }>;
  dimensions: Array<{
    id: string;
    samples: number;
    latestScore?: number;
    previousScore?: number;
    delta?: number;
  }>;
  openRegressions: string[];
  latestRecommendations: string[];
}

export interface UsageMetricRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  source: "hermes" | "coderabbit" | "openai" | "ci" | "manual";
  model?: string;
  operation?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  durationMs?: number;
  evidence?: string;
}

export interface UsageMetricsReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  recordCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  bySource: Array<{
    name: string;
    records: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  }>;
  byModel: Array<{
    name: string;
    records: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  }>;
  latest?: UsageMetricRecord;
}

export interface ConsoleVisualCheckReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  htmlPath: string;
  status: "passed" | "failed";
  summary: {
    passed: number;
    failed: number;
  };
  checks: Array<{
    id: string;
    label: string;
    status: "passed" | "failed";
    detail: string;
  }>;
}

export interface ConsoleBrowserCheckReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  htmlPath: string;
  screenshotPath: string;
  status: "passed" | "failed";
  viewport: {
    width: number;
    height: number;
  };
  summary: {
    passed: number;
    failed: number;
  };
  checks: Array<{
    id: string;
    label: string;
    status: "passed" | "failed";
    detail: string;
  }>;
}

export interface BehaviorCheckReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "passed" | "warning" | "failed";
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
  checks: Array<{
    id: string;
    label: string;
    status: "passed" | "warning" | "failed";
    evidence: string[];
    notes: string;
  }>;
}

export interface GbrainExportBundle {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  source: "ariadne";
  mode: "read_only_export";
  instructions: string[];
  documents: Array<{
    slug: string;
    title: string;
    kind: "source" | "requirement" | "task" | "decision" | "evaluation" | "infrastructure";
    content: string;
    evidenceRefs: string[];
    tags: string[];
  }>;
}

export interface GbrainReportImport {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  sourcePath: string;
  query: string;
  mode: string;
  resultCount: number;
  metrics: Record<string, number>;
  results: Array<{
    title: string;
    slug?: string;
    score?: number;
    source?: string;
    excerpt?: string;
  }>;
  notes: string[];
}

export interface SleepRoutineRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  scope: string;
  summary: string;
  evidenceRefs: string[];
  nextActions: string[];
}

export interface MemoryProposalRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  title: string;
  proposal: string;
  evidenceRefs: string[];
  status: "proposed";
}

export interface AgentMailRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  taskId?: string;
  runId?: string;
  status: "sent";
}

export interface AgentLeaseRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  agent: string;
  resource: string;
  status: "acquired" | "released" | "expired";
  taskId?: string;
  runId?: string;
  notes?: string;
}

export interface DeploymentSnapshot {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  sourcePath: string;
  system: "proxmox" | "truenas" | "dgx-spark" | "mac" | "github" | "generic";
  mode: "read_only";
  summary: {
    keys: string[];
    host?: string;
    services: number;
    modelEndpoints: number;
    runnerPools: number;
    storagePools: number;
    collector?: string;
    sourceSnapshotKind?: InfraSnapshot["snapshotKind"];
    confidence?: "low" | "medium" | "high";
    capabilities?: string[];
    evidence?: string[];
    warnings?: string[];
  };
  raw: unknown;
}

export interface GithubSnapshot {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  mode: "read_only";
  source: "manual_import" | "gh_cli";
  sourcePath?: string;
  repository?: string;
  summary: {
    repositories: number;
    pullRequests: number;
    open: number;
    merged: number;
    closed: number;
    drafts: number;
    checks: number;
    passingChecks: number;
    failingChecks: number;
    pendingChecks: number;
  };
  pullRequests: Array<{
    number: number;
    title: string;
    state: string;
    url?: string;
    baseRefName?: string;
    headRefName?: string;
    isDraft?: boolean;
    mergeStateStatus?: string;
    reviewDecision?: string;
    createdAt?: string;
    updatedAt?: string;
    mergedAt?: string;
    checks: Array<{
      name: string;
      status: "passed" | "failed" | "pending" | "skipped" | "unknown";
      conclusion?: string;
      detailsUrl?: string;
      rawStatus?: string;
    }>;
  }>;
  raw: unknown;
}

export interface RecoveryReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "ready" | "attention_required";
  summary: {
    executionRuns: number;
    incompleteRuns: number;
    missingWorktreeGuards: number;
    failedChecks: number;
    pendingReviews: number;
    missingGates: number;
  };
  resumes: Array<{
    runId: string;
    runStatus: ExecutionRun["status"];
    createdAt: string;
    nextAction: string;
    evidenceRefs: string[];
  }>;
  issues: Array<{
    kind: "execution" | "guard" | "check" | "review" | "gate";
    severity: "info" | "warning" | "blocking";
    detail: string;
    evidenceRef?: string;
  }>;
}

export interface ConsoleData {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  projectDir: string;
  summary: {
    sources: number;
    extractionResults: number;
    requirements: number;
    tasks: number;
    executionRuns: number;
    checks: number;
    reviews: number;
    decisions: number;
    evaluations: number;
    infraSnapshots: number;
    sleepRoutines: number;
    memoryProposals: number;
    agentMail: number;
    agentLeases: number;
    deploymentSnapshots: number;
    healerProposals: number;
    githubSnapshots: number;
    approvals: number;
    pendingApprovals: number;
    recoveryIssues: number;
    consoleBrowserChecks?: ConsoleBrowserCheckReport["status"];
    readinessStatus?: ControlReport["status"];
    latestEvaluationScore?: number;
    evaluationTrendStatus?: EvaluationTrendReport["status"];
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
  extractionResults: ExtractionResultRecord[];
  requirements: Requirement[];
  tasks: Array<GsdTask & { milestoneId: string; milestoneTitle: string }>;
  executionRuns: ExecutionRun[];
  checks: CheckRecord[];
  reviews: ReviewRecord[];
  decisions: DecisionRecord[];
  playwrightEvidence: PlaywrightEvidenceRecord[];
  healerProposals: HealerProposalRecord[];
  evaluations: EvaluationRun[];
  evaluationTrends?: EvaluationTrendReport;
  consoleVisualChecks?: ConsoleVisualCheckReport;
  consoleBrowserChecks?: ConsoleBrowserCheckReport;
  behaviorChecks?: BehaviorCheckReport;
  gbrain?: {
    exportBundle?: GbrainExportBundle;
    reports: GbrainReportImport[];
  };
  coordination: {
    sleepRoutines: SleepRoutineRecord[];
    memoryProposals: MemoryProposalRecord[];
    agentMail: AgentMailRecord[];
    agentLeases: AgentLeaseRecord[];
  };
  infrastructure: {
    registry?: InfraRegistry;
    snapshots: InfraSnapshot[];
  };
  deployment: {
    snapshots: DeploymentSnapshot[];
  };
  github: {
    snapshots: GithubSnapshot[];
  };
  approvals: ApprovalRecord[];
  recovery?: RecoveryReport;
  readiness?: ControlReport;
  artifacts: {
    hotIndex?: string;
    prd?: string;
    roadmap?: string;
    control?: string;
    evaluationPlan?: string;
    artifactChecks?: string;
    evaluationTrends?: string;
    usageReport?: string;
    behaviorChecks?: string;
    gbrainExport?: string;
    consoleVisualChecks?: string;
    consoleBrowserChecks?: string;
    githubSnapshots?: string;
    approvals?: string;
    recoveryReport?: string;
    extractionResults?: string;
    healerProposals?: string;
  };
}
