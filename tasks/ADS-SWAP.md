---
id: ADS-SWAP
title: The adverts are the owner's three prize banners; the ones before them come off
owner: YOU
area: ADS
order: 404
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: building
depends_on: []
decisions: [R-144, R-116, R-92, R-59]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# ADS-SWAP · The owner's three banners replace the adverts on air

## Current state

Cut 16 Nov 2026 by the lead from the owner's order (R-144). Hub branch `wmt/ADS-SWAP` `247a5dfe` holds the three pictures (`scripts/ops/ads-1116/`). A Sonnet builder is writing the one-time command and its workflow. Not run.

## Goal

A user opening Explore sees the three banners slide by, a user on Today sees the car banner, and a tap on any of them opens the address the advert before them opened. The adverts that were on air are ended.

## Scope

`wawu-backend`: `scripts/ops/ads-swap-1116.ts` (dry run by default, `--apply --confirm`), `.github/workflows/ads-swap-1116.yml` (manual), a spec, the three pictures. No route, no migration, no change to the ads code, no fenced file.

## Capability checks

- [ ] A user on Explore sees the three banners in the owner's order, and on Today the first.
- [ ] A user tapping a banner opens the address the replaced advert opened.
- [ ] An admin on the dashboard sees the old adverts as ended and the three new ones on air, each with its history.
- [ ] Running the command a second time changes nothing.

## Out of scope

The app (it already draws R-116's banner), the dashboard, a tall picture for TGIF.
