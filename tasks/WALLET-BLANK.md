---
id: WALLET-BLANK
title: The Wallet tab goes blank on the owner's phone, and the Wallet loses To cash, the bill tiles, the card row and the every-currency strip
owner: YOU
area: APP
order: -10950
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-27, R-47, R-103, R-104, R-106]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# WALLET-BLANK · The blank Wallet, and what the owner asked off it

## Current state

As of 30 Oct 2026, built by a Sonnet builder (T2), mobile `wmt/WALLET-BLANK` on `origin/wmt/STORE-BUY-APP` `88d0b779` (what the phones run). App only: no Hub change, no `package.json` or `app.json` change. Status review, not verified.

Owner, 30 Oct 2026, Android phone, Nuvion test system, wallet freshly opened (one Naira account, balance 0, PIN set): "I opened the wallet tab and after some time it just went blank" (the whole screen plain grey, no tab bar), and again after touching "that top section" while the page was moving. Then: "that problem on the screen on wallets is definitely with those pills at the top". The four items the owner added the same day are 4 to 6 below.

| # | Before (`88d0b779`) | After |
|---|---------------------|-------|
| 1 | the blank: the pill strip's `onLayout` and `onScroll` handlers (`src/features/wallet/fx/parts.tsx` lines 293 and 295) threw `TypeError: Cannot read properties of null (reading 'layout')` in a render, which unmounted the app (see "The blank") | the handlers read the numbers from the event when they run; the test that is red on `88d0b779` is green |
| 2 | no error boundary anywhere under `src/app`: one throw in a render unmounts the whole app and the person sees grey | `src/app/_layout.tsx` exports `ErrorBoundary` and `src/app/(tabs)/_layout.tsx` sets `unstable_settings.screenErrorBoundary`, both `ErrorScreen` (`src/components/ErrorScreen.tsx`): "Something went wrong", Try again (draws the route again), Go to Home, and a Details link with the error's name and first line (no stack). A tab screen that throws keeps the tab bar. SHARED-CHANGES WALLET-BLANK #1 |
| 3 | the cause fixed at its source | item 1's fix is at the two lines; no other handler in `src` has the same shape (every other `nativeEvent` read in the app reads the number in the handler: 54 reads listed and checked) |
| 4a | W1 drew a row of five bill tiles (Airtime, Data, Power, TV, More) under the actions; W1 on the board draws none (R-103) | `BillTiles.tsx` is deleted; W4 (loading) draws no bill shapes; every state of the tab (open, no wallet, opening, unreachable, frozen, error) draws none |
| 4b | the fifth action was "To cash" (Banknote icon, opens `/points-convert`) | the fifth action is "Bills" (Receipt icon, as Home's money card has it), opens `/bills` (S2 Pay a bill). The row is Add money, Send, Withdraw, Buy points, Bills |
| 4c | every other way into points-to-cash: the round "Convert to cash" button on Your points, the "Points you bought can't be turned into cash." note under the balance, and the referral rules line "You can convert points to cash in your wallet." | all gone; `rulesOf` no longer takes `canConvert` and `RulesScreen` no longer reads `GET /plans` for it. `src/app/points-convert.tsx` redirects to `/points`, so an old link or push lands on Your points. `ConvertScreen`, `intent.ts`, the convert calls in `points/api.ts` and their words stay in the code, unreachable, for the removal task that takes the Hub's routes out |
| 5 | W1 drew a "Who Made This? card" row (CardRow) while the Hub said cards were on; Wallet settings drew a "Cards" row; both opened `/cards` | neither is drawn, for anyone, whatever the Hub says (R-104); `CardRow.tsx` is deleted, Wallet settings' route no longer reads `GET /money/cards`, the `cards` prop and row are gone from `WalletSettingsScreen`. `src/app/cards/index.tsx`, `new.tsx` and `[id].tsx` redirect to `/wallet`. No other link into `/cards` exists (grep: the Legal chat's `./cards` is its own matter cards). The card screens stay in `src/features/cards/` |
| 6 | the pill strip listed every currency the Hub serves (Naira Dollar Euro Pound CAD Dirham Cedi Crypto + Add) whether or not the person held it | the strip is Naira, one pill per account the person has added (any state), Crypto when they hold a coin, then "+ Add" (R-106). A Naira-only person sees "Naira" and "+ Add"; with nothing to add and only Naira there is no strip. A currency picked in "+ Add" has its pill at once while it is opening (`useOpening`), then opened. `tabsOf(accounts, opening)` no longer reads what the Hub serves |

### Tests changed by items 4 to 6 (each assertion named)

