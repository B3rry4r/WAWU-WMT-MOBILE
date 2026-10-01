#!/usr/bin/env python3
"""Check every task file and keep tasks/INDEX.md current.

    python3 scripts/tasks/check_tasks.py           # check (CI); fails if INDEX.md is stale
    python3 scripts/tasks/check_tasks.py --write   # rewrite tasks/INDEX.md

A task file breaks the workflow if it has no owner or day, misses a
verification pass its type requires (docs/WORKFLOW.md section 5), depends on a
task that does not exist or is scheduled for a later day, cites an artboard
the canvas does not have, or is marked ready while a decision it needs is
still open. Each of those used to be
caught (or missed) by a person reading carefully. Now it is an exit code.
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

OWNERS = {"YOU": "You", "DEV1": "Dev 1 · Money", "DEV2": "Dev 2 · Account, Me, Events",
          "DEV3": "Dev 3 · Feed and Inbox"}
DAYS = ["0", "1", "2", "3", "4", "5", "6", "later"]
MIN_PASSES = {
    "setup": ["V1"], "contract": ["V1"], "ops": [], "component": ["V1", "V5", "V6"],
    "mobile-screen": ["V1", "V4", "V5", "V6", "V9"], "flow": ["V1", "V6", "V7", "V9"],
    "backend-endpoint": ["V1", "V2", "V3", "V4", "V9"], "migration": ["V1", "V3", "V4", "V9"],
    "third-party": ["V1", "V2", "V3", "V6", "V8", "V9"],
    "money-path": ["V1", "V2", "V3", "V4", "V6", "V7", "V8", "V9"],
    "removal": ["V1", "V3", "V4", "V7", "V9"], "admin-screen": ["V1", "V6", "V7", "V9"],
    "web-port": ["V1", "V3", "V4", "V5", "V6", "V7", "V9"],
}
STATUSES = ["queued", "blocked", "ready", "building", "verifying", "review", "done"]
ACTIVE = {"ready", "building", "verifying", "review", "done"}
REQUIRED = ["id", "title", "owner", "area", "day", "repo", "type", "status", "blocked_by",
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


def open_decisions() -> set[str]:
    text = (ROOT / "DECISIONS.md").read_text()
    section = text.split("## Open decisions", 1)[-1]
    return set(re.findall(r"^\| (D\d+) \|", section, re.M))


def known_decisions() -> set[str]:
    text = (ROOT / "DECISIONS.md").read_text()
    return set(re.findall(r"\b(?:R|D)-?\d+\b", text)) | {d.replace("-", "") for d in re.findall(r"\bR-\d+\b", text)}


def main() -> int:
    write = "--write" in sys.argv
    inventory = {x["id"] for x in json.loads((ROOT / "design/canvas-inventory.json").read_text())["items"]}
    open_d, known_d = open_decisions(), known_decisions()
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
        tasks[t["id"]] = t

    screen_cover: Counter = Counter()
    for tid, t in tasks.items():
        where = f"{tid}.md"
        if t["owner"] not in OWNERS:
            errors.append(f"{where}: unknown owner {t['owner']}")
        if t["day"] not in DAYS:
            errors.append(f"{where}: day must be 0-6 or later, not {t['day']}")
        if t["type"] not in MIN_PASSES:
            errors.append(f"{where}: unknown type {t['type']}")
            continue
        if t["status"] not in STATUSES:
            errors.append(f"{where}: unknown status {t['status']}")
        need = [p for p in MIN_PASSES[t["type"]] if p not in t["passes"]]
        if need:
            errors.append(f"{where}: type {t['type']} requires passes {', '.join(need)}")
        for d in t["depends_on"]:
            if d not in tasks and not (TASKS / f"{d}.md").exists():
                errors.append(f"{where}: depends on {d}, which has no task file")
            elif d in tasks and DAYS.index(tasks[d]["day"]) > DAYS.index(t["day"]) if tasks[d]["day"] in DAYS and t["day"] in DAYS else False:
                errors.append(f"{where} (day {t['day']}) depends on {d}, scheduled later (day {tasks[d]['day']})")
        for a in t["artboards"]:
            if a not in inventory:
                errors.append(f"{where}: artboard {a} is not in design/canvas-inventory.json")
        if t["type"] == "mobile-screen":
            screen_cover.update(t["artboards"])
        for d in t["decisions"]:
            if d not in known_d:
                errors.append(f"{where}: decision {d} is not in DECISIONS.md")
        still_open = [d for d in t["decisions"] if d in open_d]
        if still_open and t["status"] in ACTIVE:
            errors.append(f"{where}: status {t['status']} but {', '.join(still_open)} is still open")
        if t["status"] == "blocked" and not t["blocked_by"].strip():
            errors.append(f"{where}: blocked with no blocked_by fact")
        if "## Capability checks" not in t["_body"]:
            errors.append(f"{where}: no capability checks")

    for a in sorted(inventory):
        if a.startswith(RETIRED_PREFIXES):
            continue
        if screen_cover[a] == 0:
            errors.append(f"artboard {a} is in no mobile-screen task")
        elif screen_cover[a] > 1:
            errors.append(f"artboard {a} is in {screen_cover[a]} mobile-screen tasks; it must be in exactly one")

    index = render_index(tasks, open_d)
    if write:
        INDEX.write_text(index)
    elif not INDEX.exists() or INDEX.read_text() != index:
        errors.append("tasks/INDEX.md is out of date: run python3 scripts/tasks/check_tasks.py --write")

    for e in errors:
        print("TASK CHECK FAILED:", e)
    total = len(tasks)
    print(f"{total} tasks, {len([a for a in inventory if not a.startswith(RETIRED_PREFIXES)])} artboards covered"
          + (", INDEX.md written" if write else ""))
    return 1 if errors else 0


def render_index(tasks: dict, open_d: set[str]) -> str:
    def num(i):
        a, _, n = i.rpartition("-")
        return (a, int(n))

    out = ["# Task index", "",
           "Generated by `python3 scripts/tasks/check_tasks.py --write` from the task files. Do not edit by hand.", "",
           "Give a session one line; the task file tells it what to read:", "",
           "```", "You are the BUILDER for task <ID>. Open tasks/<ID>.md and follow it.",
           "You are the VERIFIER for task <ID>. Open tasks/<ID>.md and follow it.", "```", "",
           "Builder and verifier are always different sessions.", ""]
    blocked_by_d = defaultdict(list)
    for t in tasks.values():
        for d in t["decisions"]:
            if d in open_d:
                blocked_by_d[d].append(t["id"])
    out += ["## Waiting on a decision", "", "| decision | tasks |", "|----------|-------|"]
    for d in sorted(blocked_by_d, key=lambda x: int(x[1:])):
        out.append(f"| {d} | {', '.join(sorted(blocked_by_d[d], key=num))} |")
    out.append("")
    for owner, name in OWNERS.items():
        ts = [t for t in tasks.values() if t["owner"] == owner]
        out += [f"## {name}", "", f"What you own: `docs/people/{owner}.md`", ""]
        for day in DAYS:
            dts = sorted([t for t in ts if t["day"] == day], key=lambda t: num(t["id"]))
            if not dts:
                continue
            out += [f"### {'After launch' if day == 'later' else 'Day ' + day}", "",
                    "| task | what | status | needs first |", "|------|------|--------|-------------|"]
            for t in dts:
                needs = ", ".join(t["depends_on"] + [d for d in t["decisions"] if d in open_d]) or "-"
                out.append(f"| [{t['id']}]({t['id']}.md) | {t['title']} | {t['status']} | {needs} |")
            out.append("")
    return "\n".join(out)


if __name__ == "__main__":
    sys.exit(main())
