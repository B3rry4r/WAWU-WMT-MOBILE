---
id: HUB-THUMBS
title: Pictures are served at the size they are drawn
owner: YOU
area: WEB
order: 381
priority: after-launch
repo: wawu-backend
type: flow
status: todo
depends_on: [HUB-IMG-LINKS]
decisions: [R-47, R-118]
passes: [V1, V3, V4, V6, V7, V9]
artboards: []
tier: T1
---
# HUB-THUMBS · Pictures are served at the size they are drawn

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from WEBAPP-12's measurements.
- **Found (WEBAPP-12):** pictures are served at upload size with no smaller copies (an avatar of 537 KB drawn at 44 px; Today 3.2 MB and For you 5.2 MB of pictures on a cold visit; first picture after 25 to 29 s at 1.6 Mbps). The Hub has no image library today (no `sharp` in package.json).
- **Estimate (WEBAPP-12):** Today and Explore pictures from 3.2 MB to about 0.1 MB; the first cold picture from about 28 s to about 11 s.
- **Next:** a builder on wawu-backend `wmt/HUB-THUMBS` after HUB-IMG-LINKS.

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

## Builder report

## Verifier report

## Owner sign-off
