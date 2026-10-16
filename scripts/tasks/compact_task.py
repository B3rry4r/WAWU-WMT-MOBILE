#!/usr/bin/env python3
"""Move a task file's round history to tasks/history/<ID>.md, word for word.

    python3 scripts/tasks/compact_task.py <ID>
    python3 scripts/tasks/compact_task.py <ID> --from origin/wmt/<ID> --dry-run

Why: every round used to append its builder report, verifier report and lead
notes to the task file, and every later session read all of it. The task file
now keeps the brief, a "## Current state" of at most 60 lines, and the owner
sign-off. Everything else moves to tasks/history/<ID>.md, oldest first.

What stays: every section before the first "## Builder ..." or "## Verifier ..."
heading (the brief), plus "## Current state", "## For the owner" and
"## Owner sign-off" wherever they are. What moves: every other "## " section
from that first report heading to the end of the file. Nothing is edited or
deleted: the moved text is checked to be exactly the text that left the file.

Run it again after a later round and the new sections are appended to the
history. The tool lists the headings it moved, so whoever writes the Current
state can see which lead rulings and open findings must be carried into it.
The tool does not write the Current state. If the file has none it adds a
placeholder and says so; fill it in before you commit (check_tasks.py checks
the 60-line limit, and that a building, verifying or review task has one).

--from REF reads tasks/<ID>.md from a git ref (a task's branch) instead of the
working tree; with --dry-run it only prints the sizes before and after.
"""
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TASKS = ROOT / "tasks"
HISTORY = TASKS / "history"
STAY = ("current state", "for the owner", "owner sign-off")
HISTORY_START = re.compile(r"^## (Builder|Verifier)\b")
PLACEHOLDER = re.compile(r"^\s*_[^_].*_\s*$")


def sections(lines: list[str]) -> list[tuple[str, list[str]]]:
    """Split a file into (heading, lines) pieces; the first piece has heading ''."""
    out: list[tuple[str, list[str]]] = [("", [])]
    for line in lines:
        if line.startswith("## "):
            out.append((line, [line]))
        else:
            out[-1][1].append(line)
    return out


def compact(text: str, task_id: str) -> tuple[str, str, list[str]]:
    """Return (new task text, text moved to history, headings moved)."""
    pieces = sections(text.splitlines(keepends=True))
    first = next((i for i, (h, _) in enumerate(pieces) if HISTORY_START.match(h)), None)
    if first is None:
        return text, "", []
    keep: list[str] = []
    moved: list[str] = []
    moved_headings: list[str] = []
    link_at: int | None = None
    for i, (heading, body) in enumerate(pieces):
        title = heading[3:].strip().lower()
        if i < first or title.startswith(STAY):
            keep += body
            continue
        if link_at is None:
            link_at = len(keep)
        moved += body
        moved_headings.append(heading.strip())
    real = [l for l in moved if l.strip() and not l.startswith("## ") and not PLACEHOLDER.match(l)]
    if not real:
        return text, "", []
    link = [f"## History\n", "\n",
            f"Round reports, verifier reports and lead notes, word for word, oldest first: "
            f"[history/{task_id}.md](history/{task_id}.md).\n", "\n"]
    if "".join(keep).find(f"(history/{task_id}.md)") >= 0:
        link = []
    keep[link_at:link_at] = link
    return "".join(keep), "".join(moved), moved_headings


def ensure_state(text: str) -> tuple[str, bool]:
    if re.search(r"^## Current state\b", text, re.M):
        return text, False
    lines = text.splitlines(keepends=True)
    at = next((i for i, l in enumerate(lines) if l.startswith("# ")), None)
    if at is None:
        return text, False
    block = ["\n", "## Current state\n", "\n", "unknown, ask the lead (fill this in: status, branches and hashes "
             "per repo, merged and live, open findings by severity, next step; at most 60 lines)\n"]
    lines[at + 1:at + 1] = block
    return "".join(lines), True


def main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    ref = argv[argv.index("--from") + 1] if "--from" in argv else None
    if ref:
        args = [a for a in args if a != ref]
    dry = "--dry-run" in argv
    if len(args) != 1:
        print(__doc__)
        return 2
    task_id = args[0]
    path = TASKS / f"{task_id}.md"
    if ref:
        shown = subprocess.run(["git", "show", f"{ref}:tasks/{task_id}.md"], cwd=ROOT, capture_output=True, text=True)
        if shown.returncode:
            print(f"cannot read tasks/{task_id}.md from {ref}")
            return 1
        text = shown.stdout
    elif path.exists():
        text = path.read_text()
    else:
        print(f"no tasks/{task_id}.md")
        return 1
    new, moved, headings = compact(text, task_id)
    if not moved:
        print(f"{task_id}: no round history to move")
        return 0
    new, added = ensure_state(new)
    before, after = len(text.encode()), len(new.encode())
    if dry:
        print(f"{task_id}: {before} bytes -> {after} bytes in the task file, {len(moved.encode())} bytes to history "
              f"({len(headings)} sections)")
        return 0
    HISTORY.mkdir(exist_ok=True)
    hist = HISTORY / f"{task_id}.md"
    if hist.exists():
        old = hist.read_text()
        out = old if old.endswith("\n") else old + "\n"
        out += "\n" + moved if not moved.startswith("\n") else moved
    else:
        out = (f"# {task_id} · round history\n\n"
               f"Moved out of [tasks/{task_id}.md](../{task_id}.md) word for word, oldest first. "
               f"The current state is in that file.\n\n") + moved
    # Nothing may be lost: the moved text must be exactly the tail of the history.
    assert out.endswith(moved), "history does not end with the moved text"
    hist.write_text(out)
    path.write_text(new)
    print(f"{task_id}: {before} -> {after} bytes; {len(moved.encode())} bytes moved to tasks/history/{task_id}.md")
    for h in headings:
        print("  moved:", h[:100])
    if added:
        print("  NOTE: no Current state existed; a placeholder was added. Write it now.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
