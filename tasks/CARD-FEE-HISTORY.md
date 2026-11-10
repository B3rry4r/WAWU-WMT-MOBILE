---
id: CARD-FEE-HISTORY
title: The virtual card's fee shows in the wallet history
owner: YOU
area: WALLET
order: 374
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-124]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# CARD-FEE-HISTORY · The virtual card's fee shows in the wallet history

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from the second web walk (walker B, MEDIUM 1, in `tasks/history/WEBAPP-07.md`, "Walk 2").
- **Found:** a person who gets a virtual card is charged its fee once (₦657.72 on the stand-in; the Hub and the Nuvion balance both moved from 550,100 to 484,328 kobo), but `GET /money/transactions` has no row for it, so the history no longer adds up to the balance. This is the Hub's list, so the phone shows the same. The card also carries a "USD" label while it spends from the Naira wallet (low, to check against the card's real currency).
- **Waits for:** the owner's word to merge, as every Hub change does (a Hub merge deploys the live server).
- **Next:** a builder on wawu-backend `wmt/CARD-FEE-HISTORY`; a T2 verifier.

## Read first

- `docs/WORKFLOW.md` (V8)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/CARD-BACK.md` (how the card came back, R-124) and wawu-backend `src/money/` (the card issue and the transactions list)

## Goal

Every naira that leaves a person's wallet for a card shows in their history, with the words the other fees use, and the history adds up to the provider's balance.

## Scope

- wawu-backend: the card issue fee is written as a transaction row the list returns (additive; the protected routes unchanged).
- Nothing in the app beyond what the new row's kind needs to be drawn as the other fee rows are.

## Capability checks

- [ ] A person who gets a virtual card sees the fee in their history once, and the history's sum equals the provider's balance (V8).
- [ ] A failed or refused card issue leaves no fee row and no charge.
- [ ] Every protected route behaves as before (V3).

## Builder report

## Verifier report

## Owner sign-off
