---
id: ADS-05
title: Count ad views and taps
owner: YOU
area: ADS
day: later
repo: wawu-backend
type: backend-endpoint
status: blocked
blocked_by: "until D10 is ruled in DECISIONS.md"
depends_on: [ADS-04]
decisions: [D10]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-05 · Count ad views and taps

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D10 (open: this task is blocked until they are ruled)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Advertisers are billed and reported on views and taps.

## Scope

POST impression, tap, skip; one view per person per day; daily totals.

## Capability checks

- [ ] Opening the same card twice in a day counts one view.
- [ ] Daily totals match the raw events.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
