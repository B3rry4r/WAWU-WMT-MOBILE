---
id: TIER-CARDS
title: A tier card reads like a subscription card (R-108), and a payment the store refused is told as refused, not as no store
owner: YOU
area: VERIFY
order: -10970
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-108, R-94, R-86, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# TIER-CARDS · The tier card, and the declined payment

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/TIER-CARDS` on `origin/wmt/TIER-OFFER-ALL` `533043aa`. App only: no Hub change, no `package.json`, `app.json` or native change; fingerprints unchanged (Android `c2474bd9`, iOS `240378f1`). Status verifying, not verified. Step budget (70) was exceeded by the second item; nothing is left undone except the PHONE CHECK below.

### Item 1 · R-108, the tier card

| # | Before (`533043aa`) | After |
|---|---------------------|-------|
| 1 | one line "12 months · 3 products · 100 points · Watch live, apply" under the name, a second line for the badge and pack bonus (`tierFacts`) | one checked line for each thing (`tierItems`: length, products, points, event pass, numbered badge, pack bonus), same data and order |
| 2 | the store's price on the name row, no period | the price with "a year" under it (`periodOf`: 365 days is "a year", 30 is "a month") |
| 3 | "Subscribe to X" a separate pill under the card, the tier offer's card a Pressable | Subscribe inside the card at its foot (`TierCard` prop `action`): filled on the featured card (accent border), outlined on the others; on the offer the card is a plain View so the lines and the button are each reachable by a screen reader |
| 4 | the tiers sheet drew the cards in a fixed sheet | the same card as a choice (radio, accent edge and tint); title, blurb and cards scroll above Continue (`LIST_SHARE` 0.6 of the screen) so three taller cards fit a short phone |
| 5 | skeletons 92 and 150 high | 200 (sheet) and 280 (offer), the height of a card |

Files: `src/features/verify/TiersScreen.tsx` (`TierCard`, the one card), `src/features/verify/purchaseModel.ts` (`tierItems`, `periodOf` replace `tierFacts`), `src/features/tier-offer/TierOfferScreen.tsx`, `DECISIONS.md` (R-108).

Assertions updated (each named): `src/features/tier-offer/__tests__/tierOffer.route.test.tsx`, test "a person can see the three tiers with a Subscribe each...": the three `getByLabelText(/Verify, .*\$2\.99/)`, `/Verify Plus, .*\$5\.99/` and `/Founding Maker, .*\$9\.99/` (they read the old grouped card label) now read, for each card, its name, `tier-price-*`, `tier-period-*` ("a year"), each item as its own `tier-item-*` line, no "·", and the Subscribe inside the card (`within(card)`). No other test pinned the dot line (`tierCheckout.test.tsx`, `tierOfferStore.route.test.tsx` read `tier-price-*` and the checkout, unchanged and green).

### Item 2 · a declined payment (lead, 30 Oct 2026)

The owner bought Founding Maker on his Android phone; Google declined the payment (insufficient balance) and the app said "Google Play is not available on this phone right now". Cause, read from the libraries, not guessed:

- Google's `BillingResponseCode.ERROR` (6) is mapped by openiap-google 4.0.3 `OpenIapErrorExtensionsKt.fromBillingResponseCode` to `OpenIapError.BillingError`, whose code is `ErrorCode.ServiceError` = `service-error`; `SERVICE_UNAVAILABLE` (2) maps to `ServiceUnavailable`, also `service-error` (read from the published AAR `openiap-google-4.0.3` and `openiap-core-4.0.3` class files with `javap`). expo-iap's own table agrees: `node_modules/expo-iap/src/utils/errorMapping.ts` lines 63 (2) and 67 (6). `ErrorCode.ServiceError` is at `node_modules/expo-iap/src/types.ts` line 519.
- A payment Google declined for funds also carries the sub-response code `payment-declined-due-to-insufficient-funds` (`BillingResultConvertersKt.toOpenIapSubResponseCode`, expo-iap `types.ts` line 1952), delivered to JS as `subResponseCodeAndroid` (`src/utils/nativeError.ts` lines 113 to 116).
- `src/features/store/iap.ts` `causeOf` listed `service-error` in `UNAVAILABLE`, so it became `store_unavailable`, whose words are "Google Play is not available on this phone right now ...".

| # | Before | After |
|---|--------|-------|
| 1 | a refused payment read as `store_unavailable` ("not available on this phone") | new cause `declined` (`StoreCause`, `PurchaseResult`, `fromCause`); the words in `storeDeclinedLine`: "Google Play didn't take the payment. You weren't charged. Check your payment method in Google Play, then try again." and "The App Store didn't take the payment. You weren't charged. Check your payment method in the App Store, then try again." on an iPhone |
| 2 | `service-error` while buying was `store_unavailable` | while BUYING it is `declined`; the sub-response code `payment-declined-due-to-insufficient-funds` is `declined` whatever code carries it (`causeOf(code, sub, 'buy')`) |
| 3 | `service-error` asking for prices or restoring | unchanged: still `store_unavailable` (the store could not be reached); `causeOf` defaults to step `ask` |
| 4 | a declined buy kept its intent bound | the intent is let go like a cancelled one (nothing was bought) |

Code moved: only `service-error`, out of `UNAVAILABLE`, to `declined` in the buy step and to `store_unavailable` in the ask step (so no ask behaviour changed). These stay `store_unavailable`, by test: `billing-unavailable`, `iap-not-available`, `service-disconnected`, `feature-not-supported`, `not-prepared`, `init-connection`, `connection-closed`, `activity-unavailable`. Every screen that shows a store cause reads `said()` in `src/features/store/words.ts` (the checkout, the points buy, the unlock, tip, question and pass sheets all go through `useStoreBuyer`), so all of them show the new words; the one place the old words are written is `storeUnavailableLine`. `src/features/store/testing/fakeIap.ts` gained an optional `sub` on its error step (test double only).

Red first: `src/features/store/__tests__/declined.test.tsx` before the code change: 4 failed (service-error and the sub code gave `store_unavailable`, the App Store words did not exist, the checkout showed the old words), 2 passed (the guards for the codes that stay and for the ask step). After: 6 of 6.

### Pictures (owner hard rule 1)

The web export has no store, so `src/app/preview/tier-cards.tsx` is a `__DEV__`-only route (`LeaveDevRoute` in a release build, listed in `route-guard.test.tsx`): `?view=offer`, `?view=choose`, `?view=declined` (the checkout, `CheckoutReady` extracted from `CheckoutScreen` so the preview draws the same body, with the declined note). Sample store prices "₦2,999.00 / ₦5,999.00 / ₦9,999.00" and plans of the `GET /plans` shape. 390 px wide, device scale 2, in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/tier-cards-b/shots/`:

