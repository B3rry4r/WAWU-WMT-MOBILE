---
id: INBOX-03
title: Phone push notifications
owner: DEV3
area: INBOX
day: 3
repo: wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9, V10]
artboards: []
---
# INBOX-03 · Phone push notifications

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Replies, refunds, money in and join decisions need to reach a phone.

## Scope

Device token registration and removal; a sender behind the existing notification service that respects settings; Expo push.

## Capability checks

- [ ] A notification reaches a real phone within a minute.
- [ ] A turned-off category is not sent.
- [ ] A dead token is cleaned up.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
