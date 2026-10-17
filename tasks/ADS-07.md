---
id: ADS-07
title: Adverts: artwork required, and the Explore slider placement
owner: YOU
area: ADS
order: 257
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [ADS-01, ADS-04, ADS-06]
decisions: [R-59, R-68, R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-07 · Adverts: artwork required, and the Explore slider placement

## Current state

As of 17 Oct 2026.
- **Status:** verifying. Built by a Sonnet builder; nothing independent has checked it yet.
- **Branches:** backend `wmt/ADS-07` `4ec121e` (on main `a5e48fc`); mobile `wmt/ADS-07` (on app main `7de785d`). No wawu-id change. No PR opened (the lead does that).
- **Migration:** `20261024110000_ads_explore_slider`: one `ALTER TYPE "AdPlacement" ADD VALUE 'explore_slider'`. Nothing else in the database changed; `AdCreative.artworkUrl` stays nullable so the campaigns saved before have rows.
- **What is built (backend):**
  - `POST /admin/ads` and `PATCH /admin/ads/:id` refuse a campaign with no artwork: 422, "Add artwork before you save this campaign", `reason.code` `artwork_required`. On PATCH the result must have a picture: clearing it, or editing a campaign saved before this task without giving it one, is the same 422 (a live or scheduled campaign is still the 409 "pause it first" before that). Nothing is written on a refusal.
  - A campaign with no artwork is not served by `GET /ads` and a view, tap or skip for it is refused (404) like any card not being served: one rule in `src/ads/ads-serving.ts` for both.
  - The admin sees them: every campaign view has `needsArtwork` (no picture, not ended), `GET /admin/ads?artwork=missing` lists them, `GET /admin/ads/report` has `needingArtwork` and echoes the filter, and `servingNow` is false for them.
  - `GET /ads?placement=explore_slider`: `data` is a list of every live card with a picture, heaviest weight first (ties: earliest start, earliest booking, id), `[]` when none, never cached. `tgif_card` and `today_slot` still answer one card or null. `AdCardView.artworkUrl` is now always a string. Admin create and edit take the new placement (it is in the enum).
- **What is built (app):** the card that draws without a picture is gone: `SponsoredSlot` always draws its picture column, `SponsoredBackdrop` has no empty case, `drawable()` in `src/features/ads/api.ts` treats a card with no http(s) picture as no card (so Today and the reader draw nothing for one), and `TgifReader.tsx` line 210 drops its takeaway-ground fallback (SHARED-CHANGES ADS-07 F1). The app's contract copy is refreshed from the backend branch (SHARED-CHANGES ADS-07 #2). The slider itself is EXPLORE-07's.
- **Names:** the seeded and example adverts in tests are neutral (Gospel Night Live, Harvest Praise Night); no sample advertiser from the boards is in any ad code or test (R-68).
- **Checks (builder):** backend tsc clean; eslint clean on the files changed; the 5 ads specs 492 tests pass against the local stack (admin 204, serve 64, events and data model the rest); `npm run contract:build` regenerated the contract (additions only). Mobile: the full local check EXIT 0 (typecheck, lint, 184 suites and 3248 tests, gates 0 fail and 5 warn as on main, tasks check). GitHub cannot run mobile CI now.
- **GitHub (backend push `4ec121e`):** Branch checks 38994221206 green (3 suite shards, netns, contract, baseline, deploy-test-in-sync); Protected routes (V3) 38994221202 green; Gates 38994221186 red only on the same 5 FAIL lines as main (4 deferrals, 1 fork), 119 warn and 83 accepted before and after.
- **Existing tests changed because the ruling changed their subject** (fixtures and expectations only): the events and serve specs' campaign fixtures now carry artwork; "serves a null artwork as null" became "always with a picture"; the admin spec's "no artwork accepted" and "PATCH clears artwork" cases now use artwork; its key lists gained `needsArtwork`, `needingArtwork`, `artwork` and `explore_slider`; the app's three "no picture" tests became "no card is drawn".
- **Not done on purpose:** `POST /admin/ads/:id/schedule` and `/resume` do not refuse a campaign saved before this task without artwork (the owner's change names POST and PATCH only; such a campaign simply is not served and shows `needsArtwork`). The slider list has no cap on slides (the admin books them; a cap would be a made-up figure). No pictures taken: the task draws no artboard (`artboards: []`) and a card with a picture looks as ADS-01 left it.
- **Next:** the verifier. Then EXPLORE-07 builds the slider on `GET /ads?placement=explore_slider`; ADS-02 (the dashboard form) marks the artwork field required.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-59, R-68, R-15 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

A campaign cannot be saved without artwork (R-59; G-761), and the Hub can serve the Explore slider its adverts (X1, X16, X17), so the slider can take turns between events and adverts.

## Scope

- `POST` and `PATCH /admin/ads` refuse a campaign with no `artworkUrl` (`422`, "Add artwork before you save this campaign"). Campaigns already saved without artwork are not served by `GET /ads` and are listed to the admin for fixing. The dashboard form marks the field required (ADS-02).
- New placement `explore_slider` on `GET /ads` (additive): an ordered list of live campaigns for the slider, same view and count rules as the other placements (ADS-04, ADS-05).
- App side, one change after ADS-01 merges: remove the card variant that draws without a picture in `src/features/ads/` (it can no longer occur). The line "Ads keep TGIF free" stays out (G-760).
- Sample advertisers ("Kora Foods", "Lagos Leather Co.") are board drawings only; seed data and tests use neutral names (R-68).

## Capability checks

- [ ] An admin cannot save a campaign without artwork; with artwork it saves and serves.
- [ ] `GET /ads?placement=explore_slider` returns the live campaigns in order and counts a view once.
- [ ] The Today card and the slider never draw a campaign without a picture.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/ADS-07.md](history/ADS-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
