---
id: OPS-01
title: Confirm or change the decision defaults
owner: YOU
area: OPS
order: 2
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: []
decisions: []
passes: []
artboards: []
---
# OPS-01 · Confirm or change the decision defaults

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)

## Goal

Every open decision in DECISIONS.md already has a default that work follows, so nobody waits. This is where you confirm a default or change it. A change updates settings or a flag, not the build.

## Scope

DECISIONS.md: for each of D1 to D15, either confirm the default (move it to the rulings with your name and date) or write the change. Fees, limits and prices go into config, so a changed number never means rebuilding a screen.

## Capability checks

- [ ] Every D-row says "confirmed" or "changed", with who and when.
- [ ] Every number the defaults put in config (fees, limits, splits, prices) is confirmed, so the release gate stops flagging it.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
