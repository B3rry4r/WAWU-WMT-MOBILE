---
id: HOME-14
title: Pay tips from the wallet (backend)
owner: YOU
area: HOME
order: 114
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-13, MONEY-16, WALLET-15, WALLET-16]
decisions: [R-5, R-10, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# HOME-14 · Pay tips from the wallet (backend)

## Current state

As of 17 Oct 2026, built (bundle B1, Sonnet builder), waiting for a verifier.
- **Status:** verifying.
- **Branches:** backend `wmt/B1` `e41210e` (on `origin/wmt/MERGE-7` `432f017`, with backend `wmt/WALLET-16` `315b69b` merged), mobile `wmt/B1` (records and the contract copy; docs only). No migration.
- **Round 2 (bundle B3a, 17 Oct 2026):** a tip that cannot be delivered now returns EVERY naira, the payment's charge included (the payer did not cause it; lead ruling, as Q-03 and EVENTS-10); WAWU bears the refund transfer's own charge. Backend backend `wmt/B3a` `242ce9d` (carries `wmt/B1` `e41210e`); the shared `deliver-or-refund.ts` carries it (tips, unlocks, legal fees). The spec's refund assertion was updated to the ruling.
- **Merged and live:** nothing of this task.
- **What is built:** `src/purchase/wallet/`: the kind `tip` registered with MONEY-17 and three routes: `GET /tips/wallet/quote?creatorWawuId=&amountKobo=` (H26), `POST /tips/wallet` (PIN, `Idempotency-Key`, optional note) and `GET /tips/wallet/{id}`. The amount is the payer's, a whole number of naira from 1 to 10,000,000 (`amount_out_of_range`); not oneself, not a blocked account. Delivery writes the web's own `Purchase` row of type `tip` once per payment (`wallet:<payment id>`), so earnings, admin streams and the notification read it. A tip of 2,000 naira costs 200,000 kobo plus the provider's charge; the creator's 170,000 lands by the WALLET-16 sweep, WAWU keeps 30,000. A tip that cannot be delivered (creator gone or blocked since) is paid back through MONEY-18's refund: the price and the charge return (B3a round 2). Shared helper `deliver-or-refund.ts` (one short transaction under the payment's row lock excludes grant and refund).
- **Attacks (Nuvion stand-in, the ledger equals the stand-in after each):** 8 tests in `tip-wallet.contract.spec.ts`: the happy path with exact figures, double submit (one key twice, `Idempotent-Replayed`), twice in parallel (one key, and two keys while the provider is pending: one `payment_in_progress`), wrong PIN (403 `pin_incorrect`, then the right PIN pays once), short balance (402 with the shortfall), a lost provider answer then a retry with the same key and the sweep (one transfer, one tip), a refund (price and charge back, no earning), and the refusals (self, stranger, blocked, not whole naira).
- **Fences touched:** SHARED-CHANGES HOME-14 #1 to #3 (`src/app.module.ts` mounts the module, `contract/openapi.json`, the route inventories in `wallet-gate-coverage.spec.ts` and `money-moving-coverage.spec.ts`; entries added, nothing weakened).
- **NOT RUN:** any call to Fintava or its sandbox (never used); the 20-parallel latency measurement (the only transaction in the delivery is database-only; no provider call is made inside one); the app (backend task).
- **Open for the lead:** the web's `/me/earnings` now sees wallet tips (G-704 for tips); a refunded tip leaves a hold row that appears in the payer's holds list as `tip_delivered` (same as TIER-03's refund).
- **Next:** a verifier; passes V1, V2, V3, V4, V6, V7, V8, V9.
- **Records:** tasks/history/HOME-14.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

A tip is paid from the buyer's wallet with the PIN, and the creator's 85% lands in their wallet (R-11). The web keeps Flutterwave until after launch.

## Scope

Tips pay from the wallet (H26-H28) with an optional note, and land in the creator's wallet. The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A user tips ₦2,000: their wallet drops by ₦2,023.25 once; the creator's wallet rises by ₦1,700 and WAWU keeps ₦300 (85/15, R-5).
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-14.md](history/HOME-14.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
