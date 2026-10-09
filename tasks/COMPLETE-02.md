---
id: COMPLETE-02
title: Explore shows its whole design
owner: YOU
area: EXPLORE
order: 238
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [COMPLETE-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [X1, X14]
---
# COMPLETE-02 · Explore shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/explore/ExploreScreen.tsx` and its comment listing what it leaves out

## Goal

The owner opened Explore and saw only the category pills: everything else is left out until its task is built, or drawn only when the Hub serves data. X1 is drawn in full now.

## Scope

- The bar as drawn: search pill (EXPLORE-02) and bell (ME-14), plus anything else X1 draws in it.
- Featured event hero and Upcoming events with See all (EVENTS-01): always drawn; the empty state when the Hub serves none.
- Featured creators with See all (EXPLORE-02) and a card opening the profile (ME-02): always drawn; the empty state when there are none.
- Every door on the doors card as drawn: List your services (PROS-03, wired), Find a professional (PROS-01), Schools (SCHOOLS-03), and the rest X1 draws.
- Create (ME-04) if X1 draws it, and every other element X1 draws.
- Files: `src/features/explore/*`, `src/app/(tabs)/explore.tsx`. Developer 3 works on events and professionals: merge main before pushing.
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [x] A user opening Explore with an empty Hub sees every section X1 draws, each with its empty state. Tests: `screens.test.tsx` "with nobody featured ...", "with no featured event and no upcoming events ...", "with no category served ..."; pictures `empty-X1-*` and `blank-X1-*` (below).
- [x] A user can tap search, the bell, See all and each door; built ones open their screen, the rest do nothing. Tests: "a user who taps an entry whose screen is not built opens nothing and changes nothing" (seven inert entries, none calls a destination, no request is sent, the screen is unchanged), the event, tile and door tests for the built ones, `exploreRoute.test.tsx` (tile and door routes). In the web export every inert entry kept the URL and every wired one landed on its screen (`shots/report.json`).
- [x] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`). The element table is below.
- [x] `npm run check` exit 0 (see the counts below).

## Builder report

Branch `wmt/COMPLETE-02`. Mobile only, no package change. Files: `src/features/explore/*`, `src/app/(tabs)/explore.tsx` (a comment only), one SHARED-CHANGES row, and this task's generated files. Nothing under `src/features/events`, `src/components`, `src/app/_layout.tsx` or `src/features/pro-listing` is edited (Explore imports from them).

**What changed**
- `ExploreBar.tsx` (new): the bar as X1 and X14 draw it: the mark, the search pill ("Search Who Made This", R-37; `unbuilt('EXPLORE-02')`) and the 44 round bell (`unbuilt('ME-14')`) with its unread dot.
- `CreateButton.tsx` (new): the floating Create button (kit `Fab`: 58 round, accent, `shadows.fab`, a 26 plus at stroke 2.4, 18 from the right, 106 above the phone's bottom edge), creator accounts only, `unbuilt('ME-04')`.
- `parts.tsx` (new): `SectionHeading`, Featured creators' See all (`unbuilt('EXPLORE-02')`), `HeroDots` (the hero's three pager dots), and the neutral frames where the Hub serves nothing: `ExploreFeaturedEventEmpty`, `CreatorsRailEmpty`, `ExploreEventsEmpty` (its See all is wired to E1).
- `ExploreScreen.tsx`: draws the whole of X1 in X1's order: bar, hero, tiles, Featured creators, Upcoming events, the doors card, Create. Every section is always drawn. The props `onOpenEvent`, `onSeeAllEvents` and `onListServices` are required (a screen that draws its whole artboard has all its built destinations) and the events are always read. The doors card has the canvas's three doors. The comment that listed what the screen leaves out is gone.
- `CategoryTiles.tsx`, `categories.ts`: More is always drawn; with no category served, six neutral frames sit between All and More.
- `CreatorCard.tsx`: an `onPress` for the card (the profile, M5). Explore and Categories pass `unbuilt('ME-02')`.
- `api.ts`: `fetchUnreadNotifications` (`GET /me/counts`, the bell's dot).
- `DoorsCard.tsx`, `ExploreSkeleton.tsx`, `explore.tsx`: comments only.
- Tests: the three that asserted absence ("draws no entry whose screen is not built yet", "with nobody featured ... no empty rail", "the card has only List your services") and the two that asserted no event entry on a failed read now assert the entry or its neutral frame is drawn; `model.test.ts` asserts More always and the neutral tiles; new `exploreRoute.test.tsx` (tile and door routes). 18 tests added: 97 suites, 1626 tests (was 96 and 1608).

**Element table.** "wired" = opens its real screen. `unbuilt` = drawn, opens nothing, names the task that wires it (the gate lists each). "built" = drawn from the Hub's data or as a fixed part of the layout. Light and dark are both checked in the pictures.

| # | Element (X1, and X14 where marked) | State | Destination, task |
|---|---|---|---|
| 1 | Brand mark, 34 wide (X1, X14) | built | the app's own mark, R-37 (the canvas's WAWU icon is a recorded difference) |
| 2 | Search pill, magnifier and "Search Who Made This" (X1, X14) | `unbuilt('EXPLORE-02')` | X5 Search |
| 3 | Bell, 44 round (X1, X14) | `unbuilt('ME-14')` | M31 Notifications |
| 4 | Bell's unread dot (X1, X14) | built | shows when `GET /me/counts` says something is unread; none at 0 or when the read fails |
| 5 | Featured event hero: picture, scrim, FEATURED EVENT, name, day and place | wired | E2 (EVENTS-01, review) |
| 6 | Hero's three pager dots (22, 6, 6) | built | decorative, over the hero and over its empty frame |
| 7 | Hero when no event is served | built | neutral frame, kicker and dots, no name or date |
| 8 | Category tiles: All (on), the first six categories | wired | Categories on that category, X3 (EXPLORE-01, done) |
| 9 | More tile | wired | Categories on All, X2 |
| 10 | Tiles when no category is served | built | six neutral frames between All and More |
| 11 | Featured creators heading | built | |
| 12 | Featured creators See all | `unbuilt('EXPLORE-02')` | X4 All creators |
| 13 | Creator card: picture or initials, @handle, tick, field | built | |
| 14 | Creator card press | `unbuilt('ME-02')` | M5 profile |
| 15 | Follow and Following on the card | wired | the Hub's follow call (EXPLORE-03, done) |
| 16 | Featured creators when none are served | built | heading and See all kept, three neutral cards, no name |
| 17 | Upcoming events heading and See all | wired | E1 (EVENTS-01) |
| 18 | Event card: picture, date badge, name, pin and place | wired | E2 |
| 19 | Upcoming events when none are served | built | heading and See all kept, three neutral cards, no name or date |
| 20 | Door: Find a professional | `unbuilt('PROS-01')` | P1 |
| 21 | Door: Find a school | `unbuilt('SCHOOLS-03')` | SC1 |
| 22 | Door: List your services | wired | P5, or P8 for someone who applied (PROS-03, review) |
| 23 | Create (+), creator accounts only (X1, X14) | `unbuilt('ME-04')` | M19 |
| 24 | X14's loading shapes: hero block, four tiles, heading bar, three cards | built (already) | |
| 25 | The tab bar, status bar, home indicator | not this task | SHELL-01 and the device |

Drawn: 25 rows. Wired: rows 5, 8, 9, 15, 17, 18, 22. Inert, by task: EXPLORE-02 (2: the search pill, Featured creators' See all), ME-02 (2: the Explore card, and the same card on Categories), ME-14 (1), ME-04 (1), PROS-01 (1), SCHOOLS-03 (1). The `unbuilt_entries` gate lists those 8 call sites.

**Capability checks, how each was tested**
- Empty Hub: jest (named above) and web pictures with the stand-in Hub serving only categories (`empty-*`) and nothing at all (`blank-*`).
- Taps: jest presses the seven inert entries on a screen with creator account and an unread count, compares the screen before and after, checks no request was sent and none of the four destination callbacks ran. The built entries each call their callback with the right argument; the route test checks the router call. In the web export (Playwright, `shots.log`): each of the seven inert entries left the URL and Explore unchanged; the tile, More, the hero, an event card, See all and List your services landed on `/categories`, `/categories`, `/events/e1`, `/events/e2`, `/events` and `/professional-apply`.

**Pictures (V5).** Web export of this branch, 390 px at 2x, light and dark, against a STAND-IN Hub on my ports (5985 web, 5986 Hub, 5987 ID; the pictures in the data state are the canvas's own sample pictures). Nothing real was called (0 external requests blocked or sent). Folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-02/shots/`. Beside each render: `cmp-X1-data-light.png`, `cmp-X1-data-dark.png` (full Hub), `cmp-X1-empty-light.png`, `cmp-X1-empty-dark.png` (categories only, the owner's phone), `cmp-X1-blank-light.png`, `cmp-X1-blank-dark.png` (nothing served), `cmp-X14-light.png`, `cmp-X14-dark.png` (loading), `cmp-X15-data-*.png` and `cmp-X15-empty-*.png` (scrolled to the doors). Single built shots: `data-`, `empty-`, `blank-`, `user-` (no Create) `X1-` and `X15-` in both themes, `loading-X14-*`, `error-X1-*` (Hub unreachable), `lands-*` (where each wired tap landed). Scripts: `standin.js`, `shots.py`, `montage.py`; 49 checks, all passed (`shots.log`, `shots/report.json`). Differences seen, all recorded: the web has no status bar, so the built bar sits 40 px higher than the render's; the mark is the app's own (R-37); the tab bar's "3" on Inbox is the shell's and the canvas's sample.

**Mutants of my own** (one edit each in the worktree, the whole explore test folder run, the file restored by checksum; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-02/mutants.py`): 15 applied, 15 killed. M1 bell dot with nothing unread; M2 Create for every account; M3 no frames when nobody is featured; M4 Upcoming events left out when empty; M5 hero frame left out when empty; M6 Find a school opens List your services; M7 empty See all opens nothing; M8 More only above six categories; M9 pager dots all one width; M10 Create 40 higher; M11 search pill says WAWU; M12 creator card calls the event handler; M13 bell left out; M14 Find a professional left out; M15 no neutral tiles. The first run of each killing test is in `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-02/mutants.out`.

**Checks.** CHECKS_PLACEHOLDER

**Secret scan** of the staged diff: no key-shaped string (no long hex or base64 run, `sk_`, `FLWSECK`, bearer token or private-key header).

**Decisions (Default (agent), owner may override)**
1. The search pill says "Search Who Made This" (R-37 and the SHARED-CHANGES row for EXPLORE-01), not the canvas's "Search WAWU".
2. The bell's dot is data, not decoration: it shows when `GET /me/counts` reports unread notifications and is absent at zero or when that read fails (as the Inbox badge is absent at zero). The canvas's dot is sample data. The read neither holds the screen up nor fails it.
3. Create is for creator accounts only (R-38, "Create stays the floating button for creator accounts"). Account type comes from `GET /users/me` through PROS-03's `fetchIsCreator` and `proKeys.account` (one cached answer shared with the "List your services" door). It is not drawn while unknown, failed, or for a user, a professional or someone with no type. The one button should live in `src/components/` for Home and Me too: SHARED-CHANGES row COMPLETE-02 F1.
4. The hero's pager dots are drawn as the canvas draws them (22, 6, 6, the first on) over a featured event and over its empty frame, though the Hub serves one featured event so nothing pages. The owner's "full designed UI" rule outweighs EVENTS-01's earlier choice to leave them out. They are overlaid from `parts.tsx`; `src/features/events/ExploreEvents.tsx` is untouched.
5. More is drawn even when six or fewer categories are served (it opens every category, as All does); with no category served, six neutral frames hold the places (no category name is invented).
6. An empty section keeps its heading and See all and draws neutral frames (the sunken block of the shared `Skeleton` with a quiet glyph) with no visible words; each has a spoken label ("Featured creators, none to show", "Upcoming events, none to show", "Featured event, none to show").
7. A failed events read, not only an empty one, now draws the two event sections as neutral frames and no error (before, both were left out).
8. The same creator card on Categories (X2, X3) gets `unbuilt('ME-02')` too: it is the same component opening the same profile, so ME-02 cannot wire one and forget the other. This is one step past X1.
9. Task ids per entry: search and Featured creators' See all EXPLORE-02 ("All creators and search", X4 and X5); the bell ME-14 (M31, "Saved, purchases and notifications"); a card ME-02 (M5); Find a professional PROS-01; Find a school SCHOOLS-03 ("Schools: directory, school page, course page"); Create ME-04 (M19). PROS-03 and EVENTS-01 are `review`, so their entries are wired.
10. Sizes: Featured creators' See all is 13.5 (the canvas's `SH`); the events rail's own See all in `ExploreEvents.tsx` is 14, and the empty events heading uses that component's, so the two events states match each other. The headings sit on the bottom line (the canvas's `align-items: flex-end`) in my parts; the populated events rail centres them (up to about 2 px apart). Both are EVENTS-01's file, not touched.

**NOT RUN**
- The real Hub (this branch against the deployed API): the pictures use a stand-in Hub. Unblocked when backend main serving `GET /explore/*`, `GET /events` and `GET /me/counts` is reachable from a build (checkable: `GET /api/hub/me/counts` answers 401 without a token).
- A phone (V10): no device touched; the Create button's offset, the bell's dot and the inset hairlines were seen on the web export only (React Native's `boxShadow` on a device is unchecked). Unblocked by the next preview build.
- The Android and iOS status bar and safe areas (the web export has none, so the bar shows 40 px higher than the render).
- The `Categories` screens' own artboards (X2, X3, X13) beyond the creator card's press: not this task.


## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
