---
id: EXPLORE-04
title: Search: creators, communities, no results, failed
owner: YOU
area: EXPLORE
order: 106
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [EXPLORE-05, UI-02, INBOX-05]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X8, X9, X10, X11, X12]
---
# EXPLORE-04 · Search: creators, communities, no results, failed

## Current state

As of 17 Oct 2026, merging (lead): checked by an independent verifier and stacked in batch 13.
- **Status:** merging (lead). Verdict: merge (Creators, Communities, nothing found, no recent searches and failed states; the search filters and follow/join/Ask once); no low is this task's (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/P1-EX02.md`). Stacked in batch 13 by MERGE-13 (backend `wmt/MERGE-13`, mobile `wmt/MERGE-13`); not on main. Built: Mobile `wmt/P1`, after ME-08. Nothing merged or live.
- **Where the screens come from:** X8 to X12 are states of the Search screen that `wmt/EXPLORE-02` (`86bbe0d9`, verifying, not in batch 10) already built with X5 to X7. A second build would collide on every file, so this branch carries that commit's own diff of `src/features/search/**`, `src/app/search.tsx`, the contract and types for `GET /search/people`, and `follow.ts` (SHARED-CHANGES EXPLORE-04 #1). It does not carry EXPLORE-02's entries on Explore, Home and the feed (10 conflicts with batch 10): search opens from nowhere until EXPLORE-02 merges.
- **Fixed on top:** `@/components/shadow` is gone (the locked veil takes `colors.mediaBlack25`); `nairaToKobo` comes from `@/api/kobo`; the placeholder reads "Search Who Made This?" (R-69, X11) and the one assertion naming the old words names the new; `entries.test.tsx` is not carried, as the entries are not.
- **Drawn:** X8 Creators (Follow; Following where the board draws Profile, M5 is ME-02's), X9 Communities (Ask on a private room sends the request, Join opens an open one), X10 nothing found with the closest things, X11 no recent searches with popular and creators, X12 failed with Try again (network cause). The hooks send `include=communities` and `include=recent`.
- **Checks:** tsc EXIT 0; eslint EXIT 0; jest create + search + explore 9 suites / 183 tests; gates 0 fail, 896 files.
- **Pictures** (390 px, light and dark, board beside built): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/p1-b/pics/pair-x8-*.png` to `pair-x12-*`. Hub answered by browser-side fixtures.
- **NOT RUN:** V9 against a real Hub (batch 10's has no `/search/people`, G-EXPLORE-04-1).
- **Open findings:** none known.
- **Next:** the batch 13 pull request (the lead). No low is left open.

Status set to review by the records sync, 25 Oct 2026: merged as app ad4791c0, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py X8 X9 X10 X11 X12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for X8, X9, X10, X11, X12, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **X8 · Creators**: Creators tab: Adaeze Okonkwo, Funmi Adeyemi (Profile), Kemi Okafor with Follow.
- **X9 · Communities**: Communities tab: Pricing clinic (380 members · private · Ask), Lagos Freelancers (1,204 members · open · Join).
- **X10 · No results**: From X6 when nothing matches: counts all 0, 'Try a shorter search', 'Closest things we have' list.
- **X11 · No recent searches**: From X5 with no history: 'No recent searches yet.' plus popular and creators.
- **X12 · Search failed**: From X6 on error: 'Search isn't working right now … Try again'.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- X8: a creator (opens M5): added by ME-02

## Capability checks

- [ ] **X8**: a user can Follow.
- [ ] **X9**: a user can Ask (request to join private); Join (open); open community (I25).
- [ ] **X10**: a user can tap a closest result.
- [ ] **X12**: a user can Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states X10, X11, X12.

## What the backend serves today (from the analysis)

- **X8**: partial. Missing: No verification tick on creator rows.
- **X9**: partial. Missing: Community search predicate not implemented (always empty) even though community list/join routes exist.
- **X10**: served.
- **X11**: partial. Missing: Always this state today because history is not persisted.
- **X12**: n/a.
- **EXPLORE-05 (built, 16 Oct 2026):** X9 `communities` is filled by name on `GET /search` (`tab=communities`; rows have no viewer state, G-341); X11 recent searches are saved and cleared by `POST` and `DELETE /search/recent`, popular is `GET /search/popular` (G-340); creator rows carry `verification` (X8). **Round 2:** the hooks must send `include=communities` on `GET /search` (X9) and `include=recent` on `GET /search/suggestions` (X11); without them the answers are empty (protected routes). Today no hook calls them.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X9: 380 members
- X9: 1,204 members

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EXPLORE-04.md](history/EXPLORE-04.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
