---
id: EXPLORE-02
title: All creators and search
owner: YOU
area: EXPLORE
order: 101
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EXPLORE-03, EXPLORE-05, SETTINGS-04, UI-02, UI-03, INBOX-05]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X4, X5, X6, X7]
---
# EXPLORE-02 · All creators and search

Taken over by the lead's agents on 7 Oct 2026 (Developer 1 at their usage limit; owner's instruction).


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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
