---
id: WEBAPP-11
title: The web app is installable and asks to be installed on launch
owner: YOU
area: WEB
order: 377
priority: after-launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: []
decisions: [R-131, R-47, R-86, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-11 · The web app is installable and asks to be installed on launch

## Current state

As of 10 Nov 2026, branch `wmt/WEBAPP-11` (from `wmt/BATCH-1110`).
- **Status:** verifying. Built by a Sonnet builder; checks and pictures below.
- **Done:** the web export now carries a manifest (`public/manifest.webmanifest`, content type `application/manifest+json`), icons at 192 and 512 in any and maskable plus a 180 Apple touch icon (`public/pwa/`), and the Apple tags and `theme-color` in `public/index.html`. All made by `npm run pwa` (`scripts/web/gen_pwa.js`) from the app icon (app.json `icon`) and the theme tokens (theme colour = accent, background = dark page); `src/__tests__/pwaManifest.test.ts` fails if they drift.
- **Install screen** (`src/features/install/`): `detect.ts` (user agent and standalone flags), `InstallView.tsx` (the screen, shared parts only), `InstallAsk.web.tsx` beside the inert `InstallAsk.tsx`. The root layout draws it instead of the app, in a browser tab not opened from the icon, until "Continue in the browser" (remembered for the tab in sessionStorage, so a new tab or launch asks again). The router is not drawn meanwhile, so the opened address (invite, piece, payment return) is untouched and opens after the screen. States: Install button (browser offer caught as `beforeinstallprompt`, `prompt()` on press), menu steps (Chromium with no offer yet), iPhone and iPad Safari steps, in-app browser (Instagram, WhatsApp, Facebook, Messenger, X, TikTok, LinkedIn, Snapchat, Line, any bare web view): open in Safari (iOS) or Chrome with Copy link, Chrome/Firefox/Edge on iOS (open in Safari), a browser that cannot install (Firefox or Safari on a computer), installed.
- **Decisions (agent, owner may override):** `display-mode` standalone, fullscreen or minimal-ui and `navigator.standalone` all count as opened from the icon; the screen shows on desktop browsers too (R-131 names Chrome and Edge on a computer); the "pictures" for the iOS steps are the app's own Share, Plus and phone glyphs, not a drawing of Safari (design gap G-WEBAPP-11-1, R-29).
- **Fenced files:** SHARED-CHANGES WEBAPP-11 #1 (`src/app/_layout.tsx` three lines and one import; `package.json` one script). `vercel.json` unchanged: the CSP's `default-src 'self'` covers the manifest, `img-src 'self'` the icons.
- **PHONE CHECK:** none; the phone files are untouched (inert `InstallAsk.tsx` returns false).
- **NOT RUN:** real iPhone Safari and real Instagram or WhatsApp browsers (user agent and viewport only, in Chromium); the Android "opens from its icon" step on a real device (proved with Chromium's real installability, a real `beforeinstallprompt` and a Chrome `--app` window reporting `display-mode: standalone`); a piece link with real data (no Hub stack was started: the screen needs none; a `/content/<id>` link was proved to keep its address and be saved for return after sign-in); Lighthouse (Chromium's own `Page.getInstallabilityErrors` read instead: none).
- **Next:** a verifier.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-131, R-47, R-86 (web-only work never changes the phone), R-37 (the name and `<BrandMark>`)
- `vercel.json` (headers, CSP: the manifest and icons must load under it) and `docs/release/WALK-WEB.md`

## Goal

A person who opens the web app in a browser is asked to put it on their home screen first, with the right steps for their device, and from then on opens it from its own icon like an app.

## Scope

- The manifest (name "Who Made This?", short name, the app icon at 192 and 512, any and maskable, made from the app's own icon asset; theme and background colours from the theme tokens; `display: standalone`; `start_url` and `scope` `/`), served by the export with the right content type, and the Apple tags (`apple-touch-icon`, `apple-mobile-web-app-capable`, title, status bar). Lighthouse's installable check passes on the export.
- The install screen (R-131), web only, before anything else in a browser tab: Install button through `beforeinstallprompt` where the browser offers it; iOS and iPadOS Safari steps with pictures; in-app browsers (Instagram, WhatsApp, Facebook, X, TikTok and others detected from the user agent) told to open in Safari or Chrome, with a copy-link button; "Continue in the browser" at the foot. Never shown in standalone mode (`display-mode: standalone`, `navigator.standalone`) or on the phone. The address the person opened is kept and opened after the screen. Built from the app's shared parts (no board draws it; file the gap for the designer, R-29).
- No change to the phone app.

## Capability checks

- [ ] On Android Chrome a person opening the link is asked to install, taps Install, and the app opens from its icon without the screen.
- [ ] On iPhone Safari a person sees the Share, Add to Home Screen steps; inside Instagram's or WhatsApp's browser they are told to open it in Safari or Chrome and can copy the link.
- [ ] A person whose browser cannot install taps "Continue in the browser" and reaches the page they opened (an invite, a piece, a payment return keep working).
- [ ] Pictures of every state at 390 light and dark and at 1440.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-11.md](history/WEBAPP-11.md).

## Owner sign-off
