---
id: FLIX-04
title: Flix movies show "not live yet" until business talks finish
owner: YOU
area: APP
order: -114
priority: launch
repo: all
type: ops
status: review
depends_on: []
decisions: [R-74, R-75, R-77, R-27, R-47]
passes: [V1, V3, V6]
artboards: []
---
# FLIX-04 · Flix movies show "not live yet" until business talks finish

## Current state

As of 23 Oct 2026, review: verifier PASS (no open defect; three lows below). Built by a Sonnet builder (T1), verified by a separate Sonnet verifier. No PR. Builds on FLIX-01 and FLIX-03 (both in `review`; no `depends_on` because their orders are later than the free order numbers).
- **Branches:** backend `wmt/FLIX-04` `1209f3c` on `origin/main` `dd00e85`; mobile `wmt/FLIX-04` (this file, DECISIONS R-77, the contract copy `1209f3c`, the app change) on `origin/main` `89669d9f`.
- **Backend:** a new `MOVIE_PARTNER=soon` (`src/movie-partner/soon-movie-partner.ts`, wired in the seam module only). No adapter is built, no sync runs, no call is made. `GET /movies` answers `{ enabled: false, soon: true, hero: null, rails: [] }`; every other movies route answers 404 `movies_off`, as `off` does. `soon` is a new optional contract field (`soon?: boolean | null`), absent for `off`, `standin` and `flixora`. `.env.example` and `deploy/README.md` list `soon`. `off` is unchanged.
- **App:** when the Hub answers `enabled: false` with `soon: true`, the rail on Home and Explore stays (its title and one card with the two lines, which opens Flix movies; no See all, no posters) and the movies screen shows S13's shared info `Banner` with "Flix movies aren't switched on yet" and "You'll be able to watch movies here soon.", with no hero, genres, rails, search button, watch button or genre call (the tab bar stays). Every other Flix route (all, search, a movie, a trailer) treats soon as off and sends the person out (`MoviesGate allowSoon`, only on `/movies`). `enabled: false` without `soon` still hides everything.
- **Tests that fail on origin/main:** backend `movie-partner-soon.spec.ts` and `movies-soon.contract.spec.ts` (origin/main has no `soon-movie-partner`: both suites fail to load); mobile `soon.test.tsx`, plus the new soon cases in `HomeScreen.test.tsx` and `explore/screens.test.tsx` (origin/main draws no rail for soon).
- **Checks (EXIT lines in the hand-back):** backend `tsc` 0, eslint on 8 changed files 0, the movie specs in band (4 suites, 46 tests) 0, `test:protected` 253/253, `contract:build` 0 (+4 lines), gates 0 fail, baseline 0; mobile eslint on 8 changed files 0, movies, Home and Explore tests (6 suites, 150 tests, run with --forceExit) 0, `npm run gates` 0 (0 fail), `check_tasks --write` 0. Mobile `tsc` reports one error outside the change: `src/features/referral/cardPicture.ts` cannot find `react-native-view-shot` (declared in `package.json`, missing from the shared `node_modules`); none in a changed file.
- **Not done:** V5 pictures (the built "not live yet" screen beside S13) were not rendered; the screen is the shared Banner, as S13 draws it, and the board (S13, Bills) also draws faded tiles that Flix movies does not have. NOT RUN: the app against a running Hub with `MOVIE_PARTNER=soon` (the Hub is covered by `movies-soon.contract.spec.ts`). A cold open of Flix movies, before Home or Explore has read the answer, asks `GET /movies/filters` once in parallel; the Hub answers 404 `movies_off` and the screen ignores it.
- **Next:** the lead merges both branches together (the mobile branch conflicts with `origin/main` `04ef0e5f`: see the Verifier report, finding L3) and sets `MOVIE_PARTNER=soon` on the Hub when the owner wants it shown.

## Read first

