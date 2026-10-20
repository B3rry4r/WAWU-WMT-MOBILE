---
id: FIX-92
title: The seeded plain user survives the deploy's whole-suite run: search-popular-privacy cleans up, the identity sweep reaches only its own people
owner: YOU
area: OPS
order: -92
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-70]
passes: [V1]
artboards: []
tier: T0
---
# FIX-92 · The seeded plain user survives the deploy's whole-suite run: search-popular-privacy cleans up, the identity sweep reaches only its own people

## Current state

As of 19 Oct 2026, built by a Sonnet builder (tier T0, test files only; backend `wmt/FIX-92` `99c3703` from `origin/wmt/MERGE-12` `3d64d85`, the batch 12 PR head; no product code, gate, baseline or migration). Mobile `wmt/FIX-92` from `origin/wmt/MERGE-26` `9ca3e6a4`. Status verifying.

- **Root of the chain found by the batch 26 rehearsal:** `search-popular-privacy` leaves the seeded plain user's (`...0001`) deletion scheduled; `account-deletion-identity` (SETTINGS-08, batch 12) sweeps with a clock 31 days ahead and purges it; `credit-purchase` then recreates that user's CreditsState with no trial and `credits-state.contract.spec.ts:96` fails. FIX-90 patched four other victims of the same chain.
- **(a) `src/search-response/tests/search-popular-privacy.contract.spec.ts`:** it notes in beforeAll whether the seeded user already had a deletion row. In afterAll, if not, it cancels the deletion it scheduled (puts back the hidden content and the push mark) and removes the cancelled row and the hidden-content rows. The seed is left as found. No assertion touched.
- **(b) `src/account/tests/account-deletion-identity.contract.spec.ts`:** it does not import the Fintava double (the word is only in a header comment), so it is changed. The rows that exist before it starts are held for its length with the sweep's own marks (`reconcileClaimedUntil` in the future, `identityMarkNextAt` out of reach), by raw SQL so `updatedAt` is not touched, and put back as found in afterAll. Its nine cases and their assertions are unchanged; a pass with a clock 31 days ahead now takes only its own people.
- **Each fix works alone:** with only (b), the seeded row stays `scheduled`, unpurged, and `credits-state` passes; with both, the row count is 0 after step 1.
- **Closes G-FIX-90-1.** Its row is in `BACKEND_GAPS.md` here, marked closed by FIX-92. The row first lives on `wmt/FIX-90`, which this branch (from `MERGE-26`) does not contain, so merging both makes a one-line conflict at the end of the table: keep this branch's line.
- **CI on the backend head:** Gates 39321949267 (green), Protected routes 39321949511, Branch checks 39321949302 (the whole suite; the lead watches it).
- **Open:** nothing.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- FIX-90 (`tasks/FIX-90.md` on `wmt/FIX-90`), gap G-FIX-90-1

## Goal

No spec that runs after `search-popular-privacy` and `account-deletion-identity` in the deploy's one-process run can lose the seeded plain user to them, whatever it reads.

## Scope

`wawu-backend`: two spec files (test files only). `wawu-wmt-mobile`: this file, BACKEND_GAPS.md, docs/LOG.md.

## Capability checks

- [x] Red, then green, on one fresh database seeded as `deploy.yml` does, run in band on `origin/wmt/MERGE-12`: `search-popular-privacy`, `account-deletion-identity`, `credit-purchase`, `credits-state`, then FIX-90's four victims. Before the fix `credits-state` fails 1 of 4 (`trialEndsAt` expected a string, received null) and the other suites pass; after it all eight suites pass (73 tests).
- [x] The seeded user's `AccountDeletion` row count: 0 before step 1, 1 after it before the fix, 0 after it and after every later spec once fixed.
- [x] Typecheck, eslint and prettier on the two files, and the gates (0 fail), are clean.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-92.md](history/FIX-92.md).

## Owner sign-off

Not needed.
