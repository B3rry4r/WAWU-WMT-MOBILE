---
id: AUTH-08
title: Selfie match to the BVN photo
owner: DEV
area: AUTH
order: 68
priority: launch
repo: wawu-id
type: third-party
status: todo
depends_on: [AUTH-03]
decisions: [D1]
passes: [V1, V2, V3, V6, V8, V9]
artboards: []
---
# AUTH-08 · Selfie match to the BVN photo

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: D1 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A6, A7, A16: a live selfie must match the BVN photo.

## Scope

The D1 vendor's liveness and face match, retries, result stored.

## Capability checks

- [ ] A matching selfie passes; a photo of a photo fails liveness; three failures show A16 and the retry rule.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
