---
id: ADS-SWAP
title: The adverts are the owner's three prize banners; the ones before them come off
owner: YOU
area: ADS
order: 404
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-144, R-116, R-92, R-59]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# ADS-SWAP · The owner's three banners replace the adverts on air

## Current state

Carried out on the live server on 17 Nov 2026 at 02:11 UTC. Built by a Sonnet builder and checked by a separate Sonnet checker over three rounds (round 1: fix, the phrase did not bind an edit made between the dry run and the apply; fix round 1: merge; fix round 2, after the first dry run on the live server found that the four adverts on air do nothing on tap: merge). Hub PR #273 (main `2960831f`) and PR #274 (main `bf0c9e70`). Run by the lead through the manual workflow `ads-swap-1116.yml`: a dry run (run 44001005573), the apply with that dry run's phrase (run 44001138143), and a confirming dry run that found nothing to do (run 44001276762). Ended: "Win a car and more", "Win a SOUEAST car", "Win a Vergio gaming system", "Win a DJI Osmo Pocket 3" (each had a wide and a tall picture and a tap that does nothing; window to 29 Jan 2027; weights 40, 30, 20, 10). On air: "Drive.", "5 DJI Osmo Pocket 3.", "4 Gaming Systems.", wide picture only, weight 40, to 2027-01-29T05:14:58Z, a tap does nothing. The server's own read-back: Explore serves 3 (first "Drive."), Today serves the first, TGIF serves none. The lead cannot open Explore or Today without a sign-in: left for the owner to look. Open with the owner: a link for "Register now" (none is set, as on the adverts replaced), and tall pictures if TGIF should carry an advert. Follow-up: a removal task for the command, its workflow and its pictures (the contract is regenerated again then, order only).

## Goal

A user opening Explore sees the three banners slide by, a user on Today sees the car banner, and a tap on any of them does what a tap on the advert before them did. The adverts that were on air are ended.

## Scope

`wawu-backend`: `scripts/ops/ads-swap-1116.ts` (dry run by default, `--apply --confirm`), `.github/workflows/ads-swap-1116.yml` (manual), a spec, the three pictures. No route, no migration, no change to the ads code, no fenced file.

## Capability checks

- [x] A user on Explore sees the three banners in the owner's order, and on Today the first.
- [x] A user tapping a banner gets what the replaced advert gave: nothing opens (the four adverts replaced had no link).
- [x] An admin on the dashboard sees the old adverts as ended and the three new ones on air, each with its history.
- [x] Running the command a second time changes nothing.

## Out of scope

The app (it already draws R-116's banner), the dashboard, a tall picture for TGIF.
