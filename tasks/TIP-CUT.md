---
id: TIP-CUT
title: A buyer never sees what the creator receives (the tip sheet's "gets" line), and a store tip's tiles show the store's price
owner: YOU
area: MONEY
order: -1254
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [PRICE-PICKER]
decisions: [R-120, R-101, R-5, R-10, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# TIP-CUT · The creator's cut is never shown to a buyer

## Current state

As of 31 Oct 2026, built by a Sonnet builder (T1), mobile `wmt/TIP-CUT` on `origin/wmt/STORE-BUY-APP` `0d730a7a`. App code only: `app.json` and `package.json` untouched; fingerprints android `e871fe1a`, ios `e8e7de85` (unchanged).

| # | Before (`0d730a7a`) | After |
|---|---|---|
| 1 | each tip tile said "{name} gets ₦X" (85%) under the price, and its accessibility label said it | a tile is the price and nothing else; the label is the price |
| 2 | the store tip sheet's head said "{name} gets ₦X" | no subtitle (title "Tip Excel" stays) |
| 3 | on a store phone the tiles said ₦260 while the button charged "$0.99" | each tile is the store's own text for that tier (`ladder.itemFor(n).price`, the string the button shows); while the store has not priced its tiers the tiles are the loading skeleton; a tier the store sells no product for is not drawn; a store that cannot sell shows its notice and no tiles |
| 4 | `getsWords` (tips/model.ts) existed for the line | removed; `earnOf` stays (the creator's own price picker, `PricePicker`) |
| 5 | tile 72 high, two lines | 48 high, one line (the board's chip height) |

Default (lead), owner may override: row 3 (store text on the tiles) and the person-to-person lines kept (see the proof table).

### Grep proof (owner hard rule 3): every buyer-facing line that shows a payee's share or a creator's net

Searches over `src` (tests apart): identifiers (`recipientGets|creatorShare|creatorGets|earnOf|netKobo|netPayout|hostShare|sharePct|creatorEarning|payoutKobo|CREATOR_SHARE`), phrases (`gets|get|keeps|receives|earns|share|cut|payout|net|85|15%|split|commission|percent` beside a payee word), and the buyer-side folders (unlock, paid-ask, schools, community-pass, events buy, content-detail, store, credits, legal, bills, feedpay, visitor, professionals, chat).

| Hit | Where | Verdict |
|---|---|---|
| tile "{name} gets ₦X" and its label | `tips/TipSheets.tsx` Tile | REMOVED |
| sheet subtitle "{name} gets ₦X" | `tips/TipSheets.tsx` StoreTipSheet | REMOVED |
| `getsWords` | `tips/model.ts` | REMOVED (its test line too) |
| `earnOf` import in TipSheets | `tips/TipSheets.tsx` | REMOVED (still used by PricePicker) |
| "You earn ₦X a sale" | `components/PricePicker.tsx` (create price, edit details, paid-DM settings, community pass, ticket types, draft form: all the creator's own pricing) | KEPT: creator's own screen |
| "You keep 85% of every ticket" | `events/host/hostForm.ts` (host's own form) | KEPT: creator's own screen |
| Net card and host share | `events/organiser/DashboardScreen.tsx` | KEPT: organiser's own earnings |
| "Reply in 2h to earn ₦X. That's 85% of ₦Y" | `paid-answers/model.ts` (the creator answering) | KEPT: creator's own screen |
| `creatorEarning` | `paid-ask/api.ts` (fan's thread) | KEPT: typed optional and the fan's screens never read it (comment there, grep: no render) |
| `creatorSharePct` | `create/api.ts` (listing fee on the create step) | KEPT: creator's own screen |
| "They get" | `components/pay-sheet/PaySheet.tsx` (`send` variant), passed only by `chat/ChatSendScreen`, `chat/RequestPaySheet`, `send/ReviewScreen`, and the dev preview `app/preview/pay-sheet.tsx` | KEPT: person-to-person transfer amount (lead default) |
| "They get" | `wallet/fx/CryptoSendScreen.tsx`; "They receive", "what they get" `abroad/*` | KEPT: transfer amount |
| "You get" net payout | `capital/WithdrawScreen.tsx`; "You get" `points/ConvertScreen.tsx` | KEPT: the person's own money out of their own holding |
| "Your bank gets ₦X" | `withdraw/*` | KEPT: own withdrawal to own bank |
| "They get back ₦X for N days on their pass" | `community-host/model.ts` (host removing a member) | KEPT: host's screen, a refund to the member |
| "Miss it and X gets their ₦Y back" | `paid-answers/model.ts` (answerer's screen) | KEPT: a refund to the asker on the creator's screen |
| "You get a question credit" | `paid-ask/model.ts`, `professionals/ProfileScreen.tsx` | KEPT: what the buyer gets, not a cut |
| "X answered, so they've been paid" | `paid-ask/model.ts` answeredCard | KEPT: states a fact, no amount or share |
| "What you get" `schools/model.ts youGetLine` | course outcomes (certificate), no money | KEPT |
| "WAWU's fee" rows | pay sheets, capital | KEPT: a fee the buyer pays, in the breakdown (BRIEF rule 3), not a creator's cut |
| unlock, tickets, paid questions, credits, school places, community pass buyer screens | folders above | NO HIT: nothing shows a share |

Final grep after the change: `grep -rn "getsWords\|TILE_GETS\|gets" src/features/tips src/components/pay-sheet` leaves only the `PaySheet` "They get" (send) line; `grep -rn "earnOf" src` leaves `PricePicker`, `prices/model` and their tests.

### Tests changed (rulings, not a gate)

- `src/features/tips/__tests__/tipFlow.test.tsx`: "shows the six tiles ... what Tife gets (85%)" now asserts the label is only the price ("₦1,000", "₦200", "₦10,000"), no "gets/earn/keeps" text and none of ₦850, ₦170, ₦8,500. It pinned the cut the owner ruled out (R-120).
- `src/features/tips/__tests__/model.test.ts`: the `getsWords` assertions are replaced by one that the model carries no "gets/earn/share/keeps" words (the function is gone).
- `src/features/store/__tests__/ladderScreens.test.tsx` ("draws the tip list at the store's price ..."): `getAllByText(/₦425/)` (the creator's 85%) is replaced by the tiles' own store text ($1.49, $2.99, $12.99), no naira anywhere and no "gets/earn" words. It pinned the cut.
- New: `tipFlow.test.tsx` "Android back closes the wallet tip sheet"; new file `tips/__tests__/tipCut.test.tsx`, each case on Android and on iOS: tiles are the store's text, tile press selects and the button charges that tile's price, Tip press buys (intent and receipt), Android back (the Modal's `onRequestClose`) closes and buys nothing, the loading state is a skeleton with no naira, a tier the store does not sell is not a tile, a store that cannot sell draws no tiles.

## Capability checks

- [x] A tip tile is the price and nothing else; no tile, label or sheet head says what the creator gets (R-120).
- [x] On a phone with a store every tile is the store's own text for the tier (the string the Tip button charges), never naira beside a dollar button; unpriced is a skeleton, an unsold tier is not drawn.
- [x] A tile press chooses it, Tip buys it, the Android back button closes the sheet (jest on Platform.OS android and ios).
- [x] The grep of the whole `src` lists every buyer-facing payee-share line as removed or kept with why (table above).
- [x] Screenshots at 390 wide, dark and light, beside the H26 board (paths under Pictures).

## Pictures

`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/tip-cut/shots/`: `sheet-dark-vs-board.png` and `sheet-light-vs-board.png` (wallet-paid, store Android, store iOS, then the H26 board), the single shots `tip-wallet-web-{dark,light}.png`, `tip-store-ios-{dark,light}.png`, `tip-store-android-{dark,light}.png`, `tip-store-ios-loading-{dark,light}.png`, and the boards `H26-*.png`, `H28-*.png`. Method: web export, Chromium at 390 by 844 at 2x, the real `TipSheets` drawn from a made-up `TipState` through a temporary dev route (not committed), no Hub and every non-local request refused. Differences from H26 that stay by ruling: the board's Naira/Dollar/USDT switch and the typed "Other amount" are not drawn (R-64, R-101 PRICE-PICKER), the board's chips are four, the tiles are the Hub's six. Limit: the web cannot be an iPhone, so the iOS picture's "Paid with" row says Google Play; the "App Store" label on iOS is asserted in `tipCut.test.tsx` (Platform.OS ios). The H28 "Tip sent" sheet is unchanged by this task.

## PHONE CHECK (what only a real phone proves)

- On an iPhone and an Android with the store build: open Tip on a piece; every tile shows the store's price in the person's currency (the same as the Tip button), nothing under the tiles, no "gets".
- Text fit of the longest store prices (the ₦10,000 tier) in a tile on a 360-wide Android (the tile shrinks to fit; jest cannot measure it).
- The hardware back button on Android closes the sheet (jest proves the sheet's close handler).

## Read first

- `DECISIONS.md` R-120, R-101, R-5, R-10; `tasks/PRICE-PICKER.md`; `docs/designer/BRIEF.md` H26, H28.
