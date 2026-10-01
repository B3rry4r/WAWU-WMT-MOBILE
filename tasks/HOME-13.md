---
id: HOME-13
title: Tip a creator
owner: DEV3
area: HOME
day: 4
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [HOME-14, MONEY-02]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [H26, H27, H28]
---
# HOME-13 · Tip a creator

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py H26 H27 H28` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 4.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| H26 | Tip sheet | Tip sheet: 'Goes straight to their wallet. They see your name and note.' Quick amounts ₦500/₦1,000/₦2,000/₦5,000, other amount, note, Pay from wallet, Tip ₦2,000. |
| H27 | PIN | PIN sheet 'Approve ₦2,000 to Tife Adeola'. NOT in MANIFEST.json but a real artboard. |
| H28 | Tip sent | '₦2,000 sent to Tife', note echoed. 'The creator gets a notification and an Inbox money bubble.' Done returns to the feed. |

## Capability checks

- [ ] **H26**: a user can pick amount; enter other amount; write note; Tip.
- [ ] **H27**: a user can enter PIN.
- [ ] **H28**: a user can Done.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| H26 | partial | Tip + note exist via Flutterwave; no wallet-debit tip, no PIN; tip is not tied to a content piece (no contentId in CreateTipDto). |
| H27 | missing | No PIN. |
| H28 | partial | Notification exists; no Inbox money-bubble message type (DM model is paid questions). |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

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
