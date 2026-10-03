---
id: WALLET-04
title: Transaction history and detail
owner: YOU
area: WALLET
order: 112
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-15, UI-02, BILLS-01]
decisions: [R-10, R-33]
passes: [V1, V4, V5, V6, V9]
artboards: [W26, W27, W28]
---
# WALLET-04 · Transaction history and detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W26 W27 W28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W26, W27 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W26 · Transaction history**: Full ledger with search, filter chips (All, Money in, Money out, Bills, Content), a monthly In/Out summary, rows grouped by day, tap to open a receipt.
- **W27 · Transaction detail**: Receipt for one transaction: type, source content, from, to, date, reference, Completed; Share receipt (the phone's share sheet at launch, R-33); Report a problem opens support chat with the reference (added by SUPPORT-01).
- **W28 · History · no results**: Empty filter result (Bills in September) with 'Pay a bill' CTA.

## Brief changes (build these, not the canvas)

- **W26**: each debit row shows the total that left the wallet: Ikeja Electric −₦10,600.00, the GTBank transfer −₦25,065.00, MTN airtime −₦2,000.00 (its charge is ₦0). "Out · September" is the sum of those totals (keep it an obvious sample). (Why: rule 5 and R-10: the money that left the wallet includes the charges.)
- **W27**: keep it. For a debit, the detail shows the amount, Fintava's charge, WAWU's fee (if any) and the total, so the charge behind each W26 row is visible here. If you draw a debit example, use the GTBank send: ₦25,000 + (₦40 + ₦25) = ₦25,065.00. (Why: R-10: the charges must be visible somewhere the person can check.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- W27: Report a problem (opens the support chat): added by SUPPORT-01

## Capability checks

- [ ] **W26**: a user can search transactions; filter by All/Money in/Money out/Bills/Content; tap a row to open W27.
- [ ] **W27**: a user can see each debit's parts (amount, Fintava's charge, WAWU's fee, total; BRIEF W27) and Share receipt through the phone's share sheet (the receipt's text and reference; the W41 image and PDF come after launch, WALLET-12).
- [ ] **W28**: a user can Pay a bill.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W28.

## What the backend serves today (from the analysis)

- **W26**: partial. Missing: History is WAWU's own instruction ledger, not the bank's record: it misses money paid directly into the NUBAN, bills, buyer-side unlocks/tips, and has no counterparty, description, category, search, filter, monthly summary or pagination cursor (take<=200). Amounts are whole naira, canvas shows kobo.
- **W27**: missing. Missing: No transaction-by-id endpoint, no counterparty/linked content, no support ticket route.
- **W28**: missing. Missing: No category filter on history.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W26: In · September ₦212,400.00
- W26: Out · September ₦96,820.50
- W26: Unlock · Lighting night shoots 3 buyers +₦7,500.00
- W26: MTN airtime −₦2,000.00
- W26: Ikeja Electric Prepaid · 45.2 kWh −₦10,500.00
- W27: Reference WAW-T1P9-7ZQA

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
