---
id: WEB-WMT-OFF
title: wawuafrica.com stops carrying Who Made This; the join pages and the Who Made This page open usewmt.com
owner: YOU
area: WEB
order: 398
priority: after-launch
repo: wawuafrica
type: removal
status: review
depends_on: [WEB-STRIP]
decisions: [R-141, R-133, R-48]
passes: [V1, V2, V3, V4, V7, V9]
artboards: []
tier: T1
---
# WEB-WMT-OFF · wawuafrica.com stops carrying Who Made This

## Current state

**Lead, 12 Nov 2026: verifier MERGE. Merged as wawuafrica PR #48 (68c51b74) and live at 11:39 UTC: /join and /who-made-this 308 to usewmt.com; /reset-password, /activate and /forgot-password 308 to the same page on usewmt.com with the query kept (checked live); /join/paid, /about and /legal/privacy 200. The gates check was red on main before this (17) and is 16 now. Lows to SWEEP-1111 W4 and W5.**

As of 12 Nov 2026.
- **Status:** review. Verifier (12 Nov): MERGE, two low findings (admin referral links land on usewmt.com home and lose `?ref=`; stale "Paid on /join?" line on the full-mode sign-in page), report in the history note.
- **Was:** verifying. Built on wawuafrica `wmt/WEB-WMT-OFF` f4ccc9ca (from main 03d0217), scope widened by the lead the same day (R-141 point 4: the three password pages forward too).
- **Done:** `/join` and `/who-made-this` answer 308 to https://usewmt.com in every site mode; `/reset-password`, `/forgot-password` and `/activate` answer 308 to the same path on usewmt.com with the query kept; any other closed path answers 307 to usewmt.com. Every Who Made This link or button on the brand pages is "Open Who Made This" to usewmt.com. `/join/paid` stays (called by Flutterwave's return for a payment made before this task; nothing starts a payment now) with a return-only page. Join page, Who Made This page and password-page code removed.
- **Open for the verifier:** the Voices page's hero button now reads "Open Who Made This" (it said Register); the admin referral page still builds share links on `https://wawuafrica.com/join` (`JOIN_LINK_BASE`, `src/lib/api/referrals.ts`), which now land on usewmt.com home without the code (admin dashboard is live: left alone, lead to rule); a query that a URL treats as equal (`@` and `%40`) can come back in its percent form because Next parses it first.
- Detail, the changed-assertion table and the check counts: tasks/history/WEB-WMT-OFF.md.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEB-WMT-OFF.md](history/WEB-WMT-OFF.md).

## Owner sign-off
