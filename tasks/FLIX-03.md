---
id: FLIX-03
title: Flix movies: MV1 to MV12 and the Home and Explore rails
owner: YOU
area: MOVIES
order: 216
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [FLIX-01]
decisions: [R-74, R-75, R-67, R-69, R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: [MV1, MV2, MV3, MV4, MV5, MV6, MV7, MV8, MV9, MV10, MV11, MV12]
---
# FLIX-03 · Flix movies: MV1 to MV12 and the Home and Explore rails

## Current state

As of 22 Oct 2026.
- **Status:** verifying (round 2). Built on `wmt/FLIX-03`; contract from backend `wmt/FLIX-01` (`312f16c`, unchanged at `b5913a1`). Screens: MV1 to MV12 in `src/features/movies/`, routes in `src/app/movies/`, the rail on Today and Explore. The contract copy must be refreshed from backend main once FLIX-01 merges (SHARED-CHANGES FLIX-03 #1).
- **Next:** the verifier runs V1, V4, V5, V6, V9. Round 2 (lead rulings): SHARED-CHANGES R1 applied (the five `movies/*` lines are in `_layout.tsx`; `route-guard.test.tsx` passes). Pictures (V5): every built screen beside its board, light and dark, in the builder's proof folder `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/flix-03-b/proof/` (`cmp/cmp-<ID>-<theme>.png` board left, built right; `pics/` raw; `boards/`; `shoot.py`, `shoot_mv4.py`, `picked.json`, `report.json`), from the web export over backend `b5913a1` with `MOVIE_PARTNER=standin`; 0 external requests got out (the stand-in's picture addresses end in `.invalid`, so posters show their placeholder block where the board shows a photo, and MV3's video file does not load: the clock reads 0:00 / 0:00).
- **Per artboard (built beside board; light and dark alike unless said):** MV1 matches, with the tab bar (Explore lit), without the Inbox count (the bar reads none here); MV2 matches, no share button; MV3 matches, no full-screen icon, no length; MV4 matches with the shared consent box added for a person who has not agreed (`pics/MV4-consent-*`), and as drawn for a person who has; MV5 matches; MV6 matches (no tab bar on the board); MV7 matches, "Most watched" shortens to "Most watc..." in the control where the board wraps it; MV8 matches (the field is 46 high, as the board); MV9 matches; MV10 differs: "Clear search" and "Try another word." (accepted); MV11 matches, with the tab bar; MV12 differs: the shared ErrorState draws a secondary "Try again" with an icon where the board draws a purple one, with the tab bar; Home today and Explore: the rail sits where the board puts it, titles and posters come from the Hub.
- **Accepted by the lead (round 2):** the trailer card says where it plays instead of "2:14 · free" because the Hub does not serve the trailer's length; "Clear search" on MV10 from search; "See all" on the rails opens MV1 because the board's entry map wins over the task text; the shared SearchField is used for MV8 and MV10.
- **Follow the board (round 2):** the tab bar is drawn under MV1, MV11 and MV12 by the shared `TabBar` (the screens are stack routes, so `FlixTabBar` gives it the five tabs with Explore lit; nothing in the route structure prevented it). MV2's share button is not drawn: the Hub serves no Flixora page address (BACKEND_GAPS G-FLIX-4). MV3's full-screen icon is not drawn: `VideoSurface` has no way to go full screen (SHARED-CHANGES FLIX-03 #4). G-FLIX-1 and G-FLIX-3 stay open.
- **Rulings:** R-74 (the catalog in the app, watching on Flixora; Flixora named as drawn) and R-75 (the first "Watch on Flixora" opens the Flixora account; MV4 shows the shared consent box only when the Hub says the person has not agreed), both owner, 22 Oct 2026.
- **Design:** adopted on `wmt/FLIX-CUT` (22 Oct 2026). Flow MV is the new `design/Flix Movies Flow.dc.html`; `design/canvas-inventory.json` gains MV1 to MV12 (MV1 Flix movies, MV2 Movie, MV3 Trailer, MV4 Continue on Flixora, MV5 Opening Flixora, MV6 All movies, MV7 Filter, MV8 Search, MV9 Premiering soon, MV10 No results, MV11 Loading, MV12 Couldn't load).
- **Screens that gain the rail:** two existing artboards changed hash and nothing else did. H1 (Home, Today) gains the "Flix movies" rail below the creators rail (both its Today and its Today-with-ad phone). X1 (Explore, root) gains it below the creators rail and above "Upcoming events". Checked: removing the rail from the new boards gives the old boards byte for byte. The Services Flow cover also draws Today as context (not an artboard, no hash); the bundle's auth, events and services sources carry the rail too but its Auth and Events boards were not rebuilt.
- **Both rails are another task's screen** (HOME-01 built H1, EXPLORE-01 built X1): this task adds them through one SHARED-CHANGES row, drawn only when the Hub answers `enabled: true`.
- **Not drawn, lead default:** MV4's consent box for a person who has not agreed to the terms that name Flixora (BACKEND_GAPS G-FLIX-1); a YouTube trailer on MV3 (G-FLIX-3).
- **History:** none yet. Reports go to tasks/history/FLIX-03.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py --flow "Flix Movies"` (or `MV1 MV2 ...`) then open `build/design_shots/`; also `H1` and `X1` for the rails
- `design/CLAUDE.md`: the Flix line (rails, in-app browse and trailer, "Watch on Flixora" hands off signed in)
- `DECISIONS.md`: R-74, R-75, R-67 (the sign-up agreement), R-69 ("Who Made This?" with the question mark), R-27, R-47
- `docs/flixora/PARTNER-API.md` (what a movie, a trailer and a premiere are; Flixora plays only in Chrome or Edge on a computer, so say on MV4 and MV5 exactly what the board says)
- `tasks/FLIX-01.md`: the `/api/hub/movies` routes this task reads (`npm run api` regenerates the types from the contract)
- `src/features/open-wallet/ConsentBox.tsx` (A3's shared consent box, also used by `SignUpScreen`) and `src/features/feed/player/index.tsx` (the existing video player)

## Goal

The Flix movies flow as drawn, from the Hub, shown only when the Hub says `enabled: true`.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

- MV1 to MV12 picture against picture, light and dark.
- The Flix movies rail on Home's Today screen (below Creators and professionals) and on Explore (below Who Made This?), drawn only when enabled (R-27, R-47). Adding the rail to those two screens is a follow-up in another task's screen: one SHARED-CHANGES row.
- Trailers: a `file` trailer plays in the app with the app's existing video player; a `youtube` one opens in the YouTube app or browser (G-FLIX-3).
- "Watch on Flixora" opens MV4. MV4 shows A3's shared ConsentBox only when the movie's `mustAgreeTerms` is true, and "Open Flixora" waits for the tick (G-FLIX-1). MV5, then the Hub's watch link (`POST /movies/{movieId}/watch`) in the system browser.
- MV9: a premiering title shows the trailer only until the date.
- MV10, MV11 and MV12 are states from real answers (no results, loading, could not load).
- Everything comes from the Hub: no sample titles, posters, ratings or dates from the design. No em-dashes. "Who Made This?" with the question mark (R-69). Flixora is named as drawn (R-74).

## Capability checks

- [ ] With the Hub answering `enabled: false`, neither rail nor any Flix screen is drawn, on Home or on Explore.
- [ ] With `enabled: true`, the rail shows the Hub's titles on Home (below Creators and professionals) and on Explore (below Who Made This?), and "See all" opens MV6.
- [ ] MV1, MV6 (sort, a total), MV7 (genre, language, premiering only) and MV8 (search) read the Hub's browse, filters and search answers; MV10 shows for a real empty answer, MV11 while loading, MV12 when the Hub fails.
- [ ] MV2 shows the Hub's movie; a `file` trailer plays in the app, a `youtube` trailer opens outside the app.
- [ ] A person with `mustAgreeTerms: true` sees the ConsentBox on MV4 and "Open Flixora" stays off until they tick it; the tap sends `agreeToTerms: true`. A person with `mustAgreeTerms: false` sees no box.
- [ ] "Open Flixora" gets a fresh link per tap and opens it in the system browser (V5: the link is never shown, stored or logged); a 409 or 503 shows a plain sentence.
- [ ] MV9 plays the trailer only until the premiere date.
- [ ] Light and dark match the board (V4), and no copy has an em-dash.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FLIX-03.md](history/FLIX-03.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
