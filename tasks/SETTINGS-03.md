---
id: SETTINGS-03
title: Change password and sign out for real (WAWU ID)
owner: DEV
area: SETTINGS
order: 88
priority: launch
repo: wawu-id
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-03 · Change password and sign out for real (WAWU ID)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-id`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z2 needs a password change that signs other devices out, and a sign-out that really ends the session. The notification switches moved to SETTINGS-07, so each task touches one repo.

## Scope

Change password (current and new) in WAWU ID, revoking other sessions; `POST /auth/logout` revoking the presented refresh token (BACKEND_GAPS G-6, additive), which the app calls before clearing its tokens.

## Capability checks

- [ ] After changing the password, other devices are signed out.
- [ ] After a user signs out, their old refresh token is refused (G-6).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
