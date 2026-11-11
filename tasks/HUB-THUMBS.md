---
id: HUB-THUMBS
title: Pictures are served at the size they are drawn
owner: YOU
area: WEB
order: 381
priority: after-launch
repo: wawu-backend
type: flow
status: verifying
depends_on: [HUB-IMG-LINKS]
decisions: [R-47, R-118]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# HUB-THUMBS · Pictures are served at the size they are drawn

## Current state

As of 11 Nov 2026.
- **Status:** built, verifying. Hub `wmt/HUB-THUMBS` `fd6b776` (on `origin/main` `cb9a037`), not merged, no PR.
- **Built:** `sharp` 0.34.5 (exact pin; prebuilt linux-x64 through the deploy's existing `npm ci --include=dev`, no workflow change). Two WebP copies (96 and 640 px long side, orientation applied, all metadata dropped) of public pictures only: `avatars`, `profile/cover`, `content/cover`, `content/preview` (pictures only). Made at confirm, settle, the web's publish, the profile save, the reconcile and a sweep, all through `StorageService` (the only PutObject). Stored beside the original (`<name>.t96.webp`, `<name>.t640.webp`) with a `thumbs` StorageObject row of the owner (never counted in the allowance).
- **Served:** `avatarThumbs`, `coverThumbs`, `thumbnailThumbs`, `previewThumbs` as `{ w96, w640 } | null`, on `X-Wawu-Client: app` requests only (feed cards and strips, Explore, creator suggestions, profiles, GET /content, search, My purchases, My saved). The website's and dashboard's answers carry no new key.
- **Not done, on purpose:** ad artwork is public but has no owner folder and no StorageObject row, so it gets no copies (follow-up if wanted). The backfill (`scripts/backfill-thumbs.ts`) is written and NOT run: waiting for the owner's word.
- **Next:** SHARED-CHANGES `HUB-THUMBS #1` (types and contract), then app task APP-THUMBS (draw w96 in avatars, w640 in cards and grids, fall back to the full link on null). Verifier: see the report in `tasks/history/HUB-THUMBS.md`.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `tasks/WEBAPP-12.md` (numbers and line references: `feed-cards.service.ts:509`, `explore.service.ts:173`, `creator-discovery.service.ts:187`), DECISIONS.md R-118 (the phone already makes a smaller preview copy of a paid picture)

## Goal

Cards, avatars and grids get a small copy of the picture; the full picture is only fetched where it is shown full.

## Scope

- Make two smaller copies (about 96 px and 640 px on the long side, WebP or JPEG) of an uploaded picture when its upload is confirmed (the same paths VIDEO-PRIVACY cleans videos on: confirm, the web's pending rows at publish, the sweep), stored beside the original, never replacing it; a file that cannot be read is left and logged.
- Serve the small copy where a card, avatar or grid draws one (feeds, Explore, profiles, creator suggestions), additive fields beside the existing ones so the website and the dashboard are unchanged; the app reads them in a follow-up app task named here.
- The image library on the live server (`sharp` with its prebuilt Linux binary through `npm ci` in the deploy script): prove the deploy installs it; no other server setup.
- A one-off backfill for pictures already stored, written and NOT run, with its count and time estimate, for the owner's word.

## Capability checks

- [ ] A newly uploaded picture has its two small copies, and the feed, Explore and profile serve them.
- [ ] The website's and the dashboard's routes answer exactly as before (V3).
- [ ] A broken or huge picture never fails the upload.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/HUB-THUMBS.md](history/HUB-THUMBS.md).

## Owner sign-off
