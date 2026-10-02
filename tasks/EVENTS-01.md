---
id: EVENTS-01
title: Events: list, filters, detail, sold out
owner: DEV3
area: EVENTS
order: 32
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, SHELL-02, UI-02, UI-03, EVENTS-02]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [E1, E2, E8, E9]
---
# EVENTS-01 · Events: list, filters, detail, sold out

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py E1 E2 E8 E9` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for E1, E2, E8, E9, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

E8's Kind values (Conference, Concert) come from EVENTS-02. The My events and Host event tabs are added by EVENTS-08 and EVENTS-04, and Get tickets by EVENTS-06 (docs/WORKFLOW.md section 7).

## Artboards

- **E1 · Events**: Events home with Discover / My events / Host event tabs, a FEATURED hero (WAWU Creators Summit, from ₦7,500), a 'This week' list with per-row Going/Going? state and 'from' prices, and a 'Host your event' banner (verified accounts only).
- **E2 · Event**: Event detail: date/time WAT, venue, host (WAWU Africa), Going toggle, ticket tiers with per-tier quantity steppers (Regular ₦7,500 ×1, VIP ₦12,000 ×0, Early bird 'Ended 30 Sep · Sold out'), running total and Get tickets. This task builds the steppers and the running total; one payment for several tiers is EVENTS-07's order lines.
- **E8 · Filters**: Filter sheet over E1: 'Browse the calendar' When (Upcoming/Past), Kind (All/Conference/Workshop/Concert/Meetup), Category (Every category), 'Show 24 events'.
- **E9 · Sold out**: Event detail with every tier marked Sold out and 'Every ticket for this event has sold.'

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- E1: Host your event (opens E13): added by EVENTS-04
- E1: the My events tab (opens E17): added by EVENTS-08
- E2: Get tickets (opens E3): added by EVENTS-06

## Capability checks

- [ ] **E1**: a user can open the filter sheet (E8); tap an event (E2); toggle Going on a row.
- [ ] **E2**: a user can toggle Going; set a quantity per tier and see the running total.
- [ ] **E8**: a user can pick when; pick kind; pick category; apply.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states E8, E9.

## What the backend serves today (from the analysis)

- **E1**: served.
- **E2**: partial. Missing: Board draws a stepper on every tier (a basket). BuyTicketsDto takes a single ticketTypeId; EventOrder has a single ticketTypeId column. Buying Regular + VIP in one payment needs order lines (EventOrderLine or ticketTypeId per EventTicket only) and one wallet debit for the total.
- **E8**: partial. Missing: Board 'Kind' values Conference and Concert are not EventType values (Conference exists only as an EventCategory; Concert exists nowhere). Either remap Kind to EventCategory or extend EventType.
- **E9**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- E1: WAWU Creators Summit from ₦7,500
- E1: Gospel Night Live from ₦5,000
- E1: Monetise Your Content Online: Free
- E1: Aba Fashion Market from ₦3,500
- E1: Host your event: 'Sell tickets. Verified accounts only.'
- E2: Regular · General admission ₦7,500
- E2: VIP · Front rows, lunch ₦12,000
- E2: Early bird · Ended 30 Sep · Sold out
- E2: 1 ticket ₦7,500
- E2: Sun 12 Oct · 10:00 WAT, Eko Convention Centre, Victoria Island
- E8: Show 24 events

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
