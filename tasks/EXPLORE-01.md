---
id: EXPLORE-01
title: Explore: browse, categories, loading, empty
owner: YOU
area: EXPLORE
order: 110
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [EXPLORE-03, UI-02, UI-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X1, X15, X2, X3, X13, X14]
---
# EXPLORE-01 · Explore: browse, categories, loading, empty

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


## Lead note (7 Oct 2026): built now, with what exists (R-41)

The owner asked for every tab to be built now. This hub is built before the tasks below; each entry on it that leads to one of their screens is left out here and added, exactly as drawn, by that task (R-27, R-41). Everything else on the artboards is built as drawn.

- EXPLORE-02 (All creators and search)
- EVENTS-01 (Events: list, filters, detail, sold out)
- PROS-01 (Find a professional)
- SCHOOLS-03 (Schools: directory, school page, course page, no results)
- PROS-03 (Get listed as a professional)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py X1 X15 X2 X3 X13 X14` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for X1, X15, X2, X3, X13, X14, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **X1 · Explore**: Explore ('Approved E4'): search bar, FEATURED EVENT hero (WAWU Creators Summit, Lagos, 12 Oct · Eko Convention Centre), category chips (All + 6 + More), Featured creators rail (@handle, field, Follow), Upcoming events list, then doors: Find a professional, Find a school, List your services.
- **X15 · Explore · scrolled down**: Explore scrolled: Upcoming events, then the doors: Find a professional (Accountants, lawyers, designers), Find a school (Courses from schools and academies), List your services (Get paid to answer questions).
- **X2 · Categories**: Categories screen: chip row (All, Music & Audio, Film & Video, Art & Design, Photography, Fashion & Beauty) above a creator list with Follow/Following.
- **X3 · One category**: Photography selected: chips stay in place; creators @amaka Photographer, @chidi Wedding films, @sade Portraits, @tunde Drone, each with Follow.
- **X13 · Empty category**: From X3 when a category is empty: chips All, Gaming & Esports, Faith & Spirituality; 'Nobody is publishing in Gaming & Esports yet'.
- **X14 · Explore · loading**: From X1 while loading: skeleton with search bar and tab bar.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- X1: the bell (opens M31): added by ME-14
- X1: a creator (opens M5): added by ME-02

## Capability checks

- [ ] **X1**: a user can search (X5); open the featured event or an event row (E2); tap a category (X3); See all creators (X4); Follow; Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X15**: a user can open an event (E2); Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X2**: a user can tap a chip (X3); Follow.
- [ ] **X3**: a user can switch chip; Follow.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states X13, X14.

## What the backend serves today (from the analysis)

- **X1**: partial. Missing: Featured event and event list served. Creators served but 'featured' creators has no featured/paid-featured flag (web FeaturedThisWeek.tsx: 'nothing on the contract marks a creator … as PAID-featured'); creator category filter matches UserProfile.interests strings, not the creator taxonomy categories drawn; no schools backend for the Find a school door.
- **X15**: partial. Missing: Events and professionals served; Schools door target has no backend at all (Schools flow is new).
- **X2**: partial. Missing: Filter is on free-text interests, not the creator taxonomy category ids the chips show; no specialization-based creator filter.
- **X3**: partial. Missing: Same as X2: category semantics differ from the drawn taxonomy.
- **X13**: partial. Missing: Works as an empty list; categories themselves differ (see X2).
- **X14**: n/a.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X1: WAWU Creators Summit, Lagos, 12 Oct, Eko Convention Centre
- X1: Gospel Night Live, Abuja, OCT 18
- X1: Monetise Your Content, Online, NOV 02

## Designer notes (⚠, unresolved)

- None.

## Builder report

**Files.** `src/app/(tabs)/explore.tsx` (the tab now opens Explore), `src/app/categories.tsx` (new, `/categories?category=<id>`), `src/features/explore/`: `api.ts` (categories, featured, creators pages, follow and unfollow), `categories.ts`, `paging.ts`, `follow.ts` (one Follow state on every Explore list), `ExploreScreen.tsx` (X1), `ExploreSkeleton.tsx` (X14), `CategoriesScreen.tsx` (X2, X3, X13), `CategoryTiles.tsx`, `CategoryChips.tsx` (stand-in, SHARED-CHANGES EXPLORE-01 #1), `CreatorCard.tsx`, tests `__tests__/model.test.ts`, `__tests__/screens.test.tsx`. Docs: BACKEND_GAPS G-300 to G-302, SHARED-CHANGES EXPLORE-01 #1 to #3 and F1, docs/LOG.md.

**Left out (R-27, R-41), with the task that adds each as drawn:** X1 search bar (opens X5) and Featured creators "See all" (X4): EXPLORE-02. X1 bell (M31): ME-14. X1 a creator card opening M5: ME-02 (Follow on the card is built). X1 FEATURED EVENT hero, Upcoming events, its "See all" and event cards (E2, E1), and X14's hero skeleton block: EVENTS-01. X1 and X15 doors: Find a professional (P1) PROS-01, Find a school (SC1) SCHOOLS-03, List your services (P5) PROS-03. X1, X14, X15 Create button (M19): ME-04. **X15 is not built at all**: everything it draws is the events rail and the doors above. Nothing on these artboards leads to a screen already built, so nothing else was wired.

**Checks.** X1: tap a category (X3): jest `a user can tap a category tile...` and live (Photography tile opens X3 with Chidi). Follow: jest (Follow, Following, refused put back, own card has no Follow) and live (POST written, read back `zainab-pro following: true` with the user's token). Search, featured event, event row, See all, the doors: NOT RUN, left out (above). X15: NOT RUN, left out. X2: tap a chip (X3), Follow: jest and live. X3: switch chip, Follow: jest and live. V5: screenshots taken (list below), comparison is the verifier's. Every value comes from the Hub: categories, handles, fields and ticks from `GET /explore/*`; no event figure is on screen. V6: loading (requests held by the network), empty (X13: a category nobody publishes in, Gaming & Esports and Music & Audio on the seeded Hub), error (connection dropped on every try; Try again recovers), each live and in jest. X1 has no empty screen: with nobody featured the rail is not drawn and the tiles stay (jest).
**V9 (local Hub, wawu-backend 3041887, DB `bx01_test`, stand-in WAWU ID on 5372).** Signed in through the app's own sign-in screen as `user@test.wawu.dev`; featured creators were set by a superadmin through `PUT /admin/featured-creators/:id`; Chidi's and Zainab's interests were written through `PATCH /users/me` as each creator, so Photography and Business & Finance hold one creator each. The stand-in WAWU ID answers sign-in bare while the app reads `{ data }`; for this run a 15-line preload (scratch only, not committed) wrapped `/auth/login` and `/auth/refresh` answers in the real envelope. The exported bundle held only `localhost:5371` and `:5372`.

**Screenshots** (390 wide, light and dark): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/bx01/shots/`: `X1`, `X1-following`, `X14-loading`, `X2`, `X3`, `X3-chip-switch`, `X13`, `categories-loading`, `categories-empty-music`, `categories-error`, `X1-error`, `X1-after-retry`, each `-light.png` and `-dark.png`.

**Gates.** Before: tsc 0, gates 9 run / 297 files / 0 findings, 210 tasks, jest 1142 passed and 1 failed (`OpenWalletScreen.test.tsx` A26 timed out at 20 s under load; it passes in the full run after). After (main a167415 merged): `npm run check` exit 0: tsc 0, lint 0, jest 65 suites 1171 passed (28 new), gates 9 run / 310 files / 0 findings, baseline 0, 210 tasks. One earlier full run failed once on `WorkScreen.test.tsx` (M35 Remove, not touched here) at load average 10; it passed alone (26/26) and in the next full run.

**Defaults (agent), owner may override.** Tiles and chips follow the server's category order (G-180), so X1 shows Music, Film, Photography, Fashion, Business, Technology, not the canvas's order. Icons for the four categories the canvas never draws: Business BriefcaseBusiness, Technology Smartphone, Food & Lifestyle Sun, Sports Dumbbell. All and More both open Categories on All. The creator tick shows first, else the professional tick. A card with no handle shows the name. With nobody featured, the Featured creators section is hidden. All's empty copy (not drawn): "Nobody is publishing yet" / "Come back once more people have published." The chip a link opens on is scrolled into view once if it starts out of view; after that the chips stay in place (X3). Follow on the card is the shared Button, size sm, held to the canvas's 32 height (its label is 13.5, the canvas 13); Following uses the glass look (white at 14% with a glass ring; the canvas draws white at 20%, no ring). The bar is announced as the heading "Explore" (X1 has no title).

**NOT RUN.** V10 (no tester build with this branch; unblocked when a development or tester build includes it). V4 beyond follow (the one field one person writes and another reads: tested both sides through the API). Picture comparison (V5) is the verifier's.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
