#!/usr/bin/env python3
"""Check every task file and keep tasks/INDEX.md current.

    python3 scripts/tasks/check_tasks.py           # check (CI); fails if INDEX.md is stale
    python3 scripts/tasks/check_tasks.py --write   # rewrite tasks/INDEX.md

Each person works down their list in `order`. A task can never come before
something it depends on, so nobody reaches a task whose groundwork is not
there. That, and the rest of the rules below, used to depend on someone
reading carefully. Now it is an exit code:

- every field present; owner, priority, type and status are known values
- `order` is unique, and every dependency has a smaller order
- the passes include everything the task type requires (docs/WORKFLOW.md section 5)
- dependencies, artboards and decisions all exist
- every artboard (except retired Shop) is in exactly one screen task
- every launch task comes before CHECK-3 (full QA, nothing new is built), RELEASE-02 comes after it,
  and every after-launch task comes after RELEASE-02
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASKS = ROOT / "tasks"
INDEX = TASKS / "INDEX.md"
PROGRESS = ROOT / "docs" / "PROGRESS.md"
LOG = ROOT / "docs" / "LOG.md"

OWNERS = {"YOU": "You", "DEV": "Developer", "DEV2": "Developer 2", "DEV3": "Developer 3"}
PRIORITIES = {"launch", "after-launch"}
STATUSES = ["todo", "building", "verifying", "review", "done"]
MIN_PASSES = {
    "setup": ["V1"], "contract": ["V1"], "ops": [], "component": ["V1", "V5", "V6"],
    "mobile-screen": ["V1", "V4", "V5", "V6", "V9"], "flow": ["V1", "V6", "V7", "V9"],
    "backend-endpoint": ["V1", "V2", "V3", "V4", "V9"], "migration": ["V1", "V3", "V4", "V9"],
    "third-party": ["V1", "V2", "V3", "V6", "V8", "V9"],
    "money-path": ["V1", "V2", "V3", "V4", "V6", "V7", "V8", "V9"],
    "removal": ["V1", "V3", "V4", "V7", "V9"], "admin-screen": ["V1", "V6", "V7", "V9"],
    "web-port": ["V1", "V3", "V4", "V5", "V6", "V7", "V9"],
    "backend-refactor": ["V1", "V2", "V3", "V9"],
}
REQUIRED = ["id", "title", "owner", "area", "order", "priority", "repo", "type", "status",
            "depends_on", "decisions", "passes", "artboards"]


def parse(path: Path) -> dict:
    text = path.read_text()
    m = re.match(r"---\n(.*?)\n---\n", text, re.S)
    if not m:
        raise ValueError("no front matter")
    meta: dict = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        v = v.strip()
        if v.startswith("[") and v.endswith("]"):
            meta[k.strip()] = [x.strip() for x in v[1:-1].split(",") if x.strip()]
        else:
            meta[k.strip()] = v.strip('"')
    meta["_body"] = text[m.end():]
    return meta


def main() -> int:
    write = "--write" in sys.argv
    inventory = {x["id"] for x in json.loads((ROOT / "design/canvas-inventory.json").read_text())["items"]}
    decisions_text = (ROOT / "DECISIONS.md").read_text()
    known_d = set(re.findall(r"\b(D\d+|R-\d+)\b", decisions_text))
    m = re.search(r"<!-- not-built: (.*?) -->", decisions_text)
    not_built = tuple(m.group(1).split()) if m else ()

    def built(a: str) -> bool:
        return not any(a == x or (x.isalpha() and a.startswith(x) and a[len(x):].isdigit()) for x in not_built)
    tasks, errors = {}, []

    for f in sorted(TASKS.glob("*.md")):
        if f.name in ("INDEX.md", "TEMPLATE.md"):
            continue
        try:
            t = parse(f)
        except ValueError as e:
            errors.append(f"{f.name}: {e}")
            continue
        missing = [k for k in REQUIRED if k not in t]
        if missing:
            errors.append(f"{f.name}: missing {', '.join(missing)}")
            continue
        if t["id"] != f.stem:
            errors.append(f"{f.name}: id {t['id']} does not match the file name")
        try:
            t["order"] = int(t["order"])
        except ValueError:
            errors.append(f"{f.name}: order is not a number")
            continue
        tasks[t["id"]] = t

    for n, c in Counter(t["order"] for t in tasks.values()).items():
        if c > 1:
            errors.append(f"order {n} is used by {c} tasks")

    # Checkpoints: nothing launch-bound may be ordered after CHECK-3, and after-launch work follows the release.
    if "CHECK-3" in tasks and "RELEASE-02" in tasks:
        qa, release = tasks["CHECK-3"]["order"], tasks["RELEASE-02"]["order"]
        if release < qa:
            errors.append(f"RELEASE-02 (order {release}) must come after CHECK-3 (order {qa})")
        for tid, t in tasks.items():
            if tid in ("CHECK-3", "RELEASE-02"):
                continue
            if t["priority"] == "launch" and t["order"] > qa:
                errors.append(f"{tid}.md is a launch task ordered after CHECK-3 (order {t['order']} > {qa}); launch work comes before full QA")
            if t["priority"] == "after-launch" and t["order"] < release:
                errors.append(f"{tid}.md is after launch but ordered before RELEASE-02 (order {t['order']} < {release})")

    screen_cover: Counter = Counter()
    for tid, t in tasks.items():
        where = f"{tid}.md"
        if t["owner"] not in OWNERS:
            errors.append(f"{where}: owner must be one of {', '.join(OWNERS)}, not {t['owner']}")
        if t["priority"] not in PRIORITIES:
            errors.append(f"{where}: priority must be launch or after-launch")
        if t["status"] not in STATUSES:
            errors.append(f"{where}: unknown status {t['status']}")
        if t["type"] not in MIN_PASSES:
            errors.append(f"{where}: unknown type {t['type']}")
            continue
        need = [p for p in MIN_PASSES[t["type"]] if p not in t["passes"]]
        if need:
            errors.append(f"{where}: type {t['type']} requires passes {', '.join(need)}")
        for d in t["depends_on"]:
            if d not in tasks:
                errors.append(f"{where}: depends on {d}, which has no task file")
            elif tasks[d]["order"] > t["order"]:
                errors.append(f"{where} (order {t['order']}) depends on {d}, which comes later (order {tasks[d]['order']})")
            elif t["priority"] == "launch" and tasks[d]["priority"] == "after-launch":
                errors.append(f"{where} is needed for launch but depends on {d}, which is after launch")
        for a in t["artboards"]:
            if a not in inventory:
                errors.append(f"{where}: artboard {a} is not in design/canvas-inventory.json")
        if t["type"] == "mobile-screen":
            screen_cover.update(t["artboards"])
        for d in t["decisions"]:
            if d not in known_d:
                errors.append(f"{where}: decision {d} is not in DECISIONS.md")
        if "## Capability checks" not in t["_body"]:
            errors.append(f"{where}: no capability checks")

    for a in sorted(inventory):
        if not built(a):
            if screen_cover[a]:
                errors.append(f"artboard {a} is listed as not built in DECISIONS.md but a screen task builds it")
            continue
        if screen_cover[a] == 0:
            errors.append(f"artboard {a} is in no mobile-screen task")
        elif screen_cover[a] > 1:
            errors.append(f"artboard {a} is in {screen_cover[a]} mobile-screen tasks; it must be in exactly one")

    index = render_index(tasks)
    if write:
        INDEX.write_text(index)
    elif not INDEX.exists() or INDEX.read_text() != index:
        errors.append("tasks/INDEX.md is out of date: run python3 scripts/tasks/check_tasks.py --write")
    progress = render_progress(tasks)
    if write:
        PROGRESS.write_text(progress)
    elif not PROGRESS.exists() or PROGRESS.read_text() != progress:
        errors.append("docs/PROGRESS.md is out of date: run python3 scripts/tasks/check_tasks.py --write")

    import subprocess
    tracked = subprocess.run(["git", "ls-files", "*.md", "*.json", "*.ts", "*.tsx", "*.py"], cwd=ROOT,
                             capture_output=True, text=True).stdout.split()
    for rel in tracked:
        f = ROOT / rel
        if f.is_file() and re.search(r"^(<{7}|>{7}) ", f.read_text(errors="ignore"), re.M):
            errors.append(f"{rel} contains merge conflict markers")
    for e in errors:
        print("TASK CHECK FAILED:", e)
    by = Counter(t["owner"] for t in tasks.values())
    print(f"{len(tasks)} tasks ({', '.join(f'{OWNERS[o]} {by[o]}' for o in OWNERS)}), "
          f"{len([a for a in inventory if built(a)])} artboards covered"
          + (", INDEX.md written" if write else ""))
    return 1 if errors else 0


def render_progress(tasks: dict) -> str:
    """docs/PROGRESS.md: where every task stands, rebuilt from the task files."""
    labels = {"done": "Done", "review": "Built and verified, waiting for the owner's sign-off",
              "verifying": "Being verified", "building": "Being built (or fixing verifier findings)"}
    out = ["# Progress", "",
           "Rebuilt from the task files by `python3 scripts/tasks/check_tasks.py --write`;",
           "`npm run check` fails if it is out of date. Do not edit by hand.", ""]
    launch = [t for t in tasks.values() if t["priority"] == "launch"]
    done = sum(1 for t in launch if t["status"] == "done")
    out += [f"**Launch tasks done: {done} of {len(launch)}.**", ""]
    out += ["| | " + " | ".join(OWNERS.values()) + " |", "|---" * (len(OWNERS) + 1) + "|"]
    for st in STATUSES:
        row = [sum(1 for t in tasks.values() if t["owner"] == o and t["status"] == st) for o in OWNERS]
        out.append(f"| {st} | " + " | ".join(str(n) for n in row) + " |")
    out.append("")
    for st in ["review", "verifying", "building", "done"]:
        ts = sorted([t for t in tasks.values() if t["status"] == st], key=lambda t: t["order"])
        if ts:
            out += [f"## {labels[st]}", ""] + [f"- [{t['id']}](../tasks/{t['id']}.md) {t['title']} ({OWNERS[t['owner']]})" for t in ts] + [""]
    out += ["## Next up", ""]
    for owner, name in OWNERS.items():
        nxt = [t for t in sorted(tasks.values(), key=lambda t: t["order"])
               if t["owner"] == owner and t["status"] == "todo" and t["priority"] == "launch"
               and all(tasks.get(d, {}).get("status") in ("done", "review") for d in t["depends_on"])][:3]
        out.append(f"- **{name}:** " + (", ".join(f"[{t['id']}](../tasks/{t['id']}.md) {t['title']}" for t in nxt) or "nothing unblocked"))
    out.append("")
    if LOG.exists():
        entries = [l for l in LOG.read_text().splitlines() if l.startswith("- ")][:15]
        out += ["## Latest", "", "From `docs/LOG.md`, newest first.", ""] + entries + [""]
    return "\n".join(out)


def render_index(tasks: dict) -> str:
    out = ["# Tasks", "",
           "Generated by `python3 scripts/tasks/check_tasks.py --write`. Do not edit by hand.", "",
           "Each person works down their own list, top to bottom. A task never comes before something it",
           "depends on. Where a task needs the other person's work first, it says so.", "",
           "Give a session one line; the task file tells it what to read:", "",
           "```", "You are the BUILDER for task <ID>. Open tasks/<ID>.md and follow it.",
           "You are the VERIFIER for task <ID>. Open tasks/<ID>.md and follow it.", "```", "",
           "Builder and verifier are always different sessions.", ""]
    for owner, name in OWNERS.items():
        for prio, heading in (("launch", ""), ("after-launch", " · after launch")):
            ts = sorted([t for t in tasks.values() if t["owner"] == owner and t["priority"] == prio],
                        key=lambda t: t["order"])
            if not ts:
                continue
            out += [f"## {name}{heading}", ""]
            for i, t in enumerate(ts, 1):
                other = [d for d in t["depends_on"] if d in tasks and tasks[d]["owner"] != owner]
                note = f" · needs {', '.join(other)} from {OWNERS[tasks[other[0]]['owner']]} first" if other else ""
                out.append(f"{i}. [{t['id']}]({t['id']}.md) {t['title']}{note}")
            out.append("")
    return "\n".join(out)


if __name__ == "__main__":
    sys.exit(main())
