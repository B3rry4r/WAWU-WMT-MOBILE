---
id: STORE-PAYOUT
title: Pay a creator their 85% of a store sale from WAWU's own wallet, 3 working days on (Hub)
owner: YOU
area: IAP
order: -1261
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [STORE-BUY-HUB]
decisions: [R-5, R-11, R-19, R-39, R-47, R-101]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# STORE-PAYOUT · Paying creators for store sales (Hub)

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T2): backend `wmt/STORE-PAYOUT` on `origin/main` `9f393b2`, mobile records `wmt/STORE-PAYOUT` on `wmt/STORE-BUY-HUB` `bc525c61`. Status verifying. Owner, 27 Oct 2026: "Paying the users would be from our own pocket our own nuvion wallet in 3 working days." Creators keep exactly 85% of the list price (R-101 point 4). Mounted in `AppModule` (SHARED-CHANGES STORE-PAYOUT #1).

| # | Before | After |
|---|---|---|
| 1 | a `StoreEarning` was recorded and nothing paid it | every minute, each earning whose `availableAt` has passed is moved from WAWU's own account at the wallet provider to the creator's wallet, through `WALLET_PROVIDER` only; one `StoreEarningPayout` row per earning, reference `wawu-spay-<earning id>` (the idempotency key); the earning is `sending` while the transfer is out and `paid` only when the provider confirmed it |
| 2 | a store refund of a paid earning made a deduction only the daily mover took | the payout takes the creator's open `EarningDeduction`s from the share, oldest first, never below 0 (a take row each, in the same `EarningDeductionTake` table the daily mover uses, so nothing is taken twice); a share taken whole is paid with no transfer |
| 3 | no wallet, no payment | a creator without a wallet keeps the earning owed and is paid within a minute of opening one (R-11) |
| 4 | WAWU's account could run dry unseen | when it holds less than is due, earnings are paid in `availableAt` order up to the balance, the rest wait, and the owner gets ONE notice a day: new `StoreAdminNotice`, `GET /admin/store/notices`, `PATCH /admin/store/notices/:id/read` (superadmin, finance) |
| 5 | the creator saw "waiting" for ever | the ledger gets both sides under the reference (category `earning`, linked to what was sold), so the creator sees it land; `GET /money/earnings` lists `sending` earnings as waiting; a spec proves the ledger equals the provider after a run |
| 6 | a store refund while a payout is planned | before the transfer is sent it cancels the earning, the payout and its takes (checked under a lock at the lease); after it is sent, the refund is a deduction as for a paid earning |
| 7 | `WalletFundingService` (`WALLET_FUNDING=on`) paid every completed `Purchase` and answered `DirectMessage`, store sales included | it skips every row whose reference starts `store:`, so a store sale is paid only by `StoreEarning`; the dashboard's "owed" figure (`admin-finance-wallets.service.ts`) skips them too. Spec: one store sale, both jobs run, the creator is paid once |

Migration `20261217090000_store_payout` (after `20261216090000`): tables `StoreEarningPayout` and `StoreAdminNotice`; `EarningDeductionTake.moveId` may be empty and gains `storePayoutId` (exactly one is set, a check); `StoreEarning.status` may also be `sending`. Rollback refuses while any payout, take by a payout, notice or `sending` earning exists.

Files changed for the double-pay fix: `src/wallet/wallet-funding.service.ts`, `src/admin/finance/admin-finance-wallets.service.ts`, and the spec `src/store/payout/tests/store-payout.contract.spec.ts` (its last test). Also touched: `src/money/earnings/earnings-view.service.ts` and `src/account/account-deletion-money.service.ts` (a `sending` earning still counts as waiting), `src/account-purge/account-data-map.ts`, `src/data-export-request/data-export-sections.ts`, `src/app.module.ts`, `README.md`, `contract/openapi.json`.

Default (lead), owner may override: (a) when the account is short, payment stops at the first earning that does not fit (strict `availableAt` order) instead of skipping to smaller later ones. (b) The provider's own charge on each transfer is WAWU's, paid from its account, never taken from the creator. (c) A payout the provider refuses or leaves unanswered for 72 hours goes to a person, as every mover here does. (d) One transfer per earning, no daily floor.

Proof (27 Oct 2026, builder): `tsc` EXIT 0; `eslint` on every file changed clean except two prettier lines in `src/wallet/wallet-funding.service.ts` that were already unformatted on `origin/main` (not touched); gates EXIT 0 and `check_baseline` EXIT 0; `contract:build` EXIT 0 (277 lines added, none removed); both migrations' rollbacks run clean and refuse with data; 32 suites, 434 tests green on a test database (the store folder, price list, plan settings, the two route inventories, the account and export maps, the Nuvion earning spec). The tests were written after the code; the payout spec was shown red by breaking the code three ways (no netting, no balance check, no cancel at the lease) and the double-pay spec red by putting the old funding sweep back. Not run: Google or Apple (no credentials; local stand-ins), the Fintava-double specs (GitHub runs them), `test:protected` (no protected route changed).

Not done: a sale notification to the creator (STORE-SALE-NOTICE); the app screens.

## Read first

`DECISIONS.md` R-101 (points 4, 5, 9), R-5, R-11, R-19, R-39; STORE-BUY-HUB; backend `src/store/payout/`, `src/store/store-earning.service.ts`, `src/community/pass/community-pass-refund.service.ts` (the pattern), `src/money/earnings/`.

## Goal

A creator is paid exactly 85% of the list price of a store sale, from WAWU's own account, once, 3 working days after the sale, and sees it land.

## Scope

`wawu-backend`: `src/store/payout/` (rules, service, notices, admin routes, module), the funding sweep's exclusion, one migration with a rollback. `wawu-wmt-mobile`: records only.

## Capability checks

- [x] The payout is made once; a second pass and a second server pay nothing more (a race of three servers over four earnings).
- [x] Deductions are netted oldest first and never below 0; what is left owed comes out of the next earning.
- [x] No wallet, then a wallet: paid. A wallet the provider refuses: owed again, retried under the same reference.
- [x] A short account pays in order up to its balance and the owner is told once a day.
- [x] The ledger equals the provider after a run; a refund before the send cancels the payout.
- [x] One store sale, the payout and the legacy funding sweep both run: the creator is paid once.
- [ ] Against the real Nuvion account: NOT RUN (the stand-in implements its documented book transfers).
