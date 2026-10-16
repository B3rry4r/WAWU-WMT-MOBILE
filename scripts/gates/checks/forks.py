"""Never fork a component.

A second copy of a shared thing is not a duplicate file, it is a second truth
that drifts. Observed: a forked `ErrorState` three files from the real one,
defaulting to "check your connection", so a 403 told every user their network
had failed. Also two `ApiError` classes, so an `instanceof` check against the
wrong one failed silently.

This is greppable, and in the build that produced the rule it was never grepped.

Two kinds of copy are caught:

* a `class` / `enum` / `mixin` / `extension` / `interface` declared in two files;
* a function component (`function Name(...)`, or `const Name = (...) =>`,
  `memo(...)`, `forwardRef(...)`) that copies a shared one: a component exported
  from a shared directory (`shared_component_dirs`, default `src/components/`)
  and declared again, exported or not, in any other file. The same name in two
  feature files is not a copy of anything shared and is left alone (`Loading`,
  `Header` and `Tile` are local helpers in several screens by design). A
  platform pair (`Thing.tsx` and `Thing.web.tsx`) is one file.
"""

from __future__ import annotations

import re
from collections import defaultdict
from typing import Iterator

from run import Context, Finding

NAME = "forks"

DECL = re.compile(r"^\s*(?:abstract\s+|final\s+|sealed\s+|export\s+|declare\s+)*"
                  r"(class|enum|mixin|extension|interface)\s+(\w+)")


# `function Name(` / `function Name<T>(`, exported or not.
FUNCTION_COMPONENT = re.compile(r"^\s*(?P<export>export\s+(?:default\s+)?)?(?:async\s+)?function\s+(?P<name>[A-Z]\w*)\s*[<(]")
# `const Name = (`, `= async (`, `= x =>`, `= memo(`, `= React.memo(`, `= forwardRef(`, with or without a type annotation.
ARROW_COMPONENT = re.compile(
    r"^\s*(?P<export>export\s+)?const\s+(?P<name>[A-Z]\w*)\s*(?::.*?)?=(?!>)\s*"
    r"(?:(?:React\.)?(?:memo|forwardRef)\b|\(|async\s*\(|[A-Za-z_$][\w$]*\s*=>|<[^>]*>\s*\()"
)
PLATFORM_SUFFIX = re.compile(r"\.(?:web|ios|android|native)(?=\.tsx?$)")


def function_component(line: str) -> tuple[str, bool] | None:
    """(name, exported) when the line declares a function component."""
    m = FUNCTION_COMPONENT.match(line) or ARROW_COMPONENT.match(line)
    if not m:
        return None
    return m.group("name"), bool(m.group("export"))


def copies_of_shared_components(ctx: Context, ignore: set[str], min_len: int) -> Iterator[Finding]:
    shared_dirs = tuple(ctx.gate_config.get("shared_component_dirs", ["src/components/"]))
    declared: dict[str, list[tuple[str, int, bool, str]]] = defaultdict(list)

    for path in ctx.source_files("source"):
        if ctx.is_test(path) or path.suffix != ".tsx":
            continue
        rel = ctx.rel(path)
        for lineno, line in ctx.lines(path):
            found = function_component(line)
            if not found:
                continue
            name, exported = found
            if name in ignore or len(name) < min_len:
                continue
            declared[name].append((rel, lineno, exported, line.strip()))

    for name, sites in sorted(declared.items()):
        homes = sorted({PLATFORM_SUFFIX.sub("", rel) for rel, _, exported, _ in sites if exported and rel.startswith(shared_dirs)})
        if not homes:
            continue
        home = homes[0]
        for rel, lineno, _, text in sites:
            if PLATFORM_SUFFIX.sub("", rel) == home:
                continue
            yield Finding(
                gate=NAME,
                path=rel,
                line=lineno,
                message=f"function component '{name}' copies the shared one in {home} - import it, or give it a prop",
                evidence=text,
            )


def run(ctx: Context) -> Iterator[Finding]:
    ignore = set(ctx.gate_config.get("ignore_names", []))
    min_len = ctx.gate_config.get("min_name_length", 4)

    yield from copies_of_shared_components(ctx, ignore, min_len)

    declared: dict[tuple[str, str], list[tuple[str, int]]] = defaultdict(list)

    for path in ctx.source_files("source"):
        if ctx.is_test(path):
            continue
        rel = ctx.rel(path)
        for lineno, line in ctx.lines(path):
            m = DECL.match(line)
            if not m:
                continue
            kind, name = m.group(1), m.group(2)
            if name.startswith("_"):          # private to its file by construction
                continue
            if name in ignore or len(name) < min_len:
                continue
            declared[(kind, name)].append((rel, lineno))

    for (kind, name), sites in sorted(declared.items()):
        files = {f for f, _ in sites}
        if len(files) < 2:
            continue
        where = ", ".join(f"{f}:{n}" for f, n in sites)
        first = sites[0]
        yield Finding(
            gate=NAME,
            path=first[0],
            line=first[1],
            message=f"{kind} '{name}' is declared in {len(files)} files - one of them is a fork",
            evidence=where,
        )
