---
id: FEE-01
title: The fee engine: WAWU's fee schedule with history, Nuvion's rates in a locked table, VAT, a full record per transaction, and the withdrawal safety checks
owner: YOU
area: MONEY
order: 394
priority: after-launch
repo: wawu-backend
type: money-path
status: todo
depends_on: []
decisions: [R-139, R-138, R-42, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FEE-01 · The fee engine

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-139. Nuvion's go-live waits for this task, FEE-02 and FEE-03 (R-139 point 12).
- **What exists** (lead's map of Hub main 158be141): `GET /money/fees/quote` (`src/money/fees/fee-quote.service.ts`, kinds `wawu_transfer`, `bank_transfer`, `purchase`, `bill`; provider and WAWU lines, total, a signed `quoteToken` checked at pay time, `409 quote_changed`). Fee figures are env settings read at boot (`fee-config.ts`, `nuvion-fee-config.ts`, `abroad-settings.ts`, `fx-settings.ts`, `add-money-config.ts`): flat or `from:fee` bands in kobo, no percentage, no minimum or maximum, no currency, no start date, no history. `fees-set.guard.ts` answers `503 fees_not_set` while a `NUVION_FEE_*` is unset. Admins edit plan settings live (`PATCH /admin/plan-settings`, audit rows in `AdminOpsAudit`, no route reads the audit back). No VAT anywhere; no "amount kept" field; no minimum withdrawal; no fee-bigger-than-amount check on withdrawals. Gating settings: `fx.product.swap.on` (default 1), no switch for dollars received from local banks. Percentage arithmetic in BigInt (millionths, no floating point) exists on the stopped branch `wmt/NUV-FEES` 4c28ef51 (`src/money/fees/percent-fee.ts`): reuse it.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-139 (all of it), R-138, R-42, R-11, R-10 (replaced for the fees R-139 names)
- tasks/NUV-FEES.md (stopped; what it learned) and the Hub branch `wmt/NUV-FEES`
- wawu-backend: `src/money/fees/`, `src/money/fx/`, `src/money/abroad/`, `src/money/add-money/`, `src/money/limits/`, `src/nuvion/fee-legs.ts`, `src/nuvion/areas/` (where Nuvion's `applicable_fee` is read), `src/admin/plan-settings/`, `src/plan-settings/plan-setting-registry.ts`, the money check (`src/money/check/`), `prisma/schema.prisma` (WalletTransfer, FintavaLedgerEntry, WalletPayment, AddMoneySession, FxQuote, FxOperation, FxMovement, AbroadSend)

## Goal

Every fee a person pays on a Nuvion money move comes from WAWU's fee schedule (percentage, minimum, maximum, currency, start date), changeable by an admin without a release and with every change kept; Nuvion's own rates sit in a separate admin-only table; every transaction keeps the amount, WAWU's fee, Nuvion's charge, any tax and what WAWU kept; and no withdrawal goes out below the minimum or with a fee bigger than its amount.

## Scope

- **Fee schedule (additive migration, named here: `FeeSchedule`).** One row per change: kind, currency, percentage (millionths), minimum and maximum in minor units (maximum optional), start time, who changed it, a note. The fee in force for a kind is the latest row whose start time has passed; rows are never edited or deleted (the history). Kinds: `ngn_bank_withdrawal`, `usd_bank_payout`, `intl_wire_in`, `usd_local_in`, `fx_swap` (percentage on top of the provider's rate, minimum as a USD amount converted at the quote's own rate), `wallet_to_wallet`, `ngn_add_money` (pass the provider's charge through, nothing extra: a flag, not a percentage). The migration seeds the starting fees of R-139 point 2 as the first rows (start now, changed by "R-139 seed"); no amount is written in code.
- **The rule:** fee = percentage of the amount, raised to the minimum, lowered to the maximum, in whole minor units, half up. Specs: NGN 10,000 withdrawal fee NGN 100; NGN 100,000 fee NGN 400; NGN 500,000 fee NGN 700; USD 100 payout fee USD 8; USD 1,000 wire received fee USD 30; plus every edge.
- **Provider rates (additive migration, named here: `ProviderRate`).** Nuvion's rates from the owner's copy of its commercials (tasks/NUV-FEES.md table), one row per change with provider, kind, currency, percentage, minimum, maximum, fixed part, start time, who changed it. Admin-only routes (superadmin and finance); never in any app route, contract answer for the app, log line a person sees, or error message. Used to work out the expected provider charge for the record and the check. Replaces the `NUVION_FEE_*` env figures as the source of the provider's charge; `fees_not_set` now means "no fee schedule row in force for this kind".
- **Alert on a rate change.** When a provider rate row is added, or when Nuvion's actual `applicable_fee` on a transfer differs from the expected charge, the owner is emailed (the money check's recipients, `MONEY_CHECK_RECIPIENT_WAWU_IDS`), at most once a day per kind.
- **VAT.** Plan settings `tax.vat_on` (default 0) and `tax.vat_percent` (default 7.5, a setting, not code). When on, VAT is worked out on WAWU's fee and shown and saved apart from it.
- **The quote.** `GET /money/fees/quote` (additively: new kinds and new fields, the existing answer unchanged for the web's routes) returns, for every Nuvion money move, WAWU's fee, VAT, the total the person pays and the exact amount the receiver gets, in the move's currency. The pay step checks it as today (`quoteToken`).
- **The record (additive migration, named here: `MoneyFeeRecord`).** For every Nuvion transaction: its reference, kind, currency, amount, WAWU's fee, VAT, Nuvion's expected charge, Nuvion's actual charge (filled when known), what WAWU kept (fee minus Nuvion's actual charge), and the schedule and rate rows used.
- **Safety.** Plan setting `money.min_withdrawal_minor` per currency (NGN and USD lines). A withdrawal or payout below it, or whose fee is bigger than its amount, is refused before anything is sent, with a plain message.
- **Gating.** Currency swaps and dollars received from local banks stay off (R-139 point 3): `fx.product.swap.on` set to 0 by this task's migration and a new `fx.product.local_usd_in.on` default 0; the routes refuse while off.
- **Additive only:** nothing the web or the dashboard calls today changes behaviour (the protected route suite); Flutterwave and Fintava paths untouched.
- **Tests:** the five owner tests above; history (a change with a future start time applies from then, old transactions keep their row); the provider-rate table never reaches an app route (a spec scans the contract and the app routes' answers); VAT off and on; the record for each kind; refusals below the minimum and fee bigger than amount; swap and local dollar receiving refused while off; the protected suite.

## Capability checks

- [ ] A user withdrawing NGN 100,000 is shown a fee of NGN 400 and exactly what reaches the bank before confirming.
- [ ] An admin's fee change applies from its start time without a release, and the old fee stays in the history.
- [ ] Nuvion's rates are readable only by an admin, never by the app.
- [ ] Every transaction keeps the amount, WAWU's fee, Nuvion's charge, the tax and what WAWU kept.
- [ ] A withdrawal below the minimum or with a fee bigger than its amount is refused.

## Builder report

## Verifier report

## Owner sign-off
