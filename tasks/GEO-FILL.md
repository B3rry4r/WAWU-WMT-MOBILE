---
id: GEO-FILL
title: Every account has a country on the dashboard: filled from WAWU ID or the phone when the person has not chosen one, without waiting for the app
owner: YOU
area: GEO
order: 401
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-143, R-85]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# GEO-FILL · Every account has a country on the dashboard

## Current state

Live since 17 Nov 2026, 00:23 UTC (Hub PR #272, main `434ba190`, with USERS-DASH). Built by a Sonnet builder, checked by a separate Sonnet verifier (T2): round 1 fix, one medium (a sign-in could overwrite a country the person chose in the gap between the read and the write); fix round 1 writes only where there is no country; re-check verdict merge (80 race rounds, the chosen country kept every time; `GET /users/me` byte for byte as before; 244 of 244 protected-route tests). The fill runs by itself 90 seconds after the Hub starts and every night at 02:23, behind an advisory lock, and from the dashboard's "Fill missing countries" button (superadmin). The lead cannot read the counts without a sign-in: left for the owner to look at "Where people are".

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, `DECISIONS.md` R-143 and R-85
- Hub: `src/geo/profile-location.service.ts` (`me()` records `wawu_id` or `phone` today, only when the app calls `GET /me/location`), `src/geo/phone.ts`, `src/admin/geo/` (the counts behind the dashboard's "Where people are")
- WAWU ID: `src/auth/internal.controller.ts` (how the Hub calls WAWU ID today)

## Goal

The dashboard's "Where people are" counts every account under a country. Live, 16 Nov: 248 accounts, 224 with no country (180 of them creators), because only the phone app told the Hub where a person was.

## Scope

`wawu-backend` only, additive: a fill for existing accounts and a record step for signed-in requests. No change to what other people see (only a chosen country is public). No protected route changes behaviour.

## Capability checks

- [x] A superadmin can start "fill missing countries" from the dashboard (a Hub admin route, superadmin only, safe to run twice) and every account with no chosen country gets the country WAWU ID holds, else its phone's country, with the right source.
- [x] A person who signs in on the website is counted under a country at once, without opening the app.
- [x] A person who chose a country keeps it, whatever WAWU ID or the phone says.
- [x] An account WAWU ID does not know, or whose phone has no known country, stays "no country yet" and is counted as such.
- [x] No email or phone number is stored by the Hub or written to a log.
