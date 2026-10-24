---
id: IAP-01
title: Points, credits, ticks, tiers and community passes bought through Google Play and the App Store (Hub)
owner: YOU
area: IAP
order: -1270
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-86, R-5, R-47]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# IAP-01 · Buying through the app stores (Hub)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B27): backend `wmt/IAP-01` on `origin/main` `38be72e`, mobile records `wmt/IAP-01` on `origin/main` `546db77e`. Status verifying. Not run against Google or Apple: no credentials exist (see "What the owner sets up"); the tests use a stand-in for each store, and the real Google adapter is tested against a local HTTP server that plays Google.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | points, credits, ticks and tiers, and passes could be bought only from the wallet or by bank transfer | each can be bought in a store: `POST /store/purchases` asks the store's own server, then grants through the same grant code the wallet uses, once per store transaction |
| 2 | no list of what a store sells | `GET /store/products?platform=` from an admin-edited map (store product id, kind, what one purchase grants); no price (the app shows the store's own) |
| 3 | a store refund or lapse was unknown to the Hub | `POST /webhooks/google-play` (Pub/Sub, token checked) and `POST /webhooks/app-store` (signed V2, chain checked): renewals extend, refunds and revocations take back what is unspent, lapses end the subscription's standing |
| 4 | no dashboard view | `admin/store`: products, per-store on/off and cut, purchases, refunds (superadmin and finance) |
| 5 | credits and passes split 85/15 on the price paid | worked on WAWU's net after the store's share: the credit lot's gross, and the pass row's `netKobo` and the host's `creatorShareKobo`, use `reference - store cut` |
| 6 | store keys: none | every store route answers `store_not_configured` (503) until the keys are set |

### Routes (all under `/api/hub`, in `contract/openapi.json`, additive)

`GET /store/products`, `POST /store/purchases`, `POST /webhooks/google-play`, `POST /webhooks/app-store`, `GET` and `POST /admin/store/products`, `PATCH /admin/store/products/{id}`, `GET /admin/store/platforms`, `PATCH /admin/store/platforms/{platform}`, `GET /admin/store/purchases`, `GET /admin/store/refunds`. Errors carry `reason.code`: `store_not_configured` 503, `store_disabled` 409, `store_product_unknown` 404, `store_receipt_missing` 400, `store_purchase_invalid` 422, `store_purchase_pending` 409, `store_purchase_taken` 409, `store_pass_not_available` 409, `store_unreachable` 503, `store_product_invalid` 400 (admin).

### What the owner sets up (nothing exists yet; none of it is in the repo)

- **Google Play Console:** create the in-app products (consumables for points and credits) and the subscriptions (tiers, passes) with the ids the product map names; create a service account in Google Cloud, give it "View financial data" and "Manage orders and subscriptions" in Play Console (Users and permissions), put its JSON in `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`; set `GOOGLE_PLAY_PACKAGE_NAME`; turn on Real-time developer notifications to a Pub/Sub topic with a push subscription to `https://<hub>/api/hub/webhooks/google-play` using OIDC auth as a service account, and set `GOOGLE_PLAY_PUBSUB_AUDIENCE` (that URL) and `GOOGLE_PLAY_PUBSUB_SERVICE_ACCOUNT_EMAIL`.
- **App Store Connect:** create the consumable products and the auto-renewable subscriptions (one subscription group for tiers, one per price point for passes) with the ids the map names; make an In-App Purchase key (Users and Access, Integrations, In-App Purchase): its `.p8` is `APPLE_PRIVATE_KEY`, with `APPLE_KEY_ID` and `APPLE_ISSUER_ID`; set `APPLE_BUNDLE_ID`, `APPLE_APP_ID` (the app's Apple id), `APPLE_ENVIRONMENT`, and `APPLE_ROOT_CERTIFICATES` (Apple's root certificates, PEM, from apple.com/certificateauthority); set the App Store Server Notifications V2 URL (production and sandbox) to `https://<hub>/api/hub/webhooks/app-store`.
- **Then in the dashboard:** add each product to the map (`admin/store/products`), set each credits and pass product's `referenceKobo`, and check `admin/store/platforms` shows `configured: true`. A tier product's store period must equal the tier's `days`; a pass product's `days` must equal its store period.

### Default (lead), owner may override

- WAWU Credits packs go through the stores too (R-86). The store's cut is 15% on both (`STORE_FEE_BPS_ANDROID`, `STORE_FEE_BPS_IOS`, 1500; an admin can set a cut per store). The cut is rounded up, so the net is never more than WAWU receives.
- A credits or pass product is worth `referenceKobo` (credits default to the wallet pack price; a pass needs one, because a store sells fixed price points while a host sets their own). The net and the creator's 85% are worked from it, not from the buyer's currency.
- A subscription renewal grants the product's own days again (the tier's, or the pass's); a lapse marks the subscription ended and what was granted runs to its own end. A tier bought while a smaller tier runs adds its days to that tier; a bigger tier upgrades, as a wallet purchase does.
- A store purchase does not fix the person's billing currency, and a store tier does not trigger the referral reward at once (the referral job reads `MakerPurchase`, which now holds store tiers).
- Sandbox and test purchases are accepted in Production (Google licence testers, Apple App Review).

## Read first

- `DECISIONS.md` R-86, R-5, R-19; `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- Backend `src/store/` (the module), `src/credit-purchase/credit-grant.ts`, `src/community/pass/community-pass-grant.ts` (the shared grant code the wallet and the stores both call), `src/plans/tier-grant.service.ts`, `src/points/points.service.ts` (`revokeLot`)

## Goal

A person in the app can buy points, credits, a tick or tier and a community pass in Google Play or the App Store at the store's price in their own currency; the Hub checks each purchase with the store's server and grants it once; a store refund or revocation takes back what is unspent. The wallet routes stay for the website.

## Scope

`wawu-backend` only: new `src/store/`, `prisma/` (migration `20261121090000_store_purchases` with its rollback), `src/app.module.ts` (one import and one entry), the two shared grant functions and their two wallet callers (`credit-wallet.service.ts`, `community-pass.service.ts`, behaviour unchanged), `src/points/points.service.ts` (`revokeLot`; a release into a lapsed lot is written off), `community-pass-removal.service.ts` and `community-pass-reminder.service.ts` (a store pass is never paid back from the wallet or reminded), `account-data-map.ts` and `data-export-sections.ts` (one entry each), `README.md`, `contract/openapi.json`. The app side is IAP-02 (a native module, the next store build).

## Capability checks

- [x] A person can buy a points pack, a credits pack, a tier and a pass (stand-in stores): granted once, whatever the replays and races (5 at once gave one lot).
- [x] A purchase the store does not vouch for (unknown, pending, cancelled, another product, another account's) grants nothing.
- [x] A refund or revocation takes back the unspent points and credits, the tier's days of that period and its bonus lot, and ends a pass period; the same notice twice takes back once; it works with the store switched off.
- [x] The credit lot's gross, and a pass's net and host share, are worked on the net after the store's cut (15% default, 30% on a test of the App Store, an admin override).
- [x] An admin can add and change products, switch a store off and set its cut, and read purchases and refunds; support and reviewer are refused.
- [x] With no keys, every store route answers `store_not_configured`.
- [ ] Against the real Google Play and App Store: NOT RUN (no credentials; the owner's setup list above).
- [ ] Apple's certificate chain check on a real signed answer: NOT RUN (the library does it; the tests stand in for it).
- [ ] The wallet specs that use the Fintava double (`credit-wallet`, `community-pass-*`): NOT RUN here by rule; GitHub runs them on the push. Their two callers now use the shared functions.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/IAP-01.md](history/IAP-01.md).
