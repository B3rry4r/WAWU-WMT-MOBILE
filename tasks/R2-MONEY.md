---
id: R2-MONEY
title: RELEASE-02 fixes for the money and work area (CHECK-3 defects D-01 to D-06 and the lows)
owner: YOU
area: RELEASE
order: -301
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-10, R-23, R-27, R-47, R-87]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T2
---
# R2-MONEY · RELEASE-02 fixes, money and work area

## Current state

As of 25 Oct 2026, built by a Sonnet builder (T2), mobile `wmt/R2-MONEY` on `origin/main` `a3fdaf71`, backend `wmt/R2-MONEY` on `origin/main` `dcee8af` (head `4f865f2`). Source: `audits/CHECK-3/money-work.md` on `wmt/CHECK-3-money-work` (`aea65680`). The lead's rulings D-01 to D-06 are the brief ("Default (lead), owner may override"). Status verifying; no PR.

| Defect | Before | After |
|---|---|---|
| D-01 world wallet home | a person outside Nigeria saw "Your accounts" with a plain code and figure, no balance card, swap or activity | each foreign account is the naira home's balance card (the Hub's own figure, "We couldn't read this balance" when the bank is not asked, never a sum or a 0), then Send abroad and Swap (only while the Hub has them on; Swap needs a second open account), Get paid from abroad (the details sheet with Copy and Share), the account's activity, and Add a currency. Nothing naira. The swap screen leaves the naira side out for them (the Hub: "You have no naira account. Swap between your other accounts.") |
| D-02 send review | button "Send ₦5,010" (the total) and a "They get" line | button "Send ₦5,000" (what they receive), fees and Total above it as W10; no second line. Same for the chat send (one shared sheet) |
| D-03 raw references | "wawu-send-<uuid>" on W12, W14, W27 and the shared receipt | "WAW-8F2A-91C3": the first eight hex digits of the send id, derived from the stored reference by one rule in the app (`src/features/send/reference.ts`) and in the Hub. Neither the Hub's admin nor its user lookups could find a send by it, so the Hub gets `GET /admin/money/transfers/lookup?reference=` (superadmin, finance, support; short or whole reference; our rows only; no migration). A reference of another shape stays whole |
| D-04 inert rows on Add money | Debit card, USSD and Bank checkout drawn with "not available yet" and no action | a way is drawn only when the Hub lists it available for the account; none available draws no section |
| D-05 Wallet settings | no Beneficiaries row | "Beneficiaries, N saved" (the Hub's count) opens W8's Saved list. Tier stays out (WALLET-19). The Face ID switch is built (FIX-108, drawn wherever the phone keeps a biometric key); the audit's web export cannot, so it did not show |
| D-06 empty states | /swap with no foreign account: "couldn't load your accounts"; /cards with no wallet: "couldn't load your cards" plus Try again | /swap: "You have no account to swap with" and Go to your wallet; /cards: "You don't have a wallet yet" and Open your wallet. A read that really fails still says so (tests) |
| D-10 (low) | W26 had no top-right icon | the export icon opens Statements (W38); not on a grouped list |
| D-14 (low) | P1 intro "Vetted practitioners." | "Vetted practitioners. Pay to send the first message." |

Lows not changed, each with its reason (for the lead):
- D-11 Reset PIN sends the code to the email, the board says the phone: a ruling (R-72 moved sign-up codes to email; the PIN reset text goes through `OTP_SENDER`). D-12 Statements are CSV only, "Confirm email" first, no "Send to": the board's own note says PDF depends on the provider; a ruling.
- D-13 PT6 footnote "Spent on AI tools, points go further than cash." stays out: the Hub serves no figure behind it (BACKEND_GAPS G-836), and the code says so; drawing it would be a claim nothing backs. D-17 PT5 reads "Last movement" when the list holds one row and "Last N" otherwise (`PointsScreen.tsx`): correct for one row, the board's "Last 20" is the full list.
- D-15 /bills and /bills/electricity open by URL: R-52 says the app draws no entry, and the Hub answers `409 target_not_payable`; a route guard that hides built screens is a ruling. D-16 the extra tabs (Euro, Pound, CAD, Dirham, Cedi) and the Capital row follow R-83, R-84 and NUV-12; confirm that the board W1 is superseded.
- D-18 an unpaid enrolment keeps its seat: whether the hold ends is the Hub's schools code; needs a backend read, not done here.
- W15 clock footnote ("Money you send arrives in a few minutes."): a timing promise the Hub does not serve; left out.
- W10 fee rows: R-23 rules a row per part and a "Fees" row for two or more; left as ruled. "Bank charge ₦0.00" is drawn on a send to a person because R-23 says any part can be zero.
- Existing assertions changed because they pinned a defect the lead named: the send button text (sendFlow, bankSendFlow, PaySheet), the three inert rows (otherWays), no Beneficiaries row (WalletSettingsScreen, walletSettingsFlow), the bare world card's padding (worldAccountCard), the P1 intro (professionals screens).

Checks: see the Builder report below.

## Read first

- `audits/CHECK-3/money-work.md` (branch `wmt/CHECK-3-money-work`), `docs/WORKFLOW.md`, `DECISIONS.md` R-10, R-23, R-87

## Goal

Fix the CHECK-3 money-work defects the lead ruled on, so the screens match their boards or the app's own parts.

## Scope

`src/features/{wallet,send,addmoney,cards,professionals}`, `src/components/pay-sheet/PaySheet.tsx` (SHARED-CHANGES R2-MONEY #1), `src/app/{swap,transactions/index,wallet-settings}.tsx`; backend `src/money/transfers/` (new admin lookup).

## Capability checks

- [x] A user outside Nigeria sees a balance card per foreign account with the bank's figure and Send abroad, Swap, Get paid from abroad and Add a currency (`worldHome.test.tsx`).
- [x] A user sending ₦5,000 sees "Send ₦5,000" with the fees and Total above it.
- [x] A user sees "WAW-8F2A-91C3" on a receipt and support finds the send with it (`reference.test.ts`, `admin-transfer-lookup.spec.ts`).
- [x] A user sees only the add-money ways the Hub lists as available.
- [x] A user opens Beneficiaries from Wallet settings.
- [x] A user with nothing to swap with, or no wallet at /cards, sees the empty state, not "couldn't load".
- [ ] On a phone: NOT RUN (no device). Pictures use stand-in Hub answers, not the Nuvion stack.

## Builder report

25 Oct 2026, Sonnet builder, T2. Logs and pictures: the scratchpad folder `r2-money/` (lead's session).

- `npx tsc --noEmit`: EXIT 0 (app) and EXIT 0 (backend). ESLint on every changed file: 0 errors (one old warning in `professionals/__tests__/screens.test.tsx` line 17 is not mine).
- Jest, app (`--maxWorkers=2`): route-guard, pay-sheet, send, addmoney, cards, wallet, professionals and chatSend: 58 suites, 1012 passed, 1 failed (W36 change-PIN Idempotency-Key, under load); the same file alone: 23 of 23 passed, EXIT 0. New or rewritten: `worldHome`, `worldAccountCard`, `swapEmpty`, `swapWorldSides`, `cardsScreen`, `reference`, `otherWays`, `historyScreens`, `WalletSettingsScreen`.
- Backend (`wmt/R2-MONEY` `4f865f2`): `admin-transfer-lookup.spec.ts` 9 passed; the route inventories (`publishing-gate-coverage`, `hub-rate-limits`, `money-contract`, `wallet-gate-coverage`, `money-moving-coverage`) 5 suites, 104 passed, EXIT 0; `contract:build` EXIT 0 (the diff is the one new route and its schemas, 126 lines added); `test:protected` 248 passed, 5 failed in `/learn/*` and `/creators/:wawuId/evg` ("needs {{courseId}}, which no fixture provided": my fresh test database holds no courses; no file of mine is involved; NOT compared with main). No migration, no new table or column, so `account-data-map` and `data-export-map` were not run.
- Gates `python3 scripts/gates/run.py`: 0 fail, 18 warn (all old), EXIT 0; `check_baseline.py` EXIT 0; `check_tasks.py --write` EXIT 0; Android fingerprint (`npx fingerprint fingerprint:generate --platform android`) `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged.
- Pictures (390 px, dark and light, board on the left, built screen on the right): W35 wallet settings, W26 history, the world Wallet tab (board W2), W20 swap with nothing to swap, W15 add money with no way available, /cards with no wallet. They are made from the web export of this branch with STAND-IN Hub answers (not the Nuvion stack), so they show layout, not Hub behaviour. NOT drawn: W10 and W12 (their text is held by `sendFlow.test.tsx`, `bankSendFlow.test.tsx` and `reference.test.ts`), P1.
- NOT RUN: a phone, the Nuvion stack, `npm run check` (the merge agent runs it), the mobile contract copy (`npm run api`; the new Hub route is admin only and the app does not call it).
- Hub side of D-03: `GET /api/hub/admin/money/transfers/lookup?reference=WAW-8F2A-91C3` (also takes `wawu-send-<id>` or `wawu-bank-<id>`), roles superadmin, finance, support. The short form is the first eight hex digits of the send id, so two sends can share one; the lookup answers up to ten, newest first. The admin dashboard has no screen for it yet (dashboard task, not built here).
