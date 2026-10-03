---
id: WALLET-21
title: Dollar and crypto accounts, swap
owner: YOU
area: WALLET
order: 203
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-32, WALLET-33, WALLET-01]
decisions: [R-16, R-37]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W2, W3, W20, W21, W22, W23]
---
# WALLET-21 · Dollar and crypto accounts, swap

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

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
