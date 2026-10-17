---
id: FIX-54
title: A bank send on Nuvion shows its true outcome
owner: YOU
area: MONEY
order: 132
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-10, R-19, R-39, R-42]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# FIX-54 · A bank send on Nuvion shows its true outcome

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder; the lead assigns the verifier. Backend branch `wmt/FIX-54` from `origin/wmt/FIX-52` `773a9ee`; mobile branch `wmt/FIX-54` from `origin/wmt/MERGE-9` `72bc8d6c` holds this file only. No migration, no contract change, no app change.
- **Found by:** WA's check (F1 HIGH, `scratchpad/verify/WA.md`). The Hub marked a bank send `completed` about 49 ms after the request, on Nuvion's acceptance, while the transfer was pending. Nuvion then failing it dropped the `outflows.failed` delivery; the receipt said Completed. After `outflows.refunded`, history said Reversed but `GET /money/transfers/{id}` stayed `completed` with `reversal` null.
- **Built:** a bank send on Nuvion stays `pending` after Nuvion accepts it (the payouts area marks the receipt `pending`; `ProviderTransferReceipt.pending` is new and optional) and finishes from Nuvion's delivery or the sweep's read of the transfer. `outflows.failed` settles it `failed` at once with the money back and WAWU's fee returned (as FIX-52 does); the person reads "The bank did not complete this transfer. The money is back in your wallet." `outflows.refunded` after completion settles it `reversed` (every send of the running provider, not only one with a fee leg) and writes the credit record's figures on the ledger row once, so `GET` shows `reversal` (returned and kept). The stand-in (`scripts/dev/nuvion-standin.cjs`) now sends a bank reversal as the docs define it: a credit record (`type: inflow`, `meta.source_payment_id`), not the send itself.
- **Judgement calls for the verifier:** (1) a reversal credit of the amount, or of the amount with Nuvion's charge, is a full reversal; the docs do not say whether the charge goes back, so `returned` is whatever the credit states. (2) `settle` treats any `failed` sender row except the "no record" inference as the provider's word (Fintava's reason and Nuvion's bank reason). (3) Only `kind: bank_account` sends take the new failure text.
- **Open findings:** none known. **Not run:** the Fintava specs (rule), a stack drive through the app, GitHub CI beyond the run ids in the builder report.
- **Next:** a fresh verifier: stack with the Hub on the stand-in, one bank send failed right after the answer, one completed then reversed, both read from `GET /money/transfers/{id}` and the history; the lead merges after.
- **History:** [history/FIX-54.md](history/FIX-54.md).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- FIX-52 (WAWU's fee moves first and goes back when a send does not stand; its task file is on its own branch, `wmt/FIX-52`)

## Goal

A bank send on Nuvion is `completed` only when Nuvion says so. Until then it is `pending`. A send Nuvion fails is `failed` with the money back in the ledger and WAWU's fee returned; a completed send Nuvion reverses is `reversed` and `GET /money/transfers/{id}` shows the reversal. A replay or an out-of-order delivery changes nothing twice. The ledger equals the provider on every path.

## Scope

Backend: `src/nuvion/areas/payouts.ts`, `src/nuvion/handlers/outflows-bank.ts` (provider quirks stay in `src/nuvion/`, R-39), `src/money/transfers/wallet-transfer.service.ts`, `src/money/ledger/ledger.service.ts` (one constant, one method), `src/wallet-provider/wallet-provider.interface.ts` (one optional field), `scripts/dev/nuvion-standin.cjs`, and the new spec `src/money/transfers/tests/wallet-transfer-bank-nuvion.contract.spec.ts`. No fenced file, gate or baseline.

## Capability checks

- [ ] A bank send answers `pending` and stays so until Nuvion completes it; the person is debited the quote once and WAWU's fee moves once.
- [ ] A send Nuvion fails after accepting it is `failed`, the ledger row `failed`, the wallet whole again, WAWU's fee back once however often it is told or swept.
- [ ] A completed send Nuvion refunds is `reversed`; `GET /money/transfers/{id}` shows `reversal`; a replay changes nothing.
- [ ] Duplicated and reordered deliveries, and a lost answer followed by a status poll, end in one transfer and one outcome.
- [ ] The stand-in's bank reversal is a credit record naming the send.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-54.md](history/FIX-54.md).

## Owner sign-off
