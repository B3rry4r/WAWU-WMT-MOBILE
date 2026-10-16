"""An inert entry always names the task that will wire it, and goes live with it.

DECISIONS R-47: a part of a screen whose task is not complete is not drawn, so
no screen calls `unbuilt` today; the helper (`src/lib/unbuilt.ts`) and this gate
stay in the repo, unused. If an entry whose screen is not built yet is ever
drawn so that it does nothing when tapped, in code that is one call,

    onPress={unbuilt('ME-03')}

naming the task that builds where the entry leads. Left alone, that is how a
button stays dead for ever: the screen lands, nobody comes back to the entry,
and the owner taps it. So this gate reads every `unbuilt(...)` call in `src/`
and fails when

  * the argument is not one string literal (the gate reads source, not types),
  * the id has no task file (a typo, or a task that was never filed), or
  * the named task is `review` or `done`: its screen is built, so the entry
    must be wired for real and the `unbuilt` call removed.

Entries that are still allowed to be inert (task `todo`, `building` or
`verifying`) are listed as warnings, one line per task, so a run shows what is
inert and who owns the wiring. `--json` carries every call site of each task.
A run with no inert entries prints nothing for this gate.

Task ids and statuses come from the front matter of `tasks/*.md`, read the way
`scripts/tasks/check_tasks.py` reads it.
"""

from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path
from typing import Iterator

from run import Context, Finding

NAME = "unbuilt_entries"

# A task whose screen exists. An entry naming one of these is a defect.
BUILT = ("review", "done")
# Statuses a task file may carry (check_tasks.py owns the list). An entry may
# stay inert while its task is in any of these but BUILT.
IN_PROGRESS = ("todo", "building", "verifying")

# Files in tasks/ that are not tasks.
NOT_TASKS = ("INDEX.md", "TEMPLATE.md")

FRONT_MATTER = re.compile(r"---\n(.*?)\n---\n", re.S)

# The helper's name as a call. Not preceded by an identifier character, so
# `isunbuilt(` and `$unbuilt(` are other functions.
CALL = re.compile(r"(?<![\w$])unbuilt\s*\(")
DECLARATION = re.compile(r"\bfunction\s*\*?\s*$")

# One string literal, nothing else, in the sanitized text (string contents are
# blanked there, so a template literal with `${` fails this on purpose).
LITERAL_ARG = re.compile(r"\(\s*(?P<q>['\"`])(?P<body> *)(?P=q)\s*,?\s*\)")


def read_tasks(repo: Path) -> dict[str, dict]:
    """{task id: {status, title}} from tasks/*.md front matter."""
    out: dict[str, dict] = {}
    for f in sorted((repo / "tasks").glob("*.md")):
        if f.name in NOT_TASKS:
            continue
        try:
            text = f.read_text(encoding="utf-8")
        except OSError:
            continue
        m = FRONT_MATTER.match(text)
        if not m:
            continue
        meta: dict[str, str] = {}
        for line in m.group(1).splitlines():
            key, _, value = line.partition(":")
            meta[key.strip()] = value.strip().strip('"')
        if meta.get("id"):
            out[meta["id"]] = {"status": meta.get("status", ""), "title": meta.get("title", "")}
    return out


