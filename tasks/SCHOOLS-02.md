---
id: SCHOOLS-02
title: Admin: create and edit schools, courses and intakes
owner: YOU
area: SCHOOLS
day: 2
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: [SCHOOLS-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-02 · Admin: create and edit schools, courses and intakes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Schools are added from the WAWU dashboard (canvas note on SC1), not by school accounts.

## Scope

Admin namespace only, admin auth only. Create, edit, hide schools, courses and intakes.

## Capability checks

- [ ] An admin can add a school with a course and an intake, and it appears in SCHOOLS-04's list.
- [ ] A user token is refused on every admin school route.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
