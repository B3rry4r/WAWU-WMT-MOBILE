---
id: WALLET-24
title: Proof of address (A20)
owner: YOU
area: WALLET
order: 232
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [WALLET-23]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-24 · Proof of address (A20)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A20: proof of address reviewed by a person.

## Scope

Submission with upload, review queue endpoints for admins (screens in WALLET-34).

## Waiting on

This waits for the owner's ruling on what A17 to A20 become (BRIEF, "A17 to A20"; after launch). Fintava's API has no tiers.

## Capability checks

- [ ] A submitted Tier 3 request appears in the admin queue and its decision reaches the user.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
