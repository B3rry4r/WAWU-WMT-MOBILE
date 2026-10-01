---
id: HOME-11
title: TGIF on Today, saved to the account
owner: DEV3
area: HOME
day: 3
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# HOME-11 · TGIF on Today, saved to the account

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Turning TGIF off today lives in one browser's storage; it should follow the account to the phone.

## Scope

A per-account preference with GET and PATCH.

## Capability checks

- [ ] Turning TGIF off on one device hides it on another after sign-in.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
