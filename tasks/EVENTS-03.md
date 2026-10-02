---
id: EVENTS-03
title: My tickets, ticket QR, called off, checked in
owner: DEV2
area: EVENTS
order: 84
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EVENTS-01]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E6, E7, E11, E12]
---
# EVENTS-03 · My tickets, ticket QR, called off, checked in

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py E6 E7 E11 E12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **E6 · My tickets**: My tickets with Upcoming / Past tabs; rows grouped per order ('1 × Regular', '2 × VIP').
- **E7 · Ticket QR**: Single ticket with large QR and code; note 'Brightness goes up when this opens.'
- **E11 · Called off**: Ticket view for a cancelled event: 'This event was called off · ₦7,500 is back in your Naira wallet.'
- **E12 · Checked in**: Ticket view: 'Already checked in Sun 12 Oct at 09:52.'

## Capability checks

- [ ] **E6**: a user can switch Upcoming/Past; tap a ticket (E7).
- [ ] **E7**: a user can show QR at door.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E11, E12.

## What the backend serves today (from the analysis)

- **E6**: served. Missing: Grouping into '2 × VIP' is client-side from orderId-less ticket rows: the response does not return orderId; group by event+tier works.
- **E7**: served. Missing: Screen-brightness boost is a native-app capability, no backend.
- **E11**: partial. Missing: Refund destination changes: board says money returns to the buyer's Naira wallet. Needs a wallet credit (Fintava transfer from wherever ticket money is held back to the buyer wallet) replacing flutterwave.refundCharge; myTickets response has no refund amount/status (EventOrder.refundedAt/refundReference not exposed).
- **E12**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E11: ₦7,500 is back in your Naira wallet

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
