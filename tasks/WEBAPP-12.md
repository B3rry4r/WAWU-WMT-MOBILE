---
id: WEBAPP-12
title: Pictures, previews and the app's own files load fast on the web
owner: YOU
area: WEB
order: 379
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: review
depends_on: []
decisions: [R-47, R-86]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-12 · Pictures, previews and the app's own files load fast on the web

## Current state

As of 11 Nov 2026, after builder fix round 2 (the last allowed).
- **Status:** review (lead, 11 Nov 2026): verified MERGE in round 2 (`wmt/WEBAPP-12-verify` 808aa235), merged into `wmt/BATCH-1111` for main. Its lows are rows in SWEEP-WEB.
- **Round 2 fixed:** (1) offline (`navigator.onLine === false`) a missing route file never reloads: the app's own error screen stays with Try again, and Try again reloads once when online (or draws the screen again if a reload was already tried). The address the person was going to is remembered (`pushState` and `replaceState`, 30 s) and put back before the reload, because the error screen resets it to `/`. (2) A session ending in one tab is broadcast (`BroadcastChannel` `wmt-session`; fallback: the `storage` event for the removed access token), and every other tab clears the picture cache and, 300 ms later, drops to signed out unless another account has signed in since (`src/lib/sessionBroadcast.ts`, `src/lib/pictureCache.ts`). The worker keeps a picture only while a marker entry (`https://wmt.invalid/session-open`) is in its cache: the page writes it while signed in (`useHoldPictures` in the root frame), deleting the cache deletes it, so between a session end and the next sign-in nothing is kept. Chosen over a message to the worker because the worker can be stopped by the browser at any time and loses memory; the cache survives.
- **Browser proof (round 2):** `npx expo export -p web --clear`, the bundle holds `https://wmt.invalid/session-open` (the one string unique to this round, in the `__common` chunk and in `wmt-sw.js`). Offline (DevTools offline): one page load, no chrome-error, "Something went wrong" with Try again; back online, Try again: second load, `/about` opens. Two tabs: A in both, 2 pictures held; tab 1 signs out: both caches empty, tab 2 on the welcome screen; tab 2 redraws a picture: not kept; B signs in in tab 1: only the marker is in the cache.
- **Known limits:** a direct switch of account in one tab (A to B with no sign-out, not reachable in the UI) clears the cache and holds nothing until the next reload. Two stale tabs reloading at once each reload once (the stamp is per tab). Error buttons at 1440 left as they are (the lead is filing it).
- **Still NOT RUN:** real Vercel edge and Spaces CORS, the combined WEBAPP-11 plus WEBAPP-12 run, iOS export, a real phone, the real Hub (stand-ins only).

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

## Measurements (builder, 10 Nov 2026)

Setup: Playwright Chromium at 390 x 844 (light), CDP `Network.emulateNetworkConditions` 1.6 Mbps down, 0.75 up, 150 ms; a new browser per cold visit; "warm" is the second visit in the same browser. The export is served by a small server with `vercel.json`'s headers, brotli and ETag 304s (the live site does the same: `curl -sI` of https://who-made-this-web.vercel.app/ gives `cache-control: public, max-age=0, must-revalidate` for the page; its entry bundle `/_expo/static/js/web/entry-50be836e...js` is `public, max-age=31536000, immutable`, 8,929,229 bytes raw, 2,058,126 brotli). Hub, WAWU ID, mail and storage stand-ins on ports 16100-16114 and my own Postgres on 16115 (14001 was down when I started; not switched afterwards). 6 creators, 36 live pieces with covers and previews (covers 2048 px, about 0.55 MB; free pieces' previews are the whole 4.7 MB photo, paid pieces' a 640 px copy like `previewCopy.ts`), avatars 2048 px. Screens: today (Home, Today tab), foryou (Home, For you), explore, profile (another creator's), piece, studio. "pictures" are requests to the storage host. Times are from navigation start.

