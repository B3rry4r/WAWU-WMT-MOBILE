---
id: LEGAL-03
title: Legal consultations and deliverables
owner: YOU
area: LEGAL
order: 89
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [D9]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# LEGAL-03 · Legal consultations and deliverables

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: D9 (not ruled yet: build the default written there; a later ruling changes settings, not the build)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

S18-S26: phone, video and in-person options, slots, several delivered files.

## Scope

Phone medium, per-medium length, slots; several deliverables posted into the chat; fees from configuration (D9).

## Capability checks

- [ ] A user books a slot that is then unavailable to others.
- [ ] Two delivered files both appear in the chat.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
