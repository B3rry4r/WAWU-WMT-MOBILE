---
id: MONEY-03
title: The pay-from-wallet sheet
owner: YOU
area: MONEY
order: 12
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: []
decisions: []
passes: [V1, V5, V6]
artboards: [H14, W10]
---
# MONEY-03 · The pay-from-wallet sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py H14 W10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A4.json`

## Goal

One payment sheet: what you're paying for, the amount, the wallet balance, and what happens when it's not enough.

## Scope

src/components/pay-sheet/ with states: enough, not enough (top-up path), paying, still confirming, failed.

## Capability checks

- [ ] With too little money, the sheet shows the shortfall and a way to add money.
- [ ] It matches H14 in light and dark.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
