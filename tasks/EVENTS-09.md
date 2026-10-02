---
id: EVENTS-09
title: At the door: scan, let in, already used, not valid
owner: DEV3
area: EVENTS
order: 57
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EVENTS-05, EVENTS-03, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9, V10]
artboards: [E19, E20, E23, E24]
---
# EVENTS-09 · At the door: scan, let in, already used, not valid

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E19 E20 E23 E24` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E19, E20, E23, E24, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

V10 runs on a real Android phone only (DECISIONS R-24).

Native modules: `expo-camera` (E19 scanner). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E19 · At the door**: Camera scanner: 'Point at the ticket QR', 'Type the code instead'.
- **E20 · Let them in**: Green result: 'LET THEM IN · Regular · Lennox Emmanuel · In the room 23 · Still to arrive 41'.
- **E23 · Already used**: Amber result: 'ALREADY USED · Checked in at 09:52 by Door 1'.
- **E24 · Not valid**: Red result: 'NOT A VALID TICKET · This code isn't for this event'.

## Capability checks

- [ ] **E19**: a user can scan QR; type code.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E20, E23, E24.
- [ ] Door staff a host added can let a valid ticket in and see the holder's name (E20).
- [ ] The same ticket scanned twice shows Already used with the time and the door (E23).
- [ ] A ticket for another event shows Not valid (E24).

## What the backend serves today (from the analysis)

- **E19**: served. Missing: Only the host's own account may scan (scan() throws 'Only the organiser can check tickets in.'); no door-staff delegation.
- **E20**: partial. Missing: Returns buyerWawuId, not the holder's display name the board prints; needs a profile join.
- **E23**: partial. Missing: 'by Door 1' needs named scanners/doors: no door-staff model, scan restricted to host, checkedInBy not returned.
- **E24**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- None recorded.

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
