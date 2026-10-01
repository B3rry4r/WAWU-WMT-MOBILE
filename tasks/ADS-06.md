---
id: ADS-06
title: Admin ad endpoints
owner: YOU
area: ADS
order: 189
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [ADS-03]
decisions: [D10]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-06 · Admin ad endpoints

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D10 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Create, schedule, pause and report on campaigns.

## Scope

Admin namespace, admin auth.

## Capability checks

- [ ] An admin can pause a live campaign and it stops showing within a minute.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
