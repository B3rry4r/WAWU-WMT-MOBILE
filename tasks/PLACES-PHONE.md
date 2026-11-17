---
id: PLACES-PHONE
title: "Where people are" reads right on a phone: the hint sits above the country picker
owner: YOU
area: GEO
order: 403
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: review
depends_on: []
decisions: [R-143, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T0
---
# PLACES-PHONE · "Where people are" on a phone

## Current state

Live since 17 Nov 2026, 00:25 UTC (dashboard PR #14, main `f8d950b`, with USERS-DASH). The hint sits above the country picker on a phone; the verifier measured it at 360 and 390 and compared desktop with main. The same change adds the "Fill missing countries" button for the superadmin, with a confirm step and a result line.

## Goal

On a phone the hint reads as one or two normal lines and the picker has its full width. Desktop does not change.

## Scope

`wawu-dashboard`: the header row of the places table only.

## Capability checks

- [x] A user on a 360 or 390 wide phone can read the hint in normal lines, above or below the picker, with nothing overlapping.
- [x] A user on desktop sees the row as before.
