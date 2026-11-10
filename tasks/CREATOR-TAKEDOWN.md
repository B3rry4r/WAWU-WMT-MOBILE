---
id: CREATOR-TAKEDOWN
title: A creator can take a live or in-review piece down
owner: YOU
area: CREATE
order: 371
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-47, R-7]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# CREATOR-TAKEDOWN · A creator can take a live or in-review piece down

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-07 walk (walker C, MEDIUM-3, in `tasks/history/WEBAPP-07.md` on `wmt/BATCH-WEBAPP1`). Phone and web alike.
- **Found:** at the upload limit the app says "Take something down to make room for a new one." (`src/features/create/UploadsMeter.tsx:65`) and the review screen says "You can edit it while it waits", but only a turned-down piece opens anything in My uploads (`src/features/library/LibraryScreen.tsx:119`), and a live piece's own page has no edit, delete or take-down for its owner. So the words promise what no screen offers (R-47).
- **The Hub already allows it:** `DELETE /content/:id` (wawu-backend `src/content-piece/content-piece.controller.ts:145`, `content-piece.service.ts` `delete`) takes down the owner's piece in any status but removed, frees one place when it was not rejected, and is safe under repeats. No Hub change is expected.
- **Open for the owner before building (the lead carries it):** what buyers who paid for a piece keep once it is taken down.
- **Next:** schedule with the next phone batch (an over-the-air update needs the owner's word).

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-47, R-7
- `tasks/history/WEBAPP-07.md` (walker C) on `wmt/BATCH-WEBAPP1`

## Goal

A creator who wants room for a new upload, or wants a piece gone, can take any of their own pieces down (live or in review) from My uploads and from the piece's own page, with a confirm, and the place is freed at once. The words the app shows match what it does.

## Scope

- My uploads rows for live and in-review pieces, and the owner's view of a live piece: a take-down action through `DELETE /content/:id`, with the confirm the rejected-piece delete already uses.
- The limit banner and the review screen's words match what can really be done.
- Nothing else.

## Capability checks

- [ ] A creator with every upload place used takes a live piece down from My uploads, sees the count drop by one, and uploads a new piece.
- [ ] A creator takes a piece in review down from My uploads and from its page, on the phone and on the web.
- [ ] A buyer who paid for a piece sees what the owner ruled once it is taken down.

## Builder report

## Verifier report

## Owner sign-off
