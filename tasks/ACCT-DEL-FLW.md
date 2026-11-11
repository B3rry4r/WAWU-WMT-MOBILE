---
id: ACCT-DEL-FLW
title: Deleting an account waits until its Flutterwave wallet is empty too
owner: YOU
area: MONEY
order: 384
priority: after-launch
repo: wawu-backend
type: flow
status: todo
depends_on: []
decisions: [R-1, R-17]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T2
---
# ACCT-DEL-FLW · Deleting an account waits until its Flutterwave wallet is empty too

## Current state

As of 11 Nov 2026.
- **Status:** todo, and it waits for the owner's yes before any server change. Cut by the lead from the OPS-DEL-TEST verifier's blocker B1 (`wmt/OPS-DEL-TEST-verify` b5661df9), then checked by the lead in the code on Hub main bf3f4a3b.
- **The gap:**
  - `DELETE /account` refuses only on the blockers in `src/account/account-deletion-money.service.ts`: the wallet provider's balance, holds, waiting earnings, payments in progress, FX and Capital.
  - It never looks at the website's Flutterwave payout wallet: `CreatorWallet`, `WalletLedgerEntry` and a `WalletWithdrawal` in flight.
  - After the 30-day grace, the purge deletes those rows (`src/account-purge/account-data-map.ts`, "the wallet").
  - The purge's own comment says the account at Flutterwave MFB "is Flutterwave's to close, which is why account deletion has to drain a wallet before it runs rather than leaving money behind a deleted row". Today nothing drains it or refuses.
- **Who it can hit:** anyone who earned on the website (Flutterwave payout subaccounts, built 5 Sep 2026) and then deletes their account from the app or the website. Their money stays at Flutterwave, and WAWU's pointer to it is gone.
- **Next:** on the owner's yes, a builder on wawu-backend `wmt/ACCT-DEL-FLW`, then a T2 verifier.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-1 (the web stays on Flutterwave until after launch) and R-17 (the wallet must be empty before an account is deleted)
- wawu-backend: `src/account/account-deletion-money.service.ts`, `src/account-purge/account-data-map.ts`, the Flutterwave wallet code (`CreatorWallet` and its balance read), the README section on payments

## Goal

Deleting an account refuses while the website's Flutterwave wallet holds money or has a withdrawal in flight, exactly as it already refuses for the wallet provider. The person sees a plain sentence telling them to withdraw first.

## Scope

- **New blockers** in the deletion money check (additive):
  - the Flutterwave wallet's balance, read from Flutterwave, never added up from our own rows (the provider's balance is the truth);
  - a `WalletWithdrawal` in flight;
  - a pending `WalletLedgerEntry`.
- **Failure handling.** A Flutterwave read that fails blocks the deletion (never "called empty"), exactly as `fx_balance_unreadable` does today.
- **Message.** The app's and the website's deletion screens show the Hub's sentence. Check that both render it, and that no em-dash is used.
- **Second gate.** The sweep re-checks before it purges, so money that arrives during the grace stops the purge.
- **Tests.** Stand-ins only: never call Flutterwave from a test.

## Capability checks

- [ ] A person whose Flutterwave wallet holds money is refused, with the sentence.
- [ ] Money that arrives during the grace stops the purge.
- [ ] A Flutterwave read that fails refuses.
- [ ] Someone with no Flutterwave wallet deletes exactly as before (the protected suite, and the account-deletion specs unchanged).

## Builder report

## Verifier report

## Owner sign-off
