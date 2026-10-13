import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import * as mutationCommands from "../src/mutationCommand.js";
import { runMutationDryRun } from "../src/mutationDryRun.js";
import { runMutationExecution } from "../src/mutationExecute.js";
import { planMutationReadiness } from "../src/mutationReadiness.js";
import { generateMutationReadinessAudit } from "../src/mutationReadinessAudit.js";

describe("mutation-readiness audit retirement", () => {
  it("treats plans whose approval was rejected as retired, not blocked", async () => {
    const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-retire-"));
    const control = path.join(vaultRoot, "projects", "ariadne", "control");
    await fs.mkdir(path.join(control, "approvals"), { recursive: true });
    await fs.mkdir(path.join(control, "mutation-readiness"), { recursive: true });
    await fs.writeFile(
      path.join(control, "approvals", "approval-2026-05-16T13-21-33-834Z.json"),
      JSON.stringify({ schemaVersion: 1, id: "approval-2026-05-16T13-21-33-834Z", status: "rejected" })
    );
    await fs.writeFile(
      path.join(control, "mutation-readiness", "mutation-readiness-github-old.json"),
      JSON.stringify({
        schemaVersion: 1,
        id: "mutation-readiness-github-old",
        project: "ariadne",
        target: "github",
        status: "approval_required",
        risk: "medium",
        approvalRef: "approval-2026-05-16T13-21-33-834Z",
        approvalStatus: "requested",
        authEvidenceRefs: [],
        evidenceRefs: [],
        dryRunCommand: "gh pr view 1",
        proposedLiveCommand: "gh pr merge 1",
        rollback: "Disable adapter.",
        requiredGates: [],
        execute: false
      })
    );
    const { audit } = await generateMutationReadinessAudit({ project: "ariadne", vaultRoot });
    expect(audit.checks[0].status).toBe("retired");
    expect(audit.summary.blocked).toBe(0);
    expect(audit.summary.retired).toBe(1);
    expect(audit.status).toBe("ready_for_bounded_review");
  });
  it("blocks missing or no-longer-approved current approval records", async () => {
    const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-approval-current-"));
    try {
      const control = path.join(vaultRoot, "projects", "ariadne", "control");
      await fs.mkdir(path.join(control, "approvals"), { recursive: true });
      await fs.mkdir(path.join(control, "mutation-readiness"), { recursive: true });
      const approvalRef = "approval-2026-10-13T00-00-00-000Z";
      const approvalPath = path.join(control, "approvals", `${approvalRef}.json`);
      const originalApproval = JSON.stringify({ status: "approved", id: approvalRef, project: "ariadne", target: "deployment", action: "Exact test scope", decisionBy: "James", decidedAt: "2026-10-13T00:00:00Z" });
      const evidence = path.join(vaultRoot, "authorization.md");
      await fs.writeFile(evidence, "Isolated test authorization");
      await fs.writeFile(path.join(control, "mutation-readiness", "mutation-readiness-deployment-current.json"), JSON.stringify({
        schemaVersion: 1, id: "mutation-readiness-deployment-current", project: "ariadne", target: "deployment",
        status: "ready_for_bounded_review", approvalRef, approvalStatus: "approved", approvalSha256: createHash("sha256").update(originalApproval).digest("hex"), risk: "high", execute: false,
        authEvidenceRefs: [evidence], evidenceRefs: [], dryRunCommand: "git status --short",
        proposedLiveCommand: "bounded-test-action", postVerificationCommand: "git status --short",
        rollback: "Isolated test rollback", requiredGates: []
      }));
      await fs.writeFile(approvalPath, originalApproval);
      expect((await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0].status).toBe("passed");
      for (const patch of [{ id: "approval-other" }, { project: "other" }, { target: "github" }, { action: "Other scope" }, { decisionBy: "Ariadne Bot" }, { decidedAt: "2000-01-01" }]) {
        await fs.writeFile(approvalPath, JSON.stringify({ ...JSON.parse(originalApproval), ...patch }));
        const changed = (await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0];
        expect(changed.status).toBe("blocked");
        expect(changed.blockers).toContain("current approval record digest is missing or changed");
      }
      await fs.unlink(approvalPath);
      const missing = (await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0];
      expect(missing.status).toBe("blocked");
      expect(missing.blockers).toContain("current approval record is missing");
      await fs.writeFile(approvalPath, JSON.stringify({ status: "requested" }));
      expect((await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0].status).toBe("blocked");
      await fs.writeFile(approvalPath, JSON.stringify({ status: "rejected" }));
      expect((await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0].status).toBe("retired");
    } finally { await fs.rm(vaultRoot, { recursive: true, force: true }); }
  });
  it("captures the exact approved record digest when generating a plan", async () => {
    const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-approval-digest-"));
    try {
      const dir = path.join(vaultRoot, "projects", "ariadne", "control", "approvals");
      await fs.mkdir(dir, { recursive: true });
      const id = "approval-2026-10-13T00-00-00-001Z";
      const raw = JSON.stringify({ schemaVersion: 1, id, project: "ariadne", target: "deployment", status: "approved", action: "Exact test scope", decisionBy: "James", decidedAt: "2026-10-13T00:00:00Z" }) + "\n";
      await fs.writeFile(path.join(dir, `${id}.json`), raw);
      const auth = path.join(vaultRoot, "auth.md");
      await fs.writeFile(auth, "Isolated test authorization");
      const result = await planMutationReadiness({ project: "ariadne", vaultRoot, target: "deployment", risk: "high", scope: "Exact test scope", approvalRef: id, authEvidenceRefs: [auth], evidenceRefs: [], dryRunCommand: "git status --short", proposedLiveCommand: "bounded-test-action", postVerificationCommand: "git status --short", rollback: "Isolated test rollback" });
      expect(result.plan.approvalSha256).toBe(createHash("sha256").update(raw).digest("hex"));
      expect((await generateMutationReadinessAudit({ project: "ariadne", vaultRoot })).audit.checks[0].status).toBe("passed");
    } finally { await fs.rm(vaultRoot, { recursive: true, force: true }); }
  });
  it("rejects edited plans and unbound legacy dry runs before invoking any command", async () => {
    const vaultRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ariadne-plan-digest-"));
    // Every command is mocked: this regression performs no shell/live action.
    const command = vi.spyOn(mutationCommands, "execMutationCommand").mockResolvedValue({ stdout: "mocked", stderr: "", exitCode: 0, timedOut: false, bufferExceeded: false, durationMs: 1 });
    try {
      const dir = path.join(vaultRoot, "projects", "ariadne", "control", "approvals");
      await fs.mkdir(dir, { recursive: true });
      const id = "approval-2026-10-13T00-00-00-002Z";
      await fs.writeFile(path.join(dir, `${id}.json`), JSON.stringify({ schemaVersion: 1, id, project: "ariadne", target: "deployment", status: "approved", action: "Isolated test scope", decisionBy: "James", decidedAt: "2026-10-13T00:00:00Z" }));
      const auth = path.join(vaultRoot, "auth.md");
      await fs.writeFile(auth, "Isolated test authorization");
      const result = await planMutationReadiness({ project: "ariadne", vaultRoot, target: "deployment", risk: "high", scope: "Isolated test scope", approvalRef: id, authEvidenceRefs: [auth], evidenceRefs: [], dryRunCommand: "git status --short", proposedLiveCommand: "printf mocked-live", postVerificationCommand: "git status --short", rollback: "Isolated test rollback" });
      const originalPlan = await fs.readFile(result.jsonPath);
      const dryRun = await runMutationDryRun({ project: "ariadne", vaultRoot, plan: result.plan.id });
      expect(dryRun.record.planSha256).toBe(createHash("sha256").update(originalPlan).digest("hex"));
      expect(command).toHaveBeenCalledTimes(1);
      for (const patch of [{ proposedLiveCommand: "printf changed-live" }, { postVerificationCommand: "printf changed-post" }, { scope: "Changed scope" }, { rollback: "Changed rollback" }, { notes: "Changed note" }]) {
        await fs.writeFile(result.jsonPath, JSON.stringify({ ...result.plan, ...patch }));
        await expect(runMutationExecution({ project: "ariadne", vaultRoot, plan: result.plan.id, confirmPlan: result.plan.id })).rejects.toThrow("matching the complete plan digest");
        expect(command).toHaveBeenCalledTimes(1);
      }
      await fs.writeFile(result.jsonPath, originalPlan);
      const { planSha256: _digest, ...legacy } = dryRun.record;
      await fs.writeFile(dryRun.jsonPath, JSON.stringify(legacy));
      await expect(runMutationExecution({ project: "ariadne", vaultRoot, plan: result.plan.id, confirmPlan: result.plan.id })).rejects.toThrow("matching the complete plan digest");
      expect(command).toHaveBeenCalledTimes(1);
      await fs.writeFile(dryRun.jsonPath, JSON.stringify(dryRun.record));
      expect((await runMutationExecution({ project: "ariadne", vaultRoot, plan: result.plan.id, confirmPlan: result.plan.id })).record.status).toBe("passed");
      expect(command).toHaveBeenCalledTimes(3);
    } finally { command.mockRestore(); await fs.rm(vaultRoot, { recursive: true, force: true }); }
  });
});
