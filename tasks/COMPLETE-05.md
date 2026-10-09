---
id: COMPLETE-05
title: Wallet shows its whole design
owner: YOU
area: WALLET
order: 241
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
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

- [ ] A user with a wallet sees every element W1 draws; a new account sees W5 in full; a failed read sees W6 in full.
- [ ] A user can tap every action; built ones open their screen, the rest do nothing, and nothing charges or moves money.
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
