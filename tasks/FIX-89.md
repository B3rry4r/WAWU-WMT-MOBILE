---
id: FIX-89
title: Two specs that read the shared deploy database assert only on their own rows
owner: YOU
area: OPS
order: -89
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: []
passes: [V1]
artboards: []
tier: T0
---
# FIX-89 · Two specs that read the shared deploy database assert only on their own rows

## Current state

As of 19 Oct 2026, built by a Sonnet builder (tier T0, test only): backend `wmt/FIX-89` `4ec192a` (2 commits) on `origin/main` `84a230c`; this record on mobile `wmt/FIX-89` (from `origin/wmt/MERGE-25` `eb2ffa3b`). Order -89, free. Test files only (4 specs and one new helper `test/plans/lapsed-orders.ts`): no source file, route, DTO, schema, gate or Fintava file touched; no assertion weakened or skipped.
- **Found by:** the batch 8 deploy (run 39263677817 on main `84a230c`). Its Test job runs the WHOLE suite in one process on one database (`npx jest --runInBand --forceExit`); PR CI runs 3 shards, so these specs never met the rows below there. 2 suites, 11 tests red.
- **1. `admin-plan-settings.contract.spec.ts` (10 tests):** `auditRows` read every audit row for a setting key, and TIER-04's `extra-products.contract.spec.ts` (admin `tier04@admin.test.wawu.dev`) leaves its `plan_setting_set` rows and never cleans them. Now `auditRows` also filters on `actedByAdminId in adminIds` (the spec's own four admins, which it creates and deletes already). Every assertion unchanged.
- **2. `points-pack-transfer.contract.spec.ts:335`:** `transfers.sweep(later)` expires EVERY lapsed waiting order in the database, so other specs' waiting orders expired with this one's (3, not 1). New helper `sweepWithDue` reads the ids of the orders due at `later` before the sweep; the spec asserts its own order is in that set and is the one expired (1), and that `report.expired` equals the number of those due orders now `expired`. On an empty database that is the old `toBe(1)`.
- **3. The same line in two siblings (found by the first full run, fixed in commit 2):** growing spec 2 moved it ahead of `extra-products-transfer.contract.spec.ts` in jest's size order, and its 2 leftover waiting orders then failed that spec (`:342`, expected 1, received 3). That spec and `plan-transfer.contract.spec.ts:304` use the same helper now. All three are order independent.
- **Red before:** spec 1: a stand-in polluter (a throwaway spec, not committed: TIER-04's admin changes the extra products price 4 times through `PlanSettingsService`, nothing cleaned) then the victim as on `84a230c`, one fresh database, `--runInBand`: 10 of 24 red, "Expected length: 1, Received length: 5". Spec 2: the deploy log (expected 1, received 3), and the sibling in my first full run (expected 1, received 3). Specs 2 and 3 were not run on their own: they boot the shared tier harness, which starts the Fintava double, and a Fintava-double spec runs only inside the full run.
- **Green after:** spec 1: same database, the 4 foreign rows still in it, fixed spec 24 of 24, EXIT 0.
- **The deploy's own command on my branch (fresh database set up as deploy.yml does: `migrate deploy`, `db:seed`, mock WAWU ID on :4001 with fresh keys, the same four env values, `CI=true`, own jest cache; full output kept):** run 2 (`4ec192a`): EXIT=1, 10 failed suites, 409 passed, 419 total; 60 tests failed, 11069 passed, 4 skipped. NONE of the four edited specs failed, and the database held 6 foreign TIER-04 audit rows at the end. Run 1 (`c6d4bdd`, before commit 2): 12 failed, 407 passed; the extra one was the sibling in item 3, the other (`wallet-bill-nuvion.contract.spec.ts`) a 5 s hook timeout that passed in run 2.
- **The 10 that still fail here, none touched and none in the deploy's log, all this machine and not the change:** `shop.contract.spec.ts` and `marketplace-save.contract.spec.ts` ("Database `wawu_hub_test` does not exist": they ignore `DATABASE_URL`, and my database name had to carry the `fix89` prefix); `receipt-units.spec.ts` ("the digit table keeps up with the runtime": Node 22.22.0's Unicode data differs from CI's 22); `fintava-stall.spec.ts` (a 1206 ms timer against a 1002 ms bound under load); and six that time out at the 5 s default of `beforeAll`/`it` while loading the whole app on a cold cache: `production-boot`, `identity-production-boot`, `selfie-production-boot`, `wallet-opening-production-boot`, `identity-throttle`, `selfie-match`. Not rerun on their own (they import the Fintava double).
- **CI (once) on `4ec192a`:** Gates, Protected routes (V3) green; Branch checks red on shard 1 only (shards 2 and 3, contract, netns green): `account-deletion-round4.contract.spec.ts` "T6b FIFO provider, unfreeze may fail" (a seeded fuzz: seed 5637 "stranded not healed", 505 s; passed in the deploy and in both of my full runs; Fintava double, so left alone). Run ids: 39280168286 (Gates), 39280168319 (Branch checks), 39280168341 (Protected routes).
- **Checks:** backend `tsc --noEmit` EXIT 0; eslint (no fix) on the five files EXIT 0; prettier clean.
- **Left (G-FIX-89-1, low):** `plan-transfer-sweep.contract.spec.ts` (Fintava double, not touched) reads the shared table; the polluters (TIER-04 specs delete no audit rows; the transfer specs leave waiting orders) could also clean up after themselves.
- **Next:** the lead's read (T0, test only); the account-deletion fuzz is a separate flake for the lead.

Status set to review by the records sync, 25 Oct 2026: merged as backend 40f64b36, lead acceptance in the lead's merge log, 19 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The deploy log of run 39263677817 (Test job), backend `.github/workflows/deploy.yml`

## Goal

The deploy's one-database, one-process run of the whole backend suite is green: a spec that reads a shared table reads only the rows it made.

## Capability checks

- [x] `admin-plan-settings.contract.spec.ts` passes with another admin's audit rows for the same setting in the database.
- [x] `points-pack-transfer.contract.spec.ts`, `extra-products-transfer.contract.spec.ts` and `plan-transfer.contract.spec.ts` pass with other specs' lapsed waiting orders in the database, in any order.
- [x] The two named specs and the two siblings pass in the deploy's command (`npx jest --runInBand --forceExit`) on a fresh database; the 10 other failures there are this machine's (above).

## Owner sign-off

Not needed.
