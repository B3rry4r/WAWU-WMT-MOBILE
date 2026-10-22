---
id: FLIX-03
title: Flix movies: MV1 to MV12 and the Home and Explore rails
owner: YOU
area: MOVIES
order: 216
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [FLIX-01]
decisions: [R-74, R-75, R-67, R-69, R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: [MV1, MV2, MV3, MV4, MV5, MV6, MV7, MV8, MV9, MV10, MV11, MV12]
---
# FLIX-03 · Flix movies: MV1 to MV12 and the Home and Explore rails

## Current state

As of 22 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below after FLIX-01 is done (or in review). FLIX-02 (the real Flixora adapter) is not needed to build: the screens read only the Hub.
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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
