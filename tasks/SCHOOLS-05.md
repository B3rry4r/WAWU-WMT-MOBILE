---
id: SCHOOLS-05
title: Admin screens: schools, courses, intakes
owner: YOU
area: SCHOOLS
order: 36
priority: launch
repo: wawu-dashboard
type: admin-screen
status: todo
depends_on: [SCHOOLS-02, SCHOOLS-04]
decisions: []
passes: [V1, V6, V7, V9]
artboards: []
---
# SCHOOLS-05 · Admin screens: schools, courses, intakes

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below when the lead schedules it. It needs SCHOOLS-02, SCHOOLS-04 built first.
- **History:** none yet. Reports go to tasks/history/SCHOOLS-05.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-dashboard`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Staff need a place to add and edit schools.

## Scope

Dashboard screens over SCHOOLS-02's endpoints.

## Capability checks

- [ ] An admin can add a school with a course and an intake from the dashboard, and the public schools route returns it (SCHOOLS-04).

## Lead note (8 Oct 2026): paging from SCHOOLS-04

`GET /schools` pages by keyset on (name, id). A school renamed between two page reads can come back on a later page, so when the list appends a page it drops any school id it already holds. Add a test for it.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
