---
id: FIX-64
title: The school report spec waits for the first try to end, and the refund-notice migration can be undone
owner: YOU
area: FIX
order: -64
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-5]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-64 · The school report spec waits for the first try to end, and the refund-notice migration can be undone

## Current state

As of 18 Oct 2026, merging (lead): accepted and stacked in batch 16.
- **Status:** merging (lead). Accepted by the lead (cause: the spec's wait, not the product; the migration now keeps what it rewrites and has a rollback that a spec runs). Stacked in batch 16 by MERGE-16 (backend `wmt/MERGE-16` holds `29e400b`, mobile `wmt/MERGE-16` holds this record); not on main.
- **Merge (MERGE-16):** `school-report.contract.spec.ts` met SWEEP-MONEY-1 and SWEEP-MONEY-2, which fixed the same race a different way (a wait on `nextAttemptAt`); the file takes `firstTryDone` on all six waits (the lease release and `nextAttemptAt` are one update, so it covers them) and keeps SWEEP-MONEY-2's other wait. 12 of 12. The backup table's removal is SWEEP-APP row FIX-64 N1.
- **Status:** verifying. Backend `wmt/FIX-64` `29e400b` (from `wmt/SWEEP-APP-1` `c40a24e`); this record on mobile `wmt/FIX-64` (from `wmt/MERGE-13` `4c7b2acd`). Branch CI runs 39079664643 (protected routes), 39079664662 (gates), 39079664660 (branch checks). No Fintava file touched; no app code.
- **Found by:** CI run 39076927606 (`wmt/SWEEP-APP-1` `c40a24e`, shard 1, 23:10 UTC): SCHOOLS-09 "five servers sending the same report at once make one mail" got 2 requests for 1; and the lead's note that the em-dash migration cannot be undone.
- **1. The test, the cause: the TEST, not the product, and not the Lagos day.** `enrol` starts the first try in the background (`void deliverQuietly`). The spec waited for `attempts >= 1`, but `attempts` counts from the moment a try is claimed, before the relay is called. The wait ended with that try still on its way; the spec then set the relay to ok, cleared its requests and freed the lease (`dueNow`), and the first try's request landed after that, beside the one its own five callers made: 2 requests, 1 mail. The lease does hold a second caller off while a try is in flight (it was the spec that freed it), so a school never got two mails.
- **Not midnight.** `deliver` and the sweep read no day. With the clock started at 22:52, 22:59:45, 23:05 UTC and 23:59:50 the next day the fixed spec passes 12 of 12; the unfixed spec failed at 22:52 UTC too (a sibling case, "the answer is lost", `lastError` still null). The failure comes with a slow machine at any hour: CI was loaded, the local run is not.
- **Reproduced every time:** the relay stand-in holds a request 150 ms (`MailRelayDouble.delayMs`, default 0, reset per test). With the old wait, 3 of 12 failed (five servers: "Expected length: 1, Received length: 2", as on CI; the lost-answer case; the relay-down case).
- **Fix (spec and stand-in only, no assertion changed):** six waits use `firstTryDone` (`attempts >= 1` and the lease let go); the report group sets the 150 ms hold so any wait that ends early fails every time. `school-report.contract.spec.ts` 12 of 12.
- **2. The migration.** `20261026090000_no_em_dash_stored_refund_notice` now creates `NotificationRefundNoticeBackup` (notificationId, body, savedAt; a model in `schema.prisma`, SHARED-CHANGES FIX-64 #1), copies the id and body of every row its UPDATE changes, then runs the UPDATE. `rollback.sql` puts each body back (skipping a notice deleted or changed since), drops the table and forgets the migration. Additive; nothing reads the table; dropping it is its own removal task after two weeks.
- **Migration result (test DB, 8 notices: 4 match, 4 do not):** forward: 4 saved and rewritten, 4 untouched; rollback: all 8 bodies identical to before (same md5 over id and body), table gone, migration forgotten; forward again: 4 saved and rewritten as the first time. A notice deleted and one edited before the rollback: rollback runs, restores the other two, leaves the edited one. `prisma migrate diff` shows no drift from the new table (one ContentPiece index already differs on the base). Pinned by `src/notification/tests/refund-notice-dash-migration.contract.spec.ts` (4 of 4; it runs both files in a scratch schema, so the shared test database is not changed).
- **Checks:** tsc 0, eslint 0 on the 3 changed files and the new spec, gates passed (0 fail, 128 warn, 88 accepted), baseline ok. `src/schools` run: 10 of 11 suites pass (108 tests).
- **Slip, reported:** the `src/schools` run also picked up `school-enrolment.contract.spec.ts`, a Fintava-double spec. It was not edited, and it failed 32 of 32 with 401 (no mock WAWU ID was running on this machine; nothing reached a provider). It was not run again. CI runs it with its own setup.
- **Next:** an independent verifier; then the lead's batch. Low left open: none. The backup table's removal is a follow-up task two weeks after the migration ships with no rollback.

Status set to review by the records sync, 25 Oct 2026: merged as backend e208d904, lead acceptance in this file (accepted by the lead).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- wawu-backend `src/schools/enrolment/school-report.service.ts` (`deliver`, the lease), the migration folder named above

## Goal

A CI run never fails SCHOOLS-09 because the first try was still on its way, and the refund-notice rewrite can be taken back.

## Scope (backend only)

`prisma/migrations/20261026090000_no_em_dash_stored_refund_notice/` (`migration.sql`, `rollback.sql`), `prisma/schema.prisma` (one model), `src/schools/enrolment/tests/school-report.contract.spec.ts`, `test/schools/school-nuvion-harness.ts` (`delayMs`), `src/notification/tests/refund-notice-dash-migration.contract.spec.ts` (new).

## Capability checks

- [x] The spec's wait ends only when the first try has ended; the old wait fails every time with a slow relay and the new one passes.
- [x] Nothing in the report service changed: one mail per enrolment, the lease holds a second caller off.
- [x] Before the UPDATE, every row it changes is copied (id, body) into its own table, in the same migration.
- [x] `rollback.sql` restores every body exactly; forward, rollback, forward again run on rows that match and rows that do not.

## Owner sign-off

Not needed.
