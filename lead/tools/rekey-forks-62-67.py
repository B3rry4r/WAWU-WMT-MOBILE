#!/usr/bin/env python3
"""rekey.py (run in the backend worktree root): re-key the ONE accepted forks entry for FlutterwaveConfigResponse
from content-piece.service.ts:62 to :67, the way GATES-02 round 2 did (1d03bc2): same owner, reason and message;
only `evidence`, `where` and the key (a hash of the evidence) change. Nothing else in the baseline changes.
NOT RUN by the MERGE-7 preparer: the auto-mode classifier denied the baseline edit ("Security Test Removal")."""
import hashlib, json

p = "scripts/gates/baseline.json"
raw = open(p, encoding="utf-8").read()
b = json.loads(raw)
assert json.dumps(b, indent=2, sort_keys=True) + "\n" == raw, "baseline format differs from run.py's writer"
old = "e67bb3d0f7e3f93e"
e = dict(b["accepted"][old])
assert e["where"] == "src/content-piece/content-piece.service.ts:62"
ev = ("src/content-piece/content-piece.service.ts:67, src/credit-purchase/credit-purchase.service.ts:16, "
      "src/purchase/purchase.service.ts:25")
e["evidence"] = ev
e["where"] = "src/content-piece/content-piece.service.ts:67"
key_raw = f"{e['gate']}\x00src/content-piece/content-piece.service.ts\x00{ev.strip()[:200]}\x00{e['message']}"
new = hashlib.sha256(key_raw.encode("utf-8")).hexdigest()[:16]
print(old, "->", new)
del b["accepted"][old]
b["accepted"][new] = e
open(p, "w", encoding="utf-8").write(json.dumps(b, indent=2, sort_keys=True) + "\n")
