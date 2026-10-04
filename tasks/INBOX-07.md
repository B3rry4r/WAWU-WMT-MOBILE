---
id: INBOX-07
title: One inbox list with unread counts
owner: DEV2
area: INBOX
order: 23
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

Builder, 4 Oct 2026, branch `wmt/INBOX-07` in both repos, from backend main `a94f338` and mobile main `8484195` (neither moved by hand-over). Backend-only task: no screens, `src/api` untouched.
- **Files (wawu-backend):** new `src/inbox/` (`inbox.controller.ts`, `inbox.service.ts`, `inbox-feed.sql.ts` the one ranking, `inbox-cursor.ts`, `inbox-view.type.ts`, `dto/inbox.dto.ts`, `inbox.module.ts`, `tests/inbox.contract.spec.ts`, 28 tests); changed `src/app.module.ts` (mount), `prisma/schema.prisma` and migration `20261004213700_inbox_feed_index` (one index, `CommunityMessage(communityId, sentAt)`), `scripts/enrich-contract.js` (one line: nullable refs under `src/inbox/` as `allOf`), `contract/openapi.json` (regenerated: 2 paths, 8 schemas added, none changed). Mobile: this file, `SHARED-CHANGES.md` (INBOX-07 #1 to #3), `BACKEND_GAPS.md` (G-186 to G-189, and a note on G-4), `docs/LOG.md`, regenerated `tasks/INDEX.md` and `docs/PROGRESS.md`.
- **Routes (new):** `GET /inbox?cursor&limit&kind` (chats, paid threads and communities in one list; `kind` is the chip filter; 1 to 100 rows, 20 by default) and `GET /inbox/unread` (`{ total, chats, paidDms, communities }`, the Inbox tab's badge, G-4). A row is `InboxItem`: stable `id` (`chat:<id>`, `paid_dm:<side>:<wawuId>`, `community:<id>`), `kind`, `lastActivityAt`, `unreadCount`, `preview`, and one of `chat` / `paidDm` / `community`.
- **Order and cursor:** one SQL statement ranks all three sources by `(activity time DESC, row key DESC)`; the cursor is the last row's time and key, so a page boundary is exact even when rows share a millisecond. Mutation check: changing the cursor's `<` to `<=` fails 13 of 28 tests.
- **Unread, one definition per source, copied from the source route and checked against it in the spec:** chat = messages from the other person after the caller's read mark by (time, id), as `GET /chats`; room = messages from others not from blocked people after the read marker, else after joining, a host who never opened counts all, as `GET /communities/mine`; paid thread = the creator side counts questions still waiting inside their window, the fan side is 0. The badge sums the same column over the same rows the list ranks, so it equals the sum of what the list shows (tested over every page at page size 1 and 100).
- **Who appears (as the sources decide):** a blocked chat stays, `canMessage: false`; a pending join request and a removed member's room do not; a deleted account's chat and paid thread stay with an empty name; a chat never written in is not listed (default below); someone else's rows never.
- **Check "two unread chats and one unanswered paid question sees 3, and 2 after opening one chat":** passed in the spec over HTTP with mock WAWU ID tokens (two people message through `POST /chats/:id/messages`, a paid question is a `DirectMessage` row, `GET /inbox/unread` is 3; `POST /chats/:id/read` makes it 2; answering the question makes it 1), and live on the built server (:3071) with the same steps.
- **Other tests:** 401, 400 (limit 0 and 101, `kind=money`, unknown key, garbage cursor, cursor with a bad key); nine rows tied on one instant across the three kinds paged at sizes 1 to 100 with no loss or repeat; rows arriving between pages (a chat further down gets a message, a new chat and a new question arrive): nothing repeated, nothing below the cursor lost; a fixed number of queries for a page of 3 and a page of 40 (under 16, equal); a block removed brings the sender back into the room's count and equals `/communities/mine`. Scale probe (not committed): 400 chats x 30 messages, 150 rooms x 300, 900 questions for one person: `GET /inbox` 0.14 s warm, `GET /inbox/unread` 0.12 s; probe rows removed.
- **Hygiene:** the spec leaves all-table row counts equal to a fresh seed (counted over every table before and after), alone, run twice, first, and after the chat, community, paid-DM and block suites.
- **Backend gates, before (clean worktree of main `a94f338`, own `npm ci`) / after (`6c9c3af`):** `tsc --noEmit` 0 / 0; eslint without `--fix` 4,514 problems (3,655 errors, 859 warnings) / identical, `src/inbox` 0; `gates/run.py` 9 gates, 732 files, 16 fail, 34 warn, 76 accepted / 740 files, 16 fail, 34 warn, 76 accepted (same findings); `check_baseline.py` 108 entries all owned / same; `test:contract` on a seeded `wawu_hub_test`, own mock on :4001: 152 suites, 3,644 passed, 3 skipped, 18 failed / 153 suites, 3,672 passed (the 28 new), 3 skipped, 18 failed. The 18 are the two known environment-only suites on both sides (`money/receipts/tests/receipt-units.spec.ts`, the Node Unicode table; `data-export-request/tests/data-export.contract.spec.ts`, which needs `ADMIN_JWT_SECRET`: with it set, `src/data-export-request` passes 24 of 24 on main and on the branch). `scripts/protected-routes/run.sh --fresh`: 253 of 253, "all 244 required tests passed", before and after. `prisma migrate diff` against the migrated branch gives only main's own `DROP INDEX "ContentPiece_specializations_idx"`.
- **Mobile `npm run check`:** before 43 suites, 754 tests, gates 195 files 0 fail, task check passes; after (with the task file, LOG, gaps and shared-change rows in): exit 0, 43 suites, 754 tests, gates 195 files 0 fail, task check passes (no cold-cache `OpenWalletScreen.test.tsx` timeout either run).
- **Defaults (agent), owner may override:** (1) a fan's paid thread has no unread (G-187); (2) a chat opened and never written in is not listed, and a host's empty room has `lastActivityAt: null` and ranks last, as in `/communities/mine` (G-189); (3) blocks are followed per source, so a blocked person's chat message still counts (G-188); (4) one row per person and side for paid threads, so a person who is both asker and creator with the same account has two rows; (5) money requests and the WAWU thread are not in the list: no source writes them (G-186).
- **Live updates (INBOX-02, open, not depended on):** the list is a pure function of stored rows, with no feed table, so any `chat.message`, `chat.read` or room-message event for a person means "refetch `GET /inbox` and `GET /inbox/unread`", or patch the row whose `id` the event names; nothing here touches `src/live/`. A row whose activity moves while the person pages is shown once, at the top on the next refresh (G-189 (3)).
- **Filed:** SHARED-CHANGES INBOX-07 #1 (schema index and migration), #2 (`app.module.ts`), #3 (`contract/openapi.json`); BACKEND_GAPS G-186 to G-189 (ids after main's G-143; other open branches use up to G-185).
- **Owner questions:** the four in G-186 to G-189 (what the WAWU thread carries; whether an unseen reply is unread for the fan; one rule for blocked people; hide empty chats and rank empty hosted rooms).
- **Not done:** mobile types not regenerated (`src/api` fenced; `npm run api` runs after the backend merges); no push, no live delivery (INBOX-02, INBOX-03); the Money filter and WAWU thread (above). INBOX-02 also edits `src/app.module.ts`, `prisma/schema.prisma` and `contract/openapi.json`, so whichever merges second merges main in again and regenerates the contract.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
