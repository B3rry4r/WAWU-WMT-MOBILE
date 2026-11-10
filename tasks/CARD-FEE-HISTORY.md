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

As of 10 Nov 2026, built by a Sonnet builder (T2) on wawu-backend `wmt/CARD-FEE-HISTORY` `ef56ba3` (on `origin/main` `7dd5b22`). Pushed, not merged (a Hub merge deploys the live server). Status verifying, not verified.

- **Cause:** `WalletCardService.create` claimed a `WalletCard` row, the provider (Nuvion) took its fee from the account while making the card, and the row was marked active; no ledger row was ever written for the person's side. `GET /money/transactions` reads only `FintavaLedgerEntry`. WAWU's own fee leg (`collectFee`) wrote only WAWU's side (money in on the merchant wallet), also none for the person.
- **Fix (additive, no migration, no route or protected route changed):** `src/money/cards/card-fee-row.ts` (new). The issuer's fee is one `out` row on the person's wallet, reference `<card reference>-issuer`, amount the `providerFeeKobo` the card was claimed with, written inside the same `$transaction` that marks the card made (`WalletCardService.adopt`, used by create, the lost-answer lookup and the pending look-up) and by the `cards.created` delivery (`NuvionCardsHandler`, same transaction, `wait` if the ledger or the wallet row is missing). WAWU's fee, when above 0, is its own `out` row `<card reference>-wawu` (amount moved plus the provider's charge), written before the fee is marked collected, so a failed write is tried again on the next read (the provider answers a repeat of the transfer with the original).
- **Why one row per charge:** the ledger keys a row by (account, direction, reference), so a replay (the stored answer is returned), two parallel requests with one key (one claims, the other is held) and a retried adoption all land on one row. A refused or failed issue never reaches `adopt`, so it has no row and no charge.
- **Words and kind:** category `transfer`, the other side `wawu` named "WAWU's fee" (the send fee row's `FEE_ROW_NAME`), note "Card fee". The history's description reads "Transfer", as the send's fee row does. **No new row kind is needed**: the app draws it as it draws that row. A follow-up in the app is optional: show the note "Card fee" on the row so a person can tell it from a send's fee (not done, not needed for the history to add up).
- **Provider seam:** `src/money/` imports nothing from `src/fintava/`; the new file reaches the ledger only. `src/nuvion/handlers/cards.handler.ts` imports the new file, as it already imports `money/cards/card-status`.
- **USD label (finding, no change):** Nuvion's cards are USD cards funded from the naira account, converting at use (`docs/nuvion/DEV-RESULTS.md`, WALLET-31: "A USD card on a naira account", a EUR card refused with 400 `error_operation_invalid_for_state`; the stand-in answers `currency: USD`; the adapter reads the provider's `currency`, default USD). The Hub's "USD" is right. Fintava has no cards. Nothing changed.
- **Backfill (proposed, NOT RUN):** cards made before the fix have no fee row. The count query and the script outline are in `tasks/history/CARD-FEE-HISTORY.md`; it needs the owner's word and a run on a copy first.
- **Tests:** the Hub card, history and ledger specs, the protected routes (253 of 253 on main and on the branch), the stack proof and the gates are in `tasks/history/CARD-FEE-HISTORY.md`. NOT RUN: the whole `npm run test:contract` in one go (the machine's memory limit killed it, EXIT 137; folder by folder it matches main), the nightly reconcile, a real provider.
- **Verifier (T2, 10 Nov 2026): FIX.** Money path holds (history equals the provider's balance with both fees above zero, once-only on replay, parallel, webhook and reads, protected 253 of 253). One medium: the issuer row names the other side "WAWU's fee" though the provider takes it (R-10 naming: "Bank charge"). Full report in `tasks/history/CARD-FEE-HISTORY.md`.
- **Waits for:** the lead's ruling on the words (M1), a patch, a re-check, then the owner's word to merge.

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
