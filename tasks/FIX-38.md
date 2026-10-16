---
id: FIX-38
title: The transfer spec looks for the PIN in the log only where it can be one, so it stops failing at random
owner: YOU
area: FIX
order: 289
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-38 · The transfer spec looks for the PIN in the log only where it can be one, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-36.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-37` (this branch contains it); API types regenerated from backend `wmt/FIX-38` (c07de8f).
- **Id and order:** filed after-launch at order 289, the way FIX-35 (order 286) is.
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 2 (a pin glued to letters is not seen; a fractional duration reads as a hit). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-35 task file (the same kind of fix: a spec that failed for a reason outside the code)

## Goal

`src/money/transfers/tests/wallet-transfer.contract.spec.ts`, the last case "no answer of any send route carried a phone number, and the provider only ever saw our reference and a neutral narration", stops failing at random. It asserted that no log line holds the wrong PIN `1397` as a plain substring (line 1831 on main `3797fb2`). A random reference such as `wawu-send-e1397f65-cabe-4cf5-a4af-8f9f25e211c3` holds the same four digits by chance, so it failed with nothing leaked (seen 16 Oct on `wmt/EXPLORE-05` `83df312`, run 38929092786, job 117068243879, shard 3).

## Scope (the spec only; no product file, harness, gate or baseline)

The assertion is now `logsCarryPin(logger.lines, WRONG_PIN)`. The helper takes out what can hold digits by chance (UUIDs, stack-frame positions such as `spec.ts:1397:54`, durations such as `1397 ms`), then looks for the PIN standing alone, with no letter or digit touching it. A PIN written glued to a letter or digit (`pin1397`) is not seen; every form a log line would print it in (`pin 1397`, `"pin":"1397"`, `pin=1397`, a header dump) is. `WRONG_PIN` and the harness are unchanged.

## Capability checks

- [ ] On a scratch copy where the PIN guard logs `checking pin <the PIN>`, the case fails (`Expected: false`, `Received: true`).
- [ ] With the transfer id forced to start with `e1397f65` (so every reference holds `1397`), the changed spec passes and the unchanged spec (main's) fails the same case on `not "1397"`.
- [ ] The changed spec passes 10 runs in a row.
- [ ] `git diff` is one file: the `logsCarryPin` helper and the one assertion.
- [ ] Backend `tsc --noEmit` and eslint on the file exit 0; CI gates show the same FAIL lines as main.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-38.md](history/FIX-38.md).

## Owner sign-off
