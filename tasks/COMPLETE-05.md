---
id: COMPLETE-05
title: Wallet shows its whole design
owner: YOU
area: WALLET
order: 241
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [COMPLETE-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [W1, W4, W5, W6]
---
# COMPLETE-05 · Wallet shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/wallet/home/WalletScreen.tsx`, `RecentTransactions.tsx`, `WalletSkeleton.tsx` and their comments listing what they leave out
- `DECISIONS.md` R-45 (Nuvion; the app may send a person with no wallet to the website)

## Goal

The Wallet tab (W1) leaves out the scan and settings icons, the account tabs, Swap, Send, Add money, the bills tiles, the WAWU card row, See all and a row's detail. W1 and its states are drawn in full now. No money moves differently: this is drawing, not payments.

## Scope

- The bar: scan (WALLET-20, after launch) and settings (WALLET-06).
- The Naira, Dollar and Crypto tabs and Swap (WALLET-21, after launch): drawn, Naira selected, the others inert.
- Send (WALLET-02), Add money (WALLET-05), the bills tiles (BILLS-01), the WAWU card row (WALLET-22, after launch).
- Recent transactions: See all and a row's detail (WALLET-04); the empty state when there are none.
- The loading shapes (W4) match the full screen, and W5 and W6 draw their whole artboards.
- Files: `src/features/wallet/home/*`, `src/app/(tabs)/wallet.tsx`. Do not touch money-path code.
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [x] A user with a wallet sees every element W1 draws; a new account sees W5 in full; a failed read sees W6 in full. `WalletScreen.test.tsx`: "draws every element W1 draws", "draws every element W5 draws", "draws every element W6 draws", "draws the whole of W4", and one test per state without a balance (no wallet, opening, frozen, wallet read failed, balance unreadable) that the bar, the tabs and the bills are drawn. Pictures below.
- [x] A user can tap every action; built ones open their screen, the rest do nothing, and nothing charges or moves money. No entry on W1, W4, W5 or W6 has a built destination (the eight tasks are all `todo` on main a2f9143), so none is wired to a new screen; the entries that were already live (Copy, the eye, Try again, Open your wallet, Check again) still work and their tests are unchanged. "a user can tap every entry whose screen is not built" (jest, 15 entries and the 3 rows) and the same on the real router (`walletTabFlow.test.tsx`: the path stays `/wallet`) and in a real browser (39 taps, URL unchanged, only reads on the wire).
- [x] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`). The table is in the builder report.
- [x] `npm run check` exit 0 (numbers in the report).

## Builder report

Branch `wmt/COMPLETE-05`, from main a2f9143 (COMPLETE-01's `unbuilt` helper and gate, NUV-04's `accountNumberStatus`). Mobile only, no package change, no shared file touched.

**Files** (all under `src/features/wallet/home/` except the tests): new `WalletBar.tsx` (the title with the scan and settings buttons), `AccountTabs.tsx`, `WalletActions.tsx` (Send, Add money, Swap), `BillTiles.tsx`, `WalletCardRow.tsx`; changed `WalletScreen.tsx` (composes them, every state), `RecentTransactions.tsx` (See all, pressable rows), `WalletSkeleton.tsx` (W4 in full). `src/app/(tabs)/wallet.tsx` is unchanged. Tests: `src/features/wallet/__tests__/WalletScreen.test.tsx` (19 to 30 tests), `walletTabFlow.test.tsx` (2 to 3). `BACKEND_GAPS.md` gains G-493. No money-path code was read or changed: the screen makes the same three reads as before (`GET /money/wallet`, `/money/wallet/balance`, `/money/transactions?limit=3`) and no inert entry calls anything.

**What each destination task's status was on main (a2f9143)**: WALLET-20 `todo`, WALLET-06 `todo`, WALLET-21 `todo`, WALLET-02 `todo`, WALLET-05 `todo`, BILLS-01 `todo`, WALLET-22 `todo`, WALLET-04 `todo`. None is `review` or `done`, so every entry that leads to one of them is `unbuilt('<task>')`; the gate fails the build the day one of them is built.

**Element table.** "Built" means it was already on the screen and is unchanged; "drawn, inert" means `onPress={unbuilt('<task>')}`.

| Artboard | Element | State |
|---|---|---|
| W1 | Status bar (9:41, battery) | the phone's own, not drawn by the app |
| W1 | Title "Wallet" | built |
| W1 | Scan icon | drawn, inert: `unbuilt('WALLET-20')` |
| W1 | Settings icon | drawn, inert: `unbuilt('WALLET-06')` |
| W1 | Tabs: Naira (selected) | drawn; tapping it changes nothing (already selected) |
| W1 | Tabs: Dollar, Crypto | drawn, inert: `unbuilt('WALLET-21')`; Naira stays selected |
| W1 | Balance card: label, eye, figure with kobo, rule, bank line, account number, Copy | built, wired (the eye hides the figure, Copy copies the number) |
| W1 | Send | drawn, inert: `unbuilt('WALLET-02')` |
| W1 | Add money | drawn, inert: `unbuilt('WALLET-05')` |
| W1 | Swap (round button) | drawn, inert: `unbuilt('WALLET-21')` |
| W1 | Bills: Airtime, Data, Power, TV, More | drawn, inert, each `unbuilt('BILLS-01')` (see decisions) |
| W1 | WAWU card row: picture, "WAWU card", chevron | drawn, inert: `unbuilt('WALLET-22')`; neutral picture and no line under the name (G-493) |
| W1 | "Transactions" heading | built |
| W1 | See all | drawn, inert: `unbuilt('WALLET-04')` |
| W1 | Recent rows (up to three, from the ledger) | built; each row is now a button, inert: `unbuilt('WALLET-04')` (the detail) |
| W4 | Live bar (title, scan, settings) | as W1 |
| W4 | Shapes: tabs pill, card block, two action pills and a circle, five tiles with their label bars, three rows | built (new: the tabs, actions and tiles) |
| W5 | Bar, tabs, balance card at 0.00 with number and Copy, Send, Add money, Swap, bills | as W1 |
| W5 | "No transactions yet" card with the funding line | built |
| W5 | (no card row, no Transactions heading, no See all) | the canvas draws none, so none is drawn |
| W6 | Bar, tabs | as W1 |
| W6 | Card: cloud icon, title, the server's sentence, Try again | built, wired (asks the balance again) |
| W6 | Bills tiles | drawn, inert: `unbuilt('BILLS-01')` |
| W6 | (no balance card, Send, Add money, Swap, card row, Transactions) | the canvas draws none |

**Other states** (the canvas has no artboard for them): no wallet, opening, frozen, a failed wallet read and an unreadable balance now share W6's layout (bar, tabs, the state's card, bills) instead of a bare card. A wallet with no account still opens Open your wallet exactly as before (`useLeadToOpenWallet`, `useOpenWalletEntry` untouched; its three tests and the real-router test pass unchanged).

**Capability checks, how each was tested.**
1. Every element: the four "draws every element" tests and the five state tests above, in tree order (bar, tabs, card, actions, bills, card row, Transactions, See all, first row), no digit, status or brand of the canvas's one card (the card's text is searched for `4821`, `Physical`, `Active`, `Verve`, `LENNOX`).
2. Taps: jest taps scan, settings, Dollar, Crypto, Naira, Send, Add money, Swap, the five tiles, the card row, See all and all three rows; then asserts no route was pushed, the number of requests is the same, every request so far is a GET, the Naira tab is still the selected one, and the drawn tree is identical to before. The same on the real Expo Router (`walletTabFlow`: path still `/wallet`, no new fetch). And in Chromium on the web export (below): 18 taps (15 entries and the three tabs) each leave the URL unchanged and the Wallet shown, and the requests made after the load are the same reads, no POST.
3. W4: the live bar plus the shapes (`wallet-loading-tabs`, `-card`, `-actions` with three children, `-bills` with five, `-rows` with three), none of the entry words.

**Pictures** (V5), in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-05/shots/`, 390 px wide at 2x, light and dark, Chromium from `/opt/pw-browsers`, the web export (`npx expo export -p web --clear`, private TMPDIR) on port 5993. **The Hub and WAWU ID were a stand-in** (`standin.js` in the folder above, ports 5994 and 5995, local only, nothing leaves the machine; the browser was set to refuse anything not on ports 5993 to 5995, and refused 0 requests). The stand-in serves canvas-like sample values so the pictures can sit beside the renders; they are not the app's data. Each built picture sits beside `render_design.py` for the artboard in `side-<ID>-<theme>.png` (left the design, right the build).
- W1 with data: `W1-data-light.png`, `W1-data-dark.png`, and scrolled to the third row `W1-data-light-scrolled.png`, `W1-data-dark-scrolled.png`; beside the render: `side-W1-light.png`, `side-W1-dark.png`.
- W5 (an open wallet with nothing in it): `W5-empty-light.png`, `W5-empty-dark.png`, `side-W5-*.png`.
- W6 (the bank does not answer): `W6-unreachable-*.png`, `side-W6-*.png`.
- W4 (the balance read never answers): `W4-hold-*.png`, `side-W4-*.png`.
- An empty Hub (every money read fails): `Wx-empty-hub-blank-light.png`, `Wx-empty-hub-blank-dark.png`. No wallet, after Back from Open your wallet: `Wx-nowallet-light.png`, `Wx-nowallet-dark.png`.
- The run: `shots.py` and `shots.log` (43 checks, 0 failed: no em-dash on any screen, the entries drawn per state, 15 taps plus 3 tabs open nothing, nothing but reads on the wire), `report.json`.
Seen against the renders (not a verdict, the verifier decides): the build has no 50 px status bar and no home indicator (the web export has no safe-area inset, as on every other screen); the stand-in's balance, name, bank ("Loma Bank") and rows differ from the canvas's where the canvas itself is stale (BRIEF W1); the tabs, actions, bills and card row line up with the render by eye (not measured); the card row's picture is a neutral block with a card glyph where the canvas draws one person's card.

**Mutants of my own** (one edit each, the wallet test file or the gate run, original restored from a copy and compared). 18 applied, 18 killed (M3 survived once because its stand-in call used a relative URL that jest's `Request` refuses; fixed and killed). Script `mutants.py` in the scratch folder. Killed by the tests: M1 scan button left out, M2 the Dollar tab becomes selectable, M3 Send asks the Hub for something, M4 the card row also drawn on W5, M5 See all left out, M6 rows no longer buttons, M7 four skeleton tiles, M8 error states drop the bills, M9 Swap left out, M10 tabs left out of the balance layout, M11 Crypto before Dollar, M12 card row after Transactions, M13 an invented line under the card name, M14 no bar while loading. Killed by the gates: M15 an unknown task id, M16 a built task (NUV-04), M17 a non-literal argument (`unbuilt_entries`), M18 an empty handler instead of `unbuilt` (`dead_controls`).

**Counts** (`npm run check`). Before: 96 suites / 1608 tests (the after figure less my 12 added tests; main was not run on its own). After: 96 suites / 1620 tests, 10 gates, 403 files scanned, 0 findings, task check 270 tasks, 8 inert-entry warnings (one per task above: WALLET-02, WALLET-04 (2 entries), WALLET-05, WALLET-06, WALLET-20, WALLET-21 (2), WALLET-22, BILLS-01 (5)). The first run of the check failed the `hardcoded_signals` gate on two literal `gap` values; they now use `space.sm` and a named canvas metric, and the second run, on the final tree, exited 0. Secret scan of the staged diff: no key-shaped string.

**Decisions (Default (agent), owner may override)**
- Every bills tile is `unbuilt('BILLS-01')`: the canvas hotspot sends each tile to the Services list S2, which BILLS-01 builds (S2, S3, S4, S10, S13); the preselected bill (Airtime, Data and Cable TV on S2) is BILLS-03's addition, which the task named in the brief, BILLS-01, still precedes.
- The card row is drawn on W1 and on every state that has transactions or has not yet read them, and not on W5: the W5 canvas draws no card row, and an account with no transactions has no card.
- The card row's line ("Physical, last four, Active") and card art are not drawn: nothing serves a card (G-493); the row keeps its frame, a neutral card picture, "WAWU card" and the chevron.
- The Dollar and Crypto tabs are drawn although the BRIEF says the app hides the Dollar tab at launch: R-46 overrides, as the task says.
- States with no canvas artboard (no wallet, opening, frozen, a failed read) take W6's layout.
- A transaction row is a button (inert) and gets no pressed look beyond the shared row's own; an inert entry looks exactly as drawn (R-46's lead default).
- An inert entry has no greying, no toast and no message.

**NOT RUN**
- A phone check (V10): no device touched. Unblocked by a built Android or iOS development build on a phone.
- The real Hub: the pictures used a stand-in on ports 5994 and 5995. Unblocked by a local backend with a seeded wallet (the backend worktree's seeded database answering `GET /money/wallet`).
- The wired half of "tap and land on its screen": none of the eight destination screens exists. Unblocked when WALLET-20, WALLET-06, WALLET-21, WALLET-02, WALLET-05, BILLS-01, WALLET-22 and WALLET-04 reach `review`: each one's builder replaces its `unbuilt` and the gate fails until it does.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
