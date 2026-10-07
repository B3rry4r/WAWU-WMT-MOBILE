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

### Verifier report, second independent session (7 Oct 2026)

**Verifier (fresh session; wrote none of it).** The brief named `2b58fc1`. While I worked, the branch moved to `827dc56` (the first verifier's report `0553663` and the builder's round 2). I verified both: every pass at `2b58fc1` as named, then the changes in `827dc56` (D1 to D5), so this report is true of the head. Stack: own, Hub on :5441 (backend `origin/main` 6c0e435; for the head, backend branch `wmt/EVENTS-01` bb10ef0, which adds `GET /events/from-prices`, then back to what main serves for one check), the REAL wawu-id 4715d17 on :5442 (started by the backend's `scripts/local/up.sh`, `@nestjs/swagger` taken from a sibling worktree's `node_modules`), web export on :8441 with `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` set to my ports (the built bundle contains `localhost:5441` and `localhost:5442` and no `api.wawuafrica.com`), private `TMPDIR` and `--clear`, databases `ve01_hub_test` and `ve01_id_test`. Seed: 32 events made through the real `POST /events` (as the verified creator-pro) and approved through the real admin route `POST /admin/events/:id/approve` (an admin made with `scripts/seed-admin.ts`); the verified tick on the two seeded creators and the tiers' `sold` / `salesEndAt` columns were set in SQL. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ve01/` (`pairs/` and `shots/` for `2b58fc1`, `pairs2/` and `shots2/` for `827dc56`: each `pairs*/E?-light|dark.png` has the design render on the left and my screenshot on the right; `design/` the renders; `shots/S-*`, `F-*`, `D-*`, `G-*` states, filters, data-trace and Going; `check-*.log`, `mutants*.log`, `*.py` and `seed-events.js` the scripts).

| Pass | Result | Evidence |
|------|--------|----------|
| Diff vs report | passed at `2b58fc1` (16 files, as listed, none fenced). At `827dc56` the diff adds `contract/*` and `src/api/schema.generated.ts` (fenced), each recorded as SHARED-CHANGES EVENTS-01 #1 and #2, the types made from the backend BRANCH because PR 78 is not on main | `git diff --stat origin/main...827dc56` |
| V1 Gates | passed | `827dc56`: `npm run check` exit 0, 48 suites, 843 tests, gates 9 run, 228 files, 0 fail 0 warn 0 accepted, baseline 0 (`check-head.log`). Trial merge with mobile `origin/main` 2c79e67: only `docs/PROGRESS.md` conflicts (generated; regenerated with `check_tasks.py --write`), then exit 0, 52 suites, 893 tests, 239 files (`check-trial2.log`). `2b58fc1`: exit 0, 48 suites, 841 tests, 228 files (`check-branch3.log`), trial merge with 2b58fc1 and main b16d6d7 exit 0, 52 suites, 891 tests (`check-trial.log`). Two EARLIER runs of `2b58fc1` exited 1 with the host at load 40 to 50: 20 s test timeouts in `OpenWalletScreen` A26, `CreatePinScreen` A10 and, in the first run, two of this task's own tests (E1 featured rows, free tier); all pass alone (`jest-events.log` 44 of 44 with `-i`) and the next runs passed. Static: no em-dash, hex, dollar, "Flutterwave" or `fetch(` in non-test source; the two literals that stand for facts are `MAX_TICKETS_PER_ORDER = 50` (G-273) and the seven-day "This week" window (builder default 3) |
| V4 Field trace | passed | Non-canvas data seeded and read back on screen: Regular ₦7,777 (hero, tier, running total), a start of 2031-03-16T22:30Z as "Sun 16 Mar · 23:30 WAT", a 143-character title (wraps in full at 390 and 320, nothing cut), a hybrid event, a free event ("Free entry", "Free", total "Free"), an event with no tiers (no price, no tickets block), an event at 2026-10-09T23:20Z that is "Sat 10 Oct · 00:20 WAT" with badge OCT 10 (the UTC date rolls), a tier ended 6 Oct that is not sold out ("Ended" pill, "Ended 6 Oct"), a sold-out tier, host org and tick from the Hub. Going written by the tap and read back from Postgres (1 row, then 0) and the same flag on the row and on E2. `shots/D-*`, `G-detail-going.png` |
| V5 Picture | `2b58fc1`: failed (see below, the same five the first verifier found: D1 to D5; I confirm D4 and D5 independently). `827dc56`: passed, with the differences listed under "Picture" | `pairs/` and `pairs2/` |
| V6 States | passed (one defect, P1, in the new prices call) | the paragraphs below |
| Filters | passed | the paragraphs below |
| V9 Live seam | passed | Signed in through the app's own sign-in screen (`sign-in-email`, `sign-in-password`; no token injected) against the real wawu-id; values only the server holds: the 32 events I created and the admin approved (events "Verifier Mixer Night", "Sold Out Gala" ...), ₦7,777, "Show 29 events", the from-prices answer, Going rows read back from Postgres, block lists |
| Mutants | 28 distinct mutants (33 runs, see below): 19 killed, 9 survived. Four survivors change nothing a person sees (M13, M18, M27) or only a host can reach (M28); the other five name the test gaps T1 and T2 | `mutants.log`, `mutants2.log`, `mutants3.log` |
| V10 | NOT RUN: needs OPS-10 (live backend) and a signed Android tester build. Not in this task's `passes` |  |

