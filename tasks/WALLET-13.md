---
id: WALLET-13
title: Earnings breakdown
owner: YOU
area: WALLET
order: 155
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-16, UI-02, KYC-05]
decisions: [R-11, R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W39]
---
# WALLET-13 · Earnings breakdown

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-11 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W39` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/designer/BRIEF.md`: its entries for W39 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W39 · Earnings**: Creator-only earnings screen: what was earned (all time and this month), stream split (Unlocks, Tips, Paid DMs) and per-content earnings this month. No 'Ready to move' and no Move to wallet button (R-11, BRIEF W39).

## Ruling R-11

Earnings go into the wallet automatically. W39 is built without its 'Move to wallet' button, and W40 is not built.

## Brief changes (build these, not the canvas)

- **W39**: no button and no "Ready to move". Earnings land in the wallet by themselves. Lead with what was earned (for example "₦312,800 earned all time", or this month) and keep the breakdown by stream and by content. For a creator who hasn't opened a wallet yet, a short note: the money is waiting and lands the moment they open one, with a link to Open your wallet. (Why: R-11.)

## Capability checks

- [ ] **W39**: a user sees what they earned (all time and this month), split by Unlocks, Tips and Paid DMs, and per piece; a creator without a wallet sees that the money is waiting and can tap Open your wallet (A26).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **W39**: partial. Missing: Earnings exist but are swept automatically into the wallet, so there is no 'ready to move' balance concept and no per-content aggregation (unlocks/tips/sales per piece). The response also carries community_credits and 'held' DM money that the canvas does not show.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W39: Ready to move ₦84,500.00
- W39: ₦312,800 earned all time
- W39: Unlocks ₦61,500
- W39: Tips ₦14,000
- W39: Paid DMs ₦9,000
- W39: How I light a night shoot +₦42,000
- W40: 'It's instant and free.'

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
