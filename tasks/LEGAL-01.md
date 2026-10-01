---
id: LEGAL-01
title: Legal starts as a chat
owner: YOU
area: LEGAL
order: 53
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [D9]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-01 · Legal starts as a chat

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D9 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S14-S17: the assistant chat comes first and writes the brief; today it only opens after payment.

## Scope

Assistant on an unpaid intake, brief written into the intake, consultant can join before payment (per D9). The legal option lists published as named schemas.

## Capability checks

- [ ] A user can describe a problem and receive a brief without paying.
- [ ] A consultant who joins sees the brief.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
