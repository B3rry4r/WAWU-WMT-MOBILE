---
id: WALLET-24
title: Tier 3: address and proof
owner: DEV1
area: WALLET
day: later
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: [WALLET-23]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-24 · Tier 3: address and proof

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A20: proof of address reviewed by a person.

## Scope

Submission with upload, review queue endpoints for admins (screens in WALLET-34).

## Capability checks

- [ ] A submitted Tier 3 request appears in the admin queue and its decision reaches the user.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
