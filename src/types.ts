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
  readinessStatus?: ControlReport["status"];
  roadmapCompletionStatus?: RoadmapCompletionAudit["status"];
  roadmapCompletionBlocked?: number;
  mutationReadinessRepairStatus?: MutationReadinessRepairPlan["status"];
  mutationReadinessRepairMissingPlans?: number;
  mutationReadinessRepairOperatorActionRequired?: number;
  latestE2eSmoke?: {
    status: "passed" | "blocked" | "degraded" | "failed";
    passed: number;
    blocked: number;
    degraded: number;
    failed: number;
    reportRef: string;
  };
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

export interface MutationReadinessPlan {
  schemaVersion: 1;
  id: string;
  project: string;
  generatedAt: string;
  target: "github" | "deployment" | "hermes-cron" | "openscorpion" | "gsd2" | "notebooklm" | "generic";
  status: "approval_required" | "approval_rejected" | "ready_for_bounded_review";
  risk: "low" | "medium" | "high";
  scope: string;
  approvalRef?: string;
  approvalStatus?: ApprovalRecord["status"];
  authEvidenceRefs: string[];
  evidenceRefs: string[];
  dryRunCommand: string;
  proposedLiveCommand: string;
  postVerificationCommand?: string;
  rollback: string;
  requiredGates: string[];
  notes?: string;
  execute: false;
}

export interface MutationReadinessAudit {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "empty" | "blocked" | "ready_for_bounded_review";
  mutationAllowed: false;
  summary: {
    plans: number;
    ready: number;
    blocked: number;
    approvalRequired: number;
    approvalRejected: number;
    missingEvidence: number;
    unsafeDryRuns: number;
    executablePlans: number;
  };
  checks: Array<{
    planId: string;
    target: MutationReadinessPlan["target"];
    status: "passed" | "blocked";
    blockers: string[];
    warnings: string[];
    evidenceRefs: string[];
    requiredGates: string[];
  }>;
}

export interface MutationReadinessRepairPlan {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "complete" | "actions_required";
  mutationAllowed: false;
  mutationReadinessAuditRef: string;
  liveAdapterNextActionsRef: string;
  summary: {
    targets: number;
    auditPassed: number;
    missingPlans: number;
    repairablePlans: number;
    operatorActionRequired: number;
    blocked: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "audit_passed" | "missing_plan" | "repairable_plan" | "operator_action_required" | "blocked";
    latestPlanId?: string;
    blockers: string[];
    repairableBlockers: string[];
    operatorBlockers: string[];
    remainingBlockers: string[];
    approvalCommand?: string;
    regenerationCommand: string;
    nextActionCommands: string[];
    evidenceRefs: string[];
  }>;
}

export interface MutationDryRunRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  planId: string;
  target: MutationReadinessPlan["target"];
  startedAt: string;
  finishedAt: string;
  status: "passed" | "failed" | "timed_out";
  command: string;
  exitCode?: number;
  signal?: string;
  bufferExceeded?: boolean;
  durationMs: number;
  stdout: string;
  stderr: string;
  auditRef: string;
  execute: false;
}

export interface MutationExecutionRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  planId: string;
  target: MutationReadinessPlan["target"];
  startedAt: string;
  finishedAt: string;
  status: "passed" | "failed" | "timed_out" | "post_verify_failed" | "post_verify_skipped";
  liveCommand: string;
  liveExitCode?: number;
  liveSignal?: string;
  liveBufferExceeded?: boolean;
  liveStdout: string;
  liveStderr: string;
  postVerificationCommand: string;
  postVerificationExitCode?: number;
  postVerificationSignal?: string;
  postVerificationBufferExceeded?: boolean;
  postVerificationStdout: string;
  postVerificationStderr: string;
  durationMs: number;
  auditRef: string;
  dryRunRef: string;
  rollback: string;
  execute: true;
}

