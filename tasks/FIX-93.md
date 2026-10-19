---
id: FIX-93
title: The deploy's whole-suite run passes again: the app boot gets 30 s, and a transfer spec removes the orders it leaves waiting
owner: YOU
area: OPS
order: -93
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-20]
passes: [V1]
artboards: []
tier: T0
---
# FIX-93 · The deploy's whole-suite run passes again: the app boot gets 30 s, and a transfer spec removes the orders it leaves waiting

## Current state

As of 19 Oct 2026, verifying: built by a Sonnet builder (tier T0, test infrastructure only; backend `wmt/FIX-93` `c680ec9` (round 1 `2290418`, accepted) on `origin/main` `e3d2a46`, batch 12; this record on mobile `wmt/FIX-93` from `origin/wmt/MERGE-26` `9ca3e6a4`). No product code, gate, baseline, assertion or Fintava file changed. CI on the backend head `c680ec9`: Gates 39338791721, Protected routes 39338791943, Branch checks 39338791484 (the whole suite), the lead watches it. On `2290418` the whole suite passed the three round 1 suites and failed two others, both fixed in round 2.

- **Why main was red on deploy.** The deploy runs the whole suite in one process on one database (`npx jest --runInBand --forceExit`). It failed three suites on e3d2a46 (log `ci/deploy12.txt`).
- **1. `wallet-opening-production-boot` and `identity-production-boot`: "Exceeded timeout of 5000 ms for a hook" in `beforeAll`.** The app boot grows with every batch (5.07 s for identity in batch 11). `package.json`'s jest block now has `"testTimeout": 30000`. The two specs are not edited; nothing they assert changes.
- **2. `plan-transfer-sweep.contract.spec.ts:276`, `report.closed` 501, expected 500.** Not new in batch 12: a time bomb in `plan-transfer.contract.spec.ts`. It leaves three waiting transfer orders (tier purchases whose money never came). Each falls due four minutes after it was placed (`nextCheckAt` = placed + 4 min), and by then `h.close()` has removed the person's wallet, so any later sweep closes it as "no wallet" and counts it. The five new batch-12 specs before the sweep (earning and Nuvion earning specs, paid DM) place no orders; they only stretched the gap to the sweep spec to about four minutes. In the failed run the earliest of the three orders (1.4 s ahead of the other two) fell due, and 501 closed was the result. Batch 11 passed because the gap was still under four minutes. The next batch would have closed all three (503).
- **The fix.** `plan-transfer.contract.spec.ts`'s `afterAll` deletes the orders of its own people (`h.users`) before `h.close()`, the way the sweep spec's own `afterAll` does. No assertion changed.
- **Open (low, for the lead, no gap row):** `extra-products-transfer.contract.spec.ts` leaves 2 waiting orders on a fresh database (the same defect). Today it runs after the sweep spec in jest's size order, so nothing fails; it would the day it grows ahead of it. `points-pack-transfer.contract.spec.ts` leaves none of its own. The Fintava-bound `plan-transfer-provider-errors.contract.spec.ts` and the sweep spec were not touched or run.
- **Round 2 (CI on 2290418 failed two specs round 1 did not touch). `paid-dm-wallet.contract.spec.ts:735` ("two answers in a day", expected owed, got landed) and `host-share` ("a creator gets one move a day") depend on the time of day.** R-55's day is the Lagos day; the pay harness sweeps at wall time plus every pass so far, so when Lagos midnight (23:00 UTC) falls between a test's passes the later sweep rightly makes a new move. Found by logging the clock of every earnings sweep in each earnings spec and running it at the wall time that puts midnight between each pair of consecutive sweeps (a forward-only Date shim kept in the scratch folder, not the repo). Red before: paid-dm-wallet at 22:12:57 to 22:20:57 UTC (the CI run was 22:16), host-share at 22:50:53. Not red at any pair: event-host-payout, earning-sweep-start, earning-settlement-nuvion, nuvion-earnings (and tip, unlock, legal fee, daily move, which assert no day-bound outcome; earning-settlement is Fintava, not touched).
- **The change is FIX-61's (`cc0da36`) applied unchanged**, so wmt/FIX-61 merges over it cleanly: `keepInLagosDay(hours = 2)` on the pay harness moves the sweeps' clock to the start of the next Lagos day when fewer hours are left, never backwards; the two tests call it first; `pay-harness-day.spec.ts` pins the rule on both sides of midnight. After: all 34 shifts green, 22:16 and 22:50 green, real time green.
- **`school-report.contract.spec.ts:151` (SCHOOLS-09, two relay requests under one key, expected one) is a test race; the product is right.** The enrolment starts the first try in the background; a try claims the row (attempts + lease) before it asks the relay, so a test that waits on `attempts >= 1` sets the relay to ok and clears its requests while that try is still on its way. The late request lands in the new mode and list, and the five deliveries then send a second one under the same key (one conditional update claims, a repeated key is answered with the first mail). New `firstTryDone` waits for `attempts >= 1` and the lease let go, at the six places that waited on attempts alone. With the relay stand-in held back 200 ms in a scratch copy: 3 of 12 red before, 12 of 12 after; on the real stand-in 20 runs in a row green.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-20; the backend's `test/plans/lapsed-orders.ts` (FIX-89), `src/plans/purchases/plan-transfer.service.ts` (`sweep`, `settleTaken`)

