---
id: INBOX-02
title: Live updates for chat
owner: DEV2
area: INBOX
order: 19
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
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

Verifier session, 4 Oct 2026. Branch as it lands: backend `e101084` on top of `origin/main` 1e6b807 (main had not moved; INBOX-09 not merged, so no merge conflicts to check), mobile `b2350ae`. Own worktrees, own Postgres 16 clusters (:5457, :5458, fresh, migrated, `npm run db:seed`, database `wawu_hub_test`), mock WAWU ID started from the same checkout as the code under test, real `ws` clients against real running servers (probe scripts kept in the verifier's scratch directory, not committed). Result: **status back to `building`: 5 defects, none of them in the capability check itself.**

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| Capability check ("two signed-in socket clients: a message sent by one reaches the other within two seconds; a blocked user's socket receives nothing") | **passed** | Real clients on a real server: REST send to recipient socket 37 ms, sender's second phone gets it, 150 sockets over two instances all within 76 ms. A message stored just before a block and signalled after: neither side receives it. After the block, messages and read marks reach nobody. Unblock restores flow. |
| V1 Gates | **passed** (no new finding; some gates already fail on main) | Backend `tsc --noEmit`: exit 0 on main and branch. eslint without `--fix`, JSON, compared per file and rule: main 670 files, 3610 errors, 850 warnings; branch 686 files, 3610 errors, 850 warnings; 0 differing (file, rule) pairs, the 16 new files have 0 findings. `scripts/gates/run.py`: main 656 files, branch 672 files, both 16 fail / 14 warn / 76 accepted, output identical apart from the file count, exit 1 on both (pre-existing). `check_baseline.py`: OK on both (108 entries). `npm audit --omit=dev`: 10 (3 moderate, 7 high) on both, neither names `ws`. Contract suite, fresh seeded DB, identical setup: **main 137 suites passed, 3297 passed, 3 skipped, 0 failed**; **branch 138 suites passed, 3319 passed, 3 skipped, 0 failed** on run 1, again on run 2 with the new spec forced first; new spec alone 22 passed. Mobile `npm run check`: first run 1 failed (OpenWalletScreen cold-cache timeout, the known one), re-run exit 0: 28 suites, 485 tests, gates 123 files scanned 0 findings, 205 tasks. |
| V2 Contract | **failed** | Protocol, auth, close codes, 8-socket cap, ping, expiry, tampered/forged/alg-none/HS256-confusion/expired/other-audience/other-issuer tokens, cursor validation, bounds all behave as LIVE.md says (see "What passed"). Failures: D1 (catch-up loses messages), D4 (1001 on restart is never sent). |
| V3 Regression | **failed** (D3 only) | Side by side, main vs branch, real servers, each with its own mock and a seeded DB: 85 requests over the community-message routes (the protected ones), the chat routes, block/health/404/body-size/CORS preflight, error cases included: 84 identical (status, headers, body after id/time normalisation), the 1 difference is the new `GET /live/catch-up` (404 on main, 401 on branch). `scripts/protected-routes/run.sh --fresh`: branch 253 passed (244 required), main 253 passed. A broken publisher (NOTIFY revoked from the DB role): chat send, read mark and community POST all still 201/200 with the row stored. Feed killed or Postgres stopped: REST unaffected. D3: a request carrying an `Upgrade` header to any other path now hangs. |
| V4 Field trace | **passed** | For a text message (with `clientMessageId`), an attachment message and a community message: written by REST, stored, read back by REST list, pushed on the socket and returned by catch-up: identical JSON for sender and recipient (sender's own copy alone carries `clientMessageId`). `readAt` is written only when the mark moves, never moves back, and the same-millisecond tie-break from INBOX-06 holds (larger id advances, smaller never moves it back, one `chat.read` per real move). The column is covered by the purge map's row-level `ChatParticipant` entry; the drift guard passes. |
| V9 Live seam | **passed** | `scripts/local/up.sh --detach` from the verifier's backend worktree against a worktree of WAWU-ID `origin/main` (dbcb2f8), own ports 3301/3302, own Postgres. Signed in through the real `/auth/login` (seeded user and creator, password `wawu-local-2026`), plus a brand-new person made through the real register, email-code verify and login. A socket opened with each real token (header, and first-frame for one). REST message from the user reached the creator's socket in 35 ms with the server-assigned id and time equal to the REST answer; `other.name` "Chidi Umeh" was resolved by the real WAWU ID; the new person received a message; catch-up with a real token returned the read mark. up.sh's `.env` and `.local` were deleted afterwards and no test ran while they existed. Real tokens carry no `iss`/`aud`; with issuer and audience configured, the socket and REST refuse and accept the same tokens (5 cases). |

### Diff against the report

`git diff --stat origin/main...origin/wmt/INBOX-02`: backend 27 files, +2433 -10, exactly the report's list plus `package-lock.json` (the report names `package.json`, not the lock). `main.ts`, `deploy/`, `src/common/**`, guards untouched; `app.module.ts` is the one import and one `imports` entry for `LiveModule` (+4 lines). `contract/openapi.json` +164, none removed, and `npm run contract:build` regenerates it byte-identical. Migration `20261003233000_chat_read_at` is one nullable column; applied to a DB with existing chat rows, all rows kept with `readAt` NULL. Mobile 5 files as reported. SHARED-CHANGES INBOX-02 #1 (schema, migration, contract) and #2 (`app.module.ts`) exist and match. G-79 and G-80 are unique on main; INBOX-09's branch uses up to G-78, so no clash. `ws` 8.22.0 and `@types/ws` 8.18.2, MIT, only those two packages added to the lockfile, `npm ci` works. No em-dashes, TODO or "for now" in `src/live` or LIVE.md; close reasons are `auth_timeout`, `auth_required`, `bad_frame`, `invalid_token`, `replaced`, `wrong_person`, `token_expired`, `resync`; no wallet or ledger writes.

**Correction to the builder's "before" count.** The builder's main baseline (22 suites, 471 tests failed, "Fintava keys") is wrong. Its own log shows 638 x `expected 200, got 401 Unauthorized` and similar: the suite was run against a mock WAWU ID started from another checkout (another keypair), so every token was refused. No Fintava key is involved. The proper before, from a real worktree of `origin/main` with its own `npm ci`, own mock and fresh seeded DB: 137 suites, 3297 passed, 3 skipped, 0 failed. After: 138 suites, 3319 passed, 3 skipped (+1 suite, +22 tests).

**DB leftovers.** Fresh seeded DB, row counts of every table, then the new spec alone, then every table again: identical (no leftovers). After the full suite only the seed's rows remain in the chat, community, block and profile tables.

### What passed (real sockets, real server)

- Sign in: header and first-frame both work; a token in the URL is never read (closed `4401 auth_timeout`); no token closed 4401 after 5.0 s; forged (other key, same kid), payload-tampered, `alg: none`, HS256-with-public-key, garbage and expired tokens all 4401 with no `ready`; token expiring while open closes `4401 token_expired` at expiry; a new `auth` frame renews; another person's token on an open socket closes 4403; a bad token on an open socket closes 4401.
- Frames: `ping` gets `pong`; unknown type, non-JSON and binary frames close 1003; 9 KB and 100 KB frames close 1009; ping before auth closes 4401; the server stayed healthy throughout.
- 9th socket of one person closes only the oldest with 4409. Server pings every 30 s; a client that never answers is dropped by the second beat (about 40 s).
- Authorization: a stranger gets nothing for chat message, read mark or room message, cannot post, read or mark by guessing a chat or room id (404/403), catch-up empty; pending, never-joined and removed members get nothing; a member who leaves by REST stops receiving on the already open socket; a newly joined member starts receiving on an already open socket; a member who blocked the sender, and a host blocked by the sender, get nothing; catch-up excludes blocked chats and blocked senders for both sides.
- Reconnect: 30 sends from both phones concurrently while one socket was down, plus 5 before and 1 after reconnecting, paged with `limit=7`: all recovered, no gap (duplicates only by id); read mark by the other person included; a message stamped before the cursor and committed 3 s after it is recovered by the 10 s lookback; one stamped more than 10 s before the cursor is not (the documented limit, and a REST send commits in milliseconds). Bad cursors (garbage, wrong flag, non-ISO, extra part, 201 chars), `limit` 0, 101, abc, -1, 1.5, unknown parameter, repeated cursor all 400; no token 401; the global throttler applies (60 rapid calls: 17 x 200, 43 x 429). 100 of a 20 000-row backlog in 46 ms.
- Scale: 150 sockets split over two Hub instances on one database got a room message within 76 ms, in order, once each; a message through instance A reached a socket on B (22 ms) and the reverse. Killing the LISTEN session closes that instance's sockets 4503 within 2 ms, the other instance is untouched, new upgrades get HTTP 503 for about 1 s, then accepted again, events flow. Both instances killed: both recover. Postgres stopped and restarted: 4503, 503 while down, recovered 1.0 s after it came back. 1500 connect/terminate cycles: file descriptors 26 to 26, RSS flat (268 to 269 MB). A non-reading client under a 4000 x 9 KB flood did not delay another user (37 ms).
- Deployment fit: nginx forwards `Upgrade` and `Connection`, `proxy_http_version 1.1`, 120 s read timeout, ping every 30 s inside it; one systemd unit (one instance), so multi-instance is only a Postgres matter; `deploy/README.md` shows the DB on port 25060, the direct port.

### Findings

**defect D1: catch-up loses messages when more rows share one millisecond than the page limit.** `src/live/live-catch-up.service.ts`, last block: when a continuing (exact) page ends on the same millisecond it started, the next cursor jumps to `+1 ms`, skipping the rest of that millisecond. Reproduced against the running server: 4 messages with the same `createdAt`, pages of limit 1, 2, 3 missed 3, 2, 1 of 4; 12 messages, limit 1, 5, 11 missed 11, 7, 1. Limit 4 or more with 4 rows passes. `limit` may be 1 to 100 per the contract, and the doc and the capability claim "no loss". Needs a tie-breaking cursor (time plus id), or no skip.

**defect D2: every live signal logs a false `Could not signal ...` warning.** `LivePublisher.publish` runs `SELECT pg_notify(...)` through `$queryRaw`; `pg_notify` returns `void` and Prisma throws `Failed to deserialize column of type 'void'` after the NOTIFY has already been sent. The catch logs a WARN with the Prisma error on each publish (77 of 78 publishes in one server's log) while events are delivered. A genuine publish failure (the broken-role test) logs the same line, so the one log that should tell an operator a signal was lost cannot. Use `$executeRaw` or cast the result.

**defect D3: any request carrying an `Upgrade` header to a path other than `/api/hub/live` now hangs.** Main answers such a request normally (`GET /api/hub/health` with `Upgrade: websocket` gets 200, an unknown path 404, then closes). On the branch the `upgrade` listener ignores other paths and neither answers nor destroys the socket: it stayed open 200 s with no response (still open when the probe ended; nginx would cut it at 120 s with a 504). Behind nginx that sends `Upgrade` whenever the client does. That changes the behaviour of every other HTTP route for such clients and leaves an idle, untimed socket per request. Destroy the socket (or answer 404/400) for any other path.

**defect D4: graceful shutdown never runs in production, and LIVE.md says it does.** `main.ts` does not call `enableShutdownHooks` (and `main.ts` is untouched by this branch), so `onApplicationShutdown` and the listener's `onModuleDestroy` never fire on SIGTERM, which is what each `systemctl restart` (every deploy) sends. Measured with a real server: 8 open sockets, SIGTERM, process gone in 119 ms, sockets see `1006` (no close frame), not `1001`. LIVE.md section 2 says "`1001` (the server is restarting)". The builder's spec closes through `app.close()`, which is why it passed. Either the gateway handles SIGTERM itself or the claim is corrected; a `main.ts` change would need a SHARED-CHANGES row.

**defect D5: with a transaction-pooled `DATABASE_URL` the feed fails silently, not loudly.** Tested with pgbouncer in transaction mode: the Hub logs `Live feed listening`, accepts sockets, and delivered 0 of 10 messages; no close, no 4503, no log. LIVE.md only documents that a direct connection is needed. Nothing detects a deaf listener (a pooler, or a half-open TCP connection: the `pg` client has no keep-alive set), so "never silently drop events" is not met for that misconfiguration. A periodic self-NOTIFY round trip that closes with 4503 when it does not come back would cover both.

**unclear U1 (owner): Postgres LISTEN/NOTIFY instead of Redis.** The task says Redis; the builder chose Postgres under "Default (agent)" and says only `LivePublisher` and `LiveListener` change if the owner prefers Redis. Works as built (two instances tested). Owner to confirm. Also: whether the droplet's `DATABASE_URL` is the direct port. `deploy/README.md` already shows 25060, which is the direct port, so the repo's own docs point at it; the live value is the owner's to confirm (see D5 for what happens if it is not).

**unclear U2: a slow or never-reading client has no per-socket cap.** A 4000 x 9 KB flood to a person with a non-reading socket grew the server from 269 MB to 303 MB (about the size of the payload) until the heartbeat drops the socket (up to 60 s). Others were not delayed. A `bufferedAmount` limit that closes the socket would bound it.

**unclear U3: no limit on socket upgrades per address.** The HTTP throttler does not cover upgrades; an unauthenticated socket costs nothing but lives 5 s. Not tested at scale; nginx or the firewall may be the owner's answer.

**unclear U4: catch-up and the socket disagree about one read event.** Sending a message moves the sender's own read mark (INBOX-06) and so sets `readAt`; the recipient's catch-up then lists a `chat.read` from the sender pointing at the sender's own message, which the socket never sends. Harmless to ticks (state, applied twice is the same), but the two paths are not identical.

**NOT RUN.** Real nginx in front of the socket (config read, not exercised); managed Postgres with `sslmode=verify-full` for the LISTEN connection (same connection string handling as the Prisma adapter, but not exercised against DigitalOcean); a half-open TCP feed (reasoned from the code under D5, not simulated); V5, V6, V7, V10 are not in this task's passes.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
