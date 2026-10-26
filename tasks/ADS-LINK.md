---
id: ADS-LINK
title: An ad opens the advertiser's web link or does nothing; the Today strip is the Explore card; upload the picture (R-92)
owner: YOU
area: ADS
order: -152
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-92, R-59, R-15, R-47, R-37]
passes: [V1, V2, V3, V4, V5, V6, V9]
artboards: []
---
# ADS-LINK · An ad opens the advertiser's web link or does nothing

## Current state

As of 26 Oct 2026, round 2. Built by Sonnet builders; not verified yet. The groundwork (ADS-01, ADS-04 to ADS-07, EXPLORE-07) is merged, so `depends_on` is empty (their orders are all above this task's).
- **Status:** review. Branches pushed, no PR: backend `wmt/ADS-LINK` (from `origin/main` `97a11d6`, head `cb96006`), mobile `wmt/ADS-LINK` (from `e816022d`), dashboard `wmt/ADS-LINK` (from `origin/main` `f2c18fd`, head `60d2828`). The mobile head is in the hand-back.
- **Owner rule added to R-92 (26 Oct, round 2): an ad has two shapes, not three places.** Landscape (16:9, 1920 x 1080) shows in BOTH Explore and Today; portrait (1080 x 2340, a phone screen) shows in the TGIF full screen. One booking takes one picture per shape, each optional, at least one required. Only landscape = Explore and Today, never TGIF; only portrait = TGIF only; both = everywhere. No placement choice in the dashboard.
- **Migrations:** `20261206090000_ads_link_destinations` (round 1: enum `link`, `none`; nullable `ctaUrl`; `ctaLabel` and `ctaDestinationId` lose NOT NULL; two CHECKs) and `20261207090000_ads_two_shapes` (round 2, newer than every origin ref; newest before it was `20261206090000` on this branch). Round 2 is additive: nullable `AdCreative.artworkLandscapeUrl` and `artworkPortraitUrl`; `AdCreative_pictures_check` (the old single picture and the two shapes never mix) and `AdCreative_shapes_url_check` (each new picture is an http(s) address). No row changes. Rollback is in each header and refuses to lose data.
- **Hub, round 2:** `src/ads/ads-pictures.ts` is the one rule (serving, the admin list, the report, the views). A place serves the bookings that show there: a landscape picture serves `explore_slider` and `today_slot`, a portrait picture serves `tgif_card`, and each card carries the picture for its place as `artworkUrl`; each place keeps its own rule (one heaviest booking for Today and TGIF, the list for Explore). A booking saved before the shapes keeps its `artworkUrl` and `placement` and is served exactly as it was, in its own place only (an old Explore or Today booking counts as landscape for that place, an old TGIF booking as portrait). `POST` and `PATCH /admin/ads` take `creative.landscapeUrl` and `portraitUrl` (PATCH: null takes one away); `placement` is optional and refused beside a shape (400); a booking with no picture is 422 (create, edit, schedule, resume). Giving an old booking a shape moves it to the two shapes and keeps its own picture where it showed. Views carry `landscapeUrl`, `portraitUrl` and `shows`; the placement filter, the summary and the overlaps follow where a booking shows. Views, taps and skips are counted as before (once per person, booking, kind and UTC day: the app's report carries no place, so the counts are not split by place).
- **Hub, round 1 (kept):** `link` (https only, normalised, 500 characters) and `none` beside `event` (unchanged), `POST /admin/ads/artwork` (JPEG, PNG or WebP read from the bytes, 5 MB, signed afresh when served).
- **App:** no change for the shapes: each place draws the `artworkUrl` the Hub serves for it (round 1: `drawable()` knows the three kinds, `openAd()` sends the browser to the address with expo-linking so the fingerprint is unchanged, a `none` card is a plain view with no button, and the Today strip is the Explore advert slide). New `shapes.test.ts` (8 tests, real Hub answers in `fixtures/served-shapes.json`) proves each place draws the picture of its shape and that main's own reader still reads the Hub.
- **Dashboard, round 2:** no placement picker. Two uploaders, "Landscape picture (Explore and Today)" and "Portrait picture (TGIF full screen)", each with its size hint, shape warning, preview in the app's shape and a Remove, and one line "Shows in: Explore, Today" / "Shows in: TGIF" / all three. "In the app" draws a preview for each place the ad shows in. The list has a "Shows in" filter and column with the shapes held; the detail has "Shows in", both pictures and the overlaps in the same places. An old one-picture booking opens with its picture in the shape of its own place, says what the Hub serves until a picture is changed, and an edit sends only a picture that changed.
- **Existing assertions changed because the ruling changed their subject:** backend `ads-data-model.contract.spec.ts` (round 1: a null event id is refused by the CHECK, 23514; the column list gained `ctaUrl`; round 2: it gained `artworkLandscapeUrl` and `artworkPortraitUrl`); `admin-ads.contract.spec.ts` (round 1: two lines gained `as string`; round 2: the pinned key lists gained `shows` on a campaign and `landscapeUrl` and `portraitUrl` on a card); `publishing-gate-coverage.spec.ts` (the inventory of the ad routes' picture and address properties gained `creative.ctaUrl`, `creative.landscapeUrl` and `creative.portraitUrl`; it was already behind by `ctaUrl` after round 1). App `TodaySponsored.test.tsx` (round 1: the Today chip says SPONSORED, not AD).
- **Pictures:** `audits/ADS-LINK/` (6, replacing round 1's): the dashboard form with both uploaders at 1440, the detail with the three previews, Today and Explore with a landscape-only ad, TGIF with a portrait-only ad, Today with an ad that does nothing.
- **Not done on purpose:** the website; no PR; no CI watched (the lead watches). Counts are not split by place (see above).
- **Next:** the lead merges the backend first (both migrations), then `npm run api -- --backend ../wawu-backend` in the app, then the dashboard, and re-runs `npm run gen:contract` there. R-92 sits after R-90 here; PAY-FX's R-91 goes between when both merge.

## Read first

- `docs/WORKFLOW.md` and the role file your prompt names
- `DECISIONS.md`: R-92 (the ruling), R-59, R-15
- `wawu-backend` CLAUDE.md (additive only; fenced files) and `wawu-dashboard` AGENTS.md

## Goal

An ad opens the advertiser's web link or does nothing; ads are not tied to events. The Today strip is the Explore card. The dashboard uploads the pictures, one per shape, and says what size to make; where an ad shows follows from the pictures it has.

## Scope

1. Hub: `link` and `none` beside `event`, `ctaUrl`, serve both, the upload route, the two shapes (landscape, portrait), the migrations, the contract.
2. App: the three places, the Today strip at the Explore size, nothing pressable on a `none` card, each place drawing the picture it is served.
3. Dashboard: the form with two uploaders and no placement, the detail, the list, the previews and the sizes.

## Capability checks

- [x] An admin creates a link ad and an ad with no link from the dashboard form, with uploaded pictures, and schedules both.
- [x] A landscape-only ad appears in Explore and Today and not in TGIF; a portrait-only ad appears only in TGIF; an ad with both appears in all three, each with the picture of its shape (a local stack, ads booked from the dashboard UI, seen in the app's web export).
- [x] A link ad opens its address from each of the three places and the tap is reported; an ad with no link has no button, opens nothing and counts a view only.
- [x] A build already on phones (main's reader, run over the Hub's real answers) draws an event ad with both shapes as it always drew an event ad and drops a link or none card without failing.
- [x] A campaign saved with an event, a booking saved before the two shapes, and the body the dashboard sent until now still work and are served as before.

## Checks

Each ran to the EXIT shown; logs are in the builders' scratchpads (`adk-*` round 1, `adk2-*` round 2).

- Backend (head `cb96006`): `tsc --noEmit` EXIT 0. Specs on a test DB (`adk2_spec_test`, Postgres, mock WAWU ID on 9945, storage stand-in 9948), run by name (none imports the Fintava double): `ads-serve`, `ads-events`, `ads-data-model`, `admin-ads`, `ad-text`, `ads-link`, the new `ads-shapes.contract.spec.ts` (33 tests: where an ad shows by its pictures, 422 and 400 refusals, the two CHECKs, old bookings served as before and moved to the shapes on edit, an event booking with both shapes carries its eight keys in every place, the filter, summary and overlaps, counting) and `publishing-gate-coverage`: 8 suites, 614 tests passed, EXIT 0. `eslint` clean on the changed folders. `npm run contract:build` EXIT 0, no diff. `python3 scripts/gates/run.py` EXIT 0 (0 fail, 139 warn and 88 accepted, as on main), `check_baseline.py` EXIT 0. Protected-routes suite (`run.sh --fresh HEAD`, locked at `origin/main`): all 244 required tests passed, EXIT 0.
- App: `tsc` EXIT 0; `eslint` on the new test EXIT 0; jest (`--maxWorkers=2`) ads, explore, home, tgif and `route-guard`: 26 suites, 665 tests passed, EXIT 0 (the new `shapes.test.ts` has 8); `npm run gates` EXIT 0 (0 fail, 18 warn); `check_tasks.py` EXIT 0; `npx expo-updates fingerprint:generate --platform android` gives `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged.
- Dashboard (head `60d2828`): `tsc` EXIT 0; `eslint src` EXIT 0; `npm test` 21 pass; gates EXIT 0 (0 fail, 0 warn, 6 accepted), `check_baseline` EXIT 0; `check-invariants` and `check-contrast` clean; `generate-contract-types --check` against `origin/wmt/ADS-LINK` matches.
- End to end on a local stack (hub 9940, app web export 9943, dashboard dev 9947, storage stand-in 9946): four ads booked from the dashboard UI with uploaded pictures and scheduled (landscape only, portrait only, both with a link, both with no link), the Hub's answers and the app read in a real browser. All four on air: Explore listed the landscape-only ad and both "both" ads and not the portrait-only one, Today showed the landscape-only ad, TGIF the portrait-only one. After the first two were paused from the dashboard: the link ad with both shapes was in Today, Explore and TGIF, and a tap went to `https://acme.example.com/both?ref=wawu` from each (view and tap counted); the ad with no link, in all three, drew no button, opened nothing and counted a view only. An older one-picture booking edited in the dashboard stayed in its own place until a picture was added, then showed in all three.
