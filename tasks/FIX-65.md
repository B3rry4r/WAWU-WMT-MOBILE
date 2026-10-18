---
id: FIX-65
title: A purged account's uploaded files leave the bucket
owner: YOU
area: FIX
order: -65
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-17, R-50]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-65 · A purged account's uploaded files leave the bucket

## Current state

As of 18 Oct 2026, merging (lead): round 2 verified (CLEAN) and stacked in batch 17.
- **Status:** merging (lead). Round 1 was NOT CLEAN (F1, medium: an identity file lost on a retry pass; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-65.md`); round 2 (`9e6bc67`) fixed it and the verifier said CLEAN with one low (N1; report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-65-r2.md`). Backend `wmt/FIX-65` `9e6bc67`, this record `7860cf15`. Stacked in batch 17 by MERGE-17 (backend `wmt/MERGE-17`, mobile `wmt/MERGE-17`); not on main.
- **Merge (MERGE-17):** the backend merged with no conflict and no migration (`src/storage/storage.service.ts` now shares its client with `storage-client.ts`); BACKEND_GAPS.md took G-FIX-65-1 to -5 beside the other batch rows. Owner questions: Q-45 (G-FIX-65-1, identity file retention) stays with the owner. The verifier's lows are SWEEP-MONEY rows FIX-65 F2, F4 (closed by round 2), F5, N1, I1 and I2, and SWEEP-APP row FIX-65 F3.
- **Built:** by a Sonnet builder (tier T1). Backend `wmt/FIX-65` `9e6bc67` (round 1 `e57f29a`, from `wmt/MERGE-14` `195de50`); this record and the gap rows on mobile `wmt/FIX-65` (from `wmt/MERGE-14` `d76612f6`). No schema, no migration, no route, no app code, no Fintava file touched.
- **Found by:** SWEEP-MONEY L10 (SETTINGS-06 round 7): the purge deleted `StorageObject` rows and left the objects in the bucket.
- **Inventory (from the code):** every upload is a `StorageObject` row (`presignUpload` for everything a client or a chat sends, `putGenerated` for AI audio) and its key is `<folder>/<uploader id>/<uuid>.<ext>`, so the rows are the list. Nothing else writes to the bucket.
- **DELETE** (objects removed after the rows that pointed at them): `avatars`, `profile/cover`, `profile/work`, `content/preview` and `content/full` (listing files and photo-set frames) except sold pieces, `community/image`, `community/message`, `event/banner` and `event/speaker` (unless a standing event shows them), `chat/media`, `chat/file`, `legal/document` (what the person attached), `ai/voiceover`.
- **KEEP for buyers:** only the preview, full file and photo frames of a piece with a completed content purchase that was live when the deletion began (the SETTINGS-06 rule, R-50; unchanged). A sold piece that was not live, and every unsold piece, loses its files. Tickets and bookings are not kept by the purge today (EVENTS-07 refunds and removes the host's events), so their images go, except an event the sweep still keeps for held money.
- **OWNER (not deleted; rows refiled under `deleted-account`, counted in the account's `purgeNote`):** `kyc/id-document`, `service-application/document` (valid ID, signature, photo for CAC or NEPC), `professional/document` (licences), and any file named by a `KycSubmission`, `VerificationSubmission`, `ServiceApplication` or `ProfessionalProfile` row, whatever folder the client chose. Retention is a legal question for the owner. Lead default until the owner answers Q-45: identity files are kept and refiled, never deleted. No selfie is stored: `SelfieMatchAttempt` keeps outcome, time and confidence only, Nuvion keeps the documents. The purge already deletes the rows (BVN and NIN hashes, last 4, ID type, payout account); only the files remain.
- **Built:** `src/account-purge/purge-files.ts` (the table `FILE_KINDS`, `findIdentityKeys`, `eraseFiles`), `src/storage/storage-remover.ts` and `storage-client.ts` (one client factory shared with `StorageService`), `AccountPurgeService` (files go last, only when no other table failed), the sweep's `purgeNote`.
- **Round 2 (18 Oct 2026, verifier F1 and F4):** F1 (medium): the identity keys are refiled to `deleted-account` right after `findIdentityKeys`, before the row loop and not behind the files gate, so a pass that stops on one table can never leave a later pass to treat an identity document filed outside the three OWNER folders (for example `avatars/`) as an ordinary file; and when the keys cannot be read, the four identity tables (`KycSubmission`, `VerificationSubmission`, `ServiceApplication`, `ProfessionalProfile`) are not deleted that pass, so the same pass cannot lose them either. Spec: a one-table failure on pass 1 with an identity document in `avatars/`, kept and refiled after pass 2 (red on `e57f29a`, green now), and the failed look-up case. F4 (low): the drift guard also fails when a new caller of `putGenerated` or `presignUpload`, or a new `StorageObject` writer, appears outside the four known files (it fails with a planted file). F2 (low) is NOT built: see G-FIX-65-5. F3 and F5 go to the sweep.
- **Rules held:** files move only when the deletion row is `purging` or `purged`, 30 days over and WAWU ID confirmed it; only keys carrying the person's id; no transaction or lock across the bucket call; a row is deleted only after its object is gone; a missing object is fine, a refused one keeps its row and the next hourly pass retries (`purgeBlockedBy` names it). A server with no `STORAGE_*` deletes the rows as before and logs an error (changing that is G-FIX-65-5).
- **Checks:** `purge-files.contract.spec.ts` 5 of 5 (not due: nothing moves; due: 14 objects gone, sold and OWNER files and a standing event's banner stay, another person's untouched, first delete after the rows; re-run is a no-op; refused and missing keys; a foreign key is never deleted) and `purge-files.spec.ts` 5 of 5 (every folder the Hub writes has a decision). With the account, purge and storage specs that do not use the Fintava double: 15 suites, 293 tests passed. tsc 0, eslint 0 on the changed files, gates passed (0 fail), baseline ok, protected suite `run.sh --fresh` all 244 required tests passed.
- **Not run (Fintava double):** `account-deletion*.contract.spec.ts` (all but round 5 races, 8, 9 and host share) and the EVENTS-07 specs. The change to `AccountPurgeService` is additive (a third optional constructor argument, one extra result field); the lead's CI runs them.
- **Round 2 checks:** `purge-files.contract.spec.ts` 7 of 7 and `purge-files.spec.ts` 6 of 6 (the two new contract cases red on `e57f29a`); with the account, purge and storage specs that do not use the Fintava double (21 suites, 349 tests passed). tsc 0, eslint 0 on the four changed files, gates 0 fail, baseline ok. Product diff: 2 files, +65 -9 lines.
- **Open:** G-FIX-65-1 to G-FIX-65-5 in BACKEND_GAPS. The OWNER list is the owner's to rule (G-FIX-65-1).
- **Next:** an independent verifier; the lead merges it into the next batch.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-65-1 to G-FIX-65-4; `tasks/SWEEP-MONEY.md` (SETTINGS-06 L10)

## Goal

When an account is purged at the end of its 30 days, its uploaded files leave the storage bucket, except what buyers paid for and what the owner has yet to rule on.

## Scope (backend only)

`src/account-purge/purge-files.ts`, `src/account-purge/account-purge.service.ts`, `src/account-purge/account-purge.module.ts`, `src/account/account-deletion-sweep.service.ts` (the note), `src/storage/storage-remover.ts`, `src/storage/storage-client.ts`, `src/storage/storage.service.ts` (builds its client with the shared factory), two specs.

## Capability checks

- [x] A purge removes the DELETE kinds from the bucket and their rows.
- [x] Files of content a buyer paid for, identity and verification files, and an image of a standing event stay.
- [x] Nothing is removed before the 30 days end or while WAWU ID has not confirmed the deletion.
- [x] A second run does nothing; a missing object is not an error; a refused one is retried.
- [x] Another person's files are untouched.

## Owner sign-off

The OWNER list (G-FIX-65-1): how long WAWU must keep identity and verification documents.
