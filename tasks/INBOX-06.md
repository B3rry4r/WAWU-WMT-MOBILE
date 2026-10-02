---
id: INBOX-06
title: Free chat between users
owner: DEV2
area: INBOX
order: 3
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
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
- Also tested: 404 for outsiders on every route, 400 self/malformed id, 404 unknown account, empty or blank or over-long text 400, attachment keys from another user, another folder or never presigned 400 (a key presigned but never PUT is still accepted: verifier finding 3, an owner question), PDF over the limit 413, cursor paging without repeats, bad cursor 400. 24 tests.
- **Provisional (owner):** `PROVISIONAL(CHAT-LIMITS)` in `src/chat/chat-limits.ts`: PDF up to 20 MB (only I13 names it), text 2,000 characters (same as community messages); photos and videos keep the existing storage limits.
- **Backend gates before (main `433a826`) / after (`a161041`):** tsc 0 / 0; eslint (no --fix) 4,496 problems (3,645 errors, 851 warnings) / same 4,496, `src/chat` 0; gates 9 run, 16 fail, 3 warn, 76 accepted on 553 files / 16 fail, 4 warn (the new PROVISIONAL), 76 accepted on 560; check_baseline 108 entries, all owned / same; `test:contract` (own Postgres on :5446, fresh DB, mock on :4021) before 40 failed / after 40 failed, 1,903 passed, 3 skipped: all 40 are 4 suites that hardcode a mock on :4001 (privacy-settings, kyc-submission, credits-state, account), which pass 40/40 with a mock on :4001. Protected route, route-shadowing, money-contract and data-map suites green (7 suites / 352 with chat).
- **Mobile:** `npm run check` exit 0 before (15 suites / 278 tests, gates 9 / 73 files / 0 fail) and after. No app code; `npm run api` not run (it copies backend origin/main, which has no chat routes until merge; INBOX-19 regenerates).
- **Shared changes filed:** SHARED-CHANGES `INBOX-06 #1` (schema and migration) and `#2` (`app.module.ts` mount), done here for the owner to accept at merge.
- **Not built here:** live delivery and typing (INBOX-02), push for a new message (INBOX-03), money in chat (INBOX-15, INBOX-19), the unified inbox (INBOX-07). Attachment links are signed when storage is configured; locally it is not (`STORAGE_*` unset), so `attachment.url` is null in the spec and a real upload was NOT RUN.
- **Round 2 (builder, 2 Oct 2026, backend `8077ee9`):** merged backend main `ac2a057` (MONEY-11): schema keeps `FintavaWallet` and the chat models, contract regenerated with `npm run contract:build` (main's paths and schemas unchanged; 5 chat paths and 13 schemas added). Migration renamed `20261002190000_free_chat` (main has `20261002180000_fintava_wallet`); `prisma migrate diff` on a fresh database migrated to the branch still gives only main's `DROP INDEX "ContentPiece_specializations_idx"`. Finding 1: `ChatUploadDto.contentLength` now has `@Max(MAX_UPLOAD_BYTES)`; tested 513 MB and 600 MB `video/mp4` are 400, 512 MB passes the chat checks. Finding 5: read marks follow the list order (`createdAt`, then `id`) in `advanceMark`, `readState` and the unread count; tested with two messages at the same millisecond (reading the first leaves the second `sent` and unread). Findings 3 and 4 are left for the owner. Gates before (main `ac2a057`) / after: tsc 0 / 0; eslint 4,496 / 4,496 (`src/chat` 0); gates 16 fail, 3 warn, 76 accepted on 557 files / 16 fail, 4 warn (CHAT-LIMITS), 76 accepted on 564; check_baseline 108 owned / same; `test:contract` 99 suites, 1,964 passed, 3 skipped, 0 failed (fresh database, mocks on :4021 and :4001). Mobile `npm run check` exit 0 (16 suites / 285 tests, gates 0 fail on 75 files).

## ## Verifier report

Verifier, round 2, 2 Oct 2026. A fresh session that wrote none of this code. Checked: backend `8077ee9` (it already contains main `ac2a057`) and mobile `e012709` (it already contains main `246f395`). Neither main moved during the check, so this is the branch as it will land. Own Postgres 16 on :5447, made new for this round with its own data dir, and a fresh database for every run. Mock WAWU ID on :4001. Real `wawu-id` (`d9e6e0a`, own worktree) on :3102 and this branch's Hub API on :3101, started with `scripts/local/up.sh --detach`. Round 1's report is replaced; its findings are re-tested below.

**Diff against the report:** `git diff --stat origin/main...origin/wmt/INBOX-06` lists the same 14 backend files (2,577+, 4-). The migration is now `20261002190000_free_chat`. Since round 1, `src/chat/chat.service.ts`, `src/chat/dto/chat.dto.ts`, the spec, `SHARED-CHANGES.md` `#1` and this file changed. Each change matches the builder's round 2 note.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend, main `ac2a057` / branch `8077ee9`:<br>• `npx tsc --noEmit`: exit 0 / 0<br>• `eslint` without `--fix`: 4,496 problems (3,645 errors, 851 warnings) / the same 4,496; `src/chat` has 0<br>• `scripts/gates/run.py`: 9 gates. Files scanned 557 / 564. Fail 16 / 16, the identical list, none in this task's files. Warn 3 / 4 (the new `PROVISIONAL(CHAT-LIMITS)`). Accepted 76 / 76<br>• `check_baseline.py`: 108 entries, all owned / the same<br>• `npm run test:contract` on a fresh database: 98 suites, 1,938 passed, 3 skipped, 0 failed / 99 suites, 1,964 passed, 3 skipped, 0 failed<br>Mobile `npm run check` on `e012709` exits 0: 16 suites, 285 tests, 9 gates, 75 files scanned, 0 fail, 0 warn, 200 tasks. |
| V2 Contract | passed | My HTTP script against the running server: 61/61. Extra checks: 13/13 for the size limits and the same-millisecond tie, and 6/6 for attachments with storage configured.<br>• Refusals hold as in round 1: 401 without a token; 404 for an outsider on all 5 routes<br>• 400 when the wawuId is a phone written `0803...` or `+234...`, a handle, missing or the caller's own id; 404 for an unknown uuid<br>• Text, attachment-key, cursor and limit validation hold; a resend with the same `clientMessageId` stores one row<br>• Chat video 536,870,912 bytes (512 MB) gets 200. 536,870,913, 513 MB and 600 MB get `400 "contentLength must not be greater than 536870912"`. A 600 MB photo gets 400. A PDF of 20 MB plus 1 byte gets 413<br>• `npm run contract:build` regenerates `contract/openapi.json` identically to the committed file<br>• Against main, the contract adds 5 paths and 13 schemas and changes no existing one |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh` with the lock from origin/main, before (`ac2a057`) and after (`8077ee9`): 253/253 tests each time, "all 244 required tests passed", exit 0. The admin dashboard contract suites pass on the branch. The migration only creates the 3 chat tables, their indexes and foreign keys. `POST /uploads/presign` still refuses `chat/media`. |
| V4 Field trace | passed (API level) | Over HTTP with real sign-ins:<br>• text from A reaches B, along with the unread count and `lastMessage`<br>• B's read mark (`POST /read` into `ChatParticipant`) shows to A as `read` and `otherLastReadAt`<br>• a block written by B shows on both sides as `canMessage`<br>• a photo and a PDF from A reach B with a signed link, size, type and the PDF's name<br>The account-purge data-map guard suite passes. No app screen reads these fields yet (INBOX-07 and INBOX-19), so the screen half is NOT RUN. |
| V9 Live seam | passed | Real login, no injected token:<br>• `user@test.wawu.dev`, `creator-pro@test.wawu.dev` and `creator-basic@test.wawu.dev` signed in through wawu-id `POST /auth/login`<br>• a fresh account went through register, the email code from the wawu-id log, confirm, then login<br>• values only the server has: B's handle `zainab-pro`, and "Chidi Verifier" from wawu-id for the fresh account, which has no Hub profile<br>• chats, messages, read marks and a block were created and read back |

**Capability checks (my own HTTP run):**
- "Two users can chat; a blocked user cannot message": **passed.** A and B exchanged messages. After B blocked A, every send, open and upload request got `403` `chat_blocked` ("You can no longer message this person."), and nothing was stored. History stayed readable and `canMessage` was false on both sides. After unblock, A could send again.
- "A user sees read state on their sent message": **passed.** A's message showed `sent`, then `read` after B's `POST /read` (`unreadCount: 0`). A newer message showed `sent` again. The mark never moves back.

**Round 1 findings re-tested:**
- 1 (chat media over 512 MB) is **closed**. It is refused at the limit and accepted at exactly 512 MB, as listed under V2.
- 2 (conflicts with main) is **closed**. `origin/main` is an ancestor of `8077ee9`, so the branch merges with no conflicts. Migrations apply cleanly on a fresh database, with `20261002180000_fintava_wallet` and then `20261002190000_free_chat`. `prisma migrate diff` from that database to `schema.prisma` gives only main's own `DROP INDEX "ContentPiece_specializations_idx"`, as SHARED-CHANGES `#1` says. `contract:build` regenerates the committed contract identically.
- 5 (two messages in the same millisecond) is **closed**. B sent two messages over HTTP. The throttled API cannot force a same-millisecond pair, so I made the second message's `createdAt` equal the first's in the database. Before reading, A's unread count was 2, and the list showed the higher id first. When A read up to the lower id, the unread count was 1, and B saw the first message `read` and the second `sent`. When A read the second, the unread count was 0 and B saw both `read`. Re-marking the first did not move the mark back.

**Rules:** The change is additive only. Fenced files are covered: the schema and migration by SHARED-CHANGES `INBOX-06 #1` (updated for the rename), `src/app.module.ts` and the contract regeneration by `#2`. Nothing in `src/common/**` or the auth guards changed. No em-dash in any added line. R-13 is met: free chat works with any WAWU ID account. Money in chat belongs to INBOX-15 and INBOX-19.

**Findings**

1. `unclear` (carried from round 1, finding 3): a key that was presigned but never uploaded (`StorageObject` still `pending`) is accepted as a message. In this round I sent a photo and a PDF that were never PUT; both got 201, and B got signed links to objects that do not exist. Other upload flows accept `pending` keys the same way. Owner: should a chat message require a confirmed upload?
2. `unclear` (carried from round 1, finding 4): `PROVISIONAL(CHAT-LIMITS)` holds two limits. The 20 MB PDF limit comes only from the I13 artboard, and the 2,000-character text limit is borrowed from community messages. CLAUDE.md rule 7 says limits come from the system or the owner. They are marked provisional and the gate warns. The owner should confirm both numbers.

No open defects. Status set to `review`.

Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