| File | Assertion | Change |
|------|-----------|--------|
| `wallet/__tests__/WalletScreen.test.tsx` | `NOT_BUILT_BUTTONS` listed `'Bills'` (no Bills button in any state) | `'Bills'` removed: Bills is now the fifth action. Every state without actions still pins its exact button list, so a Bills button there still fails |
| same | `ACTION_TILES` / `ACTION_KEYS` ended `'To cash'` / `'to-cash'` | end `'Bills'` / `'bills'` |
| same | the `BILL_TILES` / `BILL_NAMES` constants and their uses in five exact button lists (W1 ready, W5, W6, every state without a balance, the width table) | removed; the lists are the actions, Points, Passes, Copy, Hide, See all and Settings only |
| same | "every button on W1 does something": To cash pushed `/points-convert` | Bills pushes `/bills` |
| same | "a user sees the five bill tiles in the canvas's order, and each opens its own bill" | replaced by "the wallet draws no row of bill tiles, and no To cash": no `wallet-bills`, no Airtime/Data/Power/TV/More/To cash button, exactly one Bills button |
| same | W4: `wallet-loading-bills` had 5 children | `wallet-loading-bills` is absent |
| same | W6: "the bill tiles stand, since they need no wallet" | "and no bill tiles (R-103)" |
| `wallet/__tests__/walletTabFlow.test.tsx` | the five actions included To cash; the five bill tiles were pressable | the actions include Bills; Airtime, Data, Power, TV, More and To cash are absent |
| `points/__tests__/pointsFlow.test.tsx` | "no Convert button and is told why" / "sees the Convert button and no note" / "the round button on the bar opens Convert to cash; Back returns" | the first two now assert no Convert button and no note for anyone (all-bought and cashable alike); the third is "an old link to /points-convert lands on Your points" (the real route file). The PT6 tests are unchanged: they mount `ConvertScreen` on `/points-convert` through a stand-in route in the test, because the real route now redirects |
| `referral/__tests__/model.test.ts`, `RulesScreen.test.tsx` | "points convert to cash in the wallet" sentence, with and without `canConvert` | the rules say "Rewards are points, never cash." and never "convert" |
| `wallet/__tests__/fxModel.test.ts` | `tabsOf(currencies, accounts)` listed every openable currency; `tabsOf(null, accounts)` was `[]`; "switched off", "opening off" cases | four tests for `tabsOf(accounts, opening)`: held accounts only, the board's order, an opening currency counts, Crypto for a coin being opened, a switched-off currency keeps its tab only with an account |
| `wallet/__tests__/fxTabs.test.tsx` | the W6 strip, "Naira, one tab for each currency the Hub serves, and Crypto" | `['Naira','Dollar','Crypto']` (the default hub holds Dollar and two coins) |
| same | "offers to open an account the person has not got" (opened the Euro tab); "says the bank did not answer" (opened the Dollar tab with the accounts read failing); "offers a person with no coin a way to get an address" (opened Crypto) | each goes through "+ Add" now (Euro picked there is opening; a failed accounts read draws no tab and the tabs come back when it reads; a coin picked in "+ Add" goes to W22). The Euro, Dollar and Crypto tabs they opened no longer exist for a person who has not added them |
| `wallet/__tests__/fxStrip.test.tsx` | "ends in a plain + Add ... the tabs before it are the same ones" listed all eight tabs | `['Naira','Dollar','Crypto']`; new: Naira-only shows exactly Naira and Add, no strip when nothing is offered, two accounts show exactly those two and Add, a picked currency's pill appears and is in front |

Not run: `src/features/points/__tests__/buyFlow.test.tsx` and tsc's `src/features/store/iap.ts` errors fail in this worktree only because its `node_modules` (a hardlink copy of `/home/user/wt/nm-mobile2`) lacks `expo-iap` (6.1.1 in `package.json`); the same two fail on `88d0b779` with the same copy. CI installs it.

## The blank

**Cause (found, with proof).** `ScrollTabs` in `src/features/wallet/fx/parts.tsx` (the strip of currency pills) kept the strip's size and scroll offset with state updates that read the event inside the update function:

- line 293, `onLayout={(e) => setView((v) => ({ ...v, width: e.nativeEvent.layout.width }))}`
- line 295, `onScroll={(e) => setView((v) => ({ ...v, x: e.nativeEvent.contentOffset.x }))}`

React Native gives a handler a pooled event and nulls its `nativeEvent` the moment the handler returns (`executeDispatchesAndReleaseTopLevel` and `SyntheticEvent.destructor` in `node_modules/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`, about lines 1295 and 16100). An update function runs on the spot only when the component has nothing else waiting; when another update for the same component is already queued, it runs later, when React renders, and by then `e.nativeEvent` is `null`: `TypeError: Cannot read properties of null (reading 'layout')` (or `'contentOffset'`) thrown in a render. Nothing above the screen catches a render error, so React unmounts the whole app and the person sees plain grey with no tab bar. On Android the strip's content size, its size and the first scroll events reach the app together when the pills appear (the fx reads land a few seconds after the balance, which is "after some time"), and a finger on the strip, or the page moving under it while a refresh is out, sends a scroll event every frame, so several are always waiting: that is "if I immediately touch that top section". The first strip the owner saw had 8 pills and "+ Add", the widest strip, which scrolls and so fires scroll events; the Naira-only strip of R-106 still has the handlers.

