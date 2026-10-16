---
id: FIX-37
title: The live hardening spec asks the system for its ports, so it stops failing with EADDRINUSE
owner: YOU
area: FIX
order: 333
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-37 · The live hardening spec asks the system for its ports, so it stops failing with EADDRINUSE

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-36.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-36` (this branch contains it); API types regenerated from backend `wmt/FIX-37` (c9a8d86).
- **Id and order:** filed after-launch at order 288, the way FIX-35 (order 286) is.
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 2 (the shutdown case has no finally that kills its child; the pooler case cannot run without pgbouncer). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-35 task file (the same kind of fix: a spec that failed for a reason outside the code)

## Goal

`src/live/tests/live-hardening.contract.spec.ts`, the case "tells its sockets 1001 and exits promptly on SIGTERM", stops failing with `listen EADDRINUSE`. It started a real server on a port picked at random from 38000-38999 (and the pooler case used 36000-36999). Both ranges sit inside the range Linux gives to outgoing connections (32768-60999), so on a busy runner another process can already hold the port. Seen 16 Oct on `wmt/FIX-22` `819aa28` (run 38925076346, job 117054515826, port 38290). Of the 8 failed jobs on the 7 failed branch runs of that day, this was the only one with `EADDRINUSE`.

## Scope (the spec and its own fixture; no product file, gate or baseline)

`live-server.fixture.ts` (used by this spec only) listens on `LIVE_FIXTURE_PORT`, which the test now sets to `0`, and prints `listening on <port>` with the port it got; the test reads the port from that line. The pooler case takes its port from `freePort()`: a probe server on port 0 that is closed, and awaited, before the port is used. No port number is picked by the test any more. Nothing else in either file changes.

## Capability checks

- [ ] With a process holding every port in 36000-38999, the unchanged spec (main's) fails the shutdown case with `EADDRINUSE`, and the changed spec passes.
- [ ] The changed spec passes 10 runs in a row.
- [ ] `git diff` is two files: the fixture (the port, the print and a type import) and the spec (`freePort`, the two port lines and the read of the printed port).
- [ ] Backend `tsc --noEmit` and eslint on both files exit 0; CI gates show the same FAIL lines as main.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-37.md](history/FIX-37.md).

## Owner sign-off
