---
id: AUTH-10
title: After sign-up: creator setup, interests, people to follow
owner: DEV
area: AUTH
order: 106
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [AUTH-09]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A11, A12, A13]
---
# AUTH-10 · After sign-up: creator setup, interests, people to follow

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py A11 A12 A13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A11 · Creator setup**: 'Set up your account' checklist, 1 of 5: Price your paid messages; Finish your profile; Publish your first piece (Free to list); Start your first community (Optional, Free to host); Verify your identity (Needed to get paid). 'Uploading is open. Getting paid needs your ID checked.' Later -> Home.
- **A12 · Interests**: 'What are you into? 3 of 3. Pick three or more.' 12 chips: Music & Audio, Film & Video, Photography, Fashion & Beauty, Business & Finance, Technology, Food & Lifestyle, Faith & Spirituality, Art & Design, Writing & Publishing, Sports & Fitness, Gaming & Esports.
- **A13 · People to follow**: Suggested creators 'Based on what you picked' with Follow/Following toggles (name + role line). Go to Home.

## Capability checks

- [ ] **A11**: a user can open each row; tap Later (-> Home); Verify your identity (-> A21 per Start-here map).
- [ ] **A12**: a user can pick >=3 interests; tap Continue.
- [ ] **A13**: a user can follow / unfollow suggested creators; tap Go to Home.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **A11**: served.
- **A12**: served. Missing: Interests are free strings; no canonical vocabulary server-side, so the 12 canvas labels will not match the 25 explore category ids or web's 11 sign-up labels unless one list is adopted.
- **A13**: partial. Missing: Discovery filters by ONE category; a multi-interest 'based on what you picked' ranking needs either repeated calls merged client-side or an interests[] param.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A11: 'Free to list'
- A11: 'Free to host'
- A11: 'Getting paid needs your ID checked'
- A12: 'Pick three or more'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
