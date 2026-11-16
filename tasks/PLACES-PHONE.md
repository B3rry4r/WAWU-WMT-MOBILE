---
id: PLACES-PHONE
title: "Where people are" reads right on a phone: the hint sits above the country picker
owner: YOU
area: GEO
order: 403
priority: after-launch
repo: wawu-dashboard
type: admin-screen
status: building
depends_on: []
decisions: [R-143, R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T0
---
# PLACES-PHONE · "Where people are" on a phone

## Current state

Cut 16 Nov 2026 by the lead from the owner's phone screenshot: on `/places` at phone width the hint "Most people first. Open a country to see its regions." (`src/components/places/PlacesScreen.tsx`, about line 160) is squeezed into a column one word wide beside the country picker. Built in the same run as USERS-DASH's dashboard part, branch `wmt/USERS-DASH`. Nothing merged.

## Goal

On a phone the hint reads as one or two normal lines and the picker has its full width. Desktop does not change.

## Scope

`wawu-dashboard`: the header row of the places table only.

## Capability checks

- [ ] A user on a 360 or 390 wide phone can read the hint in normal lines, above or below the picker, with nothing overlapping.
- [ ] A user on desktop sees the row as before.
