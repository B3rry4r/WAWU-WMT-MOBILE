---
id: FIX-15
title: A refused upload does not count against storage quota
owner: YOU
area: FIX
order: 259
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-15 · A refused upload does not count against storage quota

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

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
