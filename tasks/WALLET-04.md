---
id: WALLET-04
title: Transaction history and detail
owner: DEV1
area: WALLET
day: 3
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [MONEY-15]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [W26, W27, W28]
---
# WALLET-04 · Transaction history and detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- The design: `python3 scripts/design/render_design.py W26 W27 W28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 3.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| W26 | Transaction history | Full ledger with search, filter chips (All, Money in, Money out, Bills, Content), a monthly In/Out summary, rows grouped by day, tap to open a receipt. |
| W27 | Transaction detail | Receipt for one transaction: type, source content, from, to, date, reference, Completed; Share receipt; Report a problem opens support chat with reference. |
| W28 | History · no results | Empty filter result (Bills in September) with 'Pay a bill' CTA. |

## Capability checks

- [ ] **W26**: a user can search transactions; filter by All/Money in/Money out/Bills/Content; tap a row to open W27.
- [ ] **W27**: a user can Share receipt (W41); Report a problem.
- [ ] **W28**: a user can Pay a bill.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W28.

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| W26 | partial | History is WAWU's own instruction ledger, not the bank's record: it misses money paid directly into the NUBAN, bills, buyer-side unlocks/tips, and has no counterparty, description, category, search, filter, monthly summary or pagination cursor (take<=200). Amounts are whole naira, canvas shows kobo. |
| W27 | missing | No transaction-by-id endpoint, no counterparty/linked content, no support ticket route. |
| W28 | missing | No category filter on history. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

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
