---
id: FIX-98
title: A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion
owner: YOU
area: MONEY
order: -98
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-98 · A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion

## Current state

As of 23 Oct 2026, review: the verifier re-checked backend `wmt/FIX-98` `29f3cf6` (on `a0426ac3`, `origin/main` `dd00e85`) and passed it. Full reports: [history/FIX-98.md](history/FIX-98.md).

- **Passed:** the four FIX-98 cases in `wallet-transfer-bank-nuvion.contract.spec.ts` (the two reversal-first ones fail on `a0426ac3`); the real money check on the FIX-85 end states, both orders and both credits: no finding, no discrepancy, ledger net equal to Nuvion's; the fee-leg pairing is narrow and a reversed fee row with a completed fee transfer and no give-back is still reported; a kept counterparty without state or postal code is replaced; the history names "WAWU's fee" and "WAWU's fee given back"; a live bank send through the Hub on dev completed (Nuvion fee 50,000, balance down 152,500) and a Nuvion-refused send (`limit_error`) left no discrepancy; tsc, eslint, 12 suites (317 tests), `test:protected` (253), gates, baseline all EXIT 0.
- **Open:** CI on the merged head. Notes, not findings: the stack's `nuvion-standin.cjs` `GET /counterparties/{id}` was syntax-checked only; an owed fee in the no-give-back state sits in the books and nothing asks a person to look.

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
- [x] A failed send that later turns `reversed` (FIX-85) leaves no `discrepancy` on the fee row once the fee transfer's own delivery arrives (the FIX-85 sequences with the book-handler deliveries are red before, green built).
- [x] A kept payee whose counterparty lacks a state or postal code is not used; the fee row and its give-back carry names the history can show.
- [ ] The full backend run (CI) is green on the head.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-98.md](history/FIX-98.md).


