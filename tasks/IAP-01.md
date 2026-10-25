---
id: IAP-01
title: Points, credits, ticks, tiers and community passes bought through Google Play and the App Store (Hub)
owner: YOU
area: IAP
order: -1270
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: []
decisions: [R-86, R-5, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# IAP-01 · Buying through the app stores (Hub)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B27): backend `wmt/IAP-01` `6e92cd2` on `origin/main` `38be72e`, mobile records `wmt/IAP-01` on `origin/main` `546db77e`. Status review (verifier round 1 was FIX; builder fix round 1; verifier round 2 PASS on `6e92cd2`, three lows for the sweep, see history). Not run against Google or Apple: no credentials exist (see "What the owner sets up"); the tests use a stand-in for each store, and the real Google adapter is tested against a local HTTP server that plays Google.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | points, credits, ticks and tiers, and passes could be bought only from the wallet or by bank transfer | each can be bought in a store: `POST /store/purchases` asks the store's own server, then grants through the same grant code the wallet uses, once per store transaction |
| 2 | no list of what a store sells | `GET /store/products?platform=` from an admin-edited map (store product id, kind, what one purchase grants); no price (the app shows the store's own) |
| 3 | a store refund or lapse was unknown to the Hub | `POST /webhooks/google-play` (Pub/Sub, token checked) and `POST /webhooks/app-store` (signed V2, chain checked): renewals extend, refunds and revocations take back what is unspent, lapses end the subscription's standing |
| 4 | no dashboard view | `admin/store`: products, per-store on/off and cut, purchases, refunds (superadmin and finance) |
| 5 | credits and passes split 85/15 on the price paid | worked on WAWU's net after the store's share: the credit lot's gross, and the pass row's `netKobo` and the host's `creatorShareKobo`, use `reference - store cut` |
| 6 | store keys: none | every store route answers `store_not_configured` (503) until the keys are set |

**Round 1 (24 Oct 2026): the verifier's FIX (one high, four low) and the lead's ruling, fixed in backend `6e92cd2`.**

| # | Finding | Fix |
|---|---|---|
| H | B could take a renewed order of A's subscription (once-only was on the transaction id; notices followed the newest row) | a subscription is held by its first buyer (`StoreSubscription`, unique per platform and Google purchase token or Apple `originalTransactionId`): any other person gets `409 store_purchase_taken`, whatever the order id; notices follow the holder |
| H | a token alone proves nothing | every purchase is bound to the person: **`GET /store/products` answers `accountToken`** (a stable UUID per person, not their user id); the app passes it as Google `obfuscatedAccountIdAndroid` and Apple `appAccountToken`; the Hub refuses another person's (`store_purchase_taken`) and, with none, `422 store_account_token_missing` |
| 2 | Google productId never compared | the real adapter refuses an answer that names another product |
| 3 | a grant that throws was a bare 500 | `500 store_grant_failed` (a plain sentence); nothing kept; the next post or the store's resent notice grants once |
| 4 | rollback dropped the platform switch and the seen notices | refuses while either exists; the new migration's rollback refuses while holders, tokens or flagged purchases exist |
| 5 | a pass renewal for a removed member | recorded, `flag: member_removed`, no period written (`admin/store/purchases` shows the flag); `GET /communities/{id}/pass` answers `cancelInStore: true` so the pass screen says to cancel in the store |

Default (lead), owner may override: the token cutover is **25 Oct 2026** (`STORE_ACCOUNT_TOKEN_REQUIRED_FROM`): a subscription must always carry the token; a pack bought before that date may carry none, one bought on or after it must. Proof, round 1: red specs first (B steals on Google, App Store and a pass: 201 before, 409 after), `tsc`, `eslint`, gates, `check_baseline`, `contract:build` (0 removed or changed against main), and 14 suites (248 tests) of store and affected specs, protected routes (253) all EXIT 0. Not run: the Fintava-double wallet specs (GitHub), any real store.


**Restamped (lead ruling, records only; backend batch B, PR #201):** `20261121090000_store_purchases` is now `20261127100000_store_purchases` and `20261126090000_store_subscription_owner` is now `20261127110000_store_subscription_owner` (`20261127090000_add_money` is WALLET-25's).

**Round 2 (24 Oct 2026, lead ruling):** `origin/main` `53819c2` merged by the lead (backend `195a4fd`); the second migration is `20261127110000_store_subscription_owner`. Branch checks on `195a4fd` were red in one shard: the store specs' cleanup deleted the seeded plain user's FOUNDERS membership (they used the seeded accounts). Fixed in backend `7f6d6cf`: each store spec makes up its own people and tokens and deletes only their rows; a hash of the seeded rows is equal before and after, and `community.contract` + `block-hides-people` pass after the store specs. `account-deletion-round7` "a time budget" (800 ms) is not touched by this task: nothing under `src/account/` changed.

### Routes (all under `/api/hub`, in `contract/openapi.json`, additive)

`GET /store/products`, `POST /store/purchases`, `POST /webhooks/google-play`, `POST /webhooks/app-store`, `GET` and `POST /admin/store/products`, `PATCH /admin/store/products/{id}`, `GET /admin/store/platforms`, `PATCH /admin/store/platforms/{platform}`, `GET /admin/store/purchases`, `GET /admin/store/refunds`. Errors carry `reason.code`: `store_not_configured` 503, `store_disabled` 409, `store_product_unknown` 404, `store_receipt_missing` 400, `store_purchase_invalid` 422, `store_purchase_pending` 409, `store_purchase_taken` 409, `store_pass_not_available` 409, `store_unreachable` 503, `store_product_invalid` 400 (admin).

### What the owner sets up (nothing exists yet; none of it is in the repo)

- **Google Play Console:** create the in-app products (consumables for points, credits, the upload pack and community passes) and the subscriptions (tiers) with the ids the product map names; create a service account in Google Cloud, give it "View financial data" and "Manage orders and subscriptions" in Play Console (Users and permissions), put its JSON in `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`; set `GOOGLE_PLAY_PACKAGE_NAME`; turn on Real-time developer notifications to a Pub/Sub topic with a push subscription to `https://<hub>/api/hub/webhooks/google-play` using OIDC auth as a service account, and set `GOOGLE_PLAY_PUBSUB_AUDIENCE` (that URL) and `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL`.
- **App Store Connect:** create the consumable products, the non-renewing subscriptions for community passes (one per price point; IAP-03 round 2) and the auto-renewable subscriptions for tiers (one subscription group) with the ids the map names; make an In-App Purchase key (Users and Access, Integrations, In-App Purchase): its `.p8` is `APPLE_PRIVATE_KEY`, with `APPLE_KEY_ID` and `APPLE_ISSUER_ID`; set `APPLE_BUNDLE_ID`, `APPLE_APP_ID` (the app's Apple id), `APPLE_ENVIRONMENT`, and `APPLE_ROOT_CERTIFICATES` (Apple's root certificates, PEM, from apple.com/certificateauthority); set the App Store Server Notifications V2 URL (production and sandbox) to `https://<hub>/api/hub/webhooks/app-store`.
- **Then in the dashboard:** add each product to the map (`admin/store/products`), set each credits and pass product's `referenceKobo`, and check `admin/store/platforms` shows `configured: true`. A tier product's store period must equal the tier's `days`; a pass product is bought once, and its `days` (30) is what one purchase gives.

### Default (lead), owner may override

- WAWU Credits packs go through the stores too (R-86). The store's cut is 15% on both (`STORE_FEE_BPS_ANDROID`, `STORE_FEE_BPS_IOS`, 1500; an admin can set a cut per store). The cut is rounded up, so the net is never more than WAWU receives.
- A credits or pass product is worth `referenceKobo` (credits default to the wallet pack price; a pass needs one, because a store sells fixed price points while a host sets their own). The net and the creator's 85% are worked from it, not from the buyer's currency.
- A subscription renewal grants the product's own days again (the tier's, or the pass's); a lapse marks the subscription ended and what was granted runs to its own end. A tier bought while a smaller tier runs adds its days to that tier; a bigger tier upgrades, as a wallet purchase does.
- A store purchase does not fix the person's billing currency, and a store tier does not trigger the referral reward at once (the referral job reads `MakerPurchase`, which now holds store tiers).
- Sandbox and test purchases are accepted in Production (Google licence testers, Apple App Review).
- Owner's setup adds nothing new for the token: the app (IAP-02) passes `accountToken`; the Play Console and App Store Connect need no setting for it.

## Read first

- `DECISIONS.md` R-86, R-5, R-19; `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- Backend `src/store/` (the module), `src/credit-purchase/credit-grant.ts`, `src/community/pass/community-pass-grant.ts` (the shared grant code the wallet and the stores both call), `src/plans/tier-grant.service.ts`, `src/points/points.service.ts` (`revokeLot`)

## Goal

A person in the app can buy points, credits, a tick or tier and a community pass in Google Play or the App Store at the store's price in their own currency; the Hub checks each purchase with the store's server and grants it once; a store refund or revocation takes back what is unspent. The wallet routes stay for the website.

## Scope

`wawu-backend` only: new `src/store/`, `prisma/` (migrations `20261127100000_store_purchases` and `20261127110000_store_subscription_owner`, each with its rollback), `src/app.module.ts` (one import and one entry), the two shared grant functions and their two wallet callers (`credit-wallet.service.ts`, `community-pass.service.ts`, behaviour unchanged), `src/points/points.service.ts` (`revokeLot`; a release into a lapsed lot is written off), `community-pass-removal.service.ts` and `community-pass-reminder.service.ts` (a store pass is never paid back from the wallet or reminded), `account-data-map.ts` and `data-export-sections.ts` (one entry each), `README.md`, `contract/openapi.json`. The app side is IAP-02 (a native module, the next store build).

## Capability checks

- [x] A person can buy a points pack, a credits pack, a tier and a pass (stand-in stores): granted once, whatever the replays and races (5 at once gave one lot).
- [x] A purchase the store does not vouch for (unknown, pending, cancelled, another product, another account's) grants nothing.
- [x] A refund or revocation takes back the unspent points and credits, the tier's days of that period and its bonus lot, and ends a pass period; the same notice twice takes back once; it works with the store switched off.
- [x] The credit lot's gross, and a pass's net and host share, are worked on the net after the store's cut (15% default, 30% on a test of the App Store, an admin override).
- [x] An admin can add and change products, switch a store off and set its cut, and read purchases and refunds; support and reviewer are refused.
- [x] With no keys, every store route answers `store_not_configured`.
- [x] Another person cannot take a subscription, a renewal of it or its notices, on Google, the App Store or a pass (specs fail before the fix); a purchase carries the buyer's `accountToken` or is refused; a grant that throws answers `store_grant_failed` and is retried; a removed member's pass renewal is flagged and gives nothing.
- [ ] Against the real Google Play and App Store: NOT RUN (no credentials; the owner's setup list above).
- [ ] Apple's certificate chain check on a real signed answer: NOT RUN (the library does it; the tests stand in for it).
- [ ] The wallet specs that use the Fintava double (`credit-wallet`, `community-pass-*`): NOT RUN here by rule; GitHub runs them on the push. Their two callers now use the shared functions.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/IAP-01.md](history/IAP-01.md).

