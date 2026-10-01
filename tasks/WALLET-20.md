---
id: WALLET-20
title: Scan to pay and my QR code
owner: DEV1
area: WALLET
day: later
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [WALLET-28]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9, V10]
artboards: [W24, W25]
---
# WALLET-20 · Scan to pay and my QR code

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- The design: `python3 scripts/design/render_design.py W24 W25` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled after launch.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| W24 | Scan to pay | Camera scanner for WAWU or bank QR codes; auto-scan; Scan / My code toggle. A WAWU QR opens W9 prefilled. |
| W25 | My QR code | Personal pay code: name, @handle, NUBAN, QR, 'Scan to pay Lennox from any WAWU or bank app', Share / Save image. |

## Capability checks

- [ ] **W24**: a user can point camera; tap My code.
- [ ] **W25**: a user can Share; Save image.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| W24 | missing | No QR resolve or NQR payment. |
| W25 | missing | No pay-code payload or NQR generation. |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W24: 'Point at a WAWU or bank QR code'
- W25: 'Scan to pay Lennox from any WAWU or bank app' (NQR interoperability claim)

## Designer notes (⚠, unresolved)

- W24: “⚠ NQR support depends on Fintava.”

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
