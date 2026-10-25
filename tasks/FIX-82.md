---
id: FIX-82
title: A test's clean-up never touches a database that is not a test database; the M19 test fails on the old route
owner: YOU
area: FIX
order: -82
priority: launch
repo: wawu-backend, wawu-wmt-mobile
type: setup
status: review
depends_on: []
decisions: []
passes: [V1]
artboards: []
tier: T0
---
# FIX-82 · A test's clean-up never touches a database that is not a test database; the M19 test fails on the old route

## Current state

As of 18 Oct 2026, merging (lead): accepted on a diff read (tier T0) and stacked in batch 20.
- **Status:** merging (lead). No separate verifier (T0): the lead read the diff and accepted it. Stacked in batch 20 by MERGE-20 with SWEEP-APP-4; not on main. Backend `wmt/FIX-82` `3609148` (from `wmt/SWEEP-APP-4` `e67ab47`); this record, the M19 test and the comment on mobile `wmt/FIX-82` (from `wmt/SWEEP-APP-4` `a458d455`). Order -82, free. No Fintava file touched, no route, DTO or schema changed.
- **Found by:** the SWEEP-APP-4 check (lows 1 to 3; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-APP-4.md`).
- **1. Row 168, `src/nuvion/tests/nuvion-opening.contract.spec.ts`:** the guard threw in `beforeAll`, but jest still ran `afterAll`, whose `nuvionWebhookEvent.deleteMany` for every `entities.*` event was not scoped to the spec. Now the database name is read from the server first, before anything starts; `beforeEach` and `afterAll` do nothing until that passed; the delete takes only the ids of the events the spec stored (`storedEvents`). Servers and env are not started before the check, so there is nothing else to close when it fails.
- **Guard proof (scratch database `fix82_guardproof`, no "test" in the name, migrated, one `entities.updated` event seeded):** the old file (`e67ab47`) ran, threw its guard, and afterwards the row was gone (1 before, 0 after). The new file ran, threw its guard at once (`refuses to run on "fix82_guardproof"`), and the row was still there (1 before, 1 after). On a `fix82_wawu_hub_test` copy holding that same foreign event, the spec's dispatcher test passed and removed only the event it stored: the foreign row stayed. Both databases dropped.
- **Same shape elsewhere (grep of every `*.spec.ts` and `test/**`, a before-hook that throws on the database next to a delete or restore in an after-hook):** one other file has a guard, `src/protected-routes/protected-routes.regression.spec.ts` (`assertDisposableDatabase` in `beforeAll`); its `afterAll` restores only `if (snapshot)`, and the snapshot is taken after the guard, so it is safe as it stands. No other spec checks the database name. No Fintava-double spec was touched or run.
- **2. Row 171, `src/features/verify/__tests__/entries.test.tsx`:** the M19 test now renders the ROUTE (`src/app/create.tsx`), not the screen, with a signed-in creator and a router that goes nowhere. On `703d2ed8` (the route passed `onShop`) it fails: the "Your shop" row (`create-shop-row`) is drawn. On `a458d455` plus this change it passes (3 of 3).
- **3. `src/app/create.tsx` header comment:** the draft row is gone from it; it says the board draws none and Your shop opens from Me's draft tile and VF1.
- **Checks:** backend tsc 0, eslint 0 on the spec, gates passed (0 fail, 128 warn, 88 accepted), baseline ok. Mobile tsc 0, eslint 0 on the two files, `entries.test.tsx` 3 of 3, `check_tasks --write` and `npm run tasks` exit 0 (356 tasks), mobile gates passed.
- **Not done:** the whole nuvion-opening spec was not run (365 tests; it names Fintava tables), only the guard runs and its dispatcher test.
- **Next:** the batch 20 pull request (the lead).

Status set to review by the records sync, 25 Oct 2026: merged as backend 5567e8e0, app a024a276, lead acceptance in this file (accepted on a diff read, T0).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The SWEEP-APP-4 check report named above (lows 1 to 3)

## Goal

A spec that refuses a non-test database changes nothing in it, in any hook; and the M19 test fails if the Create route draws the shop row again.

## Scope

`wawu-backend`: `src/nuvion/tests/nuvion-opening.contract.spec.ts`. `wawu-wmt-mobile`: `src/features/verify/__tests__/entries.test.tsx`, a comment in `src/app/create.tsx`, this file.

## Capability checks

- [x] Run against a database whose name does not say "test", the spec starts nothing, deletes nothing, and a seeded row is still there afterwards; the old file deleted it.
- [x] The spec's clean-up deletes only the webhook events it stored.
- [x] No other spec has a database guard with an unguarded clean-up (the one other guard is safe: its restore waits on the snapshot).
- [x] The M19 test fails on `703d2ed8` and passes on the fixed tree.
- [x] The `create.tsx` comment no longer mentions the draft row.

## Owner sign-off

Not needed.
