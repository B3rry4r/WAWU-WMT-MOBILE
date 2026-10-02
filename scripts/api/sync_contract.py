#!/usr/bin/env python3
"""Refresh the typed API client from the backend contract.

    python3 scripts/api/sync_contract.py --backend ../wawu-backend   # copy + generate
    python3 scripts/api/sync_contract.py                             # regenerate only

1. Copies wawu-backend/contract/openapi.json (from origin/main) into contract/,
   recording the source commit in contract/SOURCE_COMMIT.
2. Applies contract/mobile-exclusions.json, writing contract/openapi.mobile.json.
   Every exclusion is printed with its reason and owning task.
3. Runs openapi-typescript to regenerate src/api/schema.generated.ts.

The generated client is never edited by hand. A response shape the app needs
that the contract does not describe is a backend task, not a local type.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "contract" / "openapi.json"
MOBILE = ROOT / "contract" / "openapi.mobile.json"
EXCLUSIONS = ROOT / "contract" / "mobile-exclusions.json"


def copy_from_backend(backend: Path) -> None:
    subprocess.run(["git", "-C", str(backend), "fetch", "-q", "origin", "main:refs/remotes/origin/main"], check=True)
    text = subprocess.run(["git", "-C", str(backend), "show", "origin/main:contract/openapi.json"],
                          check=True, capture_output=True, text=True).stdout
    sha = subprocess.run(["git", "-C", str(backend), "rev-parse", "--short", "origin/main"],
                         check=True, capture_output=True, text=True).stdout.strip()
    CONTRACT.write_text(text)
    (ROOT / "contract" / "SOURCE_COMMIT").write_text(sha + "\n")
    print(f"copied contract from wawu-backend@{sha}")


def apply_exclusions() -> None:
    spec = json.loads(CONTRACT.read_text())
    rules = json.loads(EXCLUSIONS.read_text())
    tag_rx = [(re.compile(t["pattern"]), t) for t in rules["tags"]]
    ops = {(o["method"], o["path"]): o for o in rules["operations"]}
    removed_ops, removed_by_tag = [], 0
    for path in list(spec["paths"]):
        for method in list(spec["paths"][path]):
            op = spec["paths"][path][method]
            if not isinstance(op, dict):
                continue
            if (method, path) in ops:
                removed_ops.append(ops[(method, path)])
                del spec["paths"][path][method]
                continue
            if any(rx.search(t) for t in op.get("tags", []) for rx, _ in tag_rx):
                removed_by_tag += 1
                del spec["paths"][path][method]
        if not spec["paths"][path]:
            del spec["paths"][path]
    missing = [o for o in rules["operations"] if o not in removed_ops]
    MOBILE.write_text(json.dumps(spec, indent=1) + "\n")
    print(f"excluded {removed_by_tag} operations by tag ({', '.join(t['pattern'] for t in rules['tags'])})")
    for o in removed_ops:
        print(f"excluded {o['method'].upper()} {o['path']}  [{o['task']}] {o['why']}")
    for o in missing:
        print(f"STALE EXCLUSION (no such operation any more, delete it): {o['method'].upper()} {o['path']}")
    if missing:
        sys.exit(1)


def generate() -> None:
    subprocess.run(["npx", "--yes", "openapi-typescript@7.13.0", str(MOBILE.relative_to(ROOT)), "-o",
                    "src/api/schema.generated.ts"], cwd=ROOT, check=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--backend", type=Path, help="path to a wawu-backend checkout")
    ap.add_argument("--no-generate", action="store_true")
    args = ap.parse_args()
    if args.backend:
        copy_from_backend(args.backend)
    apply_exclusions()
    if not args.no_generate:
        generate()
    return 0


if __name__ == "__main__":
    sys.exit(main())