### Before (batch head `7cc833f3`)
| screen | visit | first paint s | own files req / bytes | pictures req / bytes | API req | first picture s | all visible pictures s |
|---|---|---|---|---|---|---|---|
| today | cold | 11.8 | 8 / 2047 KB | 6 / 3224 KB (0 cached) | 12 | 28.8 | 28.9 |
| today | warm | 1.3 | 8 / 0 KB | 6 / 2 KB (0 cached) | 12 | 1.9 | 1.9 |
| foryou | cold | 11.7 | 8 / 2047 KB | 3 / 5181 KB (0 cached) | 15 | 12.5 | 38.9 |
| foryou | warm | 1.3 | 8 / 0 KB | 9 / 8405 KB (0 cached) | 17 | 19.1 | 45.4 |
| explore | cold | 12.0 | 8 / 2047 KB | 6 / 3224 KB (0 cached) | 20 | 29.3 | 29.4 |
| explore | warm | 1.2 | 8 / 0 KB | 6 / 3224 KB (0 cached) | 17 | 18.3 | 18.4 |
| profile | cold | 11.6 | 8 / 2047 KB | 8 / 4299 KB (0 cached) | 11 | 28.2 | 34.1 |
| profile | warm | 1.2 | 8 / 0 KB | 8 / 3763 KB (1 cached) | 11 | 1.5 | 20.9 |
| piece | cold | 11.6 | 8 / 2047 KB | 2 / 1071 KB (0 cached) | 14 | 17.6 | 17.6 |
| piece | warm | 1.4 | 8 / 0 KB | 2 / 1071 KB (0 cached) | 14 | 7.3 | 7.3 |
| studio | cold | 11.6 | 8 / 2047 KB | 0 / 0 KB (0 cached) | 6 | - | - |
| studio | warm | 1.2 | 8 / 0 KB | 0 / 0 KB (0 cached) | 6 | - | - |

### After
Cold and "warm" rows: the same measure; "warm-sw" is a second visit in a browser whose picture worker already holds the pictures (two unthrottled priming visits first).

| screen | visit | first paint s | own files req / bytes | pictures req / bytes | API req | first picture s | all visible pictures s |
|---|---|---|---|---|---|---|---|
| today | cold | 8.5 | 13 / 1492 KB | 6 / 3224 KB (0 cached) | 12 | 25.8 | 25.9 |
| today | warm | 1.1 | 13 / 0 KB | 6 / 0 KB (6 cached) | 12 | 1.7 | 1.7 |
| foryou | cold | 8.5 | 13 / 1492 KB | 9 / 8405 KB (0 cached) | 17 | 26.3 | 52.6 |
| foryou | warm | 0.9 | 13 / 0 KB | 9 / 5181 KB (6 cached) | 17 | 1.5 | 28.7 |
| explore | cold | 8.6 | 13 / 1473 KB | 6 / 3224 KB (0 cached) | 17 | 26.2 | 26.8 |
| explore | warm | 1.5 | 13 / 0 KB | 6 / 3224 KB (0 cached) | 17 | 19.0 | 19.7 |
| profile | cold | 9.1 | 13 / 1471 KB | 8 / 4299 KB (0 cached) | 11 | 25.8 | 32.0 |
| profile | warm | 1.4 | 13 / 0 KB | 8 / 3763 KB (1 cached) | 11 | 1.9 | 21.3 |
| piece | cold | 9.6 | 13 / 1475 KB | 2 / 1071 KB (0 cached) | 14 | 15.9 | 15.9 |
| piece | warm | 1.2 | 13 / 0 KB | 2 / 1071 KB (0 cached) | 14 | 7.1 | 7.1 |
| studio | cold | 8.8 | 13 / 1464 KB | 0 / 0 KB (0 cached) | 6 | - | - |
| studio | warm | 1.3 | 13 / 0 KB | 0 / 0 KB (0 cached) | 6 | - | - |
| today | warm-sw | 1.1 | 13 / 0 KB | 6 / 0 KB (6 cached) | 12 | 1.6 | 1.6 |
| foryou | warm-sw | 1.0 | 13 / 0 KB | 9 / 0 KB (9 cached) | 17 | 1.5 | 2.0 |
| explore | warm-sw | 1.0 | 13 / 0 KB | 6 / 0 KB (6 cached) | 17 | 1.8 | 1.8 |
| profile | warm-sw | 1.4 | 13 / 0 KB | 8 / 0 KB (8 cached) | 11 | 1.7 | 1.9 |
| piece | warm-sw | 1.3 | 13 / 0 KB | 2 / 0 KB (2 cached) | 14 | 1.6 | 1.6 |

