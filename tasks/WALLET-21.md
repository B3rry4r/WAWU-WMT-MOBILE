---
id: WALLET-21
title: Dollar and crypto accounts, swap
owner: YOU
area: WALLET
order: 321
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [WALLET-32, WALLET-33, WALLET-01]
decisions: [R-83, R-84, R-16, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W2, W3, W20, W21, W22, W23]
tier: T2
---
# WALLET-21 · Dollar and crypto accounts, swap

## Current state

As of 24 Oct 2026, built by a Sonnet builder (bundle B19, T2), mobile `wmt/WALLET-21` on `origin/main` `7e65293b`; contract copied from backend `wmt/WALLET-21-HUB` `e44ea4c` (B18's routes, declared and served on the Nuvion adapter by B18's later pushes). Follow-up (lead, 24 Oct): the contract is re-copied from `wmt/WALLET-21-HUB` `0008490` (routes now served), where `GET /money/fx/sends/quote` and `POST /money/fx/sends` also take `currency` (USDT, USDC or RLUSD, the account's); the app sends it on both calls (`fx/api.ts`, `CryptoSendScreen`), and the send's attempt subject names it. Also fixed: the swap's hold could read a second too long on the first frame (the clock was older than the quote); it is now capped at the quote's `validForSeconds`. Status: verifying. R-83 and R-84 replace this file's old brief (Cardex samples, 90 seconds, TRC-20 and BEP-20 are dead): the networks are Nuvion's, the hold is the quote's own `expiresAt`, the fees are the Hub's breakdown.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | W1 has no tabs (R-47: not built) | under the title, one tab for Naira, each currency the Hub says exists or can be opened (USD, EUR, GBP, CAD, AED, GHS), and Crypto; three tabs are the board's track, more scroll sideways. A person whose wallet is not open sees none and the existing Open your wallet path |
| 2 | no foreign account anywhere | W2 for every currency: the account's own balance (the provider's), "USD account · issuing bank", the number masked with Copy, Add (opens Swap from naira) and the round Swap button, "Get paid from abroad" opening the details Nuvion issued (each with Copy, and Share), the account's statement, the opening and frozen states, "Open a ... account" only when the Hub allows it |
| 3 | no crypto | W3: holdings grouped by coin (a stablecoin account is one chain's wallet), Receive, Send (only when the Hub has crypto send on and an account is open), Swap, the statement. No dollar total and no "≈ $" line: the Hub serves none (gap row) |
| 4 | no swap | W20 and W21: from and to chosen from the accounts the person holds, keypad in the side's own decimals, the rate and the "Holds m:ss" pill counted from the quote's `expiresAt` (a new rate is asked for when it runs out), the fee as the Hub's breakdown, review sheet, PIN sheet (W11, with fingerprint or face as FIX-112), receipt |
| 5 | no receive | W22: coins and networks from the Hub, address with QR (`events/qr`, nothing new), Copy, the undismissable warning; a network with no account is opened from here when the Hub lets it |
| 6 | no crypto send | W23: coin, network (the account's), pasted address, amount with Max, balance, fees on top, review, PIN, receipt |
| 7 | Idempotency | one key per swap (kept with its quote) and per send (kept with its body) in `money-attempt`, sent again unchanged on a wrong PIN and on a request that got no answer; a closed or refused fingerprint never rotates it (`notApproved`) |

### Defaults (lead), owner may override

- Add dollars (and the same on each currency) opens Swap from naira to that currency; the round button opens Swap from that currency to naira. W2's Send is not drawn: foreign sends are NUV-11 (R-84 item 4).
- A swap or send the provider has not finished goes to its receipt as Pending and is read again by its id every 4 seconds; it is never done twice.
- The review sheets (W21, W23) carry the fee rows as the Hub names them; a network fee the provider names only when it takes the send is written "Shown on your receipt".
- Dollar value of crypto, minimum deposit per network and the send's arrival time are not drawn (the Hub serves none): see BACKEND_GAPS G-WALLET-21-A1 to A4.
- Not built, no board: a history screen for a foreign account (the tab shows the newest 20), the scan icon (WALLET-20), W2/W3 inside Home.

### Checks (EXIT lines in `scratchpad/wallet-21-b/logs/`)

tsc 0; eslint on changed files 0 (0 warnings); jest: `fxModel` 18, `fxTabs` 16, `fxSwapFlow` 11, `fxCryptoFlow` 14, plus the existing `WalletScreen`, `walletTabFlow`, `route-guard`, `route-graph` (356) all pass; gates 0 fail, 18 warn (all older PROVISIONAL, none new), baseline 0; check_tasks 0. Pictures: `scratchpad/wallet-21-b/` (W1 with tabs, W2, W3, W20, W21, W22, W23, 390 px, light and dark, and each beside its board), taken from the web export against a stand-in Hub (ports 8330 to 8332), not the Nuvion dev key. NOT RUN: a live swap or send on Nuvion dev (the stand-in answers the shapes B18's contract gives; dev answers `provider_declined` for stablecoin sends and 503 for CAD and AED details, which the screens draw plainly and which the tests cover as a refusal), fingerprint on a real phone, the dark W12 receipt picture.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-16 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W2 W3 W20 W21 W22 W23` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W2, W3, W20, W21, W22, W23 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W2 · Wallet · Dollar**: USD account: dollar balance, 'USD account · Fintava' masked number, Send / Add dollars, a 'Get paid from abroad' prompt to share US account details, dollar transactions incl. a swap to Naira.
- **W3 · Wallet · Crypto**: Crypto account: total in dollars, Receive / Send, USDT and USDC holdings (no BTC, BRIEF W3) with USD value, crypto transactions with truncated addresses.
- **W20 · Swap**: Currency swap NGN to USD with keypad, both balances, rate held for the quote's real expiry (90 seconds today, BRIEF W20) with countdown, the fee as a breakdown slot.
- **W21 · Swap · review**: Review sheet for the swap (from, to, rate, fee), then PIN (W11), then a W12-style receipt.
- **W22 · Crypto · receive**: Receive USDT/USDC: pick asset and network, address + QR + Copy, undismissable warning to send only that asset on that network.
- **W23 · Crypto · send**: Send USDT: recipient address, network (must match), amount with Max, balance, network fee deducted, they get, ETA; then review, PIN, receipt.

## Brief changes (build these, not the canvas)

- **W2**: keep the screen as drawn for after launch. The provider line is a slot filled from config (sample "USD account"). (Why: R-16 (dollar account after launch) and R-1 (provider and bank lines come from config).)
- **W3**: two holdings: **USDT** and **USDC**, nothing else. Replace the BTC transaction with a USDC one. USDT networks: TRC-20, ERC-20, BEP-20. USDC networks: TRC-20, ERC-20, BEP-20, Base, Solana. Any line saying who holds the coins is a slot filled from config. The Dollar tab as W1. (Why: Cardex fact: only USDT and USDC. Cardex holds the coins in WAWU's own treasury, so the wording is the owner's.)
- **W20**: the rate hold counts down from the quote's real expiry, which is **90 seconds** today (sample "Holds 1:28"). The fee row is a breakdown slot (Cardex's charge + WAWU's fee); the amounts aren't known yet, so keep them obvious samples. A swap into crypto shows **USDT** or **USDC** as the "You get" side, never "Dollar" or "Dollar account"; a swap with the real Dollar account comes later with W2. (Why: Cardex facts: a quote is held 90 seconds and used once; conversion fees are still to come from Fintava; a stablecoin balance is not a dollar account. R-16: the dollar account comes after launch.)
- **W21**: "To" names the asset (USDT or USDC), the fee row is the breakdown slot, and the hold matches W20 (90 seconds). The button "Swap ₦158,000" shows the total including that fee slot. (Why: as W20, and rule 5.)
- **W22**: "USDT | USDC". For USDC the network choice adds Base and Solana. Add a short line under the address for the minimum deposit on that network (a slot; Cardex sets a minimum per network). (Why: Cardex facts: no BTC; USDC runs on five networks; each network has a minimum deposit.)
- **W23**: the fee is added on top: Amount 120.00 USDT, Network fee (a slot; keep 1.00 USDT as a sample), Total from your balance 121.00 USDT, They get 120.00 USDT. (Why: Cardex fact: the fee is charged on top of the amount.)

## Capability checks

- [ ] **W2**: a user can switch tab; copy USD account; Send dollars; Add dollars; share US account details.
- [ ] **W3**: a user can Receive (W22); Send (W23); view asset.
- [ ] **W20**: a user can choose from/to; enter amount; Review swap.
- [ ] **W21**: a user can Swap ₦158,000; Cancel.
- [ ] **W22**: a user can pick asset; pick network; copy address.
- [ ] **W23**: a user can paste address; pick network; enter amount; Max; Review.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From W1, a user can switch to the Dollar and Crypto tabs and tap Swap (this task adds them, as W1 draws them).

## What the backend serves today (from the analysis)

- **W2**: missing. Missing: No USD account, balance, receiving details or USD ledger anywhere in the backend.
- **W3**: missing. Missing: No crypto custody, balances, pricing or transactions.
- **W20**: missing. Missing: No FX quote or swap.
- **W21**: missing. Missing: No swap execution.
- **W22**: missing. Missing: No address generation.
- **W23**: missing. Missing: No crypto send.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W2: Dollar balance $1,240.50
- W2: USD account · Fintava •••• 4410
- W2: Swap to Naira At ₦1,580 per $1
- W2: Upwork Global Freelance payout +$420.00
- W2: Payoneer Client payment +$150.00
- W2: 'Share your US account details with Upwork, YouTube or a client' (capability claim)
- W3: USDT and BTC held by Fintava's custody partner
- W3: Tether USDT · TRC-20, ERC-20
- W3: Bitcoin BTC · Bitcoin network
- W3: 320.00 USDT ≈ $320.00
- W3: 0.014200 BTC ≈ $1,399.90
- W3: Crypto balance $1,719.90
- W20: Rate $1 = ₦1,580.00
- W20: Holds 0:28 (30-second rate hold)
- W20: Fee No fee
- W21: Swap ₦158,000 for $100.00
- W21: Rate $1 = ₦1,580.00
- W21: Fee No fee
- W22: Networks TRC-20, ERC-20, BEP-20
- W22: address TQ7xN3fK8pLm2aVr5sYc9WbE4hJd6KfP (sample)
- W23: Network fee 1.00 USDT
- W23: They get 119.00 USDT
- W23: Arrives About 2 minutes
- W23: TRC-20 · Tron

## Designer notes (⚠, unresolved)

- W2: “⚠ A USD account for getting paid from abroad. Bills are Naira-only, so that row gives way to the receive-from-abroad prompt.”
- W3: “⚠ USDT and BTC held by Fintava's custody partner, totalled in dollars.”
- W20: “⚠ Every rate, fee and network below is a placeholder until Fintava's FX and custody terms are confirmed.”
- W22: “⚠ The QR is a placeholder; production renders it from src/lib/qr.ts.”

## Builder report

Files: `src/features/wallet/fx/` (api, amount, model, parts, FxBalanceCard, FxTabBody, FxDetailsSheet, FxReceiptScreen, ReceiveScreen, CryptoSendScreen, `swap/` SwapScreen, SwapReview, useSwapPay, model; `testing/fxHub.ts` is the tests' stand-in), routes `src/app/swap.tsx`, `crypto-receive.tsx`, `crypto-send.tsx`, `fx-receipt.tsx`, `WalletScreen.tsx` (tabs), `_layout.tsx` (four `Stack.Screen` lines, SHARED-CHANGES WALLET-21 #2), contract and generated types (#1). Four defects were found by the tests and fixed before the hand-back: a wrong PIN dropped the swap's key (now the same key, as Send), a decided swap re-asked for a rate, a hook that needed a provider the wallet screens do not use, and a duplicated test id on the receipt. Nothing is baselined.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
