---
id: EVENTS-03
title: My tickets, ticket QR, checked in
owner: DEV3
area: EVENTS
order: 48
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [EVENTS-01, EVENTS-05, UI-02]
decisions: [R-8, R-37]
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

_Builder session, 7 Oct 2026. Mobile `wmt/EVENTS-03` (main 5fec168 plus `origin/wmt/EVENTS-01` merged in, mobile PR 14) and backend `wmt/EVENTS-03` (main 3041887 plus `origin/wmt/EVENTS-01` merged in, backend PR 78). Depends on those two merging first._

- **Backend (additive, new file set `src/event-ticketing/event-held-tickets.*`, no migration):** `GET /events/tickets/held?view=upcoming|past&page&perPage` (one row per order and tier, with count, event zone, venue, banner, the tickets' ids and statuses) and `GET /events/tickets/held/{ticketId}` (the code, status, `checkedInAt`, the holder's name from WAWU ID, the event, the tickets beside it). The protected `GET /events/tickets/mine` is untouched (its keys are asserted by a spec); the new routes exist because it has no order, no zone and no holder. Past = the event is over (`endsAt ?? startsAt`) or called off. Someone else's ticket, an unpaid order's and an unknown id are all the same 404. Contract regenerated: 270 lines added, none removed.
- **Backend checks:** `tsc` 0; 11 contract specs (`event-held-tickets.contract.spec.ts`) pass on a fresh database against the mock WAWU ID (real WAWU ID not started: mock used); six mutants (unpaid orders counted, order direction, paging skip, owner check dropped, called-off not past, total) each fail the specs. Odd inputs probed by the specs: `view=bogus`, empty view, `page` 0, -1, `1e8`, 99999, `perPage` 0, 101, `abc`, an unknown key, a non-uuid id (all 400), unknown id 404. Protected route suite `scripts/protected-routes/run.sh --fresh`: 244 of 244 pass (run before the EVENTS-01 merge, which only adds `from-prices`). Gates: 16 fail / 58 warn / 76 accepted, none in my files; baseline check passes. NOT RUN to a clean result: `src/event/tests/event.contract.spec.ts` fails on its POST /events cases here (files untouched by me; mock WAWU ID on :4221 instead of :4001), the full backend suite.
- **Mobile files:** `src/features/events/` `MyTicketsScreen.tsx` (E6), `TicketScreen.tsx` (E7 and E12), `ticketParts.tsx`, `ticketsApi.ts`, `ticketFormat.ts` (reuses `watOf` and `whenLine` of `format.ts`), `qr.ts`, `brightness.ts`, `useRefetchOnFocus.ts` (`useRefetchTiersOnFocus` now calls it); routes `src/app/events/tickets/index.tsx` (`/events/tickets`) and `[ticketId].tsx`; 5 test files (qr, ticketFormat, ticketsScreens 37, ticketsFocus). Contract copied from backend `wmt/EVENTS-03` (EVENTS-01 merged in), then `python3 scripts/api/sync_contract.py` (not `npm run api`, which reads backend main only). SHARED-CHANGES rows EVENTS-03 #1 to #3.
- **Capability checks.** E6: switch Upcoming and Past (spec asks the Hub for each view, rows differ), tap a row opens a ticket (spec, first scannable ticket of the order). E7: the QR is drawn from exactly the server's `code` (spec records the text given to the encoder; the screenshot of the built screen decodes to the code with jsQR, light and dark; the same code is accepted by the live `POST /events/{id}/door/check-in`, upper or lower case, and the ticket then reads checked in with the door's own time). E12: scanned at the door through the real route, the ticket screen shows "Already checked in" with the time (live: "Wed 7 Oct at 18:20." for a 17:20Z scan, Lagos).
- **QR is our own encoder (`qr.ts`, byte mode, level M, versions 1 to 6).** Row 8's renderer is not installed and `package.json` is fenced; `react-native-svg` is. Fingerprints of six texts equal the `qrcode` package's output; jsQR decodes 12 texts including the ticket code shape, and the logo in the middle (a fifth in the canvas) was cut to 12 percent of the plate because a larger one stopped jsQR reading it.
- **Brightness not built (row 8 not applied):** the note is not drawn while the phone cannot raise brightness; `brightness.ts` holds the one swap, written in SHARED-CHANGES EVENTS-03 #1. A spec covers both states.
- **Defaults (agent), owner may override:** (1) a row of "2 x VIP" opens the first ticket that can still be scanned and E7 shows "Ticket 2 of 3" with Previous and Next (not drawn, needed to show each QR); (2) called-off events sit under Past, their ticket shows a warning and no QR; (3) a Lagos event's line carries no zone label as drawn, another zone shows the host's label beside its own date; (4) the check-in time in another zone names the zone ("09:52 EDT"); (5) card corner 26 (`radius.money`), the canvas 28 has no token (SHARED-CHANGES #3); (6) copy for empty, error, offline, void and not-available states is mine, in the canvas's tone.
- **States:** loading, empty (one text per tab), error with Try again (server words), offline ("You're offline", `kind: network`), unreadable answer, not available (non-uuid link never reaches the Hub; 404), void, checked in, paging (Show more), mixed groups. Refetch on focus, no timer (`ticketsFocus.test.tsx`).
- **Mutants (mobile):** 11 mutations (first-scannable rule, view ignored, paging off, uuid check off, checked-in without time, QR text changed, previous/next, year, void still drawing a code, brightness note and boost conditions): all caught; one (void) first missed because I mutated the wrong file, redone, caught.
- **Pictures:** `npm run web` at 390 px, light and dark, against the local Hub (:4220), mock WAWU ID (:4221, through a small proxy on :4225 that wraps its login answer in `data` with a refresh token, as WAWU ID sends it) signed in through the real sign-in screen. Screenshots in `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events03/shots/` (e6, e7, e7pair, e12, gone). Not claimed to match: the verifier decides.
- **R-41 hub entries: NOT DONE, blocked.** The canvas enters E6 from E5 ("My tickets") and from "Me menu"; E5 is EVENTS-06 (not built) and the Me menu draws no tickets row, so there is no hub to add a button to. Fact that unblocks it: EVENTS-06 merged, then its E5 button opens `/events/tickets`. The screen is reached by that route until then.
- **NOT RUN:** V10 (phone), brightness, the full backend suite, real WAWU ID (mock used), a paid ticket (R-8: free tickets only, no Fintava keys).
- **Gaps filed:** none; every field the screens show is served (the old `tickets/mine` lacked order, zone and holder, so new routes were added).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
