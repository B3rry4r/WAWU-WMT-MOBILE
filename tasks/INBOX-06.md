---
id: INBOX-06
title: Free chat between users
owner: DEV2
area: INBOX
order: 3
priority: launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-13]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-06 · Free chat between users

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-13 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Any two users can chat for free with text, photos and files; a blocked user cannot message (R-13). Additive only.

## Scope

Conversations, messages with images and files, read state, blocks enforced (per R-13).

## Capability checks

- [ ] Two users can chat; a blocked user cannot message.
- [ ] A user sees read state on their sent message.

## Builder report

Builder, 2 Oct 2026, branch `wmt/INBOX-06` in both repos (wawu-backend `a161041`, from main `433a826`; main unchanged at hand-over).
- **Routes (new, `src/chat/`):** `POST /chats` (open or find the chat with `wawuId`), `GET /chats` (cursor page, newest activity first, with `lastMessage`, `unreadCount`, both read marks, `canMessage`), `GET /chats/:chatId`, `GET`/`POST /chats/:chatId/messages` (cursor page newest first; text, photo, video or PDF; optional `clientMessageId` makes a resend return the first message), `POST /chats/:chatId/read` (read mark moves forward only), `POST /chats/:chatId/attachments` (presigned upload into `chat/media` or `chat/file`, checked against the chat and blocks first). Someone else's chat answers 404. Any WAWU ID user can be chatted with, Hub profile or not.
- **Blocks:** a block either way refuses open, upload and send with `403` and `reason.code: chat_blocked` ("You can no longer message this person.", never says who blocked); history stays readable; `canMessage: false`.
- **Read state:** each person has one read mark (`ChatParticipant`); a sent message reads `sent` until the other's mark reaches it, then `read`; sending moves your own mark.
- **Files:** migration `20261002180000_free_chat` (3 new tables), `prisma/schema.prisma`, `src/chat/*` (module, controller, service, DTOs, views, limits, spec), `src/app.module.ts` (mount), `src/storage/dto/presign-upload.dto.ts` (chat folders added to the type only, so `POST /uploads/presign` still refuses them; tested), `src/account-purge/account-data-map.ts` (purge drift guard: ChatMessage AUTHORED, ChatParticipant OWNED, ChatConversation COUNTERPARTY), `scripts/enrich-contract.js` (nullable chat refs written as `allOf`), `contract/openapi.json` regenerated (5 paths, 13 schemas added, nothing existing changed).
- **Check "two users can chat; a blocked user cannot message":** `src/chat/tests/chat.contract.spec.ts` over HTTP with real mock WAWU ID tokens: Ada and Bola exchange messages both ways, then Bola blocks Ada: both sends are 403 `chat_blocked` and nothing is stored, open and upload 403, history still 200; after unblock Ada sends again.
- **Check "a user sees read state on their sent message":** same spec: Ada's message is `sent`, Bola's `POST /read` returns `unreadCount: 0`, Ada then sees `read` on every message she sent and `otherLastReadAt`; a newer message is `sent` again.
- Also tested: 404 for outsiders on every route, 400 self/malformed id, 404 unknown account, empty or blank or over-long text 400, attachment keys from another user or another folder or never uploaded 400, PDF over the limit 413, cursor paging without repeats, bad cursor 400. 24 tests.
- **Provisional (owner):** `PROVISIONAL(CHAT-LIMITS)` in `src/chat/chat-limits.ts`: PDF up to 20 MB (only I13 names it), text 2,000 characters (same as community messages); photos and videos keep the existing storage limits.
- **Backend gates before (main `433a826`) / after (`a161041`):** tsc 0 / 0; eslint (no --fix) 4,496 problems (3,645 errors, 851 warnings) / same 4,496, `src/chat` 0; gates 9 run, 16 fail, 3 warn, 76 accepted on 553 files / 16 fail, 4 warn (the new PROVISIONAL), 76 accepted on 560; check_baseline 108 entries, all owned / same; `test:contract` (own Postgres on :5446, fresh DB, mock on :4021) before 40 failed / after 40 failed, 1,903 passed, 3 skipped: all 40 are 4 suites that hardcode a mock on :4001 (privacy-settings, kyc-submission, credits-state, account), which pass 40/40 with a mock on :4001. Protected route, route-shadowing, money-contract and data-map suites green (7 suites / 352 with chat).
- **Mobile:** `npm run check` exit 0 before (15 suites / 278 tests, gates 9 / 73 files / 0 fail) and after. No app code; `npm run api` not run (it copies backend origin/main, which has no chat routes until merge; INBOX-19 regenerates).
- **Shared changes filed:** SHARED-CHANGES `INBOX-06 #1` (schema and migration) and `#2` (`app.module.ts` mount), done here for the owner to accept at merge.
- **Not built here:** live delivery and typing (INBOX-02), push for a new message (INBOX-03), money in chat (INBOX-15, INBOX-19), the unified inbox (INBOX-07). Attachment links are signed when storage is configured; locally it is not (`STORAGE_*` unset), so `attachment.url` is null in the spec and a real upload was NOT RUN.

