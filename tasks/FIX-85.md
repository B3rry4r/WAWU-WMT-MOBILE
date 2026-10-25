---
id: FIX-85
title: A failed send that Nuvion then reverses counts the fee once and gives it back once
owner: YOU
area: MONEY
order: -56
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: [FIX-70]
decisions: [R-10, R-19, R-39, R-42]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-85 · A failed send that Nuvion then reverses counts the fee once and gives it back once

## Current state

As of 18 Oct 2026, merging (lead): built by a Sonnet builder (tier T2) and accepted on the lead's diff read (at most 30 product lines closing a named gap, red before, the retry rule unchanged); no separate check. Stacked in batch 22 (backend `wmt/FIX-85` `4c555c7`, mobile `9b9ade06`). Order -56 (the builder's -69 is FIX-69's; -56 is free and above FIX-70's -70, which this task depends on). Backend `wmt/FIX-85` (from `wmt/FIX-70-r2` `99b7996`, head `4c555c7`); this record and the gap rows on mobile `wmt/FIX-85` (from `wmt/FIX-70-r2` `fa206a3d`). No schema, no migration, no route, no contract change, no Fintava file touched, no app code.
- **Closes:** G-FIX-70-6. **Found by:** the FIX-70 round 3 check (the case round 3 did not probe).
- **Cause:** a bank send the Hub records as `failed` gets the owed-fee row (`<send>-fee`, `completed` money OUT, FIX-70 round 2) while the fee-back is due. If Nuvion's record of that send then turns `reversed`, `followReversal` turned the send's row `reversed`, and that row counts its total less what came back, so the sender's ledger held the fee twice until a fee-back landed (for ever when it failed twice): principal-only refund -5150 against Nuvion's -2650, whole refund -5000 against -2500. In the other order (the fee-back landed while the send was still `failed`, then the refund) `noteFeeReturned` had found a `failed` row and done nothing, so the reversed send row counted a fee the person already had back (-2650 against -150; -2500 against 0).
- **Fix (12 lines added, 2 changed, `wallet-transfer.service.ts` only):** `followReversal` now looks at the fee again as a reversed send's (`owe`, as `followLateReversal` already does) once, when it moves the send; `recordFeeOwed`, for a reversed send, turns the owed row `reversed`, whole (`noteFeeLegReturned`), instead of writing one, because the send's own row carries the fee from then on. A fee-back that lands later (or had landed) is noted on the send's row by the existing `noteFeeReturned`, which now finds a `reversed` row. The provider calls are the same idempotent ones under the same references: the retry rule (each confirmed failure one new try, never two in flight, a timeout, 5xx or unknown asks and never resends) and R-19, R-39 are unchanged. A fee is never given back twice: the references are `<send>-fee-back` and `<send>-fee-back-2` only, and the credit never carries WAWU's fee (the handler refuses a refund of more than the amount and Nuvion's charge).
- **Spec (Nuvion stand-in only, no Fintava import):** six new tests in `src/money/transfers/tests/wallet-transfer-bank-nuvion.contract.spec.ts` (17 of 17 in the file): failed, then refunded (principal only, or the whole of what Nuvion held), then the fee-back lands; the same with the fee-back failing twice; and failed, fee-back landed, then refunded (both credits). At every step the sender's ledger equals the stand-in; the fee-back goes out at most once (`-fee-back` only, no `-3`); the person ends with everything back except what Nuvion kept (its charge, on the principal-only refund). **All six are red on `99b7996`** (figures above), green on `4c555c7`.
- **Checks:** `tsc --noEmit` EXIT 0; `eslint` on the two changed files EXIT 0; the bank spec 17 of 17; the fee-back-failed, wawu-fee and failed-move specs 27 of 27 (by name; none imports the Fintava double); protected suite on its own mock WAWU ID (port 7890, fresh database) EXIT 0, 244 of 244 required; gates EXIT 0 (0 fail), baseline EXIT 0.
- **Not done:** the full backend suite (GitHub runs it on the push).
- **Lead ruling G-FIX-85-2 (new, LOW, 18 Oct 2026):** on a bank return where Nuvion keeps its payout charge (the builder's principal-only refund), the person ends short by that charge; by the ruling (a refund the person did not cause returns every naira; Nuvion's charges are WAWU's) WAWU gives it back too. Whether Nuvion keeps its charge on a return is undocumented (as G-FIX-80-5): it waits for the owner's Nuvion sandbox access, then a fix. G-FIX-85-1 (History shows the fee row reversed before the fee-back lands) is G-FIX-70-2's design default.
- **Merged (MERGE-22):** on MERGE-22 `wallet-transfer-bank-nuvion` ran 17 of 17 and the fee-back-failed, wawu-fee, failed-move and nuvion specs green.
- **Next:** the batch 22 pull request (the lead).

Status set to review by the records sync, 25 Oct 2026: merged as backend 4e0067b0, lead acceptance in this file (accepted on the lead's diff read).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-70-2, G-FIX-70-6, G-FIX-85-1

## Goal

A bank send that failed and is then reversed leaves the sender's ledger equal to the provider's balance, with WAWU's fee counted once and given back once.

## Scope (backend only)

`src/money/transfers/wallet-transfer.service.ts` and the bank spec named above.

## Capability checks

- [ ] Failed, then refunded, then the fee-back lands: the ledger equals the provider at every step and the person has every naira back but what Nuvion kept.
- [ ] The same with the fee-back failing twice: the fee is counted once while it is owed.
- [ ] Failed, the fee-back landed, then refunded: the fee is not counted as gone and no second fee-back goes out.

## Owner sign-off

Not needed.
