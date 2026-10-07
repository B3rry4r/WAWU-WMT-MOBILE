---
id: EVENTS-01
title: Events: list, filters, detail, sold out
owner: DEV3
area: EVENTS
order: 32
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [SHELL-01, SHELL-02, UI-02, UI-03, EVENTS-02]
decisions: [R-37]
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

- **Files** (mobile only; the backend needed no change, EVENTS-02 serves Kind and the Hub's `total` gives "Show N events"): `src/features/events/` (`api.ts`, `format.ts`, `going.ts`, `parts.tsx`, `FilterSheet.tsx` E8, `EventsScreen.tsx` E1, `EventDetailScreen.tsx` E2 and E9, `TicketRow.tsx`, 44 tests), routes `src/app/events/index.tsx` (`/events`) and `src/app/events/[id].tsx` (`/events/<id>`), `BACKEND_GAPS.md` G-270 to G-273. No shared file touched, no SHARED-CHANGES row needed. Contract re-synced from backend main 6c0e435: no diff.
- **Counts** (`npm run check`): before 46 suites, 797 tests, gates 9 run, 216 files, 0 fail 0 warn 0 accepted, exit 0. After (main merged, it had not moved): 48 suites, 841 tests (+44, all new), gates 9 run, 228 files, 0 fail 0 warn 0 accepted, exit 0.
- **Capability checks, run on the local stack (backend 6c0e435 and wawu-id 4715d17 on :4180/:4181, real sign-in as user@test.wawu.dev, built web app, Chromium 390 px):** E1 open filter sheet, tap an event (the featured card landed on `/events/<id>`), toggle Going on a row: passed (jest 44 tests, and the live tap wrote one `EventGoing` row read back from Postgres). E2 toggle Going, set a quantity per tier, running total: passed (live: Regular 1 shows `₦7,500`; jest: VIP +2 gives `₦31,500`, then Regular 0 gives `₦24,000`). E8 pick when, pick kind, pick category, apply: passed in jest (each pick reaches the Hub as `view`, `type`, `category`; "Show 24 events" is the Hub's `total`); the live sheet showed "Show 6 events" for the 6 seeded upcoming events. E9: passed live and in jest (every tier "Sold out", "Every ticket for this event has sold.").
- **States entered by their real cause (jest, Hub answers faked at `fetch`):** loading (a request that never answers), empty (calendar with no rows; a kind that matches none, with Clear filters), error with Try again (Hub 500 on the list, on `options`, on tickets), event gone (404), event called off, event with no tickets, free tier, Going refused (flag goes back, message shown), double tap (one request).
- **Pictures:** `python3 scripts/design/render_design.py E1 E2 E8 E9` beside screenshots at 390 px in light and dark, taken from the built web app on the local stack: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01/shots/` (E1, E2, E8, E9 each light and dark). Not committed; the verifier takes its own. I do not say they match.
- **Defaults (agent), owner may override:** (1) the tab row shows Discover only, and E1's "Host your event" banner, E2's Get tickets and E9's disabled Sold out button are left out: each leads to a screen a later task builds (EVENTS-08 My events, EVENTS-04 Host event and banner, EVENTS-06 Get tickets), which adds it as drawn. (2) E8's Kind chips are the Hub's `GET /events/options` list in its order (All, Conference, Workshop, Concert, Meetup, then Summit, Webinar, Competition): the canvas draws four, but a host can pick all seven and a hidden kind could not be filtered to. (3) "This week" is made in the app: events starting within seven days of now (the Hub has no week window), with See all showing the full upcoming list under "Upcoming"; a filter or Past shows the plain list under "Upcoming" or "Past events"; the featured event is not repeated in the list. (4) Dates are drawn in Lagos time (UTC+1, no daylight saving) as "Sun 12 Oct · 10:00 WAT". (5) A tier that cannot be bought sits after the ones that can; its pill is Sold out, Ended or Soon. Copy not drawn: "Tickets are not on sale right now.", "This event was called off.", "No events match", "No events yet", "Couldn't load events", "This event isn't available". (6) One ticket of the first buyable tier is picked when the screen opens, as E2 draws; the running total counts the picked tiers across tiers, in kobo. (7) Share sends the name, time and place (G-272). (8) The quantity cap is 50 a tier, a copy of the Hub's order cap (G-273).
- **Differs from the canvas, for a reason:** the line under a tier is "N left", "Ended 30 Sep" or "Opens 5 Oct" instead of a description nothing writes (G-270); the hero and rows say "from" the Hub's cheapest tier, which counts a sold-out or ended tier (G-271, seen live: hero "from ₦5,000" while ₦7,500 is the cheapest to buy); the Early bird pill and "Ended" line are drawn as the canvas has them.
- **Way in:** nothing in the app links to `/events` yet. Home's Events tile (HOME-01) and Explore's event card (EXPLORE-01) both depend on this task and add their own entry; until then the screens are reached by the route.
- **NOT RUN:** V10 (phone, tester build): needs OPS-10 for the live backend and an Android tester build; unblocked when both exist. Paid ticket buy is EVENTS-06 and EVENTS-07, not this task.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
