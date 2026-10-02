---
id: HOME-01
title: Today: home screen, loading, TGIF off
owner: DEV
area: HOME
order: 165
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-01, UI-02, UI-03, MONEY-11, MONEY-13, HOME-10, HOME-11, HOME-07, HOME-02, EXPLORE-02, ME-14, WALLET-02, WALLET-05, BILLS-01, HOME-09, EVENTS-01, LEGAL-02, SCHOOLS-03, ME-02, ME-04, KYC-05]
decisions: [R-2, R-6]
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
- `docs/designer/BRIEF.md`: its entries for H1, H36 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H1 · Today**: Home's Today tab: Today/Following/For you tabs, a Naira balance card (₦485,250.75) with Send, Add, Bills, Scan, the TGIF card for the day, a four-service row (Pay bills, Events, Legal, Schools; BRIEF H1), and a 'Creators to discover' rail with Follow. 'Approved E1 (b)'. Create button for creator accounts only. Entry map numbers 9 hotspots.
- **H11 · Today · loading**: From H1 while it loads: skeletons matching the real layout.
- **H36 · Today · TGIF off**: From Settings (Z2) 'TGIF on Home' off: Today without the TGIF card (Schools tile, BRIEF H36). The sponsored card that takes TGIF's place is added by ADS-01; with no live campaign nothing shows and there is no empty frame.

## Launch scope

Scan on the balance card is not built at launch: WALLET-20 adds it after launch (BRIEF "Not built at launch").

## Brief changes (build these, not the canvas)

- **H1**: the fourth tile is **Schools** (with a schools icon), and it opens SC1 Schools. (Why: R-2. Shop is retired; Schools takes its place.)
- **H36**: the fourth tile is **Schools**, opening SC1. (Why: R-2.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- H1: Scan on the balance card (opens W24): added by WALLET-20 after launch; not built at launch (BRIEF, "Not built at launch")
- H36: the sponsored card in TGIF's place (opens H33): added by ADS-01

## Capability checks

- [ ] **H1**: a user can switch to Following (H12) or For you (H2); tap search (X5); tap the bell (M31); tap Send (W7), Add (W15) and Bills (S2) on the balance card; open the TGIF card (H29); tap Pay bills (S2), Events (E1), Legal (S14) or Schools (SC1); Follow a creator in place or open a profile (M5); See all creators (X4); Create (+) (M19, creator accounts only).
- [ ] **H36**: a user with TGIF off sees Today without the TGIF card, with the Schools tile, and no empty frame where the sponsored card goes.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H11, H36.
- [ ] A user with no wallet sees the balance card lead to Open your wallet (A26).

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
