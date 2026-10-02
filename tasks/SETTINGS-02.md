---
id: SETTINGS-02
title: About, terms and privacy policy
owner: DEV
area: SETTINGS
order: 90
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, UI-02]
decisions: [R-1]
passes: [V1, V4, V5, V6, V9]
artboards: [Z9, Z10, Z11]
---
# SETTINGS-02 · About, terms and privacy policy

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py Z9 Z10 Z11` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for Z9, Z10 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The bank name and licence line come from config, filled in by the owner (R-1). Terms and Privacy text are the owner's legal text, served by the backend with their date; the canvas text is layout only (owner input).

## Artboards

- **Z9 · About**: About WAWU: Version 2.4.0; description '...get paid for what they know, with a real bank account built in.'; 'Banking by' and the bank name, then the licence line, both from config filled in by the owner (R-1, BRIEF Z9); Contact support support@wawuafrica.com; Rate the app.
- **Z10 · Terms**: Terms, Updated 1 September 2026: Using WAWU (18 or over, true details, one account per person); Money (payments move through your WAWU wallet, held at the bank named by config (Loma Bank, BRIEF Z10); fees shown before you pay); What you sell (you own your work; WAWU may show it to buyers).
- **Z11 · Privacy policy**: Privacy policy, Updated 1 September 2026: What we collect (details, BVN check result, in-app activity); What we never do (sell data, show BVN/NIN/balance); Your choices (download or delete from Privacy).

## Brief changes (build these, not the canvas)

- **Z9**: "Banking by" + the bank name slot (sample "Loma Bank"), and the licence line as a slot filled from config by the owner (rule 7). (Why: R-1.)
- **Z10**: "held at Loma Bank" (bank name slot). The terms text itself is the owner's legal text and will be replaced; keep the layout. (Why: R-1.)

## Capability checks

- [ ] **Z9**: a user can contact support; rate the app; open Terms (-> Z10).
- [ ] **Z10**: a user can read; go to Privacy policy.
- [ ] **Z11**: a user can read.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **Z9**: n/a.
- **Z10**: served. Missing: Content itself is a legal matter; the board text is a placeholder summary.
- **Z11**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- Z9: 'Version 2.4.0'
- Z9: 'Banking by Fintava MFB'
- Z9: 'Licensed by the CBN'
- Z9: 'a real bank account built in'
- Z9: support@wawuafrica.com (bundle rule says emails stay @wawu.africa)
- Z10: 'Updated 1 September 2026'
- Z10: 'You need to be 18 or over'
- Z10: 'One account per person'
- Z10: 'held at Fintava MFB'
- Z10: 'Fees are shown before you pay'
- Z11: 'Updated 1 September 2026'
- Z11: 'your BVN check result' is collected
- Z11: never show 'your BVN, NIN or balance'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
