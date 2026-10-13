"""Read-only helper tests; never run apply, execute, rollback or any live probe."""
import hashlib, json, os, pathlib, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PackageHelpers(unittest.TestCase):
    def test_plan_cannot_self_approve_or_use_unbound_authorization(self):
        if not pathlib.Path('/usr/bin/sha256sum').exists():self.skipTest('Deployment-host sha256sum required; validated on the VM and in CI')
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);head='a'*40;manifest='isolated test only\n'
            (root/'source-hashes.txt').write_text(manifest)
            digest=hashlib.sha256(manifest.encode()).hexdigest()
            (root/'common.sh').write_text(f'PKG={root}\nREPO={root}\nEVIDENCE={root}\nHEAD_SHA={head}\n')
            (root/'audited.sh').write_text((ROOT/'deployment/master/audited.sh').read_text())
            (root/'check-approval.py').write_text((ROOT/'deployment/master/check-approval.py').read_text())
            fake=root/'fake';fake.mkdir();log=root/'calls'
            (fake/'npm').write_text(f'#!/bin/sh\nprintf "%s\\n" "$*" >> {log}\n')
            (fake/'npm').chmod(0o700)
            env={**os.environ,'PATH':str(fake)+':'+os.environ['PATH']}
            result=subprocess.run(['bash',str(root/'audited.sh'),'plan'],env=env,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0);self.assertFalse(log.exists())
            approval={'status':'approved','project':'ariadne','target':'deployment','id':'approval-fixture','decisionBy':'James','decidedAt':'2026-10-13T00:00:00Z',
                      'action':f'Master phase 1 exact-head deployment: {head}; manifest {digest}'}
            path=root/'vault/projects/ariadne/control/approvals/approval-fixture.json';path.parent.mkdir(parents=True);path.write_text(json.dumps({**approval,'action':'wrong head'}))
            result=subprocess.run(['bash',str(root/'audited.sh'),'plan',str(path)],env=env,capture_output=True,text=True)
            self.assertNotEqual(result.returncode,0);self.assertFalse(log.exists())
            path.write_text(json.dumps(approval))
            result=subprocess.run(['bash',str(root/'audited.sh'),'plan',str(path)],env=env,capture_output=True,text=True)
            self.assertEqual(result.returncode,0,result.stderr)
            self.assertIn('mutation-readiness',log.read_text())
            self.assertNotIn('approval-request',log.read_text());self.assertNotIn('approval-decision',log.read_text())
    def test_readiness_retry_success_and_exhaustion(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp)
            (root/'common.sh').write_text((ROOT/'deployment/master/common.sh').read_text())
            (root/'HEAD_SHA').write_text('a'*40)
            for success,expected in [(True,0),(False,1)]:
                script='source "$1"; attempts=0; sleep(){ :; }; curl(){ attempts=$((attempts+1)); '+('[[ $attempts -eq 3 ]];' if success else 'return 1;')+' }; if wait_ready; then result=0; else result=$?; fi; echo "$attempts:$result"; exit "$result"'
                result=subprocess.run(['bash','-c',script,'test',str(root/'common.sh')],capture_output=True,text=True)
                self.assertEqual(result.returncode,expected,result.stderr)
                self.assertEqual(result.stdout.strip(),'3:0' if success else '20:1')

    def test_separate_operator_approval_binds_exact_package(self):
        import importlib.util
        spec=importlib.util.spec_from_file_location('approval_check',ROOT/'deployment/master/check-approval.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        head='a'*40;digest='b'*64
        record={'status':'approved','project':'ariadne','target':'deployment','decisionBy':'James','decidedAt':'2026-10-13T00:00:00Z','action':f'Master phase 1 exact-head deployment: {head}; manifest {digest}'}
        module.validate(record,head,digest)
        for patch in [{'status':'requested'},{'decisionBy':'Ariadne Bot (transcription)'},{'action':'Unrelated approval'},{'decidedAt':None}]:
            with self.assertRaises(ValueError):module.validate(record|patch,head,digest)
        with self.assertRaises(ValueError):module.validate(record,'c'*40,digest)
        with self.assertRaises(ValueError):module.validate(record,head,'d'*64)

    def test_canonical_approval_location(self):
        import importlib.util
        spec=importlib.util.spec_from_file_location('canonical_check',ROOT/'deployment/master/check-approval.py')
        module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
        with tempfile.TemporaryDirectory() as tmp:
            vault=pathlib.Path(tmp)/'vault';canonical=vault/'projects/ariadne/control/approvals/approval-test.json'
            canonical.parent.mkdir(parents=True);canonical.write_text('{}')
            record={'id':'approval-test'}
            module.validate_canonical_path(record,canonical,vault)
            with self.assertRaises(ValueError):module.validate_canonical_path(record,pathlib.Path(tmp)/'external.json',vault)
            canonical.unlink();canonical.symlink_to(pathlib.Path(tmp)/'external.json')
            with self.assertRaises(ValueError):module.validate_canonical_path(record,canonical,vault)

    def test_provisioning_approval_is_operation_specific(self):
        import importlib.util
        head='a'*40;digest='b'*64
        record={'status':'approved','project':'ariadne','target':'deployment','decisionBy':'James','decidedAt':'2026-10-13T00:00:00Z','action':f'Master PostgreSQL provision: {head}; manifest {digest}'}
        for location in [ROOT/'deployment/master/check-approval.py',ROOT/'docs/master/postgres-package/check-approval.py']:
            spec=importlib.util.spec_from_file_location('provision_check',location)
            module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
            module.validate(record,head,digest,'postgres-provision')
            with self.assertRaises(ValueError):module.validate(record,head,digest,'master')
            with self.assertRaises(ValueError):module.validate(record|{'action':f'Master phase 1 exact-head deployment: {head}; manifest {digest}'},head,digest,'postgres-provision')
            with self.assertRaises(ValueError):module.validate(record,'c'*40,digest,'postgres-provision')

    def test_prepare_bootstraps_missing_head_and_rejects_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);head='a'*40
            (root/'prepare.sh').write_text((ROOT/'deployment/master/prepare.sh').read_text())
            (root/'common.sh').write_text('test -f "'+str(root/'HEAD_SHA')+'"; stage(){ exit 88; };\n')
            fake=root/'fake';fake.mkdir()
            (fake/'git').write_text('#!/bin/sh\nprintf "%s\\n" "'+head+'"\n');(fake/'git').chmod(0o700)
            env={**os.environ,'PATH':str(fake)+':'+os.environ['PATH'],'ARIADNE_MASTER_REPO':str(root)}
            mismatch=subprocess.run(['bash',str(root/'prepare.sh'),'b'*40],env=env,capture_output=True)
            self.assertNotEqual(mismatch.returncode,0);self.assertFalse((root/'HEAD_SHA').exists())
            correct=subprocess.run(['bash',str(root/'prepare.sh'),head],env=env,capture_output=True)
            self.assertEqual(correct.returncode,88,correct.stderr)
            self.assertEqual((root/'HEAD_SHA').read_text().strip(),head)

    def test_session_verifier_accepts_real_compact_serialization(self):
        import re
        script=(ROOT/'deployment/master/verify.sh').read_text()
        command=re.search(r"python3 -c '([^']+)'",script).group(1)
        from activity_server import canonical
        for data,expected in [({'canRespond':False},0),({'canRespond':True},1)]:
            result=subprocess.run(['python3','-c',command],input=canonical(data),capture_output=True,text=True)
            self.assertEqual(result.returncode,expected)

    def test_stage_rejects_partial_tree_before_archive(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=pathlib.Path(tmp);head='a'*40
            (root/'HEAD_SHA').write_text(head);(root/'common.sh').write_text((ROOT/'deployment/master/common.sh').read_text())
            (root/'stage').mkdir();(root/'stage/obsolete.py').write_text('retained failed-preparation evidence')
            fake=root/'fake';fake.mkdir();log=root/'archive-called'
            (fake/'git').write_text('#!/bin/sh\ntouch "'+str(log)+'"\n');(fake/'git').chmod(0o700)
            env={**os.environ,'PATH':str(fake)+':'+os.environ['PATH'],'ARIADNE_MASTER_REPO':str(root)}
            result=subprocess.run(['bash','-c','source "$1"; stage','test',str(root/'common.sh')],env=env,capture_output=True)
            self.assertNotEqual(result.returncode,0);self.assertFalse(log.exists())
            self.assertEqual((root/'stage/obsolete.py').read_text(),'retained failed-preparation evidence')
