---
id: INBOX-07
title: One inbox list with unread counts
owner: DEV2
area: INBOX
order: 23
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [INBOX-01, INBOX-06, INBOX-08]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-07 · One inbox list with unread counts

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

One inbox list: chats, paid DMs, communities, money and WAWU messages in one feed with unread counts (I1). Additive only.

## Scope

A single inbox feed mixing chats, paid DMs, communities, money and WAWU messages, with unread counts and the tab badge total.

Money requests join the feed in INBOX-15.

## Capability checks

- [ ] A user with two unread chats and one unanswered paid question sees 3 on the Inbox tab, and 2 after opening one chat.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
