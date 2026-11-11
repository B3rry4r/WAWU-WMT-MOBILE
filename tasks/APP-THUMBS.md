---
id: APP-THUMBS
title: The app draws the small copy of a picture where it draws a small picture
owner: YOU
area: WEB
order: 382
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [HUB-THUMBS]
decisions: [R-47, R-118]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# APP-THUMBS · The app draws the small copy of a picture where it draws a small picture

## Current state

As of 11 Nov 2026.
- **Status:** verifying. Built by a Sonnet builder on mobile `wmt/APP-THUMBS`, contract from Hub main `bf3f4a3b` (HUB-THUMBS merged). Types regenerated with `npm run api`; nothing hand-written.
- **Helper:** `src/lib/thumbs.ts`. `copyFor`: w96 up to 96 device px, w640 up to 640, else the full picture; device px = drawn size times `PixelRatio.get()` (44 on 3x = 132 = w640). Size unknown: w640. The copy keeps the `#wmt-pos` position (R-96) of the full link. `useCopy`: copy first, full picture on the first failure, no loop.
- **Changed (copy drawn):** `Avatar` (prop `thumbs`), `MediaCard` (prop `imageThumbs`), `PositionedImage` (props `thumbs`, `drawn`); `pictureCandidates(.., small)` for rows. Callers: feed rail avatar, creator-card work tiles, Explore `CreatorCard`, Today `CreatorRail`, profile `NameBlock` (own and visitor), after-signup `FollowScreen`, content-detail maker row, Me grid tiles, search content rows.
- **Left full, by design:** a piece's own page and its media (`content-detail/Media`), `PictureViewer` zoom, feed posts and cards that fill the screen (`TemplatePost`, `PhotoSetPost`, `FeedCreatorCard`/`FeedProfessionalCard` portraits), profile covers (full width), photo-position and edit screens.
- **Left full, no field in the contract:** search people rows, known-follower faces, Saved and Purchases tiles, chat and community avatars, professionals directory, send payees (BACKEND_GAPS: the Hub serves no `*Thumbs` there, or declares none in the contract).
- **Proof:** tests `src/lib/__tests__/thumbs.test.tsx` and `src/components/__tests__/thumbsDrawn.test.tsx` (web, android, ios; pixel ratio, missing, null, failure fallback). tsc EXIT 0, lint EXIT 0, gates EXIT 0. Unique string in the export: `avatarThumbs` (5 chunks in this build, 0 in main's).
- **Stack run (own Postgres on 16529, Hub bf3f4a3b, storage stand-in 16528):** 7 avatars of about 5 MB uploaded, copies made. Creators were made by SQL and their piece pictures went up through the avatars folder, because a content upload needs a tier (402). Measurements, seeds and NOT RUN: `tasks/history/APP-THUMBS.md`, Builder report, round 0. Explore, Today and creators: 6 avatars 30,313 KB on main, 780 KB here. Pictures and the full jest summary are NOT RUN.
- **Open:** none graded. Phones get this with the next update, on the owner's word.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/HUB-THUMBS.md` and `tasks/WEBAPP-12.md` (the measurements and the web picture worker)
- DECISIONS.md R-118: the phone already makes its own smaller preview copy of a paid picture when a creator uploads it

## Goal

Every avatar, card, grid and thumbnail draws the small copy. The full picture is fetched only where the picture is shown full: a piece's own page, a cover at full width, or a zoom.

## Scope

- One helper picks the copy for the size drawn: `w96` for anything 96 px or smaller (avatars, chips, list rows), `w640` for cards and grids, and the full picture otherwise. It accounts for the screen's pixel ratio, so an avatar drawn at 44 px on a 3x screen (132 px) takes `w640`, not `w96`. Every screen that draws one of these pictures goes through it. No component is forked.
- **Fallback:** when a field is missing or null (an old picture before the backfill, a picture that could not be read, a website response), the full picture is drawn exactly as today. If a small copy fails to load, the full picture loads instead, once, with no loop.
- The web picture worker (WEBAPP-12) keeps the small copies like any signed picture.
- Phones get this with the next app update, on the owner's word (no store build).

## Capability checks

- [ ] Today, For you, Explore, a profile and creator suggestions fetch only small copies on a cold visit. Measure bytes and time at 1.6 Mbps against main, at 390 and 1440.
- [ ] A piece's own page still shows the full picture.
- [ ] A missing or broken small copy falls back to the full picture; no picture is ever blank.
- [ ] The pixel ratio is respected: avatars on a 3x screen are sharp.

## Builder report

Moved to `tasks/history/APP-THUMBS.md`.

## Verifier report

## Owner sign-off
