---
id: GEO-02
title: Countries, regions and where a person is, on the Hub (lists, profile place, /me/location, admin filters and counts, phones from any country)
owner: YOU
area: GEO
order: -3025
priority: launch
repo: wawu-backend
type: migration
status: verifying
depends_on: []
decisions: [R-85, R-6, R-11]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# GEO-02 · Countries, regions and a person's place (Hub)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B25): backend `wmt/GEO-02` `e674a36` on `origin/main` `38be72e`; records on mobile `wmt/GEO-02`. WAWU ID's half (GEO-01, `wawu-id` `wmt/GEO-01` `7fb7dea`) is read, not changed. Not yet verified by a separate agent. Status verifying. The app half is GEO-03.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no country or region list; the app would carry its own | `GET /geo/countries` (249 ISO 3166-1: `code`, `name`, `dialCode`, `flag`, `exampleNumber`, `exampleNational`, `hasRegions`) and `GET /geo/countries/{code}/regions` (ISO 3166-2: full `code` "NG-LA", `name`, `type`); public, `Cache-Control: public, max-age=86400` and an ETag (304 proved); no network at run time |
| 2 | a profile has one free `location` line | `PATCH /users/me/profile-fields` takes `countryCode`, `regionCode`, `regionName`, `city` (nullable, on `ProfileDetails`, so `GET`/`PATCH /users/me` and the public profile are byte for byte as before); checked against the lists; 400 `reason.code` `country_invalid`, `region_invalid`, `region_needs_country`, `city_too_long`; changing the country clears a region not sent again; a refused request saves none of itself; `location` works as before |
| 3 | phones: the Hub's rule is `+234` (CONVENTIONS section 2) | section 2 rewritten: any valid E.164 number (`libphonenumber-js` 1.13.15, pinned) where the Hub only stores or shows a phone; the Nigerian rule stays on every route that pays or opens a Nigerian rail (11 places, in a table in CONVENTIONS); the launch registration (`normalisePhone`) takes any valid number and still takes everything it took |
| 4 | no country for an account | `GET /me/location`: what the person chose, else WAWU ID's `countryCode` claim (GEO-01), else its older `country` text, else the phone's; recorded on first read (`countrySource` `wawu_id`/`phone`), never over a chosen one; migration `20261120093000_geo_location` gives NG to every profile with a proved +234 phone (`WalletIdentity`, `FintavaWalletOpening`); rollback refuses while anyone has saved a country, region or city (8 specs in a scratch schema) |
| 5 | no way to filter or count by place | `countryCode`/`regionCode` filters on `GET /admin/creators` (every profile; `accountType` narrows to creators) and `GET /admin/content/queue` (by the creator's place); `GET /admin/geo/counts` (accounts and creators by country, then region, an `unknown` bucket, optional `?countryCode=`); superadmin, support, finance |

Checks (24 Oct 2026): `tsc` clean; eslint (no fix) clean on every file I wrote; `contract:build` EXIT 0; `test:protected` 253 pass; route inventories (`publishing-gate-coverage`, `hub-rate-limits`) pass with no new `@Throttle`; `geo-lists.spec` 65 unit, `geo.contract.spec` 21 and `geo-migration.contract.spec` 8 pass (94) on a fresh database; affected specs pass (profile-fields, visitor-profile, me, admin-creators, admin-content-review, take-down, waitlist, waitlist-claim-proof, block-hides-people, route-shadowing, rollback-stop-on-error); gates 0 fail; `check_baseline` EXIT 0.

Defaults (lead), owner may override: (a) "people" and "creators" are `GET /admin/creators` (it lists every profile; there is no other people list); (b) the lists' rows do NOT carry the place: the protected suite locks the admin response shapes, so a `place` key on a row is a widening it fails; the filters and the counts carry it; adding it is an owner re-lock; (c) another person sees a country only if they chose it (a country read from WAWU ID or a phone is for the dashboard and the person); (d) all 249 ISO countries are choosable for residence, and the 50 territories ISO does not divide have no regions (a region may be typed as text); (e) the structured place never rewrites the free `location`.

Open, for GEO-03 and the lead: (1) the app calls `GET /me/location` after sign-in, or accounts with no Hub-held phone stay out of the counts (the Hub holds no phone for most accounts: the migration cannot fill them); (2) the data is `@koshmoney/countries` 1.0.1 (MIT, Wikipedia's rendering of ISO 3166; a young package, `latest` on npm is a beta tag): confirm, or swap for `iso-3166` (wooorm, no region `type`, ESM only); (3) `mock-wawu-id` does not emit `countryCode`; the claim is proved by calling `ProfileLocationService.me` with claims; (4) contract regeneration reordered one enum in the existing legal-consultation schemas (same values); (5) not run: a phone, WAWU ID live.

## Read first

- `DECISIONS.md` R-85, R-6; backend `docs/contract/CONVENTIONS.md` sections 2 and 2a; backend `src/geo/`, `src/admin/geo/`

## Goal

The app reads its country and region lists from the Hub, a person has a country of residence, region and city on their profile, an operator can filter and count by them, and a phone from any country is stored and shown in full international form.

## Scope

`wawu-backend` only (additive): `src/geo/**`, `src/admin/geo/**`, small edits in `src/user-profile/`, `src/me/`, `src/admin/creators/`, `src/admin/content-review/`, `src/waitlist/waitlist-contact.ts`, `docs/contract/CONVENTIONS.md`; fenced and recorded in `SHARED-CHANGES.md`: `prisma/schema.prisma` and the migration, `contract/openapi.json` (regenerated). Packages added: `@koshmoney/countries` 1.0.1, `libphonenumber-js` 1.13.15.

## Capability checks

- [x] A person can read the country list with no sign-in, and a region list for any country; an unknown country is a 404 with a reason.
- [x] A person can save a country, region and city on their profile; what is not on the lists is refused, and nothing of that request is saved.
- [x] A person's free-text location still saves and shows as before; the web's `GET`/`PATCH /users/me` answers carry none of the new keys.
- [x] The app can ask where the signed-in person is and gets their WAWU ID country first; a country they chose is never replaced.
- [x] An operator can filter creators and the content queue by country and region, and see accounts counted by country and region.
- [x] The migration fills Nigeria from a proved +234 phone, and its rollback refuses while anyone has saved a place.
- [x] A phone from any country is stored as E.164 where the Hub only stores it; Nigerian rails keep their rule.
- [ ] On a phone and against the live WAWU ID: NOT RUN.
