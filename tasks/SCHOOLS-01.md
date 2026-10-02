---
id: SCHOOLS-01
title: Schools data model
owner: DEV3
area: SCHOOLS
order: 54
priority: launch
repo: wawu-backend
type: migration
status: todo
depends_on: []
decisions: []
passes: [V1, V3, V4, V9]
artboards: []
---
# SCHOOLS-01 · Schools data model

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Schools is a new product (SC1-SC11). It needs schools, courses and dated intakes with seat limits.

## Scope

Additive migration: School (name, location, foundedYear, expertise, about, logo, applyUrl, reportEmail), SchoolCourse (title, weeks, mode, syllabus, outcomes, priceKobo), CourseIntake (startDate, schedule, location, capacity, seatsTaken).

## Capability checks

- [ ] Migration applies cleanly to a copy of production.
- [ ] V3 regression suite unchanged.
- [ ] Every field has a planned writer (SCHOOLS-02) and reader (SCHOOLS-04).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
