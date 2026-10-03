---
id: INBOX-15
title: Money requests in chat
owner: DEV2
area: INBOX
order: 136
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [INBOX-06, INBOX-07, WALLET-07]
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-15 · Money requests in chat

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A user can ask someone in a chat for money; the other pays or declines once. Additive only.

## Scope

MoneyRequest (pending, paid, declined, cancelled) written into the chat; paying uses WALLET-07.

Requests appear in the INBOX-07 feed and the I20 Money filter. Paying a request is a send to a WAWU user (WALLET-07), with that fee.

## Capability checks

- [ ] A request paid once cannot be paid again.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
