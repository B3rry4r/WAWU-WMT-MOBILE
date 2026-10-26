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

As of 26 Oct 2026. Built by a Sonnet builder; not verified yet. The groundwork (ADS-01, ADS-04 to ADS-07, EXPLORE-07) is merged, so `depends_on` is empty (their orders are all above this task's).
- **Status:** review. Branches pushed, no PR: backend `wmt/ADS-LINK` (from `origin/main` `97a11d6`), mobile `wmt/ADS-LINK` (from `e816022d`), dashboard `wmt/ADS-LINK` (from `origin/main` `f2c18fd`). Heads are in the hand-back.
- **Migration:** `20261206090000_ads_link_destinations` (newer than every origin ref; newest was `20261205120000_pay_fx` on `wmt/PAY-FX`). Additive: enum `link`, `none`; nullable `ctaUrl`; `ctaLabel` and `ctaDestinationId` lose NOT NULL; `AdCreative_cta_check` and `AdCreative_ctaUrl_check`. Rollback is in its header and refuses while a `link` or `none` card exists.
- **Hub:** `POST` and `PATCH /admin/ads` take `ctaDestination` `link` (an https address in `ctaUrl`, normalised, 500 characters at most; http, `javascript:`, `data:`, `file:`, a bare host, an address, localhost and a password are refused) or `none` (no label, id or address, refused if sent), beside `event` (unchanged: the same body, the same answer, the same eight keys served). No campaign needs an event. `GET /ads` and the Explore list serve `ctaDestination` and, for a link, `ctaUrl`; each kind carries only its own fields. New admin-only `POST /admin/ads/artwork` (the file is the body; JPEG, PNG or WebP read from the bytes; 5 MB; stored under `ads/artwork/`), its bare address becomes `artworkUrl` and serving signs it afresh so it never dies after a week; a typed https link still works.
- **App:** `drawable()` knows the three kinds; `openAd()` sends the browser to the address (expo-linking, already installed; no native module, so the fingerprint is unchanged) and `none` opens nothing. A `none` card is a plain view: no button, no `role`, no press, a label that reads as an ad, no tap report. **Owner change (26 Oct, in R-92): the Today strip is the Explore advert slide** (196 high, corner 24, the same fade, SPONSORED chip), built from `AdSlide` with the pill added (`SponsoredSlot` is now a thin wrapper; its own 104-high metrics and AD chip are gone). The TGIF card keeps Skip on a `none` card: it is the reader's own way on, not part of the advert.
- **Dashboard:** "When tapped" has two choices (a web link with its address and button words, or nothing); the event picker is gone; an old booking that still opens an event says so and is left alone until one of the two is chosen. The address is checked as the Hub checks it. The picture uploads from the computer (JPEG, PNG, WebP) or is typed; under it the size to make for each place; a picture whose shape is far off warns and still saves. `AdCardPreview` draws the app's shapes (slide and Today strip 16:9, TGIF phone shape). The list and the detail show what a tap does.
- **Existing assertions changed because the ruling changed their subject:** backend `ads-data-model.contract.spec.ts` (a null event id is now refused by the new CHECK, 23514, not NOT NULL, 23502; the column list gained `ctaUrl`); `admin-ads.contract.spec.ts` (two lines gained `as string` because the column is nullable; no assertion). App `TodaySponsored.test.tsx` (the Today chip says SPONSORED, not AD; four lines).
- **Checks (builder):** see "Checks" below. Pictures: `audits/ADS-LINK/` (6): the dashboard form at 1440, the three places with a link ad, Today with an ad that does nothing (light) and Explore with one.
- **Not done on purpose:** the website; no PR; no CI watched (the lead watches). The TGIF card with an ad that does nothing has no picture (its DOM was checked: no button, headline drawn, Skip drawn). The generated dashboard contract header names the builder's local backend path; re-run `npm run gen:contract` once the backend merges.
- **Next:** the lead merges the backend first (the migration), then `npm run api -- --backend ../wawu-backend` in the app, then the dashboard, and re-runs `npm run gen:contract` there. R-92 sits after R-90 here; PAY-FX's R-91 goes between when both merge.

## Read first

- `docs/WORKFLOW.md` and the role file your prompt names
- `DECISIONS.md`: R-92 (the ruling), R-59, R-15
- `wawu-backend` CLAUDE.md (additive only; fenced files) and `wawu-dashboard` AGENTS.md

## Goal

An ad opens the advertiser's web link or does nothing; ads are not tied to events. The Today strip is the Explore card. The dashboard uploads the picture and says what size to make.

## Scope

1. Hub: `link` and `none` beside `event`, `ctaUrl`, serve both, the upload route, the migration, the contract.
2. App: the three places, the Today strip at the Explore size, nothing pressable on a `none` card.
3. Dashboard: the form, the detail, the list, the preview, the uploader and the sizes.

## Capability checks

- [x] An admin creates a link ad and an ad with no link from the dashboard form, with an uploaded picture, and schedules both.
- [x] In the app (web export) the link ad's card or button sends the browser to the address and the tap is reported; the no-link ad shows, has no button and does nothing when tapped, and no tap is reported.
- [x] A build already on phones drops a link or none card without failing (the old reader, tested against the Hub's real answers).
- [x] A campaign saved with an event, and the body the dashboard sent until now, still work and are served as before.

## Checks

Each ran to the EXIT shown; logs are in the builder's scratchpad (`adk-b`, `adk-a`, `adk-d`).

- Backend: `tsc --noEmit` EXIT 0. Specs on a test DB (`adk_hub_test`, Postgres, mock WAWU ID on 9941), run by name (none imports the Fintava double): `ads-serve`, `ads-events`, `ads-data-model`, the whole `src/admin/ads/tests` folder (admin-ads, ad-text and the new `ads-link.contract.spec.ts`, 68 tests: the address check, each kind's fields, create, edit, serving, the database CHECK, the upload) and four storage specs (`object-key-folders`, `storage.presign`, `ai-input-folders`, `generated-file`): 10 suites, 601 tests passed, EXIT 0. `eslint` clean on the changed files. `npm run contract:build` EXIT 0. `python3 scripts/gates/run.py` EXIT 0 (0 fail, 139 warn and 88 accepted, as on main), `check_baseline.py` EXIT 0. Protected-routes suite against `wmt/ADS-LINK` on a fresh DB (run again on the final head): all 244 required tests passed, EXIT 0.
- App: `tsc` EXIT 0; `eslint` on changed files EXIT 0; jest (`--maxWorkers=2`) ads, explore, home, tgif and `route-guard`: 25 suites, 657 tests passed, EXIT 0 (the new `adLink.test.tsx` has 26 tests, `legacyReader.test.ts` 7); `npm run gates` EXIT 0 (0 fail, 18 warn, none in these files); `check_tasks.py` EXIT 0; `npx expo-updates fingerprint:generate --platform android` gives `17ffb13d520882bf144982b61d03f3994c6e40e4`, unchanged.
- Dashboard: `tsc` EXIT 0; `eslint src` EXIT 0; `npm test` 20 pass (5 new in `adLink.test.ts`); gates EXIT 0 (0 fail, 0 warn); `check-invariants` and `check-contrast` clean; `generate-contract-types --check` against the branch matches.
- End to end on a local stack (hub 9950, app web export 9953, dashboard dev 9951, storage stand-in 9946): six ads created in the dashboard UI with an uploaded picture and scheduled; the app tapped in a real browser. The tab went to `https://acme.example.com/shop?ref=wawu` for the Today card, the Explore slide and the TGIF button, each with one view and one tap counted; the ads with no link, tapped, went nowhere, drew no button, had no `role="button"` and counted a view only.
