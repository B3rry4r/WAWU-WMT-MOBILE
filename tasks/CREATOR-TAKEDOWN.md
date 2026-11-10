---
id: CREATOR-TAKEDOWN
title: A creator can take a live or in-review piece down
owner: YOU
area: CREATE
order: 371
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-47, R-7, R-130]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# CREATOR-TAKEDOWN · A creator can take a live or in-review piece down

## Current state

As of 10 Nov 2026.
- **Status:** verifying. Built by the CREATOR-TAKEDOWN builder. Mobile `wmt/CREATOR-TAKEDOWN` (from `origin/wmt/RULINGS-1110` 33c7ade), Hub `wmt/CREATOR-TAKEDOWN` (from `origin/main` 7dd5b22). Heads are in the Builder report in `tasks/history/CREATOR-TAKEDOWN.md`.
- **Hub change (needed after all: the brief said none was expected):** `DELETE /content/:id` set `status: removed` and nothing else, and the Hub keeps a removed piece for its buyers only when an account deletion marked it. So a take-down cut off every buyer. R-130 says they keep it.
  - **Why a migration (written here before the SQL, as asked):** a creator's take-down and an admin's removal are both `status: removed` with no other trace, and the only existing marker (`AccountDeletionContent`) is restored to live by a cancelled deletion, so it cannot carry a take-down. One nullable column `ContentPiece.ownerRemovedAt`, written only by `DELETE /content/:id`. No new table. Nothing backfilled: pieces taken down before this stay gone for everyone. SHARED-CHANGES row CREATOR-TAKEDOWN #1; the migration has a rollback that refuses while any piece carries the mark.
  - **Where buyers keep it:** `readHidden` and `hiddenByDeletion` (`src/content-piece/deletion-hid.ts`) now count an owner-removed piece as the buyers' (completed `content` purchase only, as for a deletion). That one change opens the piece (`GET /content/:id`), its detail, media and signed links, course lesson playback (`/lessons/:id/play` reads the piece first), save, rate and comments. Also `GET /content/:id/engagement` (the piece's page reads it, so without it the buyer's page said "not available") and a later account deletion (`account-purge` keeps an owner-removed sold piece for its buyers instead of stripping its files).
  - **Gone for everyone else, as before:** the creator (removed is gone for the owner too), a pending or failed buyer, a tip, a signed-out caller. Profile, search, feed, My uploads and sale already refuse `removed`. `ownerRemovedAt` is never served (added to the three places that drop `uploadedVia`: `toResponse`, search, the `Omit` in `src/common/types/content-piece.type.ts`).
  - **Not covered, by design:** an admin cannot remove a piece its creator already took down (the admin route says "already removed"), so an owner-removed piece cannot be cut off from buyers by an admin. Its own task if the owner wants it.
- **App change:** My uploads rows for live and in-review pieces carry a Take down button (Trash icon) with the same confirm the rejected-piece delete uses; the place is freed at once (the uploads count, the list and the Me tab are read again); the row now opens the piece's own page for live and in-review pieces, and the owner's More menu there offers Take this down (the page leaves when it is done). The review screen now says "You can take it down while it waits" (there is no edit screen for a piece in review). The limit banner's words were already true once the button exists, so they are unchanged.
- **Fenced files touched:** Hub `prisma/schema.prisma`, `src/common/types/content-piece.type.ts` (type only) and the migration; SHARED-CHANGES.md row CREATOR-TAKEDOWN #1 (pending, lead). No mobile fenced file.
- **Phone-visible changes (over the air):** a Trash button on each live and in-review row of My uploads; tapping such a row now opens the piece's page; More on the owner's own piece page offers Take this down; the review screen sentence above. PHONE CHECK: none needed (no picker, camera, file or permission is involved; the Android back button closes the confirm sheet as it does on every sheet, proven in jest with `Platform.OS = android` for the My uploads sheet).
- **Open for the verifier:** see NOT RUN in the Builder report (web-export walk and pictures were not run in this round; the machine was starved and the budget ran out).
- **Next:** a T1 verifier: the three capability checks on the web export with a real buyer and creator on a stack that runs this Hub branch, pictures at 390 light and dark and 1440 of My uploads, the confirm sheet and the owner's page menu. The Hub migration needs the lead's stamp check and the SHARED-CHANGES row applied before merge; deploy order is migration first, then the Hub.

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
- [ ] A buyer who paid for a piece still opens it from My purchases after the creator takes it down (R-130); nobody else can find or buy it.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/CREATOR-TAKEDOWN.md](history/CREATOR-TAKEDOWN.md).

## Owner sign-off
