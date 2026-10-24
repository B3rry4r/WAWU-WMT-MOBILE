---
id: EXPLORE-02
title: All creators and search
owner: YOU
area: EXPLORE
order: 101
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [EXPLORE-03, EXPLORE-05, SETTINGS-04, UI-02, UI-03, INBOX-05]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X4, X5, X6, X7]
---
# EXPLORE-02 · All creators and search

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 13.
- **Status:** merging (lead). Verdict: merge (people search with the field, tick and follow state; follow, join and Ask once; the backend route GET /search/people checked on a real Hub and wawu-id); 4 lows, 2 of them this task's (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/P1-EX02.md`). Stacked in batch 13 by MERGE-13 (backend `wmt/MERGE-13`, mobile `wmt/MERGE-13`); not on main. Built: Not yet checked by a verifier. Nothing merged or live.
- **Branches:** mobile `wmt/EXPLORE-02-R2` (from `origin/wmt/P1` `9285017`, with `origin/wmt/EXPLORE-02` `86bbe0d9` merged); backend `wmt/EXPLORE-02` `0b0ed34` (round 1 `2d0d5d9` with `origin/wmt/MERGE-10` `3cf5a4b` merged). No migration. The contract is the backend's own, regenerated (`npm run contract:build`) and unchanged by the merge; P1 already carried it (SHARED-CHANGES EXPLORE-04 #1, EXPLORE-02 #1).
- **Built (app):** `/creators` (X4) and `/search` (X5 to X12) as in round 1, on P1's copies of `parts.tsx`, `model.ts`, `SearchScreen.tsx` and `search.test.tsx`. Entries: Explore's search pill and "Who Made This?" See all (X1), Home's search button and the creators rail's See all (DV2-01's rail now draws it), the feed's search button, and the search button on /creators. R-69: the Explore pill and its label read "Search Who Made This?" (SHARED-CHANGES EXPLORE-02 #3 lists the two strings changed in `screens.test.tsx`, an absence check).
- **Pictures (V5):** X1 and X4 to X12 at 390 px, light and dark, beside the renders, on a seeded stack (`explore02`, ports 7860-7867, Hub, real wawu-id, mobile export). The built screens match the boards in layout, copy, chips, rows and buttons in both themes; the data differs (names, counts, pictures). X12 was taken after the retries ended. Files: scratchpad `explore-02-b/pics/` (sheets in `pics/boards/`).
- **V9 (real Hub, real wawu-id sign-in screen, no injected token):** Follow on a search row turned to Following and the Hub holds the follow row; Join on an open room opened the room and the Hub holds `joined`; Ask on a private room read Requested and the Hub holds `pending`; the search was remembered; popular chips drew once 3 people had searched the same text; with the Hub unreachable the failed state drew and Try again brought the results back.
- **Checks:** backend: tsc 0, eslint 0 on the module, search specs 8 suites 241 tests passing (EXIT 0; they need the mock WAWU ID on its default service key), gates 0 fail, baseline ok. Mobile (final tree): tsc EXIT 0, eslint on the changed folders EXIT 0, jest on search, explore, home and feed 15 suites 249 passed (EXIT 0), gates 0 fail (EXIT 0), baseline ok.
- **Fixture notes:** the stack does not seed by itself: `npm run db:seed` plus extra rows were added by hand; the mock WAWU ID answers a flat shape the app cannot read, so pictures need `--with id`.
- **Open findings:** none known. DV2-01's task file still says See all is not drawn; it is now.
- **Next:** the batch 13 pull request (the lead). The verifier's lows are in SWEEP-APP (EX02 F2, F4).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py X4 X5 X6 X7` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for X4, X5, X6, X7, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **X4 · All creators**: From X1 Featured creators · See all: 'Creators' with chip row and full creator list (Follow/Following).
- **X5 · Search**: Search landing (from /search): Recent (Clear) with past queries, 'People are searching' chips, 'Creators to know' with Follow.
- **X6 · Results · All**: Results for 'pricing' with tabs All 11 / Content 6 / Creators 3 / Communities 2; sections Content (title, creator, type, price or Free), Creators (Follow / Profile), Communities (Pricing clinic · 380 members · private · Ask).
- **X7 · Content**: Content tab: list of content results with creator, type and price (₦3,000, ₦2,500, Free, ₦1,500, ₦1,000).

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- X6: a content result (opens H19): added by HOME-03
- X4: a creator (opens M5): added by ME-02

## Capability checks

- [ ] **X4**: a user can filter by chip; Follow in place.
- [ ] **X5**: a user can type a query (X6); tap a recent or popular query; Clear recent; Follow a creator; Cancel.
- [ ] **X6**: a user can switch tab; Follow; Ask to join a private community or Join an open one (I25).
- [ ] **X7**: a user sees content results with creator, type and price.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **X4**: served.
- **X5**: partial. Missing: recentSearches is always [] (no SearchHistory model, comment at :151-158); popularSearches is approximated from top content titles by views, not real queries; no clear-history route.
- **X6**: partial. Missing: Content and creators served; communities always [] (search-response.service.ts:77-87 'Returns [] unconditionally' although src/community now exists); creator rows carry no verification tick (web search.ts SEAM note); schools not searchable (Schools flow expects it).
- **X7**: served.
- **EXPLORE-05 (built, 16 Oct 2026):** X5 now has `POST` and `DELETE /search/recent`, `recentSearches` on `GET /search/suggestions` for the caller, and `GET /search/popular` (real searches, empty until 3 people search the same thing: G-340); X6 `communities` is filled by name on `tab=all` and `tab=communities`; ticks are in `verification` on `creators` and `suggestedCreators`. The app reads popular from `GET /search/popular`, never from `popularSearches`. **Round 2:** the screen's hooks must send `include=recent` on `GET /search/suggestions` and `include=communities` on `GET /search`; without them both answers are what the website gets (`recentSearches` and `communities` empty), because those two routes are protected. Today no hook calls them.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X5: popular queries: tax filing, VFX course, CAC registration, wedding photographer, Aba fashion
- X6: ₦3,000 / ₦2,500 / Free prices
- X6: Pricing clinic 380 members
- X7: ₦1,500 template
- X7: ₦1,000 audio

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EXPLORE-02.md](history/EXPLORE-02.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
