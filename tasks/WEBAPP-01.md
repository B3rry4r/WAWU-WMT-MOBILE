---
id: WEBAPP-01
title: The web app builds and deploys from the repo
owner: YOU
area: WEB
order: 361
priority: after-launch
repo: wawu-wmt-mobile
type: setup
status: todo
depends_on: []
decisions: [R-127]
passes: [V1]
artboards: []
tier: T0
---
# WEBAPP-01 · The web app builds and deploys from the repo

## Current state

As of 9 Nov 2026.
- **Status:** todo. Cut by the lead from the WEBAPP-00 readiness check (`docs/analysis/WEB-APP-READINESS.md`).
- **Next:** a builder starts from the brief below.
- **History:** none yet. Reports go to tasks/history/WEBAPP-01.md.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

The owner connects this repo to Vercel and usewmt.com serves the app: one command builds the web export, `vercel.json` tells Vercel how, a refresh on any path opens that page, and links made on the web point at the web app.

## Scope

- `package.json` (a `web:export` script: `npx expo export --platform web`, output `dist/`), `vercel.json` (new: build command, output directory, every path rewritten to `/index.html` except real files, long cache for hashed assets and no cache for `index.html`, security headers including a Content-Security-Policy that allows only the Hub, WAWU ID, the bucket and the providers the app really calls).
- `src/lib/appLinks.ts`: on the web, links and return addresses (share links, the hosted selfie return, receipts) use the page's own origin; the phone app keeps `LINK_ORIGIN` as it is.
- `docs/WEB-DEPLOY.md` (new): the owner's steps in plain words: the Vercel project from this repo, `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_ID_URL` set in Vercel, usewmt.com, and the server settings that must list https://usewmt.com (Hub `CORS_ORIGIN`, WAWU ID allowed origins, the bucket's CORS for PUT, `NUVION_LIVENESS_REDIRECT_ORIGINS`, `ADD_MONEY_RETURN_URL`), each with where it lives (readiness section 4). The theme track's address (`wawuafrica.com/wawu-theme.mp3`) noted.
- Nothing else.

## Capability checks

- [ ] A user can open any usewmt.com path directly or refresh it and get that page, not a 404 (proved on the built `dist/` with a local static server using the same rewrite).
- [ ] A user who shares a link from the web app sends a usewmt.com link; the phone app still sends wawuafrica.com links (unit test on both platforms).
- [ ] The owner can follow `docs/WEB-DEPLOY.md` from an empty Vercel account to a live usewmt.com without asking anything.

## Builder report

## Verifier report

## Owner sign-off
