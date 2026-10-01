"""A control that does nothing is worse than an absent one.

The user taps it, nothing happens, and they conclude the app is broken -- which
it is. This is the most common single defect in generated UI and the easiest to
detect: the handler is literally empty or null in the source.
"""

from __future__ import annotations

import re
from typing import Iterator

from run import Context, Finding

NAME = "dead_controls"

# Grouped by stack. Running every stack's regexes over every file is how a Node
# repo got a clean report from Dart-only patterns: nothing matched, nothing was
# reported, and the gate looked green over unexamined code.
DART_PATTERNS = [
    # onPressed: () {}   onTap: () {}   onChanged: (_) {}
    (re.compile(r"\b(on\w+)\s*:\s*\(\s*(?:_|\w+)?\s*\)\s*(?:async\s*)?\{\s*\}"),
     "handler is an empty function"),
    # onPressed: () => null  /  () => {}
    (re.compile(r"\b(on\w+)\s*:\s*\(\s*\)\s*=>\s*(?:null|\{\})\s*[,)]"),
     "handler resolves to nothing"),
]

NODE_PATTERNS = [
    # onClick={() => {}}  onSubmit={async () => {}}  onChange={(e) => {}}
    (re.compile(r"\b(on[A-Z]\w+)\s*=\s*\{\s*(?:async\s*)?\(?\s*\w*\s*\)?\s*=>\s*\{\s*\}\s*\}"),
     "handler is an empty function"),
    # onClick={() => null} / undefined / Promise.resolve()
    (re.compile(r"\b(on[A-Z]\w+)\s*=\s*\{\s*(?:async\s*)?\(?\s*\w*\s*\)?\s*=>\s*(?:null|undefined|void 0|Promise\.resolve\(\))\s*\}"),
     "handler resolves to nothing"),
    # onClick={undefined}  onClick={noop}
    (re.compile(r"\b(on[A-Z]\w+)\s*=\s*\{\s*(?:undefined|noop|_noop|NOOP)\s*\}"),
     "handler is a placeholder"),
    # onClick={() => {/* TODO */}}
    (re.compile(r"\b(on[A-Z]\w+)\s*=\s*\{[^}]*=>\s*\{\s*/[/*]\s*(?:TODO|FIXME|noop|nothing)"),
     "handler body is a TODO comment"),
    # Object-literal handlers outside JSX
    (re.compile(r"\b(on[A-Z]\w+)\s*:\s*(?:async\s*)?\(?\s*\w*\s*\)?\s*=>\s*\{\s*\}"),
     "handler is an empty function"),
    # A submit handler that only cancels the event
    (re.compile(r"\b(onSubmit)\s*=\s*\{\s*\(?\s*(\w+)\s*\)?\s*=>\s*\2\.preventDefault\(\)\s*\}"),
     "submit handler only cancels the event - nothing is submitted"),
    # Vue: @click="" / v-on:click=""
    (re.compile(r"(?:@|v-on:)(\w+)\s*=\s*[\"']\s*[\"']"),
     "handler is empty"),
]

UNIVERSAL_PATTERNS = [
    (re.compile(r"\b(href)\s*=\s*[\"'](?:#|javascript:void\(0\))?[\"']"),
     "link goes nowhere"),
    (re.compile(r"\b(to|href)\s*=\s*\{\s*[\"']#?[\"']\s*\}"),
     "link goes nowhere"),
]

# `onPressed: null` is legitimate and meaningful in Flutter: it is how a button
# is *disabled*. It is only a defect when it is unconditional and permanent,
# which this static gate cannot tell apart -- so it is a warning, not a failure.
NULL_HANDLER = re.compile(r"\b(on(?:Pressed|Tap|Changed|Submitted))\s*:\s*null\b")


def run(ctx: Context) -> Iterator[Finding]:
    patterns = list(UNIVERSAL_PATTERNS)
    if ctx.stack_is("flutter"):
        patterns += DART_PATTERNS
    if ctx.stack_is("node"):
        patterns += NODE_PATTERNS

    for path in ctx.source_files("source"):
        if ctx.is_test(path):
            continue
        rel = ctx.rel(path)
        for lineno, line in ctx.lines(path):
            stripped = line.strip()
            if stripped.startswith(("//", "///", "#", "*")):
                continue

            for rx, msg in patterns:
                m = rx.search(line)
                if m:
                    yield Finding(
                        gate=NAME, path=rel, line=lineno,
                        message=f"{m.group(1) if m.groups() else 'control'}: {msg}",
                        evidence=line,
                    )
                    break
            else:
                m = NULL_HANDLER.search(line) if ctx.stack_is("flutter") else None
                if m:
                    yield Finding(
                        gate=NAME, path=rel, line=lineno,
                        message=f"{m.group(1)} is null - confirm this is a deliberate disabled state",
                        evidence=line,
                        severity="warn",
                    )
