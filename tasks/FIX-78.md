---
id: FIX-78
title: CHECK-1b's new findings: an end date a year away shows its year, the payout account says it must be in your own name
owner: YOU
area: FIX
order: -78
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T1
depends_on: []
decisions: [R-5, R-47, R-51, R-63]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-78 · CHECK-1b's new findings: an end date a year away shows its year, the payout account says it must be in your own name

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 19. Report: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-78.md` (no blocker, high or medium: `dateWords` right on 11 cases including Lagos midnight on 31 Dec and 29 Feb 2028, every tier end-date screen uses it, removing the rule turns 9 of 14 targeted tests red, A21 matches its board). Mobile `wmt/FIX-78` `9a7925a0` from `origin/wmt/MERGE-17` `404aba92`. F-1 and F-2 were fixed by FIX-68 and are untouched.
- **Merge (MERGE-19):** one conflict, in `src/features/verify/__tests__/publishAndTier.test.tsx` (the `beforeEach` reset of the Hub stand-in): SWEEP-APP-3 added `lostFirstBuy: false` and FIX-78 added `until: null`; both fields are kept, no assertion touched (a structural meeting, not a stale test). BACKEND_GAPS.md and SHARED-CHANGES.md are unions. The verifier's lows are SWEEP-APP rows FIX-78 V-1 and V-2 (taken by FIX-79) and V-3 (note).
- **F-3 (medium), fixed:** a 12-month tier no longer reads as ending today. One rule now writes every tier end date: the Lagos day and the board's three-letter month, plus the year when the date is not in the current Lagos year ("Active until 18 Oct 2027"; this year stays "Active until 26 Nov", as the Your tier board draws it). The date is the Hub's `activeUntil`, never worked out from a price or a length. The rule is `dateWords` in `src/features/wallet/history/lagosTime.ts` (it was private there, used by the history; now exported, behaviour unchanged).
- **Screens the date rule reached (all that print a tier, pass or points end date):** Your tier (VF14, VF14a, VF14b: "Active until", "Ends in 3 days · date", "Ended"); Upgrade your tier (VF5b: "You're on Verify until ..."); the products meter caption ("Verify · ends ...") on Me (M1) and on Publish (`ProductsMeter`, a shared component: SHARED-CHANGES FIX-78 #1); Points lots and the wallet's Points tile already used the same rule (`endsOn` now calls `dateWords`; no output change).
- **Screens already right, not changed:** the community pass line (`endDay`, year when not this year, but on the phone's clock), the claim code result (`dateLine`), event dates (`dateLine`, `whenLine`), the verification list (`verification/model.ts` `dayOf`, always writes the year, as its board does: "Active until 12 Oct 2026"). Not a tier, pass or points date, so not touched: the paid-message lock ("Locked until 3 October", a few days).
- **F-6 (low), fixed with one half left out:** the payout account (A21) now opens with the board's helper line in its place and type (13.5 muted, first in the body): "The account must be in your own name." The board's line begins "Creators only."; that half is not drawn because it is not true here: Withdraw sends any person with an open wallet to this screen and the Hub keeps no creator gate on the account (R-51 asks only for the person's own name). The design decides the UI, never the facts (CLAUDE.md rule 7).
- **F-5 (low), ruled (lead default):** the community pass line keeps "Your pass ends on 17 November"; the board's "Renews 16 November. Cancel any time" is not drawn. R-63: the pass is paid for each time and nothing is debited by itself, so "Renews" would be untrue. The button keeps "Join · ₦2,000" (the board's "a month" is the host's price line above it). No change.
- **F-7 (low), recorded:** G-FIX-78-1 (the earn rows, "Your share", "Listing fee", quick amounts and "Usually takes" need the Hub's figures, R-5; same facts as G-ME-08-2, G-ME-08-3).
- **F-9 (low), recorded:** G-FIX-78-2 (a deletion cancelled by signing in has no signal the app can read).
- **F-8 (seed handles with a hyphen), F-10 (stack CORS), F-4 (INBOX-10 is todo):** no change, as briefed.
- **Tests:** `tierEndDates.test.ts` (new, 12 cases on a fixed day: this year no year, next year and last year carry it, the year turns at midnight in Lagos, "Ends in 3 days" across New Year, no date when the Hub sent none, the tier screens, the meter and the points lots agree). Screen cases: Your tier (12-month tier shows its year; ends later this year does not; ended last year says so), Upgrade your tier (ends next year), M1 (12-month tier meter), A21 (the line, both with and without a saved account, and never "Creators only").
- **Assertions changed, all because they pinned the missing year (the sweep rule, `docs/WORKFLOW.md`):** `dv2-comp.test.tsx` "ProductsMeter" expected `'Verify · ends 1 Sep'` for 1 Sep 2027, `'... ends 1 Jan'` for 1 Jan 2027 (Lagos) and `'... ends 29 Feb'` for 29 Feb 2028 from a 2026 clock; they now expect the year. Every other caption case in that file, `tierModel.test.ts`, `tierAndDrafts.test.tsx`, `tierCheckout.test.tsx` and `publishAndTier.test.tsx` is pinned to a day (or built from the current year) so none changes with the calendar; their expected words are unchanged.
- **Pictures** (390 px, light and dark, web export over request interception, beside VF14 and A21; `pair-tier.png`, `pair-payout.png`, `pair-payout-empty.png`): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-78-b/pics/`. Match, with recorded differences: Your tier shows a 12-month tier ("Active until 18 Oct 2027") where the board's example is Verify; no Upgrade button because the stand-in sold no higher tier; the board's "Example values" is the board's own. A21 matches in place and type; "Creators only." is left out (above); Save is shut for an account already saved (existing).
- **Open findings:** none. Lows: none.
- **Next:** the batch 19 pull request (the lead). FIX-79 takes FIX-78 V-1 and V-2 (the year pins in `publishAndTier.test.tsx` and `tierCheckout.test.tsx`).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The CHECK-1b report above; `design/Verify Flow.sections.json` (VF14, VF14a, VF14b), `design/_gen/auth.js` line 50 (A21)

## Goal

A tier, pass or points end date is never read as a date in this year when it is in another, and the payout account tells the person before they save that the account must be in their own name.

## Scope

`src/features/verify/YourTierScreen.tsx`, `purchaseModel.ts`, `src/features/wallet/history/lagosTime.ts`, `src/features/points/model.ts`, `src/features/me/model.ts`, `src/components/ProductsMeter.tsx` (the ticket names it: the one shared file, an optional `now` argument), `src/app/preview/products-meter.tsx` (the gallery keeps the board's day), `src/features/wallet/PayoutAccountScreen.tsx`, their specs, `BACKEND_GAPS.md` rows G-FIX-78-1 and -2, `SHARED-CHANGES.md` row FIX-78 #1. No contract, no theme, no backend.

## Capability checks

- [x] A tier that ends 18 Oct 2027, read on 18 Oct 2026, says "Active until 18 Oct 2027" on Your tier, "ends 18 Oct 2027" under Me and Publish, and "until 15 Jul 2027" on Upgrade your tier.
- [x] A tier that ends later this year says the day and no year.
- [x] A tier that ended last year says "Ended 15 Jul 2025" (with its year).
- [x] The year turns at midnight in Lagos, for the date and for today.
- [x] The payout account opens with "The account must be in your own name." and no "Creators only."

## Owner sign-off

Not needed.
