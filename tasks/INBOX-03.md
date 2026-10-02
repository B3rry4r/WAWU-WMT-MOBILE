---
id: INBOX-03
title: Phone push notifications
owner: DEV2
area: INBOX
order: 47
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SETTINGS-07]
decisions: []
passes: [V1, V2, V3, V4, V9, V10]
artboards: []
---
# INBOX-03 · Phone push notifications

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Replies, refunds, money in and join decisions need to reach a phone.

## Scope

Device token registration and removal; a sender behind the existing notification service that respects settings; Expo push.

Categories follow the user's Z3 switches (SETTINGS-07). The phone side (permission, token, tap) is INBOX-21. Android push needs the owner's FCM credentials uploaded to Expo (owner input).

V10 runs on a real Android phone only (DECISIONS R-24).

## Capability checks

- [ ] A notification sent to a registered push token is accepted by Expo's push service, and its receipt reports it delivered within a minute (the phone side is checked in INBOX-21).
- [ ] A category the user turned off in Z3 (SETTINGS-07) is not sent.
- [ ] A dead token is cleaned up.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
