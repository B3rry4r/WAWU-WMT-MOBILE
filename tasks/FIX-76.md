---
id: FIX-76
title: The school settlement spec waits past the longest rest after sweeps that overlap
owner: YOU
area: FIX
order: -76
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-12, R-39]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-76 · The school settlement spec waits past the longest rest after sweeps that overlap

## Current state

As of 18 Oct 2026, merging (lead): accepted on the lead's diff read (test files only) and run by the FIX-70 round 2 verifier in its 14-suite run (`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-70-r2.md`: FIX-76 MERGE); stacked in batch 21 inside backend `wmt/FIX-70-r2` `99b7996` (FIX-76 itself `b95150d`); this record, mobile `wmt/FIX-70-r2` `fa206a3d`. It closes FIX-74 L1 (SWEEP-MONEY). Test files only: no `src/` code, no schema, no migration, no route, no Fintava file, no app code.
- **Found by:** the FIX-74 check. `school-settlement.contract.spec.ts` "a failed payout > is retried once under a new reference and never doubles" (line 508) was red 2 times in 8 runs under CPU load on the FIX-74 tree and 1 in 4 on base `7e85662`.
- **Cause (b, the test waits wrongly):** `school-settlement.contract.spec.ts:501-506`. The spec runs four sweeps at once, each begun ten minutes after the last (`Promise.all` of `settlements.run(later())`), then finishes the send and runs one more sweep ten minutes later and expects `paid`. Each sweep that reads the settlement takes a look at the send and sets the next look `restMs(checks)` later (`school-settlement.service.ts:888-899`: 2, 4, 8 ... minutes, at most an hour). A sweep that reads after another has written and is still due (its own time is later) reads a larger count, so the rest it sets is longer; under load the four interleave so that the last rest is 16 minutes (measured: next look 16 minutes after the last sweep's time, count 5). The ten-minute sweep then finds the send not yet due, nothing is looked at, and the settlement stays `sent` ("Expected paid, received sent", the same line in "whose answer is lost" `:558`, red 1 in 11 on a shared database). The product is right: nothing is sent twice (2 sends, then 1 successful), the rest never passes an hour, and overlapping sweeps in production carry nearly the same time, so the due check stops the second look.
- **Fix:** the final sweeps wait past the longest rest (`restPasses()` = `later(LONG_REST)`, the file's own constant, used the same way by FIX-72's cases): in the two cases above, and before the second batch of five in "five sweeps at once" (same shape). No assertion changed, no timeout raised, no skip. `NuvionSeamStandIn` gains `holdLook` (additive, default off): the answer to a question about a send waits for a promise the spec holds.
- **New case ("sweeps that overlap"):** makes the race happen every time. Four sweeps, held by `holdLook` so the order is fixed (1 and 2 read together, 1 ends, 3 reads, 2 ends, 4 reads, 3 and 4 end): the next look is 16 minutes after the last sweep (more than ten, at most sixty), nothing is sent again, and the sweep after the longest rest pays it once and the ledger equals the stand-in. The same flow with the old ten-minute wait: red 10 of 10 ("Expected paid, received sent"); with the new wait: green 10 of 10.
- **Counts:** settlement spec (22 tests) 20 times with two other spec files looping beside it on the same database: before, 1 red of 11 ("whose answer is lost", stopped there), and 0 of 20 when the others had their own databases; after, 0 of 20. Four sweeps at once, 40 runs: old ten-minute wait 13 stayed `sent`, the new wait 0. Forced order: old wait red 10 of 10, new wait green 10 of 10. The settlement, failed-payout and Nuvion payouts specs 60 of 60; `tsc` and `eslint` clean on the changed files; gates EXIT 0 (0 fail), baseline EXIT 0.
- **Not run:** `school-enrolment.contract.spec.ts` and every Fintava spec. Observed, not diagnosed (sweep list): `school-report.contract.spec.ts` was red 48 of 174 runs under the same load; the one captured is "the relay takes the mail and the answer is lost" at `:167` (`lastError` null after `firstTryDone`), see G-FIX-76-1. `nuvion-payouts.contract.spec.ts` was red 0 of 209.
- **Next:** an independent verifier (the settlement and payout specs by name, gates).

Status set to review by the records sync, 25 Oct 2026: merged as backend b3594cd8, verifier PASS in the lead's merge log, 18 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/VERIFIER.md`
- FIX-72 (the path under test)

## Goal

The school settlement spec does not go red because the machine is slow.

## Scope (backend only, test files)

`src/schools/settlement/tests/school-settlement.contract.spec.ts` and `test/payments/nuvion-seam-standin.ts`.

## Capability checks

- [ ] The settlement spec passes 20 of 20 runs under load.
- [ ] The forced order is red with the old ten-minute wait and green with the new wait, every time.
- [ ] No assertion, timeout or skip changed.

## Owner sign-off

Not needed.
