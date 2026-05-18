# Roadmap Control Refresh

Project: ariadne
Status: blocked
Generated: 2026-05-18T08:16:03.681Z
Mutation approved: false
Approval granted: false
Operator evidence record created: false

## Summary

- Roadmap: blocked (3 blocked)
- Artifact checks: passed (0 required missing)
- Live adapter next actions: actions_required
- Operator evidence: blocked
- Operator queue: evidence_required
- Operator next target: deployment
- GBrain documents: 41
- Dossiers: 6

## Commands

- Status: `npm run ariadne -- status --project ariadne`
- E2E smoke: `npm run ariadne -- e2e-smoke --project ariadne`
- Refresh: `npm run ariadne -- roadmap-control-refresh --project ariadne`
- Next operator packet: `npm run ariadne -- live-adapter-operator-evidence-next --project ariadne --target deployment`
- Next operator draft: `npm run ariadne -- live-adapter-operator-evidence-draft --project ariadne --target deployment`
- Operator draft pack: `npm run ariadne -- live-adapter-operator-evidence-drafts --project ariadne`

## Artifacts

| Artifact | Ref |
| --- | --- |
| mutationReadinessAudit | projects/ariadne/control/mutation-readiness-audit.json |
| mutationReadinessRepairPlan | projects/ariadne/control/mutation-readiness-repair-plan.json |
| liveAdapterReadiness | projects/ariadne/control/live-adapter-readiness.json |
| liveAdapterNextActions | projects/ariadne/control/live-adapter-next-actions.json |
| liveAdapterApprovalPack | projects/ariadne/control/live-adapter-approval-pack.json |
| liveAdapterApprovalReviewAudit | projects/ariadne/control/live-adapter-approval-review-audit.json |
| liveAdapterEvidenceTemplates | projects/ariadne/control/live-adapter-evidence-templates.json |
| liveAdapterOperatorEvidenceAudit | projects/ariadne/control/live-adapter-operator-evidence-audit.json |
| liveAdapterOperatorEvidenceWorkplan | projects/ariadne/control/live-adapter-operator-evidence-workplan.json |
| liveAdapterOperatorEvidenceWorkspace | projects/ariadne/control/live-adapter-operator-evidence-workspace.json |
| liveAdapterOperatorEvidenceAssist | projects/ariadne/control/live-adapter-operator-evidence-assist.json |
| liveAdapterOperatorEvidenceBatchCheck | projects/ariadne/control/live-adapter-operator-evidence-check-all.json |
| liveAdapterOperatorEvidenceQueue | projects/ariadne/control/live-adapter-operator-evidence-queue.json |
| liveAdapterOperatorEvidenceNext | projects/ariadne/control/live-adapter-operator-evidence-next-deployment.json |
| liveAdapterOperatorEvidenceDraft | projects/ariadne/control/live-adapter-operator-evidence-draft-deployment.json |
| liveAdapterOperatorEvidenceDraftPack | projects/ariadne/control/live-adapter-operator-evidence-drafts.json |
| liveAdapterReviewSession | projects/ariadne/control/live-adapter-review-session.json |
| liveAdapterCutoverAudit | projects/ariadne/control/live-adapter-cutover-audit.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-github.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-deployment.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-hermes-cron.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-openscorpion.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-gsd2.json |
| liveAdapterDossiers | projects/ariadne/control/live-adapter-dossiers/live-adapter-dossier-notebooklm.json |
| gbrainExport | projects/ariadne/integrations/gbrain/gbrain-export.json |
| artifactChecks | projects/ariadne/evaluation/artifact-checks.json |
| roadmapCompletionAudit | projects/ariadne/control/roadmap-completion-audit.json |

## Notes

- This refresh is non-mutating: it does not approve mutations, grant live-adapter authority, or import operator evidence.
- The GBrain export is refreshed after the roadmap completion audit so advisory memory sees the latest control state.
- A blocked status is expected while operator evidence or cutover gates still require human proof.
