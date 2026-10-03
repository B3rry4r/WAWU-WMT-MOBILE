---
id: SETTINGS-08
title: Delete account in WAWU ID: 30 days, cancelled by signing in
owner: DEV
area: SETTINGS
order: 175
priority: launch
repo: wawu-id
type: backend-endpoint
status: todo
depends_on: [SETTINGS-06]
decisions: [R-17]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-08 · Delete account in WAWU ID: 30 days, cancelled by signing in

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `DECISIONS.md`: R-17 (ruled; build what it says)

## Goal

Z6 to Z8: deleting an account waits 30 days, and signing in during that time cancels it (R-17). This is the
WAWU ID half; the wallet and content half is SETTINGS-06.

## Scope

In WAWU ID: the 30-day grace period on a scheduled deletion (today 48 hours); sign-in during the grace period
clears it and tells the Hub (SETTINGS-06's cancel route), so the wallet unfreezes and content comes back.

## Capability checks

- [ ] A user who schedules deletion and signs in 10 days later keeps their account, wallet and content.
- [ ] A user who doesn't sign in for 30 days can no longer sign in, and their account is deleted.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
