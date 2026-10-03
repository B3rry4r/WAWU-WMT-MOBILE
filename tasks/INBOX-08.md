---
id: INBOX-08
title: Paid DM threads and the creator's queue
owner: DEV2
area: INBOX
order: 11
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
