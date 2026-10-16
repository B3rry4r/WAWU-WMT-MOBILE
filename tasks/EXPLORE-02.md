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

As of 16 Oct 2026, round 1 (builder, Sonnet).
- **Status:** verifying. Built on batch 4 (mobile `wmt/MERGE-4` `74b1edb`, backend `wmt/EXPLORE-05` `649187a`). Not yet checked by a verifier. Nothing merged or live.
- **Branches:** mobile `wmt/EXPLORE-02` (the commit that carries this file); backend `wmt/EXPLORE-02` `2d0d5d9`. No migration (no schema change). Contract copied from the backend branch (`contract/SOURCE_COMMIT`, SHARED-CHANGES EXPLORE-02 #1).
- **Built (app):** `/search` (X5 landing and X11, X6 All, X7 Content, X8 Creators, X9 Communities, X10 nothing found with the closest content, X12 failed with Try again) and `/creators` (X4: the Categories list on All, titled Creators, with a search button). Both are signed-in routes. The entries this task adds (R-41): Explore's search pill and Featured creators' See all (X1), Home's search button and Creators' See all (H1), the feed's search button beside the tabs (H2 to H6, H12, H13).
- **What the app calls:** `GET /search?q&tab=all&include=communities` (one call serves all four tabs; counts are the lists' lengths, each capped at 20 by the Hub), `GET /search/suggestions?include=recent`, `GET /search/popular` (never `popularSearches`), `POST` and `DELETE /search/recent` (a search is remembered when the person submits it or taps a chip, never per key), `GET /search/closest`, `POST` and `DELETE /creators/{id}/follow`, `POST /communities/{id}/join`.
- **Backend (new, additive):** `GET /search/people?ids=` (1 to 50 account ids; answers name from WAWU ID or the handle, handle, picture, field, both ticks, whether the caller follows; leaves out accounts blocked either way, off member lists, or not creators). `GET /search` and `/search/suggestions` name creators by id and handle only and are the web's, so they are unchanged. Spec `src/search-response/tests/search-people.contract.spec.ts` (5 tests).
- **Decisions:** the creator list on X6 and X5 shows only people the Hub names; a content row shows "Creator · Type" or just the type when the Hub did not name the maker. A creator already followed shows Following (tap to unfollow) where X6 draws Profile (M5 is ME-02's). Ask on a private room sends the request (`POST /communities/{id}/join`, answer `pending`) and the row reads Requested; Join on an open room opens it (I25). A room the person already belongs to still reads Join or Ask (BACKEND_GAPS G-341, after launch). The placeholder reads "Search Who Made This" (R-37).
- **Not drawn (R-47, other tasks):** a content result opening its piece (H19, HOME-03); a creator opening their profile (M5, ME-02); Ask opening the private landing I30 (INBOX-14).
- **Tests:** `src/features/search/__tests__/{search,entries,keyboard}.test.tsx` (20). No test of another task was edited: the entries are optional props the route wires, so the older tests that assert the entries' absence still hold.
- **Checks:** mobile `npm run check` steps as one command, EXIT 0: typecheck 0, lint 0 errors, 175 suites / 3058 tests, gates 0 fail (631 files), tasks 289. Backend on `2d0d5d9` (GitHub): the 3 suite shards, netns, protected routes, baseline and contract passed; Executable gates failed on 5 FAIL lines in files this branch does not touch (`flutterwave-wallet.gateway.ts`, `notification-event.ts`, `content-piece.service.ts`, two admin notifications files).
- **NOT RUN:** pictures at 390 px, light and dark, beside the renders (V5): no creators, content or rooms were seeded in the stack and the step budget ended first. Unblocked by a seeded stack (`--with mobile`). V9 against a real Hub: the stack's Hub answered the backend spec only.
- **Open findings:** none known.
- **Next:** verifier (V1, V4, V5, V6, V9); then the lead merges the backend branch before this one.

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
