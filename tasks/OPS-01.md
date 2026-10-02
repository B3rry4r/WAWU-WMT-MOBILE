---
id: OPS-01
title: Record the owner's rulings
owner: YOU
area: OPS
order: 2
priority: launch
repo: wawu-wmt-mobile
type: ops
status: done
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-01 · Record the owner's rulings

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

The owner ruled D1 to D13 on 2 Oct 2026. They are recorded in DECISIONS.md as R-6 to R-18, and every affected task was changed to match: identity checks moved into "Open your wallet" (KYC-01 to KYC-04), the profile Shop tab and "Move to wallet" are not built, and the fees, limits and splits are the owner's numbers.

## Scope

DECISIONS.md and the task files. D14 (web features missing from the canvas) is ruled in OPS-07; D15 (the ₦ glyph) is answered by the designer in OPS-04. Fees, limits and prices still go into config, so a later change never means rebuilding a screen.

## Capability checks

- [x] Every ruling from 2 Oct 2026 is in DECISIONS.md with the tasks that carry it out.
- [x] `npm run tasks` passes: no task names an unknown decision, and every artboard is built once or listed as not built.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

Owner, 2 Oct 2026: rulings given in the planning session and recorded by it.