- `offer-dark.png`, `offer-light.png` (the tier offer's cards)
- `choose-dark.png`, `choose-light.png` (the Settings tiers sheet's choice)
- `declined-dark.png`, `declined-light.png` (the checkout with the declined note)
- before: the owner's phone picture `/root/.claude/uploads/f6abda14-ea52-5aeb-b102-78d31cb7857d/58487d9c-image.jpg`; VF5 rendered with `python3 scripts/design/render_design.py VF5` to `build/design_shots/VF5-dark.png` and `VF5-light.png` (in the worktree, not committed).

VF5 itself still draws the old dot line and its sheet title; R-108 overrides it, so the pictures are the new card beside the old one, not a match.

### Production bundle

`expo export --platform web` (NODE_ENV production) into the scratchpad `tier-cards-b/dist`, served by a single-page server and driven by Playwright (`tier-cards-b/prod.py`, log `prod.log`): `/preview/tier-cards?view=offer`, `?view=choose` and `?view=declined` each land on `/welcome` and draw no sample price, no "Subscribe to", no "Tapped:" and no declined note. The route returns `<LeaveDevRoute />` before it reads a param when `__DEV__` is false, and the gallery's code ("Tapped: ") is not in the production bundle; the sample plan names (for example "Maker Pass, priority") are one module-level constant that the bundle still carries and nothing can reach, as with the other preview routes.

## PHONE CHECK (needs a real phone)

The Android phone's own Google Play sheet and a real insufficient-funds decline (the words come from the code above, not run on a device); the sheet's scroll on a short phone; TalkBack reading each tier's lines and its Subscribe separately.

## Read first

- `docs/WORKFLOW.md`, `DECISIONS.md` R-86, R-94, R-105, R-108
- `src/features/verify/TiersScreen.tsx`, `src/features/tier-offer/TierOfferScreen.tsx`, `src/features/store/iap.ts`, `src/features/store/words.ts`

## Goal

A tier reads like a subscription card, with its items as separate lines and its Subscribe inside it; a payment the store refuses is told as refused.

## Scope

`wawu-wmt-mobile` only: the files named above, `src/features/verify/CheckoutScreen.tsx` (`CheckoutReady`), `src/features/store/` (`iap.ts`, `buy.ts`, `model.ts`, `words.ts`, `testing/fakeIap.ts`), `src/app/preview/tier-cards.tsx`, `src/__tests__/route-guard.test.tsx` (one row), tests, `DECISIONS.md`, `docs/LOG.md`, `tasks/INDEX.md`.

## Capability checks

- [x] A user can read each tier's items as separate lines (`tier-item-<id>-<n>`), sees each price and "a year", and taps Subscribe inside the card to reach the same store checkout (`tierOffer.route.test.tsx`, `tierOfferStore.route.test.tsx`).
- [x] A user can choose a tier on the Settings sheet and continue, as before (`tierCheckout.test.tsx`).
- [x] A user whose payment Google declined sees "Google Play didn't take the payment. You weren't charged..." on the checkout, never "not available on this phone" (`declined.test.tsx`).
- [ ] On a phone: NOT RUN (no device in this session).
