---
id: AUTH-06
title: After sign-up: creator setup, interests, people to follow
owner: DEV
area: AUTH
order: 173
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [AUTH-04, AUTH-05, UI-02, INBOX-12, ME-06, ME-04, KYC-05, PROS-03]
decisions: [R-6, R-11]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A11, A12, A13]
---
# AUTH-06 · After sign-up: creator setup, interests, people to follow

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py A11 A12 A13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md`: its entries for A11 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A11 · Creator setup**: 'Set up your account' checklist, 1 of 5: Price your paid messages; Finish your profile; Publish your first piece (Free to list); Start your first community (Optional, Free to host); Verify your identity (Needed to get paid). 'Uploading is open. Getting paid needs your ID checked.' (built as 'Your earnings wait until you open your wallet', R-11; recorded in BRIEF) Later -> Home.
- **A12 · Interests**: 'What are you into? 3 of 3. Pick three or more.' 12 chips: Music & Audio, Film & Video, Photography, Fashion & Beauty, Business & Finance, Technology, Food & Lifestyle, Faith & Spirituality, Art & Design, Writing & Publishing, Sports & Fitness, Gaming & Esports.
- **A13 · People to follow**: Suggested creators 'Based on what you picked' with Follow/Following toggles (name + role line). Go to Home.

## Brief changes (build these, not the canvas)

- **A11**: "Uploading is open. Your earnings wait until you open your wallet." Verify your identity opens Open your wallet (A26). (Why: R-11 and R-6: earning isn't gated; the money lands when the wallet opens.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A11: Start your first community (opens I32): added by INBOX-14

## Capability checks

- [ ] **A11**: a user can open Price your paid messages (I21), Finish your profile (M8), Publish your first piece (M19) and Verify your identity (Open your wallet, A26); tap Later (-> Home).
- [ ] **A12**: a user can pick >=3 interests; tap Continue.
- [ ] **A13**: a user can follow / unfollow suggested creators; tap Go to Home.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] After the phone code is accepted on A4 (AUTH-04), an earning account lands on A11 and a discovering one on A12 (this task adds the step).
- [ ] From P10 (PROS-03), a user can tap Become a creator and reach A11 (this task adds it, as P10 draws it).

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
