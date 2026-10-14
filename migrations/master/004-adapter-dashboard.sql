-- Additive read-only dashboard projection; no agent grant or acceptance change.
BEGIN;
CREATE OR REPLACE FUNCTION master.snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,master AS $$
 SELECT jsonb_build_object(
 'nodes',coalesce((SELECT jsonb_agg(to_jsonb(n)||jsonb_build_object('blockers',master.blockers(n.id),'waiverInactive',master.waiver_inactive(n)) ORDER BY n.id) FROM master.nodes n),'[]'),
 'aliases',coalesce((SELECT jsonb_agg(a ORDER BY a.source,a.alias) FROM master.aliases a),'[]'),
 'dependencies',coalesce((SELECT jsonb_agg(d ORDER BY d.work_id,d.dependency_id) FROM master.dependencies d),'[]'),
 'scope',coalesce((SELECT jsonb_agg(s ORDER BY s.baseline_id,s.criterion_id) FROM master.scope s),'[]'),
 'progress',coalesce((SELECT jsonb_agg(p ORDER BY p.baseline_id) FROM master.progress p),'[]'),
 'accepted',coalesce((SELECT jsonb_agg(to_jsonb(a)||jsonb_build_object('waiver_owner_id',(master.criterion_owner(a.work_id,a.criterion_id)).id) ORDER BY a.work_id,a.criterion_id) FROM master.accepted a),'[]'),
 'acceptanceEvidence',coalesce((SELECT jsonb_agg(a ORDER BY a.work_id,a.criterion_id,a.kind) FROM master.acceptance_evidence a),'[]'),
 'evidence',coalesce((SELECT jsonb_agg(e ORDER BY e.id) FROM master.evidence e),'[]'),
 'imports',coalesce((SELECT jsonb_agg(i ORDER BY i.id) FROM master.imports i),'[]'),
 'agentState',coalesce((SELECT jsonb_agg(state ORDER BY work_id) FROM (
 SELECT l.work_id,l.capability_id,l.generation,l.owner_generation,l.expires_at,l.released_at,l.resumed,
 c.agent_identity,c.harness,c.execution_source,
 (l.released_at IS NULL AND l.expires_at>clock_timestamp() AND coalesce(n.body->'generation'=to_jsonb(l.owner_generation),false) AND c.revoked_at IS NULL AND c.expires_at>clock_timestamp()) AS current,
 (SELECT jsonb_build_object('at',r.at,'idempotencyKey',r.idempotency_key,'result',r.result) FROM master.agent_command_receipts r WHERE r.payload->>'target'=l.work_id AND r.capability_id=l.capability_id AND (r.payload->'generation'=to_jsonb(l.generation) OR (r.payload->>'op'='claim' AND r.result->>'ok'='true' AND r.result->'generation'=to_jsonb(l.generation))) ORDER BY r.at DESC,r.idempotency_key DESC LIMIT 1) AS last_receipt,
 (SELECT max(r.at) FROM master.agent_command_receipts r WHERE r.payload->>'target'=l.work_id AND r.capability_id=l.capability_id AND r.payload->'generation'=to_jsonb(l.generation) AND r.payload->>'op'='update' AND r.result->>'ok'='true') AS last_progress,
 (SELECT jsonb_build_object('at',h.at,'generation',h.generation,'body',h.body) FROM master.handovers h WHERE h.work_id=l.work_id ORDER BY h.generation DESC LIMIT 1) AS handover,
 coalesce((SELECT jsonb_agg(jsonb_build_object('capabilityId',e.capability_id,'generation',e.generation,'commandKey',e.command_key,'agentIdentity',ec.agent_identity,'harness',ec.harness,'executionSource',ec.execution_source,'role',coalesce(er.role,'implementer'),'body',e.body) ORDER BY e.capability_id,e.command_key) FROM master.retained_agent_evidence e JOIN master.agent_capabilities ec ON ec.id=e.capability_id LEFT JOIN master.agent_roles er ON er.capability_id=e.capability_id WHERE e.work_id=l.work_id),'[]'::jsonb) AS evidence_refs
 FROM master.work_leases l JOIN master.agent_capabilities c ON c.id=l.capability_id JOIN master.nodes n ON n.id=l.work_id
 ) state),'[]'::jsonb),
 'workBindings',coalesce((SELECT jsonb_agg(b ORDER BY b.execution_source,b.repository,b.native_kind,b.native_id) FROM master.work_bindings b),'[]'::jsonb),
 'history',coalesce((SELECT jsonb_agg(j ORDER BY sequence) FROM master.journal j),'[]'));
$$;
REVOKE ALL ON FUNCTION master.snapshot() FROM PUBLIC;

CREATE INDEX agent_receipt_target_at ON master.agent_command_receipts ((payload->>'target'),at DESC);
INSERT INTO master.migrations(version) VALUES(4);
COMMIT;
