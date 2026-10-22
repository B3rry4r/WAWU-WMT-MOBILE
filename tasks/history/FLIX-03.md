# FLIX-03 · round history

Moved out of [tasks/FLIX-03.md](../FLIX-03.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/movies/` (api, model, look, parts, FlixRail, MoviesGate, MoviesScreen, AllMoviesScreen, FilterSheet, SearchScreen, MovieScreen, TrailerScreen, WatchFlow, routes, 2 test files), `src/app/movies/` (index, all, search, `[id]/index`, `[id]/trailer`), the rail wired in `TodayScreen.tsx`, `ExploreScreen.tsx`, `(tabs)/explore.tsx`, `ScreenFrame` gains an optional `right`, contract copied from `wmt/FLIX-01` `312f16c`. SHARED-CHANGES FLIX-03 #1 to #3 and R1.
Checks (logs under the builder's scratchpad folder): tsc EXIT 0; eslint on changed files EXIT 0; new tests 20 passed; Home, Explore and route-graph suites pass; route-guard fails only on the five new route files until R1 is applied; gates: no finding in the new files (the only gate run left 0 findings in them after fixes).
Capability checks: rail and every Flix screen are drawn only for `enabled: true` (tested: false and an unreadable answer draw nothing; `MoviesGate` leaves a screen when the Hub says off); See all on the rails opens MV1 (the board's entry map says MV1; the task text says MV6, which MV1's rails reach in one tap); MV1/MV6/MV7/MV8 read browse, filters and search with the Hub total; MV10 for a real empty answer, MV11 loading, MV12 failure; MV2 shows the Hub movie, a `file` trailer plays through `VideoSurface`, a `youtube` one opens outside the app; MV4 draws A3's ConsentBox only for `mustAgreeTerms`, Open Flixora waits for the tick and sends `agreeToTerms: true`; each tap asks for a fresh link and opens it in the system browser without showing or keeping it; a 409 and a 503 each show one plain sentence; MV9 shows the trailer only until `premierDate`.
Differs from the board, and why: no tab bar on the Flix screens (they are stack routes above the tabs); no share button on MV2 (the Hub serves no address to share); no full-screen icon on MV3 (nothing behind it); the trailer card says where it plays instead of "2:14 · free" (no length in the Hub's answer); MV10 from search says "Clear search" and "Try another word." (search has no filters); MV12's button is the shared ErrorState secondary "Try again"; the search bar is the shared SearchField (44 high, board 46); MV6's search pill is a plain pill that opens MV8; the star is the warning token (board #FFB020).
Not done: side-by-side screenshots of every artboard (NOT RUN); G-FLIX-1 and G-FLIX-3 in BACKEND_GAPS still read as "not drawn": the Hub now serves `mustAgreeTerms` and the trailer kind, so both are drawn here and the rows can close.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

