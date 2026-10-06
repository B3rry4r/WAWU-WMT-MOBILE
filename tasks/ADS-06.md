---
id: ADS-06
title: Admin ad endpoints
owner: DEV2
area: ADS
order: 35
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [ADS-03]
decisions: [R-15]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# ADS-06 · Admin ad endpoints

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Create, schedule, pause and report on campaigns.

## Scope

Admin namespace, admin auth.

## Capability checks

- [ ] An admin can pause a live campaign and it stops showing within a minute.

## Builder report

Backend branch `wmt/ADS-06` (merge of `wmt/ADS-03` into main a94f338, no rebase; main did not move). Mobile: this file, `SHARED-CHANGES.md` rows ADS-06 #1 to #3, `BACKEND_GAPS.md` G-194 to G-196, `docs/LOG.md`. **Files (backend):** `src/admin/ads/` (module, controller, service, state machine `ad-campaign-state.ts`, Unicode text rules `ad-text.ts`, DTOs, view types, a 159-test contract spec and a 105-test unit spec), `src/ads/ads-text-limits.ts` (the one new `PROVISIONAL(ADS-TEXT-LIMITS)`), `prisma/schema.prisma` block and migration `20261006130000_admin_ads_audit` (enum `AdminAdAction`, table `AdminAdAudit`), `src/app.module.ts` (one import, one entry), `contract/openapi.json` (regenerated, +1202 lines, none removed), `README.md`.
- **Routes** (`/api/hub/admin/ads`, admin guards reused, no auth code touched): list (filters status, placement, phase, from, to; sort; offset pages like the other admin lists, ties by id), `report` (counts by status, placement, phase, and how many serving would show now), create, detail (card, event, overlapping bookings, whole history), per-campaign `report`, edit (draft or paused), delete (draft), `schedule`, `pause`, `resume`, `end`. Reads: all four admin roles; writes: superadmin and reviewer.
- **Check "an admin can pause a live campaign and it stops showing within a minute": passed.** ADS-04 reads `status` on every request with no cache, so the pause is in force when the transaction commits, before the response is sent: the spec runs the serving filter before and after (served, then not, in the same instant, `servingNow` false in the pause response). Also run for real in a scratch copy of `wmt/ADS-04` + this module (not committed): admin create, schedule, pause then `GET /ads` answered `data: null` 24 ms after the pause; resume served it again; an event cancelled afterwards made ADS-04 skip it while the admin view shows `event.open: false`.
- **State machine** (409 with `reason {code, status, allowedFrom}`, never a quiet 200 on a repeat): draft to scheduled or live (live if the window has started), pause from scheduled or live, resume from paused, end from any but ended (final). No timer: ADS-04 serves `scheduled` and `live` inside the window, so nothing moves them (U8); `phase` (upcoming, running, over) is derived. Every change locks the row (`FOR UPDATE`), claims it with a conditional `updateMany` and writes the audit row in one transaction. Mutation tested: without the lock and the claim 5 of the parallel tests fail.
- **Validation:** text by Unicode category (no invisible, blank-looking, tag, bidi, stray-mark or control characters; NFC, trimmed; no em or en dash, as the notification composer), caps 60 / 60 / 80 / 24 (G-196), weight from `ads-limits.ts`, destination from the `AdCtaDestination` enum, event must exist, be published, not called off, not over (400 on create or edit, 409 on schedule or resume; if it closes later the campaign is left alone and serving skips it), artwork an `https` link to a public host (no admin upload route, G-195), times UTC ISO with `Z` only, end after start and not past. Overlaps are allowed and listed. Nothing logs a campaign field.
- **Tests:** 264 new (above), on a real seeded database through the real admin guards: every route with no token, a user token, expired, wrong audience, other issuer, other secret, refresh token, `alg none`, bumped version, suspended admin; an admin token on `GET /events` is 401; role matrix; every illegal transition (14); each DTO rule; exact key sets on every response; pagination exactness for several page sizes; filters and boundaries; parallel pause, schedule, edit, delete and mixed pause, resume, end rounds (one outcome and one audit row each, chains consistent); the spec checks all 111 tables have the same row counts afterwards. Alone, first, last, twice in a row, and beside `src/ads` and `src/account-purge` (drift guard untouched, passes).
- **Gates, before (real checkout of origin/main, own `npm ci`) to after:** `tsc` 0 to 0; eslint 3655 errors and 859 warnings (746 files) to the same, identical per file and rule (759 files; the new ones have none); `gates/run.py` 16 fail, 34 warn, 76 accepted, 732 files to 16 fail, **36 warn** (34 + ADS-03's marker + `ADS-TEXT-LIMITS`), 76 accepted, 745 files; `check_baseline.py` exit 0 both; `test:contract` on a seeded `wawu_hub_test`: main 152 suites, 3665 tests, 3644 passed, 18 failed, 3 skipped; branch 155 suites, 3985 tests, 3964 passed, the same 18 failed, 3 skipped (`money/receipts/tests/receipt-units.spec.ts` Node Unicode table and `data-export-request/tests/data-export.contract.spec.ts`, `ADMIN_JWT_SECRET` unset: environment only); `scripts/protected-routes/run.sh --fresh wmt/ADS-06` 244 of 244; mobile `npm run check` exit 0 before and after (43 suites, 754 tests, mobile gates 0 fail 0 warn, 207 tasks), no OpenWalletScreen timeout seen.
- **Defaults (agent), owner may override:** approving a booking is scheduling it; repeats are 409; edits only while draft or paused (pause first); a past start is allowed and means "on air when scheduled"; writes need superadmin or reviewer (finance reads for the invoice); offset pages, not cursors, as every admin list here; artwork `https` only though the database also allows `http`; the audit table stores the advertiser's name in `changes`, which may be a named person who is not a user (ADS-03 U6): erasing it is a manual job.
- **Not done:** views, taps, skips and CTR (ADS-05's tables do not exist; a field nothing writes is not shipped): G-194 names what ADS-05 adds. No upload route (G-195). No cron. Owner questions: G-196 (text caps) and the ones above.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
