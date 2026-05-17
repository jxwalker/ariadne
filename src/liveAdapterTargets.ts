import type { LiveAdapterEvidenceTarget } from "./types.js";

export const LIVE_ADAPTER_TARGETS = [
  "github",
  "deployment",
  "hermes-cron",
  "openscorpion",
  "gsd2",
  "notebooklm"
] as const satisfies readonly LiveAdapterEvidenceTarget[];

export type LiveAdapterTarget = (typeof LIVE_ADAPTER_TARGETS)[number];

export function isLiveAdapterTarget(value: unknown): value is LiveAdapterTarget {
  return typeof value === "string" && (LIVE_ADAPTER_TARGETS as readonly string[]).includes(value);
}
