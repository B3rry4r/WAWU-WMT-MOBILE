---
id: FIX-33
title: The Nuvion opening spec draws every client address once, so it stops failing at random
owner: YOU
area: FIX
order: 329
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-33 · The Nuvion opening spec draws every client address once, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-33.md`): verdict merge, nothing medium or worse. Batch 4: first of the batch 4 stack (on `wmt/INBOX-21`, the batch 3 mobile head, with `wmt/MAIN-LIVE-1`); API types regenerated from backend `wmt/FIX-33` (c5414f9).
- **Id and order:** the brief called this FIX-29, which is taken (merged: unbuilt entries). Orders 1 to 252 are all used and a launch task after CHECK-3 fails `npm run tasks`, so it is filed after-launch at order 284 (the way FIX-15 and FIX-28 are).
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 4 (an empty CI-rerun commit on the backend branch, the identity-holds flake that FIX-34 fixes, the helper's per-run memory, a comment's wording). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

Status set to review by the records sync, 25 Oct 2026: merged as backend b3a4ab69, verifier PASS in the lead's merge log, 16 Oct.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-33.md](history/FIX-33.md).

## Owner sign-off

_Owner: date._
