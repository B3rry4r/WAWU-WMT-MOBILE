---
id: R2-MONEY
title: RELEASE-02 fixes for the money and work area (CHECK-3 defects D-01 to D-06 and the lows)
owner: YOU
area: RELEASE
order: -301
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
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

## Verifier report

25 Oct 2026, Sonnet verifier (T1 lean check; built none of it). Mobile `95c71f66` against `a3fdaf71`; backend `4f865f2` against `dcee8af`. Local stack on the Nuvion stand-in and the mock WAWU ID (backend branch), web export at 390x844, real login for each user. Pictures and logs: scratchpad `r2-money-v/` (lead's session). **Verdict: FIX** (one high, one medium).

| Pass | Result | Evidence |
|---|---|---|
| V1 gates | passed | app gates 0 fail, 18 warn, 1418 files, EXIT 0; check_tasks EXIT 0; fingerprint 17ffb13d520882bf144982b61d03f3994c6e40e4 (unchanged); backend gates 0 fail, 138 warn, 88 accepted, 1983 files, EXIT 0; check_baseline EXIT 0 |
| tests | passed | app tsc EXIT 0; jest (wallet, send, addmoney, cards, professionals, pay-sheet, both route-guard files, maxWorkers=2) 58 suites, 1008 passed, EXIT 0; backend tsc EXIT 0; eslint (no fix) on the 7 changed files EXIT 0; new spec + 5 route inventories 6 suites, 113 passed, EXIT 0; contract:build EXIT 0, no diff to `contract/openapi.json` |
| V4 protected | same as main | `test:protected` after `db:seed`: branch 245 passed, 8 failed; main 245 passed, 8 failed; the same 8 (GET /professionals/:id, PATCH /professionals/applications/:id/listing, POST /admin/professionals/:id/approve and /unlist, POST /admin/verification/:id/approve, /ticks/:wawuUserId/grant and /revoke, POST /verification/purchase/verify; "WAWU ID verification-tier update failed" from the mock ID). The builder's five `/learn/*` and `/creators/:id/evg` failures did not occur once `db:seed` had run on either tree: they were an empty test database, not the branch |
| V5 picture | partly | boards rendered (W2, W10, W15, W20, W26, W35) and built screens captured dark and light in `shots/`; compared by text and layout, no phone |
| V6 states | passed except below | frozen world account, no wallet, nothing to swap with, no add-money way: reached by their real causes |
| V9 live seam | passed | signed in through the real login (mock WAWU ID) for four users; every figure below came from the Hub |

### Findings, ranked

1. **high, defect: D-02 contradicts BRIEF rule 5 and W10/W11.** `src/components/pay-sheet/PaySheet.tsx:243` builds the send button from `p.recipientGetsKobo ?? p.total` and `:251` drops the "They get" line (`!send &&`). Repro on the stack: Send, a WAWU user, 5,000, Continue: button "Send ₦5,000", Total row "₦5,010.00" above it, PIN sheet "Approve ₦5,010 to Ada Seeded", wallet debited ₦5,010 (₦50,000.00 to ₦44,990.00). The pay button and the PIN sheet disagree and the button names less than leaves the wallet. BRIEF rule 5 and W10: the button shows the total ("Send ₦5,010"), with "They get ₦5,000" as its own line. Fix: restore the total on the button and the "They get" line (the chat send shares the sheet), and revert SHARED-CHANGES row R2-MONEY #1. The assertions the builder changed for this (`sendFlow.test.tsx`, `bankSendFlow.test.tsx`, `PaySheet.test.tsx`: "Send ₦25,065", "Send ₦25,075", "Send ₦25,025.75", "Send ₦25,035.75", "They get ₦25,000") pinned the BRIEF-correct behaviour, not a defect: restore them.
2. **medium, defect: D-05 Beneficiaries opens a list that does not hold what the count counts.** `src/app/wallet-settings.tsx` sends the row to `/send/bank`; the Hub's `beneficiaryCount` counts WAWU users too (`visibleBeneficiaries`, wawu-backend `src/money/saved-accounts/beneficiary.service.ts:~384`), and a send to a WAWU user saves them on its own. W8's Saved list draws bank accounts only (`src/features/send/BankRecipientScreen.tsx:101`). Repro: send to a WAWU user, Wallet settings: "Beneficiaries, 1 saved"; tap it: W8 with no Saved section. Fix: count only bank accounts for this row, or open a list that shows both.
3. **low, note: D-03 support cannot use the lookup from a screen today.** The dashboard (`wawu-dashboard` `c1dfca6`) has no screen or call for `GET /admin/money/transfers/lookup`; support can only call it with an admin token. The route itself is right: superadmin, finance, support 200; reviewer 403; no token 401; a user token 401; whole reference, lower case and the short form each find the send; an unknown short reference answers an empty list; a 3-character query is 400; two sends sharing the first eight digits both come back, newest first; the answer holds ids, names, kobo, status, dates and the bank's name, never an account number, note or failure reason (the abroad admin send view already shows ids and names). It does not filter on the `provider` column, so it also finds sends from before the provider switch (fine for support).
4. **low: world home with every account frozen draws no activity.** `src/features/wallet/world/WorldHome.tsx` shows Transactions only when an account is open, so a frozen person cannot see their movements. The frozen banner, no Send abroad, no Swap and Get paid from abroad all showed correctly.
5. **low (D-10, D-14):** the W26 icon opens Statements; P1 intro now reads "Vetted practitioners. Pay to send the first message." (no BRIEF entry; the paid first message is real). The W26 icon was not compared in a picture.

### Capability checks

- D-01 world wallet (KE person, USD $125.50 and EUR €40.00 funded on the stand-in): a balance card per account with the Hub's own figure, never added up, then Send abroad, Swap, Get paid from abroad per account, Transactions, Add a currency; nothing naira. Frozen: banner "This account is frozen", no Send abroad or Swap, Get paid from abroad stays. **Coin: NOT RUN** (the stand-in makes fiat only, `provider_declined`).
- D-03 on the receipt: "WAW-1194-3E9D" on W12 for send `wawu-send-11943e9d-...`; the lookup of that short form finds it. W14 and W27 take the same function (`reference.ts`), not driven (no failed send).
- D-04: the Hub lists no available way for naira here, so the app draws no "Other ways" section.
- D-06: /swap with a naira wallet and no foreign account says "You have no account to swap with" with Go to your wallet; /cards with no wallet says "You don't have a wallet yet" with Open your wallet, no Try again. The real-failure path is held by `swapEmpty.test.tsx` and `cardsScreen.test.tsx` (passed), not driven.
- D-05 switch for a biometric key: the web export shows none (the phone keeps the key); NOT RUN on a phone.
- Changed assertions: D-02 ones above (restore); `otherWays` three inert rows (D-04), `WalletSettingsScreen` and `walletSettingsFlow` no Beneficiaries row (D-05), `worldAccountCard` padding and GBP code text (D-01 rebuild), `professionals/screens` intro (D-14), `historyScreens` (D-10): each pinned the named defect only.
- D-18 (backend read): yes, an unpaid place ends. `src/schools/enrolment/school-enrolment-rules.ts:22-29` sets `reservedUntil` to now plus 30 minutes (`SCHOOL_RESERVATION_MINUTES`, 5 to 1440); `school-enrolment.service.ts:546-575` `releaseExpired` sets status `released` and gives the seat back; `:577` runs it every minute; `:205-210` a full class releases its expired places before it says no; `:66` a pending or completed payment keeps the seat; `rules.ts:34-40` caps a student at 3 unpaid places. Not exercised on the stack: the seed holds no future class with a free seat (NOT RUN).

## Fix round 1

26 Oct 2026, Sonnet builder (T2), mobile `wmt/R2-MONEY` on `65903bca`; backend untouched (`4f865f2`). Source: the verifier report above and `audits/CHECK-3/money-work-p2.md`; the BRIEF (rules 3 to 6) outranks a board picture. Each fix had its test written first (red), then the code (green); the W6 and W4 tests were written first but not run red.

| Item | Before | After |
|---|---|---|
| 1 D-02 (high) | the send button read "Send ₦5,000" and the "They get" line was gone; the PIN sheet said "Approve ₦5,010" | reverted: the button shows the total ("Send ₦5,010") and "They get ₦5,000" is its own line again (BRIEF rule 5, W10, W11). `PaySheet.tsx` is back to `origin/main`; SHARED-CHANGES row R2-MONEY #1 removed; the sendFlow, bankSendFlow and PaySheet assertions are restored byte for byte from `a3fdaf71` |
| 2 D-05 (medium) | "Beneficiaries, 1 saved" counted a saved WAWU user, W8's Saved list draws bank accounts only | the row counts the saved bank accounts, read from the same list and key W8 draws (`beneficiariesQuery`, `savedBankRows` in `send/api.ts`); a saved WAWU user is not counted. Which and why: no board draws a list of saved WAWU people (W7 draws Recent, by recency, from another read; W8 draws banks), so drawing both kinds on W8 would build an unboarded list (R-29, R-47); counting what is drawn keeps the number and the list one thing. The Hub's `beneficiaryCount` is unchanged and unused here. The list failing to read leaves the row without a count; it still opens |
| 3 frozen world home | every account frozen drew no Transactions | Transactions stay while any account is open or frozen (history stays readable); an account still opening has none |
| 4 "No fee" in `wallet/fx` | W20 "Fee No fee"; review and receipts "No fee"; crypto send "No fee" | never drawn. W20: the fee row is the figure ("₦0.00") with the split under it ("Bank charge ₦0.00 + WAWU fee ₦0.00"); the swap review: Bank charge, WAWU fee, Fees, Total (the quote's `totalFromMinor`); swap and crypto receipts: the parts, Fees, "Total paid"; crypto send: WAWU fee as a figure, a Total row in the review sheet. A part the provider has not named still says so ("Shown on your receipt", "None stated") and the total says it is coming ("+ bank charge", "+ network fee"). The provider's part reads "Bank charge" (R-53), not "Nuvion fee". Every figure is the Hub's |
| 5 M-02 provider words | a declined swap printed the provider's text ("API endpoint does not exist") | one plain sentence for a declined rate, a declined swap, a declined crypto send, a failed swap or send on its receipt, and a declined account opening: the provider's text is never drawn (`sentenceOf` returns the screen's own line for `provider_declined`); the code stays in the Hub's logs |
| 6 M-04 W6 | the tab strip vanished and the Hub's sentence stood alone | the strip stays (Naira, the currency tabs, Crypto) and the board's line "Your money is safe. This is a connection problem between us and the bank." sits under the title, with Try again. Home's card and the delete-account notice keep the Hub's sentence (they are not W6) |
| 7 lows | | built: W4 skeleton tab-pill row; W13 over the balance hides the quick amounts and the note field. Not built, see the gaps below |

Existing assertions changed, each pinning a defect named in the brief: the restored D-02 ones (above); `WalletSettingsScreen` and `walletSettingsFlow` ("6 saved" and "3 saved" were the Hub's count); `fxModel`, `fxSwapFlow`, `fxCryptoFlow` ("No fee", "Nuvion fee", the provider's refusal text); `WalletScreen` (W6 "the server's sentence"; the `wallet-loading-tabs` id left the not-built list because the tabs are built); `fxTabs` and `worldHome` gained cases.

Lead rulings, recorded (no code): **M-03** (PT3 and PT3b never offer the wallet) conforms to R-86: points are bought through the app stores and the app draws no wallet path, so it is not a defect. **D-03**'s missing dashboard screen for `GET /admin/money/transfers/lookup` is a gap row (G-R2M-1 in BACKEND_GAPS.md).

Not built, with the reason (BACKEND_GAPS rows G-R2M-2 to G-R2M-7): W3 coin balance card; W23 "Arrives" row and network fee before sending; W44 tier line; PT1 7 tiles against 8; W4 scan icon (no screen, WALLET-20); W39 calendar icon (no board draws what it opens, G-WALLET-13-1); PT6a footnote (the Hub serves no figure behind it, G-836). D-15: `/bills` and `/bills/electricity` already open by URL as "Pay a bill" and no entry is drawn (R-52); nothing to change.

Checks (logs in the scratchpad `r2m1/logs/`, each with its EXIT line): `npx tsc --noEmit` EXIT 0; ESLint (no fix) on every changed ts and tsx file EXIT 0, no warning; Jest (`--maxWorkers=2`) on wallet, send, pay-sheet, home, delete-account and `route-guard.test.tsx`: 51 suites, 1003 tests, EXIT 0; gates `python3 scripts/gates/run.py` 0 fail, 18 warn (all old), EXIT 0 (a first run had 2 deferral findings on my own comments, reworded); `check_tasks.py --write` EXIT 0; Android fingerprint `17ffb13d520882bf144982b61d03f3994c6e40e4`.

NOT RUN: the live proof on a local stack (backend `origin/wmt/R2-MONEY`, the Nuvion stand-in) with pictures at 390 px beside the boards, for items 1, 2, 4, 5 and 6: the step budget ended first, so none was driven and no picture was made (the checks above are Jest against the Hub's stand-in `fetch`). A phone; `npm run check` (the merge agent runs it).
