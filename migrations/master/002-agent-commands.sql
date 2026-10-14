-- Phase 2 slice 1. Additive; enrollment and grants require separate approval.
BEGIN;
CREATE TABLE master.agent_capabilities (
 id text PRIMARY KEY, agent_identity text NOT NULL CHECK(agent_identity ~ '^agent:[A-Za-z0-9_.:-]+$'),
 harness text NOT NULL, execution_source text NOT NULL, key_ref text NOT NULL UNIQUE,
 repositories text[] NOT NULL CHECK(cardinality(repositories)>0 AND repositories <@ ARRAY['jxwalker/patent-studio','jxwalker/openscorpion','jxwalker/ariadne']::text[]),
 eligible_work_ids text[] NOT NULL CHECK(cardinality(eligible_work_ids)>0),
 allowed_operations text[] NOT NULL CHECK(allowed_operations <@ ARRAY['update','transition','packet']::text[]),
 issued_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL,
 revoked_at timestamptz, rotation_predecessor text REFERENCES master.agent_capabilities(id),
 CHECK(isfinite(issued_at) AND isfinite(expires_at) AND expires_at>issued_at));
CREATE TABLE master.agent_nonces(capability_id text REFERENCES master.agent_capabilities(id), nonce text NOT NULL,
 at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(capability_id,nonce));
CREATE TABLE master.work_bindings(execution_source text NOT NULL, repository text NOT NULL CHECK(repository IN ('jxwalker/patent-studio','jxwalker/openscorpion','jxwalker/ariadne')),
 native_kind text NOT NULL CHECK(native_kind IN ('task','run')), native_id text NOT NULL,
 work_id text NOT NULL REFERENCES master.nodes(id), created_by text NOT NULL CHECK(created_by='james'),
 approval_reference text NOT NULL CHECK(length(approval_reference)>0), created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(execution_source,repository,native_kind,native_id));
CREATE TABLE master.agent_command_receipts(capability_id text REFERENCES master.agent_capabilities(id),
 idempotency_key text NOT NULL, payload jsonb NOT NULL, result jsonb NOT NULL,
 at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(capability_id,idempotency_key));
CREATE TRIGGER agent_receipts_immutable BEFORE UPDATE OR DELETE ON master.agent_command_receipts FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER work_bindings_immutable BEFORE UPDATE OR DELETE ON master.work_bindings FOR EACH ROW EXECUTE FUNCTION master.immutable();

