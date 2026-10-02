---
id: SCHOOLS-04
title: Schools: browse, search, course detail
owner: DEV3
area: SCHOOLS
order: 20
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-02]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-04 · Schools: browse, search, course detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC1-SC3 and SC10 need a public list, search, a school page and a course page with intakes and seats left.

## Scope

GET schools (category, q), school by id, course by id with intakes; a 'schools' tab in the existing search.

The schools tab in search is this task's; EXPLORE-05 depends on it.

## Capability checks

- [ ] A user can search 'design' and get schools whose courses match.
- [ ] A course page shows each intake's seats left from real enrolment counts.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
