---
id: WEBAPP-12
title: Pictures, previews and the app's own files load fast on the web
owner: YOU
area: WEB
order: 379
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-47, R-86]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-12 · Pictures, previews and the app's own files load fast on the web

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from the owner's walk of the live web app (10 Nov): "it is so hard for images to load, preview images and assets".
- **Not yet measured.** Causes to check, not assumed: the size of the pictures served (full-size originals where a card needs a thumbnail), signed links that change on every request so the browser cannot cache them, the cache headers on the web export's own files (`vercel.json`), the size of the JavaScript bundle and fonts, images loaded all at once instead of as they scroll in, and the distance to the storage bucket.
- **Next:** a builder on `wmt/WEBAPP-12` from `wmt/BATCH-1110`: measure first, then fix.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `vercel.json`, `docs/release/WALK-WEB.md`, and in wawu-backend (read only) `src/storage/` (how picture and preview links are signed) and `src/content-piece/` (covers and previews)

## Goal

Home, Explore, a profile and a piece's page show their pictures quickly on a phone-sized browser on a normal mobile connection, and a second visit loads from the browser's cache.

## Scope

- Measure first, on the web export behind vercel.json's headers with a throttled connection (Chromium's "Fast 3G" or similar) and a cold cache: for Home, Explore, a profile, a piece's page and Studio: bytes and time for the app's own files, for pictures, and for previews; how many requests; what is cached on a second visit. Write the numbers in the task file before changing anything.
- Fix what the numbers show, in the app and its web build: for example long-lived caching for the export's hashed files, pictures sized for where they are drawn, lazy loading below the fold, a placeholder while a picture loads, fewer requests on first paint, fonts trimmed. Anything that needs the Hub (thumbnails, stable cacheable links, resized copies on upload) is named with file and line and the measured gain for a follow-up Hub task, not built here.
- No change to how the phone app looks; any phone-visible change listed.

## Capability checks

- [ ] The before and after numbers for each screen are in the task file, measured the same way.
- [ ] A person on a phone-sized browser sees Home's and Explore's pictures appear quickly on a cold load and at once on a second visit.
- [ ] Pictures of each screen while loading and loaded at 390 light and dark and at 1440.

## Builder report

## Verifier report

## Owner sign-off
