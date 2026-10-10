---
id: WALLET-35
title: Statements: ask for a statement by email
owner: YOU
area: WALLET
order: 260
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-27, WALLET-06]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [W38]
---
# WALLET-35 · Statements: ask for a statement by email

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `docs/designer/BRIEF.md`: its entries for W35 and W38 (the brief is part of the design: build its version)
- The design: `python3 scripts/design/render_design.py W35 W38` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

A user can ask for a statement for a period and get it by email (W38), built whole once WALLET-27 serves
statements. Moved out of WALLET-06, where statements were after launch inside a launch task.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`. This task also adds the Statements row to W35 (WALLET-06), exactly as W35 draws it.

## Artboards

- **W38 · Statements**: Statement request: account, period presets or custom range, format Stamped PDF or CSV, email destination, Send statement; toast on W35.

## Capability checks

- [ ] From W35, a user can tap Statements and reach W38 (this task adds the row).
- [ ] **W38**: a user can pick a period; pick a format; Send statement, and the statement arrives by email with exactly that period's transactions.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W38: Stamped PDF 'for visa and loan applications' (acceptance claim)
- W38: lennox@wawu.africa (sample)

## Designer notes (⚠, unresolved)

- W38: “⚠ This depends on Fintava issuing signed statements.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
