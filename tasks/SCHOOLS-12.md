---
id: SCHOOLS-12
title: School sign-ups from the WAWU link, and the school's commission
owner: DEV3
area: SCHOOLS
order: 246
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-10]
decisions: [R-5, R-12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-12 · School sign-ups from the WAWU link, and the school's commission

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-5, R-12

## Goal

SC9: a school pays WAWU a commission on students who signed up on the school's own site through WAWU's link.
Split from SCHOOLS-10, whose link and click log ship at launch.

## Scope

Admin upload of a school's conversions, matched to SCHOOLS-10's clicks; a commission ledger. No rate is ruled for
this: 15% of the course fee (the one split, R-5), held in config marked `PROVISIONAL(R-5)`.

## Capability checks

- [ ] An uploaded conversion is matched to its click and creates one commission row of 15% of the course fee.
- [ ] The same conversion uploaded twice creates one row.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
