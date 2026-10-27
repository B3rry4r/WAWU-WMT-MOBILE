---
id: STORE-CUT30
title: When a store reaches the threshold its ladder prices move from 15% to 30% (Hub)
owner: YOU
area: IAP
order: -1259
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
# STORE-CUT30 · The stores' cut from 15% to 30% (Hub)

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T2) in the STORE-PAYOUT bundle: backend `wmt/STORE-PAYOUT`, mobile records `wmt/STORE-PAYOUT`. Status verifying. R-101 point 9. Creators keep exactly 85% of the list price either way. Mounted in `AppModule` (SHARED-CHANGES STORE-PAYOUT #1).

| # | Before | After |
|---|---|---|
| 1 | nothing counted what a store pays WAWU | `StoreProceedsEntry`, one per granted production purchase, counted every 5 minutes: the store's proceeds in kobo (the list price for a ladder sale; else a naira price less the cut) and in US cents; refunded and revoked purchases stop counting; sandbox purchases are not counted; the year is the Africa/Lagos calendar year |
| 2 | no dollar figure | **The FX source is Nuvion's FX quote** through the wallet provider seam: a live NGN to USD quote from WAWU's own account (`fx.quoteFromMerchant`, the call PAY-FX's refunds use; moves no money), cached 30 minutes, else the newest NGN/USD quote the Hub stored in `FxQuote` in the last 30 days; with neither nothing is counted that pass |
| 3 | one ladder | at `store.cut30_threshold_usd` (admin setting, default 900000) a store's `wawu.buy.*` rows take the 30% prices from `src/store/cut30/store-ladder-30.ts` (the fourth column of the lead's store-price table, copied once as the seed; nothing reads that table at runtime), once per store and year (`StoreCut30Switch`, unique); `GET /prices` shows them (`?platform=` picks a store) |
| 4 | prices changed by hand | the stores' own prices change through their APIs only when the server has the keys (`STORE_PRICE_GOOGLE_*`, `STORE_PRICE_APPLE_*`, README); without them the owner's notice says to change them by hand and lists the new Nigeria prices; if part fails, it names the products to change by hand |
| 5 | no way back | `POST /admin/store/cut30/{android or ios}/switch-back` puts the 15% prices back (an admin action; 409 when already on 15%); `GET /admin/store/cut30` shows each store's year total, threshold and ladder. The total starts again on 1 January; nothing switches back by itself |

Migration `20261217100000_store_cut30` (also adds the nullable `StorePurchase.shareFeeBps` and `StoreCut30Switch.priorFeeBps`; after `20261217090000_store_payout`; STORE-QUESTION has `20261218090000_store_question`): tables `StoreProceedsEntry` and `StoreCut30Switch`. Rollback refuses while either has rows. Files: `src/store/cut30/`, `src/plan-settings/` (the setting), `src/app.module.ts`, `README.md`, `contract/openapi.json`.

Default (lead), owner may override: (a) a purchase in a currency other than naira with no reference price is not counted. (b) At the switch the store's recorded cut (`StorePlatformSetting.storeFeeBps`) becomes 3000, so WAWU's own recorded nets (credit packs, tiers, points, upload packs) are true (70%); every creator and host share stays on the cut from before (`StoreAvailability.shareFeeBps`, kept on each purchase as `shareFeeBps`), so a credit pack's host share is unchanged and WAWU absorbs the extra; the switch back puts the earlier cut back (`StoreCut30Switch.priorFeeBps`). (c) The Google call is the Android Publisher `inappproducts.patch` (`NG` price) and the Apple call is App Store Connect `inAppPurchasePriceSchedules` on the matching Nigeria price point; neither has been run against the real store. (d) If nobody has swapped naira and dollars in 30 days and the live quote fails, the total waits for a rate.

Proof (27 Oct 2026, builder): `tsc` EXIT 0; `eslint` on every file changed clean except two prettier lines in `src/wallet/wallet-funding.service.ts` that were already unformatted on `origin/main` (not touched); gates EXIT 0 and `check_baseline` EXIT 0; `contract:build` EXIT 0 (277 lines added, none removed); both migrations' rollbacks run clean and refuse with data; 32 suites, 434 tests green on a test database (the store folder, price list, plan settings, the two route inventories, the account and export maps, the Nuvion earning spec). The tests were written after the code; the payout spec was shown red by breaking the code three ways (no netting, no balance check, no cancel at the lease) and the double-pay spec red by putting the old funding sweep back. Not run: Google or Apple (no credentials; local stand-ins), the Fintava-double specs (GitHub runs them), `test:protected` (no protected route changed).

Patch round 1 (27 Oct 2026, verifier V-SP-3, V-SP-7): the fee and shares rule above; with no keys `data.byHand` lists all 25 products. Tests: `store-cut30-shares.contract.spec.ts` (a credit pack before and after the switch), and the no-keys test. `tsc`, `eslint` on changed files, gates, `check_baseline`, `contract:build` EXIT 0; 29 suites, 383 tests on a seeded DB (store folder, price list, credit purchase and spend, the maps and route inventories).

Patch round 2 (27 Oct 2026, verifier V-SP-9): a switch made while an earlier switch of the same store is still open (never switched back) inherits that switch's `priorFeeBps`, so shares stay on the original cut; the switch back restores it and closes every open switch of the store. Test: `store-cut30-shares.contract.spec.ts` (V-SP-9), red on `185c5e0` (priorFeeBps 3000), green now; store folder and price list 258 tests, gates and `check_baseline` EXIT 0.

## Read first

`DECISIONS.md` R-101 point 9, R-39; STORE-BUY-HUB (the ladder, `storePriceKobo`); backend `src/store/cut30/`, `src/store/store-ladder.ts`, `src/price-list/store-price.service.ts`.

## Goal

When a store reaches the yearly threshold, its `wawu.buy.*` prices move to the 30% ladder once, `GET /prices` shows them, the owner is told once, and an admin moves them back at the new year.

## Scope

`wawu-backend`: `src/store/cut30/`, the setting, one migration with a rollback. Records only in the app repo.

## Capability checks

- [x] A store crosses once; another sale, another sweep and a second server change nothing; the notice is written once.
- [x] Android crosses, iOS does not; sandbox and refunded sales do not count; `GET /prices` shows the 30% price for the store that crossed (and the higher of the two without `?platform=`).
- [x] With keys: one Google call and one Apple flow per product, and a failed product is named in the notice; without keys: the notice says "by hand".
- [x] The switch back is an admin action and refuses a store already on 15%.
- [x] The rate falls back to the newest stored Nuvion quote; with none, no rate.
- [ ] Against the real Google Play and App Store Connect: NOT RUN (no credentials).
