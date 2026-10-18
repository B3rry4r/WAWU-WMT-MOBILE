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

Round 2, 18 Oct 2026, builder (tier T2), awaiting its check: backend `wmt/FIX-70-r2` (from `wmt/FIX-76` `b95150d`, head `55ffe88`); this record and a gap row on mobile `wmt/FIX-70-r2` (from `wmt/FIX-76` `4c28b6e4`). Fixes the verifier's F1 (medium), F2 and F3 (low) from `verify/FIX-70-72.md`. No schema, no migration, no route, no contract change. Product diff: `wallet-transfer.service.ts` +146 -20, `ledger.service.ts` +50. **F1:** `moveFeeBack` reads `<send>-fee-back` first; a failure seen in the very pass returns `wait` (nothing more is sent, the row is asked again in the sweep's 2 minutes), and only a first try the provider failed in an earlier pass, made at least `FEE_RETURN_RETRY_MS` (2 min) before by the provider's own time, is followed by the one new reference. **F2:** `recordFeeOwed` writes the fee as `completed` money OUT on the sender's wallet under `<send>-fee` (counterparty WAWU) when the send failed or was reversed; `LedgerService.noteFeeLegReturned` turns it `reversed`, whole, only when a fee-back has landed. The money check counts a reversed debit as nothing, so ledger and provider agree at every step. **F3:** a fee-back left pending or unreadable is held for a person past `PAYMENT_REVIEW_AFTER_HOURS` and leaves the sweep (`holdFeeReturn`, shared with the second-failure path). Spec `wallet-transfer-fee-back-failed-nuvion.contract.spec.ts` 10 of 10 (was 7): the old second-failure test pinned the same-pass second try, so its assertions follow the new pass order; four new tests, each red on `b95150d`. Gap G-FIX-70-2 and G-FIX-70-3 added.
- **Closes:** G-FIX-66-1. **Found by:** FIX-66's builder (the one caller of a provider move FIX-66 left alone).
- **Cause:** `returnFee` (`wallet-transfer.service.ts`) gave a failed or reversed send's fee back under `<send reference>-fee-back`. When Nuvion took that transfer and then failed it, the adapter threw `providerFailed` (FIX-66), `returnFee` called it pending and asked again every two minutes under the same reference; Nuvion answers a repeat of a reference with the original failed record (api-reference__transfers.md:174), so the person's fee never came back.
- **Fix:** new `moveFeeBack` makes the move under `<send>-fee-back` and, only when the provider's own record under it says `failed` (the error's `providerFailed`, then confirmed by reading the record), once more under `<send>-fee-back-2` (`feeBackReference`, `sendReferenceOfFeeBack`; both begin with the send's reference and the first suffix, 57 characters at most). A timeout, a network error, a 5xx, an unfinished transfer or a record that cannot be read throws as before and is asked about under the same reference: never a new one. A second failure sends nothing more (`rest`): the sweep looks again every 30 minutes and, past `PAYMENT_REVIEW_AFTER_HOURS` counted from when the fee became owed, the send gets `reviewSince` and a note and leaves the sweep (a person looks; the money is still the sender's). The merchant OUT ledger row is written once, under the reference of the try that landed (a failed try moved nothing and has no row), so Nuvion's deliveries find it.
- **Spec (Nuvion stand-in only, no Fintava import):** new `src/money/transfers/tests/wallet-transfer-fee-back-failed-nuvion.contract.spec.ts`, 7 of 7: accepted-then-failed lands once under `-fee-back-2` (person whole, one ledger row, no third transfer); a second failure does not loop and goes to a person past the bound; a timeout (answer lost, then Nuvion fails it) starts the new reference only on Nuvion's own failed record; a 5xx and an unfinished transfer never start one; the operational ledger equals the stand-in after each. Red on `a98af09` for the first three (the two guards cannot be red there: that code never made a new reference), green after.
- **Read-only survey (no fix):** every other provider move in `src/money`, `src/nuvion`, `src/points`, `src/schools`. Same-reference retry of an accepted-then-failed move: one, G-FIX-70-1 (a school payout). The holds (every refund and release: bills, tickets, school enrolment, pass, legal, DM, unlock, tip, plan purchase), the earnings move, the payment, the send, the bank send, the fee leg and the points cash-out do not (new reference, or final).
- **Next:** an independent verifier (V3 protected suite, gates, the three fee specs).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-66-1, G-FIX-70-1, G-FIX-70-2, G-FIX-70-3

## Goal

A fee WAWU gives back that Nuvion accepts and then fails reaches the sender once, under a new reference, and a second failure never loops.

## Scope (backend only)

`src/money/transfers/wallet-transfer.service.ts` and the spec named above.

## Capability checks

- [ ] A fee given back that Nuvion accepts and fails lands once under a new reference; the person is whole and the ledger holds one row.
- [ ] A second failure sends nothing more and, past the review bound, a person looks.
- [ ] A timeout, a 5xx or an unfinished transfer never starts a new reference.
- [ ] Round 2: the second try is never sent in the pass that saw the first fail and waits at least the sweep interval.
- [ ] Round 2: the sender's ledger equals the provider's balance at every step of a fail-fail-person path; the fee shows as returned only when a fee-back has landed.
- [ ] Round 2: a fee-back left pending goes to a person past the review bound and is not asked again.

## Owner sign-off

Not needed.
