---
id: EXPLORE-05
title: Search: communities, recent and popular searches, schools
owner: DEV3
area: EXPLORE
day: 3
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EXPLORE-05 · Search: communities, recent and popular searches, schools

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A backend gap behind lane B's screens, from docs/analysis/ANALYSIS-EVIDENCE.md. Additive only.

## Scope

Communities in search, saved recent searches with clear, popular searches from real queries, ticks on creator rows, schools tab (after SCHOOLS-04).

## Capability checks

- [ ] A user's recent searches survive a restart and can be cleared.
- [ ] Search returns communities by name.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
