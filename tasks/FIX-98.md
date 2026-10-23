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

As of 23 Oct 2026, built, verifying (backend `wmt/FIX-98` `a0426ac` on `origin/main` `dd00e85`). The two defects the funded dev run found in bank sends on Nuvion, both fixed and run on Nuvion DEV through the Hub.

| Fix | Before | After |
|-----|--------|-------|
| High: the counterparty's address had no state or postal code | `POST /transfers` 422 "counterparty.address.state ... counterparty.address.postal_code ... required" (01M5MJABG4WBBV51HMQC8YZ52C) | the counterparty carries `state_or_province` and `postal_code` from the sender's entity; a Hub send on a funded wallet ran end to end (201 pending, Nuvion transfer 01M5MN3SMJ7VF7CG16E8A6HK2G `successful`, fee 50,000, Hub `completed`) |
| Medium: the fee-collect row turned `reversed` | `money:check` `differences` (ledger_discrepancy, row dd9b8c36) after every refused send | the collect stays `completed`; the give-back is its own pair of rows; a refused send leaves 4 rows, all completed, no discrepancy, `money:check` has no `ledger_discrepancy` |

- Specs, each red on `origin/main` and green built: `nuvion-payouts-state-postal.spec.ts` (8 of 9 fail on main), `wallet-transfer-fee-back-failed-nuvion.contract.spec.ts` (the two FIX-98 tests fail on main).
- Not changed: the opening form and rules. The finding on who can lack a state or postal code is G-FIX-98-1; the naira inflow by book transfer with no ledger row is G-FIX-98-2.
- Left for the verifier: CI on the head; a failed send that later turns reversed (FIX-85) keeps its fee row turned `reversed` when the fee-back lands after the reversal, which can still write the same discrepancy when that fee transfer's delivery arrives after it.

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
- [ ] The full backend run (CI) is green on the head.

## Builder report

Files: as in Scope. Fix 1: `readSenderContact` reads `address.state` and `address.postal_code`, `missing` names what is not there; `createCounterparty` sends `state_or_province` and `postal_code`; a kept counterparty without them is not adopted. Fix 2: `recordFeeBackToSender` writes the sender's `in` refund row under the give-back's reference (as a hold's refund is written); the fee row is no longer turned `reversed` by a landed fee-back; `money-check-compare` claims the sender's fee row by the leg line's own reference. One assertion changed: the fee-back spec's "turns reversed only then" (it pinned the defect). Checks: tsc EXIT 0; eslint EXIT 0; 14 nuvion and money suites, 316 tests, in band EXIT 0; `test:protected` 2 suites, 253 tests EXIT 0; gates 0 fail; baseline EXIT 0. Dev: see DEV-RESULTS NUV-06 to NUV-08.
