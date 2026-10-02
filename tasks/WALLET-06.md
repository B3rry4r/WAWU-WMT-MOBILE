---
id: WALLET-06
title: Wallet settings, change and reset the PIN
owner: YOU
area: WALLET
order: 121
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-09, MONEY-14, WALLET-14, UI-02, SETTINGS-01]
decisions: [R-1, R-16, R-26, R-10, R-6]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W35, W36, W37]
---
# WALLET-06 · Wallet settings, change and reset the PIN

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W35 W36 W37` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W35, W36 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W35 · Wallet settings**: Settings hub: a limits row the app fills from Fintava or hides (no tier, BRIEF W35), Transaction PIN (last changed), fingerprint or face for payments (R-26), Cards, Beneficiaries count, Statements, Account details (the bank name from the API, Loma Bank), Help with a payment.
- **W36 · Change the transaction PIN**: drawn as 'create'; a wallet holder already set a PIN on A9, so here it is changed. Step 1 of 2: a new 4-digit PIN used for every payment, transfer and withdrawal; then confirm.
- **W37 · Transaction PIN · reset**: Forgot PIN: OTP to phone on file with resend timer, then W36.

## Launch scope

Statements (W38) are built whole by WALLET-35 after launch, which adds the Statements row. Cards come after launch
(R-16): WALLET-22 adds the Cards row. Help with a payment is added by SUPPORT-01. Until those land, the rows are
not built (docs/WORKFLOW.md section 7, "Links between screens").

## Brief changes (build these, not the canvas)

- **W35**: "Account details · Loma Bank · 812 345 6789" (bank name slot). The top row can't name a tier: draw it as a limits row that the app can fill or hide. (Why: R-1; Fintava fact: no tiers in the API, limits still to come from Fintava.)
- **W35**: "Fingerprint or face for payments" (what the phone has). Cards and Statements are not built at launch (below). Help with a payment opens the support chat (SUPPORT-01). (Why: R-26, R-16, R-30.)
- **W36**: "change" the PIN: a wallet holder already set one on A9. (Why: R-6: the PIN is created when the wallet opens.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W35: Cards (opens W31): added by WALLET-22 after launch; not built at launch (BRIEF, "Not built at launch")
- W35: Statements (opens W38): added by WALLET-35 after launch; not built at launch (BRIEF, "Not built at launch")
- W35: Help with a payment (opens the support chat): added by SUPPORT-01

## Capability checks

- [ ] **W35**: a user can open Transaction PIN (W36); turn on fingerprint or face for payments; see Beneficiaries; open Account details.
- [ ] **W36**: a user can enter a new PIN and confirm it.
- [ ] **W37**: a user can enter OTP; Resend.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From Z2 (SETTINGS-01), a user can tap Wallet and PIN and reach W35 (this task adds the row, as Z2 draws it).

## What the backend serves today (from the analysis)

- **W35**: missing. Missing: No tiers, limits, PIN, beneficiaries or settings aggregate.
- **W36**: missing. Missing: No PIN set/confirm.
- **W37**: missing. Missing: No PIN reset; OTP must come from WAWU ID or a new SMS provider.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W35: Tier 2 account ₦5,000,000 daily · BVN + NIN verified
- W35: Fintava MFB · 812 345 6789
- W36: 'Four digits.'
- W37: 'Resend in 0:42'
- W37: +234 803 ••• 4412 (sample)

## Designer notes (⚠, unresolved)

- W35: “⚠ The tiers and limits follow CBN KYC levels. The real numbers come from Fintava.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
