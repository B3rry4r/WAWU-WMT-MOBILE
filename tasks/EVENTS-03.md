---
id: EVENTS-03
title: My tickets, ticket QR, checked in
owner: YOU
area: EVENTS
order: 48
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
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

## Builder report, round 2

_Builder session, 8 Oct 2026, fix round 1 for D1 to D3. Merged `origin/wmt/EVENTS-03`, `origin/wmt/EVENTS-01` (head e423b76 or later) and `origin/main` (merges, no rebase); `contract/` stays as made from backend `wmt/EVENTS-03` (97539f5), not regenerated against main (`SOURCE_COMMIT` unchanged, no diff in `contract/` or `src/api/`)._

- **D1 fixed.** `MyTicketsScreen.tsx` shows the error screen only when the list has no data yet; `TicketScreen.tsx` the same. Once data exists a failed refetch (focus, or "Show more") keeps the rows or the ticket and its QR and draws a quiet inline `RefreshFailed` line (new in `ticketParts.tsx`, with Try again; "You're offline" wording for a network failure). New spec `ticketsRefetchFails.test.tsx` on the real screens: list loaded then refetch 500 => rows stay, note shows, Try again clears it; ticket loaded then refetch 500 => ticket and QR stay; first load 500 => error screen on both. Against the old code (scratch copy, restored by copying back, no git reset) the first two specs fail and the third passes.
- **D2 fixed.** The hairline border of the E6 row and the E7/E12 card is now an absolutely placed overlay (`edge`, the pattern `ExploreEvents.tsx` uses), so it no longer adds to the box. The `TicketNav` title gets a 2 px (2x) top nudge (`navMetrics.titleNudge`).
- **D2 measured** at 390 px, 2x, light and dark, `npm run web` against a 60-line local stand-in for the Hub and WAWU ID (scratch `events03f/mock.js`, not the real services) beside `render_design.py E6 E7 E12`: E6 rows 72 high, pitch 84 (design 72, 84); E7 and E12 card 397 (design 397); nav title ink 43 to 74 on E6 and 43 to 67 on E7/E12 (design 43 to 74 and 43 to 67); E6 row title and line ink 267 to 287 and 310 to 332 (design the same, 2x); E7 code and holder line positions match in the side-by-side. Shared `FilterChips` text (153 to 176 against 154 to 178) was not touched. I do not claim the screens match the canvas; the verifier compares.
- **D3.** Not edited here. `badgeOf` in `format.ts` comes from EVENTS-01 (`padStart(2, '0')`) via the merge; E6 draws `DateBadge` through it, so a single-digit day reads "05". The stand-in data used day 12, so a one-digit day was not drawn live: NOT RUN as a picture.
- **NOT RUN:** V10 (phone); a picture of a one-digit day on E6; real Hub and WAWU ID (stand-in used).

## Verifier report, round 4

_Verifier session, 8 Oct 2026, narrow round on D1 to D3 (a round 4 attempt before this one died on a usage limit and wrote nothing). Mobile `wmt/EVENTS-03` at f1a8750, backend `wmt/EVENTS-03` at 97539f5. Live stack: backend branch merged locally with backend `origin/main` (9d90d57; only `contract/openapi.json` conflicted, regenerated with `npm run contract:build`; the merge was not pushed) on :4225 against a fresh database `wawu_hub_test_events_03_v4` (dropped when done); the backend repo's `mock-wawu-id` on :4226 (NOT the real WAWU ID) with a 20-line proxy on :4229 that wraps its login answer in `data` as WAWU ID does; the app on `expo start --web` :4227 at 390 px, 2x, signed in through the real sign-in screen. Free tickets only (R-8). Evidence in `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events03v4/`._

