---
id: EXPLORE-01
title: Explore: browse, categories, loading, empty
owner: DEV
area: EXPLORE
order: 108
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EXPLORE-03, UI-02, UI-03, EXPLORE-02, EVENTS-01, PROS-01, SCHOOLS-03, PROS-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X1, X15, X2, X3, X13, X14]
---
# EXPLORE-01 · Explore: browse, categories, loading, empty

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py X1 X15 X2 X3 X13 X14` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for X1, X15, X2, X3, X13, X14, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **X1 · Explore**: Explore ('Approved E4'): search bar, FEATURED EVENT hero (WAWU Creators Summit, Lagos, 12 Oct · Eko Convention Centre), category chips (All + 6 + More), Featured creators rail (@handle, field, Follow), Upcoming events list, then doors: Find a professional, Find a school, List your services.
- **X15 · Explore · scrolled down**: Explore scrolled: Upcoming events, then the doors: Find a professional (Accountants, lawyers, designers), Find a school (Courses from schools and academies), List your services (Get paid to answer questions).
- **X2 · Categories**: Categories screen: chip row (All, Music & Audio, Film & Video, Art & Design, Photography, Fashion & Beauty) above a creator list with Follow/Following.
- **X3 · One category**: Photography selected: chips stay in place; creators @amaka Photographer, @chidi Wedding films, @sade Portraits, @tunde Drone, each with Follow.
- **X13 · Empty category**: From X3 when a category is empty: chips All, Gaming & Esports, Faith & Spirituality; 'Nobody is publishing in Gaming & Esports yet'.
- **X14 · Explore · loading**: From X1 while loading: skeleton with search bar and tab bar.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- X1: the bell (opens M31): added by ME-14
- X1: a creator (opens M5): added by ME-02

## Capability checks

- [ ] **X1**: a user can search (X5); open the featured event or an event row (E2); tap a category (X3); See all creators (X4); Follow; Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X15**: a user can open an event (E2); Find a professional (P1); Find a school (SC1); List your services (P5).
- [ ] **X2**: a user can tap a chip (X3); Follow.
- [ ] **X3**: a user can switch chip; Follow.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states X13, X14.

## What the backend serves today (from the analysis)

- **X1**: partial. Missing: Featured event and event list served. Creators served but 'featured' creators has no featured/paid-featured flag (web FeaturedThisWeek.tsx: 'nothing on the contract marks a creator … as PAID-featured'); creator category filter matches UserProfile.interests strings, not the creator taxonomy categories drawn; no schools backend for the Find a school door.
- **X15**: partial. Missing: Events and professionals served; Schools door target has no backend at all (Schools flow is new).
- **X2**: partial. Missing: Filter is on free-text interests, not the creator taxonomy category ids the chips show; no specialization-based creator filter.
- **X3**: partial. Missing: Same as X2: category semantics differ from the drawn taxonomy.
- **X13**: partial. Missing: Works as an empty list; categories themselves differ (see X2).
- **X14**: n/a.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X1: WAWU Creators Summit, Lagos, 12 Oct, Eko Convention Centre
- X1: Gospel Night Live, Abuja, OCT 18
- X1: Monetise Your Content, Online, NOV 02

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
