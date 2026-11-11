---
id: WEB-STRIP
title: wawuafrica.com keeps only join and the password pages; app links go to usewmt.com
owner: YOU
area: WEB
order: 386
priority: after-launch
repo: wawuafrica
type: removal
status: verifying
depends_on: []
decisions: [R-48, R-126, R-127, R-133]
passes: [V1, V2, V3, V4, V7, V9]
artboards: []
tier: T1
---
# WEB-STRIP · wawuafrica.com keeps only join and the password pages; app links go to usewmt.com

## Current state

As of 11 Nov 2026.
- **Status:** built, verifying (T1). wawuafrica branch `wmt/WEB-STRIP` on `origin/main` bd72412; nothing merged or deployed.
- **Built:** `/sign-in`, `/sign-up`, `/create/new`, `/create/library` are closed in join-only mode and the `upload-site` pages, `components/site-upload`, `lib/site-upload` and `lib/api/site-upload.ts` are deleted (with the `uploadOnly` props and the `client: "site"` upload option). `/forgot-password` moved out of the `(auth)` group and draws the `/join` frame in join-only mode; `/reset-password` unchanged except its sign-in links. New `/activate` (WAWU ID `POST /auth/activate`, form, success, expired). Old app paths get a 308 to usewmt.com (`src/lib/app-redirects.ts`, built from the mobile repo's `src/app/`); every Sign in link on a page that stays is `appUrl("/sign-in")`.
- **Proof:** `npm run check:site-mode` (static 1154, with `--mobile-src` 1364, live join-only 2140, live full 1696; 0 failed), typecheck, lint, copy check and `npm run build` exit 0. Pictures at 390 px, dark and light, from a local production build in join-only mode (WAWU ID faked in the browser).
- **For the verifier:** run the commands in the builder report; look at `/activate` (form, success, expired), `/forgot-password`, `/reset-password`; send a request for each row of the redirect map and for the never-redirect list; `SITE_MODE=full` still builds and serves.
- **Decisions the builder made (the lead may override):** the redirect carries `Cache-Control: public, max-age=3600` (a permanent answer, but SITE_MODE can be flipped back); `/payment/return` and `/api/*` stay a 307 to /join (not app pages); `/settings/about` goes to usewmt.com `/about`; web pages with no usewmt.com page go to its home.
- **Open, not mine:** the app-link files (`src/lib/app-links.ts`, AASA and assetlinks) still claim `/activate` and `/reset-password` for the phone app, so a phone with the app installed opens the app on those mails; the apps are parked (R-134) and the file is app-owned, so unchanged. `join-content.ts` step 3 still says the WAWU app arrives on the stores. Both need an owner word.
- **NOT RUN:** a real activation or reset against WAWU ID (never called live); a deployed preview; ID-LINKS (WAWU ID) and APP-RESET are other tasks.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEB-STRIP.md](history/WEB-STRIP.md).

