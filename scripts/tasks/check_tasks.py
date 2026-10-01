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

OWNERS = {"YOU": "You", "DEV": "Developer"}
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
}
REQUIRED = ["id", "title", "owner", "area", "order", "priority", "repo", "type", "status",
            "depends_on", "decisions", "passes", "artboards"]
RETIRED_PREFIXES = ("SH",)  # Shop, retired by R-2


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

    screen_cover: Counter = Counter()
    for tid, t in tasks.items():
        where = f"{tid}.md"
        if t["owner"] not in OWNERS:
            errors.append(f"{where}: owner must be YOU or DEV, not {t['owner']}")
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
        if a.startswith(RETIRED_PREFIXES):
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

    for e in errors:
        print("TASK CHECK FAILED:", e)
    by = Counter(t["owner"] for t in tasks.values())
    print(f"{len(tasks)} tasks ({', '.join(f'{OWNERS[o]} {by[o]}' for o in OWNERS)}), "
          f"{len([a for a in inventory if not a.startswith(RETIRED_PREFIXES)])} artboards covered"
          + (", INDEX.md written" if write else ""))
    return 1 if errors else 0


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
