BEGIN;
CREATE SCHEMA IF NOT EXISTS master;
CREATE TABLE IF NOT EXISTS master.migrations(version integer PRIMARY KEY, installed_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.nodes(
 id text PRIMARY KEY CHECK (id ~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$'),
 kind text NOT NULL CHECK(kind IN ('product','baseline','phase','milestone','work','policy','decision','external')),
 parent text REFERENCES master.nodes(id), revision integer NOT NULL CHECK(revision>0),
 body jsonb NOT NULL CHECK(jsonb_typeof(body)='object'), created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.aliases(source text NOT NULL, alias text NOT NULL, node_id text NOT NULL REFERENCES master.nodes(id), PRIMARY KEY(source,alias));
CREATE TABLE master.imports(id text PRIMARY KEY, body jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.dependencies(work_id text NOT NULL REFERENCES master.nodes(id), dependency_id text NOT NULL,
 PRIMARY KEY(work_id,dependency_id), CHECK(work_id<>dependency_id));
-- Unresolved edges are deliberately retained, and always block readiness.
CREATE TABLE master.evidence(id text PRIMARY KEY, work_id text NOT NULL REFERENCES master.nodes(id), body jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.scope(baseline_id text NOT NULL REFERENCES master.nodes(id), criterion_id text NOT NULL,
 work_id text NOT NULL REFERENCES master.nodes(id), PRIMARY KEY(baseline_id,criterion_id));
CREATE TABLE master.accepted(work_id text NOT NULL REFERENCES master.nodes(id), criterion_id text NOT NULL,
 evidence_id text REFERENCES master.evidence(id), command_id text NOT NULL, PRIMARY KEY(work_id,criterion_id), UNIQUE(criterion_id));
CREATE TABLE master.acceptance_evidence(work_id text NOT NULL REFERENCES master.nodes(id), criterion_id text NOT NULL, kind text NOT NULL, evidence_id text NOT NULL REFERENCES master.evidence(id), command_id text NOT NULL, PRIMARY KEY(work_id,criterion_id,kind));
CREATE TABLE master.commands(id text PRIMARY KEY, actor text NOT NULL, payload jsonb NOT NULL, result jsonb NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.journal(sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, command_id text NOT NULL,
 actor text NOT NULL, target text NOT NULL, before_state jsonb, after_state jsonb, result jsonb NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE TABLE master.outbox(sequence bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, command_id text NOT NULL UNIQUE,
 body jsonb NOT NULL, at timestamptz NOT NULL DEFAULT now());
CREATE FUNCTION master.immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'append-only'; END $$;
CREATE TRIGGER accepted_immutable BEFORE UPDATE OR DELETE ON master.accepted FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER acceptance_evidence_immutable BEFORE UPDATE OR DELETE ON master.acceptance_evidence FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER journal_immutable BEFORE UPDATE OR DELETE ON master.journal FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER command_immutable BEFORE UPDATE OR DELETE ON master.commands FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER import_immutable BEFORE UPDATE OR DELETE ON master.imports FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE TRIGGER evidence_immutable BEFORE UPDATE OR DELETE ON master.evidence FOR EACH ROW EXECUTE FUNCTION master.immutable();
CREATE FUNCTION master.blockers(w text) RETURNS jsonb LANGUAGE sql STABLE SET search_path=pg_catalog,master AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',d.dependency_id,'state',coalesce(n.body->>'state','unresolved'))),'[]')
 FROM master.dependencies d LEFT JOIN master.nodes n ON n.id=d.dependency_id
 WHERE d.work_id=w AND (n.id IS NULL OR n.kind<>'work' OR n.body->>'state' IS DISTINCT FROM 'accepted');
$$;
CREATE FUNCTION master.command(actor text, c jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
 SET search_path=pg_catalog,master AS $$
DECLARE old master.nodes; prior master.commands; b jsonb; r jsonb; op text:=c->>'op';
 target text:=c->>'target'; cid text:=c->>'commandId'; dep text; criterion jsonb; e master.evidence;
 scope_entry jsonb; child jsonb; child_criteria jsonb; split_ids text[]; next_revision integer; before_state jsonb; error_text text;
BEGIN
 -- One lock serializes commands including graph and baseline changes. Reads do not lock.
 PERFORM pg_advisory_xact_lock(20261013,1);
 IF actor IS NULL OR actor !~ '^(james|agent:[A-Za-z0-9_.:-]+)$' THEN RAISE EXCEPTION 'invalid actor'; END IF;
 -- The deployed application role cannot impersonate agents; no agent login is provisioned.
 IF session_user='ariadne_master' AND actor<>'james' THEN RAISE EXCEPTION 'operator-only transport'; END IF;
 IF cid IS NULL OR cid !~ '^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$' OR target IS NULL THEN RAISE EXCEPTION 'invalid command identity'; END IF;
 SELECT * INTO prior FROM master.commands WHERE id=cid;
 IF FOUND THEN
  IF prior.actor=actor AND prior.payload=c THEN RETURN prior.result; END IF;
  INSERT INTO master.journal(command_id,actor,target,result) VALUES(cid,actor,target,'{"ok":false,"error":"command ID payload conflict"}');
  RETURN '{"ok":false,"error":"command ID payload conflict"}';
 END IF;
 SELECT * INTO old FROM master.nodes WHERE id=target;
 before_state:=CASE WHEN old.id IS NOT NULL THEN to_jsonb(old) END;
 BEGIN
  IF c->>'reason' IS NULL OR length(c->>'reason')=0 THEN RAISE EXCEPTION 'reason required'; END IF;
  IF coalesce((c->>'expectedRevision')::integer,-1)<>coalesce(old.revision,0) THEN RAISE EXCEPTION 'revision conflict'; END IF;
  IF actor<>'james' AND (op NOT IN ('update','transition') OR old.kind<>'work' OR old.body->>'owner' IS DISTINCT FROM actor)
    THEN RAISE EXCEPTION 'permission denied'; END IF;
  IF op='create' THEN
   IF old.id IS NOT NULL THEN RAISE EXCEPTION 'identity already exists'; END IF;
   b:=c->'body';
   IF b IS NULL OR jsonb_typeof(b)<>'object' THEN RAISE EXCEPTION 'body required'; END IF;
   IF c->>'kind' IN ('work','baseline') AND coalesce(b->>'state','proposed')<>'proposed' THEN RAISE EXCEPTION 'new scope must be proposed'; END IF;
   IF c->>'kind'='work' THEN
    IF b ? 'candidate' AND coalesce(b->>'candidate','') !~ '^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'invalid candidate revision'; END IF;
    IF jsonb_array_length(coalesce(b->'criteria','[]'))=0 OR b->>'policy' IS NULL OR b->>'goal' IS NULL THEN RAISE EXCEPTION 'work requires goal policy criteria'; END IF;
    IF NOT EXISTS(SELECT 1 FROM master.nodes WHERE id=b->>'policy' AND kind='policy') THEN RAISE EXCEPTION 'unknown policy'; END IF;
    IF EXISTS(SELECT 1 FROM jsonb_array_elements(b->'criteria') x WHERE coalesce(x->>'id','')='' OR coalesce(x->>'text','')='') THEN RAISE EXCEPTION 'criterion id and text required'; END IF;
    IF EXISTS(SELECT 1 FROM master.nodes w, jsonb_array_elements(w.body->'criteria') x, jsonb_array_elements(b->'criteria') y WHERE w.kind='work' AND x->>'id'=y->>'id') THEN RAISE EXCEPTION 'criterion identity already exists; use split'; END IF;
    IF (SELECT count(DISTINCT x->>'id') FROM jsonb_array_elements(b->'criteria') x)<>jsonb_array_length(b->'criteria') THEN RAISE EXCEPTION 'duplicate criterion'; END IF;
    b:=b||'{"state":"proposed"}';
   END IF;
   IF c->>'kind'='baseline' THEN b:=b||'{"state":"proposed"}'; END IF;
   IF c->>'kind'='external' THEN
    IF coalesce(b->>'state','unresolved')<>'unresolved' THEN RAISE EXCEPTION 'external gap cannot assert acceptance'; END IF;
    b:=b||'{"state":"unresolved"}';
   END IF;
   IF c->>'kind'='policy' THEN
    IF jsonb_array_length(coalesce(b->'requiredKinds','[]'))=0 OR coalesce((b->>'maxAgeSeconds')::integer,0)<=0
      OR b->'requiredKinds' ? 'agent_run' THEN RAISE EXCEPTION 'invalid acceptance policy'; END IF;
   END IF;
   IF c->>'kind' IN ('baseline','phase','milestone','work') AND NOT EXISTS(
    SELECT 1 FROM master.nodes WHERE id=c->>'parent' AND kind=CASE c->>'kind' WHEN 'baseline' THEN 'product' WHEN 'phase' THEN 'baseline' WHEN 'milestone' THEN 'phase' ELSE 'milestone' END)
    THEN RAISE EXCEPTION 'invalid hierarchy'; END IF;
   INSERT INTO master.nodes(id,kind,parent,revision,body) VALUES(target,c->>'kind',c->>'parent',1,b);
   FOR scope_entry IN SELECT * FROM jsonb_array_elements(coalesce(c->'aliases','[]')) LOOP
    INSERT INTO master.aliases VALUES(scope_entry->>'source',scope_entry->>'alias',target);
   END LOOP;
  ELSIF old.id IS NULL THEN RAISE EXCEPTION 'unknown target';
  ELSIF op='update' THEN
   IF old.kind<>'work' OR (c->'patch') - ARRAY['title','owner','nextAction','candidate','blocker','requirements','refs'] <> '{}'::jsonb THEN RAISE EXCEPTION 'immutable scope or invalid patch'; END IF;
   IF actor<>'james' AND c->'patch' ?| ARRAY['owner','candidate','requirements','refs'] THEN RAISE EXCEPTION 'permission denied'; END IF;
   IF old.body->>'state'='accepted' THEN RAISE EXCEPTION 'accepted work immutable'; END IF;
   IF c->'patch' ? 'candidate' AND coalesce(c->'patch'->>'candidate','') !~ '^[a-f0-9]{40}$' THEN RAISE EXCEPTION 'invalid candidate revision'; END IF;
   b:=old.body||(c->'patch');
   IF c->'patch' ? 'blocker' AND old.body->>'blockerSince' IS NULL THEN b:=b||jsonb_build_object('blockerSince',now()); END IF;
   UPDATE master.nodes SET body=b, revision=revision+1 WHERE id=target;
  ELSIF op='split' THEN
   IF old.kind<>'work' OR old.body->>'state' IN ('cancelled','superseded') OR jsonb_array_length(coalesce(c->'children','[]'))<2 THEN RAISE EXCEPTION 'invalid split'; END IF;
   SELECT array_agg(x->>'id' ORDER BY x->>'id') INTO split_ids FROM jsonb_array_elements(c->'children') ch, jsonb_array_elements(ch->'criteria') x;
   IF split_ids IS DISTINCT FROM (SELECT array_agg(x->>'id' ORDER BY x->>'id') FROM jsonb_array_elements(old.body->'criteria') x) THEN RAISE EXCEPTION 'split must preserve criterion denominator exactly'; END IF;
   FOR child IN SELECT * FROM jsonb_array_elements(c->'children') LOOP
    SELECT jsonb_agg(x) INTO child_criteria FROM jsonb_array_elements(old.body->'criteria') x WHERE child->'criteria' @> jsonb_build_array(jsonb_build_object('id',x->>'id'));
    IF child_criteria IS NULL OR child->>'title' IS NULL THEN RAISE EXCEPTION 'empty split child'; END IF;
    INSERT INTO master.nodes(id,kind,parent,revision,body) VALUES(child->>'id','work',old.parent,1,
      old.body||jsonb_build_object('title',child->>'title','criteria',child_criteria,'splitFrom',target,'state',CASE WHEN old.body->>'state'='accepted' THEN 'accepted' ELSE 'proposed' END));
    INSERT INTO master.dependencies SELECT child->>'id',dependency_id FROM master.dependencies WHERE work_id=target;
   END LOOP;
   UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('state','superseded','splitChildren',c->'children') WHERE id=target;
  ELSIF op='dependencies' THEN
   IF old.kind<>'work' OR old.body->>'state'='accepted' THEN RAISE EXCEPTION 'invalid dependency target'; END IF;
   IF jsonb_typeof(c->'dependencies') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'dependency array required'; END IF;
   IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(c->'dependencies') dep(id) JOIN master.nodes n ON n.id=dep.id WHERE n.kind NOT IN ('work','external')) THEN RAISE EXCEPTION 'dependency requires work or external gap'; END IF;
   DELETE FROM master.dependencies WHERE work_id=target;
   FOR dep IN SELECT jsonb_array_elements_text(c->'dependencies') LOOP INSERT INTO master.dependencies VALUES(target,dep); END LOOP;
   IF EXISTS(WITH RECURSIVE walk(id,path,cycle) AS (
    SELECT target,ARRAY[target],false UNION ALL
    SELECT d.dependency_id, path||d.dependency_id,d.dependency_id=ANY(path)
     FROM walk JOIN master.dependencies d ON d.work_id=walk.id WHERE NOT cycle)
    SELECT 1 FROM walk WHERE cycle) THEN RAISE EXCEPTION 'dependency cycle'; END IF;
   UPDATE master.nodes SET revision=revision+1 WHERE id=target;
  ELSIF op='transition' THEN
   IF old.kind<>'work' OR c->>'state' IS NULL OR c->>'state' NOT IN ('ready','active','verification','blocked','waiting','parked','cancelled') THEN RAISE EXCEPTION 'invalid transition'; END IF;
   IF old.body->>'state' IN ('accepted','cancelled','superseded') THEN RAISE EXCEPTION 'terminal work'; END IF;
   IF c->>'state' IN ('ready','active','verification') THEN
    IF master.blockers(target)<>'[]'::jsonb THEN RAISE EXCEPTION 'dependencies unresolved or unaccepted'; END IF;
    IF NOT EXISTS(SELECT 1 FROM master.nodes bl WHERE bl.kind='baseline' AND bl.body->>'state'='approved' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(old.body->'criteria') criterion WHERE NOT EXISTS(SELECT 1 FROM master.scope s WHERE s.baseline_id=bl.id AND s.criterion_id=criterion->>'id'))) THEN RAISE EXCEPTION 'scope not approved'; END IF;
   END IF;
   IF c->>'state'='active' AND old.body->>'state'<>'ready' OR c->>'state'='verification' AND old.body->>'state'<>'active' THEN RAISE EXCEPTION 'invalid lifecycle order'; END IF;
   b:=old.body||jsonb_build_object('state',c->>'state');
   IF c->>'state' IN ('blocked','waiting') THEN b:=b||jsonb_build_object('blockerSince',coalesce(old.body->>'blockerSince',now()::text),'blocker',c->>'reason'); END IF;
   UPDATE master.nodes SET body=b,revision=revision+1 WHERE id=target;
  ELSIF op='scope' THEN
   IF old.kind<>'baseline' OR old.body->>'state'<>'proposed' THEN RAISE EXCEPTION 'approved baseline scope immutable'; END IF;
   DELETE FROM master.scope WHERE baseline_id=target;
   FOR scope_entry IN SELECT * FROM jsonb_array_elements(c->'scope') LOOP
    IF NOT EXISTS(SELECT 1 FROM master.nodes w WHERE w.id=scope_entry->>'workId' AND w.kind='work' AND w.body->'criteria' @> jsonb_build_array(jsonb_build_object('id',scope_entry->>'criterionId')))
      THEN RAISE EXCEPTION 'unknown scope criterion'; END IF;
    INSERT INTO master.scope VALUES(target,scope_entry->>'criterionId',scope_entry->>'workId');
   END LOOP;
   UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('scopeDiff',c->'scopeDiff') WHERE id=target;
  ELSIF op='approve' THEN
   IF old.kind<>'baseline' OR old.body->>'state'<>'proposed' OR NOT EXISTS(SELECT 1 FROM master.scope WHERE baseline_id=target) THEN RAISE EXCEPTION 'baseline requires proposed scope'; END IF;
   UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('state','approved','approvedBy',actor,'approvedAt',now()) WHERE id=target;
  ELSIF op='evidence' THEN
   IF old.kind<>'work' THEN RAISE EXCEPTION 'evidence requires work'; END IF;
   b:=c->'evidence';
   IF b->>'id' IS NULL OR b->>'kind' NOT IN ('agent_run','github_pr','ci','merge','deploy','eval','runtime','review','document') OR b->>'uri' IS NULL THEN RAISE EXCEPTION 'invalid evidence'; END IF;
   INSERT INTO master.evidence VALUES(b->>'id',target,b,now());
   UPDATE master.nodes SET revision=revision+1 WHERE id=target;
  ELSIF op IN ('accept','override') THEN
   IF old.kind<>'work' OR old.body->>'state'<>'verification' OR master.blockers(target)<>'[]'::jsonb THEN RAISE EXCEPTION 'not eligible for acceptance'; END IF;
   IF NOT EXISTS(SELECT 1 FROM master.nodes bl WHERE bl.kind='baseline' AND bl.body->>'state'='approved' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(old.body->'criteria') criterion WHERE NOT EXISTS(SELECT 1 FROM master.scope s WHERE s.baseline_id=bl.id AND s.criterion_id=criterion->>'id'))) THEN RAISE EXCEPTION 'scope not approved'; END IF;
   SELECT body INTO b FROM master.nodes WHERE id=old.body->>'policy' AND kind='policy';
   FOR criterion IN SELECT * FROM jsonb_array_elements(old.body->'criteria') LOOP
    FOR dep IN SELECT jsonb_array_elements_text(b->'requiredKinds') LOOP
     SELECT * INTO e FROM master.evidence ev WHERE ev.work_id=target
      AND ev.body->>'kind'=dep AND ev.body->>'criterionId'=criterion->>'id'
      AND ev.body->>'candidate'=old.body->>'candidate' AND old.body->>'candidate' IS NOT NULL
      AND ev.body->>'policy'=old.body->>'policy' AND ev.body->>'status'='passed'
      AND ev.body->'synthetic'='false'::jsonb AND ev.body->>'sha256' ~ '^[a-f0-9]{64}$'
      AND (ev.body->>'observedAt')::timestamptz <= now()
      AND (ev.body->>'observedAt')::timestamptz >= now()-make_interval(secs=>(b->>'maxAgeSeconds')::integer)
      ORDER BY ev.recorded_at DESC LIMIT 1;
     IF NOT FOUND AND op='accept' THEN RAISE EXCEPTION 'missing stale unrelated or synthetic required evidence: % %',criterion->>'id',dep; END IF;
     IF FOUND THEN INSERT INTO master.acceptance_evidence VALUES(target,criterion->>'id',dep,e.id,cid); END IF;
    END LOOP;
    IF op='override' AND (c->>'risk' IS NULL OR (c->>'expiresAt')::timestamptz <= now() OR c->>'expiresAt' IS NULL OR NOT (c->'waivedCriteria' ? (criterion->>'id'))) THEN RAISE EXCEPTION 'override requires explicit criteria risk expiry'; END IF;
    INSERT INTO master.accepted VALUES(target,criterion->>'id',CASE WHEN op='accept' THEN e.id END,cid);
   END LOOP;
   UPDATE master.nodes SET revision=revision+1,body=body||jsonb_build_object('state','accepted','acceptedBy',actor,'acceptanceCommand',cid) WHERE id=target;
  ELSIF op='import' THEN
   b:=c->'provenance';
   IF b->>'import_id' IS NULL OR coalesce(b->>'sha256','') !~ '^[a-f0-9]{64}$' OR b->>'commit_sha' IS NULL OR b->>'observed_at' IS NULL OR b->>'path' IS NULL OR b->>'reconciliation_reason' IS NULL THEN RAISE EXCEPTION 'incomplete provenance'; END IF;
   INSERT INTO master.imports VALUES(b->>'import_id',b,now());
   UPDATE master.nodes SET revision=revision+1 WHERE id=target;
  ELSE RAISE EXCEPTION 'unknown command'; END IF;
  SELECT revision INTO next_revision FROM master.nodes WHERE id=target;
  r:=jsonb_build_object('ok',true,'id',target,'revision',next_revision);
 EXCEPTION WHEN OTHERS THEN
  GET STACKED DIAGNOSTICS error_text=MESSAGE_TEXT;
  r:=jsonb_build_object('ok',false,'error',error_text);
 END;
 INSERT INTO master.commands VALUES(cid,actor,c,r,now());
 INSERT INTO master.journal(command_id,actor,target,before_state,after_state,result)
  SELECT cid,actor,target,before_state,to_jsonb(n),r FROM (SELECT 1) x LEFT JOIN master.nodes n ON n.id=target;
 INSERT INTO master.outbox(command_id,body) VALUES(cid,jsonb_build_object('target',target,'result',r));
 RETURN r;
END $$;
CREATE VIEW master.products AS SELECT * FROM master.nodes WHERE kind='product';
CREATE VIEW master.baselines AS SELECT * FROM master.nodes WHERE kind='baseline';
CREATE VIEW master.phases AS SELECT * FROM master.nodes WHERE kind='phase';
CREATE VIEW master.milestones AS SELECT * FROM master.nodes WHERE kind='milestone';
CREATE VIEW master.work_items AS SELECT * FROM master.nodes WHERE kind='work';
CREATE VIEW master.acceptance_policies AS SELECT * FROM master.nodes WHERE kind='policy';
CREATE VIEW master.decisions AS SELECT * FROM master.nodes WHERE kind='decision';
CREATE VIEW master.progress AS
 SELECT n.id baseline_id,n.body->>'state' baseline_state,count(s.criterion_id) denominator,
 count(a.criterion_id) accepted_criteria FROM master.nodes n
 LEFT JOIN master.scope s ON s.baseline_id=n.id LEFT JOIN master.accepted a ON a.criterion_id=s.criterion_id
 WHERE n.kind='baseline' GROUP BY n.id;
CREATE FUNCTION master.snapshot() RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,master AS $$
 SELECT jsonb_build_object(
 'nodes',coalesce((SELECT jsonb_agg(to_jsonb(n)||jsonb_build_object('blockers',master.blockers(n.id))) FROM master.nodes n),'[]'),
 'aliases',coalesce((SELECT jsonb_agg(a) FROM master.aliases a),'[]'),
 'dependencies',coalesce((SELECT jsonb_agg(d) FROM master.dependencies d),'[]'),
 'scope',coalesce((SELECT jsonb_agg(s) FROM master.scope s),'[]'),
 'progress',coalesce((SELECT jsonb_agg(p) FROM master.progress p),'[]'),
 'accepted',coalesce((SELECT jsonb_agg(a) FROM master.accepted a),'[]'),
 'acceptanceEvidence',coalesce((SELECT jsonb_agg(a) FROM master.acceptance_evidence a),'[]'),
 'evidence',coalesce((SELECT jsonb_agg(e) FROM master.evidence e),'[]'),
 'imports',coalesce((SELECT jsonb_agg(i) FROM master.imports i),'[]'),
 'history',coalesce((SELECT jsonb_agg(j ORDER BY sequence) FROM master.journal j),'[]'));
$$;
REVOKE ALL ON SCHEMA master FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA master FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA master FROM PUBLIC;
INSERT INTO master.migrations VALUES(1);
COMMIT;
