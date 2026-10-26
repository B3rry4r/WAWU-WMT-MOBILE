---
id: PAY-FX
title: Convert at payment: a buyer in another currency pays a naira price from their own account (R-91)
owner: YOU
area: WALLET
order: -139
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [WALLET-41]
decisions: [R-91, R-64, R-87, R-83, R-84, R-10, R-19, R-39, R-47, R-20]
passes: [V1, V4, V5, V6, V8, V9]
artboards: []
tier: T3
---
# PAY-FX · Convert at payment

## Current state

As of 26 Oct 2026, built by a Sonnet builder (T3). Backend `wmt/PAY-FX` `fc261a7` and mobile `wmt/PAY-FX` (this branch). The Hub side is done and proven on Nuvion DEV; the pay sheet can draw the new payment; the screens that open the sheet are NOT wired to it yet (see Not done).

| # | Before | After |
|---|---|---|
| 1 | `src/money/payments/wallet-payment.service.ts` took only the naira wallet; a person outside Nigeria (R-87) had no naira account and every wallet payment answered `409 wallet_not_open` | `GET /money/payments/quote` and `POST /money/payments` take an optional `sourceCurrency`. Absent or `NGN` is byte for byte as before. With it: a firm Nuvion FX quote for the exact naira price (`amount_to`), the amount in the buyer's currency with its fees and Nuvion's real expiry in `source`, the payment carries the quote (`quoteToken` is `fx.<id>`), and the naira lands in WAWU's account. Delivery, the payee's 85/15, the held kinds, the earnings move and deliver-or-refund are unchanged |
| 2 | a refund went to the payer's naira wallet | a payment from another currency is refunded to the same account, in that currency, the same amount taken, by a reverse conversion from WAWU's operational account (`quoteFromMerchant`, `swapFromMerchant`, found again by reference). WAWU bears the difference |
| 3 | the pay sheet drew a naira total only | `PaySheet` takes an optional `source` (account, firm amount, fees from the quote, expiry, the other accounts to use, "Get a new rate" when the quote ran out). No currency list, rate or fee is in the app |

Facts (Nuvion DEV, 26 Oct 2026, `docs/nuvion/DEV-RESULTS.md` "PAY-FX"): a USD buyer with no naira account paid a naira price of 30,000 kobo for 23 cents; WAWU's naira account received exactly 30,000 kobo; Nuvion's fee is 0; a ticket paid in dollars was refunded to the same cents, and the reverse conversion cost WAWU 31,040 kobo for the 30,000 it took in (the spread and the cent rounding).

Migration `20261205120000_pay_fx`: one nullable column and one new table, rollback in its header. Fees: `PAYMENT_FX_FEE_<CODE>_MINOR` (WAWU's conversion fee, default 0, Default (lead), owner may override) and `PAYMENT_FX_PROVIDER_FEE_<CODE>_MINOR` (shown and counted, default 0, Nuvion names none on dev).

- **Not done:** (1) The callers of the pay sheet (unlock, tips, paid ask, event tickets, school and legal fees, chat paid DM, community pass) do not yet fetch the person's other accounts, ask for a quote with `sourceCurrency`, pass `source` or send `sourceCurrency` with the payment; they still pay in naira. One follow-up task per caller or a shared hook. (2) Pictures of the sheet at 390 px (naira buyer, USD buyer, quote expired) were not made; the sheet is covered by 6 jest tests. (3) The community pass's prorated refund (R-71) still waits for a naira wallet for a buyer who paid in another currency. (4) A GBP or EUR buyer, a pending or failed FX transfer and WAWU's conversion fee above 0 were not run on dev (specs cover the pending, failed and lost cases on a stand-in).
- **Next:** a verifier checks the Hub side on dev and the sheet.
- **History:** reports go to tasks/history/PAY-FX.md.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md`: R-91, R-64, R-87, R-10, R-19
- Backend `src/money/payments/payment-fx.service.ts`, `src/money/payments/wallet-payment.service.ts` (`quoteForeign`, `payForeign`, `settleForeign`), `src/money/holds/wallet-hold.service.ts` (`sendForeignRefund`), `src/nuvion/areas/fx.ts`; app `src/components/pay-sheet/PaySheet.tsx`

## Goal

A person in the US finds Nigerian content they want to buy. The price stays one naira price. They see it in dollars and pay from their own dollar account; WAWU converts at Nuvion's rate at that moment; the creator is paid naira exactly as today. A refund goes back to the dollar account.

## Scope

Backend: `src/money/payments/**`, `src/money/holds/wallet-hold.service.ts`, `src/money/fx/fx-settings.ts`, `src/nuvion/areas/fx.ts`, `src/wallet-provider/wallet-provider-fx.ts`, `src/money/dto`, `src/money/money-view.type.ts`, the migration, `docs/contract/WALLET.md`, `contract/openapi.json`. App: `src/components/pay-sheet/**`, the generated API types. Nothing Fintava; nothing the web calls changes behaviour.

## Capability checks

- [x] A payment that names no `sourceCurrency` is the naira payment as before (the existing payments, holds, tips and unlock specs pass unchanged).
- [x] A buyer with no naira account pays a naira price from a dollar account: the firm amount is shown, the account is debited exactly that, WAWU's naira account receives exactly the price, the payee's share is the same 85/15.
- [x] A used or expired quote is `409 quote_changed` with a fresh quote; an account with less than the firm amount is `402 insufficient_funds` and nothing moves.
- [x] A transfer Nuvion has not finished is pending until Nuvion says, never sent twice; a failed one is a failed payment.
- [x] A held ticket paid in dollars is refunded to the dollar account, the same amount, once.
- [x] On Nuvion DEV through the Hub's own routes: 9 of 9 (`scripts/nuvion/pay-fx-dev-check.ts`).
- [x] The pay sheet draws the source: the naira price, the account, the firm amount, fees only when the quote has them, the expired state, the other accounts to use; a sheet without a source is unchanged.
- [ ] The screens that open the pay sheet pass it a source and send `sourceCurrency`: NOT DONE.
- [ ] Pictures at 390 px, dark and light: NOT DONE.
- [ ] On a phone: NOT RUN (no device in this session).

## Builder report

Sonnet builder (T3, 26 Oct 2026). Backend `wmt/PAY-FX` `fc261a7` from `origin/main` `c8eba66`; mobile `wmt/PAY-FX` from `origin/main` `904da284`. Checks (EXIT 0 unless said): backend tsc; eslint on changed files; contract:build; gates (0 fail) and check_baseline; specs `payment-fx.contract` 13, `nuvion-fx-merchant` 2, and the payments, fx, world, holds, tip, unlock, money-contract and gate-coverage specs that do not import the Fintava double (21 suites, 309 tests); the dev proof 9 of 9. Mobile: tsc; eslint on `src/components/pay-sheet`; jest on the pay sheet, wallet, unlock, tips, send, schools, events and chat features (88 suites, 1,378 tests). No native module was added.
