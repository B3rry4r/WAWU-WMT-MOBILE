---
id: HOME-13
title: Tip a creator
owner: DEV
area: HOME
order: 116
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, HOME-14, UI-02, HOME-02]
decisions: [R-6, R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [H26, H27, H28]
---
# HOME-13 · Tip a creator

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H26 H27 H28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H26, H27, H28 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H26 · Tip sheet**: Tip sheet: 'Goes straight to their wallet. They see your name and note.' Quick amounts ₦500/₦1,000/₦2,000/₦5,000, other amount, note, the breakdown (Tip, Fintava's charge, Total), Pay from wallet, 'Tip ₦2,023.25' (BRIEF H26).
- **H27 · PIN**: PIN sheet 'Approve ₦2,000 to Tife Adeola'.
- **H28 · Tip sent**: '₦2,000 sent to Tife', note echoed. a 'Total paid ₦2,023.25' row (BRIEF H28). 'The creator gets a notification and an Inbox money bubble' (the bubble is drawn by INBOX-19). Done returns to the feed.

## Brief changes (build these, not the canvas)

- **H26**: add the breakdown above Pay from wallet: Tip ₦2,000, Fintava's charge ₦23.25, Total ₦2,023.25; button "Tip ₦2,023.25". (Why: R-10 and the purchases default; rule 5.)
- **H27**: "Approve ₦2,023.25 to Tife Adeola". (Why: rule 5, following H26.)
- **H28**: keep the heading, and add a row "Total paid ₦2,023.25". (Why: rule 5.)

## Capability checks

- [ ] **H26**: a user can pick an amount or enter another; write a note; see ₦2,000 + ₦23.25 = ₦2,023.25 and tap "Tip ₦2,023.25".
- [ ] **H27**: a user can enter PIN.
- [ ] **H28**: a user sees "Total paid ₦2,023.25" and can tap Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From H2's ₦ Tip (HOME-02), a user can reach H26 (this task adds it, as drawn).
- [ ] A user with no wallet who taps Tip lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **H26**: partial. Missing: Tip + note exist via Flutterwave; no wallet-debit tip, no PIN; tip is not tied to a content piece (no contentId in CreateTipDto).
- **H27**: missing. Missing: No PIN.
- **H28**: partial. Missing: Notification exists; no Inbox money-bubble message type (DM model is paid questions).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H26: ₦500 / ₦1,000 / ₦2,000 / ₦5,000 presets
- H26: 'Goes straight to their wallet'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
