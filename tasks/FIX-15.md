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
- **Status:** verifying. Built on backend branch `wmt/FIX-15` (`850dec4`, pushed, no PR). Mobile branch `wmt/FIX-15` carries only this file, the log line and a SHARED-CHANGES row.
- **What it does now:** `POST /uploads/presign` is unchanged and still reserves a `StorageObject` row, counted at once so two big files cannot be presigned before either lands. Two ways now settle a reservation that never arrived:
  - `POST /uploads/confirm` (new, signed in, body `{ key }`, the `fileUrl` also works): the server asks the bucket. File there: row `confirmed`, counts as before (a row the sweep had given up on comes back). File missing: row `abandoned` now, space back at once. Bucket cannot be asked: 503, nothing changes. Another person's key answers 404 like a key that never existed.
  - The sweep (15 minutes after presign, run on every usage read, presign and allowance read) now settles every stale row of the person, not the first 50, and its writes are guarded on `pending`.
- **Next:** a verifier (V1, V2, V3, V4, V9). The lead decides when a screen calls the new route.
- **Open for the lead (not blocking):**
  - No screen calls `POST /uploads/confirm` yet. The three uploaders (`profile-edit/upload.ts`, `pro-listing/upload.ts`, the event banner in `events/host/hostApi.ts`) would call it after the PUT, taken or refused. That is an app task; until then the sweep is the only release, as before.
  - Residual: a person who calls confirm while their own PUT is still in flight gets the row `abandoned` and the file then lands uncounted until confirm is called again. Low (needs a person working against their own quota); the late-arrival path closes it whenever confirm is called again.
- **Gates (backend CI on `850dec4`):** suite 3 of 3 shards, netns, contract, protected routes, baseline: green. Executable gates: the same 16 FAIL lines as main, none in `src/storage`.
- **Mobile checks (docs only change):** typecheck and lint 0; jest 152 suites, 2756 tests, passing (one worker was killed for memory in the full run and its suite passed alone); gates 569 files, 0 fail, 5 warn; tasks 283.
- **History:** round history is in tasks/history/FIX-15.md.

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
