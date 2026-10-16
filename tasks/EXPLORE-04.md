---
id: EXPLORE-04
title: Search: creators, communities, no results, failed
owner: YOU
area: EXPLORE
order: 106
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [EXPLORE-05, UI-02, INBOX-05]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [X8, X9, X10, X11, X12]
---
# EXPLORE-04 · Search: creators, communities, no results, failed

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs EXPLORE-05, UI-02, INBOX-05 built first.
- **History:** none yet. Reports go to tasks/history/EXPLORE-04.md.

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

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- X9: 380 members
- X9: 1,204 members

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
