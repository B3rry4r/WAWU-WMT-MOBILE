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
- **Status:** verifying. Builder done; backend `wmt/FIX-38` `ace6ec0` (one spec file, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** filed after-launch at order 289, the way FIX-35 (order 286) is.
- **History:** none yet.

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

## Builder report

Sonnet builder. Backend `wmt/FIX-38` `ace6ec0`, from main `3797fb2`. One file.
- **Red (the fix still catches a leak):** on a scratch worktree, `transaction-pin.guard.ts` logged `checking pin ${pin}` before the check; the changed spec fails exactly the one case (1 failed, 34 passed) with `Expected: false`, `Received: true`.
- **Red (the defect, before):** with `wallet-transfer.service.ts` forced to build ids starting `e1397f65` (the failure output shows the reference on 56 lines), main's spec fails the case with `Expected substring: not "1397"` (1 failed, 34 passed); the changed spec on the same code passes (35 of 35).
- **Helper table:** 9 strings checked by hand: the observed reference, a UUID whose second group is `1397`, a stack frame and a duration are not hits; `wrong pin 1397`, `{"pin":"1397"}`, `x-transaction-pin: 1397`, `pin=1397.` and `pin check failed (1397)` are.
- **Green:** 10 runs in a row (35 of 35 each) on the local stack `fix_37` (down, database dropped). Of 403 log lines in a real run, the only digit runs left after the strip are fixed kobo amounts (205000, 203325, 5000, 3325).
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `ace6ec0`:** suites 2 and 3, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green; `wallet-transfer.contract.spec.ts` passed in shard 3. Suite shard 1 is red on one case of another spec this branch does not touch: `nuvion-opening.contract.spec.ts`, "round 3: at most 10 opening tries an hour from one address (a setting) › the view says so too: canResubmit is false with the time the hour opens", got 429 instead of 200 at its line 2850 (4188 of 4189 passed); a flake of its own, to be filed and fixed by its own task. A re-run of the failed job is not allowed from here (403), and an empty commit is not allowed. Executable gates red with the same 16 FAIL count as on main and on `wmt/FIX-36` and `wmt/FIX-37` (none in this spec).

## Verifier report

_Not started._

## Owner sign-off
