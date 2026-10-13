"""Read-only helper tests; never run apply, execute, rollback or any live probe."""
import pathlib, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class PackageHelpers(unittest.TestCase):
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
