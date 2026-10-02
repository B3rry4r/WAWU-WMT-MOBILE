---
id: INBOX-06
title: Free chat between users
owner: DEV
area: INBOX
order: 99
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-06 · Free chat between users

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A backend gap behind lane B's screens, from docs/analysis/ANALYSIS-EVIDENCE.md. Additive only.

## Scope

Conversations, messages with images and files, read state, blocks enforced (per R-13).

## Capability checks

- [ ] Two users can chat; a blocked user cannot message.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
