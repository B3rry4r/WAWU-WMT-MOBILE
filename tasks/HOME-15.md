---
id: HOME-15
title: Pay for unlocks from the wallet (backend)
owner: YOU
area: HOME
order: 123
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [MONEY-17, MONEY-19, MONEY-13, MONEY-16, WALLET-15, WALLET-16]
decisions: [R-5, R-10, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# HOME-15 · Pay for unlocks from the wallet (backend)

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 12.
- **Status:** merging (lead). Verdict: merge (lows only) (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/B1.md`). Stacked in batch 12 by MERGE-12 (backend `wmt/MERGE-12`, mobile `wmt/MERGE-12`); not on main.
- **Branches:** backend `wmt/B1` `e41210e` (on `origin/wmt/MERGE-7` `432f017`, with backend `wmt/WALLET-16` `315b69b` merged), mobile `wmt/B1` (records and the contract copy; docs only). No migration.
- **Round 2 (bundle B3a, 17 Oct 2026):** an unlock that cannot be granted now returns EVERY naira, the payment's charge included (lead ruling, as Q-03 and EVENTS-10); WAWU bears the refund transfer's own charge. Backend backend `wmt/B3a` `242ce9d` (carries `wmt/B1` `e41210e`); the shared `deliver-or-refund.ts` carries it. The refund test now also checks the one refund transfer (price plus charge) and that WAWU's own account agrees with the ledger.
- **Merged and live:** nothing of this task (it is in `wmt/MERGE-12`, not on main).
- **What is built:** `src/content-piece/wallet/`: the kind `content_unlock` registered with MONEY-17 and three routes: `GET /content/{id}/unlock/wallet/quote` (H14), `POST /content/{id}/unlock/wallet` (PIN, `Idempotency-Key`) and `GET /content/{id}/unlock/wallet/{paymentId}`. The price is the piece's own (server record). A free piece, your own, one gone or removed, one from a blocked account, and one you already own are refused before any money moves. Access is the web's own `Purchase` row of type `content`, written once per payment (`wallet:<payment id>`) with the "you sold something" notification; `fullAssetUrl` comes back once paid. A 2,500 naira piece costs 250,000 kobo plus the provider's charge; the creator's 212,500 lands by the WALLET-16 sweep. Debited but not granted fixes itself: the payment sweep grants it. A payment that cannot be granted (the piece removed since, or already owned by another payment) is paid back: the price and the charge return (B3a round 2), no earning.
- **Attacks (Nuvion stand-in, the ledger equals the stand-in after each):** 8 tests in `unlock-wallet.contract.spec.ts`: the happy path with exact figures and the creator's landing, double submit, twice in parallel (one key; two keys while pending), wrong PIN (403), short balance (402), a lost provider answer then a retry and the sweep (one transfer, one grant), a refund after the piece is removed (hold refunded, balance fully restored, one transfer of price plus charge, WAWU's account agrees with the ledger, no access, no earning), and the refusals (free, own, gone, unknown, another person's purchase unreadable).
- **Fences touched:** SHARED-CHANGES HOME-15 #1 to #3 (`src/app.module.ts` mounts the module, `contract/openapi.json`, the route inventories in `wallet-gate-coverage.spec.ts` and `money-moving-coverage.spec.ts`; entries added, nothing weakened).
- **NOT RUN:** any call to Fintava or its sandbox (never used); the 20-parallel latency measurement (the only transaction in the delivery is database-only; no provider call is made inside one); the app (backend task).
- **Open for the lead:** none beyond the fences.
- **Next:** the batch 12 pull request (the lead). The verifier's lows are in SWEEP-MONEY (B1 F4).
- **Records:** tasks/history/HOME-15.md.

Status set to review by the records sync, 25 Oct 2026: merged as backend e3d2a468, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

A piece is unlocked from the buyer's wallet with the PIN, and the creator's 85% lands in their wallet (R-11). The web keeps Flutterwave until after launch.

## Scope

Unlock pays from the wallet (H14-H18); access is granted once the debit settles; a debited-but-not-granted state fixes itself. The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A user unlocking a ₦2,500 piece is debited ₦2,523.25 once and gets access; if access fails after the debit, the sweep grants it or refunds the price.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HOME-15.md](history/HOME-15.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
