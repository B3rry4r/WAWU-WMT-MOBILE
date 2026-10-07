---
id: HOME-08
title: Content detail: free video and course layouts
owner: YOU
area: HOME
order: 144
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [HOME-03, UI-02, HOME-13, HOME-12]
decisions: [R-8]
passes: [V1, V4, V5, V6, V9]
artboards: [H24, H25]
---
# HOME-08 · Content detail: free video and course layouts

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py H24 H25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H25 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H24 · Detail · free video**: Free video detail: Free · 1:50, 12.4K views, Tip instead of a price, link 'From the course VFX for Beginners · 12 lessons ₦8,000', 340 comments.
- **H25 · Detail · course**: Course detail: 12 lessons · 2h 40m, 1,280 students, lesson list with lesson 01 tagged Free and the rest locked, Unlock course · ₦8,000, Pay from wallet.

## Brief changes (build these, not the canvas)

- **H25**: as H19: a price if it opens the unlock sheet, or the total "Unlock course · ₦8,015.75" (₦8,000 + Fintava's ₦15.75) if it goes straight to the PIN. (Why: rule 5 and the purchases default.)

## Capability checks

- [ ] **H24**: a user can Tip (H26); open parent course (H25); Follow; Share/Save/Rate.
- [ ] **H25**: a user can play free lesson; See all 12 lessons; Unlock course.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **H24**: partial. Missing: Free content is supported; no relation from a free piece to its parent course.
- **H25**: partial. Missing: No per-lesson free flag, no per-lesson asset, no student count on the response, wallet unlock absent.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H24: ₦8,000 course
- H24: 12.4K views · 3 days ago
- H25: ₦8,000
- H25: 1,280 students
- H25: 12 lessons · 2h 40m

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
