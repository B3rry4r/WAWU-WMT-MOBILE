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

As of 19 Oct 2026, verifying: built by a Sonnet builder (tier T0, test infrastructure only; backend `wmt/FIX-93` `2290418` on `origin/main` `e3d2a46`, batch 12; this record on mobile `wmt/FIX-93` from `origin/wmt/MERGE-26` `9ca3e6a4`). No product code, gate, baseline, assertion or Fintava file changed. CI on the backend head `2290418`: Gates 39333217753 and Protected routes 39333217843 green; Branch checks 39333217800 (the whole suite) was still running at hand-back, the lead watches it.

- **Why main was red on deploy.** The deploy runs the whole suite in one process on one database (`npx jest --runInBand --forceExit`). It failed three suites on e3d2a46 (log `ci/deploy12.txt`).
- **1. `wallet-opening-production-boot` and `identity-production-boot`: "Exceeded timeout of 5000 ms for a hook" in `beforeAll`.** The app boot grows with every batch (5.07 s for identity in batch 11). `package.json`'s jest block now has `"testTimeout": 30000`. The two specs are not edited; nothing they assert changes.
- **2. `plan-transfer-sweep.contract.spec.ts:276`, `report.closed` 501, expected 500.** Not new in batch 12: a time bomb in `plan-transfer.contract.spec.ts`. It leaves three waiting transfer orders (tier purchases whose money never came). Each falls due four minutes after it was placed (`nextCheckAt` = placed + 4 min), and by then `h.close()` has removed the person's wallet, so any later sweep closes it as "no wallet" and counts it. The five new batch-12 specs before the sweep (earning and Nuvion earning specs, paid DM) place no orders; they only stretched the gap to the sweep spec to about four minutes. In the failed run the earliest of the three orders (1.4 s ahead of the other two) fell due, and 501 closed was the result. Batch 11 passed because the gap was still under four minutes. The next batch would have closed all three (503).
- **The fix.** `plan-transfer.contract.spec.ts`'s `afterAll` deletes the orders of its own people (`h.users`) before `h.close()`, the way the sweep spec's own `afterAll` does. No assertion changed.
- **Open (low, for the lead, no gap row):** `extra-products-transfer.contract.spec.ts` leaves 2 waiting orders on a fresh database (the same defect). Today it runs after the sweep spec in jest's size order, so nothing fails; it would the day it grows ahead of it. `points-pack-transfer.contract.spec.ts` leaves none of its own. The Fintava-bound `plan-transfer-provider-errors.contract.spec.ts` and the sweep spec were not touched or run.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-20; the backend's `test/plans/lapsed-orders.ts` (FIX-89), `src/plans/purchases/plan-transfer.service.ts` (`sweep`, `settleTaken`)

## Goal

The deploy's whole-suite run passes on main, so a merged batch goes live.

## Scope

`wawu-backend`: `package.json` (the jest block) and `src/plans/purchases/tests/plan-transfer.contract.spec.ts`. `wawu-wmt-mobile`: this file, `docs/LOG.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`.

## Capability checks

- [x] On one fresh database seeded as `deploy.yml` seeds it, `plan-transfer.contract.spec.ts` in band leaves 3 waiting orders before the fix and 0 after (16 of 16 tests pass both ways).
- [x] `jest --showConfig` shows `testTimeout` 30000; `plans.contract.spec.ts` and `points-pack.contract.spec.ts` pass in band (56 tests), nothing else moves.
- [x] tsc, eslint and prettier on the changed files, the gates and the baseline check pass.
- [ ] The full backend run (CI, Branch checks) is green on the head, the two boot specs and the sweep spec included.

## Builder report

- **Files:** backend `package.json` (+1 line), `src/plans/purchases/tests/plan-transfer.contract.spec.ts` (+8 lines, a cleanup in `afterAll`). Mobile: this file, `docs/LOG.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **Found by:** reading the two logs' pass order (jest runs by file size on CI, no cache): the only specs ahead of the sweep that are new in batch 12 are five, none places an order. Then running the specs that do place orders, one at a time on a fresh database, counting waiting orders after each: only `plan-transfer.contract.spec.ts` leaves any (3, all for people whose wallet the spec removes, all due at placed + 4 min).
- **Counts (fresh databases `fix93_test_b` and `_c`, migrated and seeded as `deploy.yml` does):** waiting orders left, unfixed spec 3, fixed spec 0 (all 40 of its rows gone). The brief's "1 before" is the one of the three that was due at the sweep's instant.
- **Checks:** tsc EXIT 0; eslint EXIT 0; prettier EXIT 0; `scripts/gates/run.py` EXIT 0 (0 fail, 128 warn, 88 accepted, as main); `check_baseline.py` EXIT 0.
- **CI (backend `2290418`):** Gates 39333217753 success, Protected routes (V3) 39333217843 success, Branch checks 39333217800 running at hand-back.
- **Not run (owner rule):** both boot specs, the sweep spec, anything on the Fintava double. Their fix is proven by the config line and the cause above; CI runs them.

## Verifier report

## Owner sign-off

Not needed.
