---
id: INBOX-02
title: Live updates for chat
owner: DEV2
area: INBOX
order: 19
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

**Backend only (wawu-backend, branch `wmt/INBOX-02`). Files:** new `src/live/` (gateway, listener, dispatcher, connections, token verifier, catch-up service and route, publisher, types, `tests/live.contract.spec.ts`), `docs/contract/LIVE.md` (the protocol), migration `20261003233000_chat_read_at`; edited `schema.prisma` (+`ChatParticipant.readAt`), `app.module.ts`, `chat/chat.service.ts` and `.module.ts`, `community-message/community-message.service.ts` and `.module.ts`, `contract/openapi.json` (regenerated, +164 lines, none removed), `package.json` (`ws`, `@types/ws`). Mobile repo: this file, LOG, SHARED-CHANGES, BACKEND_GAPS, generated INDEX/PROGRESS.

**Transport (Default (agent), owner may override).** Raw WebSocket (`ws`) at `/api/hub/live`, attached to the Hub's own HTTP server so `main.ts` is untouched; nginx already forwards `Upgrade` with a 120 s timeout and a 30 s heartbeat stays inside it. Fan-out between instances is Postgres `LISTEN/NOTIFY` on the existing database, not Redis: nothing in the repo or `deploy/` ran Redis, and the droplet has none (the task calls that an owner input). Needs the direct DB port (25060), not a pool port. If the owner adds Redis, only `LivePublisher` and `LiveListener` change.

**Capability check** (`src/live/tests/live.contract.spec.ts`, 22 tests, real sockets and WAWU ID tokens from the local mock): a message sent over REST reaches the other client's socket within two seconds (asserted) and the sender's other phone; a socket for someone in no chat gets nothing. Blocked: after a block, a message stored before it and signalled after, a read mark, and a room message reach the blocked side's socket as nothing, while another member still gets the room message; a member who leaves while connected stops receiving. Also tested: 401 without a token, header and first-frame sign-in, forged token (4401), no token (4401 after 5 s), expired token (4401) and renewal by a new `auth` frame, another person's token (4403), 20 concurrent member sockets on one room within two seconds, 8-socket cap, a reconnect with 10 messages sent while the socket was down plus 10 before (20 of 20 recovered, paged by 7), read marks missed while offline, a stranger's catch-up empty, two Hub instances in one test (message through one reaches a socket on the other), and the Postgres feed killed (every socket closed 4503, new sockets accepted again after the listener reconnects).

**Gates, before then after.** Backend: `tsc` clean, clean; eslint 4460 problems (3610 errors, 850 warnings) then identical; gates 16 fail / 14 warn / 76 accepted, files scanned 656 then 672, identical findings; `check_baseline.py` OK both; contract suite on seeded `wawu_hub_test`: after = 138 suites passed, 3319 passed, 3 skipped, twice in a row. Before (run from an exported copy of origin/main, fresh seeded DB): 22 suites failed, 471 tests failed, all in money, KYC, credits and privacy suites that call the Fintava sandbox (no keys here); the same suites pass in the branch run, so that "before" is environmental and not comparable; NOT re-run on the branch's base. `scripts/protected-routes/run.sh --fresh`: 253 passed after; the before run was NOT RUN separately (no route in the registry changed). Mobile: `npm run check` exit 0 before (485 tests; first run hit the known OpenWalletScreen cold-cache timeout, re-run green) and after (no mobile code changed).

**Filed.** SHARED-CHANGES INBOX-02 #1 (schema, migration, contract) and #2 (`app.module.ts`). BACKEND_GAPS G-79 (money-request events, INBOX-15) and G-80 (paid DM threads not live, left alone because INBOX-09 edits `src/direct-message/`).

**Not done.** Money-request events (no table yet, G-79). Paid DM live updates (G-80). The app-side connection is INBOX-04's. `chat.read` carries no unread count (the phone refetches `GET /chats`). Not tested over a real nginx or against managed Postgres. Owner question: confirm Postgres `LISTEN/NOTIFY` instead of Redis, and that the Hub's `DATABASE_URL` in production is the direct port.


## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