**States entered by their real cause** (web export, 390 px unless noted; `shots/S-*`):
loading list (request held 9 s: skeleton, `events-loading`); error list (Hub 500: "Couldn't load events", "Internal server error", Try again, and Try again loaded the rows); the cut connection (requests aborted at the network: "No connection. Check your internet and try again.", and after the network returned Try again drew the concert filter's rows; note on the web build a browser "offline" flag makes React Query PAUSE and the skeleton never ends, but that is `src/api/query.ts` (fenced, `onlineManager` not wired), the first verifier's U3, not this task); empty by filter (competition plus church: "No events match", Clear filters restores "This week"); empty list by real cause (the viewer blocked both hosts: "No events yet"; light and dark); error on detail (500 on the event; 500 on tickets under a loaded event: "Couldn't load the tickets"); event gone (a pending event, a cancelled event and a missing id all give "This event isn't available" to a stranger; the same cancelled event read as its host gives "This event was called off."); an event that becomes sold out (Regular sold out in SQL while E2 was open: the open screen stays on "10 left" for 32 s and after a focus event, because nothing refetches in session; reopening shows Regular and VIP "Sold out", Early bird "Ended", "Tickets are not on sale right now." and no total, correct for that data; and with every tier sold, E9: "Every ticket for this event has sold."); a host who blocked the viewer and a host the viewer blocked: the host's event is gone from the list, the count ("Show 28 events") and the detail (404 page), both directions; paging (below); Going refused/failed not reachable from the real Hub without a stand-in (the builder's tests cover it).
**Paging** (head, 29 upcoming): See all lists 19 rows (page 1 is 20 less the featured one), "Show more" asks `page=2&perPage=20`, 28 rows, 28 unique names, the order is the Hub's (the 2031 event last), the button goes. The Hub's `total` drives "Show 29 events".
**Filters** (each against the query the Hub expects; `filters.py`, `shots/F-*`): Concert sends `type=concert` (list and featured and the sheet's count), category sends `category=entertainment`, both together, Past sends `view=past` (1 event, no hero, "Past events"), competition plus church returns 0, the sheet's button reads the Hub's total each pick ("Show 29 events", "Show 5 events", "Show 2 events", "Show 0 events", "Show 1 event"), Clear filters and the default return to "This week". The sheet opens on what is applied. No format or price filter exists on the canvas or in the app (the Hub has `format`; not drawn). The Hub rejects an unknown `type` with 400 (the app only sends enum values).

**Picture** (`827dc56`, 390 px, light and dark, `pairs2/`): header, tab underline, hero 190, 24 corner, badge, FEATURED / name / line, row pitch (measured 100 pt), Going and Going? pills, the See all link, heading weight, the E2 header, info card, tiers, steppers, pills, total, E8 sheet and E9 including the disabled "Sold out" button (D5 closed, light and dark) all match. TICKETS label to first tier is 58 px as drawn (D3 closed). The hero says "from ₦7,777" while the Early bird (₦4,000, ended) and VIP (sold out) cannot be bought (D4 closed; with Regular sold out too the hero shows no price). Differences, each recorded: no My events, Host event, banner (WORKFLOW 7, task "Added by later tasks"); no Get tickets (EVENTS-06); seven Kind chips instead of four (builder default 2); "This week" and the computed weekday (defaults 3 and 4); the tier line is "N left" (G-270); no photo where the seed has no `bannerUrl` (the canvas photos are sample data); the info card and cover are 2 to 3 px different in my renders (rounding, not a token or order difference). 320x568 (`shots/*-320-*`, `shots/D-*-320.png`): E1, E2, E8 (all eight chips and the button fit), E9 and the 143-character title fit with no horizontal overflow.

**Mutants** (own, applied to the worktree one at a time, reverted from a backup, `git status` clean after): at `2b58fc1` M01 WAT offset, M02 week window, M03 Free test, M04 sold-out `||` to `&&`, M05 `min` to `max`, M06 total ignores quantity, M07 category not sent, M09 view not sent, M10 total ignores Hub total, M12 tier never ended, M14 weekday, M15 hero repeated, M16 See all ignored, M17 "Show 1 event" swapped, M19 type not sent, M20 hero keeps "From": all 16 KILLED. SURVIVED: M08 `nextPage` never read; M21 `getNextPageParam` always undefined; M22 "Show more" never offered; M23 page number always 1 (all four are paging: **T1**); M11 `tiers.every` to `tiers.some` in the all-sold rule (**T2**); M13 optimistic Going count always +1 and M18 the double-tap guard removed (both equivalent in what a person sees: the count is never drawn and the button is also `disabled` while busy). At `827dc56` M08, M11, M21, M22, M23 still survive; new M24 and M29 (a price falls back to the event's own `priceFromNaira`) and M25 (prices never asked): KILLED; M27 (ids not filtered to ticketed) survives, equivalent (the row ignores a non-ticketed price); M28 (the sold bar on a called-off event) survives, reachable only by the host.

**Findings (open at `827dc56`)**
- **P1 (defect).** E1 draws nothing until the new prices call has answered, and that call is not allowed to fail quickly or slowly. `EventsScreen.tsx`: `list.isPending || prices.isLoading` keeps the skeleton up while `GET /events/from-prices` is in flight, and `src/api/query.ts` retries a 5xx twice. Reproduction (`head2.py`): Hub answers 500 for `/events/from-prices`: the rows appear after 5.2 s (against about 1 s normally) and then without prices; the route held open for 12 s: at 5 s the screen is still the skeleton with no rows. A slow or broken optional call makes the whole calendar unavailable, though the events list itself answered. (On a Hub without the route the call fails at once and the rows appear without prices, so this does not bite until the route exists and misbehaves.) Fix: do not retry that query and do not wait for it beyond a short time, or draw the rows and let the prices arrive.
- **T1 (defect, tests).** Paging has no test. Four mutants that break "Show more" and the next page survive the whole events suite (M08, M21, M22, M23: a list that never advances, or always asks page 1, still passes 46 of 46). The behaviour is correct live (above); the suite does not pin it. Fix: one test with a Hub that answers two pages (`nextPage: 2`, then null): "Show more" appears, asks `page=2`, appends, and goes.
- **T2 (defect, tests).** The all-sold rule has no test with a MIXED event (one tier sold out, one open): `tiers.some` in place of `tiers.every` passes everything, and on that event the screen would say "Every ticket for this event has sold." and show the disabled Sold out bar above a tier that can be bought. Fix: one test, Regular open plus VIP sold out: no note, no sold bar, the total still shown.

**Unclear (owner or lead)**
- **U-A.** The detail screen does not refetch while it is open (no focus or app-state wiring; web and native alike): a ticket that sells out under an open E2 stays "10 left" until the screen is reopened (after 30 s, the default stale time). The buy call is the Hub's rule, so no one is charged wrongly, but the person is told a tier is open that is not. Owner to say whether E2 should refetch when it regains focus.
- **U-B.** Dates carry no year. A 2031 event draws "Sun 16 Mar" and the badge "MAR 16", the same as a March next year. The canvas draws none. Owner to say whether an event more than a year ahead shows its year.
- **U-C.** The Hub serves `timezone` and `timeLabel` (a host can write "America/New_York" and "4:00 AM EDT"); the app ignores both and always converts to Lagos time with the label WAT (builder default 4, so it is `differs-for-recorded-reason`). For an event hosted in another zone the date can differ from the host's own (an 8 pm New York start is the next day in Lagos). Owner to confirm that is intended.
- **U-D.** A deep link to `/events/<not a uuid>` shows the Hub's own validation sentence ("Validation failed (uuid is expected)") with Try again. Not reachable from the app's own navigation (ids come from the Hub); low.
- **U-E.** Merge order: `827dc56` carries a contract that names `GET /events/from-prices`, which is not on backend `main` (PR 78). Against main's Hub (checked: the call returns 400 because `:id` catches it) E1 draws no prices at all. Fact that unblocks it: PR 78 merged and the Hub deployed before, or with, this branch.

**Closed from the first verifier, re-checked at `827dc56`:** D1, D2, D3, D4, D5 (pictures above and `head2.py`: row pitch 100, h2, label gap, hero price from the Hub's from-prices, the disabled Sold out button in both themes). Not re-opened: the first verifier's U1 (a ticketless event draws no price line; I agree it is an owner ruling) and U2 (a called-off event is reachable by its host only; the Going toggle stays live on it).

**Status:** open defects P1, T1, T2, so `status: building`. Everything else passed.

## Builder report, round 2

Fix round for the verifier's D1 to D5 (U1, U2, U3 are left for the owner, untouched). Mobile `wmt/EVENTS-01` (verifier's commit 0553663 merged, main merged, already up to date); backend `wmt/EVENTS-01` commit bb10ef0, PR https://github.com/B3rry4r/WAWU-Backend/pull/78.

- **D1**: the section heading ("This week", "Upcoming", "Past events") is the theme's `h2` variant (18.5, 700) with no size override (`EventsScreen.tsx`).
- **D2**: the list is a column with a 4 pt gap (`bodyMetrics.listGap`) between the heading and each row. The row text lines now use the canvas's `line-height: normal` (title, place, price), so a row is the drawn 96 and the divider takes its width from the bottom padding, as the canvas's inset shadow does. Measured in Chromium at 390 px: row pitch 100 pt on all three rows (was 98).
- **D3**: the TICKETS label has no bottom margin and the canvas's normal line (14), so the first tier starts where the label ends (label bottom 442, tier top 442), as the canvas's `col(..., 0)` draws.
- **D4**: backend, additive. `GET /events/from-prices?ids=<uuid>,...` (new route in `EventController`, before `:id`, signed in, at most 50 ids) returns, per published and not called-off event, the cheapest tier that has opened, has not closed (a null end means the event's start, as `buy` decides) and has stock, or null. `priceFromNaira` on `GET /events` and `GET /events/:id` is untouched, so no protected route's answer changed (`.pipeline/protected-registry.json` lists both). No migration, no schema change, no fenced source file; `contract/openapi.json` regenerated with `npm run contract:build` (+64 lines, 0 removed; SHARED-CHANGES EVENTS-01 #1 and #2). The app asks once for the hero and the page's ticketed events (in chunks of 50) and draws that price; no price while it cannot be read (no fallback to `priceFromNaira`); the list waits for it, so a wrong price is never drawn first. G-271 is closed on the branch in `BACKEND_GAPS.md`. Seen live: hero "from ₦7,500" with Early bird (₦5,000, ended and sold out) in the data.
- **D5**: E9's bottom button is built: a disabled "Sold out" `Button` in the foot when every tier has sold and the event is not called off (`event-sold-bar`).
- **Counts**: backend `tsc --noEmit` clean; `src/event/tests` 72 pass (2 new, in `event.contract.spec.ts`, against the real Postgres and the mock wawu-id); protected route suite `scripts/protected-routes/run.sh --fresh` 243 of 244 required pass, the one failure being `POST /payments/hosted-link` ("That redirect address is not allowed", a `.env` redirect setting in the local environment, no events route); backend gates 9 run, 16 fail 56 warn, all in files this branch does not touch (none under `src/event/`, same on main); baseline check passes. Mobile `npm run check` exit 0: 48 suites, 843 tests (was 841; +2 new), gates 9 run, 228 files, 0 fail 0 warn 0 accepted, baseline 0 entries, tasks 209 (the OpenWalletScreen timeout did not recur).
- **Tests**: new, in `eventsScreens.test.tsx`: the price is the Hub's from-prices answer and never the event's own cheapest tier, one request for the page, the null case draws no price, a failed answer draws the events without a price, and the E9 button is disabled. Two edits to existing test lines, both because the behaviour they pinned was changed on purpose by the fix and nothing was loosened: the E1 `serve()` fake Hub now answers the new route with the rows' prices (so its assertions are unchanged), and the E9 count of "Sold out" texts is 3 (two pills and the button, as the canvas draws).
- **Pictures**: `python3 scripts/design/render_design.py E1 E2 E8 E9` beside my own 390 px light and dark screenshots from `npm run web` on the local stack (real sign-in): `/tmp/claude-0/-home-user/5061294a-27a4-5072-ae21-e672def9592e/scratchpad/events01f/shots/` (`E1`, `E2`, `E8`, `E9`, each light and dark; `sbs-*` is design left, app right). Not committed. I do not say they match.
- **Not done / blocked**: nothing blocked. Until backend PR 78 merges, main's contract has no `from-prices`: the mobile contract was synced from the branch (`SOURCE_COMMIT` bb10ef0), and the live Hub at the deployed address answers 404 for it, so E1 would draw no price there until the backend deploys. Fact that unblocks it: PR 78 merged and the Hub deployed.

## Builder report, round 3 (7 Oct 2026)

Built on 3a2de37, with `origin/main` merged (conflicts in BACKEND_GAPS, SHARED-CHANGES and this file kept both sides; `contract/SOURCE_COMMIT` kept as the branch's `bb10ef0` so the PR 78 sync notes still hold; PROGRESS regenerated).

- **P1.** `EventsScreen.tsx`: the skeleton waits on `GET /events` only; the prices query has `retry: false` and never gates the screen. Specs: rows draw while the prices call is held open; a 500 is asked once and the rows stay without a price line.
- **T1.** Spec with a Hub answering two pages: "Show more" is offered, asks `page=2` once (pages asked: 1, 2), appends, then is gone. Run against M21 (`getNextPageParam` undefined) and M23 (page always 1): each fails 1 spec. M08 and M22 are covered by the same spec (no "Show more" or no page 2 rows fail it); I did not run those two.
- **T2.** Spec with one sold-out and one open tier: the buy bar stays and the sold bar is absent. M11 (`every` to `some`): fails 1 spec.
- **E2 focus.** `useRefetchTiersOnFocus` (called by `src/app/events/[id].tsx`) refetches the tiers when the screen is shown again after being left; the first showing is skipped, no timer. Spec `eventsFocus.test.tsx` (mocks `useFocusEffect`, so the navigator is played by the test).
- **Year.** `whenLine` adds the year only when the event's year is not this year ("Sun 16 Mar 2031"). Badges and this year's lines are unchanged.
- **Zone.** `whenLine(iso, event)`: `timezone` null or `Africa/Lagos` keeps "10:00 WAT"; any other zone shows the Hub's `timeLabel` after the date in place of the clock and WAT. Default (agent): with no `timeLabel` only the date is drawn, because a Lagos clock would be wrong. Share uses the same line.
- **Deep link.** A 400 or 404 on the event shows the screen's own `event-gone` state ("This event isn't available"), never the validator's sentence. The wording is the screen's existing one (the ruling's "is not available" is read as the same state).
- **Checks.** `npx jest src/features/events`: 55 of 55 (17 new, no existing assertion changed). `npm run check` exit 0 (2 lint warnings, 0 errors; typed-route types regenerated first).
- **NOT RUN.** Screenshots at 390 px light and dark and the design render comparison: only date text on the detail changed, nothing structural; the independent verifier compares.

## Lead rulings after the second independent verifier (7 Oct 2026)

Build round 3 on 8ae4261, then status `verifying`. An independent verifier re-runs it; a report written from the builder's own environment counts as builder evidence.

- **P1 (list waits on prices).** Fix. Draw the rows as soon as `GET /events` answers. Prices arrive into the rows when `GET /events/from-prices` answers; if it fails, the rows stay without a price line. The prices call never puts the screen back on its skeleton and is not retried.
- **T1 (paging untested).** Fix: specs that kill M08, M21, M22 and M23 (page 2 asked, "Show more" offered while the Hub says there is more, never page 1 twice).
- **T2 (mixed tiers untested).** Fix: a spec with one sold-out tier and one open tier that kills M11 (`every` turned into `some`).
- **E2 not refetching while open.** Refetch the tiers when the screen regains focus. No polling. A purchase that the Hub refuses as sold out refreshes the tiers then and there (that path belongs to the ticket purchase task).
- **No year on dates.** Show the year only when the event is not in the current year ("Sun 16 Mar 2031"). This year's events read as the canvas draws them.
- **WAT always.** Builder default 4 stands for events in Lagos time. For an event whose `timezone` is not `Africa/Lagos`, show the Hub's `timeLabel` instead of WAT. A wrong zone is a wrong fact.
- **Non-uuid deep link.** Show the screen's own "This event is not available" state, never the validator's sentence.
- **Merge order.** The lead merges backend PR #78 (`GET /events/from-prices`) before or with this branch, and regenerates the mobile contract from backend main at that point.
## Hub entries this task adds (R-41)

The HOME-01 and EXPLORE-01 hubs were built before this task, so the entries on them that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
