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
