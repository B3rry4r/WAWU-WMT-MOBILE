---
id: FIX-90
title: Four specs and one timing case that failed the batch 26 whole-suite run stop reading rows other specs change
owner: YOU
area: OPS
order: -90
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
# FIX-90 · Four specs and one timing case that failed the batch 26 whole-suite run stop reading rows other specs change

## Current state

As of 19 Oct 2026, built by a Sonnet builder (tier T0, test files only; backend `wmt/FIX-90` `c115ab2` from `origin/main` `3acc044`; no product code, gate, baseline or migration). Proved on `origin/wmt/MERGE-26` `adc455e`. CI on the backend head: Gates 39306630717, Protected routes 39306630724, Branch checks 39306630758 (the whole suite; the lead watches it). Checks and the red/green runs are in `tasks/history/FIX-90.md`.

- **One cause for four victims.** `search-popular-privacy.contract.spec.ts` (on main since EXPLORE-05) ends with the seeded plain user's account deletion still scheduled. `account-deletion-identity.contract.spec.ts` (SETTINGS-08, first in batch 12) runs the sweep with a clock 30 days ahead and purges every scheduled row, so that user's profile, course enrollment and purchase are gone for every spec after it.
- **Victims and the batch that first trips them:** `event-host-wizard` (12), `learn-entitlement` (12), `course-lesson` (12), `event-door-scan` (17: its EVENTS-11 refresh, `e54a2d2`, is the first version that needs the host's profile row).
- **Fixes (assertions unchanged, nothing skipped):** the two event specs make the host's profile when it is missing and remove it if they made it; `learn-entitlement` asks the route about a plain user it registers on the mock WAWU ID and enrolls itself; `course-lesson` uses a buyer and a Purchase it writes and removes.
- **`fintava-stall.spec.ts` (R-70, test only):** three "times out on time" cases failed by 6 to 77 ms in the deploy run. A forced collection in the one big process blocks the loop more than once per call, so a bound built on the worst single stall is too tight. The lag allowed is now the total time the loop was unavailable. Same bound on an idle machine.
- **Open:** G-FIX-90-1 (low): the leak and the sweep are still there; other specs that read the seeded plain user after batch 12 are exposed until one of them is fixed.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-70; FIX-89 (`test/plans/lapsed-orders.ts`, the same idea)

## Goal

The four victims pass in the deploy's one-process run after the polluters have run, and the stall timing case passes under load, without proving less than before.

## Scope

`wawu-backend`: five spec files (test files only). `wawu-wmt-mobile`: this file, BACKEND_GAPS.md, docs/LOG.md.

## Capability checks

- [x] Red, then green, on one fresh database on `origin/wmt/MERGE-26`: `search-popular-privacy`, then `account-deletion-identity`, then the four victims. Before the fix 4 of 4 fail (25 tests); after it 4 of 4 pass (36 tests), on the same purged database.
- [x] The same four and the stall spec pass on the seeded database too (5 suites, 156 tests), leaving the seeded rows as they were.
- [x] The stall timing cases are red with a forced collection that blocks 1 s (38 of 38), green with the new bound (38 of 38); the whole spec passes (120).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-90.md](history/FIX-90.md).

## Owner sign-off

Not needed.