def sanitize(text: str) -> str:
    """The same text, same length, with comments and the insides of strings
    blanked to spaces (newlines kept), so offsets and line numbers line up.

    A call named in a comment or a string is not a call, and a `//` inside a
    string ('https://...') is not a comment. A quote right after a letter or a
    digit is an apostrophe in JSX text (`Don't`), not the start of a string.
    The `${` of a template literal is kept visible, so an interpolated id can
    be told from a plain one.
    """
    out = list(text)
    n = len(text)

    def blank(a: int, b: int) -> None:
        for k in range(a, min(b, n)):
            if out[k] != "\n":
                out[k] = " "

    # 'code' is the file; 'tpl' is inside a template literal; 'expr' is inside
    # a `${ ... }` of one. `depth` counts open braces for each 'expr'.
    modes = ["code"]
    depth: list[int] = []
    i = 0
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        mode = modes[-1]

        if mode == "tpl":
            if c == "\\":
                blank(i, i + 2)
                i += 2
            elif c == "`":
                modes.pop()
                i += 1
            elif c == "$" and nxt == "{":
                modes.append("expr")
                depth.append(0)
                i += 2
            else:
                blank(i, i + 1)
                i += 1
            continue

        if c == "/" and nxt == "/":
            end = text.find("\n", i)
            end = n if end < 0 else end
            blank(i, end)
            i = end
        elif c == "/" and nxt == "*":
            end = text.find("*/", i + 2)
            end = n if end < 0 else end + 2
            blank(i, end)
            i = end
        elif c in "'\"" and not (i > 0 and text[i - 1].isalnum()):
            j = i + 1
            while j < n and text[j] != c and text[j] != "\n":
                j += 2 if text[j] == "\\" else 1
            blank(i + 1, j)
            i = j + 1
        elif c == "`":
            modes.append("tpl")
            i += 1
        elif mode == "expr" and c == "{":
            depth[-1] += 1
            i += 1
        elif mode == "expr" and c == "}":
            if depth[-1] == 0:
                modes.pop()
                depth.pop()
            else:
                depth[-1] -= 1
            i += 1
        else:
            i += 1
    return "".join(out)


def calls(text: str) -> Iterator[tuple[int, str | None, str]]:
    """Every call of unbuilt in a source file: (line, literal id or None, the source line)."""
    clean = sanitize(text)
    lines = text.splitlines()
    for m in CALL.finditer(clean):
        if DECLARATION.search(clean[max(0, m.start() - 40) : m.start()]):
            continue
        line = clean.count("\n", 0, m.start()) + 1
        arg = LITERAL_ARG.match(clean, m.end() - 1)
        literal = None
        if arg:
            # Same offsets in the original: the characters between the quotes.
            literal = text[arg.start("body") : arg.end("body")]
        yield line, literal, lines[line - 1] if line <= len(lines) else ""


def run(ctx: Context) -> Iterator[Finding]:
    tasks = read_tasks(ctx.repo)
    inert: dict[str, list[tuple[str, int]]] = defaultdict(list)

    for path in ctx.source_files("source"):
        if ctx.is_test(path):
            continue
        rel = ctx.rel(path)
        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        for line, literal, source in calls(text):
            if literal is None:
                yield Finding(
                    gate=NAME, path=rel, line=line,
                    message="unbuilt() takes one string literal, the id of the task that builds this entry's screen, "
                            "for example unbuilt('ME-03'). A variable, a template with ${} or a second argument "
                            "cannot be checked.",
                    evidence=source,
                )
                continue
            task = tasks.get(literal)
            if task is None:
                yield Finding(
                    gate=NAME, path=rel, line=line,
                    message=f"unbuilt('{literal}'): there is no task file tasks/{literal}.md. Name the task that "
                            "builds where this entry leads.",
                    evidence=source,
                )
            elif task["status"] in BUILT:
                yield Finding(
                    gate=NAME, path=rel, line=line,
                    message=f"unbuilt('{literal}'): {literal} is {task['status']}, so its screen is built. Wire this "
                            "entry to it and remove unbuilt().",
                    evidence=source,
                )
            elif task["status"] not in IN_PROGRESS:
                yield Finding(
                    gate=NAME, path=rel, line=line,
                    message=f"unbuilt('{literal}'): {literal} has status '{task['status']}', which is not one of "
                            f"{', '.join(BUILT + IN_PROGRESS)}, so the gate cannot tell if its screen is built.",
                    evidence=source,
                )
            else:
                inert[literal].append((rel, line))

    for task_id in sorted(inert):
        sites = inert[task_id]
        task = tasks[task_id]
        files = sorted({rel for rel, _ in sites})
        by_file = ", ".join(f"{f} ({sum(1 for r, _ in sites if r == f)})" for f in files)
        noun = "entry" if len(sites) == 1 else "entries"
        yield Finding(
            gate=NAME, path=sites[0][0], line=sites[0][1],
            message=f"{task_id} ({task['status']}) {task['title']}: {len(sites)} inert {noun} in {by_file}",
            evidence=", ".join(f"{rel}:{line}" for rel, line in sites),
            severity="warn",
        )
