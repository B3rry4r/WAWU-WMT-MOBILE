---
id: FIX-37
title: The live hardening spec asks the system for its ports, so it stops failing with EADDRINUSE
owner: YOU
area: FIX
order: 288
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
- **Status:** verifying. Builder done; backend `wmt/FIX-37` `cdffcae` (one spec file and its fixture, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** filed after-launch at order 288, the way FIX-35 (order 286) is.
- **History:** none yet.

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

## Builder report

Sonnet builder. Backend `wmt/FIX-37` `cdffcae`, from main `3797fb2`. Two test files.
- **Red (the defect, before):** a small listener (`node hold.cjs 36000 38999`, 2974 ports held) running during a run of main's spec fails the shutdown case: `Error: listen EADDRINUSE: address already in use 0.0.0.0:38018` (1 failed, 11 passed, 1 skipped).
- **Green:** the changed spec with the same listener still running passes (12 passed, 1 skipped); the skipped case is the pooler one, which needs `pgbouncer` (not installed on this machine nor in CI), so `freePort()` is typechecked and linted but not run.
- **10 runs in a row:** the second loop passed 10 of 10 on the local stack `fix_37` with nothing else of mine running. A first loop had two red runs while I ran another spec on the same database: run 7 was `Too many database connections opened: sorry, too many clients already` (the machine's Postgres limit of 100, shared with other agents) and run 2 was the live feed answering 503 at the upgrade (its listener probe); neither was an address error.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on both files EXIT 0; prettier check clean. The stack is down and its database dropped.
- **CI on `cdffcae`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`files scanned: 1249, findings: 16 fail`; none in these files).

## Verifier report

_Not started._

## Owner sign-off
