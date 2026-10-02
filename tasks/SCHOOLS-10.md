---
id: SCHOOLS-10
title: Tracked link to a school's own site
owner: DEV3
area: SCHOOLS
order: 162
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-04]
decisions: [R-12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SCHOOLS-10 · Tracked link to a school's own site

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

SC9: apply on the school's site through a WAWU link, and the school pays WAWU a commission.

## Scope

Per-school link code, redirect endpoint that logs the click (user, course, time), admin upload of the school's conversions, commission ledger.

## Capability checks

- [ ] Tapping 'Apply on their site' records one click and lands on the school's URL with the WAWU code.
- [ ] An uploaded conversion is matched to its click and creates a commission row at the ruled rate.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
