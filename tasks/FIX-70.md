---
id: FIX-70
title: A fee given back that Nuvion accepts and then fails lands under a new reference, once
owner: YOU
area: FIX
order: -70
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-10, R-19, R-39, R-42]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-70 · A fee given back that Nuvion accepts and then fails lands under a new reference, once

## Current state

As of 18 Oct 2026, verifying: built by a Sonnet builder (tier T2), not yet checked. Backend `wmt/FIX-70` (from `wmt/FIX-66` `a98af09`, head `80f5845`); this record and the gap rows on mobile `wmt/FIX-70` (from `wmt/FIX-66` `2dccc9a5`). No schema, no migration, no route, no Fintava file touched, no app code.
- **Closes:** G-FIX-66-1. **Found by:** FIX-66's builder (the one caller of a provider move FIX-66 left alone).
- **Cause:** `returnFee` (`wallet-transfer.service.ts`) gave a failed or reversed send's fee back under `<send reference>-fee-back`. When Nuvion took that transfer and then failed it, the adapter threw `providerFailed` (FIX-66), `returnFee` called it pending and asked again every two minutes under the same reference; Nuvion answers a repeat of a reference with the original failed record (api-reference__transfers.md:174), so the person's fee never came back.
- **Fix:** new `moveFeeBack` makes the move under `<send>-fee-back` and, only when the provider's own record under it says `failed` (the error's `providerFailed`, then confirmed by reading the record), once more under `<send>-fee-back-2` (`feeBackReference`, `sendReferenceOfFeeBack`; both begin with the send's reference and the first suffix, 57 characters at most). A timeout, a network error, a 5xx, an unfinished transfer or a record that cannot be read throws as before and is asked about under the same reference: never a new one. A second failure sends nothing more (`rest`): the sweep looks again every 30 minutes and, past `PAYMENT_REVIEW_AFTER_HOURS` counted from when the fee became owed, the send gets `reviewSince` and a note and leaves the sweep (a person looks; the money is still the sender's). The merchant OUT ledger row is written once, under the reference of the try that landed (a failed try moved nothing and has no row), so Nuvion's deliveries find it.
- **Spec (Nuvion stand-in only, no Fintava import):** new `src/money/transfers/tests/wallet-transfer-fee-back-failed-nuvion.contract.spec.ts`, 7 of 7: accepted-then-failed lands once under `-fee-back-2` (person whole, one ledger row, no third transfer); a second failure does not loop and goes to a person past the bound; a timeout (answer lost, then Nuvion fails it) starts the new reference only on Nuvion's own failed record; a 5xx and an unfinished transfer never start one; the operational ledger equals the stand-in after each. Red on `a98af09` for the first three (the two guards cannot be red there: that code never made a new reference), green after.
- **Read-only survey (no fix):** every other provider move in `src/money`, `src/nuvion`, `src/points`, `src/schools`. Same-reference retry of an accepted-then-failed move: one, G-FIX-70-1 (a school payout). The holds (every refund and release: bills, tickets, school enrolment, pass, legal, DM, unlock, tip, plan purchase), the earnings move, the payment, the send, the bank send, the fee leg and the points cash-out do not (new reference, or final).
- **Next:** an independent verifier (V3 protected suite, gates, the three fee specs).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-66-1, G-FIX-70-1

## Goal

A fee WAWU gives back that Nuvion accepts and then fails reaches the sender once, under a new reference, and a second failure never loops.

## Scope (backend only)

`src/money/transfers/wallet-transfer.service.ts` and the spec named above.

## Capability checks

- [ ] A fee given back that Nuvion accepts and fails lands once under a new reference; the person is whole and the ledger holds one row.
- [ ] A second failure sends nothing more and, past the review bound, a person looks.
- [ ] A timeout, a 5xx or an unfinished transfer never starts a new reference.

## Owner sign-off

Not needed.
