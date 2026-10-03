---
id: SETTINGS-05
title: Delete account
owner: DEV
area: SETTINGS
order: 177
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SETTINGS-06, SETTINGS-08, MONEY-11, MONEY-13, UI-02, SETTINGS-01, WALLET-05]
decisions: [R-17, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [Z6, Z7, Z8]
---
# SETTINGS-05 · Delete account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-17 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py Z6 Z7 Z8` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z6 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **Z6 · Delete account**: 'Delete your account? This can't be undone after 30 days.' Warning card 'Empty your wallet first. You have ₦485,250.75. Withdraw it to your bank before deleting.' Withdraw. Lists what goes: profile, content and communities; purchases and tickets; wallet (no cards at launch; recorded in BRIEF). Continue (enabled when wallet empty).
- **Z7 · Confirm**: 'Why are you leaving? (optional)' select (I don't use it enough); 'Type DELETE to confirm'; Delete my account.
- **Z8 · Scheduled**: 'Scheduled for deletion. On 26 October. Sign in before then to cancel.' Done.

## Brief changes (build these, not the canvas)

- **Z6**: "wallet". No cards at launch. (Why: R-16.)

## Capability checks

- [ ] **Z6**: a user can tap Withdraw (-> wallet); tap Continue (-> Z7).
- [ ] **Z7**: a user can pick reason (optional); type DELETE; confirm.
- [ ] **Z8**: a user can Done (signs out).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states Z8.
- [ ] From Z2 (SETTINGS-01), a user can tap Delete account and reach Z6 (this task adds the row, as Z2 draws it).
- [ ] A user without a wallet sees no wallet warning and can continue.

## What the backend serves today (from the analysis)

- **Z6**: partial. Missing: No wallet-empty precheck on delete; grace is 48h not 30 days; content is removed immediately (not restorable); cards do not exist.
- **Z7**: partial. Missing: No place to send or store the leaving reason.
- **Z8**: partial. Missing: No cancel path: WAWU ID login does not check or clear pending_deletion, and the hub has no cancel endpoint; content already marked removed would not come back.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z6: 'This can't be undone after 30 days.'
- Z6: 'You have ₦485,250.75.'
- Z6: 'Empty your wallet first'
- Z8: 'On 26 October' (≈25 days after board date; implies 30-day window)
- Z8: 'Sign in before then to cancel.'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
