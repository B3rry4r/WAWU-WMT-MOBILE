#!/usr/bin/env python3
"""Keep the "Next" line of a generated Current state true.

    python3 scripts/tasks/refresh_next.py           # rewrite the lines that are out of date
    python3 scripts/tasks/refresh_next.py --check   # list them and exit 1 if any is out of date

A task that nobody has started has a generated Current state whose Next line starts
"a builder starts from the brief below". That line lists only the dependencies that are
not `done` or `review` yet (the statuses check_tasks.py reads from the front matter), or
says "Dependencies done; ready to schedule." when none are open. Hand-written Next lines
are never touched.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from check_tasks import TASKS, parse  # noqa: E402

LINE = re.compile(r"^- \*\*Next:\*\* a builder starts from the brief below"
                  r"( when the lead schedules it\.|\. Dependencies done; ready to schedule\.| after these are done \(or in review\):).*$")


def next_line(depends_on: list[str], status_of: dict[str, str]) -> str:
    open_deps = [d for d in depends_on if status_of.get(d) not in ("done", "review")]
    if not open_deps:
        return "- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule."
    return ("- **Next:** a builder starts from the brief below after these are done (or in review): "
            + ", ".join(open_deps) + ".")


def main() -> int:
    check = "--check" in sys.argv
    tasks = {}
    for f in sorted(TASKS.glob("*.md")):
        if f.name in ("INDEX.md", "TEMPLATE.md"):
            continue
        t = parse(f)
        t["_path"] = f
        tasks[t["id"]] = t
    status_of = {i: t["status"] for i, t in tasks.items()}
    stale = []
    for t in tasks.values():
        text = t["_path"].read_text()
        lines = text.split("\n")
        changed = False
        for n, line in enumerate(lines):
            if LINE.match(line):
                want = next_line(t["depends_on"], status_of)
                if line != want:
                    lines[n] = want
                    changed = True
        if changed:
            stale.append(t["id"])
            if not check:
                t["_path"].write_text("\n".join(lines))
    verb = "out of date" if check else "rewritten"
    print(f"{len(stale)} Next lines {verb}" + (": " + ", ".join(stale) if check and stale else ""))
    return 1 if check and stale else 0


if __name__ == "__main__":
    sys.exit(main())
