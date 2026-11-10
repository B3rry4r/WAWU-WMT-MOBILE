---
id: CARD-FEE-HISTORY
title: The virtual card's fee shows in the wallet history
owner: YOU
area: WALLET
order: 374
priority: after-launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-124]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# CARD-FEE-HISTORY · The virtual card's fee shows in the wallet history

## Current state

As of 10 Nov 2026. Hub `wmt/CARD-FEE-HISTORY` `6cb7775` (fix round 1 on `ef56ba3`, on `origin/main` `7dd5b22`), mobile branch merged with the verifier's `c4d3897`. Pushed, not merged (a Hub merge deploys the live server). Status verifying, round 1 built.

- **What it does:** the card's fee is out rows on the person's wallet, written with the debit: the issuer's fee `<card ref>-issuer` inside the transaction that marks the card made (create, the lost-answer lookup, the pending look-up, the `cards.created` delivery), WAWU's fee `<card ref>-wawu` (moved plus the provider's charge) when its transfer is confirmed. No migration, no route changed, no app change.
- **Words (M1, R-53):** the issuer row's other side reads "Bank charge", WAWU's reads "WAWU's fee", note "Card fee" on both, category `transfer`. The app (`src/features/wallet/history/model.ts`) titles a row with the counterparty name and puts the Hub's description ("Transfer") under it, so the list reads "Bank charge" and "WAWU's fee" as drawn; the note shows only as the receipt's "Note" line. No app change is needed; showing the note under the title would be an optional follow-up.
- **L2:** a card given up (`failed`, the give-up words) and made late by the provider is adopted by its `cards.created` with its row once; a refused card (any other failure) is not. A ledger failure in create step 3 no longer leaves the key open: the person sees 201 "being confirmed" (the lost-reply answer), a replay is the same answer, and the next read after 20 seconds looks the card up by its reference and adopts it with its row once.
- **L3:** WAWU's transfer is keyed `<card ref>-fee` at the provider, which answers a repeat with the original, so no ask debits twice. Asks after a failure are bounded: 5 per card per process, 30 seconds apart, then an error log and no more until a restart.
- **L4:** `cards.created` for an owner with no wallet row waits 7 times (the delivery rests at least a minute between), then answers `failed` with a log line; the row is left as it was and the lookup by reference adopts it, with its row, once the owner has a wallet.
- **L1 for the owner (via the lead):** the row amount is the configured fee, not a figure read from the provider. When the live keys go in, `NUVION_FEE_CARD_CREATE` must equal Nuvion's real card fee (dev measured 65,772 kobo) and change only when Nuvion changes it; `WAWU_FEE_CARD_KOBO` is WAWU's own fee on top (0 now). The nightly `npm run money:check` is the only catch for a mismatch.
- **USD label:** correct, no change (Nuvion's cards are USD cards funded from the naira account).
- **Backfill (NOT RUN):** count query and script outline in `tasks/history/CARD-FEE-HISTORY.md` (the `-wawu` row at the amount moved plus the provider's charge, as live). Needs the owner's word and a copy first.
- **NOT RUN:** the whole `npm run test:contract` in one go (memory limit, EXIT 137), the nightly reconcile, a real provider.

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

- [x] A person who gets a virtual card sees the fee in their history once, and the history's sum equals the provider's balance (V8).
- [x] A failed or refused card issue leaves no fee row and no charge.
- [x] Every protected route behaves as before (V3): the protected suite is 253 of 253 on main and on the branch (`tasks/history/CARD-FEE-HISTORY.md`).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/CARD-FEE-HISTORY.md](history/CARD-FEE-HISTORY.md).

## Owner sign-off
