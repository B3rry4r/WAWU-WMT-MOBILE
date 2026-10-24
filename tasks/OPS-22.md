---
id: OPS-22
title: Featured creators: pick, order and remove who Explore features
owner: YOU
area: OPS
order: -148
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-47]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-22 · Featured creators

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B14): backend `wmt/OPS-20` `82bd466` on `origin/main` `3d33a05`, dashboard `wmt/OPS-20` `40dff8c`. The Hub served only `PUT` and `DELETE /admin/featured-creators/:wawuId`, so two routes were added, additive, superadmin only like the others, with a spec. Status verifying. Default (lead), owner may override: new picks join the end of the rail; "move" saves the whole order.

| # | Before | After |
|---|---|---|
| 1 | no way to see who is featured | `GET /admin/featured-creators` lists the rail in Explore's order with name (WAWU ID, else handle), piece count, and whether Explore shows them today and why not (nothing published, off member lists, not a creator) |
| 2 | order was one `position` per creator, set one call at a time | `POST /admin/featured-creators/order` takes every featured creator once and numbers them 0, 1, 2 in one transaction; a list that misses, repeats or adds someone is a 400 and nothing moves |
| 3 | no screen | `/featured-creators`: the rail with up, down and Remove, and a search by handle that features a creator at the end; the Hub's refusal ("This creator has nothing published yet, so Explore cannot show them") is shown as written |

Proof: backend spec `src/admin/featured-creators/tests/admin-featured-creators.contract.spec.ts` 7 of 7 (roles 401 and 403, order, hidden reasons, refused orders leave places untouched); `contract/openapi.json` gains the two paths (SHARED-CHANGES OPS-20 #1). Live: featured three creators, the Hub refused a fourth with nothing published, moved one up twice, took her content away and the row read Hidden. Pictures: `scratchpad/dash-b14/featured-1.png`, `featured-3.png`, `featured-4.png`, `featured-5.png`.

Open low: `PUT` and `DELETE` write no audit row (`G-OPS-22-1`); the picker finds creators by handle or id only (names come from WAWU ID and the creator search returns none).

## Read first

- Backend `src/admin/featured-creators/`, `src/explore/explore.service.ts` (`featured`)

## Goal

An admin picks, orders and removes the creators in Explore's Featured creators rail.

## Scope

`wawu-backend`: `src/admin/featured-creators/` (two routes, two types, a spec), `contract/openapi.json`. `wawu-dashboard`: `src/components/featured/`, `src/lib/api/admin-featured-creators.ts`, `src/app/(app)/featured-creators/`, the nav entry.

## Capability checks

- [x] A superadmin can see the rail, add a creator, move one, and remove one.
- [x] A creator Explore cannot show is marked Hidden with the reason; the Hub refuses to feature one with nothing published.
- [x] Another role gets 403 on both new routes and sees no controls on the screen.
- [ ] Explore on a phone showing the saved order: NOT RUN (the Explore route reads the same table, in the order the list shows).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: none yet.
