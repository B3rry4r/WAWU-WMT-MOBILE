---
id: APP-THUMBS
title: The app draws the small copy of a picture where it draws a small picture
owner: YOU
area: WEB
order: 382
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [HUB-THUMBS]
decisions: [R-47, R-118]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# APP-THUMBS · The app draws the small copy of a picture where it draws a small picture

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from HUB-THUMBS (the Hub half), so the speed-up reaches the web app and the phones.
- **Found (live check, 11 Nov, after HUB-IMG-LINKS went live):** a creator's profile photo served to Explore is 1.6 MB, drawn at 44 px. WEBAPP-12 measured Today at 3.2 MB and For you at 5.2 MB of pictures on a cold visit at 1.6 Mbps.
- **The Hub half (HUB-THUMBS):** 96 px and 640 px WebP copies of avatars, profile covers, content covers and picture previews. Served as optional `avatarThumbs`, `coverThumbs`, `thumbnailThumbs` and `previewThumbs` (`{ w96, w640 }`) only to requests with `X-Wawu-Client: app`, which `src/api/client.ts` sends on every request, on phones and on the web build alike. The contract carries them (SHARED-CHANGES HUB-THUMBS #1).
- **Next:** a builder, once HUB-THUMBS is merged and live; regenerate the API types with `npm run api`.

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

## Verifier report

## Owner sign-off
