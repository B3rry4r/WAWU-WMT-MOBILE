#!/bin/bash
# FOLDERS: reads LEAD_SCRATCH (the lead's working folder; default: a `scratch/` folder next to the repo, i.e.
# <repo>/../scratch). Inputs stay in the repo (this folder: board.json, head.html, .version); the page, its two
# pictures and the logs are written to $LEAD_SCRATCH/board/. Playwright: PW_MODULE and PW_CHROMIUM override
# the paths below (defaults are the first machine's).
# Rebuild the board from board.json + live GitHub facts, render it at 390 and 1280 px,
# check there is no sideways scroll, and print ONE line: "OK v<n> <time>" or the failures.
# Nothing is published here; the lead publishes $LEAD_SCRATCH/board/board.html.
P="$(cd "$(dirname "$0")" && pwd)"       # <repo>/lead/board (board-gen.py, pw-board.js, board.json)
REPO="$(dirname "$(dirname "$P")")"
SCR="${LEAD_SCRATCH:-$(dirname "$REPO")/scratch}"; mkdir -p "$SCR"; export LEAD_SCRATCH="$(cd "$SCR" && pwd)"
D="$LEAD_SCRATCH/board"                  # outputs
mkdir -p "$D"
cd "$D" || exit 2
cp -p board.html .prev.html 2>/dev/null; cp -p "$P/.version" .prev.version 2>/dev/null

out="$(python3 "$P/board-gen.py" 2>"$D/last-build.err")"; rc=$?
if [ $rc -ne 0 ]; then
  echo "FAIL board not written"; cat "$D/last-build.err"; exit 1
fi

shots="$(node "$P/pw-board.js" "${PW_MODULE:-/opt/node-tools/node_modules/playwright}" "${PW_CHROMIUM:-/opt/pw-browsers/chromium}" 2>&1)"; rc=$?
bad="$(printf '%s\n' "$shots" | python3 -c '
import sys, json, re
seen = 0; bad = []
for line in sys.stdin:
    m = re.match(r"^(board-\d+\.png) (\{.*\})", line)
    if not m: continue
    seen += 1
    j = json.loads(m.group(2))
    if j["sw"] > j["iw"]: bad.append("%s sideways scroll: page %dpx wide in a %dpx window" % (m.group(1), j["sw"], j["iw"]))
if seen != 2: bad.append("render produced %d of 2 pictures" % seen)
print("\n".join(bad))')"
if [ $rc -ne 0 ] || [ -n "$bad" ]; then
  # put the last good page and version back: a page that fails the render check is not kept
  cp -p .prev.html board.html 2>/dev/null; cp -p .prev.version "$P/.version" 2>/dev/null
  echo "FAIL render check (previous board.html restored)"
  [ -n "$bad" ] && printf '%s\n' "$bad"
  [ $rc -ne 0 ] && printf '%s\n' "$shots" | tail -5
  exit 1
fi
echo "$out"
