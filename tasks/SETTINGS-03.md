---
id: SETTINGS-03
title: Settings: password, sign out everywhere, notification switches
owner: DEV2
area: SETTINGS
day: 3
repo: wawu-id, wawu-backend
type: backend-endpoint
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-03 · Settings: password, sign out everywhere, notification switches

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-id, wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z2 and Z3 need change password, a real sign-out, and three new notification switches.

## Scope

Change password (WAWU ID) revoking other sessions; server-side sign-out; notification keys moneyIn, communityMessages, contentReviews honoured when notifications are sent.

## Capability checks

- [ ] After changing the password, other devices are signed out.
- [ ] Turning off 'money in' stops those notifications and nothing else.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
