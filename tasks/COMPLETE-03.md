---
id: COMPLETE-03
title: Home shows its whole design
owner: YOU
area: HOME
order: 239
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [COMPLETE-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [H1, H36]
---
# COMPLETE-03 · Home shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/home/TodayScreen.tsx`, `MoneyCard.tsx`, `CreatorRail.tsx`, `TgifCard.tsx` and their comments listing what they leave out

## Goal

Today (H1) leaves out search, the bell, the money actions, the services row entries, See all and Create until their tasks are built. H1 and H36 are drawn in full now.

## Scope

- The bar: search (EXPLORE-02), the bell (ME-14), and anything else H1 draws.
- The money card: Send (WALLET-02), Add (WALLET-05), Bills (BILLS-01), Scan (WALLET-20, after launch) and the currency chip as drawn.
- The services row: Legal (LEGAL-02), Schools (SCHOOLS-03), Pay bills (BILLS-01), Events (EVENTS-01, wired) and the rest H1 draws.
- Creators to discover: See all (EXPLORE-02) and a card opening the profile (ME-02); the section and its empty state always drawn.
- H36 (TGIF off): the sponsored card (ADS-01) drawn with a neutral placeholder and no advertiser name when no campaign is served.
- Create (ME-04) and every other element H1 draws.
- Files: `src/features/home/*` except the feed (`src/features/feed/*` is COMPLETE-06's).
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [x] A user on Today sees every element H1 draws (and H36 with TGIF off), with an empty Hub and with data. Tests: `HomeScreen.test.tsx` "H1 · every element the artboard draws is on Today" (the order of the tabs, bar, card, TGIF, services and rail), "H36 · Today with TGIF off draws the sponsored card in its place", "H1 · Creators to discover is always drawn" (nobody to suggest), "the money card in every state keeps its chip, its eye and its four actions"; pictures `H1-data-*`, `H36-data-*`, `empty-H36-*`, `empty-H1-*` (below).
- [x] A user can tap each money action and service tile; built ones open their screen, the rest do nothing. Tests: "an entry whose screen is not built opens nothing (R-46)" (12 inert entries by `it.each`, each names its task through a recorder mock of `@/lib/unbuilt`, none pushes a route, sends a request or changes the screen), the sponsored card (ADS-01) and Create (ME-04) tests, "the built entries open their screens: the TGIF card and the Events tile". In the web export every inert entry kept the URL, the page words and the request log, and the TGIF card and Events tile landed on `/tgif` and `/events` (`shots/report.json`).
- [x] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`). The element table is below.
- [x] `npm run check` exit 0 (see the counts below).

## Builder report

Fresh Sonnet builder, 9 Oct 2026, on a detached worktree from origin/main 942ab7b (COMPLETE-01's `unbuilt` helper and gate, COMPLETE-02's Explore and the shared `@/components/CreateButton` are in). Mobile only, no package change. Files: `src/features/home/*` (the feed, `src/features/feed/*`, is COMPLETE-06's and is untouched), `SHARED-CHANGES.md` (one row, COMPLETE-03 F1) and this task's generated files. Nothing under `src/components`, `src/features/explore`, `src/features/events` or `src/app` is edited.

**What changed**
- `HomeBar.tsx` (new): the bar of H1, H11 and H36: the tab row, then search (`unbuilt('EXPLORE-02')`) and the bell (`unbuilt('ME-14')`) as 40 round buttons 8 apart. The bell's dot is data (`GET /me/counts`, as Explore's bell): absent at 0 or when the read fails, and the read never holds the page up.
- `HomeTabs.tsx`: a `fit` option for Today's bar. The row takes the room the buttons leave and steps down (`tabFitSteps`: first the space between tabs, then the labels, never below 80%) until every label shows, so the bar fits a 320 or 360 wide phone. The feed passes nothing and is unchanged. The row carries `testID="home-tabs"`.
- `MoneyCard.tsx`, `MoneyActions.tsx` (new): the Naira chip with its chevron (a button, `unbuilt('WALLET-21')`), the eye in every state (it sets whether a figure shows once there is one), and under the figure, or the Wallet tab's words, always: Send (`WALLET-02`), Add (`WALLET-05`), Bills (`BILLS-01`) and Scan (`WALLET-20`), 48 round buttons in 64 wide columns that give way together on a narrow phone. `quiet` leaves out the card's own Try again when the page's banner carries it.
- `Services.tsx`: all four tiles in the canvas's order, with BRIEF H1's Schools where the canvas draws Shop: Pay bills (`BILLS-01`), Events (wired, EVENTS-01), Legal (`LEGAL-02`), Schools (`SCHOOLS-03`). The heading's line height is the canvas's 24 (it was 21.8, which drew everything under it 2 px high).
- `CreatorRail.tsx`, `parts.tsx` (new): the heading always carries See all (`unbuilt('EXPLORE-02')`, Explore's `SectionHeading`); a card opens the profile (`unbuilt('ME-02')`) and Follow still works on it; with nobody to suggest the section draws three neutral cards at the cards' own size (146 by 196), in place of HOME-01's invented words.
- `SponsoredCard.tsx` (new): H36's sponsored card in TGIF's place when TGIF is off (`adSlot`: 104 high, a 104 wide neutral picture, the SPONSORED kicker; no advertiser, headline, line or button, because no campaign is served until ADS-01). One inert entry (`unbuilt('ADS-01')`).
- `TodayScreen.tsx`: the bar and Create (the shared `CreateButton`, creator accounts only, decided as Explore decides it: `fetchIsCreator` through `proKeys.account`, `retry: false`, read again on refocus and on Try again) are drawn in every state including loading (H11). A failed read never collapses the page: every section stays drawn, under one banner with Try again (Explore's `LoadFailedBanner`) when every read failed; a section that failed alone says so in place with its own Try again. `reads.ts` (`useRead`) holds a failed read steady while it is asked again, so Try again never shows the loading shapes and never flashes the sponsored card (a TGIF switch that failed keeps TGIF on while it retries). A creator has 90 under the last row (16 + 58 + 16), so no Follow sits under Create.
- `TgifCard.tsx` (`TgifProblem`): its button wraps under the words on a phone too narrow for both (the label was clipped by 5 px at 320); `onRetry` is optional.
- `TodayLoading.tsx`, `look.ts`: the shapes are the whole page: the money card (204 with its actions, the built card's height; the canvas draws 203), the slot (104, for TGIF or the sponsored card), the heading bar, four tile shapes, three cards.
- Tests: `HomeScreen.test.tsx` (the tests that asserted absence rewritten, 49 added), new `HomeTabs.test.tsx` (6) and `reads.test.ts` (5). One old assertion was vacuous (`not.toHaveTextContent('485,250')` is a whole-text match, so it could never fail); it is now a regex, and a mutant that ignores the eye is killed by it.

**Element table.** "wired" = opens its real screen. `unbuilt` = drawn, opens nothing, names the task that wires it (the gate lists each). "built" = drawn from the Hub's data or as a fixed part of the layout. Light and dark are both in the pictures.

| # | Element (H1, H36, and H11 where marked) | State | Destination, task |
|---|---|---|---|
| 1 | Tab row: Today (on), Following, For you (H1, H11, H36) | built | Following and For you switch to the feed (HOME-02) |
| 2 | Search button, 40 round (H1, H11, H36) | `unbuilt('EXPLORE-02')` | X5 Search |
| 3 | Bell, 40 round (H1, H11, H36) | `unbuilt('ME-14')` | M31 Notifications |
| 4 | Bell's unread dot | built | shows when `GET /me/counts` says something is unread; none at 0 or when the read fails |
| 5 | Money card: ground, glow, shadow | built | |
| 6 | Naira chip: flag and word | built | |
| 7 | Chip's chevron (the currency switch) | `unbuilt('WALLET-21')` | W2, W3 Dollar and Crypto (after launch) |
| 8 | Eye, in every state of the card | built | sets whether a figure shows |
| 9 | Figure (the bank's), or the Wallet tab's words and its one button | built | Open your wallet opens A26 (wired) |
| 10 | Send | `unbuilt('WALLET-02')` | W7 |
| 11 | Add | `unbuilt('WALLET-05')` | W15 |
| 12 | Bills | `unbuilt('BILLS-01')` | S2 |
| 13 | Scan | `unbuilt('WALLET-20')` | W24 (after launch) |
| 14 | TGIF card (H1) | built | wired: `/tgif`, H29 |
| 15 | "2 min" in the TGIF line | not drawn | G-280: no reading time is served; the element around it is kept |
| 16 | Sponsored card in TGIF's place: frame, neutral picture, SPONSORED (H36) | built | the card opens nothing: `unbuilt('ADS-01')` |
| 17 | Sponsored card's advertiser, headline, line and Tickets button | not drawn | no campaign is served; they are the campaign's own words (ADS-01) |
| 18 | "What would you like to do today?" | built | |
| 19 | Pay bills tile | `unbuilt('BILLS-01')` | S2 |
| 20 | Events tile | wired | E1 (EVENTS-01, review) |
| 21 | Legal tile | `unbuilt('LEGAL-02')` | S14 |
| 22 | Schools tile (BRIEF H1, in Shop's place) | `unbuilt('SCHOOLS-03')` | SC1 |
| 23 | Creators to discover heading | built | |
| 24 | See all | `unbuilt('EXPLORE-02')` | X4 All creators |
| 25 | Creator card: picture or initials, name, tick, field | built | |
| 26 | Creator card press | `unbuilt('ME-02')` | M5 profile |
| 27 | Follow and Following | wired | the Hub's follow call |
| 28 | Creators when nobody is suggested | built | heading and See all kept, three neutral cards, no name |
| 29 | Create (+), creator accounts only (H1, H11, H36) | `unbuilt('ME-04')` | M19 (inside the shared `CreateButton`) |
| 30 | H11's shapes: money card, slot, heading bar, four tiles, three cards | built | |
| 31 | A failed read: one banner, every section kept | built | R-46 |
| 32 | Tab bar, status bar, home indicator | not this task | SHELL-01 and the device |

Drawn: 32 rows. Wired: rows 1, 9, 14, 20, 27. Inert, by task: EXPLORE-02 (2: search, See all), BILLS-01 (2: the Bills action, the Pay bills tile), ADS-01 (1), LEGAL-02 (1), ME-02 (1), ME-14 (1), SCHOOLS-03 (1), WALLET-02 (1), WALLET-05 (1), WALLET-20 (1), WALLET-21 (1), plus ME-04 in the shared Create button. The `unbuilt_entries` gate lists 13 call sites in `src/features/home` and one in `src/components/CreateButton.tsx`. Every named task was read in `tasks/` and is `todo` on main 942ab7b; the destination artboard is in the named task's `artboards` (X4 and X5 in EXPLORE-02, M31 in ME-14, W7 in WALLET-02, W15 in WALLET-05, S2 in BILLS-01, W24 in WALLET-20, W2 and W3 in WALLET-21, S14 in LEGAL-02, SC1 in SCHOOLS-03, M5 in ME-02, M19 in ME-04, H33 in ADS-01). EVENTS-01 is `review`, so the Events tile is wired.

**Capability checks, how each was tested**
- Empty Hub: jest (named above) and web pictures: `empty-H36-*` (no wallet, TGIF off, nobody to suggest, a creator) and `empty-H1-*` (no wallet, TGIF's day unreadable, nobody to suggest).
- Taps: jest presses each inert entry on a settled Today, compares the whole rendered tree before and after, checks no route was pushed and no request sent, and reads the task id from the recorder mock. The built entries push `/tgif` and `/events`. In the web export (Playwright, `shots.log`): the 13 inert entries on the data screen (12 of Home's and Create) and the sponsored card with TGIF off each left the URL, the page words and the request log unchanged; the TGIF card and the Events tile landed on `/tgif` and `/events`; Follow changed the card to Following without opening it.
- What Explore learned: a failed read keeps every section drawn (tests "with no connection a user still sees every section, under one banner", "with every read failed the page has one Try again"), Try again keeps them drawn while it reads and never shows the loading shapes or the sponsored card ("Try again keeps every section drawn while it reads ..."; the web export watched the DOM during the retry: the loading shapes never appeared), no section flashes in before its read settles ("no section flashes in ..." and "the card never flashes in before the switch is read").

**Pictures (V5).** Web export of this tree at 390 px x 2, light and dark, against a STAND-IN Hub and WAWU ID on my ports (5989 page, 5990 Hub, 5991 ID; the creators' pictures are the canvas's own `p1` to `p4`, served by the stand-in; nothing real was called, 0 external requests blocked or sent). Folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-03/shots/`. Each beside its render (render left, built right): `cmp-H1-data-light.png`, `cmp-H1-data-dark.png` (a creator account, TGIF on, with data), `cmp-H36-data-*.png` (TGIF off), `cmp-H36-empty-H36-*.png` and `cmp-H1-empty-H1-*.png` (empty Hub), `cmp-H11-loading-H11-*.png` (loading), `cmp-H1-user-H1-*.png` (a buyer: no Create), `cmp-H1-error-offline-H1-*.png` (every read failed, one banner), `cmp-H1-unreachable-H1-*.png` (the bank did not answer). Narrow phones: `w320-*` and `w360-*` for data, TGIF off, no wallet, bank unreachable, TGIF unreadable, creators unreadable, empty Hub, every read failed and loading; `w412-*`, `w430-*`. Scripts: `standin.js`, `shots.py`, `montage.py`, `measure_canvas.py`. 102 checks, all passed (`shots.log`, `shots/report.json`).
- Geometry against the canvas, read from the canvas's own DOM (`measure_canvas.py` renders H1 from `design/` and reads every text box) and the built page's: the tab labels, the bar's buttons, the money card (118, 350 by 204), the action labels, the TGIF card (342, 104), the services heading (466, 24 high), the tile labels, Creators to discover (608) and its See all, and the cards' top (644) are at the canvas's x and y to 0.1 px at 390. (Boxes of the shared `MediaCard` and the chip are compared by the pictures; the canvas has no status bar here, so the page's top is the same 50.)
- Widths 320, 360, 390, 412 and 430, light and dark (the DOM, `shots.py` MEASURE): no element past the edge outside the rails and no word clipped in the data state, and at 320 and 360 in eight more states; the bar's tabs end before the search button, the four actions and the four tiles sit in a row without overlap. At 320 the tab row steps down to gap 8 and labels at 85% (14); at 360 and wider it keeps the design (gap 20, labels 16.5). Differences seen, all recorded: the web has no status bar or home indicator (the render's bezel puts everything 1 px lower); the Create button covers the right edge of the rail's first row when the Hub serves a tall card above it (the canvas draws it over the rail too); the TGIF date is today's, not the canvas's 26 SEP; "2 min" is not drawn (G-280); H11's TGIF shape is 104 high, not the canvas's 64 (HOME-01 decision 6: skeletons take the built heights).

**Mutants of my own** (one edit each in the worktree, the whole `src/features/home` test folder run, the file restored by checksum; `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-03/mutants.py`, output `mutants.out`): 28 applied, 28 killed. M1 Send names the wrong task; M2 Events and Legal swapped; M3 the Schools tile left out; M4 Create for every account; M5 the sponsored card drawn while TGIF is on; M6 the eye left out with no figure; M7 the four actions left out with no figure; M8 the bell always has its dot; M9 a failed read goes back to loading on retry; M10 a failed page is only the banner; M11 nothing drawn for an empty rail; M12 See all left out; M13 no room for Create at the end of the scroll; M14 Pay bills opens Events; M15 the tab row never gives way; M16 the sponsored card names the wrong task; M17 the creator card has no press; M18 the chip names the wrong task; M19 a retry of the TGIF switch flashes the sponsored card; M20 every section keeps its own Try again under the banner; M21 Create while the account type is unknown; M22 Try again does not read the account type again; M23 search names the wrong task; M24 the Legal tile left out; M25 the figure shows while masked; M26 the dot shown when the count failed; M27 the card leaves out Bills; M28 neutral rail cards the wrong size. M25 first survived (28 of 28 other tests passed): the old HOME-01 assertion `not.toHaveTextContent('485,250')` is a whole-text match and could never fail. The assertion is now a regex and M25 is killed by two tests.

**Checks.** `npm run check` exit 0, as one command, twice. (1) On the tree at origin/main 942ab7b: typecheck 0, lint 0 errors (2 warnings, both in `src/features/events/__tests__/eventsFocus.test.tsx`, not this branch), 99 suites / 1702 tests (main's last recorded run, COMPLETE-02 round 2: 97 / 1642; the 2 suites and 60 tests added are Home's), gates 10 run, 410 files scanned, 0 fail, 0 baseline entries, 13 warnings (the `unbuilt_entries` list, one line per task still inert), task check 271 tasks (`check1.log`). (2) After origin/main moved to ddaf53f (COMPLETE-05, the Wallet tab) and was merged as ad7c99c (the only conflict was the generated `docs/PROGRESS.md`, rebuilt by `check_tasks.py --write`): exit 0, 99 suites / 1732 tests, gates 10 run, 416 files scanned, 0 fail, 0 baseline entries, 16 warnings (the same list with the Wallet tab's entries added), 271 tasks (`check2.log`). `npx jest src/features/home`: 3 suites, 99 tests. The known `eventsScreens.test.tsx` load flake did not occur in either run. Logs: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/complete-03/`. The pictures were taken from the tree before the merge; the merge changed nothing Home imports (`BalanceCard.tsx` and the other shared files are untouched on main).

**Secret scan** of the staged diff: no key-shaped string (no long hex or base64 run, `sk_`, `FLWSECK`, bearer token or private-key header) and no em-dash in any added line.

**Decisions (Default (agent), owner may override)**
1. The eye is drawn in every state of the money card, not only with a figure (R-46: the whole card, whatever the wallet). With no figure it sets whether the next figure shows.
2. The Naira chip is one button (`unbuilt('WALLET-21')`), because its chevron is the currency switch (W2, W3; HOME-01's left-out table already names WALLET-21).
3. The sponsored card is a neutral slot: a neutral picture and SPONSORED, with no advertiser, headline, line or button (each is the campaign's own words; ADS-01 serves and counts them). It is one inert entry naming ADS-01, so ADS-01's builder is told by the gate to wire it. A neutral picture is not a campaign, so nothing is read from `GET /ads` here.
4. Pay bills is drawn though `Services.tsx` said "Pay bills stays off at launch (R-42)": R-46 and this brief name it (inert, BILLS-01). Schools is where the canvas draws Shop (BRIEF H1, R-2).
5. Creators to discover with nobody to suggest draws neutral frames (Explore's pattern), in place of "No creators to suggest yet" and its second line, which HOME-01 wrote and the canvas does not draw.
6. When every read failed the page shows one banner and each section says only what failed, without its own Try again (`quiet`); a section that fails alone keeps its own. The banner is Explore's `LoadFailedBanner` (the stand-in for a compact `ErrorState`, SHARED-CHANGES COMPLETE-02 F2) and the heading row is Explore's `SectionHeading`; SHARED-CHANGES COMPLETE-03 F1 asks that the two move to `src/components/` and Home's import follow.
7. A failed read is held steady while it is asked again (`useRead`): Try again leaves the sections drawn with the button on its spinner, never the loading shapes, and a TGIF switch that failed keeps TGIF on (the Hub's own default) while it retries, so the sponsored card never flashes in.
8. The tab row steps down on a narrow phone (`tabFitSteps`) rather than clip a word or scroll; the design's size is kept whenever it fits.
9. `TgifProblem` wraps its button under the words on a narrow phone and grows to hold it; its card keeps the TGIF card's 104 as its least height.
10. Create is decided as Explore decides it (R-38, `fetchIsCreator`, `retry: false`, read again on refocus and on Try again), drawn in every state including loading (H11 draws it), and a creator has 90 under the last row.
11. The skeleton's money card is 204 (the built card with its actions), not the canvas's 203, and the slot under it is 104 whether TGIF or the sponsored card will fill it, with four tile shapes always (HOME-01 decision 6 for the heights).
12. Search is an icon button named "Search" (H1 draws a round button, not Explore's pill; no "WAWU" anywhere).
13. The services heading's line height is the canvas's `normal` (24 at 18.5); it was 21.8, which put the rows under it 2 px high since HOME-01.

**NOT RUN**
- The real Hub (V9): the pictures use a stand-in Hub and WAWU ID. Unblocked when backend main serving `GET /creators`, `GET /me/counts`, `GET /settings/tgif`, `GET /tgif/{date}` and `GET /money/wallet` is reachable from a build (checkable: `GET /api/hub/me/counts` answers 401 without a token).
- A phone (V10): no device touched. What only a phone shows: the Android and iOS status bar and safe areas over the bar, `boxShadow` under the money card and the Create button, the SVG glows, and the bar's tab-row steps at the real font. Unblocked by the next preview build.
- Pull to refresh on Today: Today has none (the Wallet tab and Explore do); not part of this task.
- A campaign in the sponsored card (H36 with an advertiser, headline, line and Tickets): ADS-01 serves it. Unblocked when ADS-01 is `review` (the gate then fails until `unbuilt('ADS-01')` is replaced).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
