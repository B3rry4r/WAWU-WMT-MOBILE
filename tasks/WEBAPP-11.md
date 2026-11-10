---
id: WEBAPP-11
title: The web app is installable and asks to be installed on launch
owner: YOU
area: WEB
order: 377
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: []
decisions: [R-131, R-47, R-86, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: []
tier: T1
---
# WEBAPP-11 · The web app is installable and asks to be installed on launch

## Current state

As of 10 Nov 2026.
- **Status:** todo. Cut by the lead from R-131 (owner, 10 Nov).
- **Today:** the Expo web export (`app.json` web: `output: single`, favicon only) has no web manifest, no maskable icons and no Apple home-screen tags, so browsers do not offer it as an app; nothing asks a person to install it.
- **Next:** a builder on `wmt/WEBAPP-11` from `wmt/BATCH-1110`.

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

## Builder report

## Verifier report

## Owner sign-off