## Verifier report

Verifier, 2 Oct 2026, a fresh session that wrote none of this code. Checked out wawu-backend `a161041` and mobile `5c42763` in my own worktrees. Both mains moved while I worked (backend `433a826` to `ac2a057`, MONEY-11; mobile `6dc661a` to `246f395`), so I merged the newest main into each locally and re-ran everything on the merged state. Own Postgres 16 on :5447 with its own data dir, fresh databases for every run. Mock WAWU ID on :4001. Real `wawu-id` (origin/main `d9e6e0a`, own worktree) on :3102 and this branch's Hub API on :3101, started with `scripts/local/up.sh --detach`.

**Diff against the report:** `git diff --stat origin/main...origin/wmt/INBOX-06` has 14 backend files (2,477+, 4-), exactly the builder's list, and 4 mobile files (`SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`, this file). No app code, and no local copies of anything on main.

**Merging main:** backend `ac2a057` conflicts with this branch in `prisma/schema.prisma` (both add a model at the end and share the closing brace) and in `contract/openapi.json`. I resolved both locally to test the merged code and did not push it: kept both models and regenerated the contract with `npm run contract:build`. Main's `20261002180000_fintava_wallet` has the same timestamp as this branch's `20261002180000_free_chat`. Both applied in name order to a fresh database. Mobile: `SHARED-CHANGES.md` conflicted (main's MONEY-11 row #11). I kept both rows and pushed that merge.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend, before (main `ac2a057`) / after (branch with that main merged): `npx tsc --noEmit` exit 0 / 0. `eslint` without `--fix`: 4,496 problems (3,645 errors, 851 warnings) / the same 4,496, and `src/chat` has 0. `scripts/gates/run.py`: 9 gates, 557 / 564 files scanned, 16 fail / the same 16 (identical list, none in this task's files), 3 / 4 warn (the new `PROVISIONAL(CHAT-LIMITS)`), 76 / 76 accepted. `check_baseline.py`: 108 entries, all owned / the same. `npm run test:contract` on a fresh database with the mock on :4001: 98 suites, 1,938 passed, 3 skipped, 0 failed / 99 suites, 1,962 passed, 3 skipped, 0 failed. The unmerged branch alone gave 97 suites, 1,943 passed, 0 failed, against main `433a826`'s 96 suites, 1,919 passed. Mobile `npm run check` exits 0 on the builder's commit (15 suites, 278 tests, 9 gates, 73 files, 0 fail) and after merging main (16 suites, 285 tests, 9 gates, 75 files scanned, 0 fail, 0 warn; 200 tasks). |
| V2 Contract | failed (finding 1) | Every route was checked over HTTP against the running server (on the branch, then again on the merged build: 61/61 both times), plus 6/6 attachment checks with storage configured. Refusals checked: 401 without a token. 404 for an outsider on all 5 chat routes, and the chat is missing from their list. 400 when the wawuId is a phone written `08031234567` or `+2348031234567`, a handle, missing, or the caller's own id. 404 for an unknown uuid. 400 for an empty body, blank text, 2,001 characters, a number as text, another user's key, a key from a public folder, and a key never presigned. 400 for a bad cursor and for `limit=0`. 413 for a 21 MB PDF; 20 MB is accepted. 400 for `text/html`. `POST /uploads/presign` still refuses `chat/media`. A resend with the same `clientMessageId` returns the first message, and the database holds one row. The contract adds 5 paths and 13 schemas, and no existing path or schema changed (diffed against both mains). `contract:build` regenerates it byte for byte. Failed: a chat video is not held to the 512 MB upload limit (finding 1). |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh <ref>` with the lock from origin/main, on a fresh `wawu_hub_protected_test`. Before: `433a826` and `ac2a057`. After: the branch, and the branch with `ac2a057` merged. Each run: 253/253 tests, "all 244 required tests passed", exit 0. The dashboard's routes (the `admin/` contract suites) all pass on both the branch and the merged state. The migration only creates the 3 tables, their indexes and their foreign keys. The `presign-upload.dto.ts` change leaves the public DTO's folder list as it was (checked live). |
| V4 Field trace | passed (API level) | Over HTTP with two real sign-ins: text that A writes, B reads; B's unread count and `lastMessage` follow. B's read mark is written by `POST /read` into `ChatParticipant` and read by A as `readState: read` and `otherLastReadAt`. A newer message from A reads `sent` again. A block written by B (`/settings/privacy/blocked`) is read by both sides as `canMessage: false`, then `true` after unblock. A photo and a PDF that A attaches reach B with a fresh signed link, size, type and the PDF's name. `lastActivityAt` orders the list. Account purge: the data-map guard suite passes. No app screen reads these fields yet (INBOX-07 and INBOX-19), so the screen half is NOT RUN. |
| V9 Live seam | passed | Real login, no injected token. A (`user@test.wawu.dev`), B (`creator-pro@test.wawu.dev`) and the outsider (`creator-basic@test.wawu.dev`) signed in through wawu-id `POST /auth/login`. A fresh account C was made through `POST /auth/register`, the email code that wawu-id wrote to its log, `POST /auth/email/verify/confirm`, then login. Values only the server has: B's handle `zainab-pro`; C, who has no Hub profile, shows as "Chidi Verifier", the name from wawu-id; messages and read state that the other account wrote. Created and read back: chats, messages, read marks, a block. Script: `chat_http.py`, run on the branch and again on the merged build. |

**Capability checks (my own HTTP run, not the builder's spec):**
- "Two users can chat; a blocked user cannot message": **passed.** A and B exchanged messages both ways. B blocked A. A's send, B's send, A's open and A's upload request each got `403` with `{"statusCode":403,"message":"You can no longer message this person.","data":null,"reason":{"code":"chat_blocked"}}`, and the message count in the database did not change. History stayed readable, and both sides showed `canMessage: false`. After unblock, A's send got 201.
- "A user sees read state on their sent message": **passed.** A's message read `sent`. B's `POST /read` returned `unreadCount: 0`. A then saw `read` on every message she had sent, plus `otherLastReadAt`. A newer message read `sent`. Re-marking an older message did not move B's mark back.

**Rules:** Additive only: yes (new tables, routes and schemas only). Fenced files: `prisma/schema.prisma` with its migration is SHARED-CHANGES `INBOX-06 #1`. `src/app.module.ts` is `#2`, and the `contract/openapi.json` regeneration is described in the same row. Nothing under `src/common/**` or the auth guards changed. No em-dash in any added line. R-13 (free chat between any two users) is built for any WAWU ID account, Hub profile or not. Its money parts belong to INBOX-15 and INBOX-19, and its creator warnings to other tasks, as the builder says.

