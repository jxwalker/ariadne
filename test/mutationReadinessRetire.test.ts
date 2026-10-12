import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
});
