---
id: ADS-04
title: Serve a sponsored card
owner: DEV2
area: ADS
order: 31
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [ADS-03]
decisions: [R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-04 · Serve a sponsored card

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Show at most one live sponsored card for today's placement.

## Scope

GET ads for a placement.

## Capability checks

- [ ] `GET ads?placement=tgif_card` and `?placement=today_slot` each return at most one live card, and none outside its dates.
- [ ] With no live campaign, nothing is returned and the screen shows no empty frame.

## Builder report

Backend branch `wmt/ADS-04` (aef0699, on ADS-03's `wmt/ADS-03` @ 0eeaa3c, not yet on main; main a94f338 had not moved, so bringing ADS-03 in was a fast-forward and there is no merge commit): `src/ads/ads.controller.ts`, `ads.service.ts`, `ads.module.ts`, `ads-serving.ts` (the rule, and the one new `PROVISIONAL(ADS-SERVE-RULE)`), `ads-clock.ts`, `ads-view.type.ts`, `dto/ads.dto.ts`, `tests/ads-serve.contract.spec.ts` (52 tests); fenced: `src/app.module.ts` (one import, one entry) and `contract/openapi.json` (regenerated: `GET /api/hub/ads` and `AdCardView` only), row ADS-04 #1 in `SHARED-CHANGES.md`. Mobile: this file, `BACKEND_GAPS.md` G-191 to G-193, `SHARED-CHANGES.md`, `docs/LOG.md`, `docs/PROGRESS.md`. No migration, no schema change, no new number except PROVISIONAL(ADS-SERVE-RULE).
- **What it serves:** `GET /api/hub/ads?placement=tgif_card|today_slot`, signed-in (WAWU ID token), `Cache-Control: no-store`. `data` is one card `{ id (the campaign), advertiser, headline, subline, ctaLabel, ctaDestination, ctaDestinationId, artworkUrl }` or `null`. The rule: placement; status `scheduled` or `live`; `startsAt <= now < endsAt` on the server clock (UTC); has a creative; its event is open (published, not cancelled, not finished by the Events list's own test, host not blocked either way). Highest weight wins; ties go to the earliest start, then earliest creation, then id. A campaign whose event is closed or gone is skipped and the next is tried. The `ads` first segment is new; the route-shadowing spec passes.
- **Check 1 (each placement returns at most one live card, none outside its dates):** HTTP spec with mock WAWU ID tokens, a settable clock: two bookings per placement give one object each from their own placement; the window is probed at start-1ms, start, start+1ms, end-1ms, end, end+1ms for both placements; draft, paused, ended, no-creative never served; scheduled and live served. A block at the end runs the real clock (a campaign running now is served; ended and not-yet-begun are not; one ending 1.5 s ahead stops being served).
- **Check 2 (nothing returned when nothing is live, no empty frame):** the answer is `200 {data: null}`, asserted on an empty table and with only out-of-window, draft, paused, ended and creative-less bookings. The app (ADS-01) draws no card on `null`; that screen is ADS-01's.
- **Also tested:** exact key set of the card (and null subline and artwork stay keys); a leak check that no word of draft, paused, ended, expired or other-placement bookings or of weight, status, window or creative id is in the body; 401 without or with a bad token; 400 for a missing, empty, wrong-case, repeated or extra query; ties in each tier; a heavier ineligible booking does not win; 8 closed-event cases (pending, rejected, removed, cancelled by status, cancelled by date, over, no-end and started) each for fallback and for empty; event deleted or never existing; event ending exactly now (open) and 1 ms later (closed); 40 closed events then one open; block either way for one viewer only; 60 parallel requests from two viewers give one body; serving writes nothing; pause then resume takes effect on the next request (ADS-06's "within a minute" has nothing to wait for here). Mutation check on the service: `gt` to `gte`, `lte` to `lt`, no status filter, no cancelled filter, no block filter, weight ascending, id descending and the event `gte` to `gt` each fail 1 to 7 tests. The spec removes its rows and asserts every table's row count equals its start; passed alone twice, beside event, account-purge and route-shadowing, and in the full suite.
- **Gates before then after (main a94f338 on its own worktree, then this branch; both on a seeded `wawu_hub_test`, one shared `node_modules` because the lockfile is identical, not a second `npm ci` because the disk had 1.8 GB free):** tsc 0 and 0; eslint (no --fix) 4514 problems both; gates 16 fail / 34 warn / 76 accepted before, 16 / 36 / 76 after (+1 is ADS-03's marker, +1 is `PROVISIONAL(ADS-SERVE-RULE)`, `GATES_RELEASE=1` will fail on both until the owner answers); `check_baseline.py` exit 0 both; `test:contract` 152 suites / 3665 tests (3658 passed) before, 154 / 3773 (3766 passed) after, the only failing suite both times `money/receipts/tests/receipt-units.spec.ts` (Node Unicode table, environment only; `data-export.contract.spec.ts` passed because `ADMIN_JWT_SECRET` was set); `scripts/protected-routes/run.sh --fresh` 244/244 both. Mobile `npm run check`: exit 0 after (docs only: 43 suites, 754 tests as ADS-03 recorded on this main, gates 0 fail on 195 files, no OpenWalletScreen timeout).
- **Gaps and shared changes:** G-191 (what weight means: priority or rotation, and the tie-break), G-192 (what "event still open" means, signed-in only), G-193 (subline typed by the team, can drift from the event); SHARED-CHANGES ADS-04 #1. All are owner questions; the simplest default is built and the one switch is `AD_TIE_BREAK` and the query's `orderBy` in `ads-serving.ts`.
- **Not done:** the mobile contract copy and `npm run api` (ADS-01 regenerates once the backend merges; the route is not on main yet). Counting views and taps is ADS-05; creating and pausing campaigns is ADS-06; neither is touched. The V9 live read-back (sign in and see an ad only the server has) needs ADS-06 to create one; this task's spec creates rows directly, so V9 for this route is NOT RUN here.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
