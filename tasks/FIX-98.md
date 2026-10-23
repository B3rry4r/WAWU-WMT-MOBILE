---
id: FIX-98
title: A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion
owner: YOU
area: MONEY
order: -98
priority: launch
repo: wawu-backend
type: money-path
status: building
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-98 · A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion

## Current state

As of 23 Oct 2026, building (a fix round): the verifier checked backend `wmt/FIX-98` `a0426ac3` (on `origin/main` `dd00e85`) and found one medium. Full reports: [history/FIX-98.md](history/FIX-98.md). Mobile record head before this commit `372b0617`.

- **Passed:** the counterparty carries the sender's state and postal code and either missing stops the send with a plain sentence (new spec 9 of 9 red on main); both stand-ins refuse the transfer with dev's 422; on Nuvion DEV a bank send through the Hub's own route on a funded wallet completed on the first try (Nuvion fee 50,000, Hub `completed`, balance down 152,500); a send Nuvion refused (dev's `limit_error` on a 100 kobo send) left every ledger row without a discrepancy, the fee collected and given back as its own pair of refund rows; tsc, eslint, 98 of 99 money and nuvion suites (the 99th, `receipt-units`, fails the same on main), `test:protected` (253), gates, baseline all EXIT 0.
- **Open, medium (the fix round):** a failed send that later turns `reversed` (FIX-85) still turns WAWU's fee row `reversed` while Nuvion shows the fee transfer `successful`, so the fee transfer's own delivery writes `webhook sighting: status reversed vs completed` and `money:check` reports it (`wallet-transfer.service.ts` `recordFeeOwed` and `recordFeeBackToSender`). Reproduced on both credit variants of the existing FIX-85 test with the book-handler deliveries added. Fix: keep that fee row `completed`, or do not flag a `reversed` fee row whose fee-back landed, and add the delivery to the FIX-85 test.
- **Low:** payee ids kept from an earlier send are reused without the state and postal code check (none exist on dev); a refused send adds a "Transfer" out and a "Refund" in of 2,500 to the person's history.
- **G-FIX-98-1 answered:** WAWU's own entity on dev has `business.email`, `address.state`, `address.postal_code` and every other field (top-level and both `addresses`); nothing stops. The only Hub path that sends from the operational account to a bank is school settlement (`school-settlement.service.ts` line 643); it would stop with `validation` if production's own entity lacked a state or postal code.
- **`money:check`:** its remaining differences are the FX inflow (the Hub credits only bank-transfer inflows, G-FIX-98-2: provider 434,420 = 586,920 inflow - 152,500, the ledger's own side) and the earlier runs' movements on the shared dev operational account.
- **Open:** CI on the merged head.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `docs/nuvion/DEV-RESULTS.md` (NUV-06 to NUV-08 rows), DECISIONS.md R-10, R-19, R-39, R-42, R-20, R-5; backend `CLAUDE.md`

## Goal

A person's bank send reaches Nuvion's transfer on a funded wallet; when Nuvion refuses a send, WAWU's fee goes back and the Hub's records say what Nuvion's say.

## Scope

`wawu-backend`: `src/nuvion/areas/payouts.ts`, `src/money/transfers/wallet-transfer.service.ts`, `src/money/check/money-check-compare.ts`, `test/nuvion/payouts-standin.ts`, `scripts/dev/nuvion-standin.cjs`, `src/nuvion/tests/nuvion-payouts-state-postal.spec.ts` (new), `src/nuvion/tests/nuvion-standin-statements.spec.ts` (one input), `src/money/transfers/tests/wallet-transfer-fee-back-failed-nuvion.contract.spec.ts` (one pinned assertion). `wawu-wmt-mobile`: this file, `docs/nuvion/DEV-RESULTS.md`, `BACKEND_GAPS.md`, `tasks/FIX-97.md`, `tasks/INDEX.md`, `docs/PROGRESS.md`, `docs/LOG.md`.

## Capability checks

- [x] The counterparty carries the sender's state and postal code; either missing stops the send before any counterparty or transfer with a sentence that names it (spec red on main, green built; dev: send ran end to end).
- [x] Both stand-ins refuse a transfer whose counterparty lacks either field, with dev's 422.
- [x] A refused send leaves the fee-collect row `completed` and the give-back as its own rows; no `ledger_discrepancy` (spec red on main, green built; dev: `money:check` has none).
- [x] `tsc`, eslint, the nuvion and money specs in band, `test:protected` (base lock), gates, baseline pass.
- [ ] A failed send that later turns `reversed` (FIX-85) leaves no `discrepancy` on the fee row once the fee transfer's own delivery arrives (the FIX-85 test with the book-handler deliveries is red before).
- [ ] The full backend run (CI) is green on the head.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-98.md](history/FIX-98.md).

