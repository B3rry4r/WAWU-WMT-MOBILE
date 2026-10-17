---
id: FIX-60
title: The content share link opens the app
owner: YOU
area: FIX
order: -60
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T0
depends_on: []
decisions: [R-47, R-48]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-60 · The content share link opens the app

## Current state

As of 17 Oct 2026.
- **Status:** verifying (T0: a diff read by the lead, no verifier). Built by a Sonnet builder. Mobile `wmt/FIX-60` from `origin/wmt/MERGE-13` `4c7b2acd`; web `wmt/LINKS-01` (commit on top of `629393c`, never rebased). No backend, wawu-id, contract or migration change.
- **What it closes:** G-HOME-03-2 (H22). HOME-03's Share sends `https://wawuafrica.com/content/<id>`; LINKS-01 registered six app paths and not this one, so the link opened the join page. `/content/<id>` is now the seventh app link, set up the way `/u/<handle>` is.
- **Mobile:** `src/lib/appLinks.ts` (`CONTENT_PATH_PREFIX`), `app.json` (the Android filter gains `pathPrefix` `/content/`; `ios.associatedDomains` is unchanged, the website's file lists the paths; SHARED-CHANGES FIX-60 #1), `src/app/content/[id].tsx` (signed out: welcome screen; signed in: Home), `appLinks.test.ts` (seven paths, a route file for `/content/`), `appLinkRoutes.test.tsx` (signed out opens welcome; `wawu://` and `https` give the same route).
- **Web:** `app-links.ts` (`contentIdFrom`, `/content/*` in the Apple file), `middleware.ts`, `src/app/app-link/content/[id]/page.tsx`, `check-site-mode.mjs`, `app-links.test.ts`. The full site already has a page on `/content/<id>`, so the "Open in the WAWU app" page cannot sit there: in join-only mode the middleware rewrites `/content/<id>` to `/app-link/content/<id>` (same address, wording as `/u/<handle>`'s with "content" for "profile"); in full mode it does nothing and the full site's own page answers. `/app-link/...` asked for directly is closed in join-only mode.
- **Merge note (the base did not hold HOME-03):** `src/app/content/[id].tsx` is HOME-03's page and lives on `wmt/S1b`, not on `wmt/MERGE-13`. This branch adds a thin file at that path so the link and its tests work on this base. When `wmt/S1b` merges, take S1b's `src/app/content/[id].tsx` (it also sends a signed-out person to the welcome screen, so `appLinkRoutes.test.tsx` passes as it is). BACKEND_GAPS has no G-HOME-03-2 row on this base (S1b adds it): the row is added here as resolved; keep one row at the merge.
- **Needs a build or store release:** `app.json` changed native config, so `/content/` links open the app only from the next development or store build, and the Apple team id and Android fingerprint are still the owner's.
- **Not run:** GitHub CI, a real phone, the real website.
- **Next:** the batch pull request (mobile) and the website pull request.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/LINKS-01.md`, BACKEND_GAPS G-HOME-03-2 (on `wmt/S1b`), G-812

## Goal

A content link a person shares from the app (`https://wawuafrica.com/content/<id>`) opens the installed app on the content page, signed in or out, and shows the small "Open in the WAWU app" page on the website without the app.

## Scope

The files listed under Mobile and Web. Not touched: `/join`, any other website route, the full site's content page, any Hub or wawu-id code.

## Capability checks

- [ ] `app.json` claims `/content/` on `wawuafrica.com` and nothing else new; `appLinks.test.ts` checks it against `src/lib/appLinks.ts` and the route file.
- [ ] The website's Apple file lists `/content/*`; join-only serves the fallback page at `/content/<id>` (200, "Open in the WAWU app", `wawu://content/<id>`, not indexed); full mode serves the full site's own page.
- [ ] A signed-out `/content/<id>` opens the welcome screen.

## Owner sign-off

Not needed.
