---
id: INBOX-02
title: Live updates for chat
owner: DEV2
area: INBOX
order: 19
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
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

**Backend only (wawu-backend, branch `wmt/INBOX-02`). Files:** new `src/live/` (gateway, listener, dispatcher, connections, token verifier, catch-up service and route, publisher, types, `tests/live.contract.spec.ts`), `docs/contract/LIVE.md` (the protocol), migration `20261004150000_chat_read_at`; edited `schema.prisma` (+`ChatParticipant.readAt`), `app.module.ts`, `chat/chat.service.ts` and `.module.ts`, `community-message/community-message.service.ts` and `.module.ts`, `contract/openapi.json` (regenerated, +164 lines, none removed), `package.json` (`ws`, `@types/ws`). Mobile repo: this file, LOG, SHARED-CHANGES, BACKEND_GAPS, generated INDEX/PROGRESS.

**Transport (Default (agent), owner may override).** Raw WebSocket (`ws`) at `/api/hub/live`, attached to the Hub's own HTTP server so `main.ts` is untouched; nginx already forwards `Upgrade` with a 120 s timeout and a 30 s heartbeat stays inside it. Fan-out between instances is Postgres `LISTEN/NOTIFY` on the existing database, not Redis: nothing in the repo or `deploy/` ran Redis, and the droplet has none (the task calls that an owner input). Needs the direct DB port (25060), not a pool port. If the owner adds Redis, only `LivePublisher` and `LiveListener` change.

**Capability check** (`src/live/tests/live.contract.spec.ts`, 22 tests, real sockets and WAWU ID tokens from the local mock): a message sent over REST reaches the other client's socket within two seconds (asserted) and the sender's other phone; a socket for someone in no chat gets nothing. Blocked: after a block, a message stored before it and signalled after, a read mark, and a room message reach the blocked side's socket as nothing, while another member still gets the room message; a member who leaves while connected stops receiving. Also tested: 401 without a token, header and first-frame sign-in, forged token (4401), no token (4401 after 5 s), expired token (4401) and renewal by a new `auth` frame, another person's token (4403), 20 concurrent member sockets on one room within two seconds, 8-socket cap, a reconnect with 10 messages sent while the socket was down plus 10 before (20 of 20 recovered, paged by 7), read marks missed while offline, a stranger's catch-up empty, two Hub instances in one test (message through one reaches a socket on the other), and the Postgres feed killed (every socket closed 4503, new sockets accepted again after the listener reconnects).

**Gates, before then after.** Backend: `tsc` clean, clean; eslint 4460 problems (3610 errors, 850 warnings) then identical; gates 16 fail / 14 warn / 76 accepted, files scanned 656 then 672, identical findings; `check_baseline.py` OK both; contract suite on seeded `wawu_hub_test`: after = 138 suites passed, 3319 passed, 3 skipped, twice in a row. Before: corrected by the verifier, main alone was 137 suites, 3297 passed, 3 skipped, 0 failed (my first count of 22 failing suites came from a mock WAWU ID started in another checkout, so every token was refused; it was not Fintava keys). `scripts/protected-routes/run.sh --fresh`: 253 passed after; the before run was NOT RUN separately (no route in the registry changed). Mobile: `npm run check` exit 0 before (485 tests; first run hit the known OpenWalletScreen cold-cache timeout, re-run green) and after (no mobile code changed).

**Filed.** SHARED-CHANGES INBOX-02 #1 (schema, migration, contract) and #2 (`app.module.ts`). BACKEND_GAPS G-184 (money-request events, INBOX-15) and G-185 (paid DM threads not live, left alone because INBOX-09 edits `src/direct-message/`).

**Not done.** Money-request events (no table yet, G-184). Paid DM live updates (G-185). The app-side connection is INBOX-04's. `chat.read` carries no unread count (the phone refetches `GET /chats`). Not tested over a real nginx or against managed Postgres. Owner question: confirm Postgres `LISTEN/NOTIFY` instead of Redis, and that the Hub's `DATABASE_URL` in production is the direct port.


### Builder addendum, fix round 1 (4 Oct 2026)