### Causes (each checked)
1. **The app's own code is 2,047 KB brotli (8.9 MB raw) on every cold start, and nothing paints until it is in**: first paint 11.6 to 12.0 s. The bundle held all ~1,900 Lucide icons (`AArrowDown`, `Biohazard` present; the index import cannot be tree-shaken by Metro) and every route's code in one file. Source map of the after-icons build: app src 3.5 MB, reanimated 733 KB, expo-router 431 KB, react-native-web 284 KB, libphonenumber 273 KB; lucide 89 KB (was about 2 MB).
2. **A picture is downloaded again on every visit whose link was signed again**: the Hub signs with the current second in the link (`X-Amz-Date`), so the address changes each response. Seen: foryou warm 8,405 KB, explore warm 3,224 KB, piece warm 1,071 KB. Where a link is stored and served as is (Today's creator avatars come from `/creators` unsigned) the browser cache already worked: today warm 2 KB.
3. **Pictures are served at the size they were uploaded** (no thumbnails): an avatar is 537 KB where it is drawn 44 px; a free piece's preview is the whole photo (4.7 MB here). Cold pictures are bound by this: 1.6 Mbps moves about 200 KB/s, so 3.2 MB takes 16 s after first paint.
4. Not causes: the hashed-file cache headers (already immutable; a second visit loads all own files from cache, 0 bytes), lazy loading (expo-image on the web already writes `loading="lazy"` on its `<img>`), fonts (7 TTFs, about 40 KB brotli each, in the first paint's path but small next to the bundle).

### Fixes
- `app.json` expo-router `asyncRoutes: { web: 'production' }`: the export has 209 files instead of 3; entry 1.1 MB raw, a shared chunk 3.7 MB, route chunks 20 to 70 KB (SHARED-CHANGES WEBAPP-12 #2).
- `scripts/design/gen_icons.js` and `src/components/icon/icons.generated.ts`: one import per icon file (#3). Entry 8.93 MB to 6.90 MB raw.
- `public/wmt-sw.js`, `src/lib/pictureCache.ts`, `src/lib/WebFrame.tsx` (one import and call): the picture worker. It answers only GET `image` requests to another site that carry `X-Amz-Signature`; key = address without the query; falls back to a plain fetch if anything fails. `vercel.json` `/wmt-sw.js` no-cache (#1). expo-image on the web is a plain `<img>` with no cache key option, so the worker is where a stable key can be applied.
- Not built, and why: `priority` on the first picture (the web `<img>` is already loaded as soon as it is laid out; no measured gain); resizing on the client (cannot shrink bytes already sent); font trimming (the weights are used across the app; a phone-visible risk for about 0.3 s).

## Hub follow-ups (not built here; the Hub is read only)
1. **Stable links.** `src/storage/storage.service.ts:734-757` (`readUrlFor`, signs at "now", seven days, `READ_URL_SECONDS` line 99), `src/storage/cover-link.ts:31-39` and `freshUrlFor` / `coverUrlFor` (lines 771 and 791): sign at a rounded time (for example the start of the day) so the same object gets the same link all day, and a browser and a CDN can cache it. Measured gain without the worker: second-visit pictures 3.2 to 8.4 MB and 7 to 45 s become 0 bytes and about 1.5 s (what the worker already gives where it is active; the Hub fix also helps a first visit on a second device, a shared link, Safari when the worker is off and the phone's image cache).
2. **Thumbnails.** No resized copy exists anywhere (`src/content-piece/` and `src/storage/` have none; `preview-cut/` is audio, pdf and mp4 only). Make a 96 px and a 640 px copy at upload confirm (`src/storage/storage.service.ts` confirm, around lines 1040-1125) and serve them in `src/content-piece/feed-cards.service.ts:509` (`coverUrl`), `src/explore/explore.service.ts:173` (avatars) and `src/creator-discovery/creator-discovery.service.ts:187`. Estimated gain: Today and Explore pictures 3.2 MB to about 0.1 MB, cold pictures 28 s to about 11 s (first paint bound); a profile 4.3 MB to about 0.3 MB.
3. **`src/creator-discovery/creator-discovery.service.ts:187` returns the stored avatar link as it is.** A stored 7-day link stops working after seven days (a broken picture, not a slow one). It should go through `freshUrlFor` like `src/explore/explore.service.ts:173`.
4. **`Cache-Control` on the stored object**: `presignUpload` (`storage.service.ts` around line 697) sets none, so a link that does not change is still revalidated or guessed from Last-Modified. A one-year `public, immutable` on the upload (keys are uuids, never overwritten) makes the stable link of item 1 cacheable without a request.
5. Smaller uploads: free pieces upload the whole photo (4.7 MB here) because `pickFile` has no `maxSide` for content pictures (`src/features/create/pickFile.ts`, the mobile repo); covers already use 2048 px (`coverPick.ts`). A phone-visible change, so its own task with a PHONE CHECK.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-12.md](history/WEBAPP-12.md).

## Owner sign-off
