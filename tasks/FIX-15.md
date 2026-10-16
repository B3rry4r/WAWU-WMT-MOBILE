---
id: FIX-15
title: A refused upload does not count against storage quota
owner: YOU
area: FIX
order: 280
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-15 · A refused upload does not count against storage quota

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-15.md`): verdict merge after round 2 (round 1 was fix: one medium, closed), nothing medium or worse. Batch 3: stacked on `wmt/FIX-19` (this branch contains it); API types regenerated from backend `wmt/FIX-15` (9070e5f).
- **What it does now:** `POST /uploads/presign` is unchanged and still reserves a `StorageObject` row, counted at once so two big files cannot be presigned before either lands. Two ways settle a reservation that never arrived:
  - `POST /uploads/confirm` (signed in, body `{ key }`, the `fileUrl` also works): the server asks the bucket. File there: row `confirmed`, counts as before. A row that had been given up on comes back only if it still fits the person's storage; if not, the file is removed from the bucket and the answer is the presign's 413. File missing and the row younger than 6 minutes (the URL's life plus a minute): answer `pending`, row untouched, the sweep settles it, so confirming before the PUT frees nothing. File missing and older: row `abandoned`, space back at once. Bucket cannot be asked: 503, nothing changes. Another person's key, and any key with a control character, answer 404 like a key that never existed.
  - The sweep (15 minutes after presign, run on every usage read, presign and allowance read) settles every stale row of the person, not the first 50, and its writes are guarded on `pending`.
- **Open for the lead (not blocking):** no screen calls `POST /uploads/confirm` yet. The three uploaders (`profile-edit/upload.ts`, `pro-listing/upload.ts`, the event banner in `events/host/hostApi.ts`) would call it after the PUT, taken or refused. That is an app task; until then the sweep is the only release, as before.
- **Gates (backend CI on `1d757b5`):** suite 3 of 3 shards, netns, contract, protected routes, baseline, deploy-test-in-sync: green. Executable gates: the same 16 FAIL lines as main, none in `src/storage` (run 38911367198).
- **Mobile checks (docs only change):** typecheck and lint 0; jest 155 suites, 2832 tests, all passing; gates 581 files, 0 fail, 5 warn; tasks 283.
- **History:** round history, the round 1 verifier report and the round 2 builder report are in tasks/history/FIX-15.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: a refused upload confirmed at once keeps its space for 6 to 15 minutes; presign takes no part in the per-person lock; (rows 3 and 4 from round 1 are in the table already). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head. The lead decides when a screen calls POST /uploads/confirm (none does yet; the app task should confirm again after 6 minutes or accept the wait).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/PROS-03.md` ("Verifier report, independent (lead)", Outside this task)

## Goal

`POST /uploads/presign` reserves a `StorageObject` row before the upload happens, so an upload the storage host refuses still counts against the person's quota.

## Scope

Count only objects that arrived (confirm on completion, or sweep reservations never completed after a bounded time). The presign answer does not change.

## Capability checks

- [ ] A refused upload leaves the person's quota as it was (after the confirm or the sweep).
- [ ] A completed upload counts as today.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-15.md](history/FIX-15.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