Each defect has a test in `src/live/tests/live-hardening.contract.spec.ts` that failed on the previous code (12 of 13 failed, same symptoms the verifier saw) and passes now (13 of 13; with the first spec, 35 live tests).
- **D1** catch-up cursor is now time plus the last row (kind and id), read exactly after it; pages are time, then kind, then id, so nothing is skipped at any limit (six rows in one millisecond across chat and room, limits 1 to 5; a malformed position is 400). The 10 s lookback stays for cursors without a position. `docs/contract/LIVE.md` updated.
- **D2** `$executeRaw` for `pg_notify`: a normal publish logs nothing; a failing one warns once and the REST write still succeeds.
- **D3** a request with an `Upgrade` header that is not a WebSocket handshake for `/api/hub/live` is replayed on its socket without the header, so the Hub answers it as before. Compared side by side against an app without the live module: 6 path and method cases, each with a websocket and an h2c upgrade, identical status and body (before: hang).
- **D4** the gateway handles SIGTERM and SIGINT itself: sockets get 1001, then the signal is re-raised if nothing else handles it. Tested on a real child process: three sockets got 1001 and the process ended with SIGTERM inside 5 s (before: 1006). `main.ts` untouched, no new SHARED-CHANGES row.
- **D5** the listener sends itself a probe through the publish path on connect and every 30 s and must hear it within 3 s, else 4503, 503 on upgrades, an error naming a direct connection, retry. It is not up until the first probe returns. Tested with a real PgBouncer in transaction mode (never accepts, logs the cause; before: accepted and deaf) and with a listener made deaf with `UNLISTEN` (4503, 503, then recovers). Probes never reach the dispatcher or a client. `keepAlive` set on the feed connection.
- **U2** done: a socket with more than 1 MiB waiting is closed 4408. **U3** done for sockets not yet signed in: 20 per address (the 21st gets 429), the address read as the Hub's rate limits read it. **U4** not changed: dropping the sender's own mark cannot be done in the query without breaking exact paging; documented in LIVE.md (harmless, state).
- **Merged main** (a94f338 and later). Conflicts in `community-message.module.ts` and `.service.ts` resolved keeping both sides. Migration renamed `20261004150000_chat_read_at` (the old timestamp was older than main's latest). Gaps renumbered: G-79 and G-80 were taken on main, mine are now **G-184 and G-185**. `contract/openapi.json` regenerated, identical to the committed file.
- **Gates on the merged state** (own Postgres :5456 freshly seeded, own mock from the same checkout): `tsc` clean; eslint 4514 problems (3655 errors, 859 warnings), identical to origin/main exported and run the same way; `gates/run.py` 16 fail / 34 warn / 76 accepted, identical to main (files 732 to 751; it first showed 21 fail because the test helper file was not named as a test, renamed `live-test-kit.test.ts`, no gate edited); `check_baseline.py` OK. Contract suite twice: 154 suites, 3700 tests, 152 suites and 3679 passed, 3 skipped, 18 failed, identical both runs; the 18 are in `money/receipts/tests/receipt-units.spec.ts` (the runtime's Unicode digit table) and `data-export-request/tests/data-export.contract.spec.ts`, and the same 2 suites fail the same 18 tests on origin/main run here (NOT caused by this branch). Live specs alone: 35 of 35, twice, and first. Protected routes `--fresh`: 253 passed. The live specs leave the seeded tables as they found them (chat, community, block, profile, message, membership, participant counts identical before and after). Mobile `npm run check` exit 0 after the merge (43 suites, 754 tests).

## Verifier report

Verifier session, round 2, 4 Oct 2026 (same verifier as round 1, which found D1 to D5; round 1's report is replaced by this one, its findings are restated below with their result). Branch as it lands: backend `660c87d`, mobile `0d1bc6e`; both already contain the newest main (backend a94f338, mobile 8484195), so there was nothing to merge and no conflict. INBOX-09 is not merged. Own worktrees (branch, a real `origin/main` worktree with its own `npm ci` and build, mobile, WAWU-ID at 4715d17), own Postgres 16 clusters (:5457, :5458), fresh databases migrated and `npm run db:seed`, a mock WAWU ID started from the checkout under test, real `ws` clients and raw TCP against real running servers. **No open defect: status `review`.**

### Pass table

| Pass | Result | Evidence |
|------|--------|----------|
| Capability check (message to the other socket within 2 s; blocked user gets nothing) | **passed** | 36 ms against the real wawu-id login, 40 ms to 150 sockets over two instances; blocked side receives nothing, including a message stored just before the block. |
| V1 Gates | **passed** | Backend `tsc --noEmit` exit 0 on main and branch. eslint, no `--fix`, per file and rule: main 746 files, branch 765 files, 3655 errors and 859 warnings on both, 0 differing pairs. `scripts/gates/run.py`: main 732 files, branch 751 files, both 16 fail / 34 warn / 76 accepted, output identical apart from the file count (exit 1 on both, already failing on main). `check_baseline.py` OK on both (108). Mobile `npm run check` exit 0 on the first run: 43 suites, 754 tests, gates 195 files scanned 0 findings, 207 tasks. Contract suite, fresh seeded DB each run: **main (real checkout) 152 suites, 150 passed, 2 failed, 3644 passed, 18 failed, 3 skipped** on both runs; **branch 154 suites, 152 passed, 2 failed, 3679 passed, 18 failed, 3 skipped** on run 1, run 2 and run 3 (both live specs forced first); the failing 18 tests are the same 18 on main and branch in every run. The two live specs alone: 35 passed. See "The 2 failing suites" below. |
| V2 Contract | **passed** | Protocol, close codes, auth, cursor, limits: all as LIVE.md (re-run of round 1's probes, 25 + 37 + 12 checks, plus the new ones below). |
| V3 Regression | **passed** | Main vs branch side by side, real servers, 85 requests (community-message routes the web calls, chat routes, block, health, 404, 200 KB and 2 MB bodies, CORS preflight, error cases): 84 identical in status, headers and body; the one difference is the new `GET /live/catch-up` (404 on main). `scripts/protected-routes/run.sh --fresh`: branch 253 passed (244 required), main 253 passed. Raw-socket probes of non-live paths, below. |
| V4 Field trace | **passed** | Text, attachment and community message: identical JSON on REST list, socket and catch-up for sender and recipient. `readAt` moves only when the mark moves, the same-millisecond tie-break holds. |
| V9 Live seam | **passed** | `scripts/local/up.sh --detach` against a worktree of WAWU-ID 4715d17 (own ports, own Postgres): real `/auth/login` for a seeded user and creator, plus a brand-new person made through register, email-code verify and login; sockets opened with the real tokens (header and first frame); a real message reached the other socket in 36 ms with the server's id and time; `other.name` resolved by the real WAWU ID; catch-up returned the read mark. up.sh's `.env` and `.local` deleted afterwards; no test ran while they existed. |

### The five round-1 defects and the two unclear items, re-tested with my own probes

- **D1 fixed.** Exact: 4 and 12 messages in one millisecond at limit 1, 2, 3, 5, 11: none lost. Mixed: 3 chat messages, 3 read marks and 3 room messages all stamped the same millisecond, limit 1, 2, 3, 4, 5, 7, 8, 9, 10: none lost and none repeated, 1 to 9 pages. A row committed after the cursor was handed out (stamped before it) arrives on the next call. Forged cursors (unknown kind, non-uuid id, extra part, missing kind, SQL text) 400; a position naming a row that does not exist 200 and harmless; old non-exact cursors (`time|0`) still accepted; old exact cursors (`time|1`) cleanly 400.
- **D2 fixed.** 0 `Could not signal` lines on five servers across all runs. With `pg_notify` revoked from the database role: one WARN per failed publish (3 publishes, 3 lines), chat send, read mark and community POST all still 201/200 with the rows stored and `readAt` set, catch-up delivers the message anyway.
- **D3 fixed.** Raw sockets, main vs branch, 17 cases: `Upgrade` to `/health`, an unknown path, `/api/hub/live/`, upper-case header names, `Connection: keep-alive, Upgrade`, h2c, HTTP/1.0 (closes as on main), a POST whose body looks like a second request (one 400, no second answer: no smuggling), chunked POST + Upgrade (401), Content-Length plus Transfer-Encoding conflict (400 and close, as main), absolute-form target: identical status and body on both, none hangs; keep-alive reuse after the replay works. Pipelined `Upgrade` request then a normal one: main answers only the first, the branch answers both (better, not worse). On `/api/hub/live` itself, a missing key (400), a wrong version (400), a POST (405) and h2c (404) all answer and close, and a valid handshake (also with a query string) gets 101 and works.
- **D4 fixed.** Real servers with 8 open sockets: SIGTERM and SIGINT both give every socket close code 1001 and the process is gone in 22 to 31 ms, exiting by the signal exactly as it did before (no hang, no changed exit status). With no sockets open: gone in 13 to 16 ms. With `enableShutdownHooks` added to a copy of the entry (to prove the gateway does not fight Nest): 1001 to all, `Prisma disconnected` logged, 34 to 39 ms, no hang.
- **D5 fixed.** pgbouncer in transaction mode: the listener never comes up, every upgrade is HTTP 503, REST still serves, and the log says `LISTEN did not receive its own probe; DATABASE_URL must be a direct connection, not a transaction-mode pool`, retried at 1, 2, 4 s and on up to 30 s. A deaf listener (a TCP proxy that stops the LISTEN connection's answers only, the half-open case, with a healthy pool): noticed in 6.2 s, every socket closed 4503, new upgrades 503, and after the path healed sockets accepted again, events flowing, catch-up returning the message lost while deaf. The probe never reaches a client (a healthy socket saw nothing but chat events). A client cannot publish: the only frames accepted are `auth` and `ping` (anything else closes the socket, re-tested), and signals are made on the server from stored ids. Idle for 15 minutes, 30 probes per server: no log line, RSS and file descriptors flat (246 MB, 24 fds); each probe is one `pg_notify` per instance per 30 s.
- **U2 fixed (real sockets).** A client that never reads (its receive buffer set to 2 KB) under a 3000 x 9 KB flood was closed with `4408 too_slow` (it got 3.2 MB, then the close frame); the same person's reading socket stayed open, another user's message arrived in 47 ms, server RSS 262 to 285 MB.
- **U3 fixed (real sockets).** 20 unauthenticated sockets from one address are accepted, the 21st gets HTTP 429; behind the proxy the address is the right-most `X-Forwarded-For` entry (a different one has its own allowance); from a non-loopback peer (tested on 192.0.2.2) 20 sockets with 20 different spoofed `X-Forwarded-For` values still hit 429 on the 21st; 48 signed-in sockets from one address are all accepted (not counted); the limit releases when sockets close and when the 5 s auth timeout closes them.

### Everything else re-run

Round 1's probes, all green except where noted: sign-in and every bad-token case (forged, tampered, alg none, HS256 confusion, expired, other audience and issuer, 5 cases agreeing with REST), frames, 9th socket 4409, 30 s ping and dropping a client that never answers, authorization (stranger, pending, never-joined, removed, left, blocked either way, member who blocked the sender, host blocked by the sender), reconnect with 30 concurrent sends, 150 sockets over two instances (message through A reaches B and back, in order, once each), feed killed (4503, 503, recovery in about 1 s), Postgres stopped and started (4503, 503, recovery 1.0 s after it was back), `contract:build` regenerates `openapi.json` identical to what is committed (checked in round 1; the file is unchanged by the fix round: 164 lines). One of round 1's own probes, the tie check in the old catch-up script, was a flawed test (20-page cap), not a failure: the corrected probes are the ones above.

### The 2 failing suites (same on main)

`money/receipts/tests/receipt-units.spec.ts` (4 tests) and `data-export-request/tests/data-export.contract.spec.ts` (14 tests) fail identically on a real worktree of `origin/main` under my setup (two runs), so they are not the branch's.
- `data-export`: `fulfil()` returns false because `ADMIN_JWT_SECRET` is not set (the export link cannot be signed; the log says `Export ... not emailed yet`). With the variable set the whole spec passes, 24 of 24. Environment: the secret normally comes from `.env`, which a clean worktree does not have.
- `receipt-units`: this machine's Node 22.22.0 carries ICU 77.1, Unicode 16.0, and the receipts digit table already holds Unicode 17 (U+16FF4, a Yangqin sign): the table has 3 more characters than the runtime, and the 12 "Unicode 15 to 17" digit folds fail for the Unicode 17 ones. Environment for the test, but it could hide a real gap: if the droplet's Node 22 also has Unicode 16, the two Yangqin signs would not be masked as numbers in a receipt text. `deploy/provision.sh` installs "Node 22" without a minor, so which Unicode the droplet has is unknown here. Not INBOX-02's: see U5.

### Rules and diff

`git diff --stat origin/main...origin/wmt/INBOX-02`: backend 31 files, +3438 -9. `main.ts`, `deploy/`, `src/common/**`, guards untouched; `app.module.ts` is the one import and one entry for `LiveModule` (+4). `package.json` adds only `ws` ^8.22.0 and `@types/ws` ^8.18.2 (unchanged from round 1; `npm ls` shows 8.22.0 and 8.18.2, `npm ci` works, `npm audit` names neither). The helper `src/live/tests/live-test-kit.test.ts` is not matched by jest's `testRegex` (`.*\.spec\.ts$`): `jest --listTests` lists only the two specs, so it is not run as a test. The two live specs leave no rows: row counts of every table in a freshly seeded DB equal those after the specs ran. The migration, renamed `20261004150000_chat_read_at`, sorts after main's last (`20261004141500_legal_documents`) and applied to a DB that held main's schema and existing chat rows: rows kept, `readAt` NULL on all. SHARED-CHANGES `INBOX-02 #1` (names the renamed migration) and `#2` are present and match the diff. G-184 and G-185 are unique on main (highest is G-143) and on every open `wmt/*` branch (highest elsewhere is G-183, EXPLORE-03): recheck at merge. No em-dashes in `src/live` or LIVE.md; no TODO. G-79 and G-80 on main are other rows and the live gaps no longer use them.

### Findings

No defect. Remaining items:

**unclear U1 (owner, unchanged): Postgres LISTEN/NOTIFY instead of Redis**, and that the droplet's `DATABASE_URL` is the direct port (`deploy/README.md` already shows 25060; with a pooled URL the Hub now refuses sockets and says why).

**unclear U5 (owner): Unicode on the droplet.** The receipts digit table is at Unicode 17; Node 22.22.0 here is Unicode 16.0. Whether production masks the two Yangqin signs depends on the droplet's Node. Not this task's.

**unclear N1: the new per-address limit and bursts.** 20 unauthenticated sockets per address counts every upgrade until its sign-in finishes. After a deploy restart every client behind one shared address (an office, a mobile carrier's NAT) reconnects at once: more than 20 at the same moment get 429 for the excess (seen in my own test: 150 sockets opened 25 at a time lost 4), and a signed-in user arriving from an address that holds 20 stalled unauthenticated sockets is refused for up to 5 s. By design; the app (INBOX-04) must retry with backoff on 429.

**unclear N2: full database stall.** When the whole link to Postgres stalls with no reset (the pool and the listener both), the probe's send has no timeout of its own: sockets were closed 4503 after 82 s (when the connection finally died), against 6 s for a deaf listener alone. REST hangs too in that case.

**unclear N3: wording.** The probe-failure line always says `DATABASE_URL must be a direct connection`, also when the cause is something else (NOTIFY refused, link stalled); the line above it names the real cause.

**unclear N4: the renamed migration.** A database that already applied the old `20261003233000_chat_read_at` (the builder's and my round 1 local databases) fails the new one with `column "readAt" ... already exists` and must be recreated. Nothing in production has the old one (never merged).

**unclear N6 (round 1's U4, still there, harmless):** catch-up lists the sender's own read mark as a `chat.read`, which the socket never sends.

**NOT RUN.** Real nginx in front of the socket (config read, not exercised); managed Postgres with `sslmode=verify-full` for the LISTEN connection; the probe under heavy pool saturation (a probe that waits more than 3 s for a pool connection would close every socket 4503; not provoked). V5, V6, V7, V10 are not in this task's passes.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
