---
id: PROS-02
title: Professional fields and card data
owner: YOU
area: PROS
day: 2
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# PROS-02 · Professional fields and card data

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

P1-P10 and H10 use field names and card details the backend doesn't have.

## Scope

Map the canvas's fields to the professional categories; city, usual reply time and message price on the professional response.

## Capability checks

- [ ] Filtering by a field on P1 returns professionals in that field.
- [ ] A card's 'usually replies in' comes from real reply times.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
