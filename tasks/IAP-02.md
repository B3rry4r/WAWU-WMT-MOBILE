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

As of 25 Oct 2026, built by a Sonnet builder (bundle B28, T2, a native module), mobile `wmt/IAP-02`, first on `origin/main` `b1e6681f` and merged up with `origin/main` `7f406395` and then `fd47cb0a` for the first store build (merge agent IAP-02-MERGE, 25 Oct 2026; two merge commits, no rebase). The Hub half is already on backend main (IAP-01 merged by `99322c3`): `GET /store/products` and `POST /store/purchases` are in main's contract files, which this branch now uses unchanged. Status review (verifier PASS on `fa7848d0` before the merge: no medium or worse; four lows, two test-gap notes and the VF13 question, see history). This ships in the next STORE build, not over the air: `expo-iap` 6.1.1 is a new native module, so the runtime fingerprint changed (Android `2e0e4d998b156d1c3ed97cb963577318e6a91a18`, iOS `240378f19fb16a59d3be716e17e283dc02166f7a`; main's Android is `17ffb13d520882bf144982b61d03f3994c6e40e4`).

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | Buy points paid a pack from the wallet or by bank transfer (PIN, Bank charge, naira prices) | the Hub's packs at the STORE's own price; Pay opens the store sheet; the points are added once the Hub has checked the purchase with the store |
| 2 | The Studio shortfall sheet bought exactly the missing points from the wallet (PIN, Add money, "Use wallet for AI tools" in Settings) | the sheet shows cost, balance and shortfall with Buy points and Not now; Buy points opens the store packs and the job is checked again on coming back; the Settings row is gone |
| 3 | WAWU Credits packs were paid from the wallet (quote, PIN, Bank charge) | the packs sheet (I28) lists the Hub's credit products at the store's price; I29 shows the count added and the balance |
| 4 | Ticks and tiers were paid at a checkout with a wallet, Bank charge, offer and PIN; an upgrade showed "pay only" the difference | the tiers sheet and checkout show the store's price per tier; Buy opens the store sheet; the store renews and works out an upgrade (Android names the tier it replaces); VF7 reads what the tier gives from the plan |
| 5 | A community pass was paid from the wallet with the host's naira price | the pass is a store subscription at the store's price; the room is carried to the Hub and to the store |
| 6 | No way to bring back a purchase | Restore purchases on the pass screen and the checkout; anything the store holds that the Hub was never given is handed over and finished when a buy screen opens |
| 7 | the Hub not open for buying showed nothing special | `store_not_configured` says plainly "Buying is not open yet"; `store_disabled` says it is paused; no store on the phone (or the web) says buying happens in the app |
| 8 | Purchases were not bound to the person (the user id went to Google, a pass's room to Apple) | every purchase carries the Hub's `accountToken` (`GET /store/products`, a stable UUID per person, never the user id): Google's obfuscated account id and Apple's app account token, on packs, tiers and passes. A pass's room rides in Google's profile id; on Apple the room, and any subscription bought, is kept on the phone until the Hub has it (`roomIntent.ts`) because Apple never says whether the Hub was told, so a tier or pass paid for before the Hub was told is finished by the next recovery with its room. New Hub answers by cause: `store_purchase_taken` (another person holds it), `store_account_token_missing` ("Update the app, then try again"), `store_grant_failed` (paid, not granted yet: left unfinished, finished by the next recovery). A removed member whose pass answers `cancelInStore` is told to cancel it in the store |


### The order of a purchase (`src/features/store`)

The store sheet takes the payment; the store transaction goes to `POST /store/purchases` (Google Play: `purchaseToken`; App Store: `transactionId`; a pass also `communityId`); only a 201 finishes it (a pack is consumed, a subscription acknowledged). Any other answer leaves it open, so the store gives it back and the Hub, which grants once per store transaction, answers `alreadyGranted: true`.

| Stops with | Said as |
|---|---|
| cancelled in the sheet | "Cancelled. You were not charged." Nothing is sent |
| pending at the store, or `store_purchase_pending` | waiting for the store; nothing is granted; do not buy again |
| already owned | the earlier purchase is handed to the Hub and finished; if none can be, a pack says the store still has one to finish, a subscription points to Restore purchases |
| store unreachable, or the store not available | by cause, "You were not charged" only where that is true |
| the Hub not reached after the store took the payment | "still confirming, do not buy again"; left open and sent again on the next open |
| `store_purchase_taken`, `store_pass_not_available`, `store_product_unknown`, `store_purchase_invalid` | the Hub's own sentence, or a plain one |

Default (lead), owner may override: the config plugin pins the Android store to Google Play (`android.store: play`); a tier's Android offer is the base plan (the offer with no offer id); an upgrade is Google Play's "charge prorated price" replacement of the tier held, and the App Store's own subscription group does the same; a pass carries its room in the store's own fields (Google's profile id, Apple's account token) so a payment taken before the app was closed still knows its room.

Removed in the app: the wallet routes for packs, shortfall, credits, tiers and passes (`buyPack`, `buyShortfall`, credits `buyPack`, `buyPass`, the pack and shortfall intents, `usePassPurchase`, `useBuyCredits`, `walletUseApi`), their sheets and their tests. The website and the Hub's wallet routes are untouched. VF13 "Add 5 more products" (the upload pack, R-65 ₦1,500) is also an in-app digital unlock: by lead ruling at the merge (Default (lead), owner may override) it is sold through the stores like the rest, and the Hub's store map has no such product, so the app draws no "Add 5" and no wallet path for it; the sheet keeps "Upgrade instead" and "Open library", and the Hub change needed is G-IAP-02-1. Tests that pinned the removed behaviour were replaced, one by one, in `payRoutes.test.ts` (13 rows to 9), `settingsScreens.test.tsx` (the Use wallet block) and `studioFlow.test.tsx` (the wallet shortfall block); the screens' wallet flow tests were rewritten for the store.

### The merge with main (25 Oct 2026)

| Main changed | Carried into the store versions |
|---|---|
| tier checkout (VF6): fee breakdown (price, Bank charge, WAWU's fee, Total), Bank transfer only when short, method cards with the accent ring, "Add a dollar account" for a person billed in dollars | not carried: all of it is the wallet checkout. The checkout, the tiers sheet and `/tiers` are the store versions; the dollar detour to the wallet is gone (a store prices in the person's own currency) |
| VF13 upload limit sheet: "Upgrade instead" only for a higher tier that leaves room, "Open library", "Add 5 more products" kept with its wallet path (lead correction 361d2217) | the sheet is the board's with "Upgrade instead" and "Open library"; no "Add 5" and no pack payment (G-IAP-02-1) |
| VF7: the Founding badge draws the number the Hub gave it; "Record my voice" for a creator account only | carried (the store versions of `OfficialScreen` and `/tier-done` read both) |
| I28: the credit cost line ("A photo is 1 credit, a video or voice note 3") | carried onto the store packs sheet |
| M16 and M17: "Get your tick" and "Move up a tier" on the verification page | carried; the upgrade line no longer says "Pay only the difference" (the store works out what moving up costs); the plan price on that row, on VF14's Renew and on the host gate is G-IAP-02-5 |
| Legal, money, social, wallet, events | untouched by the merge (Legal fees, tips, tickets, school fees stay on the wallet, R-86) |

Tests changed at the merge, each named: `tierCheckout.test.tsx` is this branch's store version plus three carried-over cases (L-p2-4, the Founding number: shown, not yet numbered, never asked for a tier with no number); the main cases that drew the fee breakdown (M-1, 3), the Bank transfer row (fix round 1, 2), the accent ring (SWEEP-R2 VF6), the dollar account (D-1, 2) and the PIN pay of the wallet checkout were not carried because the screen they pinned is replaced; main's D-2 (creator offered "Record my voice", a fan not) is `tierDoneRoute.test.tsx`. `buyCredits.test.tsx` gains the cost-line case. `publishAndTier.test.tsx` VF13: the two cases that bought five with the PIN and the lost-answer case (all pinned the removed pack payment) and the three cases that expected the pack beside "Upgrade instead" are replaced by the cases from before the lead correction (no "Add 5", no quote, no purchase asked of the wallet; Upgrade instead; the top tier; a tier that leaves no room), the `tap` helper goes with them. Left as dead code, for the sweep: `usePlanPurchase.ts`, `purchaseIntent.ts`, the wallet purchase calls in `purchaseApi.ts`, `MethodRow`, `QuoteBreakdown` and `TransferCard` in `planParts.tsx`, and the "a plan" row in `payRoutes.test.ts`: nothing reaches them now.

### Checks (EXIT lines in the hand-back; logs under the bundle folder)

tsc EXIT 0; eslint on changed files EXIT 0; gates 0 fail; check_baseline EXIT 0; check_tasks EXIT 0; `npx expo-doctor` 21 of 21; `expo-updates fingerprint:generate` for android and ios EXIT 0. Jest: `src/features/store` (orchestration against the module's own boundary), the five screen suites, and every other suite in the folders touched, listed in the hand-back. NOT RUN: a phone, a real store sheet, the full suites, the live Hub (IAP-01 is not deployed), a real purchase in Play's licence-test or Apple's sandbox.

Pictures (390 px, light and dark, from a web export, 24 Oct 2026): Buy points, the Studio shortfall sheet, the Credits packs sheet, the tiers sheet, the checkout, the community pass and "Buying is not open yet", in the bundle's scratchpad folder `iap-02-b/shots/`. The store sheet itself cannot render on the web, and the web has no store, so the web build shows "Buy in the app"; these pictures come from a picture-only web build whose store stand-in (never committed) prices the Hub's products and is read by the same screens, over a stand-in Hub on 8570. A real store sheet: NOT RUN.

Open low: (a) the product ids the Hub holds must exist in Play Console and App Store Connect with the same ids and prices set there; nothing here creates them. (b) The App Store and Play review need a Restore purchases control and the terms of a subscription near the buy button; Restore is drawn, the terms are not (G-IAP-02-4). (c) A store transaction the Hub keeps refusing as `store_purchase_taken` replays at every launch on iOS (the brief finishes only on 201).

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
- [x] A user sees "Buying is not open yet" when the Hub answers `store_not_configured`.
- [x] No buy screen draws a wallet, PIN, Bank charge or naira (asserted in each screen's test).
- [ ] On a phone, in a real store sheet: NOT RUN.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/IAP-02.md](history/IAP-02.md).

