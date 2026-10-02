---
id: AUTH-01
title: Sign in and password reset
owner: DEV
area: AUTH
order: 38
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, SHELL-02, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [A22, A23, A24, A25]
---
# AUTH-01 · Sign in and password reset

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py A22 A23 A24 A25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A2.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for A22, A23, A24, A25, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **A22 · Sign in**: 'Welcome back. Sign in with your email.' Email, Password, Forgot password?, Sign in, 'New here? Create an account'.
- **A23 · Forgot password**: 'Forgot your password? We'll email you a link to set a new one.' Email. Send reset link.
- **A24 · Check your email**: 'Check your email. We sent a link to lennox@wawu.africa. It expires in 30 minutes.' Back to sign in. The emailed link opens WAWU ID's existing web reset page (`FRONTEND_URL`); there is no in-app New password screen. The expiry shown is WAWU ID's real one (1 hour), not the canvas's 30 minutes.
- **A25 · Wrong password**: A22 with banner 'That email and password don't match. Check them, or reset your password.'

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- A22: 'New here? Create an account' (opens A2): added by AUTH-02

## Capability checks

- [ ] **A22**: a user can enter email + password; sign in; tap Forgot password? (-> A23).
- [ ] **A23**: a user can enter email; send reset link.
- [ ] **A24**: a user can go back to sign in; the emailed link opens WAWU ID's reset page, and the new password works on A22.
- [ ] **A25**: a user can retry; reset password.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states A24, A25.

## What the backend serves today (from the analysis)

- **A22**: served. Missing: Note: login refuses EMAIL_NOT_VERIFIED accounts (auth.service.ts:206) - see A4.
- **A23**: served. Missing: Default method is 'sms' (WhatsApp code) for mobile; mobile must pass method:'email' to get the link this board draws.
- **A24**: partial. Missing: TTL is 1 hour, board says 30 minutes. Reset link points at the WEB /reset-password (FRONTEND_URL); no mobile deep link/universal link. 'New password' screen is not drawn.
- **A25**: served. Missing: Board collapses unknown-email and wrong-password into one message; fine, client maps both. No lockout/rate limit visible in WAWU ID login.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- A24: 'It expires in 30 minutes.' (WAWU ID: 1 hour)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
