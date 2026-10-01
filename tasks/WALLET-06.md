---
id: WALLET-06
title: Wallet settings, PIN create and reset, statements
owner: YOU
area: WALLET
order: 133
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-09, MONEY-14]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W35, W36, W37, W38]
---
# WALLET-06 · Wallet settings, PIN create and reset, statements

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W35 W36 W37 W38` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W35 · Wallet settings**: Settings hub: account tier with daily limit and KYC basis, Transaction PIN (last changed), Face ID for payments, Cards, Beneficiaries count, Statements, Account details, Help with a payment.
- **W36 · Transaction PIN · create**: Step 1 of 2: create a 4-digit PIN used for every payment, transfer and withdrawal; then confirm.
- **W37 · Transaction PIN · reset**: Forgot PIN: OTP to phone on file with resend timer, then W36.
- **W38 · Statements**: Statement request: account, period presets or custom range, format Stamped PDF or CSV, email destination, Send statement; toast on W35.

## Launch scope

Statements (W38) come after launch (WALLET-27): the row is hidden until then, not shown disabled.

## Capability checks

- [ ] **W35**: a user can Transaction PIN (W36); toggle Face ID; Cards; Beneficiaries; Statements (W38); Account details; Help with a payment.
- [ ] **W36**: a user can enter PIN; confirm PIN.
- [ ] **W37**: a user can enter OTP; Resend.
- [ ] **W38**: a user can pick period; pick format; Send statement.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **W35**: missing. Missing: No tiers, limits, PIN, beneficiaries or settings aggregate.
- **W36**: missing. Missing: No PIN set/confirm.
- **W37**: missing. Missing: No PIN reset; OTP must come from WAWU ID or a new SMS provider.
- **W38**: missing. Missing: No statement generation or email.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W35: Tier 2 account ₦5,000,000 daily · BVN + NIN verified
- W35: Fintava MFB · 812 345 6789
- W36: 'Four digits.'
- W37: 'Resend in 0:42'
- W37: +234 803 ••• 4412 (sample)
- W38: Stamped PDF 'for visa and loan applications' (acceptance claim)
- W38: lennox@wawu.africa (sample)

## Designer notes (⚠, unresolved)

- W35: “⚠ The tiers and limits follow CBN KYC levels. The real numbers come from Fintava.”
- W38: “⚠ This depends on Fintava issuing signed statements.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