export interface LiveAdapterReadinessReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "ready" | "blocked";
  summary: {
    targets: number;
    ready: number;
    blocked: number;
    passedPlans: number;
    passedDryRuns: number;
    passedExecutions: number;
    acceptedApprovalReviews: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "ready_for_adapter" | "blocked";
    planCount: number;
    passedPlanCount: number;
    passedDryRunCount: number;
    passedExecutionCount: number;
    approvalReviewCount: number;
    acceptedApprovalReviewCount: number;
    latestReadyPlanId?: string;
    latestAcceptedApprovalReviewId?: string;
    executeCommand: string;
    blockers: string[];
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterNextActionsReport {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "complete" | "actions_required";
  summary: {
    targets: number;
    ready: number;
    blocked: number;
    actionItems: number;
  };
  readinessRef: string;
  operatorEvidenceAuditRef?: string;
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    readinessStatus: LiveAdapterReadinessReport["targets"][number]["status"];
    latestReadyPlanId?: string;
    executeCommand: string;
    blockers: string[];
    actions: Array<{
      id: string;
      status: "pending" | "blocked" | "ready";
      title: string;
      rationale: string;
      command?: string;
      evidenceRefs: string[];
    }>;
  }>;
}

export interface LiveAdapterApprovalPack {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "ready_for_operator_review" | "complete";
  summary: {
    targets: number;
    packets: number;
    blockedTargets: number;
    readyTargets: number;
  };
  nextActionsRef: string;
  packets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    readinessStatus: LiveAdapterReadinessReport["targets"][number]["status"];
    recommendedRisk: ApprovalRecord["risk"];
    operatorDecisionRequired: true;
    approvalRequestCommand: string;
    requiredEvidence: string[];
    mutationPlanCommand: string;
    dryRunCommand: string;
    executionCommand: string;
    rollbackRequirement: string;
    postVerificationRequirement: string;
    blockers: string[];
    nextActions: string[];
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterApprovalReview {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  target: Exclude<MutationReadinessPlan["target"], "generic">;
  status: "accepted" | "needs_changes" | "rejected";
  reviewedBy: string;
  packetRef: string;
  packetGeneratedAt: string;
  evidenceRefs: string[];
  notes?: string;
  mutationApproved: false;
}

export interface LiveAdapterApprovalReviewAudit {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "passed" | "blocked";
  approvalPackRef: string;
  summary: {
    targets: number;
    packetTargets: number;
    reviewRecords: number;
    currentAcceptedReviews: number;
    staleAcceptedReviews: number;
    invalidRecords: number;
    missingEvidenceRefs: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "current_accepted" | "missing_review" | "needs_changes" | "rejected" | "stale";
    packetPresent: boolean;
    reviewCount: number;
    acceptedReviewCount: number;
    currentAcceptedReviewCount: number;
    latestReviewId?: string;
    latestAcceptedReviewId?: string;
    blockers: string[];
    evidenceRefs: string[];
  }>;
  invalidRecords: Array<{
    path: string;
    reason: string;
  }>;
}

export interface LiveAdapterTargetDossier {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  target: Exclude<MutationReadinessPlan["target"], "generic">;
  status: "ready_for_operator_review" | "ready_for_adapter_work" | "blocked";
  readinessRef: string;
  nextActionsRef: string;
  approvalPackRef: string;
  approvalReviewAuditRef: string;
  mutationReadinessAuditRef: string;
  summary: {
    blockers: number;
    reviewAuditBlockers: number;
    actions: number;
    packetPresent: boolean;
    reviewAuditStatus: LiveAdapterApprovalReviewAudit["targets"][number]["status"];
    mutationPlans: number;
    readyMutationPlans: number;
    gbrainReports: number;
  };
  readiness: LiveAdapterReadinessReport["targets"][number];
  nextActions: LiveAdapterNextActionsReport["targets"][number]["actions"];
  approvalPacket?: LiveAdapterApprovalPack["packets"][number];
  approvalReviewAudit?: LiveAdapterApprovalReviewAudit["targets"][number];
  mutationReadinessChecks: MutationReadinessAudit["checks"];
  operatorChecklist: string[];
  gbrainContext: {
    exportRef?: string;
    reportRefs: string[];
    suggestedQueries: string[];
  };
  evidenceRefs: string[];
}

export interface LiveAdapterCutoverAudit {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "ready_for_cutover" | "blocked";
  mutationAllowed: false;
  readinessRef: string;
  approvalReviewAuditRef: string;
  mutationReadinessAuditRef: string;
  operatorEvidenceAuditRef: string;
  dossierDirRef: string;
  summary: {
    targets: number;
    ready: number;
    blocked: number;
    passedGates: number;
    blockedGates: number;
    advisoryGates: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "ready_for_cutover" | "blocked";
    executeCommand: string;
    latestReadyPlanId?: string;
    latestAcceptedApprovalReviewId?: string;
    gates: Array<{
      id: string;
      label: string;
      status: "passed" | "blocked" | "advisory";
      detail: string;
      evidenceRefs: string[];
    }>;
    blockers: string[];
    gbrainQueries: string[];
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterReviewSession {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "operator_review_required" | "ready_for_adapter_work";
  mutationApproved: false;
  operatorDecisionRequired: true;
  nextActionsRef: string;
  approvalPackRef: string;
  approvalReviewAuditRef: string;
  cutoverAuditRef: string;
  operatorEvidenceAuditRef: string;
  operatorEvidenceQueueRef?: string;
  operatorEvidenceAssistRef?: string;
  dossierDirRef: string;
  summary: {
    targets: number;
    operatorReviewRequired: number;
    readyForAdapterWork: number;
    blocked: number;
    actionItems: number;
    currentAcceptedReviews: number;
    cutoverReady: number;
    gbrainReports: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "operator_review_required" | "ready_for_adapter_work" | "blocked";
    readinessStatus: LiveAdapterReadinessReport["targets"][number]["status"];
    cutoverStatus: LiveAdapterCutoverAudit["targets"][number]["status"];
    reviewAuditStatus: LiveAdapterApprovalReviewAudit["targets"][number]["status"];
    firstAction?: string;
    reviewCommand: string;
    approvalRequestCommand?: string;
    mutationPlanCommand?: string;
    operatorEvidenceStatus: "complete" | "needs_evidence" | "needs_rework";
    operatorEvidenceQueueStatus?: LiveAdapterOperatorEvidenceQueue["targets"][number]["status"];
    operatorEvidenceFileRef: string;
    operatorEvidenceCheckCommand: string;
    operatorEvidenceImportCommand: string;
    latestOperatorEvidenceCheckRef?: string;
    operatorEvidenceAssistFileRef?: string;
    operatorEvidenceAssistNextSteps: string[];
    missingOperatorEvidenceSections: string[];
    requiredEvidence: string[];
    blockers: string[];
    cutoverBlockers: string[];
    dossierRef: string;
    gbrainContext: LiveAdapterTargetDossier["gbrainContext"];
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterEvidenceTemplatePack {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "awaiting_operator_evidence" | "ready_for_operator_review";
  mutationApproved: false;
  reviewSessionRef: string;
  summary: {
    targets: number;
    templates: number;
    evidenceItems: number;
    gbrainQueryItems: number;
  };
  templates: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "awaiting_operator_evidence";
    templateRef: string;
    reviewSessionStatus: LiveAdapterReviewSession["targets"][number]["status"];
    firstAction?: string;
    suggestedEvidenceRefs: string[];
    requiredEvidence: string[];
    gbrainQueries: string[];
    reviewCommand: string;
    approvalRequestCommand?: string;
    mutationPlanCommand?: string;
    notes: string[];
  }>;
}

export interface LiveAdapterOperatorEvidenceWorkplan {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "evidence_required" | "ready_for_review";
  mutationApproved: false;
  operatorEvidenceAuditRef: string;
  reviewSessionRef: string;
  evidenceTemplatesRef: string;
  cutoverAuditRef: string;
  summary: {
    targets: number;
    completeTargets: number;
    missingTargets: number;
    incompleteTargets: number;
    checkCommands: number;
    importCommands: number;
    gbrainQueries: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "complete" | "needs_evidence" | "needs_rework";
    templateRef: string;
    firstAction?: string;
    checkCommand: string;
    importCommand: string;
    reviewCommand: string;
    missingSections: string[];
    requiredEvidence: string[];
    cutoverBlockers: string[];
    gbrainQueries: string[];
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterOperatorEvidenceCheck {
  schemaVersion: 1;
  id: string;
  project: string;
  checkedAt: string;
  target: Exclude<MutationReadinessPlan["target"], "generic">;
  sourceRef: string;
  sourceSha256: string;
  sourceBytes: number;
  status: "complete" | "incomplete";
  recorded: false;
  operatorEvidenceRecordCreated: false;
  mutationApproved: false;
  approvalGranted: false;
  summary: {
    requiredSections: number;
    completeSections: number;
    missingSections: number;
    advisoryWarnings: number;
  };
  sections: Array<{
    id: string;
    label: string;
    status: "complete" | "missing";
    detail: string;
  }>;
  gbrain: {
    status: "present" | "missing";
    detail: string;
  };
  notes?: string;
}

export interface LiveAdapterOperatorEvidenceQueue {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "evidence_required" | "ready_for_import" | "complete";
  mutationApproved: false;
  operatorEvidenceAuditRef: string;
  workplanRef: string;
  summary: {
    targets: number;
    completeTargets: number;
    readyForImport: number;
    needsEvidence: number;
    needsRework: number;
    uncheckedTargets: number;
    latestChecks: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "complete" | "ready_for_import" | "needs_evidence" | "needs_rework" | "unchecked";
    operatorEvidenceStatus: "complete" | "incomplete" | "missing_evidence";
    latestCheckId?: string;
    latestCheckRef?: string;
    latestCheckStatus?: "complete" | "incomplete";
    latestCheckMissingSections?: number;
    missingSections: string[];
    nextAction: string;
    checkCommand: string;
    importCommand: string;
    templateRef: string;
    evidenceRefs: string[];
  }>;
}

export interface LiveAdapterOperatorEvidenceCheckBatch {
  schemaVersion: 1;
  project: string;
  checkedAt: string;
  status: "complete" | "incomplete";
  mutationApproved: false;
  approvalGranted: false;
  source: "templates" | "workspace";
  sourcePackRef: string;
  templatePackRef?: string;
  workspaceRef?: string;
  queueRef: string;
  summary: {
    targets: number;
    checks: number;
    completeChecks: number;
    incompleteChecks: number;
    failedChecks: number;
    missingSources: number;
    missingTemplates: number;
    missingSections: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "complete" | "incomplete" | "missing_source" | "missing_template" | "error";
    sourceFileRef?: string;
    templateRef?: string;
    evidenceFileRef?: string;
    checkRef?: string;
    checkMarkdownRef?: string;
    missingSections: number;
    missingSectionLabels: string[];
    sourceRef?: string;
    errorDetail?: string;
  }>;
}

export interface LiveAdapterOperatorEvidenceImportReadyBatch {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  status: "imported" | "nothing_ready" | "partial";
  mutationApproved: false;
  approvalGranted: false;
  reviewedBy: string;
  notes?: string;
  queueRef: string;
  operatorEvidenceAuditRef: string;
  refreshedQueueRef: string;
  summary: {
    targets: number;
    readyForImport: number;
    imported: number;
    skipped: number;
    failed: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "imported" | "skipped" | "failed";
    reason: string;
    latestCheckRef?: string;
    sourceRef?: string;
    recordRef?: string;
    recordMarkdownRef?: string;
    errorDetail?: string;
  }>;
}

export interface LiveAdapterOperatorEvidenceWorkspace {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "awaiting_operator_input" | "ready_for_import";
  mutationApproved: false;
  approvalGranted: false;
  queueRef: string;
  workplanRef: string;
  summary: {
    targets: number;
    workspaceFiles: number;
    supportFiles: number;
    targetsNeedingEvidence: number;
    targetsReadyForImport: number;
    gbrainQueryItems: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: LiveAdapterOperatorEvidenceQueue["targets"][number]["status"];
    workspaceDirRef: string;
    evidenceFileRef: string;
    supportFileRefs: string[];
    checkCommand: string;
    importCommand: string;
    missingSections: string[];
    requiredEvidence: string[];
    cutoverBlockers: string[];
    gbrainQueries: string[];
  }>;
}

export interface LiveAdapterOperatorEvidenceAssist {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "awaiting_operator_review" | "no_targets";
  mutationApproved: false;
  approvalGranted: false;
  operatorEvidenceRecordCreated: false;
  workspaceRef: string;
  queueRef: string;
  workplanRef: string;
  summary: {
    targets: number;
    assistFiles: number;
    existingEvidenceRefs: number;
    supportFileRefs: number;
    missingSections: number;
    cutoverBlockers: number;
    gbrainQueries: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: LiveAdapterOperatorEvidenceQueue["targets"][number]["status"];
    assistFileRef: string;
    workspaceDirRef: string;
    evidenceFileRef: string;
    checkCommand: string;
    importCommand: string;
    existingEvidenceRefs: string[];
    supportFileRefs: string[];
    missingSections: string[];
    requiredEvidence: string[];
    cutoverBlockers: string[];
    gbrainQueries: string[];
    nextSteps: string[];
  }>;
}

export interface LiveAdapterOperatorEvidenceRecord {
  schemaVersion: 1;
  id: string;
  project: string;
  recordedAt: string;
  target: Exclude<MutationReadinessPlan["target"], "generic">;
  reviewedBy: string;
  sourceRef: string;
  sourceSha256: string;
  sourceBytes: number;
  status: "complete" | "incomplete";
  mutationApproved: false;
  approvalGranted: false;
  summary: {
    requiredSections: number;
    completeSections: number;
    missingSections: number;
    advisoryWarnings: number;
  };
  sections: Array<{
    id: string;
    label: string;
    status: "complete" | "missing";
    detail: string;
  }>;
  gbrain: {
    status: "present" | "missing";
    detail: string;
  };
  notes?: string;
}

export interface LiveAdapterOperatorEvidenceAudit {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "complete" | "blocked";
  mutationApproved: false;
  summary: {
    targets: number;
    records: number;
    completeTargets: number;
    incompleteTargets: number;
    missingTargets: number;
    missingSections: number;
    advisoryWarnings: number;
  };
  targets: Array<{
    target: Exclude<MutationReadinessPlan["target"], "generic">;
    status: "complete" | "incomplete" | "missing_evidence";
    recordCount: number;
    latestRecordId?: string;
    latestRecordRef?: string;
    missingSections: string[];
    advisoryWarnings: string[];
    blockers: string[];
    evidenceRefs: string[];
  }>;
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

export interface RoadmapCompletionAudit {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  status: "complete" | "blocked";
  summary: {
    requirements: number;
    passed: number;
    blocked: number;
    advisory: number;
  };
  requirements: Array<{
    id: string;
    title: string;
    status: "passed" | "blocked" | "advisory";
    detail: string;
    evidenceRefs: string[];
    nextCommands: string[];
  }>;
}

export type BenchmarkSet = "smoke" | "realistic" | "stress";
export type BenchmarkAcceptanceType = "artifact_contract" | "pipeline_output" | "fixture_safety";

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
    targetProject?: string;
  }>;
  recommendedCommands: string[];
  acceptance: Array<{
    id: string;
    type: BenchmarkAcceptanceType;
    criterion: string;
  }>;
}

export interface BenchmarkRun {
  schemaVersion: 1;
  id: string;
  project: string;
  set: BenchmarkSet;
  generatedAt: string;
  mode: "local_deterministic";
  status: "passed" | "failed";
  packPath: string;
  packRoot: string;
  targetProjects: string[];
  summary: {
    steps: number;
    passed: number;
    failed: number;
    targetProjects: number;
    missingRequiredArtifacts: number;
  };
  steps: Array<{
    id: string;
    project: string;
    status: "passed" | "failed";
    detail: string;
    evidenceRefs: string[];
  }>;
  acceptance: Array<{
    id: string;
    type: BenchmarkAcceptanceType;
    criterion: string;
    status: "passed" | "failed";
    evidenceRefs: string[];
  }>;
  artifactChecks: Array<{
    project: string;
    status: ArtifactCheckReport["status"];
    missingRequired: number;
    reportPath: string;
  }>;
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
  source: "hermes" | "coderabbit" | "openai" | "ci" | "local-llm" | "manual";
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

export interface LocalRuntimeProbe {
  schemaVersion: 1;
  project: string;
  generatedAt: string;
  mode: "read_only" | "read_only_with_canary";
  summary: {
    services: number;
    reachable: number;
    degraded: number;
    unreachable: number;
    models: number;
    usageRecords: number;
    warnings: string[];
  };
  hermes: {
    dashboard: RuntimeServiceProbe;
    statusCommand: RuntimeCommandProbe;
    doctorCommand: RuntimeCommandProbe;
    gatewayCommand: RuntimeCommandProbe;
  };
  modelEndpoints: RuntimeModelEndpointProbe[];
  usageRecords: UsageMetricRecord[];
}

export interface RuntimeServiceProbe {
  id: string;
  url?: string;
  status: "reachable" | "degraded" | "unreachable";
  httpStatus?: number;
  detail: string;
}

export interface RuntimeCommandProbe {
  command: string;
  status: "reachable" | "degraded" | "unreachable";
  exitCode?: number;
  stdoutPreview?: string;
  stderrPreview?: string;
  detail: string;
}

export interface RuntimeModelEndpointProbe {
  id: string;
  kind: "ollama" | "openai-compatible";
  url: string;
  status: "reachable" | "degraded" | "unreachable";
  models: string[];
  detail: string;
  canary?: {
    status: "passed" | "degraded" | "failed" | "skipped";
    model?: string;
    responsePreview?: string;
    usage?: {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      durationMs?: number;
    };
  };
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

export interface Gsd2ProcessSnapshot {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  mode: "read_only";
  binary: string;
  version: string;
  packageCount: number;
  packages: string[];
  supportedModes: string[];
  subcommands: string[];
  warnings: string[];
  raw: {
    version: string;
    list: string;
    help: string;
  };
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

export interface HermesCronSnapshot {
  schemaVersion: 1;
  project: string;
  importedAt: string;
  sourcePath: string;
  host?: string;
  mode: "read_only";
  summary: {
    jobs: number;
    enabled: number;
    disabled: number;
    schedules: string[];
    nextRuns: string[];
    warnings: string[];
  };
  jobs: Array<{
    id?: string;
    name: string;
    schedule?: string;
    enabled?: boolean;
    status?: string;
    nextRun?: string;
    lastRun?: string;
    intent?: string;
  }>;
  raw: unknown;
}

export interface HermesCronProposal {
  schemaVersion: 1;
  id: string;
  project: string;
  generatedAt: string;
  mode: "proposal_only";
  snapshotRefs: string[];
  summary: {
    snapshots: number;
    jobs: number;
    enabled: number;
    disabled: number;
    proposedActions: number;
    warnings: string[];
  };
  proposedActions: Array<{
    id: string;
    kind: "keep" | "review" | "create-candidate";
    title: string;
    rationale: string;
    schedule?: string;
    sourceJob?: string;
    evidenceRefs: string[];
  }>;
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
    benchmarkRuns: number;
    infraSnapshots: number;
    localRuntimeProbes: number;
    localRuntimeReachable?: number;
    localRuntimeDegraded?: number;
    localRuntimeUnreachable?: number;
    localRuntimeModels?: number;
    gsd2ProcessSnapshots: number;
    sleepRoutines: number;
    memoryProposals: number;
    agentMail: number;
    agentLeases: number;
    hermesCronSnapshots: number;
    hermesCronProposals: number;
    deploymentSnapshots: number;
    healerProposals: number;
    githubSnapshots: number;
    approvals: number;
    pendingApprovals: number;
    mutationReadinessPlans: number;
    mutationDryRuns: number;
    mutationExecutions: number;
    mutationReadinessAuditStatus?: MutationReadinessAudit["status"];
    mutationReadinessRepairStatus?: MutationReadinessRepairPlan["status"];
    mutationReadinessRepairMissingPlans?: number;
    mutationReadinessRepairRepairablePlans?: number;
    mutationReadinessRepairOperatorActionRequired?: number;
    mutationReadinessRepairBlocked?: number;
    liveAdapterReadinessStatus?: LiveAdapterReadinessReport["status"];
    liveAdapterReady?: number;
    liveAdapterBlocked?: number;
    liveAdapterActionItems?: number;
    liveAdapterApprovalPackets?: number;
    liveAdapterApprovalReviews?: number;
    acceptedLiveAdapterApprovalReviews?: number;
    liveAdapterApprovalReviewAuditStatus?: LiveAdapterApprovalReviewAudit["status"];
    currentLiveAdapterApprovalReviews?: number;
    liveAdapterTargetDossiers?: number;
    liveAdapterCutoverAuditStatus?: LiveAdapterCutoverAudit["status"];
    liveAdapterCutoverReady?: number;
    liveAdapterCutoverBlocked?: number;
    liveAdapterReviewSessionStatus?: LiveAdapterReviewSession["status"];
    liveAdapterReviewSessionTargets?: number;
    liveAdapterReviewSessionRequired?: number;
    liveAdapterEvidenceTemplates?: number;
    liveAdapterEvidenceTemplateStatus?: LiveAdapterEvidenceTemplatePack["status"];
    liveAdapterOperatorEvidenceWorkplanStatus?: LiveAdapterOperatorEvidenceWorkplan["status"];
    liveAdapterOperatorEvidenceWorkplanTargets?: number;
    liveAdapterOperatorEvidenceQueueStatus?: LiveAdapterOperatorEvidenceQueue["status"];
    liveAdapterOperatorEvidenceQueueReady?: number;
    liveAdapterOperatorEvidenceAssistStatus?: LiveAdapterOperatorEvidenceAssist["status"];
    liveAdapterOperatorEvidenceAssistTargets?: number;
    liveAdapterOperatorEvidenceAssistRefs?: number;
    liveAdapterOperatorEvidenceChecks?: number;
    liveAdapterOperatorEvidenceRecords?: number;
    liveAdapterOperatorEvidenceStatus?: LiveAdapterOperatorEvidenceAudit["status"];
    liveAdapterOperatorEvidenceComplete?: number;
    liveAdapterOperatorEvidenceIncomplete?: number;
    liveAdapterOperatorEvidenceMissing?: number;
    roadmapCompletionStatus?: RoadmapCompletionAudit["status"];
    roadmapCompletionBlocked?: number;
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
  benchmarkRuns: BenchmarkRun[];
  evaluationTrends?: EvaluationTrendReport;
  consoleVisualChecks?: ConsoleVisualCheckReport;
  consoleBrowserChecks?: ConsoleBrowserCheckReport;
  behaviorChecks?: BehaviorCheckReport;
  gsd2ProcessSnapshots: Gsd2ProcessSnapshot[];
  gbrain?: {
    exportBundle?: GbrainExportBundle;
    reports: GbrainReportImport[];
  };
  coordination: {
    sleepRoutines: SleepRoutineRecord[];
    memoryProposals: MemoryProposalRecord[];
    agentMail: AgentMailRecord[];
    agentLeases: AgentLeaseRecord[];
    hermesCronSnapshots: HermesCronSnapshot[];
    hermesCronProposals: HermesCronProposal[];
  };
  infrastructure: {
    registry?: InfraRegistry;
    snapshots: InfraSnapshot[];
    runtimeProbes: LocalRuntimeProbe[];
  };
  deployment: {
    snapshots: DeploymentSnapshot[];
  };
  github: {
    snapshots: GithubSnapshot[];
  };
  approvals: ApprovalRecord[];
  mutationReadinessPlans: MutationReadinessPlan[];
  mutationDryRuns: MutationDryRunRecord[];
  mutationExecutions: MutationExecutionRecord[];
  mutationReadinessAudit?: MutationReadinessAudit;
  mutationReadinessRepairPlan?: MutationReadinessRepairPlan;
  liveAdapterReadiness?: LiveAdapterReadinessReport;
  liveAdapterNextActions?: LiveAdapterNextActionsReport;
  liveAdapterApprovalPack?: LiveAdapterApprovalPack;
  liveAdapterApprovalReviews?: LiveAdapterApprovalReview[];
  liveAdapterApprovalReviewAudit?: LiveAdapterApprovalReviewAudit;
  liveAdapterTargetDossiers: LiveAdapterTargetDossier[];
  liveAdapterCutoverAudit?: LiveAdapterCutoverAudit;
  liveAdapterReviewSession?: LiveAdapterReviewSession;
  liveAdapterEvidenceTemplatePack?: LiveAdapterEvidenceTemplatePack;
  liveAdapterOperatorEvidenceWorkplan?: LiveAdapterOperatorEvidenceWorkplan;
  liveAdapterOperatorEvidenceQueue?: LiveAdapterOperatorEvidenceQueue;
  liveAdapterOperatorEvidenceAssist?: LiveAdapterOperatorEvidenceAssist;
  liveAdapterOperatorEvidenceChecks: LiveAdapterOperatorEvidenceCheck[];
  liveAdapterOperatorEvidence: LiveAdapterOperatorEvidenceRecord[];
  liveAdapterOperatorEvidenceAudit?: LiveAdapterOperatorEvidenceAudit;
  roadmapCompletionAudit?: RoadmapCompletionAudit;
  recovery?: RecoveryReport;
  readiness?: ControlReport;
  artifacts: {
    hotIndex?: string;
    prd?: string;
    roadmap?: string;
    control?: string;
    evaluationPlan?: string;
    benchmarkRuns?: string;
    artifactChecks?: string;
    evaluationTrends?: string;
    usageReport?: string;
    behaviorChecks?: string;
    localRuntimeProbes?: string;
    gsd2ProcessSnapshots?: string;
    gbrainExport?: string;
    consoleVisualChecks?: string;
    consoleBrowserChecks?: string;
    githubSnapshots?: string;
    approvals?: string;
    mutationReadinessPlans?: string;
    mutationDryRuns?: string;
    mutationExecutions?: string;
    mutationReadinessAudit?: string;
    mutationReadinessRepairPlan?: string;
    liveAdapterReadiness?: string;
    liveAdapterNextActions?: string;
    liveAdapterApprovalPack?: string;
    liveAdapterApprovalReviews?: string;
    liveAdapterApprovalReviewAudit?: string;
    liveAdapterTargetDossiers?: string;
    liveAdapterCutoverAudit?: string;
    liveAdapterReviewSession?: string;
    liveAdapterEvidenceTemplates?: string;
    liveAdapterOperatorEvidenceWorkplan?: string;
    liveAdapterOperatorEvidenceQueue?: string;
    liveAdapterOperatorEvidenceAssist?: string;
    liveAdapterOperatorEvidenceChecks?: string;
    liveAdapterOperatorEvidence?: string;
    liveAdapterOperatorEvidenceAudit?: string;
    roadmapCompletionAudit?: string;
    recoveryReport?: string;
    extractionResults?: string;
    healerProposals?: string;
    hermesCronSnapshots?: string;
    hermesCronProposals?: string;
  };
}
