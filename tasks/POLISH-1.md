---
id: POLISH-1
title: Owner's two screenshots of 30 Oct (the abroad promo row, the products meter, the music button over content)
owner: YOU
area: APP
order: -1272
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-47, R-99, R-110]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# POLISH-1 · Promo rows, the products meter, the floating buttons

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/POLISH-1` on `origin/wmt/WALK-FIX` `0e437444`. App only: no `package.json`, `app.json` or native change; fingerprints must stay android `c2474bd9`, ios `240378f1`. Status verifying. **Pictures were NOT RUN** (the builder's step budget ended first): the before and after shots of the Euro tab, W1, Me with 0 and with 3 of 10 products, Create's meter and the owner's two screenshots are owed, and a verifier must take them (PHONE CHECK below).

| # | Before | After | Test |
|---|---|---|---|
| 1 | "Get paid from abroad": a 52 round blue coin (`curUsd`, via `FxFlag`), a title and two lines, a chevron, 125 high | one `PromoRow`: 40 rounded square accent tile, arrow-down-to-tray glyph, title, one line ("Share your EUR account details"), chevron, 72 high, the Wallet's 28 corner | `components/__tests__/promoRowAndMeter.test.tsx`; `wallet/__tests__/fxTabs.test.tsx` (opens the details) |
| 1b | "More than one currency": a card, a title, two lines and two buttons | the same `PromoRow`, one line ("Hold dollars, euros and crypto."), a tap opens Add a currency, a close button replaces the chevron | `fxStrip.test.tsx`, `worldHome.test.tsx` |
| 1c | Voice entries (Hear your name, Voice Intro): a 44 round tile, 76 high | the same `PromoRow` (`EntryRow` now wraps it) | `verify/__tests__/entryRow.test.tsx` (unchanged, passes) |
| 2 | "0 of 10 products" and "Founding Maker · ends 30 Oct 2027" on one line over a hairline bar | the card: "Products" and the tier chip, "0 of 10" (22/700 tabular), a 6 high rounded bar (sunken track, accent fill), "Renews 30 Oct 2027" (`state` active) or "Ends 30 Oct 2027" (`state` ending) | `promoRowAndMeter.test.tsx`; `dv2-comp.test.tsx`; `me/__tests__/tierAndDrafts.test.tsx`; `create/__tests__/create.test.tsx` |
| 3 | the theme button above Create (130 above the foot), tab scrolls ending 30 to 32 above the bar | the theme button beside Create on its line; scrolls end 90 (creator) or 83 (anyone else) above the bar | `__tests__/floatingRoom.test.tsx`; the Today, Explore, Me and Wallet room assertions |

### Renews or Ends: which field decides
`MyTierView.state` (`GET /me/tier`): `active` reads "Renews", `ending` reads "Ends"; `activeUntil` is the date, read in Lagos time with the year when it is not this year. The Hub carries no auto-renew flag; its own doc says a tier is an auto-renewing store subscription (`isSubscriptionKind`, `store-grants.ts`), and `ending` is the last days of a term. Gap: a tier granted without a store subscription (an access code, a claim) also reads "Renews" while `active`. A `renews` boolean on `MyTierView` would end the guess (BACKEND_GAPS row below). Default (lead), owner may override.

### Where the floating buttons stand
The theme button (R-99) moved from above Create to Create's left on the same line (right edge at Create's left edge less 12; centres on one line); with no Create (Wallet, a non-creator) it takes Create's place. The zone is one row high, so the room under every tab's last block is Create's top plus 16 clear: 90 above the bar for a creator, 83 for anyone else (`src/components/floating.ts`, `useFloatingRoom`). Today, Explore, Inbox (Create only), Me and Wallet use it. Home's Following and For you feed is a full-bleed pager with no scroll content to pad, and is unchanged.

### Screens changed
Wallet Euro and every other currency tab (W2) and a world wallet (WorldHome): "Get paid from abroad". Wallet W1 (naira) and the tabs' top: "More than one currency". Me (M1): the meter, the Voice Intro row, scroll room. Create (M19): the meter. Publish (VF15): the meter. Your uploads meter (`AllowanceMeter` on the creator dashboard and library). VF2 (Your shop): "Hear your name". Home Today, Explore, Inbox: scroll room only. Left as they were, already on-palette: Explore's doors card (a 40 rounded accent tile, its own board row), "Other ways to add money" (a grouped list of `ListRow`), the setup checklist, the Capital row, "Complete your account" (a warning flag, not a promo).

### Changed assertions (a test that pinned the old look)
- `dv2-comp.test.tsx`: the five ProductsMeter component tests now read "2 of 3", "0 of 3", "4 of 3" and the chip and "Renews 26 Nov" (they read "2 of 3 products" and "Verify · ends 26 Nov"); the products-meter preview test reads "2 of 3", "0 of 3", "3 of 3", "0 of 1"; the 22 `productsMeterCaption` date tests are now `productsMeterRenewal` with the same dates and "Ends ..." (same day and year rules; the function is renamed and the tier name left out of it); "draws nothing with no allowance" checks "Products" instead of /products/.
- `me/__tests__/tierModel.test.ts`: `productsMeterOf` returns `{ used, allowed, tier }` (it returned `caption`); two tests rewritten, one added (Renews versus Ends).
- `library/__tests__/library.test.tsx`: "a person who holds a tier is shown the tier's own count" reads "3 of 3", the chip and "Renews/Ends" (it read "3 of 3 products" and "Verify · ends").
- `me/__tests__/tierAndDrafts.test.tsx`: three tests read "2 of 7", "9 of 9", the chip and the renewal line by test id.
- `create/__tests__/create.test.tsx`: two tests read "2 of 3", the chip, "Renews 26 Nov", the new accessible name, and "5 of 8" with "Ends".
- `wallet/__tests__/fxStrip.test.tsx` (2) and `wallet/world/__tests__/worldHome.test.tsx` (1): the note's line is "Hold ..." (it was "You can also hold ..."), with "and more" after three.
- `music/__tests__/musicButton.test.tsx`: "for a creator it stands above Create" now asserts beside Create, on its line, a gap to its left.
- `home/__tests__/HomeScreen.test.tsx`: anyone else's Today ends 83 under the rail (it was the board's 32). `explore/__tests__/screens.test.tsx` (three cases): the scroll ends 90 for a creator and 83 for anyone else (it was 30).
- Added, not changed: `promoRowAndMeter.test.tsx`, `floatingRoom.test.tsx`, a Me and a Wallet room test.

### PHONE CHECK
The corners and the music button's place over a real phone's bottom bar and gesture area; the close button's tap size on the currency note.

### Pictures owed (hard rule 1)
390 px dark and light, before and after, each beside the owner's two screenshots (`/root/.claude/uploads/f6abda14-ea52-5aeb-b102-78d31cb7857d/8409a6b8-image.jpg` and `34ba22c2-image.jpg`): the Euro tab, W1 (naira), Me with 0 products and with 3 of 10, Create's meter.

## Read first
- `DECISIONS.md` R-110, R-99, R-104

## Capability checks

- [x] A user can read "Get paid from abroad" (title and one line) on a currency tab and tap it to open the account details (`promoRowAndMeter.test.tsx`, `fxTabs.test.tsx`).
- [x] The abroad row has no colour outside the theme: no `curUsd` blue, the tile is the accent tint (`promoRowAndMeter.test.tsx`).
- [x] A user can tap "More than one currency" to add a currency, or the close button to put it away, and the two taps are separate (`promoRowAndMeter.test.tsx`, `fxStrip.test.tsx`).
- [x] A user reads "0 of 10", the tier chip and "Renews 30 Oct 2027" on the meter, and "Ends ..." once the tier is ending (`promoRowAndMeter.test.tsx`, `tierAndDrafts.test.tsx`, `create.test.tsx`).
- [x] The theme button and Create never overlap, and each tab's scroll content ends clear of both (`floatingRoom.test.tsx`; Today, Explore, Me and Wallet room assertions).
- [ ] Pictures (390 px, dark and light, before and after, beside the owner's two screenshots): NOT RUN, owed to a verifier.
- [ ] On a phone: NOT RUN (no device in this session).
