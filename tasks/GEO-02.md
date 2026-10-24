---
id: GEO-02
title: Countries, regions and where a person is, on the Hub (lists, profile place, /me/location, admin filters and counts, phones from any country)
owner: YOU
area: GEO
order: -3025
priority: launch
repo: wawu-backend
type: migration
status: review
depends_on: []
decisions: [R-85, R-6, R-11]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# GEO-02 · Countries, regions and a person's place (Hub)

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T2, bundle B25): backend `wmt/GEO-02` `198753e` (round 2; round 1 `457e8b3`, round 0 `28634ce`) on `origin/main` `38be72e`; records on mobile `wmt/GEO-02`. WAWU ID's half (GEO-01, `wawu-id` `wmt/GEO-01` `7fb7dea`) is read, not changed. Round 0 verified FIX (report below); rounds 1 and 2 fix it and wait for the verifier. Status verifying. The app half is GEO-03.

| # | Before (`origin/main`) | After |
|---|---|---|
| 1 | no country or region list; the app would carry its own | `GET /geo/countries` (249 ISO 3166-1: `code`, `name`, `dialCode`, `flag`, `exampleNumber`, `exampleNational`, `hasRegions`) and `GET /geo/countries/{code}/regions` (ISO 3166-2: full `code` "NG-LA", `name`, `type`); public, `Cache-Control: public, max-age=86400` and an ETag (304 proved); no network at run time |
| 2 | a profile has one free `location` line | `PATCH /users/me/profile-fields` takes `countryCode`, `regionCode`, `regionName`, `city` (nullable, on `ProfileDetails`; the Hub adds no key to `GET`/`PATCH /users/me` or the public profile, but `GET /users/me` spreads the WAWU ID token's claims, so with GEO-01's tokens it carries WAWU ID's own `countryCode`: additive, read-only, and it can differ from the place the person saved, which is `GET /me/location`'s); checked against the lists; 400 `reason.code` `country_invalid`, `region_invalid`, `region_needs_country`, `city_too_long`; changing the country clears a region not sent again; a refused request saves none of itself; `location` works as before |
| 3 | phones: the Hub's rule is `+234` (CONVENTIONS section 2) | section 2 rewritten: any valid E.164 number (`libphonenumber-js` 1.13.15, pinned) where the Hub only stores or shows a phone; the Nigerian rule stays on every route that pays or opens a Nigerian rail (11 places, in a table in CONVENTIONS); the launch registration (`normalisePhone`) takes any valid number and still takes everything it took |
| 4 | no country for an account | `GET /me/location`: what the person chose, else WAWU ID's `countryCode` claim (GEO-01), else its older `country` text, else the phone's; recorded on first read (`countrySource` `wawu_id`/`phone`), never over a chosen one; migration `20261124090000_geo_location` gives NG to every profile with a proved +234 phone (`WalletIdentity`, `FintavaWalletOpening`); rollback refuses while anyone has saved a country, region or city (8 specs in a scratch schema) |
| 5 | no way to filter or count by place | `countryCode`/`regionCode` filters on `GET /admin/creators` (every profile; `accountType` narrows to creators) and `GET /admin/content/queue` (by the creator's place); `GET /admin/geo/counts` (accounts and creators by country, then region, an `unknown` bucket, optional `?countryCode=`); superadmin, support, finance |
| R1 | Verifier FIX (24 Oct 2026): ZA and GH region data wrong, ISO-table country names, stamp order, `city_too_long` gap, `users/me` claim | `src/geo/region-overrides.ts` (reviewed; replaced in round 2, row R2): ZA 9 provinces with English names and `ZA-GP`/`ZA-KZN`, GH 16 regions, GB without the 3 groupings, the 28 retired districts/councils and with the 13 newer councils, 5 ISO spellings; country names from `i18n-iso-countries` 7.14.0 (`country-names.ts`, 20 reviewed overrides): "North Macedonia", "Democratic Republic of the Congo"; `tests/geo-iso-lists.spec.ts` pins NG 37, US 57, GB 221, GH 16, KE 47, ZA 9, CA 13 to ISO (`tests/iso-3166-2.fixture.ts`) and fails for a name clash or a dead correction; stamp `20261124090000_geo_location` (latest on any branch was `20261123090000`; rollback kept); a city over 80 is always `city_too_long` (the DTO no longer caps the four place keys); the data export's `profileDetails` carries the place; the `users/me` claim is written down above |
| R2 | Lead ruling on G-GEO-02-4: region codes are stored on profiles, so they must be ISO for every country | `iso-3166` 4.4.0 (devDependency, exact; ESM-only) is the source of every subdivision code and name: `scripts/geo/build-regions.mjs` writes `src/geo/data/regions.json` (200 countries, 5066 regions), committed; the Hub reads the JSON at run time (no ESM import). Type from `@koshmoney/countries` where the code matches, else a table in the script (ZA-GP, ZA-KZN, 13 newer GB councils), else "Region". The only differences from iso-3166 are four places left out (GB-EAW, GB-GBN, GB-UKM: groupings, not places; GH-BA: Brong-Ahafo, retired 2019, iso-3166 still lists it, so Ghana would have 17 not ISO's 16) and two names spelled as ISO does (`ZA-KZN` "KwaZulu-Natal", `ZA-NW` "North West"); the run-time override layer is gone. `tests/geo-iso-lists.spec.ts`: every country's served codes and names equal the JSON's, the JSON equals what the script builds (`--check`, so a bump of either is a rebuild), the seven hand-written ISO pins stay. A region given by a name two regions share ("Dhaka": BD-C and BD-13) is refused; the code picks one. Country names unchanged (`i18n-iso-countries` + 20 overrides) |

Checks (round 2, 24 Oct 2026, fresh `npm ci`): `tsc` clean; eslint (no fix) clean on every file I wrote; `contract:build` EXIT 0 (no change to the contract; `regions.json` is in `dist`); `test:protected` after `db:seed` 253 pass; route inventories pass; gates 0 fail, `check_baseline` EXIT 0; geo specs 126 (66 lists and phones, 30 ISO, 22 HTTP, 8 migration); affected specs pass (17 suites, 323 tests: profile-fields, visitor-profile, me, admin-creators, admin-content-review, take-down, `account-data-map`, `data-export-map`, `data-export.contract` with `ADMIN_JWT_SECRET` set, publishing-gate-coverage, hub-rate-limits, route-shadowing, rollback-stop-on-error); round 2 CI ids are in the hand-back.

Defaults (lead), owner may override: (a) "people" and "creators" are `GET /admin/creators` (it lists every profile; there is no other people list); (b) the lists' rows do NOT carry the place: the protected suite locks the admin response shapes, so a `place` key on a row is a widening it fails; the filters and the counts carry it; adding it is an owner re-lock; (c) another person sees a country only if they chose it (a country read from WAWU ID or a phone is for the dashboard and the person); (d) all 249 ISO countries are choosable for residence, and the 50 territories ISO does not divide have no regions (a region may be typed as text); (e) the structured place never rewrites the free `location`.

Open, for GEO-03 and the lead: (1) the app calls `GET /me/location` after sign-in, or accounts with no Hub-held phone stay out of the counts (the Hub holds no phone for most accounts: the migration cannot fill them); (2) lead ruled: `iso-3166` 4.4.0 is the source of every region code and name (round 2; G-GEO-02-4 closed), `@koshmoney/countries` 1.0.1 stays for the country list and the region types; (3) `mock-wawu-id` does not emit `countryCode`; the claim is proved by calling `ProfileLocationService.me` with claims; (4) contract regeneration reordered one enum in the existing legal-consultation schemas (same values); (5) not run: a phone, WAWU ID live.

## Read first

- `DECISIONS.md` R-85, R-6; backend `docs/contract/CONVENTIONS.md` sections 2 and 2a; backend `src/geo/`, `src/admin/geo/`

## Goal

The app reads its country and region lists from the Hub, a person has a country of residence, region and city on their profile, an operator can filter and count by them, and a phone from any country is stored and shown in full international form.

## Scope

`wawu-backend` only (additive): `src/geo/**`, `src/admin/geo/**`, small edits in `src/user-profile/`, `src/me/`, `src/admin/creators/`, `src/admin/content-review/`, `src/waitlist/waitlist-contact.ts`, `docs/contract/CONVENTIONS.md`; fenced and recorded in `SHARED-CHANGES.md`: `prisma/schema.prisma` and the migration, `contract/openapi.json` (regenerated). Packages added: `@koshmoney/countries` 1.0.1, `libphonenumber-js` 1.13.15, `i18n-iso-countries` 7.14.0 (round 1), `iso-3166` 4.4.0 (round 2, devDependency); all MIT, exact. New files: `scripts/geo/build-regions.mjs`, `src/geo/data/regions.json`.

## Capability checks

- [x] A person can read the country list with no sign-in, and a region list for any country; an unknown country is a 404 with a reason.
- [x] A person can save a country, region and city on their profile; what is not on the lists is refused, and nothing of that request is saved.
- [x] A person's free-text location still saves and shows as before; the Hub adds no key to the web's `GET`/`PATCH /users/me` answers (`GET /users/me` carries WAWU ID's own `countryCode` claim when the token has one: additive).
- [x] The app can ask where the signed-in person is and gets their WAWU ID country first; a country they chose is never replaced.
- [x] An operator can filter creators and the content queue by country and region, and see accounts counted by country and region.
- [x] The migration fills Nigeria from a proved +234 phone, and its rollback refuses while anyone has saved a place.
- [x] A phone from any country is stored as E.164 where the Hub only stores it; Nigerian rails keep their rule.
- [ ] On a phone and against the live WAWU ID: NOT RUN.

## Verifier report

Verifier (Sonnet, T2 check, 24 Oct 2026) of backend `wmt/GEO-02` `28634ce` against `origin/main` `38be72e`, with WAWU ID `wmt/GEO-01` `1e0faf1` running for real. Verdict: **FIX** (1 medium that needs a lead ruling, 3 low). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/geo-12-v/` (`h2.mjs`, `h3.mjs`, `h4.mjs` outputs, `be-*.log`, `geo-data.cjs`).

| Check | Result | How |
|---|---|---|
| Lists | passed | `GET /geo/countries` 249 rows, no sign-in, `Cache-Control: public, max-age=86400`, weak `ETag`, `If-None-Match` answers 304 (curl; also for `/NG/regions`); `ng` and `NG` both work; `ZZ` is 404 `country_not_found`; `AQ` is 200 with no items |
| Data against ISO 3166-2 | NG, US, KE, CA ok; GH, ZA wrong | see finding 1 |
| Profile fields, reasons | passed | `ZZ` `country_invalid`; `NG-LA` under Ghana `region_invalid`; region with no country `region_needs_country`; city 81 to 100 characters `city_too_long`; a request with a good country, a bad region and a city saves none of it; a country change clears the region; `AQ` takes a typed region and refuses a region code; the free `location` still saves |
| `/me/location` with a real claim | passed | Ghana sign-up in the real WAWU ID: token claim `GH`, `/me/location` answers `GH` source `wawu_id`; a chosen `NG`/`NG-LA`/Ikeja replaces it and the claim never overwrites it (claim still `GH`); claim null with text "Nigeria" answers `NG`; claim null, no text, `+233` phone answers `GH` source `phone` |
| Migration `20261120093000_geo_location` | passed | 7 live-shaped profiles: wallet identity or opening with a proved `+234` phone give `NG`/`phone` (one row for a person with both; an existing row keeps its location and skills); `+233` and no-wallet profiles get nothing; rollback removes only the derived rows and keeps pre-existing ones; it refuses (nothing changed) for a saved city, a saved country, and a saved region |
| Admin filters and counts | passed | `/admin/geo/counts`: superadmin, support, finance 200; reviewer 403; no token and a user token 401; lines add up (8 = 5 placed + 3 unknown); `?countryCode=NG` narrows; `ZZ` 400. `/admin/creators?countryCode=` returned 2 for NG and 2 for GH, 1 for GH with `accountType=creator`, 1 for AQ, and the same roles as before; `/admin/content/queue?countryCode=` 200 for reviewer, superadmin, support, 403 for finance as before; `ZZ` 400 `country_invalid` |
| CONVENTIONS section 2, the 11 places | passed | the diff touches none of the 10 Nigerian-rule files; each still carries its Nigerian rule; only `waitlist-contact.ts` changes, and a `+234` number that is not a Nigerian mobile was refused on `main` too |
| tsc, eslint (no fix), gates, contract | passed | tsc EXIT 0; eslint 17 findings in three touched files, none on a line the task changed; `contract:build` EXIT 0 with no diff to `contract/openapi.json`; gates 0 fail, 136 warn, 88 accepted; `check_baseline` EXIT 0 |
| Specs | passed | 31 spec files (the 12 named in the task plus the 3 geo specs; none that imports the Fintava double), `--runInBand`: 554 tests pass. 4 suites first failed with 401 only because no mock WAWU ID was listening on my port; with it started they pass (93 tests) |
| `test:protected` after `db:seed` | passed | 2 suites, 253 tests, EXIT 0 |
| Route inventories | passed | `publishing-gate-coverage` and `hub-rate-limits` are in the 31 files and pass |

### Findings

- **medium, lead rules (data)** `src/geo/geo-data.ts:60-70` serves `@koshmoney/countries` 1.0.1 as it is. Against ISO 3166-2: NG 36 states plus FC, US 50 plus DC plus 6 outlying areas, KE 47 counties (codes 01 to 47), CA 10 plus 3 are right. **ZA is wrong**: the names are vernacular, not English (`ZA-FS` "Foreisetata", `ZA-NC` "iTlhagwini-Kapa", `ZA-WC` "iTjhingalanga-Kapa", `ZA-NL` "GaZulu-Natala", `ZA-MP` "iMpumalanga", `ZA-NW` "Bokone Bophirima"), and two codes are the retired ones (`ZA-GT`, `ZA-NL`; ISO today is `ZA-GP`, `ZA-KZN`). **GH is out of date**: 10 regions with Brong-Ahafo; ISO has 16 (Ahafo, Bono, Bono East, North East, Oti, Savannah and Western North are missing). GB (239) offers "England and Wales", "Great Britain" and "United Kingdom" as regions (ISO lists them). Some country names are ISO-table style: "Congo, The Democratic Republic Of The", "Macedonia, the Former Yugoslav Republic Of" (now North Macedonia), "Korea, Republic of", "Saint Helena, Ascension and Tristan Da Cunha". Repro: `GET /api/hub/geo/countries/ZA/regions` and `/GH/regions`. Options: a reviewed override table for ZA, GH and the long names in `src/geo/`, or another package (the builder named `iso-3166`). Other countries were not checked one by one.
- **low** `prisma/migrations/20261120093000_geo_location`. The stamp is earlier than `origin/wmt/IAP-01` (`20261121090000`, pushed 14:50, before this branch at 15:00) and `origin/wmt/WALLET-25` (`20261122090000`). The bundle rule asks for a stamp later than every branch; `prisma migrate deploy` applies it either way and no migration touches the same table. Rename it in any fix round.
- **low** `GET /users/me` now carries `data.countryCode` (WAWU ID's claim, passed through from the token by `src/user-profile/user-profile.controller.ts:61`), so the capability check "the web's `GET /users/me` carries none of the new keys" is true only for the mock WAWU ID, not for tokens from the GEO-01 WAWU ID. Additive and read-only, but it is a second `countryCode` beside `/me/location` that can disagree with the person's choice; note it for GEO-03 and the web.
- **low** `src/user-profile/dto/update-profile-fields.dto.ts:22` (`PLACE_TEXT_MAX = 100`) against `src/geo/geo.service.ts:10` (`CITY_MAX_LENGTH = 80`): a city of 81 to 100 characters answers `reason.code city_too_long`, a city of 101 or more answers the DTO's generic "city must be shorter than or equal to 100 characters" with no `reason.code`.

Not a finding: `people` in `/admin/geo/counts` counts accounts that have a `UserProfile`; a person who only called `/me/location` before onboarding is not counted (builder open item 1, by design). Not run: a phone, the app (GEO-03).

### Verifier report, rounds 1 and 2 (Sonnet, T2 re-check, 24 Oct 2026)

Verifier of backend `wmt/GEO-02` `198753e` (round 1 `457e8b3`, round 2) against round 0 `28634ce` and `origin/main` `38be72e`. Verdict: **PASS** (1 low for the sweep or a rename before merge; 1 local check not reproduced, see below). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/geo-12-r1-v/` (`be-*.log`, `iso-diff.mjs`, `names.ts`). CI on `198753e`: Branch checks run 40112684651 success (completed 16:59 UTC), Gates run 40112684875 success, Protected routes (V3) run 40112684773 success.

| Check | Result | How |
|---|---|---|
| Codes equal `regions.json`; the JSON equals the script | passed | `node scripts/geo/build-regions.mjs --check` EXIT 0 ("regions.json is current"); installed `iso-3166` is 4.4.0. My own diff of the JSON against `iso-3166`: 5070 ISO subdivisions, 5066 served, 200 countries, nothing extra; `geo-iso-lists.spec.ts` (every country's served codes and names equal the JSON) passes |
| The six deliberate differences | right | missing exactly `GB-EAW`, `GB-GBN`, `GB-UKM` (groupings, not places) and `GH-BA` (Brong-Ahafo, retired 2019; Ghana serves 16 as ISO has them); renamed exactly `ZA-KZN` "Kwazulu-Natal" to "KwaZulu-Natal" and `ZA-NW` "North-West" to "North West" (ISO's own spelling). No other difference |
| The seven pins | passed | NG 37, US 57, GB 221 (ISO's 224 less the 3 groupings), GH 16, KE 47, ZA 9, CA 13 served; ZA reads Eastern Cape, Free State, Gauteng (`ZA-GP`), KwaZulu-Natal (`ZA-KZN`), Limpopo, Mpumalanga, Northern Cape, North West, Western Cape; GH has Ahafo, Bono, Bono East, North East, Oti, Savannah, Western North |
| Country names | passed | 34 sampled through the service: Democratic Republic of the Congo, Republic of the Congo, North Macedonia, South Korea, North Korea, United Kingdom, Côte d'Ivoire, Türkiye, Czechia, Eswatini, Taiwan, Hong Kong, Palestine, Micronesia, Vatican City, Bolivia, Venezuela, Tanzania, Russia, Iran, Syria, Laos, Moldova, Netherlands, United Arab Emirates, Saint Helena, Gambia, Bahamas, Falkland Islands, Cape Verde, Timor-Leste, Myanmar, Brunei. 249 countries, no duplicate name; the only comma is the official "Bonaire, Sint Eustatius and Saba" |
| Shared region name, `city_too_long` | passed | `geo-lists.spec.ts` ("Dhaka" is `BD-C` and `BD-13`: refused as `region_invalid`, the code picks one) and `geo.contract.spec.ts` (22 of 22 after `db:seed`: a city of 81 is `reason.code city_too_long`, a request with a bad region saves none of itself, `/me/location`, admin filters and counts) |
| Stamp | LOW | see findings |
| tsc, eslint (no fix), gates, contract | passed | tsc EXIT 0 (after `prisma generate`); eslint on the 31 changed files: 17 findings, all in `admin-creators.service.ts` and its DTO, none on a line this branch added; `contract:build` EXIT 0 with no change to `contract/openapi.json`; gates 0 fail, 136 warn, 88 accepted, EXIT 0; `check_baseline.py` EXIT 0 |
| Specs | passed | `geo-iso-lists`, `geo-lists`, `geo-migration.contract`, `geo.contract`, `account-data-map`, `data-export-map`, `publishing-gate-coverage`, `hub-rate-limits.contract`: 8 suites, 180 tests, 179 pass first, the 1 failure (a fixture user missing before `db:seed`) passes after the seed: `geo.contract` 22 of 22. Two of the eight files only mention Fintava in a table name and a comment; none imports the double |
| `test:protected` after `db:seed` | not reproduced green | 245 of 253 pass; the 8 that fail are all verification-tick and professional-listing routes (`/admin/verification/ticks/.../grant`, `.../revoke`, `/admin/verification/:id/approve`, `/verification/purchase/verify`, `/admin/professionals/:id/approve`, `/unlist`, `/professionals/:id`, `PATCH /professionals/applications/:id/listing`) answering 502 "Your verification could not be saved" from the WAWU ID write call in my stack's mock. This branch changes no file under `verification`, `professionals` or `mock-wawu-id`, and the mock answers the same PATCH with 200 when I call it directly with the same key; CI's Protected routes (V3) run 40112684773 is green on this head. I could not find the cause in the time allowed; treat it as my environment unless CI on a later head goes red |

Findings:

- **low** `prisma/migrations/20261124090000_geo_location`: the stamp ties with `origin/wmt/IAP-01`'s `20261124090000_store_subscription_owner` (pushed 16:06 UTC, before round 1 at 16:21), so it is not later than every other branch's. It sorts first by name, the two touch different tables, and `prisma migrate deploy` applies both in either merge order, so nothing breaks. If the lead wants the rule kept to the letter, rename it (for example `20261125090000_geo_location`) in the migration folder, `geo-migration.contract.spec.ts` and `rollback.sql`.
- Not a finding: round 0's four lows are all closed (ZA and GH data, English names, the `city_too_long` gap, the stamp now later than `main` and the round 0 head; the `users/me` claim is written down).

Not run: a phone, the app, WAWU ID live (the stack used the mock).

