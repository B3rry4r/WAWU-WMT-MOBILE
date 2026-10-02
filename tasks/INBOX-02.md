---
id: INBOX-02
title: Live updates for chat
owner: DEV2
area: INBOX
order: 19
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-02 · Live updates for chat

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- wawu-backend's `docs/LOCAL.md` and `scripts/local/up.sh` (OPS-03: the local backend)

## Goal

Chats, rooms and money requests update on both phones without a refresh. Additive only.

## Scope

WebSocket gateway with Redis fan-out for messages, read receipts and money-request updates. On reconnect, or when
the app returns to the foreground, the app fetches what it missed with a since-cursor (the I25 gap "no incremental
fetch"): a catch-up, not a fallback. Redis runs in Docker locally (OPS-03); Redis on the droplet is an owner input.
The app-side connection is built once in INBOX-04 (`src/features/inbox/live.ts`) and reused by every chat screen.

## Capability checks

- [ ] Two signed-in socket clients: a message sent by one reaches the other within two seconds; a blocked user's socket receives nothing.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
