---
id: GEO-FILL
title: Every account has a country on the dashboard: filled from WAWU ID or the phone when the person has not chosen one, without waiting for the app
owner: YOU
area: GEO
order: 401
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-143, R-85]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# GEO-FILL · Every account has a country on the dashboard

## Current state

Cut 16 Nov 2026 by the lead from the owner's question (R-143). Builder dispatched the same hour (Sonnet, T2), Hub branch `wmt/GEO-FILL`. Nothing merged. The WAWU ID read it needs (`POST /internal/users/list` with `ids`) is built under USERS-DASH on WAWU ID branch `wmt/USERS-DASH`.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`, `DECISIONS.md` R-143 and R-85
- Hub: `src/geo/profile-location.service.ts` (`me()` records `wawu_id` or `phone` today, only when the app calls `GET /me/location`), `src/geo/phone.ts`, `src/admin/geo/` (the counts behind the dashboard's "Where people are")
- WAWU ID: `src/auth/internal.controller.ts` (how the Hub calls WAWU ID today)

## Goal

The dashboard's "Where people are" counts every account under a country. Live, 16 Nov: 248 accounts, 224 with no country (180 of them creators), because only the phone app told the Hub where a person was.

## Scope

`wawu-backend` only, additive: a fill for existing accounts and a record step for signed-in requests. No change to what other people see (only a chosen country is public). No protected route changes behaviour.

## Capability checks

- [ ] A superadmin can start "fill missing countries" from the dashboard (a Hub admin route, superadmin only, safe to run twice) and every account with no chosen country gets the country WAWU ID holds, else its phone's country, with the right source.
- [ ] A person who signs in on the website is counted under a country at once, without opening the app.
- [ ] A person who chose a country keeps it, whatever WAWU ID or the phone says.
- [ ] An account WAWU ID does not know, or whose phone has no known country, stays "no country yet" and is counted as such.
- [ ] No email or phone number is stored by the Hub or written to a log.
