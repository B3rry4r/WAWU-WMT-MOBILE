---
id: INBOX-06
title: Free chat between users
owner: DEV2
area: INBOX
order: 3
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
