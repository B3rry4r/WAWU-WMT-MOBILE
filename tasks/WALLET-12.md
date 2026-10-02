---
id: WALLET-12
title: Share a receipt as image or PDF
owner: YOU
area: WALLET
order: 180
priority: after-launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-04, WALLET-18]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [W41, W42, W43]
---
# WALLET-12 · Share a receipt as image or PDF

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py W41 W42 W43` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W41, W42, W43 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W41 · Share as**: Receipt preview (type, from, to with NUBAN, bank, reference, verification link) with a sheet to pick Image or PDF.
- **W42 · Image**: PNG receipt, always a white document in both themes, share via WhatsApp, Email, WAWU chat, Save image.
- **W43 · PDF**: One-page A4 receipt PDF ready to share (WhatsApp, Email, WAWU chat, Save to Files).

## Brief changes (build these, not the canvas)

- **W41**: Bank shows the bank name slot (sample "Loma Bank"). The footer's licence wording is a slot filled from config by the owner (rule 7). (Why: R-1.)
- **W42**: as W41. (Why: R-1.)
- **W43**: as W41. (Why: R-1.)

## Capability checks

- [ ] **W41**: a user can pick Image; pick PDF.
- [ ] **W42**: a user can share; Save image.
- [ ] **W43**: a user can share via WhatsApp/Email/WAWU chat; Save to Files.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W43.

## What the backend serves today (from the analysis)

- **W41**: missing. Missing: No receipt verification route or short code.
- **W42**: missing. Missing: No image render; sharing into a WAWU DM would need a message-with-attachment path.
- **W43**: missing. Missing: No receipt rendering.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W41: 'Check it at wawu/r/T1P9'
- W41: 'Fintava MFB, licensed by the CBN'
- W41: Bank Fintava MFB
- W42: 'Fintava MFB, licensed by the CBN'
- W43: 'One page, A4.'
- W43: 'Fintava MFB, licensed by the CBN'
- W43: 'Check it at wawu/r/T1P9'

## Launch and licence wording

At launch, Share receipt uses the phone's share sheet with the receipt's text and reference (R-33); this task
adds the W41 image and PDF choice to the same button.

The canvas prints 'Fintava MFB, licensed by the CBN'. The bank is Loma Bank (R-1): the line comes from config, filled in by the owner, never from the canvas.

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
