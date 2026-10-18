---
id: FIX-73
title: A pasted tip amount keeps whole naira, and A12 says Pick three or more
owner: YOU
area: FIX
order: -73
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T0
depends_on: []
decisions: [R-5]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-73 · A pasted tip amount keeps whole naira, and A12 says Pick three or more

## Current state

As of 18 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder (tier T0). Mobile `wmt/FIX-73` from `origin/wmt/MERGE-16` `5ee3994d`. Mobile only; no backend, contract, migration or Fintava change.
- **1 SWEEP-APP row 137 (HOME-13 S1 L1, money):** `cleanAmountText` in `src/features/tips/model.ts` stripped every non-digit and joined what was left, so a pasted `12.50` became ₦1,250 and `12.5` became ₦125 (a 100x overcharge shown on the Tip button and the PIN sheet). Now everything from the first `.` on is dropped: `12.50` and `12.5` are ₦12, `0.99` and `.50` are nothing to send (the button stays off, "Choose an amount to tip.").
- **Rule for a comma (decided here):** the field is a number pad, so only a paste brings a `.` or `,` in. A comma stays a thousands separator and is ignored, as the existing `1,250` assertions and the flow test pin: `1,250` is ₦1,250, `1,250.75` is ₦1,250. Only the dot ends the whole naira (Nigerian figures group with commas and use a dot for kobo). The sheet still shows the exact figure it will charge before the PIN.
- **2 SWEEP-APP row 131 (AUTH-06 L3, copy):** A12's sub-line read "Pick 3 or more." where the board reads "Pick three or more." `interestsHint(minimum)` in `InterestsScreen.tsx` spells the Hub's minimum in words up to ten (digits above ten); the Hub's number is still the one used.
- **Tests (red before, green after):** `tips/__tests__/model.test.ts` (the `12.50` assertion that pinned ₦1,250 now pins ₦12, per the row; new `12.5`, `12.`, `1,250.75`, `0.99`, `.50` and the `cleanAmountText` cases), `tips/__tests__/tipFlow.test.tsx` (a pasted `12.50` is quoted as 1200 kobo, the button reads "Tip ₦35.25", the field shows 12), `after-signup/__tests__/afterSignup.screens.test.tsx` (line 125 now the board's sentence; a new `interestsHint` case). Run on the unfixed source: 5 failed, 35 passed; on the fixed source: 40 of 40 pass (4 suites).
- **Next:** an independent verifier; the lead's batch.

## Goal

A tip is never charged at a hundred times what was pasted, and A12 says what the board says.

## Capability checks

- [x] A pasted `12.50` or `12.5` quotes and shows ₦12; `0.99` leaves nothing to send; `1,250` is still ₦1,250.
- [x] The Tip button and the PIN sheet show the figure the Hub quoted for the cleaned amount.
- [x] A12's sub-line reads "Pick three or more. It tunes your feed." for the Hub's minimum of 3.

## Owner sign-off

Not needed.
