---
id: EVENTS-01
title: Events: list, filters, detail, sold out
owner: DEV3
area: EVENTS
order: 32
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: building
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

**Verifier (fresh session, 7 Oct 2026; did not build any of it).** Branch as it lands: `wmt/EVENTS-01` with `origin/main` merged (already up to date, c0fb4e3 in it). Stack: own, on ports 4185 (hub, backend `origin/main` 6c0e435), 4186 (the REAL wawu-id 4715d17, started by the backend's `scripts/local/up.sh`; the mock was not needed) and 4187 (`npm run web`, `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` pointed at them), databases `wawu_hub_test_events_01_v` and `wawu_hub_test_id_events_01_v`, seeded by `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01v/seed.sql`. Chromium 390 px at 2x, light and dark. Screenshots and scripts: `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01v/shots/` (`E1-*`, `E2-*`, `E8-*`, `E9-*`, `S-*` for states, `sbs-*` are design on the left and the app on the right, `m-*` are montages). Design renders: `build/design_shots/` (not committed).

| Pass | Result | Evidence |
|------|--------|----------|
| Diff vs report | passed | `git diff --stat origin/main...origin/wmt/EVENTS-01` is exactly the 16 files the builder lists (8 source, 2 tests, 2 routes, BACKEND_GAPS, LOG, PROGRESS, task file); no fenced file touched (`src/components`, `src/theme`, `src/api`, `package.json`, `_layout.tsx`, `SHARED-CHANGES.md` untouched); no local copy of a shared component (Button, BottomSheet, FilterChips, StatusPill, Skeleton, StateViews, Money, Text, Icon, MediaCard's `gradientEnds` are all imported from `@/components`); no em-dash, "Flutterwave", raw colour, TODO or "for now" in non-test source. |
| V1 Gates | passed | `npm run check` exit 0 (`/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01v/check2.log`): typecheck, lint, 48 suites, 841 tests, gates 9 run, 228 files scanned, 0 fail 0 warn 0 accepted, baseline 0 entries, tasks 209. `npm run api -- --backend ../../WAWU-Backend` regenerated nothing (no diff). The FIRST run (`/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01v/check.log`) had one failure, `OpenWalletScreen.test.tsx` "a user sees a loading view first" timing out at 20 s while 48 suites ran at once; that is another feature's test, it passes alone (9 suites, 177 tests) and the whole run passed on the repeat. Reported, not held against this task. |
| V4 Field trace | passed | Going: writer is the tap (`POST/DELETE` going), storage `EventGoing`, readers E1 row (`userGoing`) and E2; seen both ways: row tap wrote 1 row and the second tap removed it (psql), E2 tap wrote a row, back on E1 the row said "Going to ...", tapped off again (0 rows); a seeded row for user@ showed "Going" for that user and "Going?" for creator-basic@ on the same event (API). Tier prices, remaining, dates, venue, host org, kind and category come from `GET /events`, `/events/:id`, tickets and `/events/options`; edited in the database and read back on screen. Total in kobo: Regular x50 plus VIP x2 = ₦399,000 (correct). |
| V5 Picture | failed (defects D1 to D5) | Four artboards, light and dark: `sbs-E1-dark.png`, `sbs-E2-light.png`, `sbs-E2-dark.png`, `sbs-E9-light.png`, `sbs-E8-light.png`, plus `E1-light.png`, `E8-dark.png`, `E9-dark.png` against the renders. Comparison table below. |
| V6 States | passed | Every state entered by its real cause, both themes (`S-*`): loading (the Hub request held open, skeleton), empty (a real empty database: "No events yet", `empty-*`), empty by filter (Past plus Concert plus Music: "No events match" with Clear filters, `E1-*-nomatch`), error with Try again (Hub 500 on the list; 500 on tickets under a loaded event; 500 on `/events/options` inside the sheet), event gone (a real 404), Going refused (500: flag stays, "Internal server error" line), sold out (E9, real sold-out tiers), a tier that ended and sold out (Early bird), event with no ticket types, called off (a real `cancelled` event, read as its host), Past view, See all. Observation U3 on the cut network. Not entered: "Show more" (needs more than 20 published events), a tier "Soon" pill (jest only), a free tier (jest only). |
| V9 Live seam | passed | Real sign-in through the app's own sign-in screen against the real wawu-id on 4186 (no injected token); values only the server has: "Show 6 events" (Hub `total`), the seeded events, prices, and Going rows read back from Postgres. |
| V10 Device | NOT RUN | Needs a signed Android tester build talking to a deployed backend: unblocked by OPS-10 (live backend on the droplet) plus an Android tester build (docs/BUILDS.md). Not a task-file requirement for the passes list (V10 is not in `passes`); recorded for the lead. |
| V2, V3, V7, V8 | not in this task's `passes` | The task is `mobile-screen` (V1 V4 V5 V6 V9). No backend change was made (the diff has none). Paid ticket buy is EVENTS-06 and EVENTS-07. |

**Capability checks, driven in Chromium on my stack** (scripts `main.py`, `detail.py`, `sync.py`):

| Check | Result | Evidence |
|-------|--------|----------|
| E1: open the filter sheet (E8); tap an event (E2); toggle Going on a row | passed | Filter button opened "Browse the calendar" (`E8-*`); the featured card landed on `/events/<id>`; a row's Going tap wrote then removed an `EventGoing` row (psql), in light and dark. |
| E2: toggle Going; set a quantity per tier and see the running total | passed | Going on E2 wrote a row, a second tap removed it; Regular 1 gave "1 ticket ₦7,500", VIP +2 gave "3 tickets ₦31,500", Regular to 0 gave "2 tickets ₦24,000", minus at 0 stayed 0, plus stopped at 50 a tier (G-273, recorded), Regular 50 and VIP 2 gave ₦399,000. |
| E8: pick when; pick kind; pick category; apply | passed | Past; Concert gave "Show 1 event" and the list held 1 row; Category list opened (Business & Finance, Music ...), Music picked; Apply filtered the list; Past plus Concert plus Music gave "Show 0 events" and the no-match state; Clear filters offered. |
| Each artboard matches its render, light and dark | failed | See D1 to D5 and the table. |
| Every value from the API or the user | passed except D4 | No literal price, date or count on screen; the hero "from" price is the Hub's field but wrong in meaning (D4). Anything the API does not serve is in `BACKEND_GAPS.md` G-270 to G-273. |
| Loading, empty, error states and the drawn E8, E9 | passed | V6 row. |
| The My events and Host event tabs, the Host banner and Get tickets | belong to EVENTS-08, EVENTS-04, EVENTS-06 | Not checked here, as the task's "Added by later tasks" says. |

**Picture comparison, per artboard and state** (my screenshots have no phone frame and no status bar, so the top 22 pt and the home-bar are N/A; the app's banner pictures are absent or a gradient in my seed, so photo content is N/A):

| Artboard / state | Element | Result |
|---|---|---|
| E1 light and dark | Header (back, "Events", filter), tab underline, hero 190 pt, 24 corner, date badge, FEATURED / name / line, row thumb, badge, Going and Going? pills, divider, "See all" | match (sizes, order, colours in both themes) |
| E1 | Tabs My events, Host event; Host your event banner | differs-for-recorded-reason (task "Added by later tasks": EVENTS-08, EVENTS-04; WORKFLOW section 7) |
| E1 | FEATURED kicker colour | differs-for-recorded-reason: the canvas draws a literal `#D9A6F2`; the app uses the dark `accentFg` token (`#C368EA`), as the code rule bans literals. The hero is a dark scrim in both themes, so the dark token is right in light mode too (`E1-light.png`: lilac on the dark fade). Same `darkColors` use exists in `WelcomeScreen`, `SelfieScreen`, `feed/look.ts`. Not a defect. |
| E1 | "This week" heading | D1: canvas `SH` is h2 (18.5, weight 700); app uses variant h3 (weight 600) with the size overridden, so it reads lighter. `EventsScreen.tsx` line 143. |
| E1 | Gap between rows | D2: canvas list is `col(..., 4)`, 4 pt between rows (pitch 100 pt); app has none (pitch 98 pt). |
| E1 | Price under "Monetise ..." | U1: canvas "Free"; the app draws nothing for an event with no ticket types. |
| E1 | "from" price | D4 (hero "from ₦5,000", cheapest buyable ₦7,500). |
| E1 | List content | differs-for-recorded-reason: the app's "This week" is events starting within 7 days (builder default 3), so the canvas's 18 Oct and Nov rows would sit under See all; featured not repeated. |
| E2 light and dark | Back and share buttons, hero, date badge and title, info card (clock, pin, host with tick, Going toggle), tier rows (name, amount, minus, count, plus), Sold out pill, running total "1 ticket ₦7,500" | match |
| E2 | Weekday "Mon 12 Oct" against the canvas "Sun 12 Oct" | differs-for-recorded-reason: the canvas date is a sample; 12 Oct 2026 is a Monday and the app computes it from `startsAt` in Lagos time (builder default 4). |
| E2 | Line under a tier ("97 left", "Ended 30 Sep") against "General admission" | differs-for-recorded-reason: G-270 (nothing writes a tier description). |
| E2 | Space from the TICKETS label to the first tier | D3: about 6 pt more than the canvas (label at 864 px in the canvas, first tier at 922 px, 58 px apart; app 870 and 940, 70 px apart). |
| E2 | Minus at 0 | app dims it; canvas draws it live. Minor, sensible, not counted. |
| E2 | Get tickets | differs-for-recorded-reason: EVENTS-06 adds it (task "Added by later tasks"). |
| E8 light and dark | Sheet title, WHEN and KIND labels, Upcoming and All selected (ink), chips, Every category field with chevron, purple "Show N events" button | match |
| E8 | Kind chips: seven (All, Conference, Workshop, Concert, Meetup, Summit, Webinar, Competition) against four | differs-for-recorded-reason: builder default 2, the Hub's own `GET /events/options` list; a hidden kind could not be filtered to. Owner may override. |
| E8 | "Show 6 events" against "Show 24 events" | differs, correct: the Hub's `total`. |
| E9 light and dark | Back, share, title, info card, Going?, TICKETS, both tiers dimmed with Sold out pills, "Every ticket for this event has sold." | match (tier description line is absent, G-270) |
| E9 | Bottom disabled "Sold out" button | D5: drawn on the artboard, not built, and no later task lists it (the task's "Added by later tasks" names only E2's Get tickets, and `tasks/EVENTS-06.md` has no mention of the sold-out state). |

**Findings**

Defects (back to `building`):
- **D1 (defect, minor).** E1 section heading ("This week", "Upcoming", "Past events") is weight 600 where the canvas heading (`SH`, kit.js) is the h2 style at weight 700. Fix: use the h2 variant (18.5, 700) in `EventsScreen.tsx`.
- **D2 (defect, minor).** E1 rows have no 4 pt gap between them; the canvas list is `col(..., 4)`. Rows are about 2 to 3 pt closer than drawn.
- **D3 (defect, minor).** E2: the TICKETS label sits about 6 pt farther above the first tier than the canvas draws.
- **D4 (defect).** The "from" price on the hero and the rows is the Hub's `priceFromNaira`, which counts a tier that has sold out or ended. Seen live: hero "from ₦5,000" while only ₦7,500 and ₦12,000 can be bought (Early bird, ended 30 Sep and sold out, is the ₦5,000). A user is shown a price they cannot pay. The task says a missing or partial row is the builder's to fix in the backend ("Never change the screen to fit the API"); G-271 files it as a gap with no owner instead, and the additive field it names (cheapest tier on sale now, null when none) was not added. Fix: add that field in `src/event/` (additive; the web keeps `priceFromNaira`) and read it on E1, or get the owner to rule that the gap stands.
- **D5 (defect, minor).** E9's disabled "Sold out" bottom button is not built and no task carries it. Fix: build the disabled button here (it is not a link to a later screen), or add it to EVENTS-06's list.

Unclear (owner):
- **U1.** An event with no ticket types draws no price line; the canvas draws "Free" for "Monetise Your Content Online" and the task lists that figure as not a fact. The Hub's own comment calls such an event "free, interest-only", but registration can live on `externalUrl`, so "Free" may be untrue. Owner to rule what a ticketless event says.
- **U2.** The Hub serves a `cancelled` event to its host only (a stranger, and a ticket holder, get 404 "Event not found"), so the app's "This event was called off." state is reached only by the host, and there the Going? button still works on a called-off event. Whether a ticket holder should read a called-off event is EVENTS-08's or the Hub's to decide.
- **U3.** With the network cut after load, opening an event shows the loading skeleton and no error: the shared query defaults (`src/api/query.ts`, fenced, not this task) pause requests while offline. Every screen does the same; recorded so CHECK-1 can see it.

Differs-for-recorded-reason: the tab row, Host banner and Get tickets (WORKFLOW section 7, the task's "Added by later tasks"); seven Kind chips (builder default 2); the "This week" seven-day window (default 3); Lagos time and computed weekday (default 4); G-270 tier line; kicker token colour. `docs/designer/BRIEF.md` has no entry for E1, E2, E8, E9, so rules 3 to 8 apply: no fee, refund or licence line appears on them, and no em-dash is on screen (checked in source and screenshots).

**Not defects, checked as asked.** (1) `darkColors.accentFg` in `parts.tsx`: correct in light mode (screenshot), and the bypass of the theme hook has three merged precedents (`WelcomeScreen`, `SelfieScreen`, `feed/look.ts`), so it is not a defect. (2) The `*Metrics` objects holding canvas pixel values: the V1 literal-spacing gate passes on 228 files with 0 findings, and the same pattern is merged in `auth/Banner.tsx`, `wallet/BankField.tsx`, `open-wallet/*` (`bannerMetrics`, `bankFieldMetrics`), each citing the canvas line; not a defect. (3) The unrelated `OpenWalletScreen` timeout above.

**Status:** open defects D1 to D5, so `status: building` (back to the builder). Everything else passed.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