| Check | Result | Evidence |
|---|---|---|
| D1 list, live | passed | List loaded (2 rows), a row opened its ticket, the Hub then answered 500 to every `/events/tickets/held` read (Playwright route) and Back refocused the list: 3 failed reads, 2 rows kept, `my-tickets-refresh-failed` reads "Couldn't refresh. These tickets may be out of date." with Try again, no error screen (`d1-list-failed.png`). Hub healthy again, Try again: note gone, 2 rows. |
| D1 ticket, live | passed | Ticket of a 2-ticket order loaded, Next to the other ticket, 31 s (past the 30 s stale time), Hub failing, Previous: the cached ticket refetched 3 times, all 500; ticket, code `X400-4J3Y-2WHJ-FSYV` and QR kept, note "Couldn't refresh. This ticket may be out of date." with Try again, no error screen (`d1-ticket-failed.png`); Try again with the Hub healthy made one good read and cleared the note. The QR in that screenshot decodes to `X400-4J3Y-2WHJ-FSYV` with jsQR 1.4.0 installed fresh in the scratch `dec/` (outside the repo); E7 light and dark decode to the server's `F06Z-C47D-HQC1-W14W`. A focus refetch on the ticket screen itself could not be driven on web (Next and Previous replace the screen; browser visibility events did not refetch); the path exercised is the same `isError && data` branch. |
| D1 first load, live | passed | Hub failing from the start: the list shows `my-tickets-error` (0 rows), the ticket shows `ticket-error` (no QR) (`d1-first-*.png`). |
| D1 spec against the old code | passed | `ticketsRefetchFails.test.tsx` 3 of 3 pass on the branch (one earlier run timed out its first test at load 13; the rerun passed). With `list.isError && !list.data` and `ticket.isError && !ticket.data` put back to round 1's bare `isError`: the list and ticket specs fail, the first-load spec passes; files restored with `git restore`. |
| D2 E6 | passed | Rows 72 high, tops 112 and 196 (pitch 84), light and dark. Against `render_design.py E6` (aligned on the back button's top): title ink 29 to 60 (2x) in both; row edges at x 50 identical to the pixel (223, 226/227, 337 to 341, 391 to 395, 505/506) in both themes. |
| D2 E7, E12 | passed | Card 397 (DOM) in both themes; at x 200 the card spans 114 to 907 (2x) in design and build, E7 and E12, light and dark; E12 note 117 to 246 equal; inner edges within 1 px at 2x. At x 60 the card's top and bottom differ by 2 px at 2x: that is the corner (26 against 28), already differs-for-recorded-reason (SHARED-CHANGES #3). |
| D2 TicketNav title | passed | Ink 29 to 60 on E6 and 29 to 53 on E7/E12 relative to the back button, equal to the design in light and dark. |
| D2 FilterChips | differs-for-recorded-reason | "Past" text ink 139 to 157 against the design's 141 to 159 (2x): 1 px high at 1x, light and dark. The cause is the shared `FilterChips` (untouched by this task; E6 only passes `inset={0}`); it belongs to the shared component's owner, not EVENTS-03. |
| D3 | passed | Seeded "Yaba Design Day" on 5 Nov 2026 (Lagos): the E6 badge reads "NOV 05" live, light and dark (and "OCT 13" for a two-digit day). |
| Backend regression | passed | `origin/wmt/EVENTS-03` is still 97539f5: no backend change since round 3. |
| Main merge | NOT DONE | Mobile `origin/main` moved to ccfc4bd (PROS-03 and others). `git merge origin/main` conflicts in EVENTS-01 code (`src/app/(tabs)/explore.tsx`, `src/features/explore/ExploreScreen.tsx`, `src/features/explore/__tests__/screens.test.tsx`; PROS-03 edited the same Explore lines) besides the generated files. Resolving it means writing code in EVENTS-01's files, which a verifier does not do; merge aborted (`git merge --abort`), nothing pushed from it. It belongs to EVENTS-01's merge into main (this branch carries EVENTS-01), then a main merge here. |
| V1 `npm run check` | exit 1, sole reason main's FIX-22 | On f1a8750: typecheck 0, lint 0 errors (6 warnings), 86 suites / 1526 tests pass, gates 9 run / 379 files / 0 findings, baseline passes; the task check fails only on `FIX-22.md: type backend-endpoint requires passes V4, V9`. Clean `origin/main` (ccfc4bd, worktree in scratch) passes the task check (262 tasks): main fixed FIX-22 in e384d72 after this branch's last merge. |
| V10 | NOT RUN | A phone and a development build are needed; the lead runs it. |

- No defect open. D1, D2 and D3 are closed; the FilterChips 1 px is the shared component's.
- Not done: V10; the real WAWU ID (mock used); a paid ticket (R-8); the main merge (conflicts in EVENTS-01 files, above).

Status: `review`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
