---
id: OPS-29
title: Admin screens: where people are (accounts by country and region) and the country and region filters on the people lists
owner: YOU
area: OPS
order: -2703
priority: launch
repo: wawu-dashboard
type: admin-screen
status: verifying
depends_on: []
decisions: [R-85]
passes: [V1, V6, V7, V9]
artboards: []
tier: T1
---
# OPS-29 · Admin screens: country and region

## Current state

As of 24 Oct 2026, built by the OPS-27 builder (T1, bundle B30). Dashboard `wmt/OPS-27` `19f0fcc` on `origin/main` `ee23d21`; backend nothing new (the routes were `origin/main` `0811874`); mobile records `wmt/OPS-27`. Status verifying. Routes: `GET admin/geo/counts` (superadmin, support, finance), the public `GET geo/countries` and `geo/countries/:code/regions`, and the `countryCode` and `regionCode` queries of `GET admin/creators` and the admin content queue.

| # | Before | After |
|---|---|---|
| 1 | an admin could not see where accounts are | `/places` ("Where people are"): the totals, the creators, and the accounts with no country yet; each country with its regions on open, a share bar, and a link to the people |
| 2 | the creator lookup had no place filter | a country box and a region box (the Hub's own ISO lists; a country ISO divides into nothing shows no region box); `/creators?countryCode=NG&regionCode=NG-LA` opens already narrowed; people with no country match none |
| 3 | the review queue had no place filter | the same two boxes on the content queue (pieces whose creator lives there) |
| 4 | the dashboard had no geo types | generated: `money.generated.ts` now also reads the public `geo.controller.ts` (no guard, roles null, sent without the token) |

Proof: `scratchpad/dash-b30/places-1.png`, `creators-geo.png`, `content-geo-filter.png` (1440 px, looked at): 40 seeded accounts across Nigeria, Ghana, the United States and the United Kingdom, 6 with no country; the Lagos filter showed the 10 people the counts said. Checks as OPS-27 (same branches, same EXIT 0 lines).

Default (lead), owner may override: the place filter is offered on the two lists the Hub filters (creators, the content queue). The KYC queue, verification, professional listings, support threads and registrations carry no country on the Hub: G-OPS-29-1.

## Read first

- `DECISIONS.md` R-85; backend `src/admin/geo/admin-geo.controller.ts`, `src/geo/geo.controller.ts`
- Dashboard `src/components/places/`, `src/lib/api/admin-geo.ts`

## Goal

An admin can see accounts by country and region, and narrow the creator lookup and the review queue to one country or region.

## Scope

`wawu-dashboard`: `src/components/places/*`, `src/components/creators/CreatorsScreen.tsx` (the former page, now behind a Suspense page), the content queue page, `src/lib/api/admin-geo.ts`, `admin-creators.ts`, `admin-content.ts`, `queries.ts`.

## Capability checks

- [x] An admin can open a country and see its regions with accounts and creators.
- [x] An admin can narrow the creator lookup to a country and to a region.
- [x] An admin can narrow the review queue to a country and region.
- [ ] A person whose country was read from their phone: NOT RUN (the seeded rows carry a chosen country).
