---
id: SETTINGS-09
title: A deleted account's ID documents are kept hidden for 5 years, then deleted
owner: YOU
area: SETTINGS
order: 187
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [SETTINGS-06]
decisions: [R-73]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# SETTINGS-09 · A deleted account's ID documents are kept hidden for 5 years, then deleted

## Current state

As of 19 Oct 2026, builder round 1 done. Waits for an independent verifier.
- **Status:** verifying. Backend branch `wmt/SETTINGS-09` @ b16cc69 (from `wmt/MERGE-25` 223fe89), mobile `wmt/SETTINGS-09` (this file, SHARED-CHANGES, BACKEND_GAPS). WAWU ID holds no document (no storage, no document table), so it has no branch.
- **Where the documents live:** the Hub only. `StorageObject` rows plus the objects in the bucket. SETTINGS-06's purge refiles the ID documents under `wawuUserId = 'deleted-account'` (the key still names the person) and leaves the objects: `kyc/id-document`, `service-application/document`, `professional/document`, and any file a verification, KYC, application or professional row named. The rows that named them are deleted by the purge; nothing reads the set-aside rows and no route lists them.
- **Built:** admin setting `id_docs_keep_days` (registry "Other rulings", days, default 1826 = 5 years, owner figure, whole number 365 to 3650; the floor stops a "5" typed for years from emptying the archive). A daily sweep `IdDocsRetentionService` (03:41, `src/account-purge/`), mounted by `AccountModule`.
- **What the sweep deletes:** for each deletion row `purged` with `purgedAt` more than the days ago and no `idDocsErasedAt`: the account's set-aside ID documents, chosen by `listKeptFiles(...).owner` (the very list the purge note counted). The object leaves the bucket first, then its row. Rows are deleted, not blanked: nothing reads them, `key` is unique and non-null, and the audit line is on the deletion row. Never touched: a live account, a deletion not yet `purged`, files kept for buyers, event images kept while an event stands, the content folders, the deletion row itself.
- **Audit:** one line per account on its deletion row (new columns `idDocsErasedAt`, `idDocsErased`, `idDocsKeepDays`, plus `idDocsClaimedUntil`): counts only. The log line says counts only too. An account with no document gets the line with 0.
- **Safe:** a second run finds `idDocsErasedAt` set and calls nothing. Two servers: a claim column (never a lock over a bucket call), one wins. A crash frees the claim when it expires; the rows are the inventory, so an object removed whose row stayed is found next run (the bucket says gone) and counted once. A refused object keeps its row, the others go, the account is tried again. A settings read that fails, or a server with no bucket, deletes nothing.
- **Migration:** `20261029100000_account_deletion_id_docs_erased` (four columns on `AccountDeletion`, additive) with `rollback.sql` that refuses while any account has `idDocsErasedAt` or `idDocsErased` set (tested both ways on a real database). SHARED-CHANGES SETTINGS-09 #1. No contract change (no route), so no contract rebuild.
- **Checks (backend, db `settings09_wawu_hub_test`, bucket stand-in on 7860-7867):** tsc EXIT 0; eslint changed files EXIT 0; new spec 16 of 16; touched specs by name 12 suites, 124 tests; gates 0 fail; protected suite 251 of 253 with the same 2 failures as `wmt/MERGE-25` (community messages `videoUrl`/`voiceUrl` widened, INBOX-22).
- **Open:** no blocker, high or medium. Lows G-SETTINGS-09-1 and -2 in BACKEND_GAPS. G-FIX-65-1 is answered by this task. The lead adds R-73 to DECISIONS.md (check_tasks reads it from there).
- **Next:** an independent verifier; then the batch merge.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- `DECISIONS.md`: R-73 (ruled 19 Oct 2026: kept hidden 5 years after the deletion, then deleted)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z6 to Z8: a deleted account's ID documents are not kept for ever. They stay hidden from everyone for the days in an admin setting (5 years at launch) after the deletion completed, then the files and their rows are deleted (R-73, answering Q-45).

## Scope

wawu-backend: the setting in the registry, the daily sweep, four additive columns on `AccountDeletion`. Nothing else of a deleted account, and nothing of a live one.

## Capability checks

- [ ] An account whose deletion completed more than the days ago has its ID documents (files and rows) deleted by the next sweep; one day short, nothing is.
- [ ] Changing the setting changes which accounts are due at the next run.
- [ ] A live account's documents, a deletion not yet completed, and the rest of a deleted account (content kept for buyers, event images) are untouched.
- [ ] Two sweeps at once, a sweep after a crash and a second sweep delete each file once and count it once.

## Builder report

Backend head `(set at push)` on `wmt/SETTINGS-09`. Files: `src/account-purge/id-docs-retention.{config,service,module}.ts`, `src/account-purge/purge-files.ts` (`listKeptFiles`, shared with `countKeptFiles`; comments only otherwise), `src/plan-settings/plan-setting-registry.ts` and `plan-settings.defaults.json`, `src/account/account.module.ts`, `prisma/schema.prisma`, the migration folder, `src/account-purge/tests/id-docs-retention.contract.spec.ts`.

## Verifier report

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