**Proof.** `src/features/wallet/__tests__/walletBlank.test.tsx`, "the strip reads its size and its offset when the events arrive, however many arrive before React renders": on the native platform (`Platform.OS = 'android'`), with the owner's shapes (open wallet, Naira balance 0, PIN set, no foreign account opened, the other reads as a fresh wallet gets them), it hands the strip's handlers the content size, the size and three scroll events in one batch, releasing each event after its handler as the renderer does. On `origin/wmt/STORE-BUY-APP` `88d0b779` it FAILS with `TypeError: Cannot read properties of null (reading 'layout')` caught by a boundary around the screen (what the person sees as a blank); on this branch it passes. The same file's other six tests drive the screen the ways the brief lists (the strip's layout and offsets, pull to refresh with the reads held and released in different orders while each pill is tapped, a tab in front that the Hub stops listing, reads that fail with 500, 401, 503 and offline, leaving and returning to the tab with a read out, "+ Add" with a refresh out): none threw on `88d0b779` either, so the jest driver cannot find the cause by tapping alone (jest's `fireEvent` hands a handler a fresh event that is never released); the pooled-event release is what it adds.

**The fix.** `onStripWidth(width)` and `onStripOffset(x)` take the number, read in the handler, and the update function closes over the number only; an unchanged number returns the same state, so a strip that is not moving does not render at all (the scroll events repeat).

**Not found by the driver, listed for the record.** Hooks and values the brief names were read and none throws for any state: `useFxHome` (tabs `[]`, `null` data), `activeTab` (falls back to Naira when the key goes), `useAddCurrency` (`find` is guarded), `CurrencyNote`, `BalanceCard`, `WalletBar`, `Body`; no `[0]` or `.find()!` on an empty list, no `Intl` or `BigInt` on the W1 path. Native-only paths that cannot run in jest are NOT RUN on a phone.

**Item 2** is `ErrorScreen`; tests in `src/__tests__/errorBoundary.test.tsx`: the screen says "Something went wrong" with Try again and Go to Home and no em-dash; Details shows `TypeError: Cannot read properties of null` and never the stack line under it; the root layout exports `ErrorBoundary` and the tabs layout names the same screen as its screen boundary; on the real router a tab screen that throws shows the error screen with the tab bar still there, and Try again draws it again once it can. (These fail without the boundary: a throw below a layout with no boundary renders nothing.)

**Other screens with the same line shape:** none. The 54 `nativeEvent` reads in `src` were listed; all but these two read the number in the handler (`setX(e.nativeEvent.layout.width)`).

### Pictures

W1 design board, dark: `tasks/pics/WALLET-BLANK-W1-design-dark.png` (`python3 scripts/design/render_design.py W1`). The board still draws "To cash" and the "Who Made This? card" row; R-103 and R-104 override it for those two, and it draws only Naira, Dollar and Crypto as pills, which R-106 follows for the accounts a person holds. A screenshot of the built W1 (dark) is NOT RUN: it needs a web export and a local stack (one stack per bundle), which this session's step budget did not leave room for; the screen's states are pinned in `WalletScreen.test.tsx` and `fxStrip.test.tsx`.

## Capability checks

- [x] A user can open the Wallet and see Add money, Send, Withdraw, Buy points and Bills, and no To cash and no row of bill tiles (`WalletScreen.test.tsx`, `walletTabFlow.test.tsx`).
- [x] A user can tap Bills on the Wallet and Pay a bill opens (`WalletScreen.test.tsx`: pushes `/bills`).
- [x] A user can open Your points and sees no way to cash; an old `/points-convert` link lands on Your points (`pointsFlow.test.tsx`).
- [x] A user sees no card row on the Wallet and no Cards row in Wallet settings (`WalletScreen.test.tsx`, `WalletSettingsScreen.test.tsx`).
- [x] A Naira-only user sees Naira and + Add; + Add opens the choice; a picked currency's pill appears; two accounts show exactly those two and Add (`fxStrip.test.tsx`).
- [x] A user can open the Wallet, touch and swipe the currency pills while the page moves or refreshes, and the screen never goes blank (`walletBlank.test.tsx`: red on `88d0b779`, green here).
- [x] A user whose screen throws sees "Something went wrong" with Try again and Go to Home, and in the tabs the tab bar stays (`src/__tests__/errorBoundary.test.tsx`).
- [ ] On a phone: NOT RUN (no device in this session).
