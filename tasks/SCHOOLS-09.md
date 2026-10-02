---
id: SCHOOLS-09
title: Enrolment report to the school, and My courses
owner: DEV3
area: SCHOOLS
order: 128
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-07]
decisions: [R-12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-09 · Enrolment report to the school, and My courses

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC7 says the school gets the student's details; SC8 lists courses with their status.

## Scope

On enrolment, email the school the student's name, email, phone, course and intake, with the consent time recorded. GET my school enrolments with status.

The email goes through the backend's existing mailer.

## Capability checks

- [ ] After enrolling, the school's report address receives one email with the right details.
- [ ] My courses shows the enrolment with its intake date.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
