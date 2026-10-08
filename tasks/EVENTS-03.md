---
id: EVENTS-03
title: My tickets, ticket QR, checked in
owner: YOU
area: EVENTS
order: 48
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
depends_on: [EVENTS-01, EVENTS-05, UI-02]
decisions: [R-8, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [E6, E7, E12]
---
# EVENTS-03 · My tickets, ticket QR, checked in

Taken over by the lead's agents on 8 Oct 2026 (owner: carry on with the tasks of developers who are delaying; Developer 3 had not pushed since about 02:00 UTC). The branch's rounds and rulings carry on as they stand.

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

_Verifier session, 8 Oct 2026 (round 3: two earlier verifier attempts died on usage limits and left no report). Mobile `wmt/EVENTS-03` and backend `wmt/EVENTS-03`, each with `wmt/EVENTS-01` already in and `origin/main` merged in again (mobile main `8cabe72`, backend main `8359057`); generated files regenerated (`contract:build` leaves no diff; `sync_contract.py`). Live stack: backend branch on :4225 against a fresh database, the backend repo's `mock-wawu-id` (:4226, NOT the real WAWU ID) behind a 20-line proxy (:4227) that wraps its login answer in `data` with a refresh token as WAWU ID does, the app on `expo start --web` (:4228) at 390 px, 2x, signed in through the real sign-in screen. Free tickets only (R-8). Evidence in `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events03v3/` (shots, side-by-sides `sbs-*.png`, decoder scripts)._

| Pass | Result | Evidence |
|------|--------|----------|
| Diff against the report | passed | Files match the builder's list (new routes in `src/event-ticketing/event-held-tickets.*`, one module edit, specs, contract +334 lines, 0 removed; no migration, no `prisma/` change). |
| V1 `npm run check` | passed after regenerating `docs/PROGRESS.md` | typecheck 0, lint 0 errors (2 `no-require-imports` warnings in `eventsFocus.test.tsx`, an EVENTS-01 file), 83 suites / 1502 tests pass, gates 9 run / 374 files scanned / 0 findings, baseline 0 entries. The only failure was the generated `docs/PROGRESS.md` being stale after the merge. |
| Backend checks | passed | `tsc` 0; `event-held-tickets.contract.spec.ts` plus `event.contract.spec.ts` on the branch: 65 of 65 pass. `event.contract.spec.ts` on main: 52 of 52 pass. The builder's failures were the mock on the wrong port (:4221), not code. Protected route suite `run.sh --fresh HEAD`: 244 of 244 pass (run before the last main merge, which adds one unrelated migration). `GET /events/tickets/mine` answers byte for byte the same on the branch and on main for the same data (buyer with 5 orders, and two other users). Contract diff against main: 334 added, 0 removed; `contract:build` leaves no diff. |
| QR decoder (the biggest risk) | passed | Encoder `qr.ts` driven for 344 texts (300 random codes of the server's real shape `XXXX-XXXX-XXXX-XXXX` over the server's alphabet, plus lengths 1 to 106 at every version boundary 1..6, printable ASCII, UTF-8), drawn with the 4 module quiet zone at 3 scales: opencv `QRCodeDetector` 1022 of 1032 (the 10 misses are opencv's own: the `qrcode` npm package's output for the same texts misses 15 of 1032 the same way) and jsQR 688 of 688. All 8 masks forced (copy of `qr.ts` in scratch, 16 texts per mask, plus lengths 10/30/60/100): opencv 384 of 384, jsQR 256 of 256; all 8 masks also occur naturally (324 texts). The drawn screens (with the logo overlay), light and dark, for 5 real tickets: opencv and jsQR both read exactly the server's code (10 of 10). The mask choice differs from the `qrcode` package's (penalty scoring differs), which is allowed by the standard; every mask decodes. |
| V9 live seam | passed | Free ticket ordered through `POST /events/{id}/orders` by a signed-in buyer; E6 lists it; E7 opens it; the code decoded from the E7 screenshot (`W1J3-6M58-ATVD-TVTQ`) was sent to `POST /events/{id}/door/check-in` as the host: `valid`, then `already_used`; E12 then showed "Already checked in / Thu 8 Oct at 12:26." for a 11:26:58Z scan (Lagos, the event's own zone). 2 x group, other zone (America/New_York, "Sun 14 Feb 2027 · 6:00 PM EST", year shown because not current), past, called off all read from the live Hub. |
| New routes, odd input | passed | Other user's ticket 404, unknown uuid 404, non-uuid / NUL / lone surrogate / 5000 chars id 400, no token and bad token 401. Query: `view=bogus`, empty, NUL, lone surrogate, repeated, array form; `page` 0, -1, 1e8, 99999999999, abc, lone surrogate; `perPage` 0, 101, abc, 1.5, NUL; unknown key (`limit`, `cursor`, `x`): all 400. `page=999` 200 and empty; `POST` 404. No 500 anywhere (hub log has none). |
| Mutants (backend) | passed | 6 of my own on `event-held-tickets.service.ts` (owner check dropped in `one`, owner check dropped in `list`, unpaid orders counted, past rule flipped, paging offset, called-off not past): the 11-test spec failed 3 to 6 tests for each; file restored. |
| Mutants (mobile) | passed | 4 (void still draws a code, year rule off, first-scannable rule off, QR text lower-cased): the ticket specs failed for each; files restored. |
| V4 field trace | failed (D3) | Every value traced to a server field: event name, `startsAt`/`endsAt`/`timezone`/`timeLabel`/`venueName` through `format.ts` (date in the event's own zone, year only when not the current year), `tierName` and `quantity`, `code`, `checkedInAt`, holder name from WAWU ID, "Ticket 2 of 2" from `siblings`. No literal fact on screen. The date badge draws "5" for 5 Oct where the canvas draws two digits ("02", "09"). |
| V5 picture | failed (D2) | Light and dark, 390 px, 2x, against `render_design.py E6 E7 E12`: layout, order, copy, colours, icons match in both themes; table below. |
| V6 states | failed (D1) | Table below. |
| V7 | not in `passes` | |
| V10 | NOT RUN | A phone and a development build are needed; the lead runs it. |

### V5 differences

| Artboard / element | Design | Built | Class |
|---|---|---|---|
| E6 row height and pitch | row 72, pitch 84 (1x) | row 74, pitch 86 (the 1 px border is added outside the 12 px padding; the canvas's border sits inside) | defect (D2) |
| E7, E12 card | 397 tall | 399 tall (same cause: border outside the banner and padding) | defect (D2) |
| Nav title "My tickets", "Ticket" | ink top 43 (2x) | 41 (2x), 1 px higher at 1x (the local `TicketNav`) | defect (D2), minor |
| Filter chips text | ink 154 to 178 (2x) | 153 to 176 (shared `FilterChips`, not this task's file) | unclear, shared component |
| E12 note title and body | 163 to 189, 207 to 223 | identical | matches |
| E7/E12 code, tier line, banner text | line heights from `canvasNormalLineHeight` | ink positions match once the 2 px border shift is removed; no line-height drift found | matches |
| QR picture | stylised stand-in with the WAWU logo | a real, scannable QR with the "Who Made This" mark at 12 percent | differs-for-recorded-reason: a drawn stand-in cannot be scanned (E7 "a user can show QR at door"); R-37 for the mark |
| E7 "Brightness goes up when this opens." | drawn | not drawn | differs-for-recorded-reason: `expo-brightness` is not installed (row 8 not applied); SHARED-CHANGES EVENTS-03 #1; a note the phone cannot keep would be a false promise (task file: build everything else) |
| Banner picture | night sky photo | the card's dark ground (the event has no `bannerUrl` in my data; with a URL the `Image` is drawn) | unclear, only the empty case was exercised |
| Card corner | 28 | 26 (`radius.money`) | differs-for-recorded-reason: SHARED-CHANGES EVENTS-03 #3 (no 28 token) |
| Event data (names, sample ticket, "Lennox Emmanuel") | literals | server facts | expected |

### V6 states

| State | Result |
|---|---|
| Loading | skeleton rows (shared `Skeleton`), seen while a retry was in flight; 72 high against 74 for the real row |
| Empty, Upcoming and Past | passed (real empty account, `my-tickets-empty`, one text per tab) |
| Error (500, server words "Boom from server") | passed; shows the shared `ErrorState` with Try again (its icon is the shared Wi-Fi-off icon for a 500, a shared-component matter) |
| Offline (Hub unreachable) | passed, "You're offline" with Try again (seen with the Hub down); cutting the network mid-session only reached the skeleton within my 5 s window (query retries), not captured |
| Not available | passed: `/events/tickets/abc` shows it with 0 Hub requests; an unknown uuid and another user's ticket show it after one 404 |
| Void (called-off event, voided by the cancel) | passed: "This ticket is not valid / The event was called off, so this ticket cannot be used.", no QR, no code |
| Past tab | passed: ended and called-off events, nearest first |
| Paging | passed: 23 groups, page 1 once, page 2 once, "Show more" gone, 23 unique rows, never page 1 twice |
| Checked in while open | passed as built: no polling (0 requests in 15 s idle after the door scan), the note appears on refocus/reopen, the row then opens the next scannable ticket |
| A failed refetch keeps the shown data | FAILED (D1): list open with 20 rows, open a ticket, make the Hub answer 500, press back: the list is replaced by "Couldn't load your tickets" (0 rows); the same code path (`list.isError` / `ticket.isError` checked before the data) replaces a shown ticket |

### Findings

- **D1, defect (V6):** `MyTicketsScreen.tsx` and `TicketScreen.tsx` test `isError` before `data`. In TanStack Query a failed refetch (the focus refetch, or "Show more" failing) sets `isError` while keeping `data`, so a person looking at their tickets (or at the QR at the door) loses the screen on a bad refetch. Show the data and, at most, a quiet note; the error screen only when there is no data. A failed "Show more" also takes the whole list away.
- **D2, defect (V5, minor):** the 1 px border is added outside the padding: E6 rows are 74 high with pitch 86 (design 72 and 84); the E7/E12 card is 399 (design 397); `TicketNav` title sits 1 px high. Everything inside is otherwise equal.
- **D3, defect (V4):** the date badge shows "5" for 5 Oct; the canvas draws two digits ("02", "09" in `design/_gen/events.js`). `badgeOf` in `format.ts` (an EVENTS-01 file) does `String(w.day)`; the fix is `padStart(2, '0')` there, and it also touches E1/E2/E3 (route it through that task).
- **differs-for-recorded-reason:** QR picture; brightness note and SHARED-CHANGES #1; radius row #3. SHARED-CHANGES #2 (contract sync) is correct: after my regeneration against backend `wmt/EVENTS-03` merged with main the generated files had no further diff beyond `SOURCE_COMMIT`. The E5 entry belongs to EVENTS-06 (recorded blocker, accepted).
- **unclear:** none needing the owner. Banner picture with a real `bannerUrl` was not exercised (no host banner in my data).
- No em-dash, no "Flutterwave", no literal colour in the new files; shared `FilterChips`, `Button`, `EmptyState`, `ErrorState`, `Skeleton`, `Icon` used; tokens only. The local `TicketNav` follows the other Events screens (no shared page header exists).
- Not done: V10; the real WAWU ID (mock used); a paid ticket (R-8, no Fintava keys).

Status: back to `building` for D1 to D3.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
