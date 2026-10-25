---
id: FIX-66
title: A move Nuvion accepts and then fails lands under a new reference, and WAWU's account ledger equals Nuvion's
owner: YOU
area: FIX
order: -66
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-5, R-10, R-19, R-39, R-42, R-55]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-66 · A move Nuvion accepts and then fails lands under a new reference, and WAWU's account ledger equals Nuvion's

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 18.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-66.md`: F1 driven live, one new reference per failed record, landed once, Hub = stand-in = ledger to the kobo; F2 the operational ledger equals the stand-in at every step). Backend `wmt/FIX-66` `a98af09`, this record `2dccc9a5`. Stacked in batch 18 by MERGE-18 (backend `wmt/MERGE-18`, mobile `wmt/MERGE-18`); not on main.
- **Merge (MERGE-18):** the backend merged with no conflict and no migration; BACKEND_GAPS.md keeps G-FIX-66-1 beside the other batch rows. The verifier's lows are SWEEP-MONEY rows FIX-66 L1 and L2 (open).
- **Built:** by a Sonnet builder (tier T2). Backend `wmt/FIX-66` (from `wmt/MERGE-14` `195de50`); this record and the gap row on mobile `wmt/FIX-66` (from `wmt/MERGE-14` `d76612f6`). No schema, no migration, no Fintava file touched, no app code.
- **Found by:** CHECK-2 part A (`scratchpad/verify/CHECK-2a.md`), F1 and F2, both HIGH.
- **F1 cause:** when Nuvion accepted a book transfer and failed it inside the adapter's short wait, `translate` (`src/nuvion/areas/book.ts`) threw "failed, nothing moved" (`recordMayExist: false`), which the callers read as a refusal at the door: the hold and the earnings move kept the SAME reference. Nuvion answers a repeat of a reference with the original (`unique_reference` is its idempotency key, api-reference__transfers.md:174), so the same failed record came back for ever (a refund stuck `held/refused`, a creator's day stuck `owed`). Their new-reference step (`retryAfterFailure`) was reached only from the sweep's read of a record.
- **F1 fix:** `WalletProviderError.providerFailed` (new, default false): true only when the provider TOOK the transfer and its own record says `failed` (api-reference__transfers.md:119 "Transfer statuses"; webhooks__event-types.md:726 `outflows.failed`). The Nuvion book area sets it; `recordMayExist` stays false, so the send, payment and cash-out callers and the adapter spec that pins that are unchanged. `WalletHoldService.afterRefusal` and `EarningSettlementService.afterRefusal` read it and ask the provider once (`reconcile`, a read), whose failed record runs the existing `retryAfterFailure` under a new reference, once (guarded by the current reference). A hold's `retryAfterFailure` now also goes to a person once the move has been refused for the review bound (the earnings move already did, R-55), so a second failure rests (4, 8, 16, 32, 60 minutes) and never loops.
- **F2 cause:** the fee leg (`takeFee`, FIX-52) moves WAWU's fee into its operational account but wrote no ledger row, so the account's ledger fell short of Nuvion's by the fee of every send.
- **F2 fix:** `wallet-transfer.service.ts` writes the leg's row on WAWU's merchant wallet: IN, `<send reference>-fee`, the amount the transfer moved (Nuvion's charge on it is the sender's), written when the transfer is seen complete (the answer, the read at completion, the fee-back step), once (the ledger finds it by account, direction, reference). The fee given back writes OUT, `<send reference>-fee-back`, the amount and Nuvion's charge on the way back (WAWU's), category refund. A failed write is logged and made at the next look; never blocks money that moved.
- **Specs (Nuvion, real adapter over the stand-in socket):** new `src/nuvion/tests/nuvion-failed-move.contract.spec.ts` 5 of 5 (earnings and a paid-question refund: accepted-then-failed lands once under a new reference with Hub = Nuvion = ledger; a second failure rests, no loop, a third reference lands it; past the review bound a person looks and nothing more is sent), all 5 fail without the fix. `wallet-transfer-wawu-fee-nuvion.contract.spec.ts` 12 of 12 (4 new: operational ledger = Nuvion after sends, after a failed principal, after a reversal, after every scenario of the spec) and `wallet-transfer-bank-nuvion.contract.spec.ts` 9 of 9 (1 new), the new ones fail without the fix.
- **Open:** G-FIX-66-1 (a fee-back transfer Nuvion accepts and fails has the same cause and is retried under the same reference; not in this task's scope).
- **Next:** the batch 18 pull request (the lead). FIX-70 builds on this branch (G-FIX-66-1).

Status set to review by the records sync, 25 Oct 2026: merged as backend 6e815cd9, verifier PASS in the lead's merge log, 18 Oct.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `scratchpad/verify/CHECK-2a.md` (F1, F2), BACKEND_GAPS G-FIX-66-1

## Goal

A held refund and a creator's daily move that Nuvion accepts and then fails land once under a new reference, and WAWU's operational account ledger equals Nuvion's for every send.

## Scope (backend only)

`src/wallet-provider/wallet-provider-error.ts`, `src/nuvion/nuvion-error.ts`, `src/nuvion/areas/book.ts`, `src/money/holds/wallet-hold.service.ts`, `src/money/earnings/earning-settlement.service.ts`, `src/money/transfers/wallet-transfer.service.ts` and the specs named above.

## Capability checks

- [ ] A refund Nuvion accepts and fails lands once under a new reference; the payer is paid once.
- [ ] A creator's daily move Nuvion accepts and fails lands once under a new reference.
- [ ] A second failure rests and does not loop; past the review bound a person looks and nothing more is sent.
- [ ] After sends the operational account's ledger equals Nuvion's; a failed send's fee leg is reversed in the ledger as the money is.

## Owner sign-off

Not needed.
