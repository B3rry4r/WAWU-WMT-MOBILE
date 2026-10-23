---
id: FLIX-04
title: Flix movies show "not live yet" until business talks finish
owner: YOU
area: APP
order: -114
priority: launch
repo: all
type: ops
status: verifying
depends_on: []
decisions: [R-74, R-75, R-77, R-27, R-47]
passes: [V1, V3, V6]
artboards: []
---
# FLIX-04 · Flix movies show "not live yet" until business talks finish

## Current state

As of 23 Oct 2026, verifying. Built by a Sonnet builder (T1). No PR. Builds on FLIX-01 and FLIX-03 (both in `review`; no `depends_on` because their orders are later than the free order numbers).
- **Branches:** backend `wmt/FLIX-04` `1209f3c` on `origin/main` `dd00e85`; mobile `wmt/FLIX-04` (this file, DECISIONS R-77, the contract copy `1209f3c`, the app change) on `origin/main` `89669d9f`.
- **Backend:** a new `MOVIE_PARTNER=soon` (`src/movie-partner/soon-movie-partner.ts`, wired in the seam module only). No adapter is built, no sync runs, no call is made. `GET /movies` answers `{ enabled: false, soon: true, hero: null, rails: [] }`; every other movies route answers 404 `movies_off`, as `off` does. `soon` is a new optional contract field (`soon?: boolean | null`), absent for `off`, `standin` and `flixora`. `.env.example` and `deploy/README.md` list `soon`. `off` is unchanged.
- **App:** when the Hub answers `enabled: false` with `soon: true`, the rail on Home and Explore stays (its title and one card with the two lines, which opens Flix movies; no See all, no posters) and the movies screen shows S13's shared info `Banner` with "Flix movies aren't switched on yet" and "You'll be able to watch movies here soon.", with no hero, genres, rails, search button, watch button or genre call (the tab bar stays). Every other Flix route (all, search, a movie, a trailer) treats soon as off and sends the person out (`MoviesGate allowSoon`, only on `/movies`). `enabled: false` without `soon` still hides everything.
- **Tests that fail on origin/main:** backend `movie-partner-soon.spec.ts` and `movies-soon.contract.spec.ts` (origin/main has no `soon-movie-partner`: both suites fail to load); mobile `soon.test.tsx`, plus the new soon cases in `HomeScreen.test.tsx` and `explore/screens.test.tsx` (origin/main draws no rail for soon).
- **Checks (EXIT lines in the hand-back):** backend `tsc` 0, eslint on 8 changed files 0, the movie specs in band (4 suites, 46 tests) 0, `test:protected` 253/253, `contract:build` 0 (+4 lines), gates 0 fail, baseline 0; mobile eslint on 8 changed files 0, movies, Home and Explore tests (6 suites, 150 tests, run with --forceExit) 0, `npm run gates` 0 (0 fail), `check_tasks --write` 0. Mobile `tsc` reports one error outside the change: `src/features/referral/cardPicture.ts` cannot find `react-native-view-shot` (declared in `package.json`, missing from the shared `node_modules`); none in a changed file.
- **Not done:** V5 pictures (the built "not live yet" screen beside S13) were not rendered; the screen is the shared Banner, as S13 draws it, and the board (S13, Bills) also draws faded tiles that Flix movies does not have. NOT RUN: the app against a running Hub with `MOVIE_PARTNER=soon` (the Hub is covered by `movies-soon.contract.spec.ts`). A cold open of Flix movies, before Home or Explore has read the answer, asks `GET /movies/filters` once in parallel; the Hub answers 404 `movies_off` and the screen ignores it.
- **Next:** the verifier; then the lead merges both branches together and sets `MOVIE_PARTNER=soon` on the Hub when the owner wants it shown.

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

## Owner sign-off
