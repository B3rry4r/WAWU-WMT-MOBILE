---
id: LEGAL-05
title: Pay legal fees from the wallet (backend)
owner: YOU
area: LEGAL
order: 112
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [MONEY-17, MONEY-13, MONEY-16, WALLET-15, WALLET-16, LEGAL-03]
decisions: [R-10, R-14]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# LEGAL-05 · Pay legal fees from the wallet (backend)

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (lows only) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/B1.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main.
- **Branches:** backend `wmt/B1` `e41210e` (on `origin/wmt/MERGE-7` `432f017`, with backend `wmt/WALLET-16` `315b69b` merged), mobile `wmt/B1` (records and the contract copy; docs only). No migration.
- **Round 2 (bundle B3a, 17 Oct 2026):** a fee that cannot be applied now returns EVERY naira, the payment's charge included (lead ruling, as Q-03 and EVENTS-10); WAWU bears the refund transfer's own charge. Backend backend `wmt/B3a` `242ce9d` (carries `wmt/B1` `e41210e`); the shared `deliver-or-refund.ts` carries it. The spec's refund assertion was updated to the ruling.
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-12`, not on main).
- **What is built:** `src/legal/wallet/`: the kind `legal_fee` registered with MONEY-17 (WAWU's own sale: no payee, nothing held) and three routes: `GET /legal/requests/{id}/pay/wallet/quote`, `POST /legal/requests/{id}/pay/wallet` (PIN, `Idempotency-Key`) and `GET /legal/requests/{id}/pay/wallet/{paymentId}`. The fee due is the consultation fee recorded on the request when the hour was booked (LEGAL-03, R-14; the hold on the hour must still be good, or `target_not_payable`), else the quoted fee once the engagement letter is signed (this covers the business name registration, S26). The quote is bound to the stage and the fee as `terms`: a request re-booked or re-quoted since is `409 quote_changed` and charges nothing. Paying marks the stage paid with one conditional write and records `wallet:<payment id>` as `consultationTxRef` or `serviceTxRef`; the request moves to `consultation_scheduled` or `in_progress`. A fee that cannot be applied (cancelled while the debit confirmed, the hour given up, paid another way) is paid back: the price and the charge return (B3a round 2).
- **Attacks (Nuvion stand-in, the ledger equals the stand-in after each):** 10 tests in `legal-fee-wallet.contract.spec.ts`: both stages with exact figures, the changed-fee quote, double submit, twice in parallel (one key; two keys while pending), wrong PIN (403), short balance (402), a lost provider answer then a retry and the sweep, a refund after the matter is cancelled, and the refusals (another person's, unknown, cancelled, lapsed hold, unsigned letter, someone else's payment unreadable).
- **Fences touched:** SHARED-CHANGES LEGAL-05 #1 to #3 (`src/app.module.ts` mounts the module, `contract/openapi.json`, the route inventories in `wallet-gate-coverage.spec.ts` and `money-moving-coverage.spec.ts`; entries added, nothing weakened).
- **NOT RUN:** any call to Fintava or its sandbox (never used); the 20-parallel latency measurement (the only transaction in the delivery is database-only; no provider call is made inside one); the app (backend task).
- **Open for the lead:** the web's Flutterwave legal routes are unchanged, but a request paid from the wallet leaves `consultationTxRef`/`serviceTxRef` as `wallet:<id>`; `verifyConsultationPayment` on such a request returns early (already paid). Ops' `cancel` still does not refund (its own note); a wallet payment confirmed AFTER the cancel is refunded by this task, one confirmed BEFORE it is not (the existing manual-refund rule).
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-MONEY (B1 F4, F5).
- **Records:** tasks/history/LEGAL-05.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend e3d2a468, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

Consultation and service fees are paid from the wallet with the PIN, at the prices WAWU sets in admin (R-14). The web keeps Flutterwave until after launch.

## Scope

Consultation and service fees, and business-name registration, pay from the wallet (S19, S22, S26) at the prices WAWU sets in admin (R-14). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] The price charged equals the price set in admin at the time of the quote (R-14), plus Fintava's charge from the fee quote.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/LEGAL-05.md](history/LEGAL-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
