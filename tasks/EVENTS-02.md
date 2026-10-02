---
id: EVENTS-02
title: Hosting an event: hybrid, kinds, one-step submit
owner: DEV
area: EVENTS
order: 50
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-8]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# EVENTS-02 · Hosting an event: hybrid, kinds, one-step submit

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-8 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

E13-E16 ask for things the event model lacks and submit in one go.

## Scope

Additive: hybrid format, Conference and Concert kinds, ticket types in the same submit, ₦0 tickets per R-8.

## Capability checks

- [ ] A host submits an event with two ticket types in one request and it goes to review.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
