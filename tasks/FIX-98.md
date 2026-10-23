---
id: FIX-98
title: A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion
owner: YOU
area: MONEY
order: -98
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-39]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FIX-98 · A bank send reaches Nuvion's transfer, and a refused send leaves the ledger agreeing with Nuvion

## Current state

As of 23 Oct 2026, built again, verifying (fix round 2: backend `wmt/FIX-98` `29f3cf6` on `a0426ac3`, mobile `wmt/FIX-98`). Verifier reports and the round reports: [history/FIX-98.md](history/FIX-98.md).

| Item | Before (`a0426ac3`) | After (`29f3cf6`) |
|------|---------------------|-------------------|
| Medium: FIX-85 path, the send reversed first, the fee-back after | the fee row turned `reversed`; the fee transfer's own delivery wrote "webhook sighting: status reversed vs completed" | the ledger pairs them: a `completed` sighting on the sender's fee row is not a disagreement; no row holds a discrepancy (4 specs, both credit variants and both orders) |
| Low: kept payee ids skipped the state and postal code check | a kept counterparty without them was reused and Nuvion refused every send | a kept payee is used only when its counterparty (read from Nuvion) carries both; else a complete one is made |
| Low: the history showed a bare "Transfer" and "Refund" of 2,500 | counterparty name `WAWU` on both | "WAWU's fee" (out) and "WAWU's fee given back" (in) |

- **What differs from the plain refused send:** when the send is reversed before the fee-back lands, the reversed send's own row carries the fee (FIX-85), so the fee row cannot stay `completed` without counting the fee twice until the fee-back lands (the specs hold the sender's ledger equal to Nuvion at every step). That fee row is turned `reversed` as before and Nuvion's `successful` fee transfer is paired with it. When the fee-back lands first, the fee row stays `completed` and the give-back is its own refund pair, as on the plain path.
- **Specs, red on `a0426ac3`, green built:** `wallet-transfer-bank-nuvion.contract.spec.ts` (4 new FIX-98 cases; 2 fail before, the order with the fee-back first passes on both), `nuvion-payouts-state-postal.spec.ts` (the kept-payee case), `wallet-transfer-fee-back-failed-nuvion.contract.spec.ts` (the naming assertions): 4 fail on `a0426ac3` in all.
- **Checks:** tsc, eslint, 14 nuvion and money suites (322 tests) in band, `test:protected` (253 tests), gates, baseline: all EXIT 0. The stack's `nuvion-standin.cjs` gained `GET /counterparties/{id}` (syntax checked, not walked).
- **Not run:** the stack walk of the changed stand-in; a dev re-run (the paths changed here are ledger and kept-payee paths the dev run did not reach). Open: CI on the head.

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

