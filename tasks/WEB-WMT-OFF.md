---
id: WEB-WMT-OFF
title: wawuafrica.com stops carrying Who Made This; the join pages and the Who Made This page open usewmt.com
owner: YOU
area: WEB
order: 398
priority: launch
repo: wawuafrica
type: removal
status: todo
depends_on: [WEB-STRIP]
decisions: [R-141, R-133, R-48]
passes: [V1, V2, V3, V4, V7, V9]
artboards: []
tier: T1
---
# WEB-WMT-OFF · wawuafrica.com stops carrying Who Made This

## Current state

As of 12 Nov 2026.
- **Status:** todo. Cut by the lead from R-141.
- **What exists** (lead's map of wawuafrica main 03d0217, WEB-STRIP merged): `src/middleware.ts` lets the open pages through (`isOpenInJoinOnly`, `src/lib/site-mode.ts` `OPEN_PAGES`: "/", "/join", "/join/paid", legal, "/reset-password", "/forgot-password", "/activate", and the brand pages "/who-made-this", "/voices", "/about", "/partners", "/press", "/careers", "/contact"), sends an old app address to the same place on usewmt.com (`src/lib/app-redirects.ts`, 308) and every other closed path to /join (307). Links to /join or /who-made-this live in `src/app/(site)/_components/AppTiles.tsx`, `HeroScreens.tsx`, `src/app/(site)/who-made-this/page.tsx`, `src/app/join/**`, `src/lib/site/site-config.ts`. `scripts/check-site-mode.mjs` checks the live site against the rules.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md` (mobile repo)
- DECISIONS.md R-141, R-133, R-48
- tasks/WEB-STRIP.md and tasks/history/WEB-STRIP.md, tasks/JOIN-TIERS.md
- wawuafrica: `CLAUDE.md`, `src/middleware.ts`, `src/lib/site-mode.ts`, `src/lib/app-redirects.ts`, `src/app/(site)/`, `src/app/join/`, `scripts/check-site-mode.mjs`

## Goal

A person who opens wawuafrica.com/join, /who-made-this, or any Who Made This link or button on the WAWU brand pages lands on https://usewmt.com, while the WAWU brand pages, the legal pages, the password and activation pages from mails, the admin pages and a paid registration's return keep working.

## Scope

- `/reset-password`, `/forgot-password` and `/activate` answer a 308 to the same path on https://usewmt.com with the query kept byte for byte (R-141 point 4; usewmt.com serves all three and reads `token` and `email`). Their page code leaves the site.
- `/join` and `/who-made-this` answer a 308 to https://usewmt.com (a sub-path or query is not needed there: the app's home). Closed paths that went to /join now go to https://usewmt.com too (the site no longer has a join page to send them to).
- `/join/paid`: find what calls it (JOIN-TIERS: a paid registration's return). If a payment that was already made can still return there, it stays open and working; say in the report what calls it. Otherwise it also goes to usewmt.com.
- Every link or button on the remaining brand pages that went to /join or /who-made-this opens https://usewmt.com, with copy that reads as opening the app ("Open Who Made This"), no em-dashes, no store promises the site cannot keep (SWEEP-1111 row W2 is closed by this).
- The join page code and the Who Made This page code are removed (a removal task: nothing left that nothing calls), unless `/join/paid` still needs part of it.
- `scripts/check-site-mode.mjs` follows R-141; list every changed expectation in a changed-assertion table in the history note.
- Pictures (390 px and desktop, light and dark where the site has both) of the brand home and each brand page whose links changed.

## Capability checks

- [ ] A person who opens wawuafrica.com/join or /who-made-this lands on usewmt.com.
- [ ] A person who taps a Who Made This link on the WAWU brand home lands on usewmt.com.
- [ ] A person with a password reset or activation mail, old or new, finishes it on usewmt.com.
- [ ] The legal pages, the brand pages and the admin pages still open.

## Builder report

## Verifier report

## Owner sign-off