- `DECISIONS.md` R-74, R-75, R-77, R-27, R-47
- `docs/WORKFLOW.md`, section 4; `docs/roles/BUILDER.md`
- `tasks/FLIX-01.md` (the seam) and `tasks/FLIX-03.md` (the screens)
- The design: `python3 scripts/design/render_design.py S13` (the "not live yet" state: Bills' S13, one shared info `Banner`)

## Goal

Flix movies stay visible and do nothing until business talks finish: the person sees "Flix movies aren't switched on yet" and "You'll be able to watch movies here soon." where the catalog would be, and the Hub makes no Flixora call, opens no account and gives no link.

## Scope

Backend `src/movie-partner/` (the `soon` value and adapter), `src/movies/` (`GET /movies` only), `.env.example`, `deploy/README.md`, `contract/openapi.json`. App `src/features/movies/` (the rail, the screen, the gate), `src/app/movies/index.tsx`, the contract copy and generated types. Not touched: the Flixora adapter, the sync, the tables, any other route, any protected route.

## Capability checks

- [x] With `MOVIE_PARTNER=soon`, `GET /movies` answers `{ enabled: false, soon: true, hero: null, rails: [] }`, every other movies route answers 404 `movies_off`, and no adapter method, sync pass, link or consent is made (`movies-soon.contract.spec.ts`, `movie-partner-soon.spec.ts`).
- [x] `off` keeps hiding everything and carries no `soon`; `standin` carries none either (`movies-soon.contract.spec.ts`).
- [x] A person sees the rail on Home and on Explore as its title and one card with the two lines, and the card opens Flix movies (`HomeScreen.test.tsx`, `screens.test.tsx`, `soon.test.tsx`).
- [x] A person sees the two lines on Flix movies, with no hero, genres, rails, search or watch button (`soon.test.tsx`).
- [x] Every other Flix screen sends the person out on soon; `enabled: false` without `soon` hides the rails and sends everyone out, Flix movies included (`soon.test.tsx`).
- [x] Protected routes unchanged (`npm run test:protected`, 253/253).

## Builder report

See Current state.

## Verifier report

**Verdict: PASS** (23 Oct 2026, Sonnet verifier, T1; checked backend `1209f3c` on `origin/main` `dd00e85` and mobile `238ab429` on `origin/main` `89669d9f`; the app was also read against `04ef0e5f`). Nothing medium or worse. Pictures: `scratchpad/flix-04-v/compare-dark.png` and `compare-light.png` (left to right: S13 as drawn, the built Home rail, the built Explore rail, the built movies screen), plus `shots/` beside them.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 capability checks | passed | Hub on this branch, `MOVIE_PARTNER=soon`, local stack: `GET /movies` 200 `{"enabled":false,"soon":true,"hero":null,"rails":[]}`; `/movies/browse`, `/filters`, `/search?q=a`, `/standin-001` and `POST /standin-001/watch` all 404 `movies_off`; no token 401. A stand-in on 7940 set as every `FLIXORA_*` setting got 0 hits over about 15 minutes (a `*/5` sync tick included); the stack's `block-net` log has 0 refusals; `MoviePartnerMovie`, `Sync`, `Link`, `Consent` tables all 0 rows. `off` on the same stack: `{"enabled":false,"hero":null,"rails":[]}` with no `soon`, browse 404. `movies-soon.contract.spec.ts` also spies every adapter method (never called) and shows `standin` with soon falsy. Contract copy equals the backend's `contract/openapi.json` byte for byte; `soon` is optional and nullable. |
| V3 protected routes | passed | `test:protected` 2 suites, 253/253, EXIT 0 (db seeded first); `contract:build` EXIT 0, no diff. |
| V5 picture | passed | Web export 390 x 844, light and dark, beside S13: Home's rail (title plus one card: Clock, the two lines, no See all, no posters), Explore's rail (same), the movies screen (back button, title, the shared info Banner with the two lines, tab bar; no hero, genres, rails, search button, watch button or error). Same Banner, spacing and tones as S13. `off`: no rail on Home or Explore, `/movies` and `/movies/all`, `/search`, `/standin-001` send the person to Home. |
| V6 states | passed | Tapping the card on Home and on Explore opens the movies screen with no further call. `enabled: false` without `soon` hides everything (live and in `soon.test.tsx`). The 404 on `/movies/filters` at a cold open changes nothing a person sees (see L2). |

**Checks (all with EXIT lines in `scratchpad/flix-04-v/*.log`):** backend `tsc` 0; eslint on the 8 changed files 0 (no `--fix`); movie specs in band (`movie-partner-seam`, `movie-partner-soon`, `movies.contract`, `movies-soon.contract`) 4 suites, 46 tests, 0; `test:protected` 253/253, 0; `contract:build` 0, no diff; gates 0 fail (133 warn, 88 accepted, 1741 files), baseline 0. Mobile `tsc` 0 (modules from this branch's lockfile, `npm ci`); eslint on the 9 changed files 0 (the generated schema is ignored by config); movies, Home and Explore tests 13 suites, 209 tests, 0; `npm run gates` 0 (0 fail, 18 warn, 1213 files, 56 unit tests); `check_tasks` 0. New tests on `origin/main`: both backend specs fail to load (no `soon-movie-partner`); app `soon.test.tsx` fails to load (no `FlixSoon`) and the new soon cases in `HomeScreen.test.tsx` and `explore/screens.test.tsx` fail (the five other Explore failures in that run came from laying this branch's older Explore test over main's FIX-100 code, not from FLIX-04). Exact words verified on screen: "Flix movies aren't switched on yet" and "You'll be able to watch movies here soon."; no em-dash in anything added; `Banner`, `useFocusRing`, `SectionHeading` and `radius.tile` are the shared pieces, no hex or pixel literal. Surviving-mutant pass NOT RUN (step budget).

**Findings**
- High: none. Medium: none.
- L1 (low, defect, `src/features/movies/MoviesScreen.tsx:124-125` and the `right` Search button, same file): on a cold open of `/movies` (deep link or restart), until the Hub answers `GET /movies` the screen draws MV11's catalog skeleton (hero, chips, three poster tiles) and the Search button, then swaps to the note. Repro: hold the `/api/hub/movies` response on a cold load of `/movies`. A person who taps the rail card never sees it (the answer is held). Fix: while pending and no answer is held, draw nothing but the title, or keep MV11 only when movies are known to be on.
- L2 (low, `src/features/movies/MoviesScreen.tsx:119`): a cold open of `/movies` makes one `GET /movies/filters`, answered 404 `movies_off` (one browser console error). Nothing visible changes: the screen text is only the title, the two lines and the tab bar. The same call exists today with `off`. Fix: enable the filters read only once `home.data?.enabled` is true.
- L3 (low, merge): the mobile branch does not merge cleanly with `origin/main` `04ef0e5f`: `src/features/movies/MoviesScreen.tsx` (one import line: main's `genreChoices` from `./model` beside this branch's `FlixSoon` import; keep both), and the generated `docs/PROGRESS.md` and `tasks/INDEX.md` (regenerate with `check_tasks --write`). `LOG.md` and `explore/__tests__/screens.test.tsx` auto-merge. The resolved merge was not re-tested here.
- Note: the builder's "NOT RUN" items (V5 pictures, the app against a running Hub with `soon`) are now done above.

## Owner sign-off
