---
id: STORE-BUY-APP
title: In the Android and iOS apps, a piece, a tip, a community pass and a paid question are store purchases on the price ladder (R-101)
owner: YOU
area: IAP
order: -1257
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [STORE-BUY-HUB, STORE-QUESTION, PRICE-PICKER, IAP-02]
decisions: [R-101, R-86, R-27, R-29, R-47, R-5]
passes: [V1, V4, V5, V6, V8, V9]
artboards: []
tier: T2
---
# STORE-BUY-APP · Unlocking a piece, a tip, a community pass and a paid question are store purchases

## Current state

As of 28 Oct 2026 (patch rounds 1 and 2 below). Built by Sonnet builders (T2, one stopped by a container restart and carried on): branch `wmt/STORE-BUY-APP` (mobile only, JS only) from `origin/wmt/PACK-CAP-IAP` `2e10ae3f` (which holds IAP-02 and `expo-iap`), merged with `origin/main` `ee974557`. The pushed head is named in the hand-back. Status verifying. No backend change: the Hub side is STORE-BUY-HUB (intents, purchases, credits), STORE-QUESTION and STORE-SALE-NOTICE.

- **Part A, the lineage catches up with main.** Merge commit `9b97254a`. Fifteen files conflicted and both sides were kept: main's screens (POINTS-BOUGHT blurb, THEME-MUSIC settings rows, PACK-CAP wallet rounds, events host test) and the lineage's store code. The wallet purchase code R-86 removed stays removed (`usePlanPurchase.ts`, the buy screens' wallet calls, the Use wallet switch). `contract/` and `src/api/schema.generated.ts` are from backend main `36279a4` (`npm run api`); `PROGRESS.md` and `INDEX.md` are regenerated. Fingerprints on the merge: android `c2474bd9` and ios `240378f1`, equal to the store builds (see Checks).
- **Part B, the ladder.** `src/features/store/ladder/` (`api.ts` intents, prices and credits; `memory.ts` the intent kept against the store's transaction; `useLadder.ts`; `usePrice.ts`; `StoreBuySheet.tsx`, the pay sheet's head, rows and button built from the same parts for a store purchase). `buy.ts` gains `purchaseLadder`; `useStore.ts` gains `buyLadder` and a recovery on resume.
- **The order, for every kind (content, tip, pass, question):** `POST /store/intents {platform, kind, target, listPriceNaira}` (nothing is charged; the Hub may refuse here) then the store sheet for `wawu.buy.<naira>` with the intent's account token (`appAccountToken` on iOS, `obfuscatedAccountId` on Android) then `POST /store/purchases {intentId, receipt or token}` then the store transaction is finished only after the 201. Any other answer leaves it open.
- **Restore:** the intent is kept on the phone against the store's transaction at once. An unfinished transaction found at app start, on a screen opening, or when the app comes back to the front is posted again with its intent; one with none kept is posted as it is and the Hub makes a credit (a late sale). A recovery never runs while a purchase is being made (it would post the new payment without its intent).
- **Credits:** an open `StoreCredit` that covers the price is offered first ("Use your credit", `payWith: credit`, no store sheet). A question credit (`scope: question`) pays only for a question at that price or less; an unscoped credit never pays for a question, and a question credit never pays for a piece, tip or pass. Credits are never shown as cash ("It can not be turned into cash").
- **Hub answers shown:** a grant (H16 / H28 / the thread opens / the pass), a credit (a late sale, told as a credit and never as an unlock), and each refusal in the app's own words (`price_not_on_list`, `store_intent_price_changed`, `store_intent_target_not_found`, `store_product_unknown`, `store_credit_*`, `store_intent_not_payable` with the Hub's sentence), all before any store sheet opens, so "You were not charged" is true.
- **Receipts say what was paid at the store:** the tip receipt reads "{store price} sent to Chidi" (never the list price, R-101 point 10) and "Tip sent to Chidi" when a credit paid. The ask sheet's head carries no tick (the store sheet has no reply line to hang it on).
- **Prices shown are the store's** (`GET /prices` `storePriceNaira`, then the store's own text in the person's currency). A price the store has no product for draws no price and no buy button. The app never draws the website's price and never says buying elsewhere is cheaper (R-101 point 10). The feed, the detail page and the tip tiles read the same.
- **Notification kinds:** `pass_sold`, `question_answered` open the earnings screen; `question_credit` opens the Inbox (not a wallet screen: the credit is not money). `sale` and `tip_received` were mapped already. Icons are existing ones.
- **Stays on the wallet (R-101 point 3):** event tickets, school fees, legal fees, sending, add money, withdraw. The website and the web export keep the wallet for all four kinds: on the web `useLadder` is off and the three flows are the wallet's (a test pins that no ladder call is made).
- **Stale mock removed (CI failure seen on `9b97254a`):** `src/features/music/__tests__/settingsMusic.test.tsx` mocked `@/features/points/walletUseApi`, a module the lineage removed (R-86: the Use wallet switch is gone). Only that `jest.mock` block was dropped; nothing else in the file fed it and every assertion is kept (6 pass).
- **Tests changed by the rulings, not to pass a check:** `professionals/__tests__/routes.test.tsx` P2 asserted the wallet ask sheet's `ask-title`; on a phone the ask sheet is the store's, so that one assertion is now `getByText('Ask Funmi')` (still the sheet for Funmi; the file's Back tests need the phone platform, so it does not run as the web). The wallet-path suites (`unlockFlow`, `tipFlow`, `askFlow`, `FeedScreen`, `contentDetail`) import `store/testing/webPath` so they run as the web, which keeps the wallet; `community-pass/pass.test.tsx` was rewritten for the ladder (the pass is `wawu.buy.<naira>`, not `wawu.pass.30.*`).
- **Gap rows (R-29, nothing here is drawn by a board):** G-STORE-BUY-APP-1 to -9 in `BACKEND_GAPS.md`.
- **Patch round 1 (verifier on `c264d189`, 28 Oct 2026):** F1 (medium, R-101 point 10): every place that drew the LIST price where a question or piece is entered now reads `useShownPrice().forKobo`: the store's price on a phone with a store, no price where no rung sells it (never "Free"), the list price on the web; a creator's own screens keep the list price. Places: the message and ask-a-question buttons (feed card, a professional's page, a visitor's page), the paid thread's composer and follow-up offer, a visitor's Services line, the search result row, the directory row, the course row on a piece, and the card's refund line (a question credit on a phone, not money back). F2: the intent is kept before the store sheet opens (`sheet:<product>`, 24 h), so a kill there restores into the goods; a cancel lets it go. F3: on iOS the held list is read before the sheet opens, so an earlier unfinished payment is handed over, never bought twice. F4: a `store_credit_*` refusal reads the credits again. F5: the orphan "G-POINTS-07-1" comment is gone. One test each (`store/__tests__/listPrice.test.tsx`, `ladder.test.ts`, `ladderScreens.test.tsx`; the card, profile, directory, visitor and thread tests now expect the store price). Existing assertions that pinned the list price on a phone were updated to the store price: `ProfessionalMessage`, `professionals/routes` P2, `professionals/screens` P1, `VisitorProfileScreen` (two), named here.
- **Patch round 2 (verifier on `a4b772ee`):** F1 rest: the locked price in a creator card's strip (`workTile`), the price under a Saved piece (`metaOf`) and the caption of a locked tile on a visitor's Content grid (`visitorTileOf`) read the store's price on a phone, or none; the owner's own grid keeps the list price. F7 (R-101 point 6): on a phone a missed reply is a question credit in the creator's own window: the professional page ("Funmi replies within 24 hours, or you get a question credit.") and the thread's waiting card ("If Funmi does not reply in time, you get a question credit."; after the deadline "You get a question credit."); the web keeps its words. G-STORE-BUY-APP-8 closed: the thread stamp on a phone is "Paid", with no figure. F3 on iOS: `owned()` also reads StoreKit's unfinished transactions (`getPendingTransactionsIOS`, which lists consumables that `getAvailablePurchases` never does), a transaction the store has not cleared comes back `pending` (Buy waits, nothing posts it), and Restore reads them too. Tests: `listPrice.test.tsx` (workTile, metaOf, visitorTileOf, F7 words), `ladder.test.ts` (3 iOS cases with `getPendingTransactionsIOS` mocked as expo-iap 6.1.1 returns `PurchaseIOS[]`), `askFlow.test.tsx` (thread, native). Pinned assertions updated to the ruling: `professionals/routes` P2 (the promise line), `saved` M30 (price), `VisitorProfileScreen` L1 (caption).
- **Not run:** a real store purchase (no Play Console or App Store Connect account here, so `wawu.buy.*` products are not on a shelf), a phone, `eas` (owner rule).
- **Open findings:** none known. Lows go to the sweep.
- **Next:** the verifier; then STORE-PAYOUT (the creator's payout three working days after a store sale) is independent.

## Read first

`DECISIONS.md` R-101 (the lead's record, `docs/`), R-86, R-27, R-29, R-47; `tasks/IAP-02.md`, `tasks/PACK-CAP.md`, `tasks/STORE-BUY-HUB.md`, `tasks/STORE-QUESTION.md`, `tasks/PRICE-PICKER.md`; backend `contract/openapi.json` (`/store/intents`, `/store/purchases`, `/store/credits`, `/prices`) and `docs/contract/WALLET.md`.

## Goal

In the Android and iOS apps, unlocking a piece, a tip, a community pass and a paid question are store purchases on the R-101 ladder (`wawu.buy.<naira>`), shown at the store's price, finished only after the Hub's 201, restored when unfinished, and paid with a store credit first when the person holds one that covers the price. The website and the web export keep the wallet.

## Scope

Mobile `src/features/store/` (the ladder, `buy.ts`, `useStore.ts`, the test stand-ins `testing/fakeHub.ts` and `testing/webPath.ts`), `src/features/unlock/`, `src/features/tips/`, `src/features/paid-ask/`, `src/features/community-pass/`, `src/features/content-detail/`, `src/features/feed/`, `src/features/prices/`, `src/features/notifications/`, `src/features/push/routes.ts`, and the records. No fenced file is edited except the contract sync of part A (SHARED-CHANGES, STORE-BUY-APP #1). No new route file.

## Capability checks

- [x] For each kind the order is intent, store sheet, post, finish; the finish never happens before the 201 (`store/__tests__/ladder.test.ts`).
- [x] An unfinished transaction found at start or on resume is posted again with its intent; one with none kept becomes a credit (late sale); no recovery runs during a buy.
- [x] A credit that covers the price is used without the store sheet; a question credit is refused for a piece, a tip and a pass; an unscoped credit is refused for a question; one worth less than the price is not offered.
- [x] Each Hub refusal is shown in words before any store sheet opens; a late sale is told as a credit.
- [x] The screens show the store's price and never the list price, a wallet, a PIN or a bank charge (`store/__tests__/ladderScreens.test.tsx`, 20 tests).
- [x] The web export keeps the wallet path (the three flows, nothing on the ladder asked).
- [x] The three new notification kinds are mapped (`everyKind`, `routes`).
- [ ] A real store purchase on a phone: NOT RUN (no store account; the verifier cannot either).

## Checks

The EXIT lines, the picture paths and the fingerprints are in the hand-back and in `docs/LOG.md`.

## History

None yet.
