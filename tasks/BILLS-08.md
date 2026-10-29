---
id: BILLS-08
title: Bills are back: the entries on the balance card and the Wallet tab, and every kind of bill is live
owner: YOU
area: BILLS
order: 358
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [BILLS-01, BILLS-02, BILLS-03]
decisions: [R-102, R-27, R-47, R-52, R-45]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# BILLS-08 · Bills are back: the entries

## Current state

As of 29 Oct 2026, built by a Sonnet builder (T2), mobile `wmt/BILLS-02` on `origin/main` `6bf62919` (BILLS-02, BILLS-03 and BILLS-08 are one bundle and one branch). App only: no backend change (there is no Hub task, the app uses the Hub routes the website uses), no native change (`react-native-webview` was already a dependency; the Android fingerprint is unchanged, `17ffb13d`). Status verifying.

Direction changed twice on 29 Oct. The first brief said "bills from the wallet, with a switch (`GET /bills/status`) and S13". The second, which stands, is R-102: bills are paid through Flutterwave checkout exactly as the website does, the wallet is not involved, and bills are live. So there is no status read, no switched-off state and no S13.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | the balance card had Send and Add, no Bills (R-52, DV2-RM) | Send, Add, Bills, in the board's order (R-27); Bills opens S2 |
| 2 | the Wallet tab drew no bill tiles (R-52, DV2-02) | five tiles under the actions in every state of the tab (they need no wallet): Airtime, Data, Power, TV, More; each opens its own bill, More opens S2; `BillTiles.tsx` is the file DV2-02 deleted, restored and widened to the five built tiles; the loading shapes carry five bill tiles |
| 3 | `/bills` drew electricity only, from Fintava's routes (`/bills/electricity/*`), and S13 | all four kinds on the Hub's website routes (BILLS-02, BILLS-03); S2 draws only the kinds the provider lists; S13 is not built |

### What is not restored, and why (Default (lead), owner may override)

- **Home's Pay bills tile.** The 16 Oct board's services row is Studio, Learn, Monetize, Legal, and no board draws the tile. Bills open from the balance card's Bills and from the Wallet tab.
- **The history's Bills chip.** The 16 Oct board's chips are All, Money in, Money out, Content. A bill bought through the provider's checkout is not a wallet transaction, so the wallet's history never lists it (`GET /money/transactions?filter=bills` is for wallet bills, which stay off). Recent on S2 (`GET /bills/mine`) is where a person finds what they paid for, and a row opens its receipt. A chip that always shows nothing would be a control that does nothing (R-47).
- **The 16 Oct canvas draws none of these entries** (it was drawn with bills off). They come from the earlier canvas (`design/_gen/wallet.js` line 45, the `bills` row) and the lead's brief.

## Read first

- `DECISIONS.md` R-102, R-52, R-45; `tasks/BILLS-02.md`, `tasks/BILLS-03.md`
- `src/features/home/MoneyCard.tsx`, `src/features/wallet/home/BillTiles.tsx`, `WalletScreen.tsx`, `WalletSkeleton.tsx`

## Goal

A person can reach every kind of bill from the balance card and from the Wallet tab.

## Scope

`wawu-wmt-mobile` only: `src/features/home/MoneyCard.tsx` (one prop, `onOpenBills`) and `TodayScreen.tsx` (its wiring), `src/features/wallet/home/` (`BillTiles.tsx` restored, `WalletScreen.tsx`, `WalletSkeleton.tsx`), and the tests that asserted the entries' absence (SHARED-CHANGES BILLS-08 #1).

## Capability checks

- [x] A user can tap Bills on the balance card and reach Pay a bill (`HomeScreen.test.tsx`).
- [x] A user can tap each of the five bill tiles on the Wallet tab and reach that bill, and More reaches S2 (`WalletScreen.test.tsx`, `walletTabFlow.test.tsx`).
- [x] The bill tiles are drawn with no wallet, while the balance is out and when it cannot be read (`WalletScreen.test.tsx`, every state).
- [x] Home's services row still draws no Pay bills tile and the history draws no Bills chip (`HomeScreen.test.tsx`, `historyModel.test.ts`).
- [ ] On a phone: NOT RUN (no device in this session).
