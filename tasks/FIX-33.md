---
id: FIX-33
title: The Nuvion opening spec draws every client address once, so it stops failing at random
owner: YOU
area: FIX
order: 284
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-33 · The Nuvion opening spec draws every client address once, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Builder done; backend `wmt/FIX-33` (one spec file, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** the brief called this FIX-29, which is taken (merged: unbuilt entries). Orders 1 to 252 are all used and a launch task after CHECK-3 fails `npm run tasks`, so it is filed after-launch at order 284 (the way FIX-15 and FIX-28 are).
- **History:** none yet.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-18 verifier's low finding 1 (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-18.md`), found on PR #137's run on 16 Oct

## Goal

`src/nuvion/tests/nuvion-opening.contract.spec.ts` stops failing at random. The opening routes allow 4 tries per client address per hour in this file (stored in `BvnCheckAttempt`). The round 3 block drew its 5 addresses from 249 values (`203.0.113.${randomInt(1,250)}`), so two equal draws gave "expected 200 got 429" (about 1 run in 70).

## Scope (the spec only; no product file, limit, timing, gate or baseline)

Every address the file draws goes through one helper, `freshAddress`, that remembers what the run already used and redraws a repeat: the `203.0.113.x` addresses of round 3, its IPv6 `/64` blocks, and the `198.18.x.y` and `198.19.x.y` places of the later rounds. The ranges, the limits and every assertion are unchanged.

## Capability checks

- [ ] With the round 3 generator set to a constant (scratch copy), `-t "round 3"` fails on "expected 200, got 429" at the "another address is not affected" line.
- [ ] With the change, `-t "round 3"` passes 20 runs in a row, and the whole file passes once.
- [ ] No assertion, limit, timing or range changed (`git diff` is one file: the helper, and the five generator lines).
- [ ] Backend `tsc --noEmit` and eslint on the file exit 0; CI gates show the same FAIL lines as main.

## Builder report

Sonnet builder. Backend `wmt/FIX-33` `83d8db3` (the change) and `4e6c865` (an empty commit to run CI again), from main `18ac5f9`. One file, +31 -8 lines.
- **Red:** on a scratch copy of the spec with `addr = () => "203.0.113.5"`, `-t "round 3"` gave 3 failed, 86 passed, each "expected 200 OK, got 429 Too Many Requests" (the 5th-try test, the held-BVN probes test and the canResubmit view test).
- **Green:** `-t "round 3"` 20 runs in a row, all EXIT 0, 89 passed each; the whole file once, EXIT 0, 365 of 365 passed. Run on the local stack `fix_29` (database `fix_29_wawu_hub_test`), stopped after.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0 (after its own prettier fix); the gates give the same 18 FAIL lines on main and on the branch (`gates run: 1223 files scanned, 16 fail`).
- **CI on `83d8db3`:** 7 of 9 green. Shard 2 failed on another flake in a file this task does not touch: `admin-identity-holds.contract.spec.ts` line 200 scans an audit row with `/\d{11}|bvn/i` and a random admin id ended in `f43762817252` (11 decimal digits in a row). About 1 run in 100 for that file; it needs its own fix (strip the ids before the scan). The failed job could not be rerun with the token, so `4e6c865` runs the checks again: the three suite shards, netns, contract, deploy-test-in-sync, protected routes and baseline all green; Executable gates red with the same FAIL lines as main.
- **FIX-18 sweep row:** none exists on main (no sweep file names this flake), so there was no row to mark.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date._
