---
id: INBOX-08
title: Paid DM threads and the creator's queue
owner: DEV2
area: INBOX
order: 11
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-08 · Paid DM threads and the creator's queue

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A fan sees one thread per creator with every reply; a creator sees questions waiting, soonest deadline first, with the total. Additive only.

## Scope

Group paid DMs into threads; several reply bubbles in the window; creator's waiting list by deadline with the total waiting.

## Capability checks

- [ ] A creator sees questions ordered by deadline with the right total.

## Builder report

**Builder (3 Oct 2026, wawu-backend branch `wmt/INBOX-08`, from origin/main `fe1ec6c`; main had nothing newer at the final merge).**

- **Files (backend):** new `src/direct-message/paid-dm.{controller,service}.ts`, `paid-dm-view.type.ts`, `dto/paid-dm.dto.ts`, `dm-reply-writer.ts`, `tests/paid-dm.contract.spec.ts`; changed `direct-message.module.ts`, `direct-message.service.ts` (`respond` now goes through the shared writer; `lookupOtherParties` made public), `prisma/schema.prisma` + migration `20261003191500_dm_replies` (new `DmReply` table, two indexes, backfill of old `responseText`), `src/account-purge/account-data-map.ts` (`DmReply.creatorWawuId` AUTHORED), `contract/openapi.json` (4 paths added, 0 removed). Mobile repo: this file, `SHARED-CHANGES.md` (INBOX-08 #1), `BACKEND_GAPS.md` (G-64 to G-66), `docs/LOG.md`, `docs/PROGRESS.md`.
- **New routes (all under `/paid-dm`, none shadows a `/dm/*` route):** `GET /queue` (creator; open questions inside their window, soonest deadline first, `waitingTotal` counts all not just the page), `GET /threads?as=fan|creator` (one row per other person, latest activity first), `GET /threads/:wawuId` (every question with all its reply bubbles, oldest reply first), `POST /questions/:messageId/replies` (creator adds a bubble while the window is open). Money is `amountKobo`; the price column stays whole naira (nothing here moves money; paying, holding, refunding is INBOX-17).
- **Check "A creator sees questions ordered by deadline with the right total":** `paid-dm.contract.spec.ts` seeds three waiting questions with deadlines 2h, 8h, 20h apart from fans in a scrambled order plus four that must not count (answered, refunded, past deadline and not yet swept, another creator's): the list comes back 2h, 8h, 20h with `waitingTotal` 3; paging by 2 keeps the total and a three-way deadline tie pages without skips or repeats; answering one drops the total to 2. Passed.
- **Other behaviour tested:** one thread per creator across five questions; three reply bubbles oldest first; a follow-up lands in the same thread; the creator reads the same thread from their side; 401, 403 (plain account, wrong creator), 404, 400 (bad cursor, `as`, empty text), 409 (window passed, refunded, closed after the first reply).
- **Concurrency (the state change is the first reply):** six parallel replies to one question: all 201, status `responded` once, six bubbles, `responseText` equals one of them. Three replies racing the deadline sweep's own write: all refused, status `refunded`, no bubble. Five parallel `POST /dm/:id/respond` (the live web route): exactly one wins, four get 409, one bubble. The flip is one conditional `updateMany` (status and deadline in the WHERE) inside a transaction, in `DmReplyWriter`.
- **Protected routes:** `scripts/protected-routes/run.sh --fresh` 244 of 244 pass. `/dm/*` responses unchanged (the old `respond` keeps its messages and its answer-once rule, and is now race-safe).
- **Gate counts, before -> after (backend):** tsc 0 -> 0 errors; eslint 4459 problems (3609 errors) -> 4459 (3609), my files clean; `gates/run.py` 16 fail / 13 warn / 76 accepted -> same; `check_baseline.py` 108 entries, all owned -> same. Contract suite: before, with an unseeded database, 39 suites failed (243 tests; they need `npm run db:seed`) and 95 passed (2993); after, seeded, 0 failed, 135 passed (3259 tests, 23 of them new). Not run seeded on main, so the seeded before is not measured. Mobile `npm run check`: exits 0 before and after (431 tests, gates 0, 205 tasks).
- **Filed:** SHARED-CHANGES INBOX-08 #1 (schema, migration, openapi). Gaps G-64 (no notification to the fan on a reply), G-65 (server does not refuse a second question while one waits; the live send route is protected, INBOX-17 can), G-66 (no "usually replies in" route).
- **Not done:** no reply-count cap or length rule beyond 2000 characters (no ruling gives a number). The first-reply `responseText` is kept for the web. No mobile screens (task scope is backend). Local run: Postgres :5452 and mock WAWU ID :4001, both stopped.

## Verifier report

**Verifier (3 Oct 2026).** Branch `wmt/INBOX-08` in both repos (backend c14da2e, mobile 664fd7d), checked as it lands: origin/main is already an ancestor of both (backend fe1ec6c, mobile 42309b2), so there was nothing newer to merge. I did not write any of this code. Own worktrees; own Postgres 16 on :5453 (data under /var/tmp, migrated and seeded with `npm run db:seed`); own mock WAWU ID on :4001. Evidence scripts are in /var/tmp/v8pg/t (sidebyside.js, inbox08.js, conc.js, conc2.js, extra.js, v9.js); they are not committed.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | Backend: `tsc --noEmit` 0 errors on main and branch. eslint without --fix: main 659 files, 4460 problems (3610 errors); branch 665 files, 4460 (3610); compared per file and rule, no difference, the 6 new files are clean. `gates/run.py`: 9 gates, 16 fail / 13 warn / 76 accepted on both, the same findings, files scanned 645 (main) and 651 (branch). `check_baseline.py`: 108 entries, all owned, both. Contract suite, seeded, same mock, identical setup: main 134 suites, 29 failed tests in 2 suites (shop, marketplace-save), 3207 passed; branch 135 suites, the same 2 suites and the same 29 tests failing, 3230 passed (the 23 new ones). Those 2 suites hard-code a database name that must contain `wawu_hub_test`; re-run on databases so named (main and branch) both pass, 29 of 29. So the real count is 0 failed on both; the failures are my database name, not a flake and not the branch. Mobile `npm run check`: first run failed one test (`OpenWalletScreen.test.tsx`, a 5 s timeout, a file this branch does not touch); the second run exits 0, 485 tests, gates 123 files scanned 0 findings, 205 tasks. The branch's mobile diff is docs only. |
| V2 Contract | passed | `inbox08.js` over HTTP against the built app: 401 no token; 403 plain account on `/paid-dm/queue` and on a reply; 403 another creator and a third user replying; 404 unknown question; 400 for a bad uuid, `limit=0`, `101`, `abc`, `1.5`, a garbage cursor, `as=bogus` and `as=Creator`, an unknown query key, a missing, blank, numeric, array or 2001-character `text`, an extra body field and a non-JSON body (a bad body leaves the row untouched); 409 window passed and refunded. `contract:build` regenerated gives no diff; against main: 4 paths added, 0 removed, 0 changed; 8 schemas added, 0 changed. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh origin/wmt/INBOX-08`: 244 of 244 required tests pass. Side-by-side (main :3101 and branch :3102, same mock tokens, own databases, same fixed rows): 41 requests to every `/dm/*` route (inbox, threads, `/:id` as fan, creator and third user, bad and unknown ids, `respond` as no token, fan, third user, other creator, unknown, bad id, empty, whitespace, 2001 characters, extra field, no body, non-string, already answered, refunded, past the window, success, second success attempt, a 2000-character text, a padded text, and the lists after) gave the same status and body on both, 0 differences once `respondedAt` (the clock) is masked. Migration: on a database migrated to main and holding 5 DMs (answered with and without `respondedAt`, awaiting, refunded, a multi-line text with quotes), applying `20261003191500_dm_replies` leaves all 5 `DirectMessage` rows byte-identical (compared with a snapshot table), adds 3 `DmReply` rows (one per `responseText`, text exact, `createdAt` = `respondedAt`, or `sentAt` when that is null), none for awaiting or refunded; `migrate deploy` again applies nothing and the count stays 3. It adds only a table, a foreign key and two indexes. See finding 2 on running the raw SQL twice. The 409 for a lost race on `/dm/:id/respond` has the same text as main's sequential 409 ("already responded and cannot be responded to"), see Concurrency below. |
| V4 Field trace | passed | Creator writes a reply (`POST /paid-dm/questions/:id/replies`): stored in `DmReply` (and the first one in `DirectMessage.responseText` and `respondedAt`); read by the fan's `GET /paid-dm/threads/:creatorId` (bubbles oldest first, both bubbles), by the creator's `?as=creator` thread, by the creator's queue (total drops 3 to 2) and by the web's `GET /dm/:id` (`responseText` is the first reply, `respondedAt` equal on both). Price: `amount` whole naira on the row, `amountKobo` = 100 x on the new routes. Names come from WAWU ID. A third user gets 404 on someone else's thread (also with `as=creator`) and sees an empty thread list; a fan gets 403 on a reply. |
| V9 Live seam | passed | Real WAWU ID (worktree of /home/user/WAWU-ID at origin/main dbcb2f8) and the Hub from this branch via `scripts/local/up.sh --detach` on :3202 and :3201 (own databases `wawu_id_local_v`, `wawu_hub_local_v`, own Postgres). Signed in through the real `POST /auth/login` with the seeded creator and user (no injected token), put three waiting questions on the creator in the Hub database, and `GET /paid-dm/queue` returned them soonest first with total 4 (3 mine plus one the Hub seed has), sender names "Adaeze Okonkwo" and "Zainab Bello" that only the real identity service held; a reply returned 201, the fan read it in `GET /paid-dm/threads/:id`, the total dropped to 3; the plain user got 403. `down.sh` stopped both. No app screen exists in this task, so there is no phone or browser step. |

**Capability check, as written: "A creator sees questions ordered by deadline with the right total."** Passed over HTTP (`inbox08.js`). Three waiting questions at 20 h, 2 h, 8 h from three fans, plus an answered one, a refunded one, one past its deadline and not yet swept, and one for another creator: the queue returns 2 h, 8 h, 20 h and `waitingTotal` 3. `limit=2` returns 2 items with the total still 3 and a cursor; the next page returns the last one and no cursor. Five questions with one identical deadline plus one more (6) page by 2 over 3 pages with no skip and no repeat, in the same order as the single page, total 6 on every page. A reply drops the total to 2. Threads paged by 2 over 5 creators: 3 pages, 5 distinct.

**Concurrency, 10 rounds each, every round one outcome and consistent rows (own scripts, real HTTP, rows read back from Postgres).** (A) 6 parallel replies to one question: 10 of 10 rounds all 201, status `responded`, 6 bubbles, `respondedAt` set, `responseText` equals one of the 6, `refundStatus` not_owed. (C) 5 parallel `POST /dm/:id/respond`: 10 of 10 exactly one 201 and four 409, one bubble, `responseText` equals the winner's text and the 201 body; the 409 text is "This direct message is already responded and cannot be responded to.", the same as main gives for the same sequential state (I ran main's sequential second respond in the side-by-side). (D) 2 `/dm/respond` plus 2 `/paid-dm` replies at once: 10 of 10, bubbles equal the 201 count, at most one `/dm/respond` winner. (B1) a reply, a second reply and a `/dm/respond` blocked on the row lock while the sweep's exact conditional write (status awaiting and `deadlineAt` passed, to `refunded`/`owed`) commits inside the same lock: 10 of 10 every request 409, status `refunded`, `owed`, no bubble, `responseText` null. (B2) 10 randomised near-deadline runs of three requests against the sweep statement (3 ended `refunded`, 7 `responded`): only those two end states, `responded` with bubbles equal to the 201 count and not owed, or `refunded` with no bubble and all 409; plus 10 earlier runs where the replies landed after the deadline: all 409, `refunded`. I ran the sweep's statement as SQL, not through its 10-minute cron, since the cron cannot be fired on demand; the statement is the one in `scheduler.service.ts`. Note the per-address throttle (20 per second) answers 429 to parallel calls from one address; I varied `X-Forwarded-For` to get past it, the 429s are not a defect.

**Other checks.** R-13 and R-19: no code in the new files names a wallet, ledger, Fintava or refund call; the only writes are one conditional `updateMany` on `DirectMessage` and one `DmReply` create, in the writer's transaction; wallet, ledger, Fintava and purchase tables have identical row counts on the main-side and branch-side databases after all runs; nothing is held or moved. Diff against the builder report: backend 12 files, +1877 -38, and mobile 5 files match the report exactly (no extra, none missing). Additive only: one table, one relation field (no column on `DirectMessage`, no key added to a `/dm/*` body), two indexes, 4 new routes under `/paid-dm`, the account purge map gains `DmReply` (not a fenced file). Fenced files touched: `prisma/schema.prisma`, the migration and `contract/openapi.json`, with SHARED-CHANGES row INBOX-08 #1; no change to `src/common/**`, `app.module.ts`, guards. G-64, G-65, G-66 each appear once in BACKEND_GAPS.md and not on origin/main. No em-dash and no TODO or "for now" in any added line of src, prisma or the contract. No stand-ins: the new code reuses `DirectMessageService.lookupOtherParties`, `CreatorAccountGuard`, `deriveVerificationState`.

### Findings

1. **unclear (low):** the reply text rule is `@Matches(/\S/)`, which a zero-width space passes, so a creator can post an invisible bubble (201, verified with U+200B). The older `/dm/:id/respond` accepts even a blank or spaces-only text (same on main). No ruling names a rule; this is for the owner or the mobile composer to decide.
2. **unclear (low):** the migration's backfill `INSERT` has no guard, so running the raw SQL file a second time (outside Prisma, whose history never repeats it) inserts the answered questions again. `migrate deploy` is idempotent (verified); the file is not. Not a defect while migrations run only through Prisma. Also uses `gen_random_uuid()`, built in from Postgres 13; confirm the production version.
3. **unclear (low):** `GET /dm/inbox` and `GET /dm/threads` order by `sentAt` alone, so two questions with the same `sentAt` have no defined order. On main as well as the branch, and in my side-by-side the order of such ties differed between the two databases until I gave each row a distinct `sentAt`; the branch's new index could change the tie order in production. Real `sentAt` ties are millisecond coincidences and not a change this task made on purpose, so I did not count it as a defect.
4. **unclear (low):** a second tap on Send, or a retry, posts a second identical bubble: the reply route takes no `Idempotency-Key` and no ruling or contract line says it must (the route moves no money). The mobile composer will need to guard it.
5. **differs-for-recorded-reason (none to report):** the only visible change on a live `/dm/*` route is that two parallel `respond` calls now give one 201 and one 409 where main let both succeed and the second overwrote the first. That is a race, which the brief allows to differ, and it ends in the same 409 text main gives for the same sequential state. The builder's report states it.

No open defect. Status set to `review`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
