---
id: WEB-STRIP
title: wawuafrica.com keeps only join and the password pages; app links go to usewmt.com
owner: YOU
area: WEB
order: 386
priority: after-launch
repo: wawuafrica
type: removal
status: todo
depends_on: []
decisions: [R-48, R-126, R-127, R-133]
passes: [V1, V2, V3, V4, V7, V9]
artboards: []
tier: T1
---
# WEB-STRIP · wawuafrica.com keeps only join and the password pages; app links go to usewmt.com

## Current state

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-133.
- **Today** (wawuafrica `origin/main` bd72412): production runs join-only (`src/lib/site-mode.ts`). Open pages are the company pages, `/join`, `/join/paid`, the legal pages, `/reset-password`, and R-126's `/sign-in`, `/sign-up`, `/forgot-password`, `/create/new`, `/create/library` (rewritten to `src/app/upload-site/`). Every other path is sent to `/join` (`src/middleware.ts`, `redirectToJoin`).
- **Faults found by the lead:** WAWU ID's activation mail links to `<host>/activate?token&email`; wawuafrica has no `/activate` page and join-only mode sends it to `/join`, so an activation link never works. Old app links (a profile, a piece, a receipt) also land on `/join`.
- **Deploy:** the Vercel project `wawu` builds `main` only; merging deploys wawuafrica.com.
- **Next:** builder on wawuafrica `wmt/WEB-STRIP`, then a T1 verifier.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md` (mobile repo)
- DECISIONS.md R-48, R-126, R-127 and R-133
- wawuafrica: `CLAUDE.md`, `src/lib/site-mode.ts`, `src/middleware.ts`, `scripts/check-site-mode.mjs` (`npm run check:site-mode`), `src/app/upload-site/`, `src/app/reset-password/`, `src/app/(auth)/forgot-password/`, `src/app/join/` (JoinSuccess and every link out), `docs/03_USER_FLOWS.md`
- wawu-id: `src/auth/auth.controller.ts` (`POST /auth/activate`, `POST /auth/reset-password`), `src/auth/dto/activate.dto.ts`, `src/provisioning/provisioning.service.ts` (the activation link)
- The mobile repo `src/app/` (the usewmt.com routes, for the redirect map)

## Goal

On wawuafrica.com a person can join, reset or set their password, and read the legal pages. Anything that was the app takes them to the same place on usewmt.com.

## Scope

- **Close** `/sign-in`, `/sign-up`, `/create/new`, `/create/library` in join-only mode (out of `OPEN_PAGES` and `UPLOAD_SITE_REWRITES`). Keep `/forgot-password` and `/reset-password` working, and every link on them that went to sign in now goes to `https://usewmt.com/sign-in` (or the usewmt.com route the mobile repo really has).
- **Add `/activate`.** A page that reads `token` and `email`, asks for a new password twice and calls WAWU ID `POST /auth/activate` through `src/lib/api/`. On success it says the account is ready and links to usewmt.com sign in. Expired or used token: a plain sentence and a link to forgot password. Follow the reset page's look and the house rules (tokens only, no inline styles, no em-dashes).
- **Redirect app paths to usewmt.com** with a permanent redirect, keeping the path and query where usewmt.com has the same page, else its home. Build the map from the mobile repo's `src/app/` routes, not from memory. Never redirect `/.well-known/*`, `/admin*`, `/_next/*`, the company pages, the legal pages or site files. Everything else that is not open still goes to `/join` only if it is not an app path.
- **Links on the pages that stay** (the join flow, its success page, headers and footers, the company pages): any link to a closed page points at usewmt.com.
- **Remove what nothing serves any more:** the `upload-site` pages that are now unreachable and their only-used helpers, in this same task (adding something also removes what it replaces). Leave full mode (`SITE_MODE=full`) building.
- **Proof:** `npm run check:site-mode` extended for every rule above, plus `npm run build`, lint, typecheck and the copy check. Screenshots at 390 px, dark and light, of `/activate` (form, success, expired), `/forgot-password` and `/reset-password`, from a local production build in join-only mode.

## Capability checks

- [ ] A person with an activation link sets their password on wawuafrica.com and is pointed to sign in on usewmt.com.
- [ ] A person who forgot their password resets it on wawuafrica.com.
- [ ] `/sign-in`, `/sign-up`, `/create/new`, `/create/library` no longer open on wawuafrica.com in production mode.
- [ ] An old profile, piece or receipt link on wawuafrica.com opens the same place on usewmt.com.
- [ ] `/.well-known/assetlinks.json`, `/.well-known/apple-app-site-association`, `/admin` and `/join` are untouched.

## Builder report

## Verifier report