## Goal

The deploy's whole-suite run passes on main, so a merged batch goes live.

## Scope

`wawu-backend`: `package.json` (the jest block), `src/plans/purchases/tests/plan-transfer.contract.spec.ts`, `test/payments/wallet-pay-harness.ts`, `src/money/earnings/tests/pay-harness-day.spec.ts` (new), and the specs `paid-dm-wallet`, `host-share` and `school-report`. `wawu-wmt-mobile`: this file, `docs/LOG.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`.

## Capability checks

- [x] On one fresh database seeded as `deploy.yml` seeds it, `plan-transfer.contract.spec.ts` in band leaves 3 waiting orders before the fix and 0 after (16 of 16 tests pass both ways).
- [x] `jest --showConfig` shows `testTimeout` 30000; `plans.contract.spec.ts` and `points-pack.contract.spec.ts` pass in band (56 tests), nothing else moves.
- [x] tsc, eslint and prettier on the changed files, the gates and the baseline check pass.
- [x] paid-dm-wallet and host-share pass at every wall time that puts Lagos midnight between their sweeps, at 22:16, 22:50 and the real time; school-report passes 20 runs in a row.
- [ ] The full backend run (CI, Branch checks) is green on the head, the two boot specs and the sweep spec included.

## Builder report

- **Files:** backend `package.json` (+1 line), `src/plans/purchases/tests/plan-transfer.contract.spec.ts` (+8 lines, a cleanup in `afterAll`). Mobile: this file, `docs/LOG.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **Found by:** reading the two logs' pass order (jest runs by file size on CI, no cache): the only specs ahead of the sweep that are new in batch 12 are five, none places an order. Then running the specs that do place orders, one at a time on a fresh database, counting waiting orders after each: only `plan-transfer.contract.spec.ts` leaves any (3, all for people whose wallet the spec removes, all due at placed + 4 min).
- **Counts (fresh databases `fix93_test_b` and `_c`, migrated and seeded as `deploy.yml` does):** waiting orders left, unfixed spec 3, fixed spec 0 (all 40 of its rows gone). The brief's "1 before" is the one of the three that was due at the sweep's instant.
- **Checks:** tsc EXIT 0; eslint EXIT 0; prettier EXIT 0; `scripts/gates/run.py` EXIT 0 (0 fail, 128 warn, 88 accepted, as main); `check_baseline.py` EXIT 0.
- **CI (backend `2290418`):** Gates 39333217753 success, Protected routes (V3) 39333217843 success, Branch checks 39333217800 running at hand-back.
- **Round 2 checks:** tsc, eslint, prettier on the 5 changed files EXIT 0; `gates/run.py` EXIT 0 (0 fail, 128 warn, 88 accepted); `check_baseline.py` EXIT 0; CI run ids in Current state.
- **Not run (owner rule):** both boot specs, the sweep spec, anything on the Fintava double. Their fix is proven by the config line and the cause above; CI runs them.

## Verifier report

## Owner sign-off

Not needed.
