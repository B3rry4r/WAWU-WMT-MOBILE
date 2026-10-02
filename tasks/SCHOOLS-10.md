---
id: SCHOOLS-10
title: Link to a school's own site, with the click recorded
owner: DEV3
area: SCHOOLS
order: 75
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-04]
decisions: [R-12, R-33]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-10 · Link to a school's own site, with the click recorded

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC9: a user can apply on the school's own site through a WAWU link, and the click is recorded. Built at launch (R-33); the school's sign-ups and the commission are SCHOOLS-12, after launch.

## Scope

Per-school link code and a redirect endpoint that logs the click (user, course, time).

## Capability checks

- [ ] Tapping 'Apply on their site' records one click and lands on the school's URL with the WAWU code.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
