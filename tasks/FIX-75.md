---
id: FIX-75
title: The storage specs no longer share the Hub's real 10-minute timer
owner: YOU
area: FIX
order: -75
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-75 · The storage specs no longer share the Hub's real 10-minute timer

## Current state

As of 18 Oct 2026, merging (lead): accepted by the lead on a diff read (T0, test only) and stacked in batch 19.
- **Status:** merging (lead). Accepted by the lead on a diff read (two spec files, +16/-1, no product code); no verifier report. Backend `wmt/FIX-75` `50a81a6` from `origin/wmt/MERGE-17` `f0022e3`; this record on mobile `wmt/FIX-75` `41775347` from `origin/wmt/MERGE-17` `404aba92`. Stacked in batch 19 by MERGE-19 (backend `wmt/MERGE-19`, mobile `wmt/MERGE-19`); not on main. No schema, no route, no app code, no Fintava file.
- **Merge (MERGE-19):** the backend merged with no conflict; both specs pass in the batch (`upload-late-file.contract.spec.ts` and `upload-removal.contract.spec.ts`, with the other batch 19 specs: 9 suites in one run). BACKEND_GAPS.md keeps G-FIX-75-1 and G-FIX-75-2 after G-DV2-04-1. Both gap rows stay open: `earning-settlement.contract.spec.ts` (Q-42, Fintava) and the 10 events routes of the protected suite (EVENTS-11's lock change, owner's relock).
- **Found by:** branch checks run 39081486121 (backend `wmt/FIX-66` `a98af09`), shard 2: `src/storage/tests/upload-removal.contract.spec.ts`, "the timer does not overlap itself", `Expected length: 1, Received length: 2` at line 697 (the last assertion), both lines "Late-file sweep skipped: the previous run is still going." The spec had run alone 14 of 14 locally.
- **Cause: the TEST (b), not the product.** The spec loads `ScheduleModule.forRoot()` and `StorageModule`, so the Hub's real `@Cron(EVERY_10_MINUTES)` job `sweep-late-uploads` is armed on the wall clock (:00, :10, :20 of every hour). The test counts "skipped" lines on a spy on `Logger.prototype.warn`, which sees the whole process. A real tick that lands inside the test's 1.5 s window finds the run going and logs its own skip, which is what the product is meant to do. The failed spec ran 00:09:32.7 to 00:10:08.1 UTC (35.4 s). The tests after the timer test take 8.0 to 8.4 s in three local runs (they are sleeps and waits, so the same on CI), so the timer test ended about 00:10:00, the slot. The first assertion (at 300 ms) had passed; the extra line came after it. The same tick also runs a real sweep of everyone whenever it lands outside a window, over the shared stand-in bucket.
- **Sibling, same cause:** `upload-late-file.contract.spec.ts`, "is on a timer in the Hub", calls `timer.sweep()` and expects the files gone; a real tick that is mid-run makes that call skip, and the files are still there.
- **Fix (spec only, no assertion changed, no timeout raised, nothing skipped):** both specs stop the registered job after `app.init()` (`SchedulerRegistry.getCronJob('sweep-late-uploads').stop()`). The job stays registered (the sibling still checks that) and every sweep is driven by the spec through `timer.sweep()`, the body the timer calls.
- **Race made to happen every time (like FIX-64):** a scratch copy of each spec arms the real job with `setTime(new CronTime(new Date(Date.now() + 700)))` (1 ms for the sibling), which is what the 00:10:00 slot does, and only fires if the job is running (`setTime` keeps a stopped job stopped). Old code: `upload-removal` timer test failed 20 of 20 (`Expected length: 1, Received length: 2`, as on CI); sibling timer test failed 10 of 10 (`Expected: false, Received: true`). Fixed code: 20 of 20 and 10 of 10 pass.
- **20 full runs of `upload-removal.contract.spec.ts` in a row, two other storage specs looping beside it:** before the fix 20 of 20 pass (a wall-clock coincidence cannot be counted this way: one 10-minute slot in 600 s, 1.5 s wide, about 1 run in 400); after the fix 20 of 20 pass.
- **Checks:** tsc 0; eslint 0 on both files; gates passed (0 fail, 128 warn, 88 accepted), baseline ok; the 13 other storage specs by name (none mention Fintava): 13 of 13 suites, 229 tests.
- **Seen, not touched (Fintava):** the same CI run's shard 1 failed `src/money/earnings/tests/earning-settlement.contract.spec.ts` (WALLET-16, "on Fintava", first at line 803 `expect(m).toHaveLength(1)`, received 0). It fails the same way on the base `wmt/MERGE-17` `f0022e3` (run 39085241768, 21 tests), so it is not a flake and not from FIX-66. Changed nothing; row G-FIX-75-1.
- **CI on this branch (`50a81a6`):** gates 39090053474 success. Protected routes 39090053513 failed the same 10 tests as the base (run 39085241782): events routes, not storage; row G-FIX-75-2. Branch checks 39090053470: still running at hand-back (the base fails it too, on earning-settlement: G-FIX-75-1); the lead watches it.
- **Next:** the batch 19 pull request (the lead). Lows: none.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- wawu-backend `src/storage/storage-sweep.service.ts` (the job and its `running` flag), the two spec files named below

## Goal

A CI run never fails a storage spec because the Hub's own timer fired inside a test.

## Scope (backend only)

`src/storage/tests/upload-removal.contract.spec.ts`, `src/storage/tests/upload-late-file.contract.spec.ts`.

## Capability checks

- [x] With the real timer made to fire inside the window, the old spec fails every time and the fixed spec never does.
- [x] No assertion changed, no timeout raised, nothing skipped; the product (`storage-sweep.service.ts`) is untouched.
- [x] The job is still registered on the schedule (the sibling spec still asserts it).

## Owner sign-off

Not needed.
