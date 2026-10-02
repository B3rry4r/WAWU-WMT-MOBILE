---
id: AUTH-02
title: Welcome and why you're here
owner: DEV
area: AUTH
order: 42
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, UI-02, AUTH-01]
decisions: [R-6, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A1, A2]
---
# AUTH-02 · Welcome and why you're here

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-6 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py A1 A2` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A1, A2, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A1 · Welcome**: Signed-out welcome: headline 'Get paid for what you know', subline 'Sell your work, answer paid questions, and bank it all in one app', buttons Create an account and Sign in. Also drawn as the auth 'Start here' map phone (hotspots 1 Create an account -> A2, 2 Sign in -> A22); Design note: the map phone equals the flow's own first screen, which the bundle rule normally forbids; here the app opens on A1.
- **A2 · Why you're here**: Account-type choice: 'I'm here to discover' (follow creators, buy their work, use the wallet) vs 'I want to earn' (sell content, take paid questions, host events. Free.). Continue.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A2: Continue (opens A3): added by AUTH-04

## Capability checks

- [ ] **A1**: a user can tap Create an account (-> A2); tap Sign in (-> A22).
- [ ] **A2**: a user can pick discover or earn.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From A22 (AUTH-01), a user can tap 'New here? Create an account' and reach A2 (this task adds the link, as A22 draws it).

## What the backend serves today (from the analysis)

- **A1**: n/a.
- **A2**: served. Missing: Account type is not part of WAWU ID registration; mobile must call WAWU ID register then Hub PATCH /users/me. Creator choice provisions a Flutterwave wallet (user-profile.service.ts:283); 'discover' accounts get no wallet today although the card says 'use the wallet'.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A1: 'bank it all in one app' (implies a bank account per user)
- A2: 'I want to earn ... Free.' (earning account costs nothing)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
