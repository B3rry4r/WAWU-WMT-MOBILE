---
id: WALLET-21
title: Dollar and crypto accounts, swap
owner: YOU
area: WALLET
order: 321
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [WALLET-32, WALLET-33, WALLET-01]
decisions: [R-83, R-84, R-16, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W2, W3, W20, W21, W22, W23]
tier: T2
---
# WALLET-21 · Dollar and crypto accounts, swap

## Current state

As of 24 Oct 2026, built by a Sonnet builder (bundle B19, T2), mobile `wmt/WALLET-21` on `origin/main` `7e65293b`; contract copied from backend `wmt/WALLET-21-HUB` `e44ea4c` (B18's routes, declared and served on the Nuvion adapter by B18's later pushes). Follow-up (lead, 24 Oct): the contract is re-copied from `wmt/WALLET-21-HUB` `0008490` (routes now served), where `GET /money/fx/sends/quote` and `POST /money/fx/sends` also take `currency` (USDT, USDC or RLUSD, the account's); the app sends it on both calls (`fx/api.ts`, `CryptoSendScreen`), and the send's attempt subject names it. Also fixed: the swap's hold could read a second too long on the first frame (the clock was older than the quote); it is now capped at the quote's `validForSeconds`. Status: building (verifier verdict FIX, 24 Oct: H1 the WAWU fee is not collected on a naira-source swap, M1 the contract is stale against contract:build, M2 CAD and AED details promise arrival; see Verifier report). R-83 and R-84 replace this file's old brief (Cardex samples, 90 seconds, TRC-20 and BEP-20 are dead): the networks are Nuvion's, the hold is the quote's own `expiresAt`, the fees are the Hub's breakdown.

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

Verifier: Sonnet (T2 lean check, 24 Oct 2026), backend `wmt/WALLET-21-HUB` `0008490` against `origin/main` `38be72e`, mobile `wmt/WALLET-21` `980adef1`. Verdict: **FIX** (1 high, 2 medium). Live run: a local Hub on the HUB branch against Nuvion DEV only (`api.nuvion.dev`, a net guard that refuses every other host), the mobile web export at 390 x 844, signed in through the app's own sign-in (mock WAWU ID), a naira wallet already opened on dev (entity and naira account of the earlier dev runs, linked to the test person by one wallet row; the Hub's opening flow was not re-run, FIX-97 did that).

| Pass | Result | Evidence |
|------|--------|----------|
| Live: USD and EUR accounts open, real receiving details | passed | USD: account and routing numbers, bank "Bank of Nowhere" (no SWIFT on dev, G-WALLET-21-8). EUR: `pending`, then `active` with an IBAN on the next read |
| Live: USDT per chain | passed | eth and base opened as two accounts; no chain refused `chain_mismatch` 422 |
| Live: quote, swap NGN to USD and back, PIN, one Idempotency-Key | passed | key sent twice in turn: same swap id; sent twice at once: one swap, the other answered `idempotency_in_progress`; a used quote under a new key: `quote_expired`; naira 40,921 kobo to 37,498 after one swap out (10,000) and one back in (6,577), equal to Nuvion's own balance read |
| Live: balances read Nuvion's | passed | Hub balance and `GET /accounts` on dev agree after each swap; app showed the same figures |
| Live: WAWU fee shown and charged once | **failed** | shown (W20 "WAWU fee ₦5.00", review "Swap ₦105", receipt) but charged zero times: finding H1 |
| Live: stablecoin send | passed | funded USDC account: Hub answers 409 `provider_declined` with Nuvion's own sentence, the key is released, the operation is `failed` |
| Live: CAD and AED details | failed (medium) | account opens, `details: null`, the app says "Account details are on their way": finding M2 |
| Live: expired quote | passed | 409 `quote_expired`, "That rate is no longer held. Get a new one." |
| Live: W1 with 8 tabs (Naira, Dollar, Euro, Pound, CAD, Dirham, Cedi, Crypto) | passed | page width 390 = window 390, tab row scrolls, first and last tab fully reachable: `pics/v-W1-light.png`, `pics/v-W2-Crypto-light.png` |
| Money: frozen account (admin route) | passed | quote, swap on a quote taken before the freeze, send quote and send all 423 `account_frozen`; reads still work; unfreeze restores |
| Money: on/off settings | passed | `fx.product.swap.on`, `fx.currency.USD.on`, `fx.product.open_account.on`, `fx.product.crypto_send.on` each set to 0: 409 `fx_switched_off`; `GET /currencies` shows `enabled` and `products` |
| Money: admin roles and audit | passed | support and reviewer 403 on read and freeze, no token 401; superadmin and finance freeze and unfreeze; six `FxAdminAudit` rows with admin id, email, role and reason, none from the refused roles |
| Money: daily limit, webhook plus sweep, lost answer | NOT RUN live | dev finishes a transfer at once and its webhook endpoint is not reachable, so a pending operation cannot be provoked; covered by `fx-money.contract.spec.ts` (limit over the Lagos day, spend-once quote, pending then settled) which passes. The code reads right for a double debit: the reference is the provider's idempotency key and a repeat finds the original |
| Additive: protected route suite | passed (same as main) | 245 of 253, the same 8 failures on `origin/main` (verification and professionals routes, 502 in this environment), so the branch changes none |
| Additive: route inventories | passed | `publishing-gate-coverage`, `hub-rate-limits.contract` in the 11-suite run |
| Additive: migration | passed | `20261112090000_fx_accounts` is later than every migration on `origin/main` and all 310 `origin/wmt/*` branches; schema diff against the migrated database: none; rollback refuses with one `FxAccount` row, drops five tables with none, migration re-applies |
| contract:build unchanged | **failed** | one summary line changes: finding M1 |
| V5 Picture against the boards | NOT RUN | pictures taken (below), not compared element by element with `render_design` boards |
| Other screens W22, W23, dark W1 to W3 | NOT RUN | not walked live; W22 and W23 covered by `fxCryptoFlow` jest only |

