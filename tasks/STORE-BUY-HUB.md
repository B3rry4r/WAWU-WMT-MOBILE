---
id: STORE-BUY-HUB
title: Buy pieces, tips and community passes through Apple and Google from one price ladder (Hub)
owner: YOU
area: IAP
order: -1267
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [IAP-01]
decisions: [R-86, R-5, R-11, R-19, R-55, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# STORE-BUY-HUB · Buying through the price ladder (Hub)

## Current state

As of 27 Oct 2026, built by a Sonnet builder (T2): backend `wmt/STORE-BUY-HUB` `c6b1743` (round 3; round 2 `88c2d03`; `origin/main` `7fa52f7` merged, no conflict), mobile records `wmt/STORE-BUY-HUB` on `origin/main` `4dccecae`. Status review. R-101 (owner, 27 Oct 2026): in the app a piece, a tip and a community pass are store purchases at the LIST price, from one ladder of consumables `wawu.buy.<naira>`; the creator gets exactly 85% of the list price, 3 working days after the sale. Paid questions (the question credit) are a later task, not here. Not run against Google or Apple (no credentials): the specs use the stores' stand-ins, as IAP-01's.

| # | Before | After |
|---|---|---|
| 1 | one store product per pack or pass; a pass price had to be one of a few hand-made points | `StoreProduct` kind `buy`: 25 products per store, `wawu.buy.100` to `wawu.buy.1000000`, `referenceKobo` the list price, new `storePriceKobo` the Nigeria store price (15% ladder); seeded by migration, admin-editable like every row |
| 2 | nothing said what a payment was for | `POST /store/intents` `{ platform, kind: content or tip or pass, contentId or creatorWawuId or communityId, listPriceNaira }` before the sheet opens: checked as the wallet path checks (piece live, paid, not theirs, not blocked, not already theirs, at the list price; tip on the tip list; pass at the room's price and the person may join), price on the list or `price_not_on_list`; answers `{ intentId, productId, accountToken, expiresAt }`. One OPEN intent per person, kind and target; it expires 60 minutes after it is made |
| 3 | `POST /store/purchases` named a product | takes `intentId` (required for a ladder product): the Hub verifies with the store, checks the product is the intent's and the account token the person's, and grants once per store transaction: the same `Purchase` row the wallet writes (`store:<id>`, type content or tip) or 30 pass days |
| 4 | a store sale paid the creator nothing | `StoreEarning`: exactly 85% of the LIST price, source `store`, `availableAt` = the sale plus 3 working days (Lagos, Monday to Friday). Shown in the creator's earnings as waiting |
| 5 | REFUND and REVOKE took back points, credits, tiers; a tip and the creator's share were unknown; REFUND_REVERSED was ignored | refund, revoke and Google voided purchase remove the unlock or the pass days and take the 85% back: unpaid earning cancelled; paid earning becomes an `EarningDeduction` (`storePurchaseId`) that the creator's next daily move takes. REFUND_REVERSED restores the grant and the earning (ladder only). Idempotent on repeats |
| 6 | no store price in the price list | `GET /prices` adds `storePriceNaira` per list price and tip (null when no ladder row is active; `?platform=` picks one store, else the higher) |
| 7 | `wawu.pass.30.*` | unchanged: the old `pass` kind and its specs pass as before |

Routes: `POST /store/intents` (new), `POST /store/purchases` (`intentId`), `GET /store/products` (lists the ladder with `listPriceKobo`, `storePriceKobo`), `GET /prices` (`storePriceNaira`, `?platform=`), `admin/store/products` (`storePriceKobo`, kind `buy`). New codes (all `reason.code`): `store_intent_not_found` 404, `store_intent_expired` 409, `store_intent_used` 409, `store_purchase_other_intent` 409, `store_intent_target_not_found` 404, `store_intent_not_payable` 409, `store_intent_price_changed` 409; with the existing `price_not_on_list` 400, `store_product_unknown`, `store_purchase_taken`, `store_account_token_missing`.

**What the daily mover does with a store earning today: nothing.** `EarningSettlementService` (the sweep and the daily move) reads only `EarningSettlement`; `StoreEarning` is its own table and nothing writes `EarningSettlement` for it, so a store earning cannot be paid early, and `availableAt` is not read by any mover. (Had it been an `EarningSettlement` row, the planner would have taken it at the next daily move for a payee with a wallet, once their owed total is at least the floor, ignoring `availableAt`: it filters on status owed, no move, no review, provider and wallet only.) STORE-PAYOUT either adopts due `StoreEarning` rows into `EarningSettlement` (as `adoptHostShares` does, with the same source/trigger extension as `host_share_earnings`) or pays them itself; it also sets `status: paid` and `paidAt`, which is what makes a later refund a deduction. The existing mover already takes `EarningDeduction` rows from the creator's next move.

Decisions (Default (lead), owner may override): (a) a separate `StoreEarning` table, not `EarningSettlement`, so the mover cannot pay one early. (b) The creator's share and the purchase's `netKobo` are worked from the list price: the store price is made so WAWU receives at least that, so `netKobo` is the list price. (c) An intent is judged at the STORE SALE time (`purchasedAt` up to 5 minutes past expiry), not the post time. (d) A tip that is refunded stops counting as a tip (`Purchase` status `failed`, restored on reversal). (e) A piece, creator or room that cannot be bought any more when the paid purchase arrives is recorded with `flag: target_unavailable` and nothing is given or earned; an admin looks (the store has the payment). (f) A second refund of an earning that was already given back in part (refund, reversal, refund) sets `flag: earning_review` and is left to a person. (g) REFUND_REVERSED restores a ladder purchase only; points, credits, tiers and the old pass stay ignored.

Proof: migrations `20261213090000_store_buy_ladder` and `20261213090100_store_buy_ladder_rows` (later than every stamp on every origin ref, the newest `20261212090000_price_list`), `prisma migrate diff` empty, each rollback run in a transaction (clean: both run; with an intent, a store earning, a ladder purchase or a store deduction: refused). Specs: `store-buy-rules.spec.ts` (12), `store-buy.contract.spec.ts` (35, real HTTP and database, stand-in stores), the 7 older store specs (107) unchanged and green, `price-list` (62 with the account-purge guard), protected routes (253), `tsc`, `eslint` on changed files, `contract:build` (0 paths removed; 4 operations and 9 schemas gain fields), gates and `check_baseline` EXIT 0. Not run here (GitHub does): the Fintava-double specs.

Round 2 (27 Oct 2026, lead): `origin/main` merged; the new tables are classified in `account-data-map.ts` (`StorePurchaseIntent.wawuUserId` OWNED; `StoreEarning.payeeWawuUserId` COUNTERPARTY, kept like a wallet sale's earning; the ladder columns on `StorePurchase` and `EarningDeduction.storePurchaseId` ride on rows already classified) and in the data export (`storePurchases` now shows `buyKind` and `targetId`; the intent and the store earning are left out on purpose with their reasons). An unpaid `StoreEarning` (status owed, a restore among them) now counts in `waiting_earnings`, so a creator is not deleted while WAWU owes them (`account-deletion-store-earning.contract.spec.ts`, 3). `account-data-map.spec` and `data-export-map.spec` green. `data-export.contract.spec` and `data-export-request.contract.spec` fail the same way on a clean `origin/main` in this environment (19 failed there), so they are not this change; every export section loads for the seeded user.

Round 3 (27 Oct 2026, verifier findings and lead rulings on `88c2d03`): **H1** the purge keeps a `StorePurchase` with the buyer cleared (`wawuUserId` is nullable; ANONYMISED, the buyer's currency and price cleared), so a refund after the account is gone still finds it and takes the creator's 85% back; spec: buy, purge, REFUND (deduction), and a pass. **M1** Apple notices are ordered per store transaction by `signedDate` (`StorePurchase.lastNoticeAt`): an older one changes nothing, the webhook answers `ignored`; specs in every order and the full cycle. **M2** a paid purchase whose target is gone (free, already theirs, taken down, member removed) gives nothing, earns nothing, and credits the fan: new `StoreCredit` worth the list price, the 201 says `status: credited` with a `credit.message` sentence, `GET /store/credits`, `POST /store/intents` with `payWith: credit` consumes the smallest credit that fits whole and grants at once, a refund voids an unspent credit (a reversal restores it; a spent one goes to a person), `admin/store/purchases?flag=`. **L1** the sale must be at or after the intent (less 5 minutes). **L2** a price raised after the intent grants at the intent's price with `flag: price_changed`. **L3** a daily sweep deletes unused intents 7 days after they ran out. **L4** `GET /money/earnings` shows `storeEarnings` with each share's `availableAt`. Migration `20261214090000_store_buy_credit_notice` (after `20261213090100`): relaxes `StorePurchase.wawuUserId`, adds `lastNoticeAt` and `StoreCredit`; rollback refuses while any credit, cleared buyer or notice date exists. `AdminStorePurchaseView.wawuUserId` is now nullable (a deleted buyer): the dashboard's Store page must read it as `string | null`.

Not done: a sale notification to the creator; the holiday list; the 30% ladder; the paid-question credit (it reuses `StoreCredit`).

## Read first

`DECISIONS.md` R-86, R-5, R-11, R-19, R-55 (R-101 is the owner's ruling of 27 Oct 2026, the lead's record); IAP-01; backend `src/store/`, `src/content-piece/wallet/unlock-wallet.service.ts`, `src/purchase/wallet/tip-wallet.service.ts`, `src/community/pass/`, `src/money/earnings/`.

## Goal

A person in the app can buy a piece, a tip or a community pass in Google Play or the App Store at the list price; the Hub knows what the payment was for, grants it once, and records the creator's exact 85% to be paid 3 working days on; a store refund takes it all back.

## Scope

`wawu-backend`: `src/store/` (intents, earning, target check, ladder, buy rules), `prisma/` (the two migrations with rollbacks), `src/price-list/` (`GET /prices`), `src/money/earnings/earnings-view.service.ts` (one read-only arm), `src/account-purge/account-data-map.ts` (two entries), `README.md`, `contract/openapi.json`. The app is STORE-BUY-APP; the payout is STORE-PAYOUT.

## Capability checks

- [x] An intent for each kind, and each refusal (free, own, owned, taken down, blocked, wrong price, off the list, not on the tip list, removed from the room, no pass, unknown); one open per target; it expires.
- [x] A purchase against an intent grants once: wrong product, the other store, another person's token or intent, a second payment on one intent, one transaction named for two intents, and a replay all give nothing more.
- [x] The earning is 85% of the list price with `availableAt` three working days on over a weekend and in Lagos time.
- [x] A refund before and after the earning was paid (cancelled; deduction), a reversal (restored; deduction voided; part already taken owed back), a revocation, a voided purchase, a pass and a tip.
- [x] `GET /prices` carries `storePriceNaira`; the protected suite is unchanged (253).
- [ ] Against the real Google Play and App Store: NOT RUN (no credentials).
