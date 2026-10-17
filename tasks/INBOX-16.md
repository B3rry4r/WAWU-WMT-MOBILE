---
id: INBOX-16
title: Buy WAWU Credits from the wallet (backend)
owner: YOU
area: INBOX
order: 102
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-17, MONEY-13, MONEY-16, WALLET-15]
decisions: [R-5, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-16 · Buy WAWU Credits from the wallet (backend)

## Current state

As of 16 Oct 2026.
- **Status:** live (backend main a5e48fc, PR #141). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-16.md`): verdict merge, nothing medium or worse. Stacked in batch 5 (backend and mobile `wmt/MERGE-5`). Mobile side is docs only.
- **What is built** (backend `src/credit-purchase/wallet/`): the payment kind `credit_pack` is registered with MONEY-17's pay from wallet (target: `starter`, `popular` or `pro`), and four new routes serve the buy sheet: `GET /credits/packs` (the server's table: `pack`, `credits`, `priceKobo`, `badge`; needs no wallet), `GET /credits/purchase/wallet/quote?pack=` (I28: 120 credits, price ₦1,000 + Fintava's ₦23.25 = ₦1,023.25 from the fee settings), `POST /credits/purchase/wallet` (PIN and `Idempotency-Key`; answers `paid`, `pending` or `failed` with `creditBalance` as a count) and `GET /credits/purchase/wallet/{id}` (what the app polls after `pending`, and I29 reads).
- **How it works:** the payment is WAWU's own sale into WAWU's account (WALLET.md: `credit_pack`, not held: no payee, so nothing is held or released; the 85/15 split is applied per spent credit against the lot, as before). When the payment is confirmed, `onCompleted` writes ONE `CreditPurchase` row (keyed by the payment's id), the balance and the cost-basis `CreditLot` in one database transaction that calls no provider; a repeat finds the row and writes nothing. Credits that cannot be written leave the payment paid and not delivered (`pending`, "we're finishing it"), nothing half-written, and the sweep delivers them once. No refund path: a pack cannot fail to grant; a delivery that cannot finish goes to delivery review with the money safe in WAWU's account (MONEY-17).
- **Unchanged:** the web's `POST /credits/purchase` and `/verify` (same pack table, now in `credit-packs.ts`), the lot, FIFO and the 85/15 split, the admin finance credits stream (wallet purchases appear with `txRef` `wallet:<payment id>`).
- **Next:** a verifier. Passes V1, V2, V3, V4, V6, V7, V8, V9. NOT RUN: a payment against the Fintava sandbox (no key on this machine; everything ran against the repo's Fintava double and the Nuvion stand-in, whose answers are the sandbox's recorded bodies); the 20-parallel latency measurement of the common rules (this task holds no transaction or connection across a provider call: the only transaction is the delivery's, three writes and no network).
- **CI on backend `f92208d`:** Branch checks run 38971168912 green (suite shards 1 to 3, contract, netns, deploy-test-in-sync), Protected routes (V3) run 38971168861 green, baseline check green; the Gates run 38971168906 is red on the same 5 FAIL lines main has (none in a file this task touched). Mobile: `npm run check` steps run locally on the docs-only branch (typecheck, lint, 3038 tests, gates, tasks) all pass.
- **Open for the lead or owner:** none. `credits-state.contract.spec.ts` logs in at `localhost:4001` (hard-coded), so it cannot run against a stack on other ports; it passes on CI.
- **Fences touched:** SHARED-CHANGES INBOX-16 #1 (schema and migration, `src/app.module.ts`, `contract/openapi.json`, two route inventories), #2 (pack table moved, not fenced), #3 (the app's contract copy, open for INBOX-13).
- **History:** the builder report is in tasks/history/INBOX-16.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

A user buys WAWU Credits from their wallet with the PIN; credits are a count, never naira (R-5). The web keeps Flutterwave until after launch.

## Scope

Credits purchase pays from the wallet (I28); credit lots and the 85/15 split unchanged; the web's Flutterwave purchase keeps working. The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A user buys 120 credits for ₦1,000: their wallet drops by ₦1,023.25 once and their credits go up by 120, shown as a count (R-5).
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-16.md](history/INBOX-16.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
