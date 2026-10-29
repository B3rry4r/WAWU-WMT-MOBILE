---
id: BILLS-09
title: A prepaid bill's token and units, where a bill stands, and the checkout gate
owner: YOU
area: BILLS
order: 359
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: [BILLS-02]
decisions: [R-102, R-1, R-27, R-29, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: [S7]
tier: T2
---
# BILLS-09 · A prepaid bill's token and units, where a bill stands, and the checkout gate

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T2). Backend `wmt/BILLS-09` `d26c9e9` on `origin/main` `e7e3523`; mobile on `wmt/BILLS-02` (one more commit on `4e80b19a`, the branch of BILLS-02, BILLS-03 and BILLS-08). No native change, `package.json` untouched, Android fingerprint unchanged (`17ffb13d`). Status verifying. Closes gap G-BILLS-TOKEN.

| # | Before | After |
|---|---|---|
| 1 | the Hub kept no token or units for a bill, so S7 had no "Your token" card | `BillPayment.token`, `units` (nullable text) and `providerCheckedAt`; migration `20261220090000_bill_token_units`, rollback refuses while any bill holds a token or units (tried: refused with a token, dropped without one) |
| 2 | nothing read a token out of Flutterwave's answers | read from the purchase answer (`data.recharge_token`) and the bill status answer (`data.token`, `data.extra`), cleaned to a short plain string, the first one kept; the sweep, an operator's reconcile and the new status read all keep them; never logged, never in the operators' lists |
| 3 | `verify` and `mine` answered 13 keys | the same 13 plus `token` and `units` (string or null, always present); protected suite 253 of 253 after a relock of exactly those two shapes |
| 4 | no way to read one bill's state | `GET /bills/{id}/status` (signed in, own bills, 404 for another person's, UUID id): `id`, `status`, `token`, `units`, `providerReference`. A `processing` bill whose last provider check is over 20 seconds old is asked about once and settled the way the sweep settles it; never calls the biller; no clash with any other `/bills/*` route (checked from the contract, `/bills/wallet/status` answers the same 400) |
| 5 | readers of one bill could settle it twice | the right to ask is one conditional write on `providerCheckedAt` (5 readers at once: 1 provider call), and the settling write (the sweep's and reconcile's too) is conditional on the status that was read, so a bill an operator refunded meanwhile is never written over |
| 6 | S7 read the list every 15 s while in flight and drew no token | S7 draws the token card as the board draws it (Your token, the token in fours, Copy token, the units line "45.2 kWh") when the Hub gives them; while `processing` it reads the status at once and every 10 s for up to 3 minutes (18 to 19 reads), then keeps "Payment received, on its way" with Done; a delivered answer draws "paid" and the card, a failed one is S12; an unanswered read draws nothing |
| 7 | the R-1 gate banned the word in `checkoutPage.ts`, so `CHECKOUT_ORIGIN` was written in two pieces | lead ruling: the R-1 rule gets `allow_paths` for `src/features/bills/checkoutPage.ts` only, citing R-102; `CHECKOUT_ORIGIN` is one plain string; the word is still banned in every other file |

### Default (lead), owner may override
- Copy token puts the token on the phone as drawn (the digits in fours); what is shown is what is copied.
- Share receipt is unchanged: it does not carry the token (the board's share is the receipt's text and reference).
- S7 draws the token card whenever the Hub gives a token, also while the bill still reads "on its way", never on a failed or refunded bill.
- `paid` and `pending` bills keep the old 15 s read of the list; only `processing` has the status read.

### Gap rows
- **G-BILLS-UNITS** (S7). Flutterwave's pages name a field for the token (`recharge_token`, `token`, `extra`) and none for units; units are read from `units` or a labelled number in `extra`, else `null` and S7 draws no units line (BACKEND_GAPS.md). Confirmed only by the first real prepaid bill.
- G-BILLS-TOKEN is closed (removed from BACKEND_GAPS.md and from BILLS-02).

### Not run
- A real Flutterwave answer (no live host or key by rule): the readers are tested against the documented shapes and labelled stand-ins for `extra`.
- Pictures of S7 (390 px, light and dark) beside the board: no device or web export in this build; the card follows `design/_gen/services.js` `token` (card 16 all round, label 12.5, token 22 bold 0.06em, Copy pill 32 high, units 12.5).
- On a phone: NOT RUN.

## Read first

- `DECISIONS.md` R-102, `tasks/BILLS-02.md`, `BACKEND_GAPS.md` (G-BILLS-TOKEN, G-BILLS-UNITS)
- Backend `src/bill-payment/` (`bill-payment.service.ts`, `bill-delivery.ts`), `src/payment-webhook/`
- Flutterwave v3 Bills, "Create a bill payment" (`recharge_token`) and "Get status of a bill payment" (`token`, `extra`), developer.flutterwave.com

## Goal

An electricity bill's token reaches the person who paid for it, in the app, once the provider has it.

## Scope

Backend `wawu-backend`: `src/bill-payment/`, one migration, the contract, two shapes of the protected registry. App: `src/features/bills/` (`api.ts`, `ReceiptScreen.tsx`, `TokenCard.tsx`, `checkoutPage.ts`), the regenerated `contract/` and `src/api/schema.generated.ts`, and the product-invariants gate in `scripts/gates/`.

## Capability checks

- [x] A user can see the token, Copy token and the units on S7 when the Hub gives them (`receiptToken.test.tsx`).
- [x] A user who is waiting sees "Payment received, on its way" turn into the receipt with the token, without leaving the screen (status read every 10 s).
- [x] A user who waits 3 minutes with no answer still has "on its way" and Done; nothing else is read.
- [x] A user cannot read another person's bill (404), and a status read never buys (backend specs, real database).
- [x] The old `verify` and `mine` answers keep every key; test:protected passes.
- [x] The gate allows `checkoutPage.ts` and still bans the word everywhere else (`test_product_invariants.py`).
- [ ] On a phone, with a real prepaid bill: NOT RUN.

## Builder report

Backend: 101 bill-payment specs (8 files, real Postgres for the route and race cases), `test:protected` 253 of 253 (red first: exactly the two new keys on the old lock), the two route inventories, account-data-map and data-export-map, tsc, eslint on the new files, gates (0 fail, as main), check_baseline, contract:build. App: 205 bills tests (16 new), tsc, eslint, gates 0 fail with 63 gate tests, check_tasks, fingerprint unchanged.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
