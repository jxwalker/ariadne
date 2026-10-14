"""Claude hooks receive a fixed event argument; event JSON on stdin is never read."""
from harness_adapter import main
if __name__ == '__main__': raise SystemExit(main('claude'))
