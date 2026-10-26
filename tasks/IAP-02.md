---
id: IAP-02
title: Points, WAWU Credits, ticks and tiers, and community passes are bought in the store sheet (Google Play Billing, Apple In-App Purchase); no wallet or naira path for them in the app
owner: YOU
area: APP
order: -10202
priority: launch
repo: all
type: mobile-screen
status: review
depends_on: []
decisions: [R-86, R-27, R-29, R-47]
passes: [V1, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# IAP-02 · Buying in the store sheet

## Current state

As of 25 Oct 2026, built by a Sonnet builder (bundle B28, T2, a native module), mobile `wmt/IAP-02`, first on `origin/main` `b1e6681f` and merged up with `origin/main` `7f406395` and then `fd47cb0a` for the first store build (merge agent IAP-02-MERGE, 25 Oct 2026; two merge commits, no rebase). The Hub half is already on backend main (IAP-01 merged by `99322c3`): `GET /store/products` and `POST /store/purchases` are in main's contract files, which this branch now uses unchanged. Status review. IAP-03 (builder IAP-03, 25 Oct 2026, on this branch; backend `wmt/IAP-03` `04d5069`) adds rows 9 to 11 below and the owner's table of store products; IAP-03 round 2 (builder IAP-03 r2, 25 Oct 2026; backend `wmt/IAP-03` `25a2edf`) answers the verifier's FIX in row 12 and rules that a pass is bought once (below). (Verifier PASS on `fa7848d0` before the merge: no medium or worse; four lows, two test-gap notes and the VF13 question, see history). This ships in the next STORE build, not over the air: `expo-iap` 6.1.1 is a new native module, so the runtime fingerprint changed (Android `2e0e4d998b156d1c3ed97cb963577318e6a91a18`, iOS `240378f19fb16a59d3be716e17e283dc02166f7a`; main's Android is `17ffb13d520882bf144982b61d03f3994c6e40e4`).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Buy points paid a pack from the wallet or by bank transfer (PIN, Bank charge, naira prices) | the Hub's packs at the STORE's own price; Pay opens the store sheet; the points are added once the Hub has checked the purchase with the store |
| 2 | The Studio shortfall sheet bought exactly the missing points from the wallet (PIN, Add money, "Use wallet for AI tools" in Settings) | the sheet shows cost, balance and shortfall with Buy points and Not now; Buy points opens the store packs and the job is checked again on coming back; the Settings row is gone |
| 3 | WAWU Credits packs were paid from the wallet (quote, PIN, Bank charge) | the packs sheet (I28) lists the Hub's credit products at the store's price; I29 shows the count added and the balance |
| 4 | Ticks and tiers were paid at a checkout with a wallet, Bank charge, offer and PIN; an upgrade showed "pay only" the difference | the tiers sheet and checkout show the store's price per tier; Buy opens the store sheet; the store renews and works out an upgrade (Android names the tier it replaces); VF7 reads what the tier gives from the plan |
| 5 | A community pass was paid from the wallet with the host's naira price | the pass is a ONE-TIME 30-day store purchase for one room (IAP-03 round 2): a Google Play consumable and an App Store non-renewing subscription at the store's price; the room is carried to the Hub (Google's profile id) and kept on the phone against the transaction (App Store); renewing is buying again |
| 6 | No way to bring back a purchase | Restore purchases on the pass screen and the checkout; anything the store holds that the Hub was never given is handed over and finished when a buy screen opens |
| 7 | the Hub not open for buying showed nothing special | `store_not_configured` says plainly "Buying is not open yet"; `store_disabled` says it is paused; no store on the phone (or the web) says buying happens in the app |
| 8 | Purchases were not bound to the person (the user id went to Google, a pass's room to Apple) | every purchase carries the Hub's `accountToken` (`GET /store/products`, a stable UUID per person, never the user id): Google's obfuscated account id and Apple's app account token, on packs, tiers and passes. A pass's room rides in Google's profile id; on Apple it is kept on the phone against the transaction the store hands back, and a tier bought there is kept until the Hub has it (`roomIntent.ts`), because Apple never says whether the Hub was told, so a tier or pass paid for before the Hub was told is finished by the next recovery with its own room. New Hub answers by cause: `store_purchase_taken` (another person holds it), `store_purchase_other_room` (that pass payment belongs to another room), `store_account_token_missing` ("Update the app, then try again"), `store_grant_failed` (paid, not granted yet: left unfinished, finished by the next recovery). Nothing renews a pass, so `cancelInStore` is gone |
| 9 | VF13 "Add 5 more products" was not drawn at all (the Hub's store map had no upload-pack product, G-IAP-02-1) | the Hub has the fifth store product kind `extra_products` (backend `wmt/IAP-03`: one migration adding the enum value, `grants.extraProducts`, once per verified purchase, a refund or revocation takes the products back, the same store-server, account-token and once-only checks); VF13 offers the pack through the store sheet with the same parts as points and credits (`useStoreCatalog`, `useStoreBuyer`), at the STORE's price, beside "Upgrade instead" and "Open library"; "N more products added" and what the person can publish now come after the Hub has the purchase. While the store loads there is no price and no button; a store that is not open, or has no such pack, draws no offer |
| 10 | M16 and M17 ("Get your tick"), VF14's "Renew" and the host gate E21's "From" drew the Hub's plan price (G-IAP-02-5) | lead ruling (R-86, "at the store's price in the person's own currency"): each draws the STORE's price from the store product of the tier (the cheapest tier the store sells, the held tier, the lowest tier the refusal names), never the Hub's naira plan price; while the store is loading, not open or unavailable, no price is drawn ("Get your tick" names the tier and its length, "Renew" says Renew, E21 leaves the "From" line out) |
| 11 | the wallet purchase code R-86 made unreachable was left in the app | removed: `usePlanPurchase.ts`, `purchaseIntent.ts`, the wallet purchase calls and types in `purchaseApi.ts` (quote, purchase, purchase read; `PurchaseGrant` stays, VF7 reads it), `QuoteBreakdown`, `MethodRow`, `CopyChip` and `TransferCard` in `planParts.tsx`, `bumpLine`, `payLabel`, `shortLine`, `pinPurposeOf`, `quoteMoved`, `failedLine`, `priceIn` and the re-exports in `purchaseModel.ts`, and the "a plan" row in `payRoutes.test.ts` (9 rows to 8). `CheckRow` stays: its own test still imports it (nothing in the app does; a candidate for the sweep) |
| 12 | v-IAP-03 FIX: F1 VF13 offered "Add 5" to a person the Hub refuses after the store was paid; F2 a fan could not hold passes to two rooms at one price (one subscription per price point) and saw a false success; F2b a held transaction could be given to the room on screen; F3, F4 test gaps; F5 dead reads | F1 `packOffered`: a running tier and the pack lifts the limit, the Hub's `limitOffers` rule; F2 a pass is bought once (rows 5, 8; the Hub's subscription kind is the tier only, a refund moves later stacked periods up, the 3-day reminder reaches store passes; `cancelInStore`, `perPeriod` and `periodOf` removed); F2b the Hub refuses a held pass for another room (`store_purchase_other_room`; Google's profile id also checked on the first post) and the app hands a held pass over with its own room only (kept by transaction); I31 offers Renew again; F3 the Hub spec drives the real publishing gate before, after and after the refund; F4 screen cases for E21 "From" and VF14 Renew; F5 `Plans` no longer reads `extraProducts.priceMinor` or `checkoutBump` |

**Default (lead), owner may override (25 Oct 2026, F2):** a community pass is a ONE-TIME 30-day purchase for one room, not an auto-renewing subscription: Google and Apple let an account hold a given subscription product only once, so one subscription per price point could not cover two rooms. Store type: Google Play a one-time consumable product, App Store a non-renewing subscription, one product per price point (`wawu.pass.30.a`, `wawu.pass.30.b`, and so on, each with its `referenceKobo` in the admin map). Each verified purchase grants 30 days to the room named in it, stacking from the later of now and the room's current end; the host is credited per purchase; a refund or revocation takes back that purchase's 30 days and the host credit. Tiers stay subscriptions.

### Store products the owner must create (IAP-03)

Nothing here creates them; the ids below are suggestions, and the admin product map (`admin/store/products`) must hold the same ids the stores do. The "naira price it replaces" is the Hub's launch setting (R-65 and the admin settings defaults in `plans.config.json` / `credit-packs.ts`); the store price is the owner's to set per store and the app always shows the store's. Use the same id in Play Console and App Store Connect. Consumables are bought and consumed; a tier's subscription period must equal the Hub's days; a pass is bought once, and the Hub gives the product's `days` (30) for each purchase (`admin/store/products`).

| Suggested product id | Type | What one purchase grants | Naira price it replaces |
|---|---|---|---|
| `wawu.points.s` | consumable | 1,000 points (pack `s`) | ₦1,000 |
| `wawu.points.m` | consumable | 2,750 points (pack `m`) | ₦2,500 |
| `wawu.points.l` | consumable | 6,000 points (pack `l`) | ₦5,000 |
| `wawu.credits.starter` | consumable | 50 WAWU Credits (`starter`) | ₦500 |
| `wawu.credits.popular` | consumable | 120 WAWU Credits (`popular`) | ₦1,000 |
| `wawu.credits.pro` | consumable | 300 WAWU Credits (`pro`) | ₦2,000 |
| `wawu.more.products.5` | consumable | "Add 5 more products": 5 places on the tier held (`extra_products`, IAP-03) | ₦1,500 (R-65) |
| `wawu.tier.verify` | auto-renewing subscription, 1 year (365 days) | tier Verify: 3 products, 100 bonus points | ₦2,999 |
| `wawu.tier.plus` | auto-renewing subscription, 1 year (365 days) | tier Verify Plus: 6 products, 300 bonus points | ₦5,999 |
| `wawu.tier.founding` | auto-renewing subscription, 1 year (365 days) | tier Founding Maker: 10 products, 600 bonus points, the numbered badge and event pass | ₦9,999 |
| `wawu.pass.30.a`, `wawu.pass.30.b`, and so on (one per price point the owner offers) | Google Play: one-time consumable product. App Store: non-renewing subscription | one purchase is a 30-day community pass for the room named in it; buy again to renew (IAP-03 round 2) | no Hub default: the host sets each room's own naira price today; the owner picks the store price points and states each product's worth (`referenceKobo`) in the admin map |

The tiers' period must be one the stores sell (Play: 1 week, 1, 3, 6 months, 1 year; App Store: 1 week, 1, 2, 3, 6 months, 1 year), so a tier whose days are not one of these cannot be sold as it is.

**The three tiers are 1-year subscriptions at ₦2,999, ₦5,999 and ₦9,999** (owner, 26 Oct 2026, "All yearly"; R-89 in DECISIONS.md, TIER-YEARLY; the Hub's tiers are 365 days each at those prices). They were 1 month at ₦1,000, 6 months at ₦3,000 and 1 year at ₦5,000. All three products are created with a 1-year period, which equals the tier's 365 days. VAT, taxes and the store's own price steps can make the final price a store shows differ from these naira figures, and nobody can know it exactly in advance: set each product's price in each store as close to the figure as the store allows, and the app always shows the store's price. If a product's `referenceKobo` is set in the admin map it should read the new figure (299900, 599900, 999900); left empty, the Hub uses the plan's price.

### The order of a purchase (`src/features/store`)

The store sheet takes the payment; the store transaction goes to `POST /store/purchases` (Google Play: `purchaseToken`; App Store: `transactionId`; a pass also `communityId`); only a 201 finishes it (a pack or a pass is consumed, a tier acknowledged). Any other answer leaves it open, so the store gives it back and the Hub, which grants once per store transaction, answers `alreadyGranted: true`.

| Stops with | Said as |
|---|---|
| cancelled in the sheet | "Cancelled. You were not charged." Nothing is sent |
| pending at the store, or `store_purchase_pending` | waiting for the store; nothing is granted; do not buy again |
| already owned | the earlier purchase is handed to the Hub and finished; if none can be, a pack says the store still has one to finish, a tier points to Restore purchases. A pass is handed over with the room it was bought for, never the room on screen: another room's is given to that room and the person buys again, one with no room known is left to the store |
| store unreachable, or the store not available | by cause, "You were not charged" only where that is true |
| the Hub not reached after the store took the payment | "still confirming, do not buy again"; left open and sent again on the next open |
| `store_purchase_taken`, `store_purchase_other_room`, `store_pass_not_available`, `store_product_unknown`, `store_purchase_invalid` | the Hub's own sentence, or a plain one |

Default (lead), owner may override: the config plugin pins the Android store to Google Play (`android.store: play`); a tier's Android offer is the base plan (the offer with no offer id); an upgrade is Google Play's "charge prorated price" replacement of the tier held, and the App Store's own subscription group does the same; a pass carries its room in Google's profile id, and on the App Store the phone keeps it against the transaction, so a payment taken before the app was closed still knows its room.

Removed in the app: the wallet routes for packs, shortfall, credits, tiers and passes (`buyPack`, `buyShortfall`, credits `buyPack`, `buyPass`, the pack and shortfall intents, `usePassPurchase`, `useBuyCredits`, `walletUseApi`), their sheets and their tests. The website and the Hub's wallet routes are untouched. VF13 "Add 5 more products" (the upload pack, R-65 ₦1,500) is also an in-app digital unlock: by lead ruling at the merge (Default (lead), owner may override) it is sold through the stores like the rest, and the Hub's store map had no such product, so the app drew no "Add 5" and no wallet path for it. Superseded by IAP-03 (row 9): the Hub change G-IAP-02-1 is made and VF13 sells the pack in the store sheet. Tests that pinned the removed behaviour were replaced, one by one, in `payRoutes.test.ts` (13 rows to 9), `settingsScreens.test.tsx` (the Use wallet block) and `studioFlow.test.tsx` (the wallet shortfall block); the screens' wallet flow tests were rewritten for the store.

The merge with main (25 Oct 2026) is recorded in [history/IAP-02.md](history/IAP-02.md), "The merge with main, as the task file held it". Checks of the build (24 and 25 Oct 2026) and the pictures: [history/IAP-02.md](history/IAP-02.md), "Checks and pictures, as the task file held them". NOT RUN anywhere: a phone, a real store sheet, the live Hub, a real purchase in Play's licence-test or Apple's sandbox.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, DECISIONS R-86
- `src/features/store/` (`iap.ts` is the only file that reaches `expo-iap`), `src/features/points/BuyScreen.tsx`, `src/features/points/JobCheck.tsx`
- Backend `src/store/` on `wmt/IAP-01` `8e7e16a`

## Goal

A person buys points, WAWU Credits, a tier or a community pass in the phone's store sheet at the store's price, and gets it once the Hub has checked the purchase with the store. The app draws no wallet or naira path for these.

## Scope

`wawu-wmt-mobile` only: `package.json`, `package-lock.json`, `app.json`, `contract/`, `src/api/schema.generated.ts`, `src/features/store/` (new), `src/features/points/` (Buy points, the shortfall sheet), `src/features/credits/`, `src/features/verify/` (tiers, checkout, VF7), `src/features/community-pass/`, `src/features/settings/` (the Use wallet row), the routes that opened them, and their tests.

## Capability checks

- [x] A user can pick a points pack, see the store's price, buy it in the store sheet and see the points added (`buyFlow.test.tsx`).
- [x] A user who cancels, whose payment is pending, who loses the connection or whose store is unavailable is told the real cause and nothing is granted or finished (`buy.test.ts`, each screen).
- [x] A user whose payment was taken while the Hub could not be reached is finished the next time a buy screen opens, once (`buy.test.ts`, `buyFlow.test.tsx`).
- [x] A user can buy WAWU Credits, a tier (and upgrade it) and a community pass in the store sheet, and bring a subscription back with Restore purchases.
- [x] A user can hold passes to two rooms at one price, and renew a pass before it ends by buying it again; a payment held for one room is never given to another (IAP-03 round 2).
- [x] A user sees "Buying is not open yet" when the Hub answers `store_not_configured`.
- [x] No buy screen draws a wallet, PIN, Bank charge or naira (asserted in each screen's test).
- [ ] On a phone, in a real store sheet: NOT RUN.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/IAP-02.md](history/IAP-02.md).

