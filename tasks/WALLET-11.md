---
id: WALLET-11
title: Payout bank account
owner: YOU
area: WALLET
order: 117
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-14, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A21]
---
# WALLET-11 · Payout bank account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py A21` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A21, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A21 · Payout bank**: 'Where you get paid. Creators only. The account must be in your own name.' Bank Access Bank, Account number, resolved 'Lennox Emmanuel · matches your BVN'. Save payout account.

## Capability checks

- [ ] **A21**: a user can choose bank; enter account number; see resolved name + BVN match; save.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **A21**: partial. Missing: No standalone saved payout account (no model; withdraw takes the account every time); no automated name-vs-BVN match (no BVN name on file); KYC stores bank NAME not bank code.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A21: 'Creators only. The account must be in your own name.'
- A21: 'matches your BVN'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
