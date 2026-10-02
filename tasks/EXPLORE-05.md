---
id: EXPLORE-05
title: Search: communities, recent and popular searches, ticks
owner: DEV
area: EXPLORE
order: 97
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EXPLORE-05 · Search: communities, recent and popular searches, ticks

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Search finds communities, remembers a user's recent searches with Clear, shows popular searches from real queries, and marks ticked creators (X5, X6, X8, X9, X11). Schools come from SCHOOLS-04, which builds the schools search. Additive only.

## Scope

Communities in search, saved recent searches with clear, popular searches from real queries, ticks on creator rows. The schools tab is SCHOOLS-04's; this task depends on it so search covers schools.

## Capability checks

- [ ] A user's recent searches survive a restart and can be cleared.
- [ ] Search returns communities by name.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