Checks (EXIT lines in `scratchpad/wallet-21-v/logs/`): backend tsc 0; eslint (no --fix) on 32 changed `.ts` files 0; 11 spec files (fx-contract, fx-money.contract, nuvion-fx-area, wallet-gate-coverage, money-moving-coverage, money-contract, publishing-gate-coverage, hub-rate-limits.contract, plan-settings, plan-settings-round2, admin-plan-settings.contract) 193 tests 0; gates 0 fail, 135 warn, 88 accepted (1850 files), baseline 124 entries, both 0. App: tsc 0; eslint on 27 changed files 0; `jest src/features/wallet` 30 suites, 433 tests, 0; gates 0 fail, 18 warn, 0 accepted (1326 files), baseline 0; check_tasks 0 (432 tasks). Pictures: `scratchpad/wallet-21-v/pics/` (W1, each currency tab, W20, W21, PIN sheet, receipt in light; W20 and W21 in dark), beside the builder's in `wallet-21-b/`.

### Findings

- **H1, high, defect: WAWU's fee on a swap out of naira is shown and recorded as paid, and never collected.** `src/nuvion/areas/fx.ts:825` `receiver()`: for `NGN` it ignores `side.ban` and resolves the person's own naira account, so the fee leg (`src/money/fx/fx-operations.service.ts:546`, `to: { currency: 'NGN', accountId: null, ban }`) is a transfer to the same account. Nuvion dev answers 400 and keeps a `failed` record `wawu-fx-<id>-fee`, `status_reason cannot_transfer_to_same_account`. The next sweep sends the same reference, gets 409 `duplicate_reference`, `findByReference` returns the failed record, and `feeLeg()` writes `feeLeg: 'done'` (`fx-operations.service.ts:557`) without looking at the receipt's status. Repro: `FX_SWAP_FEE_NGN_MINOR=500` and `FX_FEE_COLLECTOR_NGN_BAN` set to the operational account's ban, quote and swap NGN to USD 10,000 kobo. Quote and review say total 10,500; Nuvion debits 10,000; four swaps left `feeLeg` done four times and the dev naira balance exactly 4 x 10,000 short of the quoted totals (40,921 to 7,498 with one 6,577 credit). Fix: route the fee leg to the collector's ban whatever the currency; treat a returned `failed` transfer as not paid (leave `owed`, never `done`); add a spec on the provider seam that fails when the fee leg's receiving ban is the payer's own.
- **M1, medium, defect: `contract/openapi.json` is not what `contract:build` produces.** `src/money/fx/fx.controller.ts:235` says "the app reads it while a swap is unfinished"; `contract/openapi.json:19426` still says "what the app polls after `pending`". CI's `contract` job (`.github/workflows/branch-checks.yml:263`) fails a branch like this. Fix: `npm run contract:build`, commit, copy to the mobile `contract/` and `npm run api` (the app's copy is byte-equal to the stale one today).
- **M2, medium, defect: CAD and AED answer a provider refusal with a promise.** Dev refuses their details (503) every time; the Hub answers `details: null` with no reason and `FxBalanceCard.tsx:73` writes "Account details are on their way". Nothing backs "on their way"; the brief wants the refusal said plainly. Fix: the Hub names the state (details unavailable, with the provider's refusal), the card says details are not available right now and when to look again, no promise of arrival.
- Note, not this task: a wallet read answers `bankName: ""` when `NUVION_WALLET_BANK_NAME` is not configured, and the app then shows "We couldn't load your wallet" on Home and Wallet (`src/features/wallet/api/home.ts:65`). Config on the stack, not WALLET-21.
- Note: the verifier restored `contract/openapi.json` in its own throwaway worktree with `git checkout -- <file>` after `contract:build` rewrote it (a Never; nothing of the builder's was touched, the worktree is deleted).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
