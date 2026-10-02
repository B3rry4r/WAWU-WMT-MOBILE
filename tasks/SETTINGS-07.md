---
id: SETTINGS-07
title: Notification switches the server honours
owner: DEV
area: SETTINGS
order: 34
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-07 · Notification switches the server honours

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z3's switches work: a user who turns a kind of notification off stops getting it, and nothing else changes.
Split from SETTINGS-03 so each task touches one repo.

## Scope

The notification keys Z3 draws and the server lacks (moneyIn for tips, sales and transfers; communityMessages per
message; contentReviews for approved and sent back), stored with the existing settings and honoured by every
sender, including push (INBOX-03). Additive: existing keys and their behaviour stay.

## Capability checks

- [ ] A user who turns off "New followers" gets no notification when someone follows them, and still gets every other kind.
- [ ] Each of the three new switches is saved, read back, and honoured by the sender of that kind.
- [ ] V3: the web's existing notification settings behave the same.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
