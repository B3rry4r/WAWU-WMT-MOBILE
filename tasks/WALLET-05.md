---
id: WALLET-05
title: Add money and withdraw
owner: YOU
area: WALLET
order: 140
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-09, WALLET-10]
decisions: [D5]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W15, W16, W17, W18, W19]
---
# WALLET-05 · Add money and withdraw

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D5 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- The design: `python3 scripts/design/render_design.py W15 W16 W17 W18 W19` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W15 · Add money**: Bank transfer details first (account name, number, bank Fintava MFB, share); other ways: Debit card (1.5% fee), USSD, From your Dollar account at a rate.
- **W16 · Add money · card**: Card top-up: amount with quick picks, saved Verve card or new card, card fee added on top, you pay / wallet gets; then 3-D Secure then receipt.
- **W17 · Withdraw to bank**: Withdraw: available NGN, amount with Max, destination defaulting to the KYC payout account with Change, fee, arrival estimate.
- **W18 · Withdraw · waiting on KYC**: Withdraw blocked while ID check is in review; says sending, bills and unlocks still work; link to ID check.
- **W19 · Withdraw · on its way**: Withdrawal receipt with a timeline (Requested, Sent to bank, In your bank account), reference, fee.

## Launch scope

Card top-up (W16) comes after launch (WALLET-25): show bank transfer and USSD only, and keep W16's layout for when it lands.

## Capability checks

- [ ] **W15**: a user can copy account number; share account details; pick Debit card (W16); pick USSD; fund from Dollar account.
- [ ] **W16**: a user can pick amount; pick saved card; use new card; Add ₦10,000.
- [ ] **W17**: a user can enter amount; Max; Change destination; Withdraw (then PIN W11).
- [ ] **W18**: a user can View ID check.
- [ ] **W19**: a user can Share receipt; Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W18.

## What the backend serves today (from the analysis)

- **W15**: partial. Missing: Account details exist (Flutterwave MFB). Missing: card funding, USSD funding, USD-to-NGN funding, inbound deposit recording.
- **W16**: missing. Missing: No wallet top-up by card, no saved cards, no fee quote.
- **W17**: partial. Missing: Withdraw exists (Flutterwave, KYC-gated, min ₦1,000, whole naira). Missing: default payout account lookup (bank stored as name), fee, PIN, arrival estimate.
- **W18**: served.
- **W19**: partial. Missing: Only pending/completed/failed and settledAt; no intermediate 'sent to bank' timestamp, no fee.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W15: Bank transfer Free · instant
- W15: 'It lands in seconds'
- W15: Debit card Instant · 1.5% fee
- W15: $1 = ₦1,580.00
- W15: Bank Fintava MFB
- W16: Card fee ₦150.00 (1.5%)
- W16: You pay ₦10,150.00
- W16: Wallet gets ₦10,000.00
- W16: Verve ••7710 GTBank · expires 04/28 (sample)
- W17: Fee ₦25.00
- W17: Arrives In a few minutes
- W18: 'It usually takes 1–2 working days.'
- W19: Fee ₦25.00
- W19: 'Usually within minutes'
- W19: Reference WAW-W9L2-33RT

## Designer notes (⚠, unresolved)

- W15: “⚠ From your Dollar account $1 = ₦1,580.00”
- W16: “⚠ A 1.5% card fee, added on top.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
