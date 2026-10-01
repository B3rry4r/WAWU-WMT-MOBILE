---
id: HOME-01
title: Today: home screen, loading, TGIF off
owner: DEV
area: HOME
order: 40
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, UI-02]
decisions: []
passes: [V1, V4, V5, V6, V9]
artboards: [H1, H11, H36]
---
# HOME-01 · Today: home screen, loading, TGIF off

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H1 H11 H36` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H1 · Today**: Home's Today tab: Today/Following/For you tabs, a Naira balance card (₦485,250.75) with Send, Add, Bills, Scan, the TGIF card for the day, a four-service row (Pay bills, Events, Legal, Shop), and a 'Creators to discover' rail with Follow. 'Approved E1 (b)'. Create button for creator accounts only. Entry map numbers 9 hotspots.
- **H11 · Today · loading**: From H1 while it loads: skeletons matching the real layout.
- **H36 · Today · TGIF off**: From Settings (Z2) 'TGIF on Home' off: the sponsored card (Gospel Night Live · Tickets) takes TGIF's place on Today, 'so ads keep running'.

## Capability checks

- [ ] **H1**: a user can switch to Following (H12) or For you (H2); tap search icon (X5); tap bell (M31 notifications); Send/Add/Bills/Scan on balance card (Flow W; Bills -> S2); open TGIF card (H29); tap Pay bills (S2) / Events (E1) / Legal (S14) / Shop (Flow SH); Follow a creator in place or open a profile (M5); See all creators; Create button (creators only, Flow M M19).
- [ ] **H36**: a user can Tickets (event detail).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H11, H36.

## What the backend serves today (from the analysis)

- **H1**: partial. Missing: No wallet/balance for non-creator accounts (balance card is drawn for every user); no TGIF readers-today counter or any TGIF backend; no Scan (QR pay) route; creator suggestions exist.
- **H11**: n/a.
- **H36**: missing. Missing: No ad serving; TGIF preference is not stored server-side (only needed server-side if ad targeting/reporting must know it).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H1: Naira balance ₦485,250.75
- H1: TGIF '5 cards · 2 min · 12.4K reading today'
- H1: TGIF date FRIDAY 26 SEP, series 'Sons, not slaves'
- H36: from ₦5,000

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