**Findings**

1. `defect`: chat photos and videos are not held to the 512 MB upload limit. `ChatUploadDto.contentLength` (`src/chat/dto/chat.dto.ts`) has `@Min(1)` and no `@Max(MAX_UPLOAD_BYTES)`. With storage configured, `POST /chats/:id/attachments` signed a 513 MB and a 600 MB `video/mp4` upload (200). The same 600 MB on `POST /uploads/presign` answers `400 "contentLength must not be greater than 536870912"`. `src/chat/chat-limits.ts` says photos and videos "keep the existing storage limits (MAX_UPLOAD_BYTES ...)", so the code does not do what its own limit says. Only the account's 2 GB storage allowance stops it. Unblocks when: the DTO (or the service) refuses a chat upload over `MAX_UPLOAD_BYTES`, with a test.
2. `defect` (merge): `wmt/INBOX-06` no longer merges cleanly into backend main `ac2a057`. It conflicts in `prisma/schema.prisma` and `contract/openapi.json`, and SHARED-CHANGES `#1`/`#2` describe a diff against the old main. My local resolution passed every gate, but the builder has to merge main (WORKFLOW section 8, step 3), regenerate the contract, and recheck that the `prisma migrate diff` line in `#1` still holds with main's `FintavaWallet`. Main's `20261002180000_fintava_wallet` has the same timestamp as `20261002180000_free_chat`. They apply in name order and do not touch each other, but a distinct timestamp would remove the tie.
3. `unclear`: the builder report says keys "never uploaded" get 400. The test only covers a key that was never presigned. A key that was presigned but never uploaded (`StorageObject` still `pending`) is accepted: I sent a photo and a PDF whose bytes were never PUT, both got 201, and B received signed links to objects that do not exist. Other upload flows accept `pending` keys the same way. Owner: should a chat message require the upload to be confirmed?
4. `unclear`: `PROVISIONAL(CHAT-LIMITS)`: the 20 MB PDF limit comes only from the I13 artboard, and 2,000 characters comes from community messages. CLAUDE.md rule 7 says limits come from the system or the owner, not the design. It is marked provisional, and the gate warns on it. The owner should confirm both numbers.
5. `unclear` (from reading the code, not reproduced): read marks compare only `createdAt`, at millisecond precision (`advanceMark` uses `lt`; `readState` uses `>=`; the unread count uses `gt`). If the other person sends two messages in the same millisecond and only the first is marked read, the second shows `read` to its sender and drops out of the unread count. Thirty concurrent sends (20 got through the throttler) produced no same-millisecond pair, so this was not reproduced. Owner or builder: accept it, or compare by (`createdAt`, `id`), the order the message list already uses.

Status set to `building` because of findings 1 and 2.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
