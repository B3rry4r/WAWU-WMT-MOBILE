#!/usr/bin/env python3
"""Refresh the typed API clients from the backend and WAWU ID contracts.

    python3 scripts/api/sync_contract.py --backend ../wawu-backend   # copy + generate
    python3 scripts/api/sync_contract.py --identity ../wawu-id       # copy WAWU ID's + generate
    python3 scripts/api/sync_contract.py                             # regenerate only

1. Copies wawu-backend/contract/openapi.json (from origin/main) into contract/,
   recording the source commit in contract/SOURCE_COMMIT.
2. Applies contract/mobile-exclusions.json, writing contract/openapi.mobile.json.
   Every exclusion is printed with its reason and owning task.
3. Runs openapi-typescript to regenerate src/api/schema.generated.ts.
4. WAWU ID (the sign-in service) publishes its own contract (AUTH-05, G-5):
   --identity copies wawu-id/contract/openapi.json from origin/main into
   contract/identity/, recording the commit, and src/api/identity.generated.ts
   is generated from it. --identity-ref names another ref (a branch under
   review, before it merges); SOURCE_COMMIT then names that ref too.
   --identity-worktree reads the file as it is in the checkout, uncommitted;
   SOURCE_COMMIT says so, and the next copy from a ref replaces it.

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
IDENTITY = ROOT / "contract" / "identity" / "openapi.json"
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


def copy_from_identity(identity: Path, ref: str, worktree: bool) -> None:
    if worktree:
        branch = subprocess.run(["git", "-C", str(identity), "rev-parse", "--abbrev-ref", "HEAD"],
                                check=True, capture_output=True, text=True).stdout.strip()
        sha = subprocess.run(["git", "-C", str(identity), "rev-parse", "--short", "HEAD"],
                             check=True, capture_output=True, text=True).stdout.strip()
        IDENTITY.parent.mkdir(parents=True, exist_ok=True)
        IDENTITY.write_text((identity / "contract" / "openapi.json").read_text())
        source = f"{sha} ({branch}, uncommitted working tree)"
        (IDENTITY.parent / "SOURCE_COMMIT").write_text(source + "\n")
        print(f"copied WAWU ID contract from wawu-id@{source}")
        return
    if ref == "origin/main":
        subprocess.run(["git", "-C", str(identity), "fetch", "-q", "origin", "main:refs/remotes/origin/main"],
                       check=True)
    text = subprocess.run(["git", "-C", str(identity), "show", f"{ref}:contract/openapi.json"],
                          check=True, capture_output=True, text=True).stdout
    sha = subprocess.run(["git", "-C", str(identity), "rev-parse", "--short", ref],
                         check=True, capture_output=True, text=True).stdout.strip()
    IDENTITY.parent.mkdir(parents=True, exist_ok=True)
    IDENTITY.write_text(text)
    source = sha if ref == "origin/main" else f"{sha} ({ref})"
    (IDENTITY.parent / "SOURCE_COMMIT").write_text(source + "\n")
    print(f"copied WAWU ID contract from wawu-id@{source}")


def generate_identity() -> None:
    subprocess.run(["npx", "--yes", "openapi-typescript@7.13.0", str(IDENTITY.relative_to(ROOT)), "-o",
                    "src/api/identity.generated.ts"], cwd=ROOT, check=True)


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
    ap.add_argument("--identity", type=Path, help="path to a wawu-id checkout")
    ap.add_argument("--identity-ref", default="origin/main",
                    help="the wawu-id ref to copy from (default origin/main)")
    ap.add_argument("--identity-worktree", action="store_true",
                    help="read wawu-id's contract file from the checkout as it is, uncommitted")
    ap.add_argument("--no-generate", action="store_true")
    args = ap.parse_args()
    if args.backend:
        copy_from_backend(args.backend)
    if args.identity:
        copy_from_identity(args.identity, args.identity_ref, args.identity_worktree)
    apply_exclusions()
    if not args.no_generate:
        generate()
        if IDENTITY.exists():
            generate_identity()
    return 0


if __name__ == "__main__":
    sys.exit(main())
