---
id: FEE-07
title: One WAWU fee on dollars received (1.5%, minimum USD 7), and WAWU's card fee set in the dashboard with a default
owner: YOU
area: MONEY
order: 397
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [FEE-01, FEE-02]
decisions: [R-140, R-139, R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FEE-07 · One fee on dollars received; the card fee in the dashboard

## Current state

As of 12 Nov 2026.
- **Status:** todo. Cut by the lead from R-140. The Hub is live on Nuvion since 05:34 UTC (Hub main 5f84a97a, FEE-01 merged; dashboard main 9c4af591, FEE-02 merged).
- **What exists** (lead's map of Hub main 5f84a97a):
  - Dollars received: `src/money/fees/engine/dollar-fees.ts` `classify()` sorts a USD inflow by `payment_type` into `wire` (`FX_WIRE_PAYMENT_TYPES`) or `local` (`FX_LOCAL_USD_PAYMENT_TYPES`), both empty, so today every dollar inflow is charged nothing. `onForeignInflow()` charges `intl_wire_in` always and `usd_local_in` only while plan setting `fx.product.local_usd_in.on` is 1 (default 0). Seeds (migration `20270101090000_fee_engine`): `intl_wire_in` 1.25% 3000/75000, `usd_local_in` 1.5% 700/no max. Nuvion's inflow `payment_type` is "bank-transfer" for every bank inflow.
  - Cards: `src/money/cards/card-config.ts` reads `NUVION_FEE_CARD_CREATE` (Nuvion's charge, kobo, unset means 503 `fees_not_set`) and `WAWU_FEE_CARD_KOBO` (WAWU's, default 0). Its comment says a WAWU fee above 0 is not built: that is stale. `wallet-card.service.ts` `collectFee()` already moves WAWU's fee to WAWU's account under Nuvion (`wawuFeeLeg = true`), keyed `<reference>-fee`. `quote()` returns `fee.providerFeeKobo`, `wawuFeeKobo`, `totalFeeKobo`. ProviderRate seeds `card_issuance` USD fixed 100 (Nuvion's $1).
  - Dashboard (wawu-dashboard): fee page from FEE-02, labels in `src/components/fees/feeText.ts` (`FEE_KIND_LABEL`), kinds from the Hub's generated money contract (`npm run gen:money-contract`).

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-140 (all), R-139, R-10
- tasks/FEE-01.md and tasks/history/FEE-01.md (the engine, the one-fee rule, the record), tasks/FEE-02.md
- wawu-backend: `src/money/fees/engine/` (all), `src/money/cards/`, the FEE-01 migration, `src/plan-settings/`
- wawu-dashboard: `src/components/fees/`, `src/lib/api/admin-fees.ts`, `scripts/generate-money-contract.mjs`

## Goal

Every dollar bank transfer into a person's dollar account is charged WAWU's one dollar-received fee (1.5%, minimum USD 7) from the schedule, and making a card charges WAWU's card fee from the schedule (default NGN 5,000), both changeable in the dashboard's fee page with history, and both shown before the person confirms where there is a confirm.

## Scope

- **Dollars received (Hub).** A completed USD inflow whose `payment_type` is a bank transfer ("bank-transfer" by default; `FX_LOCAL_USD_PAYMENT_TYPES` may add more) is priced by ONE kind, `usd_local_in` (already seeded 1.5%, 700, no max), always charged: `fx.product.local_usd_in.on` no longer gates the fee. `intl_wire_in` is no longer used to price anything (its rows stay; never delete a schedule row). Card inflows (`card-acq`) and inflows from another Nuvion account stay uncharged as today. Fee record, collection by book transfer, replay safety, VAT and "never refuse money arriving" exactly as FEE-01 built them.
- **Card fee (Hub).** New fee kind `card_issue` (NGN) in `FEE_KINDS` and the admin routes, seeded by an additive migration (no edit of the FEE-01 migration) at NGN 5,000 fixed: percentage 0, minimum 500000, maximum 500000. Under Nuvion, WAWU's card fee is the schedule's `card_issue` fee in force (plus VAT when `tax.vat_on`); `WAWU_FEE_CARD_KOBO` stays only for Fintava (Fintava answers byte-identical to main). The quote, the balance check (`assertCanAfford`), the card row's `wawuFeeKobo` and `collectFee()` use that figure. Each card writes a `MoneyFeeRecord` (kind `card_issue`) with WAWU's fee, VAT, Nuvion's expected charge, and its status, reversed when the card fails. Fix the stale comment in `card-config.ts`.
- **Nuvion's card charge in the quote.** If the Hub already reads a USD to NGN rate somewhere it can reuse safely, show Nuvion's `card_issuance` ProviderRate (USD 1) at that rate; if it does not, keep `NUVION_FEE_CARD_CREATE` and say so in the report. Do not build a new rate source.
- **One fee in the app.** The app shows one Fee for a card (`totalFeeKobo`) and Nuvion's own charge never appears as a separate line (FEE-01 one-fee rule). Check the app's card sheet and the dollar-received receipt need no change; if one does, report it, do not change the app.
- **Dashboard.** Regenerate the money contract from the Hub branch; the fee page lists `card_issue` as "Making a card", `usd_local_in` as "Dollars received by bank transfer", and no longer lists `intl_wire_in` for editing (its history stays readable). Pictures of the fee page, light and dark.
- **Additive only;** the protected route suite stays green; Fintava and Flutterwave paths untouched.

## Capability checks

- [ ] A USD 100 bank transfer into a dollar account is charged USD 7; USD 1,000 is charged USD 15; the person receives the amount minus it, and the record shows it.
- [ ] Making a card under Nuvion quotes WAWU's NGN 5,000 plus Nuvion's charge as one Fee and total, collects WAWU's NGN 5,000 once, and records it.
- [ ] An admin changes the card fee or the dollar-received fee in the dashboard and the next quote uses it; the old fee stays in the history.
- [ ] Fintava answers are byte-identical to main.

## Builder report

Built 12 Nov 2026. Hub `wmt/FEE-07` at 13a6a522 (on main 5f84a97a), dashboard `wmt/FEE-07` at 78e63dc (on main 9c4af59). Full round in `tasks/history/FEE-07.md`.

- **Dollars received (Hub).** `usd_local_in` prices every bank transfer into a dollar account ("bank-transfer", plus any names in `FX_LOCAL_USD_PAYMENT_TYPES`), always charged; `fx.product.local_usd_in.on` gates nothing (`productOn` is true). `FX_WIRE_PAYMENT_TYPES` is no longer read. `intl_wire_in` prices nothing and the admin route refuses a new row for it. USD 100 pays USD 7, USD 1,000 pays USD 15.
- **Card fee (Hub).** Kind `card_issue` (NGN, fixed: percent 0, min = max), seeded NGN 5,000 by migration `20270101100000_card_issue_fee` (with `rollback.sql`). Under Nuvion the quote, `assertCanAfford`, the card row's `wawuFeeKobo` and `collectFee()` use the fee in force plus VAT; each card writes a `card_issue` record (reversed on failure). Fintava keeps `WAWU_FEE_CARD_KOBO`. Stale comment fixed.
- **Nuvion's charge in the quote.** The Hub's only USD to NGN rate is `StoreUsdRateService` (store module, live quote with a 30 minute cache and a stored fallback). Not reused: it is store-scoped and a displayed charge that can drift from the charge the balance check and Nuvion apply would be unsafe. `NUVION_FEE_CARD_CREATE` stays.
- **App.** No change needed: the app reads `totalFeeKobo`. One thing seen, not changed: `GET /money/fx` still returns `localUsdIn` from the old setting (default false).
- **Dashboard.** Labels, fixed-fee editor, retired kind with no Change button. Pictures in `audits/FEE-07/`.
- **Needs the lead:** `FX_FEE_COLLECTOR_USD_BAN` must be set on the server or a dollar inflow's fee cannot be taken (the handler answers "failed", flagged for review, the credit is already written). Dashboard `check:invariants` fails on one line: the naira-only rule bans the word "dollars" and the task's required label "Dollars received by bank transfer" is in `feeText.ts:9`. A gate was not edited; the lead rules (an allow for that line).

## Verifier report

## Owner sign-off