-- The HTTPS transport authenticates with the key reference before calling this function.
-- Its distinct DB role receives only this function, never command/snapshot/table access.
CREATE FUNCTION master.agent_request(cap_id text, nonce_id text, request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,master AS $$
DECLARE cap master.agent_capabilities; work master.nodes; previous master.agent_command_receipts;
 result jsonb; c jsonb; key text:=request->>'idempotencyKey';
BEGIN
 PERFORM pg_advisory_xact_lock(20261013,1);
 SELECT * INTO cap FROM master.agent_capabilities WHERE id=cap_id FOR UPDATE;
 IF cap.key_ref IS DISTINCT FROM request->>'keyRef' OR cap.id IS NULL OR cap.revoked_at IS NOT NULL OR cap.issued_at>now() OR cap.expires_at<=now() THEN
  RETURN '{"ok":false,"error":"capability unavailable"}'; END IF;
 IF nonce_id IS NULL OR nonce_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' THEN RETURN '{"ok":false,"error":"invalid nonce"}'; END IF;
 IF EXISTS(SELECT 1 FROM master.agent_nonces WHERE capability_id=cap_id AND nonce=nonce_id) THEN
  RETURN '{"ok":false,"error":"signature replay"}'; END IF;
 INSERT INTO master.agent_nonces VALUES(cap_id,nonce_id,now());
 SELECT * INTO work FROM master.nodes WHERE id=request->>'target';
 IF work.kind IS DISTINCT FROM 'work' OR NOT (work.id=ANY(cap.eligible_work_ids))
 OR work.body->>'owner' IS DISTINCT FROM cap.agent_identity
 OR NOT coalesce(request->>'repository'=ANY(cap.repositories),false)
 OR work.body->'source'->>'repository' IS DISTINCT FROM request->>'repository'
 OR NOT EXISTS(SELECT 1 FROM master.work_bindings binding WHERE binding.execution_source=cap.execution_source
   AND binding.repository=request->>'repository' AND binding.native_kind=request->>'nativeKind'
   AND binding.native_id=request->>'nativeId' AND binding.work_id=work.id)
 THEN RETURN '{"ok":false,"error":"work scope denied"}'; END IF;
 IF NOT coalesce(request->>'op'=ANY(cap.allowed_operations),false) THEN RETURN '{"ok":false,"error":"operation denied"}'; END IF;
 IF request->>'op'='packet' THEN
  -- Deliberately allowlisted fields: no unrelated history, source observations or decisions.
  RETURN jsonb_build_object('ok',true,'work',jsonb_build_object('id',work.id,'revision',work.revision,
   'generation',work.body->'generation','owner',cap.agent_identity,'harness',cap.harness,'executionSource',cap.execution_source,
   'repository',request->>'repository','outcome',work.body->'goal','parent',work.parent,
   'criteria',work.body->'criteria','pathScope',work.body->'pathScope',
   'milestone',work.parent,'phase',(SELECT parent FROM master.nodes WHERE id=work.parent),
   'policy',work.body->>'policy','policyRevision',(SELECT revision FROM master.nodes WHERE id=work.body->>'policy'),
   'policyRules',(SELECT jsonb_build_object('requiredKinds',body->'requiredKinds','maxAgeSeconds',body->'maxAgeSeconds') FROM master.nodes WHERE id=work.body->>'policy'),
   'handover',NULL,
   'dependencies',coalesce((SELECT jsonb_agg(dependency_id ORDER BY dependency_id) FROM master.dependencies WHERE work_id=work.id),'[]'::jsonb),
   'recentReceipts',coalesce((SELECT jsonb_agg(r) FROM (SELECT receipt.idempotency_key,receipt.result,receipt.at FROM master.agent_command_receipts receipt
      WHERE receipt.capability_id=cap_id AND receipt.payload->>'target'=work.id ORDER BY receipt.at DESC LIMIT 10) r),'[]'::jsonb),
   'state',work.body->>'state','nextAction',work.body->>'nextAction'));
 END IF;
 IF key IS NULL OR key !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' THEN RETURN '{"ok":false,"error":"idempotency key required"}'; END IF;
 SELECT * INTO previous FROM master.agent_command_receipts WHERE capability_id=cap_id AND idempotency_key=key;
 IF FOUND THEN
  IF previous.payload=request THEN RETURN previous.result; END IF;
  RETURN '{"ok":false,"error":"idempotency payload conflict"}';
 END IF;
 IF request->'generation' IS DISTINCT FROM work.body->'generation' THEN result:='{"ok":false,"error":"ownership generation conflict"}';
 ELSIF request->>'op'='update' AND (jsonb_typeof(request->'patch') IS DISTINCT FROM 'object' OR
 (request->'patch')-ARRAY['nextAction','blocker'] <> '{}'::jsonb) THEN result:='{"ok":false,"error":"patch denied"}';
 ELSIF request->>'op' NOT IN ('update','transition') THEN result:='{"ok":false,"error":"operation denied"}';
 ELSE
  c:=jsonb_build_object('commandId','agent-'||encode(sha256(convert_to(jsonb_build_array(cap_id,key)::text,'UTF8')),'hex'),'op',request->>'op','target',work.id,
   'expectedRevision',request->'expectedRevision','reason',request->>'reason','via',cap.execution_source||'/'||cap.harness);
  IF request->>'op'='update' THEN c:=c||jsonb_build_object('patch',request->'patch');
  ELSE c:=c||jsonb_build_object('state',CASE WHEN request->>'state'='Done' THEN 'verification' ELSE request->>'state' END); END IF;
  result:=master.command(cap.agent_identity,c);
 END IF;
 INSERT INTO master.agent_command_receipts VALUES(cap_id,key,request,result,now());
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION master.agent_request(text,text,jsonb) FROM PUBLIC;
CREATE FUNCTION master.bind_work(source_id text,repo text,native_type text,native text,work text,approval text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,master AS $$
BEGIN
 IF session_user NOT IN ('james','ariadne_master') THEN RAISE EXCEPTION 'operator binding required'; END IF;
 PERFORM pg_advisory_xact_lock(20261013,1);
 IF NOT EXISTS(SELECT 1 FROM master.nodes WHERE id=work AND kind='work' AND body->'source'->>'repository'=repo)
 THEN RAISE EXCEPTION 'binding scope mismatch'; END IF;
 INSERT INTO master.work_bindings(execution_source,repository,native_kind,native_id,work_id,created_by,approval_reference)
 VALUES(source_id,repo,native_type,native,work,'james',approval);
END $$;
REVOKE ALL ON FUNCTION master.bind_work(text,text,text,text,text,text) FROM PUBLIC;
INSERT INTO master.migrations(version) VALUES(2);
COMMIT;
