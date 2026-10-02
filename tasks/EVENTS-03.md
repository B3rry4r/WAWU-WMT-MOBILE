---
id: EVENTS-03
title: My tickets, ticket QR, checked in
owner: DEV3
area: EVENTS
order: 48
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EVENTS-01, EVENTS-05, UI-02]
decisions: [R-8]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E6, E7, E12]
---
# EVENTS-03 · My tickets, ticket QR, checked in

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E6 E7 E12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E6, E7, E12, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Before EVENTS-06, tickets exist only as ₦0 tickets (R-8): the verifier reaches E6, E7 and E12 with a free ticket. E11 (called off) moved to EVENTS-08, where its cause (E25) is built.

Native modules: a QR renderer (E7), `expo-brightness` ("Brightness goes up when this opens"). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

## Artboards

- **E6 · My tickets**: My tickets with Upcoming / Past tabs; rows grouped per order ('1 × Regular', '2 × VIP').
- **E7 · Ticket QR**: Single ticket with large QR and code; note 'Brightness goes up when this opens.'
- **E12 · Checked in**: Ticket view: 'Already checked in Sun 12 Oct at 09:52.'

## Capability checks

- [ ] **E6**: a user can switch Upcoming/Past; tap a ticket (E7).
- [ ] **E7**: a user can show QR at door.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as is the drawn state E12.
- [ ] **E12**: a user whose ticket was scanned at the door (EVENTS-05) sees "Already checked in" with the time.

## What the backend serves today (from the analysis)

- **E6**: served. Missing: Grouping into '2 × VIP' is client-side from orderId-less ticket rows: the response does not return orderId; group by event+tier works.
- **E7**: served. Missing: Screen-brightness boost is a native-app capability, no backend.
- **E12**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
