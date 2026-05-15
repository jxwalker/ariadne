import type { SecretFinding, SourceHygieneReport } from "./types.js";

const SECRET_PATTERNS: Array<{
  kind: string;
  severity: SecretFinding["severity"];
  pattern: RegExp;
}> = [
  { kind: "openai-api-key", severity: "high", pattern: /\bsk-[A-Za-z0-9_-]{20,}\b/g },
  { kind: "github-token", severity: "high", pattern: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { kind: "aws-access-key", severity: "high", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { kind: "private-key", severity: "high", pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
  {
    kind: "password-assignment",
    severity: "medium",
    pattern: /\b(password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*["']?[^"'\s]{8,}/gi
  }
];

export function scanTextForSecrets(sourcePath: string, text: string): SourceHygieneReport {
  const findings: SecretFinding[] = [];
  const lines = text.split("\n");

  for (const [index, line] of lines.entries()) {
    for (const rule of SECRET_PATTERNS) {
      rule.pattern.lastIndex = 0;
      if (rule.pattern.test(line)) {
        findings.push({
          kind: rule.kind,
          severity: rule.severity,
          line: index + 1,
          evidence: redactLine(line)
        });
      }
    }
  }

  return {
    schemaVersion: 1,
    sourcePath,
    scannedAt: new Date().toISOString(),
    status: findings.some((finding) => finding.severity === "high")
      ? "blocked"
      : findings.length > 0
        ? "warning"
        : "clean",
    findings
  };
}

export function shouldBlockHygiene(report: SourceHygieneReport): boolean {
  return report.status === "blocked";
}

function redactLine(line: string): string {
  return line
    .replace(/sk-[A-Za-z0-9_-]{8,}/g, "sk-[redacted]")
    .replace(/gh[pousr]_[A-Za-z0-9_]{8,}/g, "gh_[redacted]")
    .replace(/AKIA[0-9A-Z]{8,}/g, "AKIA[redacted]")
    .replace(/([:=]\s*["']?)[^"'\s]{8,}/g, "$1[redacted]");
}
