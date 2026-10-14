-- Synthetic-tested Phase 2 slice 2; additive, no enrollment or live grants.
BEGIN;
ALTER TABLE master.agent_capabilities DROP CONSTRAINT agent_capabilities_allowed_operations_check;
ALTER TABLE master.agent_capabilities ADD CHECK (allowed_operations <@ ARRAY['packet','update','transition','claim','renew','release','handover','resume','receipt','retainedEvidence','review','evaluate']::text[]);
CREATE TABLE master.agent_roles(capability_id text PRIMARY KEY REFERENCES master.agent_capabilities(id), role text NOT NULL CHECK(role IN ('implementer','reviewer','evaluator')));
CREATE TRIGGER agent_roles_immutable BEFORE UPDATE OR DELETE ON master.agent_roles FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TABLE master.work_leases(work_id text PRIMARY KEY REFERENCES master.nodes(id), capability_id text NOT NULL REFERENCES master.agent_capabilities(id), generation bigint NOT NULL, expires_at timestamptz NOT NULL, released_at timestamptz, resumed boolean NOT NULL DEFAULT false);
CREATE TABLE master.lease_resources(work_id text REFERENCES master.work_leases(work_id), repository text NOT NULL, path text NOT NULL, PRIMARY KEY(work_id,path));
CREATE TABLE master.assignments(id text PRIMARY KEY, work_id text NOT NULL REFERENCES master.nodes(id), capability_id text NOT NULL REFERENCES master.agent_capabilities(id), generation bigint NOT NULL, state text NOT NULL CHECK(state IN ('offered','received','acknowledged','started','expired')), expires_at timestamptz NOT NULL, UNIQUE(work_id,generation));
CREATE TABLE master.assignment_receipts(assignment_id text REFERENCES master.assignments(id), state text NOT NULL, at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(assignment_id,state));
CREATE TRIGGER assignment_receipts_immutable BEFORE UPDATE OR DELETE ON master.assignment_receipts FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TABLE master.handovers(work_id text REFERENCES master.nodes(id), generation bigint NOT NULL, capability_id text NOT NULL REFERENCES master.agent_capabilities(id), body jsonb NOT NULL, at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(work_id,generation));
CREATE TRIGGER handovers_immutable BEFORE UPDATE OR DELETE ON master.handovers FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TABLE master.retained_agent_evidence(work_id text REFERENCES master.nodes(id), capability_id text REFERENCES master.agent_capabilities(id), generation bigint NOT NULL, command_key text NOT NULL, body jsonb NOT NULL, PRIMARY KEY(capability_id,command_key));
CREATE TRIGGER retained_agent_evidence_immutable BEFORE UPDATE OR DELETE ON master.retained_agent_evidence FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TABLE master.work_effects(work_id text REFERENCES master.nodes(id), command_key text NOT NULL, payload jsonb NOT NULL, result jsonb NOT NULL, PRIMARY KEY(work_id,command_key));
CREATE TRIGGER work_effects_immutable BEFORE UPDATE OR DELETE ON master.work_effects FOR EACH ROW EXECUTE FUNCTION master.immutable();
ALTER FUNCTION master.agent_request(text,text,jsonb) RENAME TO agent_request_slice1;
REVOKE ALL ON FUNCTION master.agent_request_slice1(text,text,jsonb) FROM PUBLIC;
-- Keep the old function private even where a transport grant already exists.
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ariadne_agent_transport') THEN REVOKE ALL ON FUNCTION master.agent_request_slice1(text,text,jsonb) FROM ariadne_agent_transport; END IF; END $$;
CREATE FUNCTION master.agent_request(cap_id text, nonce_id text, request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,master AS $$
DECLARE cap master.agent_capabilities; work master.nodes; lease master.work_leases; offer master.assignments; prior master.agent_command_receipts;
 op text:=request->>'op'; key text:=request->>'idempotencyKey'; role_name text; result jsonb; packet jsonb; normalized jsonb;
 scope_path text; ttl integer; lease_now timestamptz; hand jsonb; effect master.work_effects; first_owner boolean;
BEGIN
 -- Same transaction lock as operator commands; conflicts and ownership are committed together.
 PERFORM pg_advisory_xact_lock(20261013,1);
 SELECT * INTO cap FROM master.agent_capabilities WHERE id=cap_id FOR UPDATE;
 lease_now:=clock_timestamp();
 IF cap.id IS NULL OR cap.key_ref IS DISTINCT FROM request->>'keyRef' OR cap.revoked_at IS NOT NULL OR cap.issued_at>lease_now OR cap.expires_at<=lease_now THEN RETURN '{"ok":false,"error":"capability unavailable"}'; END IF;
 IF (SELECT count(*) FROM master.agent_nonces WHERE capability_id=cap_id AND at>lease_now-interval '1 minute')>=300 THEN RETURN '{"ok":false,"error":"request rate exceeded"}'; END IF;
 IF nonce_id IS NULL OR nonce_id !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' THEN RETURN '{"ok":false,"error":"invalid nonce"}'; END IF;
 IF EXISTS(SELECT 1 FROM master.agent_nonces WHERE capability_id=cap_id AND nonce=nonce_id) THEN RETURN '{"ok":false,"error":"signature replay"}'; END IF;
 INSERT INTO master.agent_nonces VALUES(cap_id,nonce_id,lease_now);
 SELECT * INTO work FROM master.nodes WHERE id=request->>'target' FOR UPDATE;
 SELECT * INTO lease FROM master.work_leases WHERE work_id=work.id;
 SELECT coalesce((SELECT role FROM master.agent_roles WHERE capability_id=cap_id),'implementer') INTO role_name;
 packet:=jsonb_build_object('id',work.id,'revision',work.revision,'generation',work.body->'generation','owner',work.body->>'owner','state',work.body->>'state','nextAction',work.body->>'nextAction');
 IF work.kind IS DISTINCT FROM 'work' OR NOT coalesce(work.id=ANY(cap.eligible_work_ids),false)
 OR NOT coalesce(request->>'repository'=ANY(cap.repositories),false) OR work.body->'source'->>'repository' IS DISTINCT FROM request->>'repository'
 OR NOT EXISTS(SELECT 1 FROM master.work_bindings WHERE execution_source=cap.execution_source AND repository=request->>'repository' AND native_kind=request->>'nativeKind' AND native_id=request->>'nativeId' AND work_id=work.id)
 THEN result:='{"ok":false,"error":"work scope denied"}';
 ELSIF NOT coalesce(op=ANY(cap.allowed_operations),false) THEN result:='{"ok":false,"error":"operation denied"}';
 ELSIF (role_name='implementer' AND op IN ('review','evaluate')) OR (role_name='reviewer' AND op NOT IN ('packet','review','retainedEvidence')) OR (role_name='evaluator' AND op NOT IN ('packet','evaluate','retainedEvidence')) THEN result:='{"ok":false,"error":"role operation denied"}';
 END IF;
 IF op='packet' THEN
  IF result IS NOT NULL THEN RETURN result; END IF;
  RETURN jsonb_build_object('ok',true,'work',packet||jsonb_build_object('takeoverBaseline',work.body->'takeoverBaseline','blocker',work.body->'blocker','branch',work.body->'branch','candidate',work.body->'candidate','outcome',work.body->'goal','parent',work.parent,'phase',(SELECT parent FROM master.nodes WHERE id=work.parent),'milestone',work.parent,'criteria',work.body->'criteria','pathScope',work.body->'pathScope','policy',work.body->'policy','policyRevision',(SELECT revision FROM master.nodes WHERE id=work.body->>'policy'),'policyRules',(SELECT jsonb_build_object('requiredKinds',body->'requiredKinds','maxAgeSeconds',body->'maxAgeSeconds') FROM master.nodes WHERE id=work.body->>'policy'),'recentReceipts',coalesce((SELECT jsonb_agg(r) FROM (SELECT receipt.idempotency_key,receipt.result,receipt.at FROM master.agent_command_receipts receipt WHERE receipt.capability_id=cap_id AND receipt.payload->>'target'=work.id ORDER BY receipt.at DESC LIMIT 10) r),'[]'::jsonb),'harness',cap.harness,'executionSource',cap.execution_source,'repository',request->>'repository',
   'handover',(SELECT body FROM master.handovers WHERE work_id=work.id ORDER BY generation DESC LIMIT 1),
   'lease',CASE WHEN lease.capability_id=cap_id THEN to_jsonb(lease) ELSE NULL END,
   'assignments',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY generation) FROM master.assignments a WHERE a.work_id=work.id AND a.capability_id=cap_id AND a.state<>'expired' AND (a.state='started' OR a.expires_at>lease_now)),'[]'::jsonb),
   'dependencies',coalesce((SELECT jsonb_agg(dependency_id ORDER BY dependency_id) FROM master.dependencies WHERE work_id=work.id AND dependency_id=ANY(cap.eligible_work_ids)),'[]'::jsonb),
   'hasUnscopedDependencies',EXISTS(SELECT 1 FROM master.dependencies WHERE work_id=work.id AND NOT dependency_id=ANY(cap.eligible_work_ids))));
 END IF;
 IF key IS NULL OR key !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' THEN RETURN '{"ok":false,"error":"idempotency key required"}'; END IF;
 SELECT * INTO prior FROM master.agent_command_receipts WHERE capability_id=cap_id AND idempotency_key=key;
 IF FOUND THEN
  IF prior.payload IS DISTINCT FROM request THEN RETURN '{"ok":false,"error":"idempotency payload conflict"}'; END IF;
  IF result IS NOT NULL THEN RETURN result; END IF;
  RETURN prior.result;
 END IF;
 IF result IS NULL THEN
 BEGIN
  IF op NOT IN ('claim','retainedEvidence','review','evaluate') THEN
   IF lease.capability_id IS DISTINCT FROM cap_id OR lease.generation IS DISTINCT FROM (request->>'generation')::bigint OR work.body->'generation' IS DISTINCT FROM request->'generation' OR work.body->>'owner' IS DISTINCT FROM cap.agent_identity OR lease.released_at IS NOT NULL OR lease.expires_at<=lease_now THEN RAISE EXCEPTION 'lease ownership conflict'; END IF;
  END IF;
  IF op NOT IN ('retainedEvidence','review','evaluate','update','transition') AND work.revision IS DISTINCT FROM (request->>'expectedRevision')::integer THEN RAISE EXCEPTION 'revision conflict'; END IF;
  IF op='claim' THEN
   IF jsonb_typeof(request->'generation') IS DISTINCT FROM 'number'
   OR request->'generation' IS DISTINCT FROM work.body->'generation'
   THEN RAISE EXCEPTION 'ownership generation conflict'; END IF;
   IF coalesce(work.body->>'state','') NOT IN ('ready','active') OR master.blockers(work.id)<>'[]'::jsonb THEN RAISE EXCEPTION 'work not eligible'; END IF;
   IF lease.released_at IS NULL AND lease.expires_at>lease_now THEN RAISE EXCEPTION 'work already claimed'; END IF;
   IF jsonb_typeof(work.body->'pathScope') IS DISTINCT FROM 'array' OR jsonb_array_length(work.body->'pathScope') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'exclusive path scope required'; END IF;
   FOR scope_path IN SELECT jsonb_array_elements_text(work.body->'pathScope') LOOP
    IF scope_path<>'.' AND (scope_path !~ '^[A-Za-z0-9_.-]+(/[A-Za-z0-9_.-]+)*$' OR scope_path ~ '(^|/)\.\.?(/|$)') THEN RAISE EXCEPTION 'invalid path scope'; END IF;
    IF EXISTS(SELECT 1 FROM master.lease_resources r JOIN master.work_leases l USING(work_id) WHERE l.released_at IS NULL AND l.expires_at>lease_now AND r.repository=request->>'repository' AND (r.path='.' OR scope_path='.' OR r.path=lower(scope_path) OR left(r.path,length(scope_path)+1)=lower(scope_path)||'/' OR left(lower(scope_path),length(r.path)+1)=r.path||'/')) THEN RAISE EXCEPTION 'exclusive scope conflict'; END IF;
   END LOOP;
   UPDATE master.assignments SET state='expired' WHERE (state IN ('offered','received','acknowledged') AND expires_at<=lease_now) OR (work_id=work.id AND generation<(work.body->>'generation')::bigint+1);
   IF (SELECT count(*) FROM master.assignments WHERE capability_id=cap_id AND state IN ('offered','received','acknowledged') AND expires_at>lease_now)>=100 THEN RAISE EXCEPTION 'assignment queue full'; END IF;
   ttl:=coalesce((request->>'leaseSeconds')::integer,300); IF ttl NOT BETWEEN 1 AND 3600 THEN RAISE EXCEPTION 'invalid lease duration'; END IF;
   first_owner:=lease.work_id IS NULL AND work.body->>'owner'=cap.agent_identity AND NOT EXISTS(SELECT 1 FROM master.handovers WHERE work_id=work.id);
   UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('owner',cap.agent_identity,'generation',(body->>'generation')::bigint+1) WHERE id=work.id RETURNING * INTO work;
   INSERT INTO master.work_leases VALUES(work.id,cap_id,(work.body->>'generation')::bigint,least(lease_now+ttl*interval '1 second',cap.expires_at),NULL,first_owner) ON CONFLICT(work_id) DO UPDATE SET capability_id=EXCLUDED.capability_id,generation=EXCLUDED.generation,expires_at=EXCLUDED.expires_at,released_at=NULL,resumed=EXCLUDED.resumed;
   DELETE FROM master.lease_resources WHERE work_id=work.id;
   INSERT INTO master.lease_resources SELECT work.id,request->>'repository',lower(value) FROM jsonb_array_elements_text(work.body->'pathScope') ON CONFLICT DO NOTHING;
   INSERT INTO master.assignments VALUES('assignment-'||work.id||'-'||(work.body->>'generation'),work.id,cap_id,(work.body->>'generation')::bigint,'offered',least(lease_now+ttl*interval '1 second',cap.expires_at));
   result:=jsonb_build_object('ok',true,'revision',work.revision,'generation',work.body->'generation','assignmentId','assignment-'||work.id||'-'||(work.body->>'generation'));
  ELSIF op='renew' THEN
   ttl:=coalesce((request->>'leaseSeconds')::integer,300); IF ttl NOT BETWEEN 1 AND 3600 THEN RAISE EXCEPTION 'invalid lease duration'; END IF;
   IF EXISTS(SELECT 1 FROM master.assignments WHERE work_id=work.id AND generation=lease.generation AND state IN ('offered','received','acknowledged') AND expires_at<=lease_now) THEN RAISE EXCEPTION 'offer expired'; END IF;
   UPDATE master.work_leases SET expires_at=least(lease_now+ttl*interval '1 second',cap.expires_at) WHERE work_id=work.id;
   result:=jsonb_build_object('ok',true,'revision',work.revision,'generation',lease.generation);
  ELSIF op='receipt' THEN
   SELECT * INTO offer FROM master.assignments WHERE id=request->>'assignmentId' AND capability_id=cap_id AND work_id=work.id AND generation=lease.generation;
   IF offer.id IS NULL OR offer.state='expired' OR (offer.state IN ('offered','received','acknowledged') AND offer.expires_at<=lease_now) THEN RAISE EXCEPTION 'offer expired or unavailable'; END IF;
   IF request->>'state' NOT IN ('received','acknowledged','started') THEN RAISE EXCEPTION 'invalid receipt'; END IF;
   IF NOT EXISTS(SELECT 1 FROM master.assignment_receipts WHERE assignment_id=offer.id AND state=request->>'state') THEN
    IF (offer.state='offered' AND request->>'state'<>'received') OR (offer.state='received' AND request->>'state'<>'acknowledged') OR (offer.state='acknowledged' AND request->>'state'<>'started') OR offer.state='started' THEN RAISE EXCEPTION 'receipt order conflict'; END IF;
    INSERT INTO master.assignment_receipts(assignment_id,state) VALUES(offer.id,request->>'state');
    UPDATE master.assignments SET state=request->>'state' WHERE id=offer.id;
   END IF;
   result:=jsonb_build_object('ok',true,'revision',work.revision);
  ELSIF op='handover' THEN
   hand:=request->'handover';
   IF jsonb_typeof(hand) IS DISTINCT FROM 'object' OR NOT hand ?& ARRAY['branch','revision','changedPaths','checks','evidenceRefs','remainingWork','blockers','nextAction','localWork'] OR hand-ARRAY['branch','revision','changedPaths','checks','evidenceRefs','remainingWork','blockers','nextAction','localWork']<>'{}'::jsonb OR length(hand::text)>16000 OR jsonb_typeof(hand->'branch') IS DISTINCT FROM 'string' OR jsonb_typeof(hand->'revision') IS DISTINCT FROM 'string' OR jsonb_typeof(hand->'changedPaths') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'checks') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'evidenceRefs') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'remainingWork') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'blockers') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'localWork') IS DISTINCT FROM 'array' OR jsonb_typeof(hand->'nextAction') IS DISTINCT FROM 'string' OR coalesce(hand->>'branch','')='' OR coalesce(hand->>'revision','') !~ '^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'complete bounded handover required'; END IF;
   INSERT INTO master.handovers VALUES(work.id,lease.generation,cap_id,hand,lease_now);
   UPDATE master.work_leases SET released_at=lease_now WHERE work_id=work.id;
   result:=jsonb_build_object('ok',true,'revision',work.revision,'handover',hand);
  ELSIF op='release' THEN
   UPDATE master.work_leases SET released_at=lease_now WHERE work_id=work.id;
   result:=jsonb_build_object('ok',true,'revision',work.revision);
  ELSIF op='resume' THEN
   SELECT body INTO hand FROM master.handovers WHERE work_id=work.id AND generation=lease.generation-1;
   IF hand IS NULL AND work.body->'takeoverBaseline'->>'generation'=(lease.generation-1)::text THEN hand:=work.body->'takeoverBaseline'; END IF;
   IF hand->>'branch' IS NULL OR hand->>'revision' IS NULL THEN RAISE EXCEPTION 'environment baseline unavailable'; END IF;
   IF (hand->>'branch' IS DISTINCT FROM request->>'branch' OR hand->>'revision' IS DISTINCT FROM request->>'revision') THEN RAISE EXCEPTION 'environment mismatch'; END IF;
   UPDATE master.work_leases SET resumed=true WHERE work_id=work.id;
   result:=jsonb_build_object('ok',true,'revision',work.revision);
  ELSIF op IN ('retainedEvidence','review','evaluate') THEN
   IF jsonb_typeof(request->'evidence') IS DISTINCT FROM 'object' OR length((request->'evidence')::text)>4000 OR (request->'evidence')-ARRAY['uri','sha256','summary','kind','candidate','synthetic','status']<>'{}'::jsonb OR EXISTS(SELECT 1 FROM jsonb_each(request->'evidence') field WHERE (field.key='synthetic' AND jsonb_typeof(field.value)<>'boolean') OR (field.key<>'synthetic' AND (jsonb_typeof(field.value)<>'string' OR length(field.value#>>'{}')>500))) OR request->>'generation' IS NULL THEN RAISE EXCEPTION 'bounded retained evidence required'; END IF;
   IF (SELECT count(*) FROM master.retained_agent_evidence WHERE capability_id=cap_id)>=1000 THEN RAISE EXCEPTION 'retained evidence capacity reached'; END IF;
   INSERT INTO master.retained_agent_evidence VALUES(work.id,cap_id,(request->>'generation')::bigint,key,jsonb_build_object('operation',op,'evidence',request->'evidence'));
   result:=jsonb_build_object('ok',true,'retainedOnly',true,'current',packet);
  ELSIF op IN ('update','transition') THEN
   IF NOT lease.resumed THEN RAISE EXCEPTION 'environment verification required'; END IF;
   IF NOT EXISTS(SELECT 1 FROM master.assignments WHERE work_id=work.id AND generation=lease.generation AND state='started') THEN RAISE EXCEPTION 'assignment not started'; END IF;
   normalized:=request-ARRAY['generation','expectedRevision','nativeKind','nativeId','keyRef','assignmentId'];
   SELECT * INTO effect FROM master.work_effects WHERE work_id=work.id AND command_key=key;
   IF FOUND THEN
    IF effect.payload IS DISTINCT FROM normalized THEN RAISE EXCEPTION 'idempotency payload conflict'; END IF;
    result:=effect.result;
   ELSE
    IF work.revision IS DISTINCT FROM (request->>'expectedRevision')::integer THEN RAISE EXCEPTION 'revision conflict'; END IF;
    IF op='update' AND (jsonb_typeof(request->'patch') IS DISTINCT FROM 'object' OR (request->'patch')-ARRAY['nextAction','blocker']<>'{}'::jsonb) THEN RAISE EXCEPTION 'patch denied'; END IF;
    result:=master.command(cap.agent_identity,jsonb_build_object('commandId','work-effect-'||encode(sha256(convert_to(jsonb_build_array(work.id,key)::text,'UTF8')),'hex'),'op',op,'target',work.id,'expectedRevision',request->'expectedRevision','reason',request->>'reason','via',cap.execution_source||'/'||cap.harness,'patch',request->'patch','state',CASE WHEN request->>'state'='Done' THEN 'verification' ELSE request->>'state' END));
    IF NOT coalesce((result->>'ok')::boolean,false) AND coalesce(result->>'error','') NOT IN ('revision conflict','permission denied','invalid transition','operator cancellation required','terminal work','dependencies unresolved or unaccepted','scope not approved','invalid lifecycle order','reason required','immutable scope or invalid patch','accepted work immutable') THEN result:=jsonb_build_object('ok',false,'error','command rejected','current',packet); END IF;
    INSERT INTO master.work_effects VALUES(work.id,key,normalized,result);
   END IF;
  ELSE RAISE EXCEPTION 'operation denied'; END IF;
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT IN ('lease ownership conflict','ownership generation conflict','revision conflict','work not eligible','work already claimed','exclusive path scope required','invalid path scope','exclusive scope conflict','assignment queue full','invalid lease duration','offer expired','offer expired or unavailable','invalid receipt','receipt order conflict','complete bounded handover required','environment mismatch','environment baseline unavailable','bounded retained evidence required','environment verification required','assignment not started','idempotency payload conflict','patch denied','operation denied','retained evidence capacity reached') THEN
   result:=jsonb_build_object('ok',false,'error','command rejected','current',packet);
  ELSE result:=jsonb_build_object('ok',false,'error',SQLERRM,'current',packet); END IF;
 END;
 END IF;
 INSERT INTO master.agent_command_receipts VALUES(cap_id,key,request,result,lease_now);
 INSERT INTO master.journal(command_id,actor,via,target,result) VALUES('lease-'||encode(sha256(convert_to(jsonb_build_array(cap_id,key)::text,'UTF8')),'hex'),cap.agent_identity,cap.execution_source||'/'||cap.harness,coalesce(work.id,'[missing target]'),result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION master.agent_request(text,text,jsonb) FROM PUBLIC;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='ariadne_agent_transport') THEN GRANT EXECUTE ON FUNCTION master.agent_request(text,text,jsonb) TO ariadne_agent_transport; END IF; END $$;
-- Supported operator recovery path, separate from all signed agent operations.
CREATE FUNCTION master.record_takeover_baseline(actor_id text, request jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,master AS $$
DECLARE work master.nodes; prior master.commands; result jsonb; before_state jsonb; after_state jsonb;
 cid text:=request->>'commandId'; baseline jsonb:=request->'baseline';
BEGIN
 IF session_user NOT IN ('james','ariadne_master') OR actor_id IS DISTINCT FROM 'james' THEN RAISE EXCEPTION 'operator recovery required'; END IF;
 PERFORM pg_advisory_xact_lock(20261013,1);
 IF cid IS NULL OR cid !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' THEN RETURN '{"ok":false,"error":"command ID required"}'; END IF;
 SELECT * INTO prior FROM master.commands WHERE id=cid;
 IF FOUND THEN
  IF prior.actor=actor_id AND prior.payload=request THEN RETURN prior.result; END IF;
  RETURN '{"ok":false,"error":"command ID payload conflict"}';
 END IF;
 SELECT * INTO work FROM master.nodes WHERE id=request->>'target' FOR UPDATE;
 before_state:=master.node_state(work);
 BEGIN
  IF work.kind IS DISTINCT FROM 'work' OR work.body->>'state' IN ('accepted','cancelled','superseded') THEN RAISE EXCEPTION 'recovery work unavailable'; END IF;
  IF work.revision IS DISTINCT FROM (request->>'expectedRevision')::integer THEN RAISE EXCEPTION 'revision conflict'; END IF;
  IF coalesce(request->>'reason','')='' OR length(request->>'reason')>500 THEN RAISE EXCEPTION 'bounded recovery reason required'; END IF;
  IF jsonb_typeof(baseline) IS DISTINCT FROM 'object' OR baseline-ARRAY['generation','branch','revision']<>'{}'::jsonb OR NOT baseline ?& ARRAY['generation','branch','revision'] OR jsonb_typeof(baseline->'generation') IS DISTINCT FROM 'number' OR baseline->>'generation' IS DISTINCT FROM ((work.body->>'generation')::bigint-1)::text OR coalesce(baseline->>'branch','')='' OR length(baseline->>'branch')>200 OR coalesce(baseline->>'revision','') !~ '^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'invalid takeover baseline'; END IF;
  UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('takeoverBaseline',baseline) WHERE id=work.id RETURNING * INTO work;
  after_state:=master.node_state(work);
  result:=jsonb_build_object('ok',true,'revision',work.revision);
 EXCEPTION WHEN OTHERS THEN
  IF SQLERRM IN ('recovery work unavailable','revision conflict','bounded recovery reason required','invalid takeover baseline') THEN result:=jsonb_build_object('ok',false,'error',SQLERRM);
  ELSE result:='{"ok":false,"error":"recovery command rejected"}'; END IF;
 END;
 INSERT INTO master.commands(id,actor,payload,result) VALUES(cid,actor_id,request,result);
 INSERT INTO master.journal(command_id,actor,via,target,before_state,after_state,result) VALUES(cid,actor_id,'operator-recovery',coalesce(work.id,'[missing target]'),before_state,after_state,result);
 INSERT INTO master.outbox(command_id,body) VALUES(cid,jsonb_build_object('commandId',cid,'target',work.id,'result',result));
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION master.record_takeover_baseline(text,jsonb) FROM PUBLIC;
INSERT INTO master.migrations(version) VALUES(3);
COMMIT;
