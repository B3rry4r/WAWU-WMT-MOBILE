---
id: KYC-04
title: Open your wallet: account opened, create PIN
owner: YOU
area: KYC
order: 88
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-09, MONEY-12, KYC-03, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [A8, A9, A10]
---
# KYC-04 · Open your wallet: account opened, create PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py A8 A9 A10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A8 · Wallet open**: 'Your wallet is open' card: the bank name from the API (Loma Bank; the long legal name must fit), account name, account number (Copy), Bank row, a Limit row shown only if Fintava returns a limit; Create your transaction PIN (-> A9). No tier and no 'Raise your limits' (BRIEF A8).
- **A9 · Create PIN**: Step 1 of 2: 'Create your transaction PIN. Four digits. It approves every payment and transfer.' Keypad.
- **A10 · Confirm PIN**: Step 2 of 2: 'Enter it again'. Then the user returns to where Open your wallet started.

## Ruling R-6

This flow is not part of sign-up. It starts the first time someone taps Wallet
or anything that moves money, for every user, new or existing. The design draws
these screens inside sign-up; keep their look, change only where they sit. The
BVN and NIN step is A26 (KYC-05); A3 is sign-up and no longer asks for the BVN. Someone without a Nigerian BVN cannot open a Naira wallet; dollar
and crypto accounts are for them and come after launch, so for now the flow
ends with a clear "not available yet" instead of an error.

## Brief changes (build these, not the canvas)

- **A8**: the subtitle and the Bank row show the bank name as a slot the app fills. Sample: "Loma Bank", and make sure the long legal name "Iyin Ekiti Microfinance Bank Limited (Loma Bank)" also fits (wrap or truncate). No "Tier 1". Draw the Limit row as a slot that can be hidden. Remove the "Raise your limits" link; "Create your transaction PIN" stays. (Why: R-1 and a Fintava fact: the bank is Loma Bank and its name comes from the API. Fintava's API has no tiers, so there is nothing to raise; limits are still a question for Fintava.)
- **A10**: a mismatch uses the PIN sheet's wrong-PIN line in W11's style; KYC-04 records its wording here. (Why: every state needs a real look; the canvas's own style is used.)

## Capability checks

- [ ] **A8**: a user can copy the account number and tap Create your transaction PIN; the bank row shows the name from the API (Loma Bank); the Limit row shows only if Fintava returns a limit.
- [ ] **A9**: a user can enter 4 digits.
- [ ] **A10**: a user can re-enter the 4 digits; a mismatch uses the PIN sheet's wrong-PIN line (W11 style), with its wording listed in `docs/designer/BRIEF.md`.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] After A7 (KYC-03), a user lands on A8 (this task adds that step).
- [ ] After A10, a user who started from Pay returns to that pay sheet, and one who started from the Wallet tab lands on W5.

## What the backend serves today (from the analysis)

- **A8**: partial. Missing: Wallet is Flutterwave (payout subaccount at Flutterwave MFB), opened only for accountType=creator; no tier, no limits, no Fintava integration; a 'discover' user gets no wallet.
- **A9**: missing. Missing: No transaction PIN anywhere: no column, no route, no hashing, no lockout. Wallet withdraw (POST /api/hub/wallet/withdraw) approves on bearer token alone. HIGH PRIORITY: every Wallet flow money movement (W11 etc.) depends on this.
- **A10**: missing. Missing: Same as A9. No mismatch state is drawn.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A8: 'Tier 1 · Fintava MFB'
- A8: 'Bank Fintava MFB'
- A8: 'Limit ₦300,000 balance'
- A8: sample NUBAN 812 345 6789
- A9: PIN is 'Four digits'
- A9: 'It approves every payment and transfer.'
- A10: 'Four digits'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
