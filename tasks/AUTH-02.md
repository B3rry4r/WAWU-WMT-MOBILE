---
id: AUTH-02
title: Welcome and why you're here
owner: DEV
area: AUTH
order: 42
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

_Builder session, 2 Oct 2026, branch `wmt/AUTH-02`, built on `origin/wmt/AUTH-01`, then merged `origin/main` 2ccaab7 (it now contains AUTH-01, so the branch is main plus this task). Pure UI: no API call, no backend change, no live or local server used. Not committed or pushed._

- **Files:** new `src/features/auth/WelcomeScreen.tsx` (A1), `AccountTypeScreen.tsx` (A2), `accountType.ts` (the pick, kept for AUTH-04); routes `src/app/welcome.tsx`, `src/app/account-type.tsx`; edited `SignInScreen.tsx` ('New here? Create an account' on A22), `src/app/sign-in.tsx`, `AuthFrame.tsx` (footer optional), `src/features/shell/LeaveDevRoute.tsx` (signed out goes to `/welcome`), `src/app/preview/auth.tsx` (harness), fenced `src/app/_layout.tsx` (SHARED-CHANGES AUTH-02 #1, applied). Tests: new `src/__tests__/auth-welcome.test.tsx` (16), `auth-sign-in` and `auth-guard` updated (cold start signed out now expects the welcome screen; A22 tests open `/sign-in`).
- **A1:** a user can tap Create an account (reaches A2) and Sign in (reaches A22, which now has Back, returning to A1). Cold start signed out lands on A1; signed in never sees A1 or A2 (by cold start or link). Tested through the real route graph; no request is made.
- **A2:** a user can pick discover or earn, one at a time, and change the pick; it is kept on Back and return. Tested. Continue (to A3) is added by AUTH-04 (the task's own section): the screen takes `onContinue`; the app route passes none, so no dead button is drawn. With it passed, Continue is disabled until a pick and hands the pick on (tested).
- **A22 link:** 'New here? Create an account' reaches A2 and Back returns to A22 (tested). A22 opened with nothing behind it still has no Back.
- **Revert proof (sha1-restored):** welcome out of the guard group (11 tests fail), link removed from sign-in (1), welcome button to wrong route (3), pick handler removed (3), A22 Back removed (2), Continue ungated (1), LeaveDevRoute target (2).
- **Pictures (verifier):** `npm run web`, then `/preview/auth?screen=welcome` (A1); `screen=account-type&pick=earn&continue=1` (A2 as drawn), `pick=discover`, no `pick` (nothing picked); `screen=sign-in&email=lennox@wawu.africa&password=password11` (A22 with the link). 390 px, light and dark by the browser's colour scheme.
- **Counts:** before (merged AUTH-01 base) 19 suites, 340 tests, gates 90 files 0 findings, 201 tasks. After: 20 suites, 356 tests (+16), gates 96 files 0 findings, 201 tasks, `npm run check` exit 0.
- **Defaults (agent), owner may override:** (1) A2 opens with nothing picked (the canvas shows earn picked as the after-tap state); earn is never preselected because it provisions a wallet. (2) 'Free.' on the earn card and 'and bank it all in one app' on A1 are left out (the task's own list of figures that are not facts); A1's line reads 'Sell your work and answer paid questions.' (G-33). (3) A2's title says 'Who Made This' where the canvas says WAWU (R-37 copy), so it wraps to two lines; A1's logo is `<BrandMark layout="horizontal">` (R-37, A1 is on its list). (4) A1's cover photo is a stand-in silhouette in the canvas: the app draws the brand colour under the canvas's dark shade (G-34); the cover is dark in both themes, as drawn. (5) The A1 title wraps after 'you' where the canvas wraps before it: the canvas sets `text-wrap: pretty`, which React Native lacks; not forced. (6) `LeaveDevRoute` now sends a signed-out visitor to `/welcome`. (7) A22's Back shows whenever the router has a screen behind it.
- **Gaps:** G-33 (the two unbacked claims, and that the pick has no server field yet: AUTH-04 sends it with Hub `PATCH /users/me`), G-34 (cover photo from the owner). Shared change: SHARED-CHANGES AUTH-02 #1.
- **NOT RUN:** a real Android device or emulator (none here; unblocked by an Android build per docs/BUILDS.md): the status bar icons on A1 (set light in code) and the keyboard are checked on the web only. Live servers: none touched, none needed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
